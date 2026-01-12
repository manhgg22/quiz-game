require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Cấu hình game
const CONFIG = {
  TEAM_COUNT: 9,
  INITIAL_SCORE: 15,
  CORRECT_POINTS: 2,
  WRONG_POINTS: -2,
  DOMINO_PENALTY: -1,
  CRISIS_THRESHOLD: 5,
  CRISIS_PENALTY: -2,
  MIN_SCORE: 0
};

// Load team members whitelist
let teamMembers = { teams: [] };
try {
  const data = fs.readFileSync(path.join(__dirname, 'teamMembers.json'), 'utf8');
  teamMembers = JSON.parse(data);
  console.log(`✅ Đã load ${teamMembers.teams.length} nhóm với ${teamMembers.teams.reduce((sum, t) => sum + t.members.length, 0)} members`);
} catch (error) {
  console.log('⚠️ Không load được teamMembers.json:', error.message);
}

// Helper: Find team by email
function findTeamByEmail(email) {
  const normalizedEmail = email.toLowerCase();
  for (const team of teamMembers.teams) {
    // Chuẩn hóa tất cả email trong members về lowercase để so sánh
    const normalizedMembers = team.members.map(m => m.toLowerCase());
    if (normalizedMembers.includes(normalizedEmail)) {
      return team;
    }
  }
  return null;
}


// Khởi tạo trạng thái game
let gameState = {
  teams: [],
  currentQuestion: null,
  currentRound: 0,
  isLocked: false,
  history: [],
  sampleQuestions: [],
  timer: {
    active: false,
    startTime: null,
    duration: 30, // 30 giây
    remaining: 30,
    interval: null
  }
};

// Khởi tạo teams từ teamMembers.json
function initializeTeams() {
  gameState.teams = [];
  // Use actual team IDs from teamMembers.json
  const validTeamIds = teamMembers.teams.map(t => t.id);
  validTeamIds.forEach(teamId => {
    gameState.teams.push({
      id: teamId,
      name: `Nhóm ${teamId}`,
      score: CONFIG.INITIAL_SCORE,
      answer: null,
      specialCards: {
        immunity: true,
        redirect: true,
        allIn: true
      },
      activeCards: {
        immunity: false,
        redirect: false,
        redirectTarget: null,
        allIn: false
      },
      // Authentication fields
      controller: null,        // Socket ID của người điều khiển
      controllerEmail: null,   // Email của controller
      viewers: []              // Array of {socketId, email}
    });
  });
}

// Load câu hỏi mẫu
function loadSampleQuestions() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'sampleQuestions.json'), 'utf8');
    gameState.sampleQuestions = JSON.parse(data);
    console.log(`✅ Đã load ${gameState.sampleQuestions.length} câu hỏi mẫu`);
  } catch (error) {
    console.log('⚠️ Không load được câu hỏi mẫu:', error.message);
    gameState.sampleQuestions = [];
  }
}

// Helper: Sanitize gameState for Socket.IO emission (remove circular references)
function getSanitizedGameState() {
  return {
    ...gameState,
    teams: gameState.teams.map(team => ({
      ...team,
      controller: null,  // Remove socket reference
      viewers: []        // Remove socket references
    })),
    timer: {
      ...gameState.timer,
      interval: null  // Remove setInterval reference
    }
  };
}

// Tính toán điểm và hiệu ứng domino
function calculateScores() {
  const results = {
    teams: [],
    dominoChains: [],
    isCrisis: false,
    crisisApplied: false
  };

  // Bước 1: Xác định đúng/sai
  let wrongTeams = [];
  gameState.teams.forEach(team => {
    const isCorrect = team.answer === gameState.currentQuestion.correctAnswer;
    const isAllIn = team.activeCards.allIn;

    let scoreChange = 0;
    if (isCorrect) {
      scoreChange = isAllIn ? CONFIG.CORRECT_POINTS * 2 : CONFIG.CORRECT_POINTS;
    } else {
      scoreChange = isAllIn ? CONFIG.WRONG_POINTS * 2 : CONFIG.WRONG_POINTS;
      wrongTeams.push(team.id);
    }

    results.teams.push({
      id: team.id,
      name: team.name,
      answer: team.answer,
      isCorrect,
      scoreChange,
      scoreBefore: team.score,
      scoreAfter: team.score,
      usedCards: { ...team.activeCards }
    });
  });

  // Bước 2: Tính domino chain
  wrongTeams.forEach(wrongTeamId => {
    const nextTeamId = (wrongTeamId % CONFIG.TEAM_COUNT) + 1;
    const nextTeam = gameState.teams.find(t => t.id === nextTeamId);

    // Kiểm tra immunity
    if (!nextTeam.activeCards.immunity) {
      let targetId = nextTeamId;

      // Kiểm tra redirect
      if (nextTeam.activeCards.redirect && nextTeam.activeCards.redirectTarget) {
        targetId = nextTeam.activeCards.redirectTarget;
      }

      results.dominoChains.push({
        from: wrongTeamId,
        to: targetId,
        penalty: CONFIG.DOMINO_PENALTY
      });

      const targetResult = results.teams.find(t => t.id === targetId);
      if (targetResult) {
        targetResult.scoreChange += CONFIG.DOMINO_PENALTY;
      }
    }
  });

  // Bước 3: Kiểm tra crisis
  if (wrongTeams.length >= CONFIG.CRISIS_THRESHOLD) {
    results.isCrisis = true;
    results.crisisApplied = true;
    results.teams.forEach(team => {
      team.scoreChange += CONFIG.CRISIS_PENALTY;
    });
  }

  // Bước 4: Áp dụng điểm và đảm bảo không âm
  results.teams.forEach(teamResult => {
    const team = gameState.teams.find(t => t.id === teamResult.id);
    team.score = Math.max(CONFIG.MIN_SCORE, team.score + teamResult.scoreChange);
    teamResult.scoreAfter = team.score;

    // Reset active cards
    team.activeCards = {
      immunity: false,
      redirect: false,
      redirectTarget: null,
      allIn: false
    };
  });

  return results;
}

// API: Admin Login with Username/Password
app.post('/api/auth/admin', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Simple admin credentials (you should use environment variables in production)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Generate JWT token for admin
      const authToken = jwt.sign(
        { email: 'admin@system', isAdmin: true, name: 'Admin' },
        process.env.SESSION_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token: authToken,
        isAdmin: true,
        email: 'admin@system',
        name: 'Admin'
      });

      console.log(`✅ Admin login thành công: ${username}`);
    } else {
      res.status(401).json({
        success: false,
        error: 'Username hoặc password không đúng'
      });
    }
  } catch (error) {
    console.error('❌ Lỗi admin login:', error.message);
    res.status(500).json({
      success: false,
      error: 'Lỗi server'
    });
  }
});


// API: Google OAuth Login
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase();

    // Check if email is admin
    const isAdmin = teamMembers.admins && teamMembers.admins.map(a => a.toLowerCase()).includes(email);

    if (isAdmin) {
      // Admin login
      const authToken = jwt.sign(
        { email, isAdmin: true, name: payload.name },
        process.env.SESSION_SECRET || 'default-secret',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token: authToken,
        isAdmin: true,
        email,
        name: payload.name
      });

      console.log(`✅ Admin login thành công: ${email}`);
      return;
    }

    // Check if email is in team whitelist
    const team = findTeamByEmail(email);
    if (!team) {
      return res.status(403).json({
        success: false,
        error: 'Email không có quyền truy cập. Vui lòng liên hệ BTC.'
      });
    }

    // Generate JWT token for team member
    const authToken = jwt.sign(
      { email, teamId: team.id, name: payload.name },
      process.env.SESSION_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token: authToken,
      teamId: team.id,
      teamName: team.name,
      email,
      name: payload.name,
      isAdmin: false
    });

    console.log(`✅ Login thành công: ${email} → ${team.name}`);
  } catch (error) {
    console.error('❌ Lỗi xác thực Google:', error.message);
    res.status(401).json({
      success: false,
      error: 'Xác thực Google thất bại'
    });
  }
});

// API: Demo Login (for testing without real Gmail)
app.post('/api/auth/demo', async (req, res) => {
  // Only allow demo login in TEST_MODE
  if (process.env.TEST_MODE !== 'true') {
    return res.status(403).json({
      success: false,
      error: 'Demo login is disabled in production mode'
    });
  }

  try {
    const { teamId, memberIndex = 1 } = req.body;

    // Validate teamId
    if (!teamId || teamId < 1 || teamId > 10) {
      return res.status(400).json({
        success: false,
        error: 'Team ID không hợp lệ (phải từ 1-10)'
      });
    }

    // Find team in teamMembers
    const team = teamMembers.teams.find(t => t.id === teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy nhóm ${teamId}`
      });
    }

    // Get member email (use memberIndex to get different members)
    const memberIdx = Math.min(memberIndex - 1, team.members.length - 1);
    const email = team.members[memberIdx];

    if (!email) {
      return res.status(404).json({
        success: false,
        error: `Không tìm thấy member ${memberIndex} trong ${team.name}`
      });
    }

    // Create mock name from email
    const name = `Demo User ${memberIndex} (${team.name})`;

    // Generate JWT token
    const authToken = jwt.sign(
      { email, teamId: team.id, name },
      process.env.SESSION_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token: authToken,
      teamId: team.id,
      teamName: team.name,
      email,
      name,
      isAdmin: false
    });

    console.log(`🎮 Demo login: ${name} (${email}) → ${team.name}`);
  } catch (error) {
    console.error('❌ Lỗi demo login:', error.message);
    res.status(500).json({
      success: false,
      error: 'Demo login thất bại'
    });
  }
});


// Middleware: Verify JWT token for Socket.IO
function verifySocketToken(socket, next) {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'default-secret');
    socket.userData = decoded;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
}

// Socket.IO with authentication
io.use(verifySocketToken);

io.on('connection', (socket) => {
  const { email, teamId, name, isAdmin } = socket.userData;

  // Handle admin connection
  if (isAdmin) {
    console.log(`👨‍💼 Admin ${name} (${email}) đã kết nối`);
    socket.emit('gameState', getSanitizedGameState());

    // Admin join (for BTC)
    socket.on('joinAdmin', () => {
      socket.join('admin');
      console.log('👨‍💼 Admin đã join');
      socket.emit('gameState', getSanitizedGameState());
    });

    // Continue with admin event handlers below...
  } else {
    // Handle team member connection
    console.log(`🔌 ${name} (${email}) kết nối - Nhóm ${teamId}`);

    const team = gameState.teams.find(t => t.id === teamId);
    if (!team) {
      socket.emit('error', 'Nhóm không tồn tại');
      socket.disconnect();
      return;
    }

    // Determine role: controller or viewer
    let role = 'viewer';
    if (team.controller === null) {
      // First person to join becomes controller
      team.controller = socket.id;
      team.controllerEmail = email;
      role = 'controller';
      console.log(`👑 ${email} là controller của ${team.name}`);
    } else {
      // Others are viewers
      team.viewers.push({ socketId: socket.id, email });
      console.log(`👁️ ${email} là viewer của ${team.name}`);
    }

    // Send initial state with role
    socket.emit('authSuccess', {
      role,
      teamId,
      email,
      controllerEmail: team.controllerEmail
    });
    socket.emit('gameState', getSanitizedGameState());

    // Join team room
    socket.join(`team-${teamId}`);

    // Broadcast controller status to team
    io.to(`team-${teamId}`).emit('controllerStatus', {
      controllerEmail: team.controllerEmail,
      viewerCount: team.viewers.length
    });

    // Team member specific handlers
    // Nhóm gửi câu trả lời (chỉ controller)
    socket.on('submitAnswer', ({ teamId, answer }) => {
      if (role !== 'controller') {
        socket.emit('error', 'Chỉ controller mới có thể trả lời');
        return;
      }

      if (gameState.isLocked) {
        socket.emit('error', 'Lượt đã bị khóa, không thể thay đổi câu trả lời');
        return;
      }

      const team = gameState.teams.find(t => t.id === teamId);
      if (team) {
        team.answer = answer;
        io.emit('gameState', getSanitizedGameState());
        console.log(`✍️ ${team.name} trả lời: ${answer}`);
      }
    });

    // Nhóm kích hoạt thẻ đặc biệt (chỉ controller)
    socket.on('activateCard', ({ teamId, cardType, redirectTarget }) => {
      if (role !== 'controller') {
        socket.emit('error', 'Chỉ controller mới có thể kích hoạt thẻ');
        return;
      }

      if (gameState.isLocked) {
        socket.emit('error', 'Lượt đã bị khóa, không thể kích hoạt thẻ');
        return;
      }

      const team = gameState.teams.find(t => t.id === teamId);
      if (!team) return;

      if (!team.specialCards[cardType]) {
        socket.emit('error', `Thẻ ${cardType} đã được sử dụng rồi`);
        return;
      }

      // Đánh dấu thẻ đã dùng
      team.specialCards[cardType] = false;

      // Kích hoạt thẻ cho lượt này
      team.activeCards[cardType] = true;
      if (cardType === 'redirect' && redirectTarget) {
        team.activeCards.redirectTarget = redirectTarget;
      }

      io.emit('gameState', getSanitizedGameState());
      console.log(`🎴 ${team.name} kích hoạt thẻ: ${cardType}`);
    });

    // Handle disconnect for team members
    socket.on('disconnect', () => {
      console.log(`🔌 ${email} ngắt kết nối`);

      const team = gameState.teams.find(t => t.id === teamId);
      if (!team) return;

      // If controller disconnects, promote first viewer
      if (team.controller === socket.id) {
        team.controller = null;
        team.controllerEmail = null;

        if (team.viewers.length > 0) {
          const newController = team.viewers.shift();
          team.controller = newController.socketId;
          team.controllerEmail = newController.email;

          // Notify the promoted viewer
          io.to(newController.socketId).emit('promoted', {
            message: 'Bạn đã được thăng cấp lên Controller!'
          });

          console.log(`👑 ${newController.email} được promote lên controller`);
        }

        // Broadcast new controller status
        io.to(`team-${teamId}`).emit('controllerStatus', {
          controllerEmail: team.controllerEmail,
          viewerCount: team.viewers.length
        });
      } else {
        // Remove from viewers
        team.viewers = team.viewers.filter(v => v.socketId !== socket.id);

        io.to(`team-${teamId}`).emit('controllerStatus', {
          controllerEmail: team.controllerEmail,
          viewerCount: team.viewers.length
        });
      }
    });
  }

  // Admin join (for BTC) - moved outside to be accessible for both
  socket.on('joinAdmin', () => {
    socket.join('admin');
    console.log('👨‍💼 Admin đã join');
    socket.emit('gameState', getSanitizedGameState());
  });

  // Admin tạo câu hỏi
  socket.on('createQuestion', (questionData) => {
    // Clear existing timer if any
    if (gameState.timer.interval) {
      clearInterval(gameState.timer.interval);
    }

    gameState.currentQuestion = questionData;
    gameState.currentRound++;
    gameState.isLocked = false;

    // Reset câu trả lời của tất cả nhóm
    gameState.teams.forEach(team => {
      team.answer = null;
    });

    // Start 30-second timer
    gameState.timer.active = true;
    gameState.timer.startTime = Date.now();
    gameState.timer.remaining = gameState.timer.duration;

    io.emit('newQuestion', gameState.currentQuestion);
    io.emit('gameState', getSanitizedGameState());
    console.log(`❓ Câu hỏi mới (Round ${gameState.currentRound}):`, questionData.question);
    console.log(`⏱️  Timer bắt đầu: ${gameState.timer.duration} giây`);

    // Timer countdown
    gameState.timer.interval = setInterval(() => {
      gameState.timer.remaining--;

      // Broadcast timer update (only timer data, not full gameState)
      io.emit('timerUpdate', {
        remaining: gameState.timer.remaining,
        duration: gameState.timer.duration
      });

      console.log(`⏱️  Timer: ${gameState.timer.remaining}s`);

      // Auto-lock when timer expires
      if (gameState.timer.remaining <= 0) {
        clearInterval(gameState.timer.interval);
        gameState.timer.active = false;
        gameState.isLocked = true;

        io.emit('roundLocked', true);
        io.emit('timerExpired');

        console.log('⏱️  Timer hết giờ - Tự động khóa lượt!');
      }
    }, 1000);
  });

  // Admin khóa lượt
  socket.on('lockRound', () => {
    gameState.isLocked = true;
    io.emit('roundLocked', true);
    io.emit('gameState', getSanitizedGameState());
    console.log('🔒 Lượt đã bị khóa');
  });

  // Admin tính điểm
  socket.on('calculateScores', () => {
    if (!gameState.currentQuestion) {
      socket.emit('error', 'Chưa có câu hỏi nào');
      return;
    }

    const results = calculateScores();

    // Lưu vào lịch sử
    gameState.history.push({
      round: gameState.currentRound,
      question: gameState.currentQuestion,
      results: results,
      timestamp: new Date().toISOString()
    });

    io.emit('roundResults', results);
    io.emit('gameState', getSanitizedGameState());
    console.log('📊 Đã tính điểm:', results);
  });

  // Admin reset game
  socket.on('resetGame', () => {
    initializeTeams();
    gameState.currentQuestion = null;
    gameState.currentRound = 0;
    gameState.isLocked = false;
    gameState.history = [];

    io.emit('gameReset');
    io.emit('gameState', getSanitizedGameState());
    console.log('🔄 Game đã được reset');
  });

  // Load câu hỏi mẫu
  socket.on('getSampleQuestions', () => {
    socket.emit('sampleQuestions', gameState.sampleQuestions);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 ${email} ngắt kết nối`);

    const team = gameState.teams.find(t => t.id === teamId);
    if (!team) return;

    // If controller disconnects, promote first viewer
    if (team.controller === socket.id) {
      team.controller = null;
      team.controllerEmail = null;

      if (team.viewers.length > 0) {
        const newController = team.viewers.shift();
        team.controller = newController.socketId;
        team.controllerEmail = newController.email;

        // Notify the promoted viewer
        io.to(newController.socketId).emit('promoted', {
          message: 'Bạn đã được thăng cấp lên Controller!'
        });

        console.log(`👑 ${newController.email} được promote lên controller`);
      }

      // Broadcast new controller status
      io.to(`team-${teamId}`).emit('controllerStatus', {
        controllerEmail: team.controllerEmail,
        viewerCount: team.viewers.length
      });
    } else {
      // Remove from viewers
      team.viewers = team.viewers.filter(v => v.socketId !== socket.id);

      io.to(`team-${teamId}`).emit('controllerStatus', {
        controllerEmail: team.controllerEmail,
        viewerCount: team.viewers.length
      });
    }
  });
});

// API endpoint để kiểm tra server
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server đang chạy',
    teams: gameState.teams.length,
    round: gameState.currentRound,
    authenticated: true
  });
});

// Khởi động server
const PORT = process.env.PORT || 3001;

initializeTeams();
loadSampleQuestions();

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🎮 GAME HIỆU ỨNG DOMINO LỊCH SỬ (With Auth)');
  console.log('='.repeat(50));
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📡 WebSocket đã sẵn sàng`);
  console.log(`👥 Số nhóm: ${CONFIG.TEAM_COUNT}`);
  console.log(`📝 Câu hỏi mẫu: ${gameState.sampleQuestions.length}`);
  console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Enabled' : 'Disabled'}`);
  console.log('='.repeat(50));
});

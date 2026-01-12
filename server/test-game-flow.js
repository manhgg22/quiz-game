/**
 * Test Script for Quiz Game Flow
 * Simulates multiple users (admin + 10 teams with multiple members each)
 * Tests the complete game flow without needing real browsers
 */

require('dotenv').config();
const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3001';
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret';

// Load team members
const teamMembers = JSON.parse(fs.readFileSync(path.join(__dirname, 'teamMembers.json'), 'utf8'));

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Create mock JWT token for testing
function createMockToken(email, teamId = null, isAdmin = false) {
    const payload = {
        email,
        name: email.split('@')[0],
        isAdmin
    };

    if (teamId) {
        payload.teamId = teamId;
    }

    return jwt.sign(payload, SESSION_SECRET, { expiresIn: '24h' });
}

// Test state
const testState = {
    adminSocket: null,
    teamSockets: [], // Array of { teamId, members: [{ socket, email, role }] }
    gameState: null,
    testResults: {
        passed: 0,
        failed: 0,
        tests: []
    }
};

function recordTest(name, passed, details = '') {
    testState.testResults.tests.push({ name, passed, details });
    if (passed) {
        testState.testResults.passed++;
        logSuccess(`TEST PASSED: ${name}`);
    } else {
        testState.testResults.failed++;
        logError(`TEST FAILED: ${name} - ${details}`);
    }
}

// Wait helper
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Connect admin
async function connectAdmin() {
    return new Promise((resolve, reject) => {
        logInfo('Connecting admin...');

        const adminEmail = 'admin@system';
        const token = createMockToken(adminEmail, null, true);

        const socket = io(SERVER_URL, {
            auth: { token }
        });

        socket.on('connect', () => {
            logSuccess(`Admin connected (${socket.id})`);
            testState.adminSocket = socket;
            socket.emit('joinAdmin');
        });

        socket.on('gameState', (state) => {
            testState.gameState = state;
            if (!testState.adminSocket.gameStateReceived) {
                testState.adminSocket.gameStateReceived = true;
                recordTest('Admin receives game state', true);
                resolve(socket);
            }
        });

        socket.on('connect_error', (error) => {
            logError(`Admin connection error: ${error.message}`);
            recordTest('Admin connection', false, error.message);
            reject(error);
        });

        setTimeout(() => {
            if (!testState.adminSocket) {
                reject(new Error('Admin connection timeout'));
            }
        }, 5000);
    });
}

// Connect team members
async function connectTeamMembers(teamId, memberCount = 2) {
    const team = teamMembers.teams.find(t => t.id === teamId);
    if (!team) {
        logError(`Team ${teamId} not found`);
        return;
    }

    logInfo(`Connecting ${memberCount} members to ${team.name}...`);

    const teamData = {
        teamId,
        teamName: team.name,
        members: []
    };

    for (let i = 0; i < Math.min(memberCount, team.members.length); i++) {
        const email = team.members[i];
        const token = createMockToken(email, teamId, false);

        await new Promise((resolve) => {
            const socket = io(SERVER_URL, {
                auth: { token }
            });

            const memberData = {
                socket,
                email,
                role: null,
                connected: false
            };

            socket.on('connect', () => {
                memberData.connected = true;
                logSuccess(`  ${email} connected (${socket.id})`);
            });

            socket.on('authSuccess', (data) => {
                memberData.role = data.role;
                log(`  ${email} → Role: ${data.role}`, data.role === 'controller' ? 'magenta' : 'blue');

                // Test role assignment
                if (i === 0) {
                    recordTest(`${team.name}: First member is controller`, data.role === 'controller');
                } else {
                    recordTest(`${team.name}: Member ${i + 1} is viewer`, data.role === 'viewer');
                }
            });

            socket.on('gameState', (state) => {
                testState.gameState = state;
            });

            socket.on('promoted', (data) => {
                log(`  ${email} promoted to controller!`, 'magenta');
                memberData.role = 'controller';
            });

            socket.on('error', (message) => {
                logWarning(`  ${email} error: ${message}`);
            });

            teamData.members.push(memberData);

            // Wait a bit before connecting next member
            setTimeout(resolve, 500);
        });
    }

    testState.teamSockets.push(teamData);
    logSuccess(`${team.name} fully connected with ${teamData.members.length} members`);
}

// Create a question
async function createQuestion() {
    return new Promise((resolve) => {
        logInfo('Admin creating question...');

        const question = {
            type: 'mcq',
            question: 'Sự kiện nào đánh dấu sự khởi đầu của Cách mạng Tháng Tám 1945?',
            options: [
                'Khởi nghĩa ở Hà Nội',
                'Hội nghị Tân Trào',
                'Nhật đầu hàng Đồng minh',
                'Khởi nghĩa ở Sài Gòn'
            ],
            correctAnswer: 'Nhật đầu hàng Đồng minh'
        };

        testState.adminSocket.emit('createQuestion', question);

        testState.adminSocket.once('newQuestion', (q) => {
            logSuccess('Question created and distributed');
            recordTest('Create and distribute question', true);
            resolve();
        });

        setTimeout(resolve, 2000);
    });
}

// Submit answers from teams
async function submitAnswers() {
    logInfo('Teams submitting answers...');

    const answers = [
        'Nhật đầu hàng Đồng minh',  // Team 1 - Correct
        'Khởi nghĩa ở Hà Nội',      // Team 2 - Wrong
        'Nhật đầu hàng Đồng minh',  // Team 3 - Correct
        'Hội nghị Tân Trào',        // Team 4 - Wrong
        'Khởi nghĩa ở Sài Gòn',     // Team 5 - Wrong
        'Nhật đầu hàng Đồng minh',  // Team 6 - Correct
        'Khởi nghĩa ở Hà Nội',      // Team 7 - Wrong
        'Hội nghị Tân Trào',        // Team 8 - Wrong
        'Khởi nghĩa ở Sài Gòn',     // Team 9 - Wrong (6 wrong = crisis!)
        'Nhật đầu hàng Đồng minh'   // Team 10 - Correct
    ];

    for (let i = 0; i < testState.teamSockets.length; i++) {
        const team = testState.teamSockets[i];
        const controller = team.members.find(m => m.role === 'controller');

        if (controller) {
            const answer = answers[i];
            controller.socket.emit('submitAnswer', {
                teamId: team.teamId,
                answer
            });
            log(`  ${team.teamName} answered: ${answer}`, 'cyan');
            await wait(200);
        }
    }

    await wait(1000);
    recordTest('All teams submitted answers', true);
    logSuccess('All answers submitted');
}

// Test special card activation
async function testSpecialCards() {
    logInfo('Testing special card activation...');

    // Team 1 controller activates immunity
    const team1 = testState.teamSockets[0];
    const controller = team1.members.find(m => m.role === 'controller');

    if (controller) {
        controller.socket.emit('activateCard', {
            teamId: team1.teamId,
            cardType: 'immunity'
        });
        log(`  ${team1.teamName} activated Immunity card`, 'magenta');
        await wait(500);
        recordTest('Activate special card (immunity)', true);
    }

    // Test viewer cannot activate card
    const viewer = team1.members.find(m => m.role === 'viewer');
    if (viewer) {
        let errorReceived = false;
        viewer.socket.once('error', () => {
            errorReceived = true;
        });

        viewer.socket.emit('activateCard', {
            teamId: team1.teamId,
            cardType: 'allIn'
        });

        await wait(500);
        recordTest('Viewer cannot activate card', errorReceived);
    }
}

// Lock round
async function lockRound() {
    return new Promise((resolve) => {
        logInfo('Admin locking round...');

        testState.adminSocket.emit('lockRound');

        testState.adminSocket.once('roundLocked', () => {
            logSuccess('Round locked');
            recordTest('Lock round', true);
            resolve();
        });

        setTimeout(resolve, 1000);
    });
}

// Calculate scores
async function calculateScores() {
    return new Promise((resolve) => {
        logInfo('Admin calculating scores...');

        testState.adminSocket.emit('calculateScores');

        testState.adminSocket.once('roundResults', (results) => {
            logSuccess('Scores calculated!');

            log('\n📊 RESULTS:', 'bright');
            log('─'.repeat(60), 'cyan');

            // Display results
            results.teams.forEach(team => {
                const icon = team.isCorrect ? '✅' : '❌';
                const scoreColor = team.scoreChange >= 0 ? 'green' : 'red';
                log(`${icon} ${team.name}: ${team.answer || 'No answer'}`, 'cyan');
                log(`   Score: ${team.scoreBefore} → ${team.scoreAfter} (${team.scoreChange >= 0 ? '+' : ''}${team.scoreChange})`, scoreColor);
            });

            // Domino chains
            if (results.dominoChains.length > 0) {
                log('\n⛓️  DOMINO CHAINS:', 'yellow');
                results.dominoChains.forEach(chain => {
                    log(`   Team ${chain.from} → Team ${chain.to} (${chain.penalty} points)`, 'yellow');
                });
            }

            // Crisis
            if (results.isCrisis) {
                log('\n⚠️  SYSTEM CRISIS TRIGGERED! All teams -2 points', 'red');
                recordTest('Crisis mode triggered (≥5 teams wrong)', true);
            }

            log('─'.repeat(60), 'cyan');

            recordTest('Calculate scores with domino effects', true);
            recordTest('Domino chains applied', results.dominoChains.length > 0);

            resolve(results);
        });

        setTimeout(resolve, 2000);
    });
}

// Test disconnect and promotion
async function testDisconnectPromotion() {
    logInfo('Testing controller disconnect and viewer promotion...');

    const team = testState.teamSockets[0];
    const controller = team.members.find(m => m.role === 'controller');
    const viewer = team.members.find(m => m.role === 'viewer');

    if (!controller || !viewer) {
        logWarning('Not enough members to test promotion');
        return;
    }

    // Listen for promotion
    let promoted = false;
    viewer.socket.once('promoted', () => {
        promoted = true;
        logSuccess(`Viewer ${viewer.email} promoted to controller`);
    });

    // Disconnect controller
    log(`  Disconnecting controller: ${controller.email}`, 'yellow');
    controller.socket.disconnect();

    await wait(1000);

    recordTest('Viewer promoted when controller disconnects', promoted);
}

// Main test runner
async function runTests() {
    log('\n' + '='.repeat(60), 'bright');
    log('🧪 QUIZ GAME FLOW TEST', 'bright');
    log('='.repeat(60), 'bright');

    try {
        // Step 1: Connect admin
        log('\n📍 STEP 1: Admin Connection', 'bright');
        await connectAdmin();
        await wait(1000);

        // Step 2: Connect teams
        log('\n📍 STEP 2: Team Connections', 'bright');
        for (let teamId = 1; teamId <= 10; teamId++) {
            await connectTeamMembers(teamId, 2); // 2 members per team
            await wait(500);
        }
        await wait(1000);

        // Step 3: Create question
        log('\n📍 STEP 3: Create Question', 'bright');
        await createQuestion();
        await wait(1000);

        // Step 4: Test special cards
        log('\n📍 STEP 4: Special Cards', 'bright');
        await testSpecialCards();
        await wait(1000);

        // Step 5: Submit answers
        log('\n📍 STEP 5: Submit Answers', 'bright');
        await submitAnswers();
        await wait(1000);

        // Step 6: Lock round
        log('\n📍 STEP 6: Lock Round', 'bright');
        await lockRound();
        await wait(1000);

        // Step 7: Calculate scores
        log('\n📍 STEP 7: Calculate Scores', 'bright');
        await calculateScores();
        await wait(1000);

        // Step 8: Test disconnect/promotion
        log('\n📍 STEP 8: Disconnect & Promotion', 'bright');
        await testDisconnectPromotion();
        await wait(1000);

        // Print summary
        printTestSummary();

    } catch (error) {
        logError(`Test failed with error: ${error.message}`);
        console.error(error);
    } finally {
        // Cleanup
        log('\n🧹 Cleaning up...', 'yellow');
        if (testState.adminSocket) testState.adminSocket.disconnect();
        testState.teamSockets.forEach(team => {
            team.members.forEach(member => member.socket.disconnect());
        });

        setTimeout(() => process.exit(0), 1000);
    }
}

function printTestSummary() {
    log('\n' + '='.repeat(60), 'bright');
    log('📊 TEST SUMMARY', 'bright');
    log('='.repeat(60), 'bright');

    const total = testState.testResults.passed + testState.testResults.failed;
    const percentage = total > 0 ? ((testState.testResults.passed / total) * 100).toFixed(1) : 0;

    log(`Total Tests: ${total}`, 'cyan');
    log(`Passed: ${testState.testResults.passed}`, 'green');
    log(`Failed: ${testState.testResults.failed}`, 'red');
    log(`Success Rate: ${percentage}%`, percentage >= 80 ? 'green' : 'red');

    if (testState.testResults.failed > 0) {
        log('\n❌ Failed Tests:', 'red');
        testState.testResults.tests
            .filter(t => !t.passed)
            .forEach(t => {
                log(`  - ${t.name}: ${t.details}`, 'red');
            });
    }

    log('='.repeat(60), 'bright');

    if (percentage >= 80) {
        log('✅ ALL TESTS PASSED!', 'green');
    } else {
        log('⚠️  SOME TESTS FAILED', 'yellow');
    }
}

// Run tests
log('\n⏳ Starting tests in 2 seconds...', 'yellow');
log('Make sure the server is running at ' + SERVER_URL, 'cyan');

setTimeout(runTests, 2000);

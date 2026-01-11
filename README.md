# 🎮 Game Hiệu Ứng Domino Lịch Sử

Trò chơi học lịch sử đa người chơi real-time với hiệu ứng dây chuyền domino và cơ chế khủng hoảng.

## 📋 Tổng Quan

Game được thiết kế cho lớp học 60 sinh viên (10 nhóm), mỗi nhóm sử dụng 1 laptop để tham gia. BTC/MC điều khiển game qua trang Admin và chiếu bảng điểm lên màn hình.

### Đặc Điểm Nổi Bật

- ✅ **Real-time**: Cập nhật tức thời qua WebSocket
- 🎯 **Domino Chain**: Hiệu ứng dây chuyền khi trả lời sai
- ⚠️ **System Crisis**: Khủng hoảng khi ≥5 nhóm sai
- 🎴 **Special Cards**: 3 loại thẻ đặc biệt (Miễn Nhiễm, Chuyển Hướng, Tất Tay)
- 📊 **Live Scoreboard**: Bảng xếp hạng trực tiếp
- 📝 **Game History**: Lưu lịch sử từng lượt chơi

## 🎯 Luật Chơi

### Tính Điểm Cơ Bản
- **Điểm khởi đầu**: 15 điểm/nhóm
- **Trả lời đúng**: +2 điểm
- **Trả lời sai**: -2 điểm
- **Điểm tối thiểu**: 0 (không âm)

### Hiệu Ứng Domino
- Mỗi nhóm trả lời **SAI** sẽ kéo theo nhóm tiếp theo bị **-1 điểm**
- Chuỗi domino theo vòng tròn: Nhóm 1 → 2 → 3 → ... → 10 → 1

### Khủng Hoảng Hệ Thống
- Kích hoạt khi **≥5 nhóm trả lời sai** trong cùng 1 lượt
- **Tất cả nhóm** bị **-2 điểm** (cộng dồn với các phạt khác)

### Thẻ Đặc Biệt (Mỗi loại 1 lần/game)

#### 🛡️ Miễn Nhiễm (Immunity)
- Chặn hiệu ứng domino từ nhóm khác
- **KHÔNG** chặn -2 điểm do chính nhóm trả lời sai
- **KHÔNG** chặn khủng hoảng hệ thống

#### 🔄 Chuyển Hướng (Redirect)
- Chỉ có hiệu lực khi nhóm bị domino
- Chuyển toàn bộ domino sang 1 nhóm khác (do người chơi chọn)

#### 🎲 Tất Tay (All-In)
- Nhân đôi điểm: Đúng **+4**, Sai **-4**
- Không ảnh hưởng domino/crisis

## 🚀 Cài Đặt và Chạy

### Yêu Cầu Hệ Thống
- Node.js 16+ và npm
- Trình duyệt hiện đại (Chrome, Firefox, Edge)
- Mạng LAN/WiFi để kết nối các thiết bị

### 1. Cài Đặt Backend

```bash
cd server
npm install
```

### 2. Cài Đặt Frontend

```bash
cd client
npm install
```

### 3. Chạy Local (Development)

**Terminal 1 - Backend:**
```bash
cd server
npm start
```
Server sẽ chạy tại `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Client sẽ chạy tại `http://localhost:5173`

### 4. Truy Cập Game

- **Trang chủ**: http://localhost:5173
- **Người chơi**: http://localhost:5173/team/1 (thay số 1-10)
- **Admin**: http://localhost:5173/admin

## 🌐 Deploy Lên Server

### Option 1: Deploy Trên Cùng Server

#### Build Frontend
```bash
cd client
npm run build
```

#### Cấu Hình Server
Sửa file `server/server.js`, thêm sau dòng `app.use(express.json());`:

```javascript
// Serve static files từ React build
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

#### Chạy Server
```bash
cd server
npm start
```

Truy cập: `http://<IP-SERVER>:3001`

### Option 2: Deploy Riêng Biệt

#### Backend (VPS/Cloud)
```bash
cd server
npm install
PORT=3001 npm start
```

#### Frontend (Netlify/Vercel)
1. Tạo file `client/.env.production`:
```
VITE_SOCKET_URL=http://<IP-BACKEND>:3001
```

2. Build và deploy:
```bash
cd client
npm run build
# Upload thư mục dist/ lên Netlify/Vercel
```

### Sử Dụng PM2 (Production)
```bash
# Cài PM2
npm install -g pm2

# Chạy server
cd server
pm2 start server.js --name domino-game

# Xem logs
pm2 logs domino-game

# Khởi động cùng hệ thống
pm2 startup
pm2 save
```

## 📱 Hướng Dẫn Sử Dụng

### Cho BTC/Admin

1. Mở trang Admin: `http://<IP-SERVER>:3001/admin`
2. Tạo câu hỏi:
   - Chọn loại (Trắc nghiệm / Đúng-Sai)
   - Nhập câu hỏi và các lựa chọn
   - Chọn đáp án đúng
   - Bấm "Tạo Câu Hỏi Mới"
3. Theo dõi trạng thái trả lời của các nhóm
4. Khi đủ nhóm trả lời, bấm "Khóa Lượt"
5. Bấm "Tính Điểm" để xem kết quả
6. Bấm "Câu Hỏi Tiếp Theo" để tiếp tục

### Cho Người Chơi

1. Mở trang nhóm: `http://<IP-SERVER>:3001/team/<SỐ-NHÓM>`
2. Đọc câu hỏi và chọn đáp án
3. (Tùy chọn) Kích hoạt thẻ đặc biệt trước khi BTC khóa lượt
4. Chờ BTC tính điểm và xem kết quả

## 🎨 Tính Năng UI/UX

- **Dark Mode**: Giao diện tối hiện đại
- **Gradient Colors**: Màu sắc gradient sống động
- **Glass Morphism**: Hiệu ứng kính mờ
- **Animations**: Hiệu ứng chuyển động mượt mà
- **Responsive**: Tương thích mọi kích thước màn hình
- **Real-time Updates**: Cập nhật tức thời không cần refresh

## 🛠️ Cấu Trúc Dự Án

```
MlN131-Reproject/
├── server/                 # Backend
│   ├── server.js          # Express + Socket.IO server
│   ├── package.json       # Dependencies
│   └── sampleQuestions.json  # 5 câu hỏi mẫu
│
├── client/                # Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── HomePage.jsx        # Trang chủ
│   │   │   ├── PlayerScreen.jsx    # Màn hình người chơi
│   │   │   └── AdminScreen.jsx     # Màn hình admin
│   │   ├── App.jsx        # Main app với routing
│   │   └── main.jsx       # Entry point
│   ├── package.json       # Dependencies
│   └── vite.config.js     # Vite config
│
└── README.md              # Tài liệu này
```

## 🔧 Cấu Hình

### Server (server/server.js)
```javascript
const CONFIG = {
  TEAM_COUNT: 10,           // Số nhóm
  INITIAL_SCORE: 15,        // Điểm khởi đầu
  CORRECT_POINTS: 2,        // Điểm khi đúng
  WRONG_POINTS: -2,         // Điểm khi sai
  DOMINO_PENALTY: -1,       // Phạt domino
  CRISIS_THRESHOLD: 5,      // Ngưỡng khủng hoảng
  CRISIS_PENALTY: -2,       // Phạt khủng hoảng
  MIN_SCORE: 0              // Điểm tối thiểu
};
```

### Client (client/.env)
```
VITE_SOCKET_URL=http://localhost:3001
```

## 📊 API Events (Socket.IO)

### Client → Server
- `joinTeam(teamId)` - Nhóm tham gia
- `joinAdmin()` - Admin tham gia
- `submitAnswer({teamId, answer})` - Gửi câu trả lời
- `activateCard({teamId, cardType, redirectTarget})` - Kích hoạt thẻ
- `createQuestion(questionData)` - Tạo câu hỏi (admin)
- `lockRound()` - Khóa lượt (admin)
- `calculateScores()` - Tính điểm (admin)
- `resetGame()` - Reset game (admin)

### Server → Client
- `gameState` - Trạng thái game hiện tại
- `newQuestion` - Câu hỏi mới
- `roundLocked` - Lượt đã khóa
- `roundResults` - Kết quả lượt chơi
- `gameReset` - Game đã reset

## 🐛 Troubleshooting

### Không kết nối được WebSocket
- Kiểm tra firewall cho phép port 3001
- Đảm bảo `VITE_SOCKET_URL` đúng IP server
- Kiểm tra server đang chạy: `curl http://localhost:3001/api/health`

### Màn hình trắng
- Xóa cache trình duyệt (Ctrl+Shift+R)
- Kiểm tra console log (F12)
- Rebuild frontend: `cd client && npm run build`

### Điểm tính sai
- Kiểm tra logic trong `server.js` function `calculateScores()`
- Xem game history trong `gameState.history`

## 📝 License

MIT License - Tự do sử dụng cho mục đích giáo dục

## 👥 Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra phần Troubleshooting
2. Xem logs server: `pm2 logs domino-game`
3. Kiểm tra console trình duyệt (F12)

---

**Chúc các bạn chơi vui vẻ và học tốt! 🎉**

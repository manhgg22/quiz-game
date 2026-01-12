# 🎮 Quiz Game - Hệ Thống Test với Demo Mode

## 📋 Tổng Quan

Dự án quiz game với hệ thống test hoàn chỉnh, hỗ trợ demo mode để test nhanh mà không cần Gmail thật.

## 🚀 Quick Start

### Development (với Demo Mode)

1. **Cài đặt:**
```bash
# Server
cd server
npm install

# Client
cd client
npm install
```

2. **Cấu hình `.env`:**

**Server (`server/.env`):**
```env
PORT=3001
GOOGLE_CLIENT_ID=your_google_client_id
SESSION_SECRET=your_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
TEST_MODE=true  # ← Bật demo mode
```

**Client (`client/.env`):**
```env
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_TEST_MODE=true  # ← Bật demo mode
```

3. **Chạy:**
```bash
# Terminal 1 - Server
cd server
npm start

# Terminal 2 - Client
cd client
npm run dev
```

4. **Test với Demo Mode:**
```
http://localhost:5173/test-demo-mode.html
```

## ⚠️ Production Deploy

**QUAN TRỌNG:** Tắt Demo Mode trước khi deploy!

```env
# server/.env
TEST_MODE=false

# client/.env
VITE_TEST_MODE=false
```

Xem chi tiết: [`DEPLOY-CHECKLIST.md`](DEPLOY-CHECKLIST.md)

## 📚 Tài Liệu

- [`README.md`](README.md) - Hướng dẫn chính
- [`DEMO-MODE.md`](DEMO-MODE.md) - Hướng dẫn demo mode
- [`TESTING.md`](TESTING.md) - Hướng dẫn test chi tiết
- [`PRODUCTION-SAFETY.md`](PRODUCTION-SAFETY.md) - Bảo mật production
- [`DEPLOY-CHECKLIST.md`](DEPLOY-CHECKLIST.md) - Checklist deploy

## 🎯 Tính Năng

- ✅ Real-time multiplayer quiz game
- ✅ Google OAuth authentication
- ✅ Controller/Viewer roles
- ✅ Demo mode cho testing
- ✅ Domino effects & Crisis mode
- ✅ Special cards system

## 🔒 Bảo Mật

Demo mode được bảo vệ bởi environment variables:
- Chỉ hoạt động khi `TEST_MODE=true`
- Tự động tắt trong production
- An toàn để push lên GitHub

---

**Bắt đầu:** Xem [`DEMO-MODE.md`](DEMO-MODE.md) để test nhanh!

# 🔒 Production Safety - Tắt Demo Mode

## ⚠️ Quan Trọng

Demo Mode chỉ dùng cho **testing/development**. Khi deploy lên production (GitHub, Render, Railway, etc.), bạn cần **TẮT** Demo Mode để bảo mật.

## 🛠️ Cách Tắt Demo Mode

### Option 1: Sửa File `.env` (Khuyến Nghị)

**Server (`server/.env`):**
```env
TEST_MODE=false
```

**Client (`client/.env`):**
```env
VITE_TEST_MODE=false
```

### Option 2: Không Set Biến (Mặc Định Tắt)

Nếu không có biến `TEST_MODE` hoặc `VITE_TEST_MODE`, demo mode sẽ tự động **TẮT**.

## 📋 Checklist Trước Khi Push Code

- [ ] Kiểm tra `server/.env`: `TEST_MODE=false` hoặc không có
- [ ] Kiểm tra `client/.env`: `VITE_TEST_MODE=false` hoặc không có
- [ ] Verify demo buttons không hiển thị khi `TEST_MODE=false`
- [ ] Verify `/api/auth/demo` trả về 403 khi `TEST_MODE=false`

## 🧪 Cách Bật Demo Mode (Local Testing)

**Server (`server/.env`):**
```env
TEST_MODE=true
```

**Client (`client/.env`):**
```env
VITE_TEST_MODE=true
```

**Restart cả server và client sau khi thay đổi `.env`**

## 🔐 Bảo Mật

### Khi `TEST_MODE=false` (Production):
- ✅ Demo login buttons **KHÔNG** hiển thị
- ✅ `/api/auth/demo` endpoint trả về **403 Forbidden**
- ✅ Chỉ có thể login bằng Google OAuth thật
- ✅ An toàn để deploy lên production

### Khi `TEST_MODE=true` (Development):
- ⚠️ Demo login buttons **HIỂN THỊ**
- ⚠️ `/api/auth/demo` endpoint **HOẠT ĐỘNG**
- ⚠️ Có thể login nhanh với mock data
- ⚠️ **KHÔNG** deploy lên production với setting này!

## 📝 File `.env` Mẫu

### Server (`.env`)
```env
PORT=3001
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
SESSION_SECRET=your_random_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password_here
TEST_MODE=false  # ← Đặt false cho production
```

### Client (`.env`)
```env
VITE_SOCKET_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_TEST_MODE=false  # ← Đặt false cho production
```

## 🚀 Deploy Checklist

### Render/Railway/Vercel:

1. **Set Environment Variables:**
   - `TEST_MODE=false` (server)
   - `VITE_TEST_MODE=false` (client)

2. **Verify:**
   - Mở trang login → Demo buttons KHÔNG hiển thị
   - Try POST `/api/auth/demo` → Nhận 403 error

3. **Deploy:**
   - Push code lên GitHub
   - Deploy như bình thường

## 💡 Tips

**Local Development:**
```env
TEST_MODE=true
VITE_TEST_MODE=true
```

**Staging/Testing Server:**
```env
TEST_MODE=true  # Có thể bật để test
VITE_TEST_MODE=true
```

**Production:**
```env
TEST_MODE=false  # BẮT BUỘC tắt
VITE_TEST_MODE=false
```

## ⚙️ Cách Kiểm Tra

### Test Demo Mode Đã Tắt:

1. Set `TEST_MODE=false` và `VITE_TEST_MODE=false`
2. Restart server và client
3. Mở `http://localhost:5173/login/1`
4. **Verify:** Không thấy demo buttons
5. Try call API: `POST /api/auth/demo`
6. **Verify:** Nhận response `403 Forbidden`

### Test Demo Mode Đang Bật:

1. Set `TEST_MODE=true` và `VITE_TEST_MODE=true`
2. Restart server và client
3. Mở `http://localhost:5173/login/1`
4. **Verify:** Thấy 3 demo buttons
5. Click demo button
6. **Verify:** Login thành công

---

**Lưu ý:** File `.env` không được push lên Git (đã có trong `.gitignore`). Bạn cần set environment variables trực tiếp trên platform deploy (Render, Railway, Vercel, etc.)

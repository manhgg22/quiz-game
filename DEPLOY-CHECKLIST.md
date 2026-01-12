# ⚠️ QUAN TRỌNG: Tắt Demo Mode Trước Khi Deploy

## 🔒 Bảo Mật Production

Demo Mode chỉ dùng cho **testing**. Trước khi push code lên GitHub hoặc deploy, hãy **TẮT** Demo Mode.

## ✅ Cách Tắt Demo Mode

### Bước 1: Sửa File `.env`

**Server (`server/.env`):**
```env
TEST_MODE=false
```

**Client (`client/.env`):**
```env
VITE_TEST_MODE=false
```

### Bước 2: Restart Server và Client

```bash
# Restart server
cd server
npm start

# Restart client
cd client
npm run dev
```

### Bước 3: Verify

Mở `http://localhost:5173/login/1`
- ✅ Demo buttons **KHÔNG** hiển thị
- ✅ Chỉ có Google OAuth login

## 🧪 Bật Lại Demo Mode (Local Testing)

Set trong `.env`:
```env
TEST_MODE=true
VITE_TEST_MODE=true
```

Restart server và client.

---

**Chi tiết:** Xem [`PRODUCTION-SAFETY.md`](file:///e:/FPT/9_SP26/MlN131-Reproject/PRODUCTION-SAFETY.md)

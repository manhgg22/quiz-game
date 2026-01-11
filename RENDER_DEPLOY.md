# Render Deployment - Quick Start Guide

## Bước 1: Push Code Lên GitHub

```bash
# Khởi tạo git (nếu chưa có)
git init

# Thêm tất cả files
git add .

# Commit
git commit -m "Ready for Render deployment"

# Tạo repo trên GitHub và push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Bước 2: Đăng Ký Render

1. Truy cập [render.com](https://render.com)
2. Sign up với GitHub account
3. Authorize Render để access repositories

## Bước 3: Deploy với Blueprint

1. Click **"New"** → **"Blueprint"**
2. Connect repository của bạn
3. Render sẽ tự động detect file `render.yaml`
4. Click **"Apply"**

## Bước 4: Cấu Hình Environment Variables

Trong Render Dashboard, thêm các biến sau:

### Backend Service (quiz-game-server):
- `GOOGLE_CLIENT_ID`: Lấy từ Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: Lấy từ Google Cloud Console  
- `ADMIN_PASSWORD`: Password cho admin (ví dụ: `admin123`)

### Frontend Service (quiz-game-client):
- `VITE_GOOGLE_CLIENT_ID`: Giống như GOOGLE_CLIENT_ID ở trên

## Bước 5: Cấu Hình Google OAuth

1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Vào **APIs & Services** → **Credentials**
3. Chọn OAuth 2.0 Client ID của bạn
4. Thêm **Authorized redirect URIs**:
   ```
   https://quiz-game-client.onrender.com
   https://quiz-game-client.onrender.com/
   ```
5. Thêm **Authorized JavaScript origins**:
   ```
   https://quiz-game-client.onrender.com
   https://quiz-game-server.onrender.com
   ```

## Bước 6: Đợi Deploy

- Backend: ~5-10 phút
- Frontend: ~3-5 phút

Kiểm tra logs trong Render Dashboard để theo dõi tiến trình.

## Bước 7: Test

1. Truy cập frontend URL: `https://quiz-game-client.onrender.com`
2. Thử đăng nhập với email trong `teamMembers.json`
3. Test admin login tại: `https://quiz-game-client.onrender.com/admin/login`

## Lưu Ý Quan Trọng

⚠️ **Free tier của Render:**
- Service sẽ sleep sau 15 phút không hoạt động
- Lần đầu truy cập sau khi sleep sẽ mất ~30 giây để wake up
- Giới hạn 750 giờ/tháng

💡 **Tips:**
- Để tránh sleep, upgrade lên paid plan ($7/tháng)
- Hoặc dùng cron job để ping service mỗi 10 phút

## Troubleshooting

### Lỗi Build
- Check logs trong Render Dashboard
- Đảm bảo `package.json` có đúng dependencies

### Lỗi CORS
- Kiểm tra `VITE_SOCKET_URL` trong frontend env vars
- Đảm bảo backend CORS config cho phép frontend origin

### Socket.IO không connect
- Kiểm tra backend URL có đúng không
- Check browser console (F12) để xem lỗi

## URLs Sau Khi Deploy

- **Frontend**: `https://quiz-game-client.onrender.com`
- **Backend**: `https://quiz-game-server.onrender.com`
- **Admin Login**: `https://quiz-game-client.onrender.com/admin/login`

---

Good luck! 🚀

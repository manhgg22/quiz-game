# 🚀 Quick Start - Test Ngay Bây Giờ!

## ✅ Server và Client Đã Chạy

- **Server:** http://localhost:3001 ✅
- **Client:** http://localhost:5173 ✅

## 🎯 Cách Test Nhanh Nhất (3 Bước)

### Bước 1: Mở Browser Multi-Tab Test

Mở link này trong browser:
```
http://localhost:5173/test-multi-tabs.html
```

### Bước 2: Load Admin và Teams

Trong trang test, click các nút:
1. Click **"Load Admin"** → Admin panel xuất hiện
2. Click **"Load Teams 1-5"** → 5 teams đầu xuất hiện

### Bước 3: Login và Test

**Trong Admin frame:**
- Login với username: `admin` / password: `admin123`
- Hoặc login bằng Google với email admin

**Trong mỗi Team frame:**
- Click "Đăng Nhập"
- Login bằng Google với email trong team đó
- Người đầu tiên login → **Controller** (có thể trả lời)
- Người thứ 2 → **Viewer** (chỉ xem)

## 🎮 Test Game Flow

1. **Admin:** Tạo câu hỏi mới
2. **Teams:** Chọn câu trả lời (chỉ Controller)
3. **Admin:** Click "Khóa Lượt"
4. **Admin:** Click "Tính Điểm"
5. **Xem kết quả** trên tất cả frames!

## 📋 Test Scenarios

### Test 1: Controller/Viewer Roles
- Mở 2 tabs cho cùng 1 team
- Tab 1: Login với email đầu tiên → Verify badge "🎮 BẠN ĐANG ĐIỀU KHIỂN"
- Tab 2: Login với email khác → Verify badge "👁️ CHẾ ĐỘ XEM"
- Tab 1: Chọn câu trả lời → Should work ✅
- Tab 2: Try chọn câu trả lời → Should show error ❌

### Test 2: Multi-Team Game
- Load 3-5 teams
- Mỗi team login và chọn câu trả lời
- Admin tính điểm
- Verify domino effects và crisis mode

### Test 3: Disconnect & Promotion
- Team có 2 members đã login
- Close tab của Controller
- Verify Viewer nhận alert "Bạn đã được thăng cấp lên Controller!"

## 🔑 Login Credentials

### Admin
- **Username/Password:** `admin` / `admin123`
- **Google OAuth:** Email trong `teamMembers.json` → `admins` array

### Teams
Sử dụng email trong `teamMembers.json`:

**Nhóm 1:**
- sondthe180896@fpt.edu.vn
- hieudmhe181908@fpt.edu.vn

**Nhóm 2:**
- dunglthe180884@fpt.edu.vn
- datdthe180717@fpt.edu.vn

**Nhóm 3:**
- tamdtahs181116@fpt.edu.vn
- tuandahs173062@fpt.edu.vn

... (xem đầy đủ trong `server/teamMembers.json`)

## ⚠️ Lưu Ý

### Google OAuth trong iframe
Google có thể block OAuth trong iframe. Nếu gặp lỗi:
- **Option 1:** Mở từng team trong tab riêng thay vì dùng multi-tab viewer
- **Option 2:** Dùng Admin login (username/password) để test
- **Option 3:** Click chuột phải vào frame → "Open Frame in New Tab"

### Nếu muốn test với nhiều teams hơn
Trong `test-multi-tabs.html`, click:
- **"Load All Teams"** → Tất cả 10 teams (có thể lag)
- **"Load Teams 6-10"** → 5 teams sau
- **"Clear All"** → Xóa tất cả để bắt đầu lại

## 🎯 Kết Quả Mong Đợi

✅ Admin có thể tạo câu hỏi
✅ Teams nhận câu hỏi real-time
✅ Controller có thể submit answer
✅ Viewer không thể submit (hiện error)
✅ Admin có thể khóa lượt và tính điểm
✅ Kết quả hiển thị đúng với domino effects
✅ Crisis mode kích hoạt khi ≥5 teams sai
✅ Controller disconnect → Viewer được promote

## 🐛 Troubleshooting

### Frame không load
- Refresh trang `test-multi-tabs.html`
- Kiểm tra server và client đang chạy

### Không login được Google
- Thử mở frame trong tab mới
- Hoặc dùng Admin login thay vì Google

### Không thấy real-time updates
- Check console log (F12)
- Verify WebSocket connection

---

**Chúc bạn test vui vẻ! 🎉**

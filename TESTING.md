# 🧪 Hướng Dẫn Test Game Flow

## Tổng Quan

Có 2 cách để test luồng game với nhiều người chơi:

1. **Automated Test Script** - Test tự động với Node.js (không cần browser)
2. **Browser Multi-Tab Test** - Test thủ công với nhiều tab trên một màn hình

---

## 1. Automated Test Script (Khuyến Nghị)

### Chuẩn Bị

1. **Cài đặt dependencies** (nếu chưa có):
```bash
cd server
npm install
```

2. **Khởi động server**:
```bash
cd server
npm start
```

Server phải chạy ở `http://localhost:3001`

### Chạy Test

Mở terminal mới và chạy:

```bash
cd server
node test-game-flow.js
```

### Kết Quả Mong Đợi

Script sẽ tự động:
- ✅ Kết nối 1 admin
- ✅ Kết nối 10 teams (mỗi team 2 members = 20 connections)
- ✅ Kiểm tra role assignment (controller/viewer)
- ✅ Tạo câu hỏi
- ✅ Kích hoạt special cards
- ✅ Submit answers từ tất cả teams
- ✅ Khóa lượt
- ✅ Tính điểm với domino effects
- ✅ Kiểm tra crisis mode (khi ≥5 teams sai)
- ✅ Test disconnect và promotion

**Output mẫu:**
```
🧪 QUIZ GAME FLOW TEST
============================================================

📍 STEP 1: Admin Connection
✅ Admin connected (socket-id-123)
✅ TEST PASSED: Admin receives game state

📍 STEP 2: Team Connections
✅ sondthe180896@fpt.edu.vn connected
  sondthe180896@fpt.edu.vn → Role: controller
✅ TEST PASSED: Nhóm 1: First member is controller
...

📊 RESULTS:
────────────────────────────────────────────────────────────
✅ Nhóm 1: Nhật đầu hàng Đồng minh
   Score: 15 → 17 (+2)
❌ Nhóm 2: Khởi nghĩa ở Hà Nội
   Score: 15 → 12 (-3)
...

⛓️  DOMINO CHAINS:
   Team 2 → Team 3 (-1 points)
   Team 4 → Team 5 (-1 points)
...

⚠️  SYSTEM CRISIS TRIGGERED! All teams -2 points

📊 TEST SUMMARY
============================================================
Total Tests: 25
Passed: 25
Failed: 0
Success Rate: 100.0%
✅ ALL TESTS PASSED!
```

---

## 2. Browser Multi-Tab Test

### Chuẩn Bị

1. **Khởi động server**:
```bash
cd server
npm start
```

2. **Khởi động client**:
```bash
cd client
npm run dev
```

Client sẽ chạy ở `http://localhost:5173`

### Chạy Test

1. Mở file test trong browser:
```
http://localhost:5173/test-multi-tabs.html
```

Hoặc mở trực tiếp file:
```
client/test-multi-tabs.html
```

2. Sử dụng các nút điều khiển:
   - **Load Admin**: Mở admin panel
   - **Load All Teams**: Mở tất cả 10 teams
   - **Load Teams 1-5**: Chỉ mở 5 teams đầu
   - **Load Teams 6-10**: Chỉ mở 5 teams sau
   - **Clear All**: Xóa tất cả frames

### Lưu Ý

⚠️ **Google OAuth**: Mỗi iframe cần đăng nhập Google OAuth riêng. Điều này có thể phức tạp vì Google có thể block nhiều login requests cùng lúc.

**Giải pháp:**
- Test với 2-3 teams thay vì 10
- Hoặc sử dụng Admin login (username/password) cho testing
- Hoặc dùng Automated Test Script (khuyến nghị)

---

## 3. Manual Testing với Real Google OAuth

### Scenario 1: Test Controller/Viewer Roles

1. Mở 2 browsers khác nhau (Chrome + Firefox)
2. Browser 1: Truy cập `http://localhost:5173/login/1`
   - Login với email trong Nhóm 1 (ví dụ: `sondthe180896@fpt.edu.vn`)
   - Verify: Hiển thị badge "🎮 BẠN ĐANG ĐIỀU KHIỂN"
3. Browser 2: Truy cập `http://localhost:5173/login/1`
   - Login với email khác trong Nhóm 1 (ví dụ: `hieudmhe181908@fpt.edu.vn`)
   - Verify: Hiển thị badge "👁️ CHẾ ĐỘ XEM"
4. Browser 1: Chọn một câu trả lời → Should work ✅
5. Browser 2: Try chọn câu trả lời → Should show error ❌

### Scenario 2: Test Controller Promotion

1. Tiếp tục từ Scenario 1
2. Close Browser 1 (Controller disconnect)
3. Browser 2: Verify nhận alert "Bạn đã được thăng cấp lên Controller!"
4. Browser 2: Badge đổi thành "🎮 BẠN ĐANG ĐIỀU KHIỂN"
5. Browser 2: Chọn câu trả lời → Should work now ✅

### Scenario 3: Full Game Flow

1. **Admin**: Login tại `http://localhost:5173/admin`
2. **Admin**: Tạo câu hỏi mới
3. **Teams**: Mở 3-4 tabs với các teams khác nhau
4. **Teams**: Submit answers
5. **Admin**: Bấm "Khóa Lượt"
6. **Admin**: Bấm "Tính Điểm"
7. **Verify**: Kết quả hiển thị đúng trên tất cả tabs

---

## Troubleshooting

### ❌ Test script báo lỗi "Connection refused"

**Nguyên nhân:** Server chưa chạy

**Giải pháp:**
```bash
cd server
npm start
```

### ❌ Browser test không load được frames

**Nguyên nhân:** Client dev server chưa chạy

**Giải pháp:**
```bash
cd client
npm run dev
```

### ❌ Google OAuth không hoạt động trong iframe

**Nguyên nhân:** Google block OAuth trong iframe vì security

**Giải pháp:**
- Sử dụng Automated Test Script thay vì browser test
- Hoặc test với Admin login (username/password)
- Hoặc mở từng team trong tab riêng thay vì iframe

### ❌ Test script báo "Invalid token"

**Nguyên nhân:** JWT secret không khớp

**Giải pháp:**
- Kiểm tra `SESSION_SECRET` trong file `.env`
- Test script sử dụng cùng secret với server

---

## Test Checklist

### Automated Test
- [ ] Server đang chạy tại `http://localhost:3001`
- [ ] Chạy `node test-game-flow.js`
- [ ] Verify: Admin connected
- [ ] Verify: 10 teams connected (20 members)
- [ ] Verify: Controller/Viewer roles assigned correctly
- [ ] Verify: Question created and distributed
- [ ] Verify: Answers submitted
- [ ] Verify: Scores calculated with domino effects
- [ ] Verify: Crisis mode triggered (if ≥5 teams wrong)
- [ ] Verify: All tests passed (100% success rate)

### Browser Test
- [ ] Server và client đang chạy
- [ ] Mở `test-multi-tabs.html`
- [ ] Load admin panel
- [ ] Load 2-3 teams
- [ ] Login với Google OAuth cho mỗi team
- [ ] Verify: Controller badges hiển thị đúng
- [ ] Admin tạo câu hỏi
- [ ] Teams submit answers
- [ ] Admin tính điểm
- [ ] Verify: Kết quả hiển thị đúng

### Manual Test
- [ ] Test controller/viewer roles
- [ ] Test controller promotion khi disconnect
- [ ] Test full game flow
- [ ] Test special cards
- [ ] Test domino effects
- [ ] Test crisis mode

---

## Tips

💡 **Tip 1**: Sử dụng Automated Test Script để test nhanh toàn bộ luồng

💡 **Tip 2**: Sử dụng Browser Test để verify UI/UX

💡 **Tip 3**: Sử dụng Manual Test để test Google OAuth thật

💡 **Tip 4**: Có thể giảm số teams xuống 3-5 trong test script để test nhanh hơn (sửa dòng `for (let teamId = 1; teamId <= 10; teamId++)` thành `teamId <= 5`)

💡 **Tip 5**: Xem console log của server để debug (`npm start` sẽ hiển thị tất cả connections và events)

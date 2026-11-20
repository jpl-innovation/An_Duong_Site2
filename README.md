# ADDC, Kiến Trúc An Dương: website

Trang tĩnh (HTML, CSS, JS), không cần build. Chạy thử: `python -m http.server 8080` trong thư mục này rồi mở http://localhost:8080.

```
index.html            Trang chủ: ảnh khởi công, một đầu mối, ba lĩnh vực, công trình tiêu biểu + danh mục,
                      hành trình 3D "Cách ADDC làm một công trình", tin công trường, chi phí, đội ngũ, đối tác, liên hệ
du-an.html            Toàn bộ công trình: lưới ảnh nhiều cỡ, lọc theo loại (?loai=), theo lĩnh vực (?dv=), xem dạng danh sách
gioi-thieu.html       Giới thiệu: câu chuyện, thư ngỏ, các mốc 2015 đến 2026, năng lực và pháp lý, đội ngũ, đối tác
kien-truc.html        Thiết kế kiến trúc: ngôi nhà 3D (góc nhìn, cách thể hiện, màu mặt tiền, giờ nắng), quy trình, bảng giá
thi-cong.html         Thi công: ngôi nhà dựng theo thanh cuộn (7 giai đoạn, ẩn hiện công trình tạm, ngày đêm), chi tiết kết cấu,
                      thiết bị, vật liệu 3D, bảng giá, nhật ký công trường
noi-that.html         Nội thất: trình phối phòng 3D (không gian, sàn, tường, lam gỗ, gỗ, vải, ánh sáng), đồ nội thất 3D, quy trình
css/v2.css            Giao diện bản mới (các trang trên); có bảng màu thử "xanh rêu" (nút ở chân trang hoặc ?theme=moss)
css/styles.css        Giao diện bản cũ, chỉ còn giữ để tham khảo
js/app.js             Dữ liệu dự án (PROJECTS), nhật ký (LOG), bảng giá, dự toán, lưới công trình, cookie, chuyển động
js/scene3d.js         Mô hình 3D (Three.js); khối MODELS ở đầu tệp để gắn mô hình GLB thật
img/                  Logo, ảnh từ addc.vn; img/fb/ ảnh Facebook (giữ nguyên chất lượng gốc); img/fb/hero/ ảnh đầu trang
img/projects/, img/equipment/, img/partners/, img/materials/   ảnh dự án, thiết bị, đối tác, vật liệu
models/               26 mô hình GLB dựng sẵn và ảnh tham chiếu, đầu vào cho raea
docs/3D-PROMPTS.md    Lời nhắc chi tiết cho raea và cách gắn mô hình mới vào web
tools/export-3d.html  Xuất lại các mô hình GLB sau khi sửa js/scene3d.js
tools/make-sizes.py   Tạo bản ảnh 640 và 1280 px (tên-w640.jpg, tên-w1280.jpg) cho mọi ảnh; chạy lại sau khi thêm ảnh mới
```

Sau khi sửa CSS hoặc JS, tăng số `?v=` trong các thẻ `<link>` và `<script>` của 6 trang để trình duyệt tải bản mới.

Website chỉ lưu lựa chọn cookie và bảng màu trong trình duyệt, không dùng cookie theo dõi.

Cần xác nhận trước khi đưa lên mạng: bảng giá là bản 2021; form liên hệ mở ứng dụng email (chưa có máy chủ nhận form); 6 thành viên chưa có ảnh chân dung đang hiển thị chữ viết tắt. Nội dung dự án, đội ngũ, sơ đồ tổ chức, thiết bị và đối tác lấy từ addc.vn và Hồ sơ năng lực ADDC.

Nguồn của từng thông tin, ảnh và cách cập nhật dự án, nhật ký công trường: xem `CONTENT-SOURCES.md`.

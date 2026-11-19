# Tài liệu Đặc tả & Trích xuất Dữ liệu Xây dựng Web: Geometry Dash Level Finder & Skill Analyzer

> **Nguồn dữ liệu:** Phân tích và trích xuất từ kế hoạch dự án gốc.  
> **Mục tiêu:** Chuyển đổi ý tưởng thô thành cấu trúc dữ liệu, thực thể (entities), thuật toán và lộ trình kỹ thuật sẵn sàng cho việc thiết kế Database, API và Frontend.

---

## 1. Tổng quan & Giá trị cốt lõi

- **Game mục tiêu:** Geometry Dash (platformer/rhythm-action có độ khó phân cấp theo từng màn).
- **Bài toán cần giải quyết:**
  - Người chơi không biết chọn màn nào tiếp theo (dễ nản vì màn quá khó hoặc chán vì màn quá dễ).
  - Người mới (newbie) thiếu định hướng luyện tập.
- **Giải pháp:**
  1. Đánh giá trình độ thực tế qua hồ sơ kỹ năng đa chiều.
  2. Gợi ý màn **"vừa sức"** và **lộ trình luyện tập (Challenge Roadmap)** để chinh phục màn mục tiêu.
  3. Kết hợp **diễn đàn cộng đồng** để bổ sung kinh nghiệm, guide, và bình chọn lại độ khó thực tế.

---

## 2. Dữ liệu Kỹ năng & Hồ sơ Người chơi (Skill Profile Data)

### 2.1. Vector Kỹ năng (8 chỉ số cốt lõi)
Mỗi người chơi và mỗi màn chơi đều được biểu diễn bằng một vector gồm 8 thành phần (thang điểm chuẩn hóa, ví dụ `0 – 100` hoặc hệ số Elo):

| Mã kỹ năng (Key) | Tên hiển thị | Mô tả / Vai trò trong Geometry Dash |
| :--- | :--- | :--- |
| `timing` | Timing | Canh thời điểm nhảy/nhấn chính xác (orb, jump pad, tight jumps) |
| `spam_click` | Spam Click | Tốc độ và nhịp nhấp liên tục cường độ cao |
| `wave` | Wave | Kỹ năng điều khiển gamemode Wave (góc 45°, mini wave, spam wave) |
| `ship` | Ship | Kỹ năng giữ thăng bằng, straight fly với gamemode Ship |
| `ufo` | UFO | Kỹ năng canh nhịp nhảy trên không với gamemode UFO |
| `accuracy` | Độ chính xác | Hạn chế sai số vị trí, né hitbox hẹp |
| `consistency` | Độ ổn định | Giữ phong độ đều qua các đoạn dài, ít chết vặt |
| `rhythm` | Nhịp (Rhythm) | Khả năng bắt nhịp theo nhạc nền (music sync) |

### 2.2. Phương pháp khởi tạo & Thu thập dữ liệu thao tác
- **Giai đoạn 1 (MVP - Nhập thủ công):**
  - Bài test **"Xác định trình độ" 5 phút** cho người chơi mới (giải quyết Cold Start).
  - Người chơi tự nhập: màn đã qua, `%` tiến độ, số `attempt`, tự đánh giá kỹ năng.
- **Giai đoạn mở rộng:**
  - Upload video/clip để phân tích (ưu tiên thấp do xử lý nặng).
  - **Mod / API (Giai đoạn 3):** Thu thập dữ liệu thao tác thật và tọa độ chết (phục vụ tính năng *Death Heatmap*), cần kiểm tra trước Bản quyền / Terms of Service (ToS) của game.

---

## 3. Dữ liệu Hệ thống & Mô hình Thực thể (Entities / Schema Draft)

Dưới đây là các thực thể dữ liệu cần thiết để thiết kế cơ sở dữ liệu (Database):

### 3.1. `User` (Người chơi)
- `id`, `username`, `email`, `password_hash`
- `skill_vector`: JSON/Object chứa 8 chỉ số kỹ năng (cập nhật theo Elo)
- `overall_rating`: Điểm trình độ tổng hợp
- `reputation_score`: Điểm uy tín trên diễn đàn
- `badges`: Danh sách huy hiệu đạt được
- `preferred_language`: `vi` | `en`

### 3.2. `Level` (Màn chơi Geometry Dash)
- `id` (Internal ID) & `gd_level_id` (**Level ID** trong Geometry Dash để người chơi copy vào game)
- `name`: Tên màn chơi
- `creator`: Tác giả màn chơi
- `official_difficulty`: Độ khó gốc trong game (Auto, Easy, Normal, Hard, Harder, Insane, Easy/Medium/Hard/Insane/Extreme Demon)
- `community_difficulty`: Điểm độ khó thực tế do cộng đồng bình chọn
- `skill_requirements`: Vector 8 kỹ năng yêu cầu (Ví dụ: `{ wave: 70, timing: 90, spam_click: 20, ... }`)
- `death_heatmap_data`: *(Giai đoạn 3)* Dữ liệu tỷ lệ % vị trí người chơi hay chết nhất + mẹo đi qua đoạn đó

### 3.3. `PlayLog` (Lịch sử chơi)
- `id`, `user_id`, `level_id`
- `progress_percent`: Phần trăm tiến độ (`0 – 100%`)
- `attempts`: Số lần thử (attempt)
- `is_completed`: Trạng thái đã qua màn (`true/false`)
- `source`: `manual` | `onboarding_test` | `mod_api`
- `created_at`

### 3.4. `GoalRoadmap` (Lộ trình mục tiêu)
- `id`, `user_id`
- `target_level_id`: Màn chơi mơ ước muốn vượt qua
- `target_deadline`: Thời hạn mục tiêu (VD: 30 ngày)
- `challenge_sequence`: Danh sách thứ tự các `gd_level_id` trung gian tăng dần độ khó
- `status`: `active` | `completed`

### 3.5. `ForumPost` & `LevelVote` (Cộng đồng)
- `ForumPost`: `id`, `author_id`, `level_id` (liên kết trực tiếp tới màn chơi), `title`, `content` (guide/hỏi đáp/chia sẻ), `tags` (tag theo màn, kỹ năng, độ khó), `upvotes`, `created_at`.
- `LevelVote`: `user_id`, `level_id`, `voted_difficulty`, `voted_skill_vector` (dùng để hiệu chỉnh độ khó sai lệch).

---

## 4. Thuật toán & Quy tắc Nghiệp vụ (Business Logic)

Giai đoạn đầu sử dụng **công thức toán học + tập luật (Rule-based)** thay vì AI phức tạp:

1. **Cập nhật trình độ (Elo-style Update):**
   - Sau mỗi `PlayLog` mới (`is_completed`, `attempts`, `progress_percent`), tăng/giảm điểm các kỹ năng tương ứng trong `skill_requirements` của màn đó và `overall_rating` của người chơi.
2. **Gợi ý màn "Vừa sức" (Sweet-spot Recommendation):**
   - Điều kiện độ khó: Chọn màn có độ khó cao hơn trình độ hiện tại khoảng **10% – 20%**.
   - **Explainability (Bắt buộc có trên UI):** Trả về lý do gợi ý cụ thể.  
     *Ví dụ:* `"Bạn mạnh Timing nhưng yếu Wave, màn này luyện Wave ở mức phù hợp với bạn."`
3. **Tạo Lộ trình Luyện tập (Challenge Roadmap):**
   - Tính khoảng cách vector: $\Delta Skill = Skill_{Target} - Skill_{User}$.
   - Xác định các kỹ năng thiếu hụt lớn nhất.
   - Truy vấn chuỗi màn trung gian (trả về `gd_level_id`) có độ khó tăng dần và trọng số cao ở các kỹ năng đang thiếu.
4. **Liên kết Cộng đồng & Gợi ý:**
   - Tại trang chi tiết mỗi màn được gợi ý, tự động kéo và hiển thị các **Guide / Mẹo hay nhất** (top upvoted `ForumPost`) gắn với `level_id` đó.

---

## 5. Lộ trình Triển khai Kỹ thuật (Implementation Roadmap)

| Giai đoạn | Tên giai đoạn | Các hạng mục cần xây dựng |
| :--- | :--- | :--- |
| **Giai đoạn 0** | **Chuẩn bị** | - Chốt game mục tiêu (Geometry Dash) & nguồn dữ liệu.<br>- Dựng Database màn chơi hạt giống (seed data: tên, GD Level ID, độ khó, vector kỹ năng gắn nhãn sẵn). |
| **Giai đoạn 1** | **MVP** | - Đăng ký / Đăng nhập, Hồ sơ cá nhân.<br>- Bài test 5 phút xác định trình độ + Form nhập lịch sử chơi.<br>- Engine gợi ý màn vừa sức (rule đơn giản + giải thích lý do).<br>- Diễn đàn cơ bản: đăng bài, bình luận, gắn tag (màn, kỹ năng, độ khó). |
| **Giai đoạn 2** | **Lộ trình & Biểu đồ** | - Tính năng chọn màn mục tiêu & sinh lộ trình challenge (kèm Level ID).<br>- Biểu đồ Radar kỹ năng & biểu đồ tiến bộ theo thời gian.<br>- Hệ thống cộng đồng bình chọn lại độ khó & vector kỹ năng của màn. |
| **Giai đoạn 3** | **Tự động hóa & Gamification** | - Tích hợp Mod/API thu dữ liệu thao tác thật & *Death Heatmap*.<br>- Nâng cấp thuật toán gợi ý bằng Machine Learning từ dữ liệu thật.<br>- Huy hiệu, Bảng xếp hạng, Hệ thống uy tín diễn đàn, Thử thách tuần/tháng, Mục tiêu cá nhân + nhắc nhở. |
| **Giai đoạn 4** | **Mở rộng** | - Mobile / PWA, Đa ngôn ngữ (Tiếng Việt, Tiếng Anh).<br>- Tích hợp Discord / YouTube, Chế độ so sánh với bạn bè & chia sẻ hồ sơ lên MXH.<br>- Mô hình doanh thu: Donate (giữ tính năng cốt lõi miễn phí). |

---

## 6. Rủi ro Kỹ thuật / Vận hành & Giải pháp

| Rủi ro | Giải pháp thiết kế ngay từ đầu |
| :--- | :--- |
| **Cold Start** (Ít dữ liệu, gợi ý kém) | Xây dựng bài test 5 phút đầu vào + bộ dữ liệu màn chơi được gắn nhãn thủ công sẵn ở Giai đoạn 0. |
| **Diễn đàn vắng** | Tạo nội dung hạt giống (seed posts/guides) trước khi launch; mời creator/YouTuber nhỏ trong cộng đồng GD tham gia sớm. |
| **Sai lệch độ khó** (Creator đặt sai) | Áp dụng `community_difficulty` từ tính năng bình chọn lại của người chơi. |
| **Bản quyền / ToS game** | Rà soát kỹ ToS của Geometry Dash / RobTop trước khi phát triển Mod hoặc gọi API lấy dữ liệu. |
| **Kiểm duyệt nội dung** | Thiết lập bộ quy tắc cộng đồng, hệ thống report và phân quyền Moderator ngay từ Giai đoạn 1–2. |

---

## 7. Đề xuất bước tiếp theo để bắt đầu code
1. **Thiết kế Database Schema chi tiết** (PostgreSQL / Supabase hoặc MongoDB) dựa trên mục 3.
2. **Xây dựng bộ dữ liệu Seed** (khoảng 30–50 màn Geometry Dash phổ biến từ Easy đến Extreme Demon đã gắn vector 8 kỹ năng).
3. **Thiết kế Wireframe / UI** cho 3 màn hình chính: *Bài test 5 phút*, *Dashboard Hồ sơ & Gợi ý*, *Trang chi tiết màn chơi + Guide cộng đồng*.

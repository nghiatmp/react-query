---
name: review-react-query
description: Quy trình review code cho project Next.js 16 + React Query v5 + Zustand + Zod này — cách xác định phạm vi, thang mức độ P0/P1/P2, danh mục rule có mã, yêu cầu kiểm chứng và định dạng báo cáo cố định. Dùng mỗi khi review diff, review trước khi commit, hoặc rà soát một feature folder.
---

# Review code — quy trình chuẩn

Mục tiêu: hai lần review cùng một đoạn code phải ra cùng kết luận. Không phụ thuộc
việc hôm đó nhớ ra checklist gì.

## Bước 1 — Xác định phạm vi

```bash
git status --porcelain
git diff
```

Repo này mới có 1 commit khởi tạo nên **phần lớn code tính năng là untracked** —
`git diff` KHÔNG thấy chúng. Luôn đọc danh sách từ `git status` rồi đọc thẳng file.

Không review: `doc/`, `.claude/`, `AGENTS.md`, `CLAUDE.md`, `package-lock.json`,
`.next/`, `node_modules/`.

Chốt phạm vi thành danh sách file cụ thể trước khi đọc. Chỉ mở rộng ra file khác
khi cần hiểu ảnh hưởng của thay đổi, không review file đó.

## Bước 2 — Chạy hai lệnh nền

```bash
npx tsc --noEmit
npm run lint
```

Kết quả đưa vào báo cáo. **Sạch cả hai KHÔNG có nghĩa là code đúng** — bug
hydration và bug ghi đè localStorage trong repo này từng lọt qua cả hai.

## Bước 3 — Rà theo danh mục rule

Đọc `references/checklist.md` và đi hết từng mã rule. Mỗi rule ghi rõ dấu hiệu
nhận biết và cách sửa. Không tự nghĩ ra tiêu chí ngoài danh mục; thấy vấn đề
chưa có mã thì báo cáo với mã `NEW` và đề xuất thêm vào checklist.

## Bước 4 — Kiểm chứng

Đọc `references/verify.md`. Quy tắc cứng:

- Finding về **hành vi lúc chạy** (hydration, luồng dữ liệu, cache, persist) phải
  kiểm chứng trên app đang chạy. Không kiểm chứng được thì hạ xuống `P2` và ghi
  `Kiểm chứng: chưa` — không được để nguyên P0/P1 dựa trên suy luận.
- Finding về **logic thuần** (thiếu validate, nhánh thiếu, sai key) chỉ cần nêu
  được input/state cụ thể dẫn tới kết quả sai.
- Không có kịch bản lỗi cụ thể → **không phải finding**, bỏ đi.

## Bước 5 — Thang mức độ

| Mức | Định nghĩa | Ví dụ đã gặp trong repo |
|---|---|---|
| `P0` | App làm sai hành vi, mất dữ liệu, hoặc crash trên đường đi thông thường | Store bị nạp 2 bản → `/ssr-demo` không thấy dữ liệu vừa tạo |
| `P1` | Sai trong điều kiện cụ thể, hoặc chặn thao tác của user | Hydration mismatch sau reload; trùng `id` khiến label mở select sau overlay |
| `P2` | Đúng nhưng nên chặt hơn; bẫy chờ người sau đạp phải | `deleteRecipe` không Zod parse; `search` chưa `trim()` trước khi vào query key |

Không có gì đáng nói thì nói thẳng "không tìm thấy vấn đề". **Tuyệt đối không
bịa finding cho đủ số.**

## Bước 6 — Báo cáo

Đúng định dạng trong `references/output-format.md`. Không thêm mục, không bỏ mục.

## Không bao giờ báo cáo

Repo này là dự án học tập, những thứ sau là CHỦ Ý:

- Comment tiếng Việt dài, giải thích "vì sao" rất kỹ.
- Thiếu test (chưa có test runner nào trong `package.json`).
- `_store.ts` là DB giả trong bộ nhớ, không phải database thật.
- `delay()` giả lập độ trễ mạng.
- Thiếu i18n, thiếu auth, thiếu error tracking.

Cũng không báo cáo: sở thích cá nhân về style, đề xuất đổi thư viện, refactor
kiến trúc không liên quan tới thay đổi đang review.

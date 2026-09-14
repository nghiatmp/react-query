<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent & workflow của dự án

Định nghĩa subagent nằm trong `.claude/agents/`:

| Agent | Việc | Quyền ghi |
|---|---|---|
| `phan-tich-yeu-cau` | BA: viết spec + acceptance criteria vào `doc/specs/` | chỉ ghi doc |
| `thiet-ke-ui` | Thiết kế màn hình, phân rã component, 4 state UI | chỉ ghi doc |
| `code-tinh-nang` | Implement tính năng đã có spec | ghi source |
| `viet-test` | Viết test hook/store/schema/component | ghi source |
| `review-code` | Review diff, tìm bug & sai pattern | read-only |

Pipeline đầy đủ: `/tinh-nang <mô tả>`.

Tiêu chí review không nằm trong prompt agent mà tách ra skill
`.claude/skills/review-react-query/` (agent `review-code` bắt buộc gọi skill này
trước khi bắt đầu):

- `SKILL.md` — quy trình 6 bước, thang mức độ P0/P1/P2, danh sách "không bao giờ báo cáo".
- `references/checklist.md` — danh mục rule có mã (`RQ-*`, `ZU-*`, `ZOD-*`, `NX-*`,
  `A11Y-*`, `PERF-*`, `CONV-*`), mỗi rule kèm dấu hiệu nhận biết và cách sửa.
- `references/verify.md` — cách kiểm chứng thật trên dev server; ghi lại các lần suy
  luận sai (thứ tự effect, StrictMode chạy effect hai lượt) để không lặp.
- `references/output-format.md` — định dạng báo cáo cố định, có cột `Kiểm chứng`
  chỉ nhận `đã chạy` / `chỉ đọc code`.

Sửa tiêu chí review thì sửa trong skill, không sửa prompt agent. Skill dùng lại được
cả khi review thủ công ở session chính: `/review-react-query`.

## Vòng sửa sau review

`/review-fix` = review → chốt phạm vi với user → sửa → kiểm chứng → re-review.

Cơ chế chặn vòng lặp "sửa rồi review vẫn báo lỗi":

- Mỗi finding mang theo **Điều kiện đóng** chạy được, đo HÀNH VI (không đo "đã thêm dòng
  code chưa"), có nêu giá trị hiện tại khi còn bug.
- Báo cáo review ghi ra `doc/reviews/<ngày>-<slug>.md`, mỗi finding có trạng thái
  `mở` / `đã đóng` / `bỏ qua (user quyết)`.
- Người sửa (skill `fix-review-findings`) phải tự chạy điều kiện đóng và dán output mới
  được đổi trạng thái. `tsc` + `lint` sạch KHÔNG phải bằng chứng.
- Re-review đọc file cũ, chỉ phân loại `đã đóng` / `còn mở` / `mới phát sinh`, không
  phán lại finding đã `bỏ qua`.

Vòng sửa làm ở **session chính**, không giao subagent: nó cần đo → điều chỉnh → đo lại,
mà subagent không quay lại hỏi giữa đường được.

Nguyên tắc: việc chỉ sửa vài file thì làm thẳng ở session chính (subagent có context riêng, giao việc nhỏ là lỗ). Giao cho subagent khi việc đó **đọc nhiều mà trả về ít**, hoặc khi có nhiều nhánh **độc lập** chạy song song được.

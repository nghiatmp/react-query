# Bếp nhà — thực đơn tuần và danh sách đi chợ

Tài liệu này ghi hợp đồng chức năng và những ranh giới lưu trữ cần giữ khi mở rộng dự án.

- Tuần bắt đầu thứ Hai, 7 ngày × sáng/trưa/tối. Chọn, thay, gỡ món; lọc picker theo yêu thích; copy tuần trước với xác nhận nếu đích có món.
- Shopping giữ nguyên `ingredients[].amount` dạng chuỗi. Mỗi nguyên liệu của mỗi bữa là một mục riêng, không tự cộng hay quy đổi đơn vị. Tạo thêm mục còn thiếu, không ghi đè mục đã chỉnh hoặc đã mua. Mục cũ giữ lại khi đổi thực đơn, người dùng có thể xóa.
- Chưa đăng nhập: recipe demo RAM như trước; favorites cũ giữ nguyên; tuần/shopping lưu ở trình duyệt. Đăng nhập: Firestore riêng tài khoản, ban đầu rỗng. Nhập công thức demo và yêu thích là thao tác rõ ràng, không ghi đè. Không tự nhập tuần/shopping.
- Query/mutation và cloud favorites do React Query quản lý theo uid; Zustand giữ preferences + favorites demo. Auth subscription duy nhất; refresh cloud khi focus và định kỳ. SSR demo luôn public demo.
- Security Rules owner-only, giới hạn field/kiểu/độ dài; không deploy production trong task.

## Quyết định UI từ advisor
UI UX Pro Max CLI 2.15.0: inspected npm package `generatePlatformFiles` uses cwd unless `--global`; Codex config targets `.agents/skills/`. Installed locally with `npx --yes ui-ux-pro-max-cli@2.15.0 init --ai codex`. Không thay AGENTS/CLAUDE. Python search chạy thật.

Design-system search `recipe cooking meal planner calm` trả về recipe/cooking palette nhưng claymorphism + hero marketing không hợp bảng tuần. Không dùng nguyên output này; dùng domain style tối giản và stack shadcn cho focus/dialog. Hướng đã chấp thuận ưu tiên: cream/olive, ảnh món ăn, tiêu đề serif, nội dung Geist, spacing 4/8px, radius chung, không hiệu ứng 3D. Dialog dùng primitive có focus trap, Escape và controlled state. Focus rõ, labels thật, loading/empty/error/retry và mobile chọn ngày.

Nguồn: [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), [shadcn React 19/Tailwind 4](https://ui.shadcn.com/docs/tailwind-v4), [Firebase Emulator Auth](https://firebase.google.com/docs/emulator-suite/connect_auth), [Rules tests](https://firebase.google.com/docs/rules/unit-tests).

## Firebase storage mới

| Path dưới `users/{uid}` | Dữ liệu |
| --- | --- |
| `recipes/{id}` | metadata Recipe, `ingredientCount` 1–30, `revision` |
| `recipes/{id}/ingredients/{index}` | `name`, `amount`, `index` 0–29, `revision` bằng parent |
| `favorites/{recipeId}` | `recipeId` |
| `weeks/{Monday}` | `weekStart`, map `slots` trong 21 khóa cho phép |
| `weeks/{Monday}/items/{id}` | `name`, `amount`, `checked`, `source` |

Public `Recipe`, form và demo API vẫn giữ `ingredients: {name, amount}[]`, giới hạn 30, đúng thứ tự. Adapter [recipeStorage.ts](../../src/lib/firebase/recipeStorage.ts) chuyển đổi ở ranh giới Firebase. Create/update/delete/import từng công thức dùng transaction nguyên tử; cập nhật ghi toàn bộ revision mới và xóa các child dư, xóa recipe cũng xóa children + favorite. Import giữ công thức cloud đã tồn tại. Firestore optimistic transaction retry xử lý tranh chấp; revision là dấu phát hiện bản đọc trộn, không phải quyền sở hữu. Rules cho revision bằng/lớn hơn bản hiện tại để stale transaction nhận conflict và retry thay vì permission-denied trước khi kiểm tra read precondition.

Reader kiểm tra count, index liên tục và revision; không hiển thị bản thiếu/trộn khi một lần đọc parent và children giao nhau với lần cập nhật khác. React Query retry/refetch và UI báo lỗi rõ. Rules chặn quyền và schema từng document, binds child với parent sau transaction, chặn xóa child trong range; không chứng minh đủ toàn bộ 30 children cho một raw write parent riêng. Adapter là đường ghi bình thường và luôn atomic. Đây là storage mới, chưa có migration hay dữ liệu production do task tạo.

Tradeoff: một công thức 30 nguyên liệu đọc tối đa 31 documents (parent + 30 children), create/update đủ 30 ghi 31 documents, delete thêm tối đa một favorite. List đọc metadata và children, không phải chỉ 1 document/công thức như array inline. Poll 30 giây chỉ khi view có observer; nên đánh giá quota/cost thực tế trước triển khai. Các `getAfter` cùng parent được cache ở Rules; batch thật 30 items đã vượt qua kiểm chứng access-call/expression limits. Chưa đo chi phí production.

## Chẩn đoán giới hạn Rules

- Normal UI: 1 nguyên liệu lưu được; 30 trả permission-denied. Trace emulator xác nhận `maximum of 1000 expressions`, không phải Google Auth hay route API.
- Counterfactual: predicate inline rút gọn vẫn fail 30, nên không giảm boundary hoặc bỏ validation. Cùng dữ liệu chuyển sang child docs + atomic batch 30 thành công. Quyết định normalize chỉ ở storage Firebase mới được Firstmate chấp thuận.
- Tests ban đầu chỉ ra Rules `trim()` còn chấp nhận NBSP, trong khi Zod trim từ chối. Bổ sung RE2 whitespace Unicode; dữ liệu sai tại index 0/15/29 bị từ chối, cả batch rollback.
- Exact `revision == old+1` gây permission-denied cho stale contender. Counterfactual `revision >= old` giữ schema/owner và cho Firestore kiểm tra read precondition: hai sửa đồng thời hoàn tất, revision cuối 3, không trộn nguyên liệu.

Nguồn giới hạn và giao dịch: [Rules conditions/access calls](https://firebase.google.com/docs/firestore/security/rules-conditions), [Firestore quotas](https://firebase.google.com/docs/firestore/quotas), [Transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [Rules String/RE2](https://firebase.google.com/docs/reference/rules/rules.String).

# Danh mục rule

Mỗi rule: dấu hiệu nhận biết → vì sao sai → cách sửa. Đi hết danh mục, đừng nhớ mò.

## RQ — React Query v5

**RQ-01 · Query key thiếu dependency**
Mọi biến mà `queryFn` đọc phải nằm trong key. Đối chiếu `src/features/*/hooks/*Keys.ts`
với `queryFn` tương ứng. Thiếu → hai bộ filter khác nhau dùng chung một cache entry.

**RQ-02 · Query key rải rác**
Key phải sinh từ factory tập trung (`recipeKeys`), không viết `["recipes", ...]` trực tiếp
trong component/hook. Rải rác → invalidate không bao giờ khớp hết.

**RQ-03 · Chuẩn hoá giá trị trước khi vào key**
Chuỗi từ input phải `trim()` (và thường `toLowerCase()`) trước khi vào key, nếu server
coi chúng như nhau. `"gà"` vs `"gà "` → 2 cache entry + 2 request cho cùng kết quả.

**RQ-04 · Phạm vi invalidate**
Sau mutation, invalidate hẹp nhất mà vẫn đủ: `lists()` chứ không `all`. Nhắm `all` làm
refetch cả những detail đang mở không liên quan.

**RQ-05 · Cache của item vừa xoá / vừa sửa**
Xoá → `removeQueries(detail(id))`. Sửa → `setQueryData(detail(id), data)` rồi invalidate
lists. Kiểm tra `id` truyền vào thực sự có giá trị (xem ZOD-01: nếu response không parse,
`id` có thể `undefined` → xoá sai entry hoặc không xoá gì).

**RQ-06 · Optimistic update**
Có `onMutate` thì bắt buộc: `cancelQueries` → snapshot → `setQueryData` → `onError` rollback
bằng snapshot → `onSettled` invalidate. Thiếu `onError` → UI giữ dữ liệu sai vĩnh viễn.

**RQ-07 · QueryClient phía server**
Không được có instance global dùng chung giữa request. Server phải qua `cache()`
(`src/lib/react-query/getQueryClient.ts`); client phải `useState(() => makeQueryClient())`
trong Providers. Sai → rò rỉ dữ liệu giữa các user.

**RQ-08 · SSR prefetch**
`prefetchQuery` phải dùng ĐÚNG key mà client dùng, và `queryFn` prefetch nên đi qua cùng
đường validate như client (xem ZOD-02). Bọc bằng `HydrationBoundary state={dehydrate(qc)}`.
Key lệch một ký tự → client vẫn fetch lại, mất sạch công prefetch.

**RQ-09 · Nhánh trạng thái đầy đủ**
Mỗi chỗ render query phải xử lý `isPending`, `isError`, dữ liệu rỗng, và có dữ liệu.
Đặc biệt: `if (isPending || !data) return <Loading/>` mà bỏ `isError` → spinner chạy mãi,
user không có nút thử lại.

**RQ-10 · `placeholderData` / `keepPreviousData`**
Đang giữ dữ liệu cũ thì khi query mới lỗi, đừng thay cả màn hình bằng `ErrorState` —
hiện banner lỗi trên đầu danh sách cũ. Nếu không thì `keepPreviousData` vô nghĩa.

## ZU — Zustand

**ZU-01 · `persist` + SSR phải `skipHydration`**
`persist` mặc định đọc `localStorage` đồng bộ ngay khi tạo store → render đầu ở client
khác HTML server → hydration mismatch, React bỏ HTML server dựng lại từ đầu.
Bắt buộc `skipHydration: true` + gọi `persist.rehydrate()` một lần trong `useEffect`
ở Providers.

**ZU-02 · Không copy store ra state cục bộ**
`useState(storeValue)` là sai khi store có `persist`: lúc mount store còn là giá trị mặc
định. Phải DẪN XUẤT: `const [draft, setDraft] = useState<T | null>(null)` rồi
`const value = draft ?? storeValue`.

**ZU-03 · Effect không được ghi vào store khi user chưa thao tác**
`persist` ghi `localStorage` sau MỌI lần `set`, kể cả set cùng giá trị. Một effect đẩy
state cục bộ vào store lúc mount sẽ ghi giá trị mặc định lên dữ liệu đã lưu, xoá mất nó.
Guard bằng "user đã thao tác chưa" (`draft === null → return`), KHÔNG guard bằng so sánh
với `getState()` — StrictMode chạy effect hai lượt và lượt sau có thể rơi vào sau
`rehydrate`, lúc đó so sánh thấy khác nhau và ghi đè thật. Xem `verify.md`.

**ZU-04 · Selector phải hẹp**
`useStore((s) => s.field)` từng field. Selector trả về object/array mới mỗi lần gọi
(`(s) => ({a: s.a, b: s.b})`) → re-render mọi lần store đổi bất cứ thứ gì.

**ZU-05 · Không dùng `get()` để đọc trong lúc render**
Getter kiểu `isFavorite: (id) => get().x.includes(id)` gọi trong render KHÔNG subscribe →
component không re-render khi dữ liệu đổi. Đọc bằng selector.

**ZU-06 · Chỉ chứa client state**
Danh sách/chi tiết từ server thuộc React Query. Store chỉ giữ tuỳ chọn hiển thị, bộ lọc,
đánh dấu cục bộ. Server state trong store → hai nguồn sự thật, lệch nhau.

**ZU-07 · Action reset phải đồng bộ được state cục bộ**
`resetFilters()` đổi store nhưng ô input đang giữ `draft` riêng sẽ không đổi theo. Nếu
action reset được wire vào UI, phải xoá `draft` về `null`.

## ZOD

**ZOD-01 · Parse mọi dữ liệu vào/ra**
Response từ API và body request đều phải parse. Bỏ sót MỘT hàm là đủ gây bug: response
không parse → field mong đợi có thể `undefined` mà TypeScript vẫn tin là có.

**ZOD-02 · Server và client cùng một đường validate**
SSR prefetch gọi thẳng data layer thì vẫn nên parse bằng cùng schema client dùng, nếu
không hai bên có thể chấp nhận hai shape khác nhau cho cùng một query key.

**ZOD-03 · `safeParse` cho lỗi hiển thị ra user**
`.parse()` ném `ZodError`, message là một khối JSON dài. Chỗ nào lỗi được in ra UI thì
`safeParse` rồi `throw new Error("thông báo tiếng Việt dễ hiểu")`.

**ZOD-04 · Type suy ra từ schema**
`z.infer<typeof schema>`, không khai `interface` song song — hai chỗ sẽ lệch nhau.

## NX — Next.js 16

**NX-01 · State module dùng chung giữa các bundle layer**
Module được import từ cả Server Component (layer `rsc`) và route handler (layer `app-route`)
sẽ bị bundle RIÊNG → biến module-scope có hai bản độc lập. State dùng chung phải gắn vào
`globalThis` qua một object bọc ngoài. Đây là nguồn của bug P0 đã gặp.

**NX-02 · Ranh giới `"use client"`**
Component dùng hook/Context/event handler phải có `"use client"`. Ngược lại, đừng gắn
`"use client"` cho file chỉ chứa logic thuần — nó kéo cả cây phụ thuộc sang bundle client.

**NX-03 · Đối chiếu tài liệu trước khi kết luận về API Next**
Next 16 có breaking change so với kiến thức có sẵn. Trước khi báo một finding về API Next
(`params`, caching, `fetch`, route config...), đọc `node_modules/next/dist/docs/` để xác
nhận. Không kết luận từ ký ức.

## A11Y

**A11Y-01 · `id` trùng trong cùng DOM**
`<label htmlFor>` resolve về phần tử ĐẦU TIÊN có `id` đó. Modal không dùng portal thì
form trong modal và filter phía sau cùng tồn tại → click label trong modal lại điều khiển
control bị overlay che. Dùng `useId()` hoặc tiền tố `filter-` / `form-`.

**A11Y-02 · Thao tác được bằng bàn phím**
`<div onClick>` không focus/enter được. Dùng `<button>`, hoặc `role="button"` + `tabIndex={0}`
+ `onKeyDown`.

**A11Y-03 · Label và trạng thái**
Input có label gắn đúng; nút chỉ có icon phải có `aria-label`; trạng thái đang tải/lỗi
phải đọc được, không chỉ thể hiện bằng màu.

## PERF

**PERF-01 · Props mới mỗi render truyền vào component đã memo**
Object/array/hàm khởi tạo inline làm `React.memo` vô hiệu. Chỉ là finding khi component
nhận props đó THỰC SỰ được memo hoá — nếu không, đây là tối ưu non.

**PERF-02 · Tính toán nặng trong render**
Lọc/sắp xếp danh sách lớn mỗi render → `useMemo` với dependency đúng. Danh sách nhỏ thì
bỏ qua, đừng báo cáo.

**PERF-03 · Đối chiếu `doc/web-performance/`**
Repo có sẵn doc về re-render, memo hoá, danh sách lớn. Finding về hiệu năng nên dẫn về
đúng mục trong doc đó để người đọc tra tiếp.

## CONV — Convention repo

**CONV-01** Cấu trúc `src/features/<feature>/{api,hooks,components,schemas,types}`;
primitive dùng chung ở `src/components/ui/`; helper ở `src/lib/`.
**CONV-02** Mỗi query/mutation một custom hook một file.
**CONV-03** Tailwind v4 dùng token trong `src/app/globals.css`, không hardcode mã màu;
ghép class bằng `cn()`.

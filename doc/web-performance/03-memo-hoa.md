# 03. Memo hóa: `React.memo`, `useMemo`, `useCallback`, React Compiler

Ba công cụ "ghi nhớ" để tránh làm lại việc thừa. **Cảnh báo trước:** đừng rải chúng khắp nơi —
dùng sai còn chậm hơn. Đọc hết file này để biết **khi nào** mới dùng.

## `React.memo` — ghi nhớ kết quả render của component

Bọc một component → nó **bỏ qua re-render** nếu props **không đổi** (so sánh nông).

```tsx
const RecipeCard = React.memo(function RecipeCard({ recipe, onOpen }) { ... });
```

Giờ khi cha re-render mà `recipe` và `onOpen` giữ nguyên → `RecipeCard` **không** render lại.

### ⚠️ Cái bẫy: props là object/hàm tạo mới mỗi lần

`React.memo` so sánh **nông** (`===`). Object/mảng/hàm tạo inline sẽ **khác tham chiếu** mỗi lần
render → memo **vô dụng**:

```tsx
// ❌ onOpen là hàm mới mỗi lần Parent render → RecipeCard vẫn re-render dù đã memo
<RecipeCard recipe={r} onOpen={() => open(r.id)} />

// ❌ style là object mới mỗi lần
<RecipeCard recipe={r} style={{ margin: 8 }} />
```

→ Phải ổn định các prop này bằng `useCallback` / `useMemo` (bên dưới) thì `React.memo` mới có tác dụng.

## `useCallback` — ghi nhớ một HÀM

Giữ **cùng một tham chiếu hàm** giữa các lần render (miễn dependency không đổi):

```tsx
const handleOpen = useCallback((id: string) => setDetailId(id), []);
// truyền handleOpen xuống <RecipeCard memo> → tham chiếu ổn định → memo hiệu quả
```

## `useMemo` — ghi nhớ một GIÁ TRỊ (kết quả tính toán)

Chỉ tính lại khi dependency đổi:

```tsx
// Lọc/sắp xếp nặng trên danh sách lớn → đừng tính lại mỗi lần render
const sorted = useMemo(
  () => recipes.slice().sort((a, b) => a.cookTimeMinutes - b.cookTimeMinutes),
  [recipes],
);
```

Cũng dùng để **ổn định object props** truyền xuống component đã memo:
```tsx
const filters = useMemo(() => ({ search, cuisine }), [search, cuisine]);
```

## Khi nào NÊN dùng (và khi nào KHÔNG)

**NÊN memo hóa khi:**
- Component render **tốn thời gian thật** (Profiler xác nhận) và re-render thường xuyên.
- Danh sách nhiều item (mỗi card memo → chỉ item đổi mới render).
- Tính toán **nặng** (sort/filter/format nghìn phần tử).
- Ổn định props cho một component con **đã** `React.memo`.

**KHÔNG cần / đừng lạm dụng khi:**
- Component nhẹ (vài div) → memo còn tốn hơn tự render.
- Giá trị tính nhanh (cộng vài số) → `useMemo` vô ích.
- Rải `useCallback` cho mọi hàm dù con không hề memo → chỉ thêm rác, không lợi.

> Quy tắc: **memo hóa là để bổ trợ cho `React.memo`/dependency, không phải rải bừa.** Mỗi memo
> tốn bộ nhớ + một phép so sánh. Không có bằng chứng chậm thì đừng thêm.

## React Compiler (React 19) — thay đổi cuộc chơi

React 19 có **React Compiler**: một trình biên dịch **tự động memo hóa** component và giá trị ở
mức tối ưu, **không cần** bạn viết `useMemo`/`useCallback`/`React.memo` thủ công.

- Bật qua plugin biên dịch (babel/swc) — là **opt-in**, chưa mặc định.
- Khi bật, phần lớn re-render thừa được xử lý tự động → code sạch hơn, ít memo tay.
- Vẫn phải viết code "đúng luật" (component thuần, không side-effect khi render) để compiler
  phân tích được.

**Chiến lược thực tế:**
1. Nếu dự án **đã bật** React Compiler → hạn chế memo tay, để compiler lo; chỉ can thiệp khi
   Profiler chỉ ra điểm compiler bỏ sót.
2. Nếu **chưa bật** → dùng `React.memo`/`useMemo`/`useCallback` có chọn lọc theo hướng dẫn trên.

> Kiểm tra dự án đã bật chưa: tìm cấu hình `reactCompiler` / `babel-plugin-react-compiler` trong
> `next.config`. Recipe Planner hiện **chưa** bật.

## Tóm tắt

| Công cụ | Ghi nhớ cái gì | Dùng khi |
|---|---|---|
| `React.memo` | Kết quả render của component | Con hay bị cha ép render dù props không đổi |
| `useCallback` | Một hàm | Truyền hàm xuống con đã `React.memo` |
| `useMemo` | Một giá trị tính toán | Tính toán nặng, hoặc ổn định object props |
| React Compiler | Tự động tất cả | React 19, bật plugin → khỏi memo tay |

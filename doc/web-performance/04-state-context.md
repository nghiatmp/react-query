# 04. State & Context: tổ chức để render ít nhất

Cách **đặt state ở đâu** ảnh hưởng đến số component phải re-render nhiều hơn cả memo. Đây là tối
ưu "kiến trúc" — tác động lớn, không tốn memo.

## Nguyên tắc 1: Đặt state càng THẤP càng tốt (colocation)

State chỉ nên sống ở component **gần nhất** cần nó. State càng ở cao, re-render lan càng rộng.

```tsx
// ❌ search state ở cha → gõ 1 phím, CẢ trang (list, header...) re-render
function Page() {
  const [search, setSearch] = useState("");
  return <><SearchBox value={search} onChange={setSearch} /><HugeList /></>;
}

// ✅ nhốt search vào chính SearchBox → gõ phím chỉ SearchBox re-render
function SearchBox() {
  const [search, setSearch] = useState("");
  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
}
```

> Trong Recipe Planner, search/filter để ở **Zustand** (không phải state ở `RecipesPage`). Nhờ đó
> chỉ component **đọc** slice đó mới re-render, không phải cả cây. Xem
> [../react-query/07-zustand.md](../react-query/07-zustand.md).

## Nguyên tắc 2: Tách state độc lập ra khỏi nhau

Gom nhiều thứ không liên quan vào một state/một component → đổi cái này kéo cái kia render. Tách ra.

## Cạm bẫy Context: đổi value → MỌI consumer re-render

`Context` tiện nhưng nguy hiểm cho hiệu năng: khi `value` của Provider đổi, **tất cả** component
dùng `useContext` đều re-render, dù chỉ quan tâm một phần nhỏ.

```tsx
// ❌ user và theme chung 1 context → đổi theme, component chỉ cần user cũng re-render
<AppContext.Provider value={{ user, theme, setTheme }}>
```

**Cách giảm đau:**

1. **Tách nhỏ context** theo tần suất đổi: `UserContext` (ít đổi) tách khỏi `ThemeContext` (hay đổi).
2. **Ổn định `value`** bằng `useMemo` để không tạo object mới mỗi render:
   ```tsx
   const value = useMemo(() => ({ user, logout }), [user]);
   ```
3. **Dùng thư viện selector** (Zustand, Jotai...) thay vì Context cho state hay đổi — chúng cho
   phép "đăng ký" đúng slice, chỉ re-render khi slice đó đổi. Đây là lý do dự án dùng Zustand.

> Ghi nhớ: `QueryClientProvider` (React Query) an toàn — `value` là instance ổn định, không gây
> re-render hàng loạt.

## Nguyên tắc 3: Đừng lưu state có thể "tính ra được" (derived state)

Nếu một giá trị **suy ra được** từ state/props khác thì **tính trực tiếp**, đừng tạo state mới +
`useEffect` đồng bộ (vừa thừa render, vừa dễ lệch).

```tsx
// ❌ thừa: state + effect
const [filtered, setFiltered] = useState([]);
useEffect(() => setFiltered(recipes.filter(...)), [recipes]);

// ✅ tính thẳng khi render (bọc useMemo nếu nặng)
const filtered = useMemo(() => recipes.filter(...), [recipes]);
```

## React 19: `useTransition` & `useDeferredValue` — giữ UI mượt khi update nặng

Khi một cập nhật gây render nặng (lọc danh sách lớn theo từ khóa), React 19 cho phép đánh dấu nó
là **không khẩn cấp** để không chặn thao tác gõ.

### `useDeferredValue` — "trì hoãn" một giá trị
```tsx
const deferredSearch = useDeferredValue(search);
// input dùng `search` (cập nhật ngay, gõ mượt)
// danh sách lọc theo `deferredSearch` (React hoãn lại, ưu tiên gõ)
const results = useMemo(() => bigFilter(items, deferredSearch), [items, deferredSearch]);
```

### `useTransition` — đánh dấu update nền
```tsx
const [isPending, startTransition] = useTransition();
function onChange(e) {
  setSearch(e.target.value);                 // khẩn cấp: cập nhật ô input ngay
  startTransition(() => setQuery(e.target.value)); // không khẩn cấp: cập nhật kết quả sau
}
// dùng isPending để hiện mờ/spinner nhẹ trong lúc chờ
```

→ Kết quả: ô input **không giật** dù danh sách phía dưới đang tính nặng. Cực hợp cho search/filter
real-time trên dữ liệu lớn.

## Áp dụng cho Recipe Planner

- Search hiện gọi API qua React Query (server lọc) nên không nặng client. Nhưng **nếu** chuyển
  sang lọc client trên danh sách lớn → bọc `useDeferredValue` cho từ khóa.
- Nút tim ♥ đã tối ưu bằng Zustand selector (chỉ card liên quan re-render).

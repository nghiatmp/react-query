# 04. Query Keys & Query Key Factory

## Query key là gì?

React Query lưu cache theo **key** — giống key trong một `Map`. Mỗi query phải có key để
React Query biết "data này là của cái gì".

```ts
useQuery({ queryKey: ["recipes", "list", { search: "", cuisine: "all" }], queryFn: ... })
//                    └──────────────── KEY (một mảng) ──────────────────┘
```

React Query so sánh key bằng cách **băm thành JSON** (deep, ổn định), nên:

- `["recipe","r1"]` và `["recipe","r1"]` → **cùng một cache** (dù là 2 mảng khác nhau trong RAM).
- `["recipe","r1"]` và `["recipe","r2"]` → **hai cache riêng biệt**.
- Thứ tự khóa trong object **không** quan trọng: `{a:1,b:2}` băm bằng `{b:2,a:1}`.

Key vừa là "địa chỉ" lưu/lấy cache, vừa là thứ dùng để **invalidate** (xem file 05).

### Data trong key sẽ tạo cache riêng

Vì filter nằm trong key `["recipes","list",filters]`, mỗi bộ filter khác nhau = một cache riêng:

```
["recipes","list",{cuisine:"all"}]      → cache danh sách tất cả
["recipes","list",{cuisine:"italian"}]  → cache danh sách món Ý
```

Đổi filter → key đổi → React Query tự fetch cho bộ filter mới, đồng thời **vẫn giữ** cache cũ
(để quay lại thì hiện ngay). Đây là lý do `useRecipes` nhận `filters` làm tham số.

## Vấn đề nếu gõ key bằng tay

```ts
// file A
useQuery({ queryKey: ["recipes", "list", filters], ... })
// file B — lỡ gõ thiếu 's'
queryClient.invalidateQueries({ queryKey: ["recipe", "list"] })  // ❌ sai → không trúng cache nào
```

Gõ sai một ký tự = invalidate trượt, cache không được làm mới, UI hiện data cũ mà **không báo lỗi**.
Rất khó phát hiện. Giải pháp: **query key factory**.

## Query key factory

File `src/features/recipes/hooks/recipeKeys.ts`:

```ts
export const recipeKeys = {
  all: ["recipes"] as const,

  lists: () => [...recipeKeys.all, "list"] as const,
  list: (filters: RecipeFilters) => [...recipeKeys.lists(), filters] as const,

  details: () => [...recipeKeys.all, "detail"] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
};
```

Đây chỉ là một object chứa các hàm nhỏ, mỗi hàm **trả về một mảng key**. Giá trị thực tế:

```ts
recipeKeys.all              // ["recipes"]
recipeKeys.lists()          // ["recipes", "list"]
recipeKeys.list(filters)    // ["recipes", "list", { search:"", cuisine:"all" }]
recipeKeys.details()        // ["recipes", "detail"]
recipeKeys.detail("r1")     // ["recipes", "detail", "r1"]
```

### `...` (spread) làm gì?

"Trải" mảng cũ ra rồi nối thêm phần mới → key con luôn **bắt đầu bằng** key cha:

```ts
lists: () => [...recipeKeys.all, "list"]
//            └─ ["recipes"] trải ra ─┘ + "list" = ["recipes","list"]

list: (filters) => [...recipeKeys.lists(), filters]
//                  └─ ["recipes","list"] ─┘ + filters = ["recipes","list",filters]
```

Lợi ích: đổi `"recipes"` → `"recipe"` chỉ cần sửa **một chỗ** (`all`), mọi key con tự đổi theo.

### `as const` làm gì?

Nói với TypeScript: "mảng này cố định". Giúp key có kiểu tuple chính xác thay vì `string[]`
chung chung → gợi ý và bắt lỗi tốt hơn. **Không** ảnh hưởng lúc chạy thật, chỉ cho TS.

## Cấu trúc phân cấp & khớp theo prefix

`invalidateQueries` (và `removeQueries`, `refetchQueries`...) khớp theo **tiền tố (prefix)**:
một query dính nếu key của nó **bắt đầu bằng** key bạn đưa vào, so từ trái sang phải.

Hình dung key như địa chỉ phân cấp `Quận → Phường → Nhà`:

```
["recipes",  "list",   {cuisine:"all"}]
    Quận      Phường        Nhà
```

Giả sử cache đang có 3 key:

```
A: ["recipes", "list",   {cuisine:"all"}]
B: ["recipes", "list",   {cuisine:"italian"}]
C: ["recipes", "detail", "r1"]
```

| Lệnh | Khớp | Giải thích |
|---|---|---|
| `invalidateQueries({ queryKey: ["recipes"] })` | A, B, C | cả 3 đều bắt đầu bằng `"recipes"` |
| `invalidateQueries({ queryKey: ["recipes","list"] })` | A, B | C có phần tử 2 là `"detail"` ≠ `"list"` |
| `invalidateQueries({ queryKey: ["recipes","detail","r1"] })` | C | khớp đủ cả 3 phần tử |

→ **Key càng ngắn = quét càng rộng; key càng dài = càng khoanh hẹp.** Bạn chủ động chọn
phạm vi làm mới chỉ bằng cách cho key ngắn hay dài.

Đây là lý do factory chia tầng `all / lists / list / details / detail`: để lấy được key ở
đúng độ rộng mong muốn. Cách các mutation tận dụng điều này: xem [05-mutations-va-cache.md](05-mutations-va-cache.md).

## Query key trong dự án

| Mục đích | Key | Hook |
|---|---|---|
| Danh sách theo filter | `["recipes","list",filters]` | `useRecipes` |
| Chi tiết theo id | `["recipes","detail",id]` | `useRecipe` |

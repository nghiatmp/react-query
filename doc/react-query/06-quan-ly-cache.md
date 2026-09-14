# 06. Quản lý cache: ở đâu, sống bao lâu, reload có mất không

## Cache nằm ở đâu?

Trong **RAM (bộ nhớ tạm) của tab trình duyệt** — bên trong object `QueryClient` tạo ở
`providers.tsx`. Nó là một object JavaScript, kiểu như một cái `Map` khổng lồ:

```
QueryClient
  └─ QueryCache  (một Map trong RAM)
       ["recipes","list",{all}]     → { data: [...], status, dataUpdatedAt, ... }
       ["recipes","detail","r1"]    → { data: {...}, ... }
```

**KHÔNG** phải localStorage, **KHÔNG** phải cookie, **KHÔNG** ghi ra đĩa. Chỉ sống trong RAM.

## Khi nào cache biến mất?

### a) Reload / đóng tab → mất hết ngay lập tức

Reload = trình duyệt vứt toàn bộ JS đang chạy, khởi động lại từ đầu. `providers.tsx` chạy lại
`useState(() => makeQueryClient())` → tạo `QueryClient` **mới, cache rỗng**.

→ Đó là lý do sau khi F5, mở trang chủ lại thấy spinner một nhịp: cache trống, phải fetch lại.

### b) Không reload nhưng vẫn tự biến mất — do `gcTime`

Đây là chỗ hay nhầm. Có **2 mốc thời gian khác nhau**, cấu hình trong `queryClient.ts`:

| | `staleTime` (đặt 60s) | `gcTime` (đặt 5 phút) |
|---|---|---|
| Nghĩa | Data còn "tươi" bao lâu | Cache được **giữ trong RAM** bao lâu sau khi **hết ai dùng** |
| Hết hạn thì | Đánh dấu **stale** — data **vẫn còn**, lần dùng sau sẽ refetch | **Xóa hẳn** data khỏi RAM (garbage collection) |
| Đếm từ khi nào | Từ lúc fetch xong | Từ lúc query thành **inactive** |

**Diễn giải `staleTime`:** trong 60s sau khi fetch, data được coi là còn mới → React Query
**không** refetch, dùng thẳng cache (UI mượt). Quá 60s → stale → lần tới có trigger (mount lại,
focus, invalidate...) sẽ fetch lại. `staleTime` **không xóa** data, chỉ đánh dấu.

**Diễn giải `gcTime`:** khi một query không còn component nào hiển thị (inactive), React Query
**chưa xóa ngay** — giữ lại 5 phút phòng khi bạn quay lại. Quá 5 phút vẫn không ai dùng → xóa.

Ví dụ: mở chi tiết r1 (fetch, cache) → đóng modal (query r1 inactive) →
- Mở lại trong 5 phút: data hiện **ngay** (còn cache).
- Mở lại sau 5 phút: phải **fetch lại** (đã bị GC xóa).

### c) Xóa thủ công bằng code

`removeQueries` (xóa nhóm khớp key), `resetQueries` (về trạng thái đầu), hoặc
`queryClient.clear()` (xóa **sạch** toàn bộ).

## Vòng đời một query (fresh → stale → inactive → GC)

```
fetch xong ──▶ FRESH ──(sau staleTime)──▶ STALE
                                            │
              (component dùng nó unmount)   ▼
                                         INACTIVE ──(sau gcTime không ai dùng)──▶ bị XÓA
```

- **Fresh**: data mới, không refetch.
- **Stale**: data cũ, sẽ refetch khi có cơ hội, nhưng **vẫn hiển thị được**.
- **Inactive**: không component nào dùng, đang chờ GC.

Bật React Query Devtools để nhìn trực tiếp các trạng thái này đổi màu.

## So sánh với Zustand — điểm mấu chốt

App có **2 loại bộ nhớ** hành xử khác nhau khi reload:

| | React Query cache | Zustand store |
|---|---|---|
| Lưu ở đâu | RAM | **localStorage** (nhờ `persist`) |
| Reload có mất? | ✅ **Mất** | ❌ **Còn** |
| Chứa gì | Server state: danh sách, chi tiết recipe | Client state: filter, viewMode, **favorites** |

**Thử nghiệm:** bấm tim ♥ vài món rồi **F5**. Danh sách recipe load lại (cache RQ mất),
nhưng các món tim vẫn đỏ (Zustand đọc lại từ localStorage). Đây chính là lý do favorites để ở
Zustand chứ không phải React Query. Xem [07-zustand.md](07-zustand.md).

## Muốn cache RQ sống sót qua reload?

Có plugin `persistQueryClient` (`@tanstack/query-persist-client-core`) để ghi cache xuống
localStorage/IndexedDB và khôi phục khi mở lại. **Mặc định tắt** — vì server state thường muốn
tươi mới mỗi lần vào, không nên "đông lạnh" data cũ. Chỉ bật khi cần offline hoặc muốn mở trang
tức thì với data lần trước.

## Tóm tắt

- Cache RQ ở **RAM** → **reload là mất**, hoặc tự bị dọn sau `gcTime` khi không dùng.
- `staleTime` = khi nào coi data là cũ (không xóa). `gcTime` = khi nào xóa khỏi RAM.
- Thứ sống sót qua reload là **Zustand** (localStorage), không phải React Query.

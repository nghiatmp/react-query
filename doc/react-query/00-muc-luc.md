# 📚 Tài liệu học React Query qua Recipe Planner

Bộ tài liệu này tổng hợp kiến thức về **React Query (TanStack Query) v5**, **Zustand** và **Zod**
trong bối cảnh dự án Recipe Planner (Next.js 16 App Router).

Đọc theo thứ tự dưới đây để đi từ nền tảng đến nâng cao.

## Thứ tự đọc

| # | File | Nội dung |
|---|------|----------|
| 01 | [01-tong-quan-kien-truc.md](01-tong-quan-kien-truc.md) | Tech stack, cấu trúc thư mục, 3 thư viện phối hợp thế nào |
| 02 | [02-server-vs-client-state.md](02-server-vs-client-state.md) | Phân biệt server state / client state, `"use client"` đặt đúng chỗ |
| 03 | [03-react-query-co-ban.md](03-react-query-co-ban.md) | QueryClient, Provider, `useQuery`, các trạng thái loading/error/empty |
| 04 | [04-query-keys.md](04-query-keys.md) | Query key là gì, query key factory, khớp theo prefix |
| 05 | [05-mutations-va-cache.md](05-mutations-va-cache.md) | `useMutation`, cập nhật cache: invalidate / setQueryData / removeQueries |
| 06 | [06-quan-ly-cache.md](06-quan-ly-cache.md) | Cache nằm ở đâu, `staleTime` vs `gcTime`, reload có mất không |
| 07 | [07-zustand.md](07-zustand.md) | Global client state, middleware `persist` |
| 08 | [08-zod.md](08-zod.md) | Validate API & form, suy ra type từ schema |
| 09 | [09-ssr-prefetch.md](09-ssr-prefetch.md) | SSR prefetch, `dehydrate`/`hydrate`, vì sao mỗi request 1 client |
| 10 | [10-api-tham-khao.md](10-api-tham-khao.md) | Danh sách đầy đủ hook & method của React Query v5 |
| 11 | [11-tips-va-luu-y.md](11-tips-va-luu-y.md) | ⭐ Tip thực chiến, lỗi hay gặp, best practice, checklist |

## Tóm tắt một dòng cho từng thư viện

- **React Query** = quản lý **server state** (dữ liệu từ API): fetch, cache, đồng bộ, làm mới.
- **Zustand** = quản lý **client state** (tùy chọn của người dùng): filter, view mode, favorites.
- **Zod** = **nguồn chân lý** về hình dạng dữ liệu: validate API/form + suy ra TypeScript type.

## Phiên bản dùng trong dự án

| Thư viện | Version |
|---|---|
| next | 16.3.3 |
| react | 19.2 |
| @tanstack/react-query | 5.102.4 |
| zustand | 5.0.15 |
| zod | 4.4.3 |

> Tài liệu viết theo đúng các version trên. API có thể khác ở version cũ hơn.

import { cache } from "react";
import { makeQueryClient } from "./queryClient";

/**
 * QueryClient DÀNH RIÊNG CHO SERVER (dùng trong Server Component để prefetch).
 *
 * `cache()` của React đảm bảo: trong CÙNG MỘT request, dù gọi getQueryClient()
 * nhiều lần cũng chỉ nhận về ĐÚNG 1 instance (tránh tạo trùng, tránh fetch lặp).
 * Sang request khác (người dùng khác) -> React tạo instance MỚI hoàn toàn.
 *
 * => Đây chính là chỗ "mỗi request một client riêng" mà ta đã nói:
 *    khay của khách A không lẫn với khay của khách B, xong request là bỏ.
 */
export const getQueryClient = cache(() => makeQueryClient());

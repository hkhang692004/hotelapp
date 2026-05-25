import { createContext } from "react";

// user: null = chưa đăng nhập, object = đã đăng nhập
export const MyUserContext = createContext();

// [unreadCount, setUnreadCount] — badge số thông báo chưa đọc
export const NotifUnreadContext = createContext([0, () => {}]);

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthDispatch, navigationReset } from "./NavigationService";

export const BASE_URL = "http://10.0.2.2:8000/api/v1";
const OAUTH_BASE_URL = "http://10.0.2.2:8000";
const OAUTH_CLIENT_ID = process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.EXPO_PUBLIC_OAUTH_CLIENT_SECRET;

export const endpoints = {
    // Auth
    login: "/auth/login/",
    register: "/auth/register/",
    logout: "/auth/logout/",
    me: "/auth/me/",
    avatar: "/auth/me/avatar/",
    forgotPassword: "/auth/password/forgot/",
    resetPassword: "/auth/password/reset/",
    changePassword: "/auth/password/change/",
    tokenRefresh: "/auth/token/refresh/",

    // Rooms
    roomTypes: "/room-types/",
    roomTypeDetail: (id) => `/room-types/${id}/`,
    roomAvailability: "/rooms/availability/",

    // Bookings
    bookings: "/bookings/",
    bookingDetail: (id) => `/bookings/${id}/`,
    bookingConfirm: (id) => `/bookings/${id}/confirm/`,
    bookingCancel: (id) => `/bookings/${id}/cancel/`,
    bookingCheckin: (id) => `/bookings/${id}/check-in/`,
    bookingCheckout: (id) => `/bookings/${id}/check-out/`,
    bookingStatusHistory: (id) => `/bookings/${id}/status-history/`,

    // Payments
    payments: "/payments/",
    paymentDetail: (id) => `/payments/${id}/`,

    // Invoices
    invoices: "/invoices/",
    invoiceDetail: (id) => `/invoices/${id}/`,

    // Services
    serviceCategories: "/service-categories/",
    services: "/services/",
    serviceOrders: "/service-orders/",
    serviceOrderDetail: (id) => `/service-orders/${id}/`,
    serviceOrderConfirm: (id) => `/service-orders/${id}/confirm/`,
    serviceOrderCancel: (id) => `/service-orders/${id}/cancel/`,

    // Housekeeping
    housekeepingTasks: "/housekeeping/tasks/",
    housekeepingTaskDetail: (id) => `/housekeeping/tasks/${id}/`,
    housekeepingTaskLogs: (id) => `/housekeeping/tasks/${id}/logs/`,
    housekeepingHistory: "/housekeeping/history/",

    // Notifications
    notifications: "/notifications/",
    notificationRead: (id) => `/notifications/${id}/read/`,
    notificationReadAll: "/notifications/read-all/",
};

// Tạo instance axios có xác thực, tự động refresh khi token hết hạn
export const authApis = (token) => {
    const instance = axios.create({
        baseURL: BASE_URL,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    instance.interceptors.response.use(
        (res) => res,
        async (err) => {
            const original = err.config;

            // Chỉ xử lý 401 và không retry lần 2
            if (err.response?.status === 401 && !original._retry) {
                original._retry = true;
                try {
                    const refresh = await AsyncStorage.getItem("refresh_token");
                    if (!refresh) throw new Error("no refresh token");

                    const refreshRes = await axios.post(
                        `${OAUTH_BASE_URL}/o/token/`,
                        new URLSearchParams({
                            grant_type: "refresh_token",
                            refresh_token: refresh,
                            client_id: OAUTH_CLIENT_ID,
                            client_secret: OAUTH_CLIENT_SECRET,
                        }).toString(),
                        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
                    );
                    const newAccess = refreshRes.data.access_token;
                    if (!newAccess) throw new Error("no new access token");

                    await AsyncStorage.setItem("access_token", newAccess);

                    const dispatch = getAuthDispatch();
                    if (dispatch)
                        dispatch({ type: "UPDATE_USER", payload: { token: newAccess } });

                    // Retry request gốc với token mới
                    original.headers["Authorization"] = `Bearer ${newAccess}`;
                    return instance(original);
                } catch {
                    // Refresh thất bại → xoá token, logout, về login
                    await AsyncStorage.multiRemove(["access_token", "refresh_token"]);
                    const dispatch = getAuthDispatch();
                    if (dispatch) dispatch({ type: "LOGOUT" });
                    navigationReset("login");
                }
            }

            return Promise.reject(err);
        }
    );

    return instance;
};

export default axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Đăng nhập qua OAuth2 password grant, trả về {access, refresh, user}
export const oauthLogin = async (email, password) => {
    try {
        const tokenRes = await axios.post(
            `${OAUTH_BASE_URL}/o/token/`,
            new URLSearchParams({
                grant_type: "password",
                username: email,
                password,
                client_id: OAUTH_CLIENT_ID,
                client_secret: OAUTH_CLIENT_SECRET,
                scope: "read write",
            }).toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        const access = tokenRes.data.access_token;
        const refresh = tokenRes.data.refresh_token;

        // Lấy thông tin user
        const meRes = await axios.get(`${BASE_URL}${endpoints.me}`, {
            headers: { Authorization: `Bearer ${access}` },
        });
        const user = meRes.data?.data ?? meRes.data;
        return { access, refresh, user };
    } catch (err) {
        // Chuyển đổi lỗi OAuth2 sang định dạng ứng dụng mong đợi
        const oauthError = err?.response?.data;
        if (oauthError?.error) {
            const wrapped = new Error(oauthError.error_description || "Đăng nhập thất bại");
            wrapped.response = {
                data: {
                    error: {
                        message: oauthError.error_description || "Email hoặc mật khẩu không đúng",
                        details: {},
                    },
                },
            };
            throw wrapped;
        }
        throw err;
    }
};

// Thu hồi token khi đăng xuất
export const oauthLogout = async (refreshToken) => {
    if (!refreshToken) return;
    try {
        await axios.post(
            `${OAUTH_BASE_URL}/o/revoke_token/`,
            new URLSearchParams({
                token: refreshToken,
                client_id: OAUTH_CLIENT_ID,
                client_secret: OAUTH_CLIENT_SECRET,
            }).toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
    } catch {
        // Bỏ qua lỗi revoke
    }
};

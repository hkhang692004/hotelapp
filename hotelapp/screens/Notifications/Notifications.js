import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { MyUserContext, NotifUnreadContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";

const TYPE_ICON = {
    booking_confirmed: { icon: "calendar-check-outline", color: "#7FB069" },
    payment_received:  { icon: "cash-check",             color: "#7FB069" },
    booking_cancelled: { icon: "calendar-remove-outline", color: "#E05252" },
    room_ready:        { icon: "bed-outline",            color: "#5B9BD5" },
    housekeeping:      { icon: "broom",                  color: "#C9A84C" },
    general:           { icon: "bell-outline",           color: "#C9A84C" },
};

const formatNotifTime = (item) => {
    const raw = item.sent_at || item.created_at;
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const NotifCard = ({ item, onRead }) => {
    const cfg = TYPE_ICON[item.notification_type] ?? TYPE_ICON.general;
    return (
        <TouchableOpacity
            style={[styles.card, !item.is_read && styles.cardUnread]}
            activeOpacity={0.8}
            onPress={() => !item.is_read && onRead(item.id)}
        >
            <View style={[styles.iconWrap, { backgroundColor: cfg.color + "22" }]}>
                <MaterialCommunityIcons name={cfg.icon} size={22} color={cfg.color} />
            </View>
            <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    {!item.is_read && <View style={styles.dot} />}
                </View>
                <Text style={styles.cardBody2} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.cardTime}>
                    {formatNotifTime(item)}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default function Notifications() {
    const [user] = useContext(MyUserContext);
    const [, setNotifUnread] = useContext(NotifUnreadContext);
    const [items, setItems]       = useState([]);
    const [loading, setLoading]   = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage]         = useState(1);
    const [hasMore, setHasMore]   = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [unread, setUnread]     = useState(0);
    const loadingMoreRef = useRef(false);

    const load = useCallback(async (p = 1, append = false) => {
        if (append) {
            if (loadingMoreRef.current) return;
            loadingMoreRef.current = true;
            setLoadingMore(true);
        }
        try {
            const res = await authApis(user?.token).get(endpoints.notifications, {
                params: { page: p, page_size: 5 },
            });
            const data = Array.isArray(res.data.data)
                ? res.data.data
                : res.data.data?.results ?? [];
            const meta = res.data.meta ?? {};
            setItems((prev) => {
                if (!append) return data;
                const existing = new Set(prev.map((n) => n.id));
                const nextItems = data.filter((n) => !existing.has(n.id));
                return [...prev, ...nextItems];
            });
            setPage(meta.page ?? p);
            const currentPage = meta.page ?? p;
            const tp = meta.total_pages ?? currentPage;
            setTotalPages(tp);
            setTotalCount(meta.total_count ?? data.length);
            setHasMore(currentPage < tp);
            const newUnread = data.filter((n) => !n.is_read).length;
            setUnread((prev) => append ? prev + newUnread : newUnread);
            // sync badge count: fetch total unread from API
            if (!append) {
                authApis(user?.token).get(endpoints.notifications, {
                    params: { is_read: 'false', page_size: 1 },
                }).then((r) => setNotifUnread(r.data.meta?.total_count ?? 0)).catch(() => {});
            }
        } catch { /* silent */ }
        finally {
            setLoading(false);
            if (append) {
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [user?.token]);

    useEffect(() => { load(1, false); }, []);

    // refresh badge whenever this tab gains focus
    useFocusEffect(useCallback(() => {
        if (!user?.token) return;
        authApis(user.token).get(endpoints.notifications, {
            params: { is_read: 'false', page_size: 1 },
        }).then((r) => setNotifUnread(r.data.meta?.total_count ?? 0)).catch(() => {});
    }, [user?.token]));

    const loadMore = useCallback(() => {
        if (loadingMoreRef.current || loadingMore || !hasMore) return;
        load(page + 1, true);
    }, [hasMore, loadingMore, load, page]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load(1, false);
        setRefreshing(false);
    };

    const markRead = async (id) => {
        try {
            await authApis(user?.token).post(endpoints.notificationRead(id));
            setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
            setUnread((u) => Math.max(0, u - 1));
            setNotifUnread((n) => Math.max(0, n - 1));
        } catch { /* silent */ }
    };

    const markAllRead = async () => {
        try {
            await authApis(user?.token).post(endpoints.notificationReadAll);
            setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnread(0);
            setNotifUnread(0);
        } catch { /* silent */ }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Thông báo</Text>
                {unread > 0 && (
                    <TouchableOpacity onPress={markAllRead}>
                        <Text style={styles.readAllBtn}>Đọc tất cả</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator color="#C9A84C" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <NotifCard item={item} onRead={markRead} />}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />
                    }
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        <View style={styles.paginationWrap}>
                            {loadingMore ? (
                                <ActivityIndicator color="#C9A84C" style={{ marginVertical: 8 }} />
                            ) : hasMore ? (
                                <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} activeOpacity={0.8}>
                                    <Text style={styles.loadMoreText}>Tải thêm</Text>
                                </TouchableOpacity>
                            ) : totalCount > 0 ? (
                                <Text style={styles.paginationDone}>Đã hiển thị tất cả thông báo</Text>
                            ) : null}
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="bell-sleep-outline" size={52} color="#333" />
                            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#1A1A2E" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.07)",
    },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
    readAllBtn: { fontSize: 13, color: "#C9A84C", fontWeight: "600" },

    list: { padding: 16, paddingBottom: 40 },

    card: {
        flexDirection: "row",
        gap: 12,
        backgroundColor: "#23243B",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },
    cardUnread: {
        borderColor: "rgba(201,168,76,0.3)",
        backgroundColor: "#252640",
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    cardBody:  { flex: 1 },
    cardTop:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
    cardTitle: { fontSize: 14, fontWeight: "bold", color: "#fff", flex: 1, marginRight: 6 },
    dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C9A84C" },
    cardBody2: { fontSize: 13, color: "#999", lineHeight: 18, marginBottom: 6 },
    cardTime:  { fontSize: 11, color: "#555" },

    emptyBox:  { alignItems: "center", paddingTop: 60, gap: 12 },
    emptyText: { color: "#555", fontSize: 14 },
    paginationWrap: { alignItems: "center", marginTop: 6 },
    paginationDone: { color: "#666", fontSize: 12, marginTop: 2 },
    loadMoreBtn: {
        alignSelf: "center",
        marginTop: 8,
        backgroundColor: "#23243B",
        borderWidth: 1,
        borderColor: "rgba(201,168,76,0.35)",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    loadMoreText: { color: "#C9A84C", fontWeight: "600", fontSize: 13 },
});

import { useCallback, useContext, useEffect, useState } from "react";
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
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";

const STATUS_COLOR = {
    pending:      "#F5A623",
    confirmed:    "#7FB069",
    checked_in:   "#5B9BD5",
    cancelled:    "#E05252",
    checked_out:  "#888",
};
const STATUS_LABEL = {
    pending:      "Chờ xác nhận",
    confirmed:    "Đã xác nhận",
    checked_in:   "Đang ở",
    cancelled:    "Đã hủy",
    checked_out:  "Đã trả phòng",
};

const formatPrice = (val) => `${Number(val).toLocaleString("vi-VN")}₫`;
const formatDate = (value) => {
    if (!value) return "";
    const [yyyy, mm, dd] = String(value).split("-");
    if (!yyyy || !mm || !dd) return String(value);
    return `${dd}/${mm}/${yyyy}`;
};

const TABS = [
    { key: "all",         label: "Tất cả" },
    { key: "pending",     label: "Chờ xác nhận" },
    { key: "confirmed",   label: "Đã xác nhận" },
    { key: "checked_in",  label: "Đang ở" },
    { key: "checked_out", label: "Đã trả phòng" },
    { key: "cancelled",   label: "Đã hủy" },
];

const BookingCard = ({ item, onPress }) => {
    const color = STATUS_COLOR[item.status] ?? "#888";
    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => onPress(item)}>
            <View style={styles.cardTop}>
                <Text style={styles.cardCode}>{item.booking_code}</Text>
                <View style={[styles.badge, { backgroundColor: color + "22", borderColor: color }]}>
                    <Text style={[styles.badgeText, { color }]}>{STATUS_LABEL[item.status] ?? item.status}</Text>
                </View>
            </View>
            <View style={styles.cardRow}>
                <MaterialCommunityIcons name="calendar-range" size={14} color="#888" />
                <Text style={styles.cardMeta}>
                    {formatDate(item.check_in_date)} → {formatDate(item.check_out_date)}
                    {item.nights ? `  ·  ${item.nights} đêm` : ""}
                </Text>
            </View>
            <View style={styles.cardRow}>
                <MaterialCommunityIcons name="account-group-outline" size={14} color="#888" />
                <Text style={styles.cardMeta}>
                    {item.adults} người lớn{item.children > 0 ? `, ${item.children} trẻ em` : ""}
                </Text>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.cardAmount}>{formatPrice(item.total_amount)}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#555" />
            </View>
        </TouchableOpacity>
    );
};

export default function BookingList({ navigation }) {
    const canGoBack = navigation.canGoBack();
    const [user] = useContext(MyUserContext);
    const [activeTab, setActiveTab] = useState("all");
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const loadBookings = useCallback(async (replace = true) => {
        try {
            const params = { ordering: "-created_at", page_size: 5 };
            if (activeTab !== "all") params.status = activeTab;
            const res = await authApis(user?.token).get(endpoints.bookings, { params });
            const data = Array.isArray(res.data.data)
                ? res.data.data
                : res.data.data?.results ?? [];
            const meta = res.data.meta ?? {};
            setBookings(replace ? data : (prev) => [...prev, ...data]);
            const currentPage = meta.page ?? 1;
            const tp = meta.total_pages ?? 1;
            setPage(currentPage);
            setTotalPages(tp);
            setHasMore(currentPage < tp);
            setTotalCount(meta.total_count ?? data.length);
        } catch {
            /* silent */
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [user?.token, activeTab]);

    useEffect(() => {
        setLoading(true);
        loadBookings();
    }, [activeTab]);

    const onRefresh = () => {
        setRefreshing(true);
        loadBookings(true);
    };

    const loadMore = async () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        try {
            const params = { ordering: "-created_at", page_size: 5, page: page + 1 };
            if (activeTab !== "all") params.status = activeTab;
            const res = await authApis(user?.token).get(endpoints.bookings, { params });
            const data = Array.isArray(res.data.data)
                ? res.data.data
                : res.data.data?.results ?? [];
            const meta = res.data.meta ?? {};
            setBookings((prev) => {
                const existing = new Set(prev.map((b) => b.id));
                const nextItems = data.filter((b) => !existing.has(b.id));
                return [...prev, ...nextItems];
            });
            const currentPage = meta.page ?? page + 1;
            const tp = meta.total_pages ?? totalPages;
            setPage(currentPage);
            setTotalPages(tp);
            setHasMore(currentPage < tp);
            setTotalCount(meta.total_count ?? totalCount);
        } catch { /* silent */ }
        finally { setLoadingMore(false); }
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                {canGoBack && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>Đặt phòng của tôi</Text>
            </View>

            {/* Tabs */}
            <FlatList
                horizontal
                data={TABS}
                keyExtractor={(t) => t.key}
                showsHorizontalScrollIndicator={false}
                style={styles.tabsList}
                contentContainerStyle={styles.tabsContainer}
                renderItem={({ item: tab }) => (
                    <TouchableOpacity
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* List */}
            {loading ? (
                <ActivityIndicator color="#C9A84C" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) =>
                        <BookingCard item={item} onPress={(b) => navigation.navigate("booking-detail", { bookingId: b.id })} />
                    }
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        <View style={styles.paginationWrap}>
                            {loadingMore ? (
                                <ActivityIndicator color="#C9A84C" style={{ marginVertical: 12 }} />
                            ) : hasMore ? (
                                <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} activeOpacity={0.8}>
                                    <Text style={styles.loadMoreText}>Tải thêm</Text>
                                </TouchableOpacity>
                            ) : totalCount > 0 ? (
                                <Text style={styles.paginationDone}>Đã hiển thị tất cả đặt phòng</Text>
                            ) : null}
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="calendar-blank-outline" size={52} color="#333" />
                            <Text style={styles.emptyTitle}>Chưa có đặt phòng</Text>
                            <Text style={styles.emptyText}>Các lần đặt phòng sẽ xuất hiện ở đây.</Text>
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
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.07)",
    },
    backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#23243B", justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },

    tabsList: { flexGrow: 0, flexShrink: 0 },
    tabsContainer: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
    tab:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#23243B", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
    tabActive: { backgroundColor: "#C9A84C", borderColor: "#C9A84C" },
    tabText:      { fontSize: 13, color: "#888" },
    tabTextActive: { color: "#1A1A2E", fontWeight: "bold" },

    card: {
        backgroundColor: "#23243B",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
        gap: 8,
    },
    cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    cardCode: { fontSize: 15, fontWeight: "bold", color: "#fff" },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
    badgeText: { fontSize: 11, fontWeight: "600" },
    cardRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    cardMeta: { fontSize: 13, color: "#888" },
    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
    cardAmount: { fontSize: 16, fontWeight: "bold", color: "#C9A84C" },

    emptyBox:   { alignItems: "center", paddingTop: 60, gap: 12 },
    emptyTitle: { fontSize: 17, fontWeight: "bold", color: "#fff" },
    emptyText:  { fontSize: 14, color: "#666", textAlign: "center" },
    paginationWrap: { alignItems: "center", marginTop: 8 },
    paginationDone: { color: "#666", fontSize: 12, marginTop: 2 },
    loadMoreBtn: {
        alignSelf: "center",
        backgroundColor: "#23243B",
        borderWidth: 1,
        borderColor: "rgba(201,168,76,0.35)",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    loadMoreText: { color: "#C9A84C", fontWeight: "600", fontSize: 13 },
});

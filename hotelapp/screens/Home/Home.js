import { useCallback, useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
    Platform,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};
const fmtDisplay = (d) =>
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const formatPrice = (val) => `${Number(val).toLocaleString("vi-VN")}₫`;
const formatDate = (value) => {
    if (!value) return "";
    const [yyyy, mm, dd] = String(value).split("-");
    if (!yyyy || !mm || !dd) return String(value);
    return `${dd}/${mm}/${yyyy}`;
};

const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
};
const dayAfter = (d) => {
    const n = new Date(d);
    n.setDate(n.getDate() + 1);
    return n;
};

// ── Thẻ loại phòng (dạng ngang) ───────────────────────────────────────────────
const RoomTypeCard = ({ item }) => {
    const navigation = useNavigation();
    return (
        <TouchableOpacity
            style={styles.roomCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("room-type-detail", { roomType: item })}
        >
            {item.primary_image ? (
                <Image source={{ uri: item.primary_image }} style={styles.roomCardImg} />
            ) : (
                <View style={styles.roomCardImgPlaceholder}>
                    <MaterialCommunityIcons name="image-off-outline" size={28} color="#555" />
                </View>
            )}
            <View style={styles.roomCardBody}>
                <Text style={styles.roomCardName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.roomCardMeta}>
                    <MaterialCommunityIcons name="account-group-outline" size={13} color="#888" />
                    <Text style={styles.roomCardMetaText}>{item.max_occupancy} khách</Text>
                </View>
                <Text style={styles.roomCardPrice}>{formatPrice(item.base_price)}</Text>
                <Text style={styles.roomCardPriceUnit}>/ đêm</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#555" style={styles.roomCardChevron} />
        </TouchableOpacity>
    );
};

// ── Trạng thái booking ────────────────────────────────────────────────────────
const STATUS_COLOR = {
    pending: "#F5A623",
    confirmed: "#7FB069",
    checked_in: "#5B9BD5",
    cancelled: "#E05252",
    checked_out: "#888",
};
const STATUS_LABEL = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    checked_in: "Đang ở",
    cancelled: "Đã hủy",
    checked_out: "Đã trả phòng",
};

// ── Thẻ booking sắp tới ───────────────────────────────────────────────────────
const UpcomingBookingCard = ({ booking }) => {
    const navigation = useNavigation();
    const color = STATUS_COLOR[booking.status] ?? "#888";
    return (
        <TouchableOpacity
            style={styles.upcomingCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("booking-detail", { bookingId: booking.id })}
        >
            <View style={styles.upcomingCardLeft}>
                <MaterialCommunityIcons name="calendar-check-outline" size={28} color="#C9A84C" />
            </View>
            <View style={styles.upcomingCardBody}>
                <Text style={styles.upcomingCode}>{booking.booking_code}</Text>
                <Text style={styles.upcomingDates}>
                    {formatDate(booking.check_in_date)} → {formatDate(booking.check_out_date)}
                    {"  "}·{"  "}{booking.nights} đêm
                </Text>
                <Text style={styles.upcomingAmount}>{formatPrice(booking.total_amount)}</Text>
            </View>
            <View style={[styles.upcomingBadge, { backgroundColor: color + "25", borderColor: color }]}>
                <Text style={[styles.upcomingBadgeText, { color }]}>{STATUS_LABEL[booking.status] ?? booking.status}</Text>
            </View>
        </TouchableOpacity>
    );
};

// ── Màn hình Home ─────────────────────────────────────────────────────────────
export default function Home() {
    const [user] = useContext(MyUserContext);
    const navigation = useNavigation();

    const [checkIn, setCheckIn]   = useState(tomorrow());
    const [checkOut, setCheckOut] = useState(dayAfter(tomorrow()));
    const [adults, setAdults]     = useState(1);
    const [children, setChildren] = useState(0);
    const [showPicker, setShowPicker] = useState(null);
    const [searching, setSearching]   = useState(false);

    const [roomTypes, setRoomTypes]   = useState([]);
    const [rtLoading, setRtLoading]   = useState(true);
    const [rtLoadingMore, setRtLoadingMore] = useState(false);
    const [rtPage, setRtPage] = useState(1);
    const [rtTotalPages, setRtTotalPages] = useState(1);
    const [rtHasMore, setRtHasMore] = useState(false);
    const [rtTotalCount, setRtTotalCount] = useState(0);
    const [upcoming, setUpcoming]     = useState(null);
    const [ubLoading, setUbLoading]   = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadRoomTypes = useCallback(async (page = 1, append = false) => {
        if (append) setRtLoadingMore(true);
        else setRtLoading(true);
        try {
            const res = await authApis(user?.token).get(endpoints.roomTypes, {
                params: { page, page_size: 4 },
            });
            const data = Array.isArray(res.data.data)
                ? res.data.data
                : res.data.data?.results ?? [];
            const meta = res.data.meta ?? {};

            setRoomTypes((prev) => {
                if (!append) return data;
                const existing = new Set(prev.map((i) => i.id));
                const nextItems = data.filter((i) => !existing.has(i.id));
                return [...prev, ...nextItems];
            });
            setRtPage(meta.page ?? page);
            const currentPage = meta.page ?? page;
            const totalPages = meta.total_pages ?? currentPage;
            setRtTotalPages(totalPages);
            setRtHasMore(currentPage < totalPages);
            setRtTotalCount(meta.total_count ?? data.length);
        } catch { /* silent */ }
        finally {
            setRtLoading(false);
            setRtLoadingMore(false);
        }
    }, [user?.token]);

    const loadUpcoming = useCallback(async () => {
        try {
            const todayStr = fmt(new Date());
            const res = await authApis(user?.token).get(endpoints.bookings, {
                params: {
                    ordering: "check_in_date",
                    page_size: 10,
                    status__in: "pending,confirmed",
                    check_in_date_gte: todayStr,
                },
            });
            const data = Array.isArray(res.data.data)
                ? res.data.data
                : res.data.data?.results ?? [];
            setUpcoming(data[0] ?? null);
        } catch { /* silent */ }
        finally { setUbLoading(false); }
    }, [user?.token]);

    useEffect(() => {
        loadRoomTypes(1, false);
        loadUpcoming();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([loadRoomTypes(1, false), loadUpcoming()]);
        setRefreshing(false);
    }, [loadRoomTypes, loadUpcoming]);

    const loadMoreRoomTypes = () => {
        if (rtLoading || rtLoadingMore || !rtHasMore) return;
        loadRoomTypes(rtPage + 1, true);
    };

    const handleSearch = async () => {
        if (checkOut <= checkIn) {
            alert("Ngày trả phòng phải sau ngày nhận phòng.");
            return;
        }
        setSearching(true);
        try {
            const res = await authApis(user?.token).get(endpoints.roomAvailability, {
                params: { check_in: fmt(checkIn), check_out: fmt(checkOut), adults, children },
            });
            navigation.navigate("availability-results", {
                results: res.data.data,
                checkIn: fmt(checkIn),
                checkOut: fmt(checkOut),
                adults,
                children,
            });
        } catch {
            alert("Không thể tải kết quả tìm phòng. Vui lòng thử lại.");
        } finally {
            setSearching(false);
        }
    };

    const getSelectedDate = (...args) => {
        // Support both signatures: (date) and (event, date)
        if (args[0] instanceof Date) return args[0];
        if (args[1] instanceof Date) return args[1];
        if (args[0]?.nativeEvent?.timestamp) return new Date(args[0].nativeEvent.timestamp);
        return null;
    };

    const onDateValueChange = (...args) => {
        const selected = getSelectedDate(...args);
        if (!selected) return;

        if (Platform.OS === "android") {
            setShowPicker(null);
        }

        if (showPicker === "checkin") {
            setCheckIn(selected);
            if (selected >= checkOut) setCheckOut(dayAfter(selected));
        } else {
            setCheckOut(selected);
        }
    };

    const ListHeader = () => (
        <View>
            {/* Greeting */}
            <View style={styles.greetingRow}>
                <View>
                    <Text style={styles.greetingSub}>Chào mừng trở lại 👋</Text>
                    <Text style={styles.greetingName}>
                        {user?.full_name?.split(" ").slice(-1)[0] || "Khách"}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate("profile-tab")}>
                    {user?.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatarCircle} />
                    ) : (
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>
                                {user?.full_name
                                    ? user.full_name.split(" ").slice(-2).map((w) => w[0].toUpperCase()).join("")
                                    : "K"}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Search Card */}
            <View style={styles.searchCard}>
                <Text style={styles.searchTitle}>Tìm phòng trống</Text>
                <View style={styles.dateRow}>
                    <TouchableOpacity style={styles.dateBox} onPress={() => setShowPicker("checkin")}>
                        <MaterialCommunityIcons name="calendar-arrow-right" size={16} color="#C9A84C" />
                        <View>
                            <Text style={styles.dateLabel}>Nhận phòng</Text>
                            <Text style={styles.dateValue}>{fmtDisplay(checkIn)}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.dateSep}>
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#555" />
                    </View>
                    <TouchableOpacity style={styles.dateBox} onPress={() => setShowPicker("checkout")}>
                        <MaterialCommunityIcons name="calendar-arrow-left" size={16} color="#C9A84C" />
                        <View>
                            <Text style={styles.dateLabel}>Trả phòng</Text>
                            <Text style={styles.dateValue}>{fmtDisplay(checkOut)}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.guestRow}>
                    <View style={styles.guestBox}>
                        <MaterialCommunityIcons name="account-outline" size={16} color="#888" />
                        <Text style={styles.guestLabel}>Người lớn</Text>
                        <View style={styles.counter}>
                            <TouchableOpacity style={styles.counterBtn} onPress={() => setAdults(Math.max(1, adults - 1))}>
                                <Text style={styles.counterBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.counterVal}>{adults}</Text>
                            <TouchableOpacity style={styles.counterBtn} onPress={() => setAdults(adults + 1)}>
                                <Text style={styles.counterBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.guestBox}>
                        <MaterialCommunityIcons name="account-child-outline" size={16} color="#888" />
                        <Text style={styles.guestLabel}>Trẻ em</Text>
                        <View style={styles.counter}>
                            <TouchableOpacity style={styles.counterBtn} onPress={() => setChildren(Math.max(0, children - 1))}>
                                <Text style={styles.counterBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.counterVal}>{children}</Text>
                            <TouchableOpacity style={styles.counterBtn} onPress={() => setChildren(children + 1)}>
                                <Text style={styles.counterBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.searchBtn, searching && { opacity: 0.7 }]}
                    onPress={handleSearch}
                    disabled={searching}
                >
                    {searching ? (
                        <ActivityIndicator color="#1A1A2E" size="small" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="magnify" size={18} color="#1A1A2E" />
                            <Text style={styles.searchBtnText}>Tìm phòng trống</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* DateTimePicker iOS */}
            {showPicker && Platform.OS === "ios" && (
                <Modal transparent animationType="slide">
                    <View style={styles.pickerModal}>
                        <View style={styles.pickerModalInner}>
                            <View style={styles.pickerModalHeader}>
                                <Text style={styles.pickerModalTitle}>
                                    {showPicker === "checkin" ? "Chọn ngày nhận phòng" : "Chọn ngày trả phòng"}
                                </Text>
                                <TouchableOpacity onPress={() => setShowPicker(null)}>
                                    <Text style={styles.pickerDone}>Xong</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={showPicker === "checkin" ? checkIn : checkOut}
                                mode="date"
                                display="spinner"
                                minimumDate={showPicker === "checkin" ? new Date() : dayAfter(checkIn)}
                                onValueChange={onDateValueChange}
                                textColor="#fff"
                            />
                        </View>
                    </View>
                </Modal>
            )}
            {showPicker && Platform.OS === "android" && (
                <DateTimePicker
                    value={showPicker === "checkin" ? checkIn : checkOut}
                    mode="date"
                    display="default"
                    minimumDate={showPicker === "checkin" ? new Date() : dayAfter(checkIn)}
                    onValueChange={onDateValueChange}
                    onDismiss={() => setShowPicker(null)}
                    onNeutralButtonPress={() => setShowPicker(null)}
                />
            )}

            {/* Booking sắp tới */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Phòng đặt gần đây</Text>
                    <TouchableOpacity onPress={() => navigation.navigate("booking-list")}>
                        <Text style={styles.sectionMore}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>
                {ubLoading ? (
                    <ActivityIndicator color="#C9A84C" style={{ marginVertical: 12 }} />
                ) : upcoming ? (
                    <UpcomingBookingCard booking={upcoming} />
                ) : (
                    <View style={styles.emptyCard}>
                        <MaterialCommunityIcons name="calendar-blank-outline" size={32} color="#444" />
                        <Text style={styles.emptyCardText}>Bạn chưa có đặt phòng nào</Text>
                        <TouchableOpacity onPress={handleSearch}>
                            <Text style={styles.emptyCardLink}>Đặt phòng ngay →</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Room types header */}
            <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
                <Text style={styles.sectionTitle}>Loại phòng</Text>
                <Text style={styles.sectionSub}>
                    {rtTotalCount > 0 ? `${roomTypes.length}/${rtTotalCount} loại` : `${roomTypes.length} loại`}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
            <FlatList
                data={roomTypes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <RoomTypeCard item={item} />}
                ListHeaderComponent={<ListHeader />}
                ListEmptyComponent={
                    !rtLoading ? (
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="bed-empty" size={44} color="#444" />
                            <Text style={styles.emptyText}>Chưa có loại phòng nào</Text>
                        </View>
                    ) : (
                        <ActivityIndicator color="#C9A84C" style={{ marginTop: 24 }} />
                    )
                }
                ListFooterComponent={
                    <View style={styles.paginationWrap}>
                        {rtLoadingMore ? (
                            <ActivityIndicator color="#C9A84C" style={{ marginVertical: 8 }} />
                        ) : rtHasMore ? (
                            <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreRoomTypes} activeOpacity={0.8}>
                                <Text style={styles.loadMoreText}>Tải thêm</Text>
                            </TouchableOpacity>
                        ) : rtTotalCount > 0 ? (
                            <Text style={styles.paginationDone}>Đã hiển thị tất cả loại phòng</Text>
                        ) : null}
                    </View>
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMoreRoomTypes}
                onEndReachedThreshold={0.35}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#1A1A2E" },
    greetingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 16, marginBottom: 18 },
    greetingSub:  { fontSize: 13, color: "#AAAAAA", marginBottom: 2 },
    greetingName: { fontSize: 22, fontWeight: "bold", color: "#fff" },
    avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#C9A84C", justifyContent: "center", alignItems: "center" },
    avatarText: { fontSize: 16, fontWeight: "bold", color: "#1A1A2E" },

    searchCard: { backgroundColor: "#23243B", borderRadius: 18, padding: 16, marginBottom: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
    searchTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 14 },
    dateRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
    dateBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#2A2A3E", borderRadius: 10, padding: 10 },
    dateLabel: { fontSize: 10, color: "#888", marginBottom: 2 },
    dateValue: { fontSize: 13, fontWeight: "600", color: "#fff" },
    dateSep: { paddingHorizontal: 4 },
    guestRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
    guestBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#2A2A3E", borderRadius: 10, padding: 10 },
    guestLabel: { flex: 1, fontSize: 12, color: "#888" },
    counter: { flexDirection: "row", alignItems: "center", gap: 6 },
    counterBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#3A3A52", justifyContent: "center", alignItems: "center" },
    counterBtnText: { fontSize: 16, color: "#C9A84C", lineHeight: 20 },
    counterVal: { fontSize: 15, fontWeight: "bold", color: "#fff", minWidth: 18, textAlign: "center" },
    searchBtn: { backgroundColor: "#C9A84C", borderRadius: 12, padding: 13, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
    searchBtnText: { color: "#1A1A2E", fontWeight: "bold", fontSize: 15 },

    pickerModal: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
    pickerModalInner: { backgroundColor: "#23243B", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
    pickerModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
    pickerModalTitle: { fontSize: 15, fontWeight: "bold", color: "#fff" },
    pickerDone: { fontSize: 15, color: "#C9A84C", fontWeight: "bold" },

    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#fff" },
    sectionMore:  { fontSize: 13, color: "#C9A84C" },
    sectionSub:   { fontSize: 12, color: "#666" },

    upcomingCard: { backgroundColor: "#23243B", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(201,168,76,0.2)" },
    upcomingCardLeft: { width: 48, height: 48, borderRadius: 12, backgroundColor: "rgba(201,168,76,0.12)", justifyContent: "center", alignItems: "center" },
    upcomingCardBody: { flex: 1 },
    upcomingCode:    { fontSize: 13, fontWeight: "bold", color: "#fff", marginBottom: 3 },
    upcomingDates:   { fontSize: 12, color: "#888", marginBottom: 3 },
    upcomingAmount:  { fontSize: 14, fontWeight: "bold", color: "#C9A84C" },
    upcomingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    upcomingBadgeText: { fontSize: 11, fontWeight: "600" },

    emptyCard: { backgroundColor: "#23243B", borderRadius: 14, padding: 20, alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
    emptyCardText: { fontSize: 14, color: "#666" },
    emptyCardLink: { fontSize: 13, color: "#C9A84C", fontWeight: "600" },

    roomCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#23243B", borderRadius: 14, marginBottom: 12, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
    roomCardImg: { width: 80, height: 80, resizeMode: "cover" },
    roomCardImgPlaceholder: { width: 80, height: 80, backgroundColor: "#2A2A3E", justifyContent: "center", alignItems: "center" },
    roomCardBody: { flex: 1, padding: 12 },
    roomCardName: { fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 4 },
    roomCardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
    roomCardMetaText: { fontSize: 12, color: "#888" },
    roomCardPrice: { fontSize: 15, fontWeight: "bold", color: "#C9A84C" },
    roomCardPriceUnit: { fontSize: 11, color: "#666" },
    roomCardChevron: { paddingRight: 10 },

    emptyBox: { alignItems: "center", paddingTop: 32, gap: 10 },
    emptyText: { color: "#555", fontSize: 14 },
    paginationWrap: { alignItems: "center", marginTop: 4, marginBottom: 4 },
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

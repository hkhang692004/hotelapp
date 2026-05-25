import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
    Pressable,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatPrice = (val) => `${parseInt(val).toLocaleString("vi-VN")}₫`;

const STATUS_LABEL = {
    pending:   { label: "Chờ xác nhận", color: "#F59E0B" },
    confirmed: { label: "Đã xác nhận",  color: "#3B82F6" },
    completed: { label: "Hoàn thành",   color: "#7FB069" },
    cancelled: { label: "Đã hủy",       color: "#555"    },
};

// ── Sub-components ────────────────────────────────────────────────────────────
const CategoryChip = ({ label, active, onPress }) => (
    <TouchableOpacity
        style={[styles.chip, active && styles.chipActive]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
);

const ServiceCard = ({ item, onOrder }) => (
    <View style={styles.card}>
        <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
            {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
            ) : null}
            <Text style={styles.cardUnit}>{item.unit}</Text>
            <View style={styles.cardBottom}>
                <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
                <TouchableOpacity style={styles.orderBtn} activeOpacity={0.8} onPress={() => onOrder(item)}>
                    <MaterialCommunityIcons name="plus" size={16} color="#1A1A2E" />
                    <Text style={styles.orderBtnText}>Đặt</Text>
                </TouchableOpacity>
            </View>
        </View>
    </View>
);

const OrderHistoryCard = ({ item, onCancel }) => {
    const st = STATUS_LABEL[item.status] ?? { label: item.status, color: "#888" };
    return (
        <View style={styles.histCard}>
            <View style={styles.histHeader}>
                <Text style={styles.histCode}>{item.booking_code ?? "—"}</Text>
                <View style={[styles.statusBadge, { backgroundColor: st.color + "22" }]}>
                    <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                </View>
            </View>
            {item.items?.map((it, idx) => (
                <View key={idx} style={styles.histItem}>
                    <Text style={styles.histItemName}>{it.service_name}</Text>
                    <Text style={styles.histItemQty}>x{it.quantity}  {formatPrice(it.subtotal)}</Text>
                </View>
            ))}
            <View style={styles.histFooter}>
                <Text style={styles.histTotal}>Tổng: {formatPrice(item.total_amount)}</Text>
                {item.status === "pending" && (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel(item)}>
                        <Text style={styles.cancelBtnText}>Hủy</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// ── Order modal ───────────────────────────────────────────────────────────────
const OrderModal = ({ visible, service, onClose, onSuccess, user }) => {
    const [bookings,  setBookings]  = useState([]);
    const [loadingBk, setLoadingBk] = useState(false);
    const [selBooking, setSelBooking] = useState(null);
    const [quantity,  setQuantity]  = useState(1);
    const [note,      setNote]      = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error,     setError]     = useState(null);

    // Load active bookings when modal opens
    useEffect(() => {
        if (!visible || !user?.token) return;
        setLoadingBk(true);
        setError(null);
        setSelBooking(null);
        setQuantity(1);
        setNote("");
        authApis(user.token).get(endpoints.bookings)
            .then((res) => {
                const list = Array.isArray(res.data?.data?.results)
                    ? res.data.data.results
                    : Array.isArray(res.data?.results)
                    ? res.data.results
                    : Array.isArray(res.data?.data)
                    ? res.data.data
                    : Array.isArray(res.data)
                    ? res.data
                    : [];
                // Only bookings that are active (not cancelled/checked_out)
                const active = list.filter(
                    (b) => !["cancelled", "checked_out", "no_show"].includes(b.status)
                );
                setBookings(active);
                if (active.length === 1) setSelBooking(active[0]);
            })
            .catch(() => setError("Không thể tải danh sách booking."))
            .finally(() => setLoadingBk(false));
    }, [visible]);

    const handleSubmit = async () => {
        if (!selBooking) { setError("Vui lòng chọn booking."); return; }
        setSubmitting(true);
        setError(null);
        try {
            await authApis(user.token).post(endpoints.serviceOrders, {
                booking_id: selBooking.id,
                note,
                items: [{ service_id: service.id, quantity }],
            });
            onSuccess();
        } catch (e) {
            const msg = e?.response?.data?.message
                ?? e?.response?.data?.detail
                ?? "Đặt dịch vụ thất bại.";
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (!service) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose} />
            <View style={styles.sheet}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Đặt dịch vụ</Text>

                {/* Service info */}
                <View style={styles.svcInfoRow}>
                    <Text style={styles.svcInfoName}>{service.name}</Text>
                    <Text style={styles.svcInfoPrice}>{formatPrice(service.price)}<Text style={{ color: "#888", fontSize: 12 }}>/{service.unit}</Text></Text>
                </View>

                {/* Quantity */}
                <Text style={styles.fieldLabel}>Số lượng</Text>
                <View style={styles.qtyRow}>
                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                        <MaterialCommunityIcons name="minus" size={18} color="#C9A84C" />
                    </TouchableOpacity>
                    <Text style={styles.qtyVal}>{quantity}</Text>
                    <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setQuantity((q) => q + 1)}
                    >
                        <MaterialCommunityIcons name="plus" size={18} color="#C9A84C" />
                    </TouchableOpacity>
                    <Text style={styles.qtyTotal}>{formatPrice(parseInt(service.price) * quantity)}</Text>
                </View>

                {/* Booking selector */}
                <Text style={styles.fieldLabel}>Booking</Text>
                {loadingBk ? (
                    <ActivityIndicator color="#C9A84C" style={{ marginVertical: 8 }} />
                ) : bookings.length === 0 ? (
                    <Text style={styles.noBkText}>Bạn chưa có booking đang hoạt động.</Text>
                ) : (
                    <ScrollView style={styles.bkList} showsVerticalScrollIndicator={false}>
                        {bookings.map((bk) => (
                            <TouchableOpacity
                                key={bk.id}
                                style={[styles.bkItem, selBooking?.id === bk.id && styles.bkItemActive]}
                                onPress={() => setSelBooking(bk)}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons
                                    name={selBooking?.id === bk.id ? "check-circle" : "circle-outline"}
                                    size={18}
                                    color={selBooking?.id === bk.id ? "#C9A84C" : "#555"}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.bkCode}>{bk.booking_code}</Text>
                                    <Text style={styles.bkDates}>{bk.check_in_date} → {bk.check_out_date}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Note */}
                <Text style={styles.fieldLabel}>Ghi chú</Text>
                <TextInput
                    style={styles.noteInput}
                    placeholder="Yêu cầu thêm (không bắt buộc)"
                    placeholderTextColor="#555"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    numberOfLines={2}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Buttons */}
                <View style={styles.sheetBtns}>
                    <TouchableOpacity style={styles.cancelSheetBtn} onPress={onClose}>
                        <Text style={styles.cancelSheetBtnText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.confirmSheetBtn, (submitting || bookings.length === 0) && { opacity: 0.5 }]}
                        onPress={handleSubmit}
                        disabled={submitting || bookings.length === 0}
                    >
                        {submitting
                            ? <ActivityIndicator color="#1A1A2E" size="small" />
                            : <Text style={styles.confirmSheetBtnText}>Xác nhận</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Services() {
    const [user] = useContext(MyUserContext);

    // Tab: 'services' | 'orders'
    const [tab, setTab] = useState("services");

    // Services tab
    const [categories, setCategories] = useState([]);
    const [services,   setServices]   = useState([]);
    const [activeCat,  setActiveCat]  = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Order modal
    const [orderService, setOrderService] = useState(null);
    const [successMsg,   setSuccessMsg]   = useState(null);

    // Orders history tab
    const [orders,            setOrders]            = useState([]);
    const [loadingOrders,     setLoadingOrders]     = useState(false);
    const [refreshingOrders,  setRefreshingOrders]  = useState(false);
    const [cancellingId,      setCancellingId]      = useState(null);
    const [ordersPage,        setOrdersPage]        = useState(1);
    const [ordersTotalPages,  setOrdersTotalPages]  = useState(1);
    const [ordersHasMore,     setOrdersHasMore]     = useState(false);
    const [ordersTotalCount,  setOrdersTotalCount]  = useState(0);
    const [loadingMoreOrders, setLoadingMoreOrders] = useState(false);

    const loadAll = useCallback(async () => {
        try {
            const [catRes, svcRes] = await Promise.all([
                authApis(user?.token).get(endpoints.serviceCategories),
                authApis(user?.token).get(endpoints.services),
            ]);
            const cats = Array.isArray(catRes.data?.data) ? catRes.data.data
                : catRes.data?.data?.results ?? catRes.data ?? [];
            const svcs = Array.isArray(svcRes.data?.data) ? svcRes.data.data
                : svcRes.data?.data?.results ?? svcRes.data ?? [];
            setCategories(cats);
            setServices(svcs);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [user?.token]);

    const loadOrders = useCallback(async (replace = true, pageNum = 1) => {
        if (!user?.token) return;
        if (replace) setLoadingOrders(true);
        try {
            const res = await authApis(user.token).get(endpoints.serviceOrders, {
                params: { ordering: "-created_at", page_size: 10, page: pageNum },
            });
            const list = Array.isArray(res.data?.data?.results)
                ? res.data.data.results
                : Array.isArray(res.data?.results)
                ? res.data.results
                : Array.isArray(res.data?.data)
                ? res.data.data
                : Array.isArray(res.data)
                ? res.data
                : [];
            const meta = res.data?.meta ?? {};
            setOrders(replace ? list : (prev) => {
                const existing = new Set(prev.map((o) => o.id));
                return [...prev, ...list.filter((o) => !existing.has(o.id))];
            });
            const currentPage = meta.page ?? pageNum;
            const tp = meta.total_pages ?? 1;
            setOrdersPage(currentPage);
            setOrdersTotalPages(tp);
            setOrdersHasMore(currentPage < tp);
            setOrdersTotalCount(meta.total_count ?? list.length);
        } catch { /* silent */ }
        finally {
            setLoadingOrders(false);
            setLoadingMoreOrders(false);
        }
    }, [user?.token]);

    useEffect(() => { loadAll(); }, []);

    useEffect(() => {
        if (tab === "orders") {
            setOrdersPage(1);
            setOrdersHasMore(false);
            loadOrders(true, 1);
        }
    }, [tab]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAll();
        setRefreshing(false);
    };

    const onRefreshOrders = async () => {
        setRefreshingOrders(true);
        await loadOrders(true, 1);
        setRefreshingOrders(false);
    };

    const loadMoreOrders = () => {
        if (!ordersHasMore || loadingMoreOrders) return;
        setLoadingMoreOrders(true);
        loadOrders(false, ordersPage + 1);
    };

    const handleCancel = async (order) => {
        setCancellingId(order.id);
        try {
            await authApis(user.token).post(endpoints.serviceOrderCancel(order.id));
            await loadOrders();
        } catch { /* silent */ }
        finally { setCancellingId(null); }
    };

    const handleOrderSuccess = () => {
        setOrderService(null);
        setSuccessMsg("Đặt dịch vụ thành công!");
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    const filtered = activeCat
        ? services.filter((s) => s.category?.id === activeCat || s.category === activeCat)
        : services;

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dịch vụ khách sạn</Text>
            </View>

            {/* Tab switcher */}
            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tabBtn, tab === "services" && styles.tabBtnActive]}
                    onPress={() => setTab("services")}
                >
                    <Text style={[styles.tabBtnText, tab === "services" && styles.tabBtnTextActive]}>
                        Danh sách
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, tab === "orders" && styles.tabBtnActive]}
                    onPress={() => setTab("orders")}
                >
                    <Text style={[styles.tabBtnText, tab === "orders" && styles.tabBtnTextActive]}>
                        Đơn của tôi
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Success toast */}
            {successMsg && (
                <View style={styles.toast}>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#7FB069" />
                    <Text style={styles.toastText}>{successMsg}</Text>
                </View>
            )}

            {/* ── Services tab ── */}
            {tab === "services" && (
                <>
                    {categories.length > 0 && (
                        <FlatList
                            data={[{ id: null, name: "Tất cả" }, ...categories]}
                            keyExtractor={(c) => String(c.id ?? "all")}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.chipsList}
                            contentContainerStyle={styles.chips}
                            renderItem={({ item }) => (
                                <CategoryChip
                                    label={item.name}
                                    active={activeCat === item.id}
                                    onPress={() => setActiveCat(item.id)}
                                />
                            )}
                        />
                    )}
                    {loading ? (
                        <ActivityIndicator color="#C9A84C" style={{ marginTop: 40 }} />
                    ) : (
                        <FlatList
                            data={filtered}
                            keyExtractor={(s) => String(s.id)}
                            renderItem={({ item }) => (
                                <ServiceCard item={item} onOrder={setOrderService} />
                            )}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />
                            }
                            ListEmptyComponent={
                                <View style={styles.emptyBox}>
                                    <MaterialCommunityIcons name="room-service-outline" size={52} color="#333" />
                                    <Text style={styles.emptyText}>Chưa có dịch vụ nào</Text>
                                </View>
                            }
                        />
                    )}
                </>
            )}

            {/* ── Orders tab ── */}
            {tab === "orders" && (
                loadingOrders ? (
                    <ActivityIndicator color="#C9A84C" style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={(o) => String(o.id)}
                        renderItem={({ item }) => (
                            <OrderHistoryCard
                                item={cancellingId === item.id ? { ...item, status: "cancelled" } : item}
                                onCancel={handleCancel}
                            />
                        )}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshingOrders} onRefresh={onRefreshOrders} tintColor="#C9A84C" />
                        }
                        onEndReached={loadMoreOrders}
                        onEndReachedThreshold={0.3}
                        ListFooterComponent={
                            <View style={styles.paginationWrap}>
                                {loadingMoreOrders ? (
                                    <ActivityIndicator color="#C9A84C" style={{ marginVertical: 12 }} />
                                ) : ordersHasMore ? (
                                    <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMoreOrders} activeOpacity={0.8}>
                                        <Text style={styles.loadMoreText}>Tải thêm</Text>
                                    </TouchableOpacity>
                                ) : ordersTotalCount > 0 ? (
                                    <Text style={styles.paginationDone}>Đã hiển thị tất cả đơn dịch vụ</Text>
                                ) : null}
                            </View>
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <MaterialCommunityIcons name="clipboard-list-outline" size={52} color="#333" />
                                <Text style={styles.emptyText}>Bạn chưa có đơn dịch vụ nào</Text>
                            </View>
                        }
                    />
                )
            )}

            {/* Order modal */}
            <OrderModal
                visible={!!orderService}
                service={orderService}
                user={user}
                onClose={() => setOrderService(null)}
                onSuccess={handleOrderSuccess}
            />
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#1A1A2E" },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.07)",
    },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },

    tabRow: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 8,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 10,
        alignItems: "center",
        backgroundColor: "#23243B",
    },
    tabBtnActive: { backgroundColor: "#C9A84C" },
    tabBtnText: { fontSize: 14, fontWeight: "600", color: "#888" },
    tabBtnTextActive: { color: "#1A1A2E" },

    toast: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginHorizontal: 16,
        marginTop: 10,
        backgroundColor: "#1e3322",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    toastText: { color: "#7FB069", fontSize: 13, flex: 1 },

    chipsList: { flexGrow: 0, flexShrink: 0 },
    chips: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: "#23243B",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    chipActive: { backgroundColor: "#C9A84C", borderColor: "#C9A84C" },
    chipText: { fontSize: 13, color: "#aaa", fontWeight: "500" },
    chipTextActive: { color: "#1A1A2E", fontWeight: "700" },

    list: { padding: 16, paddingBottom: 40, gap: 12 },

    // Service card
    card: {
        backgroundColor: "#23243B",
        borderRadius: 14,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },
    cardInfo: { padding: 14 },
    cardName: { fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 4 },
    cardDesc: { fontSize: 12, color: "#777", lineHeight: 17 },
    cardUnit: { fontSize: 11, color: "#555", marginTop: 2 },
    cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    cardPrice: { fontSize: 14, fontWeight: "bold", color: "#C9A84C" },
    orderBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#C9A84C",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    orderBtnText: { fontSize: 13, fontWeight: "bold", color: "#1A1A2E" },

    // Order history card
    histCard: {
        backgroundColor: "#23243B",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },
    histHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    histCode: { fontSize: 14, fontWeight: "bold", color: "#fff" },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: "600" },
    histItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    histItemName: { fontSize: 13, color: "#ccc", flex: 1 },
    histItemQty: { fontSize: 13, color: "#888" },
    histFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" },
    histTotal: { fontSize: 14, fontWeight: "bold", color: "#C9A84C" },
    cancelBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#EF4444" },
    cancelBtnText: { fontSize: 13, color: "#EF4444", fontWeight: "600" },

    emptyBox:  { alignItems: "center", paddingTop: 60, gap: 12 },
    emptyText: { color: "#555", fontSize: 14 },

    paginationWrap: { paddingVertical: 8, alignItems: "center" },
    loadMoreBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#C9A84C",
    },
    loadMoreText: { color: "#C9A84C", fontSize: 13, fontWeight: "600" },
    paginationDone: { color: "#444", fontSize: 12, textAlign: "center" },

    // Order modal (bottom sheet style)
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
    sheet: {
        backgroundColor: "#1E1F35",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 36,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignSelf: "center",
        marginBottom: 16,
    },
    sheetTitle: { fontSize: 17, fontWeight: "bold", color: "#fff", marginBottom: 14 },
    svcInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    svcInfoName: { fontSize: 15, fontWeight: "600", color: "#fff", flex: 1, marginRight: 8 },
    svcInfoPrice: { fontSize: 16, fontWeight: "bold", color: "#C9A84C" },
    fieldLabel: { fontSize: 13, color: "#888", marginBottom: 8, fontWeight: "500" },
    qtyRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
    qtyBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#C9A84C",
        alignItems: "center",
        justifyContent: "center",
    },
    qtyVal: { fontSize: 18, fontWeight: "bold", color: "#fff", minWidth: 28, textAlign: "center" },
    qtyTotal: { fontSize: 15, fontWeight: "bold", color: "#C9A84C", marginLeft: "auto" },
    bkList: { maxHeight: 140, marginBottom: 14 },
    bkItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 10,
        borderRadius: 10,
        marginBottom: 6,
        backgroundColor: "#23243B",
        borderWidth: 1,
        borderColor: "transparent",
    },
    bkItemActive: { borderColor: "#C9A84C" },
    bkCode: { fontSize: 13, fontWeight: "bold", color: "#fff" },
    bkDates: { fontSize: 12, color: "#888", marginTop: 2 },
    noBkText: { fontSize: 13, color: "#EF4444", marginBottom: 14 },
    noteInput: {
        backgroundColor: "#23243B",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        color: "#fff",
        fontSize: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        textAlignVertical: "top",
    },
    errorText: { color: "#EF4444", fontSize: 13, marginBottom: 10 },
    sheetBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
    cancelSheetBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
    },
    cancelSheetBtnText: { color: "#aaa", fontWeight: "600", fontSize: 14 },
    confirmSheetBtn: {
        flex: 2,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: "#C9A84C",
        alignItems: "center",
    },
    confirmSheetBtnText: { color: "#1A1A2E", fontWeight: "bold", fontSize: 14 },
});


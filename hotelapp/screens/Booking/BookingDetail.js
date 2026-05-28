import { useCallback, useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
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

const InfoRow = ({ icon, label, value, valueStyle }) => (
    <View style={styles.infoRow}>
        <MaterialCommunityIcons name={icon} size={16} color="#888" style={styles.infoIcon} />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
);

export default function BookingDetail({ route, navigation }) {
    const [user] = useContext(MyUserContext);
    const { bookingId } = route.params ?? {};

    const [booking, setBooking]     = useState(null);
    const [loading, setLoading]     = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");

    const load = useCallback(async () => {
        try {
            const res = await authApis(user?.token).get(endpoints.bookingDetail(bookingId));
            setBooking(res.data.data ?? res.data);
        } catch {
            Alert.alert("Lỗi", "Không thể tải thông tin đặt phòng.");
        } finally {
            setLoading(false);
        }
    }, [user?.token, bookingId]);

    useEffect(() => { load(); }, []);

    const handleCancel = async () => {
        if (!cancelReason.trim()) {
            Alert.alert("Vui lòng nhập lý do hủy phòng.");
            return;
        }
        setCancelling(true);
        try {
            await authApis(user?.token).post(endpoints.bookingCancel(bookingId), { reason: cancelReason });
            setShowCancelModal(false);
            setCancelReason("");
            load();
        } catch (err) {
            const status = err?.response?.status;
            if (status === 403) {
                Alert.alert("Không thể hủy", "Bạn chỉ có thể hủy đặt phòng ở trạng thái chờ xác nhận.");
            } else {
                Alert.alert("Lỗi", "Không thể hủy đặt phòng. Vui lòng thử lại.");
            }
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color="#C9A84C" />
            </SafeAreaView>
        );
    }

    if (!booking) {
        return (
            <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
                <MaterialCommunityIcons name="calendar-remove-outline" size={52} color="#333" />
                <Text style={{ color: "#666", marginTop: 12 }}>Không tìm thấy đặt phòng.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
                    <Text style={{ color: "#C9A84C" }}>← Quay lại</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const color = STATUS_COLOR[booking.status] ?? "#888";
    const canCancel = user?.role === "customer" && booking.status === "pending";

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết đặt phòng</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Status banner */}
                <View style={[styles.statusBanner, { backgroundColor: color + "18", borderColor: color + "55" }]}>
                    <Text style={[styles.statusLabel, { color }]}>
                        {STATUS_LABEL[booking.status] ?? booking.status}
                    </Text>
                    <Text style={[styles.bookingCode, { color }]}>{booking.booking_code}</Text>
                </View>

                {/* Thông tin cơ bản */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thông tin đặt phòng</Text>
                    <InfoRow icon="calendar-arrow-right" label="Nhận phòng"  value={booking.check_in_date} />
                    <InfoRow icon="calendar-arrow-left"  label="Trả phòng"   value={booking.check_out_date} />
                    {booking.nights && (
                        <InfoRow icon="weather-night"    label="Số đêm"     value={`${booking.nights} đêm`} />
                    )}
                    <InfoRow icon="account-group-outline" label="Khách"
                        value={`${booking.adults} NL${booking.children > 0 ? `, ${booking.children} TE` : ""}`}
                    />
                    {booking.special_request ? (
                        <InfoRow icon="comment-text-outline" label="Yêu cầu" value={booking.special_request} />
                    ) : null}
                </View>

                {/* Phòng đã đặt */}
                {Array.isArray(booking.rooms) && booking.rooms.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Phòng</Text>
                        {booking.rooms.map((r, idx) => (
                            <View key={idx} style={styles.roomRow}>
                                <MaterialCommunityIcons name="bed-outline" size={16} color="#888" />
                                <Text style={styles.roomText}>
                                    {r.room_number ?? r.room ?? `Phòng ${idx + 1}`}
                                    {r.room_type_name ? ` — ${r.room_type_name}` : ""}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Thanh toán */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thanh toán</Text>
                    <InfoRow icon="cash-multiple" label="Tổng tiền" value={formatPrice(booking.total_amount)}
                        valueStyle={{ color: "#C9A84C", fontWeight: "bold", fontSize: 16 }}
                    />
                    {booking.payment_status && (
                        <InfoRow icon="credit-card-outline" label="Trạng thái TT" value={booking.payment_status} />
                    )}
                </View>

                {/* Hủy phòng */}
                {canCancel && (
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => setShowCancelModal(true)}
                    >
                        <MaterialCommunityIcons name="cancel" size={18} color="#E05252" />
                        <Text style={styles.cancelBtnText}>Hủy đặt phòng</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Cancel Modal */}
            <Modal visible={showCancelModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Hủy đặt phòng</Text>
                        <Text style={styles.modalSub}>Vui lòng nhập lý do hủy phòng:</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            placeholder="Lý do hủy phòng..."
                            placeholderTextColor="#555"
                            multiline
                            numberOfLines={3}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalBtnCancel}
                                onPress={() => { setShowCancelModal(false); setCancelReason(""); }}
                            >
                                <Text style={styles.modalBtnCancelText}>Đóng</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtnConfirm, cancelling && { opacity: 0.7 }]}
                                onPress={handleCancel}
                                disabled={cancelling}
                            >
                                {cancelling ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.modalBtnConfirmText}>Xác nhận hủy</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    content: { padding: 16, paddingBottom: 48 },

    statusBanner: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 16,
        alignItems: "center",
        marginBottom: 20,
        gap: 4,
    },
    statusLabel: { fontSize: 15, fontWeight: "bold" },
    bookingCode: { fontSize: 20, fontWeight: "900", letterSpacing: 1 },

    section: {
        backgroundColor: "#23243B",
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
        gap: 10,
    },
    sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#fff", marginBottom: 4 },

    infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    infoIcon: { marginTop: 2 },
    infoLabel: { fontSize: 13, color: "#888", width: 100 },
    infoValue: { flex: 1, fontSize: 13, color: "#fff" },

    roomRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    roomText: { fontSize: 13, color: "#ccc" },

    cancelBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: "#E05252",
        borderRadius: 12,
        paddingVertical: 13,
        marginTop: 4,
    },
    cancelBtnText: { color: "#E05252", fontWeight: "bold", fontSize: 15 },

    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
    modalBox: {
        backgroundColor: "#23243B",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
        gap: 14,
    },
    modalTitle: { fontSize: 17, fontWeight: "bold", color: "#fff" },
    modalSub: { fontSize: 14, color: "#888" },
    modalInput: {
        backgroundColor: "#2A2A3E",
        borderRadius: 10,
        padding: 12,
        color: "#fff",
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: "top",
    },
    modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
    modalBtnCancel: {
        flex: 1,
        padding: 13,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
    },
    modalBtnCancelText: { color: "#888", fontWeight: "600", fontSize: 14 },
    modalBtnConfirm: {
        flex: 1,
        padding: 13,
        borderRadius: 12,
        backgroundColor: "#E05252",
        alignItems: "center",
    },
    modalBtnConfirmText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});

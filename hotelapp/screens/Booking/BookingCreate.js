import { useContext, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";

const formatPrice = (val) => `${Number(val).toLocaleString("vi-VN")}₫`;

const formatErrorMessage = (err) => {
    const payload = err?.response?.data;
    const error = payload?.error ?? payload;

    if (!error) {
        return "Đặt phòng thất bại. Vui lòng thử lại.";
    }

    if (typeof error === "string") {
        return error;
    }

    const code = error.code;
    const message = error.message;
    const details = error.details;

    if (code === "ROOM_NOT_AVAILABLE") {
        return message || "Không đủ phòng trống cho số lượng bạn đã chọn.";
    }

    if (code === "INVALID_DATE_RANGE") {
        return message || "Ngày nhận phòng phải trước ngày trả phòng.";
    }

    if (code === "NOT_FOUND") {
        return message || "Không tìm thấy dữ liệu cần thiết.";
    }

    if (details && typeof details === "object" && !Array.isArray(details)) {
        const fieldMessages = Object.entries(details)
            .map(([field, value]) => {
                if (Array.isArray(value)) {
                    return `${field}: ${value.join(", ")}`;
                }
                if (value && typeof value === "object") {
                    return `${field}: ${JSON.stringify(value)}`;
                }
                return `${field}: ${String(value)}`;
            })
            .filter(Boolean);

        if (fieldMessages.length > 0) {
            return fieldMessages.join("\n");
        }
    }

    return message || "Đặt phòng thất bại. Vui lòng thử lại.";
};

const SummaryRow = ({ icon, label, value, valueColor }) => (
    <View style={styles.summaryRow}>
        <MaterialCommunityIcons name={icon} size={16} color="#888" style={styles.summaryIcon} />
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={[styles.summaryValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
);

const PaymentOption = ({ active, icon, title, description, onPress }) => (
    <TouchableOpacity
        style={[styles.paymentOption, active && styles.paymentOptionActive]}
        onPress={onPress}
        activeOpacity={0.85}
    >
        <View style={[styles.paymentIconWrap, active && styles.paymentIconWrapActive]}>
            <MaterialCommunityIcons
                name={icon}
                size={20}
                color={active ? "#1A1A2E" : "#C9A84C"}
            />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={[styles.paymentTitle, active && styles.paymentTitleActive]}>{title}</Text>
            <Text style={styles.paymentDescription}>{description}</Text>
        </View>
    </TouchableOpacity>
);

export default function BookingCreate({ route, navigation }) {
    const [user] = useContext(MyUserContext);
    const {
        roomTypeId,
        roomTypeName,
        checkIn,
        checkOut,
        adults,
        children,
        pricePerNight,
        totalPrice,
        nights,
    } = route.params ?? {};

    const [quantity, setQuantity]           = useState(1);
    const [specialRequest, setSpecialRequest] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("vnpay");
    const [submitting, setSubmitting]       = useState(false);

    const computedTotal = Number(pricePerNight) * Number(nights ?? 1) * quantity;

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            const res = await authApis(user?.token).post(endpoints.bookings, {
                check_in_date:   checkIn,
                check_out_date:  checkOut,
                adults:          Number(adults),
                children:        Number(children ?? 0),
                payment_method:  paymentMethod,
                rooms:           [{ room_type_id: roomTypeId, quantity }],
                special_request: specialRequest.trim(),
            });
            const payload = res.data.data ?? res.data;
            const booking = payload.booking ?? payload;
            const paymentUrl = payload.payment_url || payload.payment?.payment_url || "";

            if (paymentMethod === "vnpay") {
                if (!paymentUrl) {
                    Alert.alert(
                        "Không tạo được link thanh toán",
                        `Mã đặt phòng: ${booking.booking_code}\nVui lòng mở lại chi tiết đặt phòng để thanh toán sau.`,
                        [
                            {
                                text: "Xem chi tiết",
                                onPress: () => navigation.replace("booking-detail", { bookingId: booking.id }),
                            },
                        ],
                        { cancelable: false }
                    );
                    return;
                }

                setSubmitting(false);
                navigation.replace("vnpay-payment", { paymentUrl, booking });
            } else {
                Alert.alert(
                    "Đặt phòng thành công",
                    `Mã đặt phòng: ${booking.booking_code}\nĐơn đã được xác nhận, thanh toán tại quầy khi đến khách sạn.`,
                    [
                        {
                            text: "Xem chi tiết",
                            onPress: () => navigation.replace("booking-detail", { bookingId: booking.id }),
                        },
                    ],
                    { cancelable: false }
                );
            }
        } catch (err) {
            Alert.alert("Lỗi đặt phòng", formatErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Xác nhận đặt phòng</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Thông tin phòng ── */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Thông tin phòng</Text>
                        <SummaryRow icon="bed-outline"           label="Loại phòng"    value={roomTypeName} />
                        <SummaryRow icon="calendar-arrow-right"  label="Nhận phòng"    value={checkIn} />
                        <SummaryRow icon="calendar-arrow-left"   label="Trả phòng"     value={checkOut} />
                        <SummaryRow icon="weather-night"         label="Số đêm"        value={`${nights ?? "—"} đêm`} />
                        <SummaryRow
                            icon="account-group-outline"
                            label="Số khách"
                            value={`${adults} người lớn${Number(children) > 0 ? `, ${children} trẻ em` : ""}`}
                        />
                    </View>

                    {/* ── Số lượng phòng ── */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Số lượng phòng</Text>
                        <View style={styles.quantityRow}>
                            <TouchableOpacity
                                style={[styles.qBtn, quantity <= 1 && styles.qBtnDisabled]}
                                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                            >
                                <MaterialCommunityIcons name="minus" size={20} color={quantity <= 1 ? "#444" : "#fff"} />
                            </TouchableOpacity>
                            <Text style={styles.qValue}>{quantity}</Text>
                            <TouchableOpacity
                                style={styles.qBtn}
                                onPress={() => setQuantity((q) => q + 1)}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ── Thanh toán ── */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
                        <PaymentOption
                            active={paymentMethod === "vnpay"}
                            icon="credit-card-outline"
                            title="Thanh toán VNPay"
                            description="Xác nhận booking sau khi thanh toán thành công"
                            onPress={() => setPaymentMethod("vnpay")}
                        />
                        <PaymentOption
                            active={paymentMethod === "counter"}
                            icon="cash-register"
                            title="Thanh toán tại quầy"
                            description="Booking được xác nhận ngay, thanh toán khi đến khách sạn"
                            onPress={() => setPaymentMethod("counter")}
                        />
                    </View>

                    {/* ── Yêu cầu đặc biệt ── */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Yêu cầu đặc biệt</Text>
                        <TextInput
                            style={styles.textarea}
                            value={specialRequest}
                            onChangeText={setSpecialRequest}
                            placeholder="Ví dụ: phòng tầng cao, giường đôi, đến muộn..."
                            placeholderTextColor="#555"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* ── Tổng tiền ── */}
                    <View style={styles.priceCard}>
                        <View style={styles.priceBreakdown}>
                            <Text style={styles.priceBreakdownText}>
                                {formatPrice(pricePerNight)} × {nights ?? 1} đêm × {quantity} phòng
                            </Text>
                        </View>
                        <View style={styles.priceTotalRow}>
                            <Text style={styles.priceTotalLabel}>Tổng thanh toán</Text>
                            <Text style={styles.priceTotalValue}>{formatPrice(computedTotal)}</Text>
                        </View>
                    </View>

                    {/* ── Nút xác nhận ── */}
                    <TouchableOpacity
                        style={[styles.confirmBtn, submitting && { opacity: 0.6 }]}
                        onPress={handleConfirm}
                        disabled={submitting}
                        activeOpacity={0.85}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#1A1A2E" size="small" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="check-circle-outline" size={22} color="#1A1A2E" />
                                <Text style={styles.confirmBtnText}>Xác nhận đặt phòng</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.note}>
                        Đơn đặt phòng sẽ ở trạng thái <Text style={{ color: "#F5A623" }}>Chờ xác nhận</Text> cho đến khi khách sạn duyệt.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: "#1A1A2E" },
    header: {
        flexDirection: "row", alignItems: "center", gap: 14,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)",
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: "#23243B", justifyContent: "center", alignItems: "center",
    },
    headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },

    scroll: { padding: 16, paddingBottom: 48, gap: 14 },

    card: {
        backgroundColor: "#23243B", borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
    },
    cardTitle: {
        fontSize: 12, color: "#888", fontWeight: "600",
        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12,
    },

    summaryRow: {
        flexDirection: "row", alignItems: "center",
        paddingVertical: 9,
        borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)",
    },
    summaryIcon:  { marginRight: 12, width: 20 },
    summaryLabel: { fontSize: 13, color: "#888", flex: 1 },
    summaryValue: { fontSize: 14, color: "#E0E0EA", fontWeight: "600", textAlign: "right", flexShrink: 1, maxWidth: "55%" },

    // Quantity
    quantityRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, paddingTop: 4 },
    qBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: "#2E2F4A", justifyContent: "center", alignItems: "center",
        borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    },
    qBtnDisabled: { borderColor: "rgba(255,255,255,0.04)" },
    qValue: { fontSize: 24, fontWeight: "bold", color: "#fff", minWidth: 32, textAlign: "center" },

    // Textarea
    textarea: {
        color: "#E0E0EA", fontSize: 14, lineHeight: 20,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: 10,
        padding: 12, minHeight: 80,
    },

    // Price
    priceCard: {
        backgroundColor: "#1E1F35", borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: "rgba(201,168,76,0.2)",
    },
    priceBreakdown:     { marginBottom: 10 },
    priceBreakdownText: { fontSize: 13, color: "#888", textAlign: "center" },
    priceTotalRow: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)", paddingTop: 12,
    },
    priceTotalLabel: { fontSize: 15, color: "#ccc", fontWeight: "600" },
    priceTotalValue: { fontSize: 22, fontWeight: "bold", color: "#C9A84C" },

    paymentOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#1E1F35",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
        marginBottom: 10,
    },
    paymentOptionActive: {
        borderColor: "#C9A84C",
        backgroundColor: "rgba(201,168,76,0.12)",
    },
    paymentIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(201,168,76,0.12)",
    },
    paymentIconWrapActive: { backgroundColor: "#C9A84C" },
    paymentTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 2 },
    paymentTitleActive: { color: "#C9A84C" },
    paymentDescription: { fontSize: 12, color: "#888", lineHeight: 16 },

    // Confirm button
    confirmBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
        paddingVertical: 16, borderRadius: 14, backgroundColor: "#C9A84C",
    },
    confirmBtnText: { fontSize: 16, fontWeight: "bold", color: "#1A1A2E" },

    note: { fontSize: 12, color: "#555", textAlign: "center", lineHeight: 18 },
});

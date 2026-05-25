import { useContext, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    Image,
    ScrollView,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    Dimensions,
    Modal,
    Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (val) => `${Number(val).toLocaleString("vi-VN")}₫`;
const fmt = (d) => {
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};
const fmtDisplay = (d) =>
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d; };
const dayAfter  = (d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; };

// ── Màn hình chi tiết loại phòng ─────────────────────────────────────────────
const RoomTypeDetail = ({ navigation, route }) => {
    const { roomType, hideBooking } = route.params; // dữ liệu nhanh từ danh sách
    const [user] = useContext(MyUserContext);
    const insets = useSafeAreaInsets();

    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImg, setActiveImg] = useState(0);

    // ── Booking modal state ───────────────────────────────────────────────────
    const [bookingModal, setBookingModal] = useState(false);
    const [bCheckIn,  setBCheckIn]  = useState(tomorrow);
    const [bCheckOut, setBCheckOut] = useState(() => dayAfter(tomorrow()));
    const [bAdults,   setBAdults]   = useState(1);
    const [bChildren, setBChildren] = useState(0);
    const [showDatePicker, setShowDatePicker] = useState(null); // 'checkin' | 'checkout'
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [availableCount, setAvailableCount] = useState(null);
    const [availabilityError, setAvailabilityError] = useState(false);
    const [suggestedDates, setSuggestedDates] = useState(null); // { checkIn: Date, checkOut: Date }
    const [findingNext, setFindingNext] = useState(false);
    const checkGenRef = useRef(0); // generation counter to cancel stale async ops

    const data = detail ?? roomType;
    const currentPrice = data.prices?.find((p) => !p.valid_to && p.is_active)?.price ?? data.base_price;

    const handleDateChange = (...args) => {
        const selected = args[0] instanceof Date ? args[0]
            : args[1] instanceof Date ? args[1] : null;
        if (!selected) return;
        if (Platform.OS === "android") setShowDatePicker(null);
        if (showDatePicker === "checkin") {
            setBCheckIn(selected);
            if (selected >= bCheckOut) setBCheckOut(dayAfter(selected));
        } else {
            setBCheckOut(selected);
        }
    };

    const checkAvailability = async () => {
        if (bCheckOut <= bCheckIn) {
            setAvailableCount(0);
            return;
        }

        // Bump generation — any older async op should bail out
        const gen = ++checkGenRef.current;

        setCheckingAvailability(true);
        setAvailabilityError(false);
        setSuggestedDates(null);
        setFindingNext(false);
        try {
            const res = await authApis(user?.token).get(endpoints.roomAvailability, {
                params: {
                    check_in: fmt(bCheckIn),
                    check_out: fmt(bCheckOut),
                    adults: bAdults,
                    children: bChildren,
                    room_type_id: data.id, // narrow to this room type only
                },
            });

            if (gen !== checkGenRef.current) return; // stale, newer check in flight

            const payload = res.data?.data ?? res.data;
            const list = Array.isArray(payload?.room_types)
                ? payload.room_types
                : Array.isArray(payload)
                ? payload
                : [];

            // Backend excludes room types with 0 rooms — absence means 0
            // room_type_id is a UUID string — must NOT use Number() (NaN !== NaN)
            const matched = list.find(
                (rt) => String(rt.room_type_id ?? rt.id) === String(data.id)
            );
            const count = Number(matched?.available_count ?? 0);
            setAvailableCount(count);

            if (count === 0) {
                findNextAvailableDate(gen);
            }
        } catch {
            if (gen !== checkGenRef.current) return;
            setAvailabilityError(true);
            setAvailableCount(null);
        } finally {
            if (gen === checkGenRef.current) setCheckingAvailability(false);
        }
    };

    // Find the nearest check-in date (same duration) that has rooms for this type.
    // Checks the next 30 days in batches of 5 parallel requests.
    const findNextAvailableDate = async (gen) => {
        const nights = Math.max(1, Math.round((bCheckOut - bCheckIn) / 86400000));
        setFindingNext(true);

        try {
            for (let batch = 0; batch < 6; batch++) {
                if (gen !== checkGenRef.current) return;

                const offsets = [1, 2, 3, 4, 5].map((j) => batch * 5 + j);
                const results = await Promise.all(
                    offsets.map(async (i) => {
                        const tryCI = new Date(bCheckIn);
                        tryCI.setDate(tryCI.getDate() + i);
                        const tryCO = new Date(tryCI);
                        tryCO.setDate(tryCO.getDate() + nights);
                        try {
                            const r = await authApis(user?.token).get(endpoints.roomAvailability, {
                                params: {
                                    check_in: fmt(tryCI),
                                    check_out: fmt(tryCO),
                                    adults: bAdults,
                                    children: bChildren,
                                    room_type_id: data.id,
                                },
                            });
                            const p = r.data?.data ?? r.data;
                            const l = Array.isArray(p?.room_types) ? p.room_types : [];
                            const m = l.find(
                                (rt) => String(rt.room_type_id ?? rt.id) === String(data.id)
                            );
                            return { i, tryCI, tryCO, count: Number(m?.available_count ?? 0) };
                        } catch {
                            return { i, count: 0 };
                        }
                    })
                );

                if (gen !== checkGenRef.current) return;

                const found = results
                    .filter((r) => r.count > 0)
                    .sort((a, b) => a.i - b.i)[0];

                if (found) {
                    setSuggestedDates({ checkIn: found.tryCI, checkOut: found.tryCO });
                    return;
                }
            }
            // No availability found within 30 days — leave suggestedDates null
        } finally {
            if (gen === checkGenRef.current) setFindingNext(false);
        }
    };

    const handleConfirmBooking = () => {
        if (bCheckOut <= bCheckIn) {
            alert("Ngày trả phòng phải sau ngày nhận phòng.");
            return;
        }
        if (checkingAvailability) {
            alert("Đang kiểm tra phòng trống, vui lòng chờ một chút.");
            return;
        }
        if (availableCount !== null && availableCount <= 0) {
            alert("Khoảng ngày này hiện không còn phòng trống cho loại phòng đã chọn.");
            return;
        }
        const nights = Math.max(1, Math.round((bCheckOut - bCheckIn) / 86400000));
        const price = currentPrice;
        setBookingModal(false);
        navigation.navigate("booking-create", {
            roomTypeId:   data.id,
            roomTypeName: data.name,
            checkIn:      fmt(bCheckIn),
            checkOut:     fmt(bCheckOut),
            adults:       bAdults,
            children:     bChildren,
            pricePerNight: price,
            totalPrice:   Number(price) * nights,
            nights,
        });
    };

    useEffect(() => {
        if (!bookingModal) return;
        checkAvailability();
    }, [bookingModal, bCheckIn, bCheckOut, bAdults, bChildren]);

    useEffect(() => {
        (async () => {
            try {
                const res = await authApis(user?.token).get(
                    endpoints.roomTypeDetail(roomType.id)
                );
                setDetail(res.data.data);
            } catch {
                setError("Không thể tải chi tiết phòng.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.centerBox}>
                <ActivityIndicator size="large" color="#C9A84C" />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.centerBox}>
                <MaterialCommunityIcons name="wifi-off" size={48} color="#555" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryText}>Quay lại</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const images = data.images?.length > 0 ? data.images : null;

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
            <View style={styles.headerOverlay} pointerEvents="box-none">
                <TouchableOpacity
                    style={[styles.backBtn, { top: insets.top + 10 }]}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
                </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Ảnh banner / gallery */}
                <View style={styles.galleryWrap}>
                    {images ? (
                        <>
                            <FlatList
                                data={images}
                                keyExtractor={(i) => i.id.toString()}
                                renderItem={({ item }) => (
                                    <Image
                                        source={{ uri: item.image }}
                                        style={styles.galleryImage}
                                    />
                                )}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={(e) => {
                                    const idx = Math.round(
                                        e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                                    );
                                    setActiveImg(idx);
                                }}
                            />
                            {/* Dots indicator */}
                            {images.length > 1 && (
                                <View style={styles.dotsRow}>
                                    {images.map((_, i) => (
                                        <View
                                            key={i}
                                            style={[styles.dot, i === activeImg && styles.dotActive]}
                                        />
                                    ))}
                                </View>
                            )}
                        </>
                    ) : data.primary_image ? (
                        <Image source={{ uri: data.primary_image }} style={styles.galleryImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <MaterialCommunityIcons name="image-off-outline" size={52} color="#555" />
                        </View>
                    )}
                </View>

                {/* Nội dung */}
                <View style={styles.content}>
                    {/* Tên + giá */}
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{data.name}</Text>
                        <View style={styles.occupancyBadge}>
                            <MaterialCommunityIcons
                                name="account-group-outline"
                                size={13}
                                color="#C9A84C"
                            />
                            <Text style={styles.occupancyText}>{data.max_occupancy} người</Text>
                        </View>
                    </View>

                    <View style={styles.priceBox}>
                        <Text style={styles.priceLabel}>Giá từ</Text>
                        <Text style={styles.price}>{formatPrice(currentPrice)}</Text>
                        <Text style={styles.priceUnit}>/đêm</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Mô tả */}
                    <Text style={styles.sectionTitle}>Mô tả</Text>
                    <Text style={styles.desc}>
                        {data.description || "Không có mô tả."}
                    </Text>

                    {/* Tiện nghi */}
                    {data.amenities?.length > 0 && (
                        <>
                            <View style={styles.divider} />
                            <Text style={styles.sectionTitle}>Tiện nghi</Text>
                            <View style={styles.amenitiesGrid}>
                                {data.amenities.map((a) => (
                                    <View key={a.id} style={styles.amenityItem}>
                                        <MaterialCommunityIcons
                                            name={a.icon || "check-circle-outline"}
                                            size={20}
                                            color="#C9A84C"
                                        />
                                        <Text style={styles.amenityName}>{a.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Bảng giá */}
                    {data.prices?.length > 0 && (
                        <>
                            <View style={styles.divider} />
                            <Text style={styles.sectionTitle}>Bảng giá</Text>
                            {data.prices
                                .filter((p) => p.is_active)
                                .map((p) => (
                                    <View key={p.id} style={styles.priceRow}>
                                        <Text style={styles.priceRangeText}>
                                            {p.valid_from}
                                            {p.valid_to ? ` — ${p.valid_to}` : " trở đi"}
                                        </Text>
                                        <Text style={styles.priceRowVal}>{formatPrice(p.price)}</Text>
                                    </View>
                                ))}
                        </>
                    )}
                </View>
            </ScrollView>

            {/* CTA đặt phòng */}
            {!hideBooking && <View style={styles.footer}>
                <View>
                    <Text style={styles.footerLabel}>Giá/đêm</Text>
                    <Text style={styles.footerPrice}>{formatPrice(currentPrice)}</Text>
                </View>
                <TouchableOpacity style={styles.bookBtn} onPress={() => setBookingModal(true)}>
                    <Text style={styles.bookBtnText}>Đặt phòng</Text>
                </TouchableOpacity>
            </View>}

            {/* ── Booking modal ───────────────────────────────────────────── */}
            <Modal
                visible={bookingModal}
                transparent
                animationType="slide"
                onRequestClose={() => setBookingModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setBookingModal(false)}
                />
                <View style={styles.modalSheet}>
                    {/* Handle */}
                    <View style={styles.sheetHandle} />

                    <Text style={styles.sheetTitle}>Chọn ngày &amp; khách</Text>

                    {/* Dates */}
                    <View style={styles.dateRow}>
                        <TouchableOpacity
                            style={styles.dateBox}
                            onPress={() => setShowDatePicker("checkin")}
                        >
                            <MaterialCommunityIcons name="calendar-arrow-right" size={16} color="#C9A84C" />
                            <View>
                                <Text style={styles.dateLabel}>Nhận phòng</Text>
                                <Text style={styles.dateValue}>{fmtDisplay(bCheckIn)}</Text>
                            </View>
                        </TouchableOpacity>
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#555" style={{ alignSelf: "center" }} />
                        <TouchableOpacity
                            style={styles.dateBox}
                            onPress={() => setShowDatePicker("checkout")}
                        >
                            <MaterialCommunityIcons name="calendar-arrow-left" size={16} color="#C9A84C" />
                            <View>
                                <Text style={styles.dateLabel}>Trả phòng</Text>
                                <Text style={styles.dateValue}>{fmtDisplay(bCheckOut)}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Guests */}
                    <View style={styles.guestRow}>
                        <View style={styles.guestBox}>
                            <MaterialCommunityIcons name="account-outline" size={16} color="#888" />
                            <Text style={styles.guestLabel}>Người lớn</Text>
                            <View style={styles.counter}>
                                <TouchableOpacity style={styles.counterBtn} onPress={() => setBAdults(Math.max(1, bAdults - 1))}>
                                    <Text style={styles.counterBtnText}>−</Text>
                                </TouchableOpacity>
                                <Text style={styles.counterVal}>{bAdults}</Text>
                                <TouchableOpacity style={styles.counterBtn} onPress={() => setBAdults(bAdults + 1)}>
                                    <Text style={styles.counterBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.guestBox}>
                            <MaterialCommunityIcons name="account-child-outline" size={16} color="#888" />
                            <Text style={styles.guestLabel}>Trẻ em</Text>
                            <View style={styles.counter}>
                                <TouchableOpacity style={styles.counterBtn} onPress={() => setBChildren(Math.max(0, bChildren - 1))}>
                                    <Text style={styles.counterBtnText}>−</Text>
                                </TouchableOpacity>
                                <Text style={styles.counterVal}>{bChildren}</Text>
                                <TouchableOpacity style={styles.counterBtn} onPress={() => setBChildren(bChildren + 1)}>
                                    <Text style={styles.counterBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Availability status */}
                    <View style={styles.availabilityBox}>
                        {checkingAvailability ? (
                            <View style={styles.availabilityRow}>
                                <ActivityIndicator size="small" color="#C9A84C" />
                                <Text style={styles.availabilityText}>Đang kiểm tra phòng trống...</Text>
                            </View>
                        ) : availabilityError ? (
                            <Text style={[styles.availabilityText, styles.availabilityErrorText]}>
                                Không kiểm tra được phòng trống. Bạn vẫn có thể thử đặt để hệ thống xác nhận.
                            </Text>
                        ) : availableCount !== null ? (
                            <>
                                <Text
                                    style={[
                                        styles.availabilityText,
                                        availableCount > 0
                                            ? styles.availabilityOkText
                                            : styles.availabilityErrorText,
                                    ]}
                                >
                                    {availableCount > 0
                                        ? `✓  Còn ${availableCount} phòng trống cho khoảng ngày này.`
                                        : "✕  Hết phòng cho khoảng ngày này."}
                                </Text>

                                {/* Suggestion when no rooms */}
                                {availableCount === 0 && (
                                    <View style={styles.suggestionWrap}>
                                        {findingNext ? (
                                            <View style={styles.availabilityRow}>
                                                <ActivityIndicator size="small" color="#C9A84C" />
                                                <Text style={styles.suggestionSearchText}>
                                                    Đang tìm ngày gần nhất còn phòng...
                                                </Text>
                                            </View>
                                        ) : suggestedDates ? (
                                            <View style={styles.suggestionChip}>
                                                <MaterialCommunityIcons
                                                    name="lightbulb-outline"
                                                    size={14}
                                                    color="#C9A84C"
                                                />
                                                <Text style={styles.suggestionText}>
                                                    Gợi ý: {fmtDisplay(suggestedDates.checkIn)} → {fmtDisplay(suggestedDates.checkOut)}
                                                </Text>
                                                <TouchableOpacity
                                                    style={styles.applyBtn}
                                                    onPress={() => {
                                                        setBCheckIn(suggestedDates.checkIn);
                                                        setBCheckOut(suggestedDates.checkOut);
                                                    }}
                                                >
                                                    <Text style={styles.applyBtnText}>Áp dụng</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <Text style={[styles.availabilityText, { color: "#888" }]}>
                                                Không tìm thấy phòng trống trong 30 ngày tới.
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </>
                        ) : (
                            <Text style={styles.availabilityText}>Chưa có dữ liệu phòng trống.</Text>
                        )}
                    </View>

                    {/* Confirm */}
                    <TouchableOpacity
                        style={[
                            styles.confirmBtn,
                            !checkingAvailability && availableCount !== null && availableCount <= 0
                                ? styles.confirmBtnDisabled
                                : null,
                        ]}
                        onPress={handleConfirmBooking}
                        disabled={!checkingAvailability && availableCount !== null && availableCount <= 0}
                    >
                        <MaterialCommunityIcons name="calendar-check" size={18} color="#1A1A2E" />
                        <Text style={styles.confirmBtnText}>Tiếp tục đặt phòng</Text>
                    </TouchableOpacity>
                </View>

                {/* DateTimePicker iOS — inside Modal */}
                {showDatePicker && Platform.OS === "ios" && (
                    <Modal transparent animationType="slide">
                        <View style={styles.pickerModal}>
                            <View style={styles.pickerModalInner}>
                                <View style={styles.pickerModalHeader}>
                                    <Text style={styles.pickerModalTitle}>
                                        {showDatePicker === "checkin" ? "Chọn ngày nhận phòng" : "Chọn ngày trả phòng"}
                                    </Text>
                                    <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                                        <Text style={styles.pickerDone}>Xong</Text>
                                    </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                    value={showDatePicker === "checkin" ? bCheckIn : bCheckOut}
                                    mode="date"
                                    display="spinner"
                                    minimumDate={showDatePicker === "checkin" ? new Date() : dayAfter(bCheckIn)}
                                    onValueChange={handleDateChange}
                                    textColor="#fff"
                                />
                            </View>
                        </View>
                    </Modal>
                )}
            </Modal>

            {/* DateTimePicker Android — outside Modal */}
            {showDatePicker && Platform.OS === "android" && (
                <DateTimePicker
                    value={showDatePicker === "checkin" ? bCheckIn : bCheckOut}
                    mode="date"
                    display="default"
                    minimumDate={showDatePicker === "checkin" ? new Date() : dayAfter(bCheckIn)}
                    onValueChange={handleDateChange}
                    onDismiss={() => setShowDatePicker(null)}
                    onNeutralButtonPress={() => setShowDatePicker(null)}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#1A1A2E" },
    headerOverlay: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        zIndex: 50,
        elevation: 50,
    },
    centerBox: {
        flex: 1,
        backgroundColor: "#1A1A2E",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
    },

    // Gallery
    galleryWrap: { position: "relative" },
    galleryImage: { width: SCREEN_WIDTH, height: 260, resizeMode: "cover" },
    imagePlaceholder: {
        width: SCREEN_WIDTH,
        height: 260,
        backgroundColor: "#2A2A3E",
        justifyContent: "center",
        alignItems: "center",
    },
    dotsRow: {
        position: "absolute",
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
    dotActive: { backgroundColor: "#C9A84C", width: 18 },
    backBtn: {
        position: "absolute",
        left: 14,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 20,
        width: 38,
        height: 38,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
        elevation: 10,
    },

    // Content
    content: { padding: 20 },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    title: { fontSize: 22, fontWeight: "bold", color: "#fff", flex: 1 },
    occupancyBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(201,168,76,0.15)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 10,
    },
    occupancyText: { fontSize: 12, color: "#C9A84C", fontWeight: "600" },
    priceBox: { flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 4 },
    priceLabel: { fontSize: 13, color: "#888" },
    price: { fontSize: 22, fontWeight: "bold", color: "#C9A84C" },
    priceUnit: { fontSize: 13, color: "#888" },
    divider: { height: 1, backgroundColor: "rgba(255,255,255,0.07)", marginVertical: 18 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 10 },
    desc: { fontSize: 14, color: "#AAAAAA", lineHeight: 22 },

    // Amenities grid
    amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    amenityItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#2A2A3E",
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 10,
    },
    amenityName: { fontSize: 13, color: "#CCC" },

    // Price rows
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    priceRangeText: { fontSize: 13, color: "#AAAAAA" },
    priceRowVal: { fontSize: 14, fontWeight: "bold", color: "#C9A84C" },

    // Footer
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: "#23243B",
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.08)",
    },
    footerLabel: { fontSize: 12, color: "#888" },
    footerPrice: { fontSize: 18, fontWeight: "bold", color: "#C9A84C" },
    bookBtn: {
        backgroundColor: "#C9A84C",
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 12,
    },
    bookBtnText: { color: "#1A1A2E", fontSize: 15, fontWeight: "bold" },

    // Error
    errorText: { color: "#E05252", fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
    retryBtn: {
        backgroundColor: "#C9A84C",
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
    },
    retryText: { color: "#1A1A2E", fontWeight: "bold" },

    // ── Booking modal ──────────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
    },
    modalSheet: {
        backgroundColor: "#1E1E30",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 36,
        paddingTop: 12,
    },
    sheetHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignSelf: "center", marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 17, fontWeight: "700", color: "#fff",
        marginBottom: 18, textAlign: "center",
    },
    dateRow: {
        flexDirection: "row", alignItems: "center",
        gap: 10, marginBottom: 16,
    },
    dateBox: {
        flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
        backgroundColor: "#2A2A3E", borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 12,
    },
    dateLabel: { fontSize: 11, color: "#888" },
    dateValue: { fontSize: 13, color: "#fff", fontWeight: "600" },
    guestRow: {
        flexDirection: "row", gap: 12, marginBottom: 20,
    },
    guestBox: {
        flex: 1, flexDirection: "row", alignItems: "center", gap: 6,
        backgroundColor: "#2A2A3E", borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 10,
    },
    guestLabel: { fontSize: 12, color: "#888", flex: 1 },
    counter: { flexDirection: "row", alignItems: "center", gap: 8 },
    counterBtn: {
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: "#3A3A4E",
        justifyContent: "center", alignItems: "center",
    },
    counterBtnText: { color: "#C9A84C", fontSize: 18, lineHeight: 22, fontWeight: "bold" },
    counterVal: { color: "#fff", fontSize: 15, fontWeight: "bold", minWidth: 20, textAlign: "center" },
    availabilityBox: {
        backgroundColor: "#2A2A3E",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 14,
        gap: 8,
    },
    availabilityRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    availabilityText: { color: "#DDD", fontSize: 13, lineHeight: 18 },
    availabilityOkText: { color: "#7FB069", fontWeight: "600" },
    availabilityErrorText: { color: "#E08E8E", fontWeight: "600" },
    suggestionWrap: { marginTop: 4 },
    suggestionSearchText: { color: "#888", fontSize: 12 },
    suggestionChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
    },
    suggestionText: { color: "#C9A84C", fontSize: 13, flex: 1, flexShrink: 1 },
    applyBtn: {
        backgroundColor: "rgba(201,168,76,0.2)",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: "rgba(201,168,76,0.5)",
    },
    applyBtnText: { color: "#C9A84C", fontSize: 12, fontWeight: "700" },
    confirmBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 8, backgroundColor: "#C9A84C",
        borderRadius: 14, paddingVertical: 14,
    },
    confirmBtnDisabled: {
        opacity: 0.45,
    },
    confirmBtnText: { color: "#1A1A2E", fontWeight: "bold", fontSize: 15 },

    // DateTimePicker iOS modal
    pickerModal: {
        flex: 1, justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    pickerModalInner: {
        backgroundColor: "#1E1E30",
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        paddingBottom: 24,
    },
    pickerModalHeader: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", padding: 16,
        borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
    },
    pickerModalTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
    pickerDone: { color: "#C9A84C", fontSize: 15, fontWeight: "700" },
});

export default RoomTypeDetail;

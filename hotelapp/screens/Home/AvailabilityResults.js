import { useMemo, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const formatPrice = (val) => `${Number(val).toLocaleString("vi-VN")}₫`;

const RoomTypeAvailCard = ({ item, onBook, onViewDetail }) => (
    <View style={styles.card}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => onViewDetail(item)}>
            {item.primary_image ? (
                <Image source={{ uri: item.primary_image }} style={styles.cardImg} />
            ) : (
                <View style={styles.cardImgPlaceholder}>
                    <MaterialCommunityIcons name="bed-outline" size={36} color="#555" />
                </View>
            )}
        </TouchableOpacity>
        <View style={styles.cardBody}>
            <TouchableOpacity onPress={() => onViewDetail(item)}>
                <Text style={styles.cardName}>{item.name}</Text>
            </TouchableOpacity>
            <View style={styles.cardRow}>
                <MaterialCommunityIcons name="account-group-outline" size={13} color="#888" />
                <Text style={styles.cardMeta}>{item.max_occupancy} khách tối đa</Text>
            </View>
            <View style={styles.cardRow}>
                <MaterialCommunityIcons name="door-open" size={13} color="#7FB069" />
                <Text style={[styles.cardMeta, { color: "#7FB069" }]}>
                    {item.available_count} phòng còn trống
                </Text>
            </View>
            <View style={styles.priceRow}>
                <View>
                    <Text style={styles.pricePerNight}>{formatPrice(item.price_per_night)}<Text style={styles.priceUnit}>/đêm</Text></Text>
                    {item.total_price !== item.price_per_night && (
                        <Text style={styles.priceTotal}>Tổng: {formatPrice(item.total_price)}</Text>
                    )}
                </View>
                <View style={styles.cardBtns}>
                    <TouchableOpacity style={styles.detailBtn} onPress={() => onViewDetail(item)}>
                        <Text style={styles.detailBtnText}>Chi tiết</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bookBtn} onPress={() => onBook(item)}>
                        <Text style={styles.bookBtnText}>Đặt ngay</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </View>
);

export default function AvailabilityResults({ route, navigation }) {
    const { results, checkIn, checkOut, adults, children } = route.params ?? {};

    const roomTypes = Array.isArray(results?.room_types)
        ? results.room_types
        : Array.isArray(results)
        ? results
        : [];
    const nights = results?.nights ?? null;
    const [selectedTypeId, setSelectedTypeId] = useState(null);
    const [menuVisible, setMenuVisible]         = useState(false);
    const [sortOrder, setSortOrder]             = useState(null); // 'asc' | 'desc'

    const selectedLabel = selectedTypeId
        ? (roomTypes.find((rt) => rt.room_type_id === selectedTypeId)?.name ?? "Tất cả")
        : "Tất cả loại phòng";

    const filteredRoomTypes = useMemo(() => {
        let list = selectedTypeId
            ? roomTypes.filter((rt) => rt.room_type_id === selectedTypeId)
            : [...roomTypes];
        if (sortOrder === "asc")  list.sort((a, b) => Number(a.price_per_night) - Number(b.price_per_night));
        if (sortOrder === "desc") list.sort((a, b) => Number(b.price_per_night) - Number(a.price_per_night));
        return list;
    }, [roomTypes, selectedTypeId, sortOrder]);

    const handleViewDetail = (item) => {
        navigation.navigate("room-type-detail", {
            roomType: {
                id: item.room_type_id,
                name: item.name,
                base_price: item.price_per_night,
                max_occupancy: item.max_occupancy,
                primary_image: item.primary_image,
            },
            hideBooking: true,
        });
    };

    const handleBook = (item) => {
        navigation.navigate("booking-create", {
            roomTypeId: item.room_type_id,
            roomTypeName: item.name,
            checkIn,
            checkOut,
            adults,
            children,
            pricePerNight: item.price_per_night,
            totalPrice: item.total_price,
            nights,
        });
    };

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Phòng trống</Text>
                    <Text style={styles.headerSub}>
                        {checkIn} → {checkOut}
                        {nights ? `  ·  ${nights} đêm` : ""}
                        {"  ·  "}{adults} NL{children > 0 ? `, ${children} TE` : ""}
                    </Text>
                </View>
            </View>

            {roomTypes.length === 0 ? (
                <View style={styles.emptyBox}>
                    <MaterialCommunityIcons name="bed-empty" size={56} color="#333" />
                    <Text style={styles.emptyTitle}>Không tìm thấy phòng</Text>
                    <Text style={styles.emptyText}>Vui lòng thử chọn ngày hoặc số khách khác.</Text>
                    <TouchableOpacity style={styles.backAction} onPress={() => navigation.goBack()}>
                        <Text style={styles.backActionText}>← Tìm lại</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredRoomTypes}
                    keyExtractor={(item, idx) => (item.room_type_id ?? idx).toString()}
                    renderItem={({ item }) => <RoomTypeAvailCard item={item} onBook={handleBook} onViewDetail={handleViewDetail} />}
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <View>
                            {/* Room type dropdown */}
                            <TouchableOpacity
                                style={styles.dropdownBtn}
                                onPress={() => setMenuVisible(true)}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="bed-outline" size={16} color="#C9A84C" />
                                <Text style={styles.dropdownBtnText} numberOfLines={1}>{selectedLabel}</Text>
                                <MaterialCommunityIcons name="chevron-down" size={18} color="#888" />
                            </TouchableOpacity>

                            {/* Sort + count row */}
                            <View style={styles.sortRow}>
                                <Text style={styles.resultCount}>{filteredRoomTypes.length} loại phòng</Text>
                                <View style={styles.sortBtns}>
                                    <TouchableOpacity
                                        style={[styles.sortBtn, sortOrder === "asc" && styles.sortBtnActive]}
                                        onPress={() => setSortOrder(sortOrder === "asc" ? null : "asc")}
                                    >
                                        <MaterialCommunityIcons name="sort-ascending" size={14} color={sortOrder === "asc" ? "#1A1A2E" : "#888"} />
                                        <Text style={[styles.sortBtnText, sortOrder === "asc" && styles.sortBtnTextActive]}>Giá thấp</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.sortBtn, sortOrder === "desc" && styles.sortBtnActive]}
                                        onPress={() => setSortOrder(sortOrder === "desc" ? null : "desc")}
                                    >
                                        <MaterialCommunityIcons name="sort-descending" size={14} color={sortOrder === "desc" ? "#1A1A2E" : "#888"} />
                                        <Text style={[styles.sortBtnText, sortOrder === "desc" && styles.sortBtnTextActive]}>Giá cao</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.noResultBox}>
                            <MaterialCommunityIcons name="filter-off-outline" size={40} color="#333" />
                            <Text style={styles.noResultText}>Không tìm thấy loại phòng phù hợp.</Text>
                        </View>
                    }
                />
            )}
            {/* Room type picker modal */}
            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuSheet}>
                        <Text style={styles.menuTitle}>Chọn loại phòng</Text>

                        {/* All option */}
                        <TouchableOpacity
                            style={[styles.menuItem, selectedTypeId === null && styles.menuItemActive]}
                            onPress={() => { setSelectedTypeId(null); setMenuVisible(false); }}
                        >
                            <MaterialCommunityIcons
                                name={selectedTypeId === null ? "check-circle" : "circle-outline"}
                                size={18}
                                color={selectedTypeId === null ? "#C9A84C" : "#555"}
                            />
                            <Text style={[styles.menuItemText, selectedTypeId === null && styles.menuItemTextActive]}>
                                Tất cả loại phòng
                            </Text>
                        </TouchableOpacity>

                        {roomTypes.map((rt) => (
                            <TouchableOpacity
                                key={rt.room_type_id}
                                style={[styles.menuItem, selectedTypeId === rt.room_type_id && styles.menuItemActive]}
                                onPress={() => { setSelectedTypeId(rt.room_type_id); setMenuVisible(false); }}
                            >
                                <MaterialCommunityIcons
                                    name={selectedTypeId === rt.room_type_id ? "check-circle" : "circle-outline"}
                                    size={18}
                                    color={selectedTypeId === rt.room_type_id ? "#C9A84C" : "#555"}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.menuItemText, selectedTypeId === rt.room_type_id && styles.menuItemTextActive]}>
                                        {rt.name}
                                    </Text>
                                    <Text style={styles.menuItemSub}>
                                        {formatPrice(rt.price_per_night)}/đêm · {rt.available_count} phòng
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
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
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#23243B",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: { fontSize: 17, fontWeight: "bold", color: "#fff" },
    headerSub:   { fontSize: 12, color: "#888", marginTop: 1 },

    resultCount: { fontSize: 13, color: "#888", marginBottom: 14 },

    card: {
        backgroundColor: "#23243B",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
    },
    cardImg: { width: "100%", height: 160, resizeMode: "cover" },
    cardImgPlaceholder: {
        width: "100%",
        height: 160,
        backgroundColor: "#2A2A3E",
        justifyContent: "center",
        alignItems: "center",
    },
    cardBody: { padding: 14 },
    cardName: { fontSize: 16, fontWeight: "bold", color: "#fff", marginBottom: 8 },
    cardRow:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    cardMeta: { fontSize: 13, color: "#888" },
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: 12,
    },
    pricePerNight: { fontSize: 17, fontWeight: "bold", color: "#C9A84C" },
    priceUnit:     { fontSize: 13, fontWeight: "normal", color: "#888" },
    priceTotal:    { fontSize: 12, color: "#666", marginTop: 2 },
    cardBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
    detailBtn: {
        borderWidth: 1,
        borderColor: "#C9A84C",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    detailBtnText: { color: "#C9A84C", fontWeight: "600", fontSize: 13 },
    bookBtn: {
        backgroundColor: "#C9A84C",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    bookBtnText: { color: "#1A1A2E", fontWeight: "bold", fontSize: 13 },

    emptyBox:   { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
    emptyText:  { fontSize: 14, color: "#666", textAlign: "center" },
    backAction: { marginTop: 8 },
    backActionText: { color: "#C9A84C", fontSize: 15, fontWeight: "600" },

    dropdownBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#23243B",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
        gap: 10,
    },
    dropdownBtnText: {
        flex: 1,
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    menuSheet: {
        backgroundColor: "#23243B",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 16,
        paddingBottom: 32,
        paddingHorizontal: 16,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    menuItemActive: {
        backgroundColor: "rgba(201,168,76,0.07)",
        borderRadius: 10,
        paddingHorizontal: 6,
        marginHorizontal: -6,
    },
    menuItemText: {
        fontSize: 14,
        color: "#ccc",
        fontWeight: "500",
    },
    menuItemTextActive: {
        color: "#C9A84C",
        fontWeight: "700",
    },
    menuItemSub: {
        fontSize: 12,
        color: "#555",
        marginTop: 2,
    },
    sortRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    sortBtns: {
        flexDirection: "row",
        gap: 8,
    },
    sortBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#23243B",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    sortBtnActive: {
        backgroundColor: "#C9A84C",
        borderColor: "#C9A84C",
    },
    sortBtnText: {
        fontSize: 12,
        color: "#888",
        fontWeight: "600",
    },
    sortBtnTextActive: {
        color: "#1A1A2E",
    },
    noResultBox: {
        alignItems: "center",
        paddingTop: 40,
        gap: 10,
    },
    noResultText: {
        color: "#555",
        fontSize: 14,
    },
});

import { useCallback, useRef, useState } from "react";
import {
    Alert,
    BackHandler,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function VNPayScreen({ route, navigation }) {
    const { paymentUrl, booking } = route.params;
    const webViewRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const handledRef = useRef(false); // ngăn xử lý nhiều lần

    // Bắt nút back Android
    useFocusEffect(
        useCallback(() => {
            const sub = BackHandler.addEventListener("hardwareBackPress", () => {
                handleCancel();
                return true;
            });
            return () => sub.remove();
        }, [])
    );

    const goToBookingDetail = useCallback((bookingId) => {
        navigation.reset({
            index: 1,
            routes: [
                { name: "main", params: { screen: "booking-list" } },
                { name: "booking-detail", params: { bookingId } },
            ],
        });
    }, [navigation]);

    const handleCancel = () => {
        Alert.alert(
            "Huỷ thanh toán?",
            "Đặt phòng đã được tạo nhưng chưa thanh toán. Bạn có thể thanh toán sau trong chi tiết đặt phòng.",
            [
                { text: "Tiếp tục thanh toán", style: "cancel" },
                {
                    text: "Xem chi tiết đặt phòng",
                    onPress: () => goToBookingDetail(booking.id),
                },
            ]
        );
    };

    const handleMessage = (event) => {
        if (handledRef.current) return;
        try {
            const data = JSON.parse(event.nativeEvent.data);
            handledRef.current = true;
            if (data.success) {
                goToBookingDetail(data.booking_id || booking.id);
            } else {
                Alert.alert(
                    "Thanh toán thất bại",
                    data.message || "Vui lòng thử lại.",
                    [
                        {
                            text: "Thử lại",
                            onPress: () => {
                                handledRef.current = false;
                                webViewRef.current?.reload();
                            },
                        },
                        {
                            text: "Xem chi tiết đặt phòng",
                            onPress: () => goToBookingDetail(data.booking_id || booking.id),
                        },
                    ],
                    { cancelable: false }
                );
            }
        } catch {
            // Bỏ qua message không phải JSON (ví dụ từ trang VNPay)
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
                    <MaterialCommunityIcons name="close" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thanh toán VNPay</Text>
                <View style={styles.headerRight} />
            </View>

            {/* WebView */}
            <WebView
                ref={webViewRef}
                source={{ uri: paymentUrl }}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onMessage={handleMessage}
                javaScriptEnabled
                domStorageEnabled
                style={styles.webview}
            />

            {/* Loading overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#C9A84C" />
                    <Text style={styles.loadingText}>Đang tải trang thanh toán...</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1A1A2E",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.08)",
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    headerRight: {
        width: 36,
    },
    webview: {
        flex: 1,
        backgroundColor: "#fff",
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        top: 57, // below header
        backgroundColor: "#1A1A2E",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
    },
    loadingText: {
        color: "#aaa",
        fontSize: 14,
    },
});

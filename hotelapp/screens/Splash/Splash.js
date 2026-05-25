import { useContext, useEffect, useRef } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    ActivityIndicator,
    Animated,
    Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";

const Splash = ({ navigation }) => {
    const [user, dispatch] = useContext(MyUserContext);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const moveAnim = useRef(new Animated.Value(18)).current;
    const pulseAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        const checkToken = async () => {
            try {
                const token = await AsyncStorage.getItem("access_token");

                if (!token) {
                    // Không có token -> vào Login
                    navigation.replace("login");
                    return;
                }

                // Có token -> validate bằng /auth/me/
                const res = await authApis(token).get(endpoints.me);
                const userData = res.data.data;

                // Kiểm tra role được phép vào app
                if (userData.role !== "customer" && userData.role !== "housekeeping") {
                    await AsyncStorage.removeItem("access_token");
                    await AsyncStorage.removeItem("refresh_token");
                    navigation.replace("login");
                    return;
                }

                // Lưu user vào context
                dispatch({ type: "LOGIN", payload: { ...userData, token } });

                // Điều hướng theo role
                if (userData.role === "housekeeping") {
                    navigation.replace("housekeeping-tasks");
                } else {
                    navigation.replace("main");
                }
            } catch (err) {
                // Token hết hạn hoặc không hợp lệ -> xóa và vào Login
                await AsyncStorage.removeItem("access_token");
                await AsyncStorage.removeItem("refresh_token");
                navigation.replace("login");
            }
        };

        // Delay nhỏ để hiển thị splash trước
        const timer = setTimeout(checkToken, 1500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 850,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(moveAnim, {
                toValue: 0,
                duration: 850,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.8,
                    duration: 700,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        ).start();
    }, [fadeAnim, moveAnim, pulseAnim]);

    return (
        <View style={styles.container}>
            <View style={styles.orbTop} />
            <View style={styles.orbBottom} />

            <Animated.View
                style={[
                    styles.brandWrap,
                    { opacity: fadeAnim, transform: [{ translateY: moveAnim }] },
                ]}
            >
                <View style={styles.logoFrame}>
                    <Image
                        source={require("../../assets/splash-icon.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.hotelName}>Smart Hotel</Text>
                <Text style={styles.tagline}>Đặt phòng dễ dàng • Trải nghiệm sang trọng</Text>
            </Animated.View>

            <Animated.View style={[styles.loaderWrap, { opacity: pulseAnim }]}>
                <ActivityIndicator size="small" color="#C9A84C" />
                <Text style={styles.loadingText}>Đang khởi động...</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1A1A2E",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    orbTop: {
        position: "absolute",
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: "rgba(201, 168, 76, 0.2)",
        top: -70,
        right: -60,
    },
    orbBottom: {
        position: "absolute",
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: "rgba(107, 123, 255, 0.16)",
        bottom: -120,
        left: -80,
    },
    brandWrap: {
        alignItems: "center",
        paddingHorizontal: 24,
    },
    logoFrame: {
        width: 132,
        height: 132,
        borderRadius: 66,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    logo: {
        width: 92,
        height: 92,
    },
    hotelName: {
        fontSize: 38,
        fontWeight: "bold",
        color: "#C9A84C",
        letterSpacing: 1.4,
        marginBottom: 10,
    },
    tagline: {
        fontSize: 13,
        color: "#C8C8D4",
        textAlign: "center",
        letterSpacing: 0.3,
    },
    loaderWrap: {
        position: "absolute",
        bottom: 60,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
    },
    loadingText: {
        color: "#AAAAAA",
        fontSize: 12,
    },
});

export default Splash;

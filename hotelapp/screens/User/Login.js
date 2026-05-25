import { useContext, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import { MyUserContext } from "../../configs/Contexts";
import PasswordInput from "../../components/PasswordInput";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const formatLoginError = (err) => {
    const payload = err?.response?.data;
    const error = payload?.error ?? payload;

    if (!error) {
        return "Đăng nhập thất bại. Vui lòng thử lại.";
    }

    if (typeof error === "string") {
        return error;
    }

    const message = error.message;
    const details = error.details;

    if (message && message !== "Dữ liệu không hợp lệ") {
        return message;
    }

    if (details && typeof details === "object") {
        const fieldMessages = Object.entries(details).flatMap(([field, value]) => {
            if (Array.isArray(value)) {
                return value.map((item) => String(item));
            }
            if (value && typeof value === "object") {
                return [JSON.stringify(value)];
            }
            return [String(value)];
        });

        if (fieldMessages.length > 0) {
            return fieldMessages.join("\n");
        }
    }

    return message || "Đăng nhập thất bại. Vui lòng thử lại.";
};

const Login = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [, dispatch] = useContext(MyUserContext);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ email và mật khẩu.");
            return;
        }

        setLoading(true);
        try {
            const res = await Apis.post(endpoints.login, { email, password });
            const { access, refresh, user } = res.data.data;

            // Kiểm tra role được phép vào app
            if (user.role !== "customer" && user.role !== "housekeeping") {
                Alert.alert(
                    "Không có quyền truy cập",
                    "Ứng dụng này chỉ dành cho khách hàng và nhân viên dọn phòng."
                );
                return;
            }

            // Lưu token
            await AsyncStorage.setItem("access_token", access);
            await AsyncStorage.setItem("refresh_token", refresh);

            // Lưu user vào context
            dispatch({ type: "LOGIN", payload: { ...user, token: access } });

            // Điều hướng theo role
            if (user.role === "housekeeping") {
                navigation.replace("housekeeping-tasks");
            } else {
                navigation.replace("main");
            }
        } catch (err) {
            Alert.alert("Đăng nhập thất bại", formatLoginError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.orbTop} />
            <View style={styles.orbBottom} />

            <View style={styles.card}>
                <View style={styles.brandRow}>
                    <View style={styles.logoFrame}>
                        <Image
                            source={{ uri: "https://res.cloudinary.com/dblzpkokm/image/upload/v1779693884/hotel4_v6p0gv.png" }}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <View>
                        <Text style={styles.title}>Smart Hotel</Text>
                        <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>
                    </View>
                </View>

                <View style={styles.fieldWrap}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputRow}>
                        <MaterialCommunityIcons name="email-outline" size={18} color="#A9ADBC" />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#8C90A1"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                </View>

                <View style={styles.fieldWrap}>
                    <Text style={styles.label}>Mật khẩu</Text>
                    <PasswordInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Mật khẩu"
                        placeholderTextColor="#8C90A1"
                        style={styles.passwordInput}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#121224" />
                    ) : (
                        <Text style={styles.buttonText}>Đăng nhập</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("forgot-password")}> 
                    <Text style={styles.linkMuted}>Quên mật khẩu?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.registerWrap} onPress={() => navigation.navigate("register")}> 
                    <Text style={styles.link}>Chưa có tài khoản? Đăng ký ngay</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1A1A2E",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        overflow: "hidden",
    },
    orbTop: {
        position: "absolute",
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: "rgba(201, 168, 76, 0.18)",
        top: -70,
        right: -70,
    },
    orbBottom: {
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: "rgba(109, 126, 255, 0.16)",
        bottom: -130,
        left: -90,
    },
    card: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "rgba(35, 36, 59, 0.92)",
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 22,
    },
    logoFrame: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    logo: {
        width: 34,
        height: 34,
    },
    fieldWrap: {
        marginBottom: 12,
    },
    label: {
        color: "#C4C8D7",
        fontSize: 13,
        marginBottom: 8,
        marginLeft: 2,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2A2A3E",
        borderRadius: 10,
        paddingLeft: 12,
        paddingRight: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#C9A84C",
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        color: "#AAAAAA",
    },
    input: {
        flex: 1,
        color: "#fff",
        paddingVertical: 13,
        paddingLeft: 10,
        fontSize: 15,
    },
    passwordInput: {
        marginBottom: 0,
    },
    button: {
        width: "100%",
        backgroundColor: "#C9A84C",
        borderRadius: 10,
        padding: 15,
        alignItems: "center",
        marginTop: 8,
        marginBottom: 14,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#141426",
        fontSize: 16,
        fontWeight: "bold",
    },
    linkMuted: {
        color: "#9EA3B8",
        fontSize: 13,
        textAlign: "center",
        textDecorationLine: "underline",
    },
    registerWrap: {
        marginTop: 12,
    },
    link: {
        color: "#C9A84C",
        fontSize: 14,
        textAlign: "center",
        textDecorationLine: "underline",
    },
});

export default Login;

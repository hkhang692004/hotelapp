import { useState } from "react";
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
    ScrollView,
    Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Apis, { endpoints } from "../../configs/Apis";
import PasswordInput from "../../components/PasswordInput";

const Register = ({ navigation }) => {
    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        password_confirm: "",
    });
    const [avatar, setAvatar] = useState(null);
    const [loading, setLoading] = useState(false);

    const updateField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Quyền truy cập", "Cần quyền truy cập thư viện ảnh để chọn ảnh đại diện.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) {
            setAvatar(result.assets[0]);
        }
    };

    const handleRegister = async () => {
        if (!form.full_name || !form.email || !form.phone || !form.password || !form.password_confirm) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
            return;
        }
        if (form.password !== form.password_confirm) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("full_name", form.full_name);
            formData.append("email", form.email);
            formData.append("phone", form.phone);
            formData.append("password", form.password);
            formData.append("password_confirm", form.password_confirm);
            if (avatar) {
                const filename = avatar.uri.split("/").pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";
                formData.append("avatar", { uri: avatar.uri, name: filename, type });
            }

            await Apis.post(endpoints.register, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Alert.alert(
                "Đăng ký thành công",
                "Tài khoản đã được tạo. Vui lòng đăng nhập.",
                [{ text: "Đăng nhập ngay", onPress: () => navigation.replace("login") }]
            );
        } catch (err) {
            const error = err?.response?.data?.error;
            const msg = error?.details
                ? Object.values(error.details).flat().join("\n")
                : error?.message || "Đăng ký thất bại. Vui lòng thử lại.";
            Alert.alert("Đăng ký thất bại", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Tạo tài khoản</Text>
                <Text style={styles.subtitle}>Đăng ký để đặt phòng dễ dàng hơn</Text>

                {/* Ảnh đại diện */}
                <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar} activeOpacity={0.8}>
                    {avatar ? (
                        <Image source={{ uri: avatar.uri }} style={styles.avatarPreview} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <MaterialCommunityIcons name="camera-plus-outline" size={28} color="#888" />
                            <Text style={styles.avatarPickerText}>Ảnh đại diện</Text>
                        </View>
                    )}
                    <View style={styles.avatarEditBadge}>
                        <MaterialCommunityIcons name="pencil" size={12} color="#1A1A2E" />
                    </View>
                </TouchableOpacity>

                <TextInput
                    style={styles.input}
                    placeholder="Họ và tên"
                    placeholderTextColor="#999"
                    value={form.full_name}
                    onChangeText={(v) => updateField("full_name", v)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={form.email}
                    onChangeText={(v) => updateField("email", v)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Số điện thoại"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={form.phone}
                    onChangeText={(v) => updateField("phone", v)}
                />
                <PasswordInput
                    value={form.password}
                    onChangeText={(v) => updateField("password", v)}
                    placeholder="Mật khẩu"
                />
                <PasswordInput
                    value={form.password_confirm}
                    onChangeText={(v) => updateField("password_confirm", v)}
                    placeholder="Xác nhận mật khẩu"
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Đăng ký</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("login")}>
                    <Text style={styles.link}>Đã có tài khoản? Đăng nhập</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#1A1A2E",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingVertical: 48,
    },
    title: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#C9A84C",
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: "#AAAAAA",
        marginBottom: 32,
        textAlign: "center",
    },
    input: {
        width: "100%",
        backgroundColor: "#2A2A3E",
        color: "#fff",
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        fontSize: 15,
    },
    button: {
        width: "100%",
        backgroundColor: "#C9A84C",
        borderRadius: 10,
        padding: 15,
        alignItems: "center",
        marginTop: 8,
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    link: {
        color: "#C9A84C",
        fontSize: 14,
        textDecorationLine: "underline",
    },

    // Avatar picker
    avatarPicker: {
        width: 90,
        height: 90,
        borderRadius: 45,
        marginBottom: 24,
        position: "relative",
    },
    avatarPreview: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
        borderColor: "#C9A84C",
    },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: "#2A2A3E",
        borderWidth: 2,
        borderColor: "#3A3A4E",
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
    },
    avatarPickerText: {
        fontSize: 11,
        color: "#888",
    },
    avatarEditBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: "#C9A84C",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#1A1A2E",
    },
});

export default Register;

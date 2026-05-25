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
} from "react-native";
import Apis, { endpoints } from "../../configs/Apis";
import PasswordInput from "../../components/PasswordInput";

// Bước 1: nhập email để nhận link reset
const StepEmail = ({ onNext }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!email) {
            Alert.alert("Lỗi", "Vui lòng nhập email.");
            return;
        }
        setLoading(true);
        try {
            await Apis.post(endpoints.forgotPassword, { email });
            // Backend luôn trả 200 dù email tồn tại hay không (bảo mật)
            Alert.alert(
                "Đã gửi",
                "Nếu email tồn tại, link đặt lại mật khẩu đã được gửi vào hộp thư của bạn.",
                [{ text: "OK", onPress: () => onNext(email) }]
            );
        } catch (err) {
            Alert.alert("Lỗi", "Không thể gửi yêu cầu. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Text style={styles.title}>Quên mật khẩu</Text>
            <Text style={styles.subtitle}>
                Nhập email đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSend}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Gửi link đặt lại</Text>
                )}
            </TouchableOpacity>
        </>
    );
};

// Bước 2: nhập token từ email + mật khẩu mới
const StepReset = ({ navigation }) => {
    const [form, setForm] = useState({
        token: "",
        new_password: "",
        new_password_confirm: "",
    });
    const [loading, setLoading] = useState(false);

    const updateField = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleReset = async () => {
        if (!form.token || !form.new_password || !form.new_password_confirm) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
            return;
        }
        if (form.new_password !== form.new_password_confirm) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
            return;
        }
        setLoading(true);
        try {
            await Apis.post(endpoints.resetPassword, {
                token: form.token,
                new_password: form.new_password,
                new_password_confirm: form.new_password_confirm,
            });
            Alert.alert("Thành công", "Mật khẩu đã được đặt lại. Vui lòng đăng nhập.", [
                { text: "Đăng nhập", onPress: () => navigation.replace("login") },
            ]);
        } catch (err) {
            const msg =
                err?.response?.data?.error?.message ||
                "Token không hợp lệ hoặc đã hết hạn.";
            Alert.alert("Thất bại", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Text style={styles.title}>Đặt lại mật khẩu</Text>
            <Text style={styles.subtitle}>
                Nhập mã token từ email và mật khẩu mới của bạn.
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Token từ email"
                placeholderTextColor="#999"
                autoCapitalize="none"
                value={form.token}
                onChangeText={(v) => updateField("token", v)}
            />
            <PasswordInput
                value={form.new_password}
                onChangeText={(v) => updateField("new_password", v)}
                placeholder="Mật khẩu mới"
            />
            <PasswordInput
                value={form.new_password_confirm}
                onChangeText={(v) => updateField("new_password_confirm", v)}
                placeholder="Xác nhận mật khẩu mới"
            />

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleReset}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Xác nhận</Text>
                )}
            </TouchableOpacity>
        </>
    );
};

// Màn hình chính — điều phối 2 bước
const ForgotPassword = ({ navigation }) => {
    const [step, setStep] = useState(1); // 1 = nhập email, 2 = nhập token + mật khẩu mới

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.container}>
                {step === 1 ? (
                    <StepEmail onNext={() => setStep(2)} />
                ) : (
                    <StepReset navigation={navigation} />
                )}

                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() =>
                        step === 2 ? setStep(1) : navigation.navigate("login")
                    }
                >
                    <Text style={styles.backText}>
                        {step === 2 ? "← Quay lại bước trước" : "← Quay lại đăng nhập"}
                    </Text>
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
        paddingHorizontal: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#C9A84C",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        color: "#AAAAAA",
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 20,
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
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    backBtn: {
        marginTop: 28,
    },
    backText: {
        color: "#C9A84C",
        fontSize: 14,
    },
});

export default ForgotPassword;

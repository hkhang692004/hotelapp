import { useContext, useState } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    StatusBar,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";

const ROLE_LABEL = {
    customer:     "Khách hàng",
    receptionist: "Lễ tân",
    manager:      "Quản lý",
    housekeeping: "Nhân viên dọn phòng",
};
const ROLE_COLOR = {
    customer:     "#C9A84C",
    receptionist: "#5B9BD5",
    manager:      "#7FB069",
    housekeeping: "#B07FD4",
};

export default function Profile() {
    const [user, dispatch] = useContext(MyUserContext);
    const navigation = useNavigation();

    const [fullName, setFullName]           = useState(user?.full_name ?? "");
    const [phone, setPhone]                 = useState(user?.phone ?? "");
    const [saving, setSaving]               = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const roleLabel = ROLE_LABEL[user?.role] ?? user?.role ?? "Không xác định";
    const roleColor = ROLE_COLOR[user?.role] ?? "#888";
    const initials  = user?.full_name
        ? user.full_name.split(" ").slice(-2).map((w) => w[0].toUpperCase()).join("")
        : "?";

    // ── Đổi avatar ────────────────────────────────────────────────
    const pickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Cần quyền", "Vui lòng cấp quyền truy cập thư viện ảnh.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (result.canceled) return;

        const asset = result.assets[0];
        setUploadingAvatar(true);
        try {
            const form = new FormData();
            form.append("avatar", { uri: asset.uri, name: "avatar.jpg", type: "image/jpeg" });
            const res = await authApis(user?.token).post(endpoints.avatar, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            dispatch({ type: "UPDATE_USER", payload: { avatar: res.data.data?.avatar ?? res.data.avatar } });
        } catch {
            Alert.alert("Lỗi", "Không thể cập nhật ảnh. Vui lòng thử lại.");
        } finally {
            setUploadingAvatar(false);
        }
    };

    // ── Lưu tên & SĐT ─────────────────────────────────────────────
    const saveProfile = async () => {
        const trimName = fullName.trim();
        if (!trimName) { Alert.alert("Lỗi", "Họ tên không được để trống."); return; }
        setSaving(true);
        try {
            const res = await authApis(user?.token).patch(endpoints.me, {
                full_name: trimName,
                phone:     phone.trim(),
            });
            const updated = res.data.data ?? res.data;
            dispatch({ type: "UPDATE_USER", payload: { full_name: updated.full_name, phone: updated.phone } });
            Alert.alert("Thành công", "Thông tin đã được cập nhật.");
        } catch {
            Alert.alert("Lỗi", "Không thể lưu thay đổi. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    const isDirty = fullName.trim() !== (user?.full_name ?? "") || phone.trim() !== (user?.phone ?? "");

    // ── Đăng xuất ─────────────────────────────────────────────────
    const handleLogout = () => {
        Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất không?", [
            { text: "Huỷ", style: "cancel" },
            {
                text: "Đăng xuất",
                style: "destructive",
                onPress: async () => {
                    await AsyncStorage.removeItem("access_token");
                    await AsyncStorage.removeItem("refresh_token");
                    dispatch({ type: "LOGOUT" });
                    navigation.replace("login");
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Avatar ── */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} activeOpacity={0.8}>
                            {uploadingAvatar ? (
                                <View style={styles.avatarCircle}>
                                    <ActivityIndicator color="#1A1A2E" size="large" />
                                </View>
                            ) : user?.avatar ? (
                                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarCircle}>
                                    <Text style={styles.avatarText}>{initials}</Text>
                                </View>
                            )}
                            <View style={styles.cameraBtn}>
                                <MaterialCommunityIcons name="camera-outline" size={16} color="#1A1A2E" />
                            </View>
                        </TouchableOpacity>
                        <View style={[styles.roleBadge, { backgroundColor: roleColor + "30", borderColor: roleColor }]}>
                            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
                        </View>
                    </View>

                    {/* ── Form ── */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Thông tin cá nhân</Text>

                        {/* Email – read only */}
                        <View style={styles.fieldRow}>
                            <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.fieldIcon} />
                            <View style={styles.fieldBody}>
                                <Text style={styles.fieldLabel}>Email</Text>
                                <Text style={styles.fieldReadOnly}>{user?.email || "—"}</Text>
                            </View>
                        </View>

                        {/* Họ tên */}
                        <View style={styles.fieldRow}>
                            <MaterialCommunityIcons name="account-outline" size={20} color="#888" style={styles.fieldIcon} />
                            <View style={styles.fieldBody}>
                                <Text style={styles.fieldLabel}>Họ tên</Text>
                                <TextInput
                                    style={styles.fieldInput}
                                    value={fullName}
                                    onChangeText={setFullName}
                                    placeholder="Nhập họ tên"
                                    placeholderTextColor="#555"
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        {/* SĐT */}
                        <View style={styles.fieldRow}>
                            <MaterialCommunityIcons name="phone-outline" size={20} color="#888" style={styles.fieldIcon} />
                            <View style={styles.fieldBody}>
                                <Text style={styles.fieldLabel}>Số điện thoại</Text>
                                <TextInput
                                    style={styles.fieldInput}
                                    value={phone}
                                    onChangeText={setPhone}
                                    placeholder="Nhập số điện thoại"
                                    placeholderTextColor="#555"
                                    keyboardType="phone-pad"
                                    returnKeyType="done"
                                />
                            </View>
                        </View>
                    </View>

                    {/* ── Lưu ── */}
                    {isDirty && (
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={saveProfile}
                            disabled={saving}
                            activeOpacity={0.85}
                        >
                            {saving
                                ? <ActivityIndicator color="#1A1A2E" size="small" />
                                : <>
                                    <MaterialCommunityIcons name="content-save-outline" size={20} color="#1A1A2E" />
                                    <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                                  </>
                            }
                        </TouchableOpacity>
                    )}

                    {/* ── Đăng xuất ── */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <MaterialCommunityIcons name="logout" size={20} color="#E05252" />
                        <Text style={styles.logoutText}>Đăng xuất</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:   { flex: 1, backgroundColor: "#1A1A2E" },
    scroll: { paddingBottom: 48 },

    avatarSection: { alignItems: "center", paddingTop: 36, paddingBottom: 24 },
    avatarWrap:    { position: "relative", marginBottom: 14 },
    avatarCircle:  {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: "#C9A84C", justifyContent: "center", alignItems: "center",
    },
    avatarImage: {
        width: 96, height: 96, borderRadius: 48,
        borderWidth: 2, borderColor: "#C9A84C",
    },
    avatarText: { fontSize: 34, fontWeight: "bold", color: "#1A1A2E" },
    cameraBtn:  {
        position: "absolute", bottom: 0, right: 0,
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: "#C9A84C", justifyContent: "center", alignItems: "center",
        borderWidth: 2, borderColor: "#1A1A2E",
    },
    roleBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    roleText:  { fontSize: 13, fontWeight: "600" },

    card: {
        marginHorizontal: 20, marginBottom: 16,
        backgroundColor: "#23243B", borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
    },
    cardTitle: {
        fontSize: 12, color: "#888", fontWeight: "600",
        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
    },

    fieldRow: {
        flexDirection: "row", alignItems: "center",
        paddingVertical: 12,
        borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)",
    },
    fieldIcon:     { marginRight: 14, width: 22 },
    fieldBody:     { flex: 1 },
    fieldLabel:    { fontSize: 11, color: "#666", marginBottom: 3 },
    fieldReadOnly: { fontSize: 15, color: "#888" },
    fieldInput: {
        fontSize: 15, color: "#E0E0EA", paddingVertical: 0,
        borderBottomWidth: 1, borderBottomColor: "rgba(201,168,76,0.35)",
    },

    saveBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        marginHorizontal: 20, marginBottom: 12,
        paddingVertical: 14, borderRadius: 12, backgroundColor: "#C9A84C",
    },
    saveBtnText: { color: "#1A1A2E", fontSize: 15, fontWeight: "700" },

    logoutBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
        marginHorizontal: 20, paddingVertical: 14, borderRadius: 12,
        backgroundColor: "rgba(224,82,82,0.12)",
        borderWidth: 1, borderColor: "rgba(224,82,82,0.35)",
    },
    logoutText: { color: "#E05252", fontSize: 15, fontWeight: "700" },
});

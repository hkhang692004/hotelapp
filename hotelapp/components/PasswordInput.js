import { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * Ô nhập mật khẩu có nút ẩn/hiện.
 *
 * Props:
 *   style          — style override cho container View
 *   inputStyle     — style override cho TextInput
 *   value, onChangeText, placeholder, placeholderTextColor
 *   — giống TextInput thông thường
 */
const PasswordInput = ({
    value,
    onChangeText,
    placeholder = "Mật khẩu",
    placeholderTextColor = "#999",
    style,
    inputStyle,
    ...rest
}) => {
    const [secure, setSecure] = useState(true);

    return (
        <View style={[styles.container, style]}>
            <TextInput
                style={[styles.input, inputStyle]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={placeholderTextColor}
                secureTextEntry={secure}
                autoCapitalize="none"
                {...rest}
            />
            <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setSecure((prev) => !prev)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <MaterialCommunityIcons
                    name={secure ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#AAAAAA"
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2A2A3E",
        borderRadius: 10,
        marginBottom: 12,
        minHeight: 50,
    },
    input: {
        flex: 1,
        color: "#fff",
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
    eyeBtn: {
        paddingHorizontal: 14,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default PasswordInput;

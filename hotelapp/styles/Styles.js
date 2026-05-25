import { StyleSheet } from "react-native";

export const COLORS = {
    primary: "#1A1A2E",      // Navy dark
    accent: "#C9A84C",       // Gold
    background: "#F5F5F5",
    white: "#FFFFFF",
    textLight: "#AAAAAA",
    textDark: "#1A1A2E",
    inputBg: "#2A2A3E",
    error: "#E74C3C",
    success: "#2ECC71",
    border: "#E0E0E0",
};

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    center: {
        alignItems: "center",
        justifyContent: "center",
    },
    padding: {
        padding: 16,
    },
    margin: {
        margin: 8,
    },
    subject: {
        fontSize: 22,
        fontWeight: "bold",
        color: COLORS.textDark,
        marginBottom: 8,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: COLORS.accent,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: "flex-start",
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.white,
    },
});

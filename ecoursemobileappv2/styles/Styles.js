import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 50
    }, 
    row: {
        flexDirection: "row"
    },
    wrap: {
        flexWrap: "wrap"
    },
    padding: {
        padding: 5
    },
    margin: {
        margin: 5
    },
    subject: {
        fontSize: 24,
        fontWeight: "bold",
        color: "blue",
        textAlign: "center",
        marginTop: 5
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 50
    }
});
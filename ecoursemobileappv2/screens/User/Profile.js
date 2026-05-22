import { Image, Text, View } from "react-native";
import Styles from "../../styles/Styles";
import { useContext } from "react";
import { MyUserContext } from "../../configs/Contexts";
import { Button } from "react-native-paper";

const Profile = () => {
    const [user, dispatch] = useContext(MyUserContext);
    return (
        <View style={Styles.padding}>
            <Text style={Styles.subject}>THÔNG TIN NGƯỜI DÙNG</Text>

            <Image source={{ uri: user.avatar }} style={Styles.avatar} />
            <Button onPress={() => dispatch({ "type": "LOGOUT" })}>Đăng xuất</Button>
        </View>
    );
}

export default Profile;
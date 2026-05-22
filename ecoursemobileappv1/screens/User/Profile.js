import { Image, Text } from "react-native";
import Styles from "../../styles/Styles";
import { useContext } from "react";
import { MyUserContext } from "../../configs/Contexts";
import { Button } from "react-native-paper";

const Profile = () => {
    const [user, dispatch] = useContext(MyUserContext);

    return (
        <>
            <Text style={Styles.subject}>THÔNG TIN NGƯỜI DÙNG: {user.username}</Text>
            <Image source={{uri: user.avatar}} style={[Styles.avatar, Styles.subject]} />
            <Button mode="contained-tonal" onPress={() => dispatch({"type": "LOGOUT"})}>Đăng xuất</Button>
        </>
    );
}

export default Profile;
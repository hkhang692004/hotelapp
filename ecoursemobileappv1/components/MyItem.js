import { List } from "react-native-paper";
import Styles from "../styles/Styles";
import { Image, TouchableOpacity } from "react-native";

const MyItem = ({item, next}) => {
    return (
        <List.Item
            title={item.subject}
            description={item.created_date}
            left={() => <TouchableOpacity onPress={next}>
                <Image style={Styles.avatar} source={{uri: item.image}} />
            </TouchableOpacity>}
        />
    );
}

export default MyItem;
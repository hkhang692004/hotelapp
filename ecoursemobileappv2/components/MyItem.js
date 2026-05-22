import { Image, TouchableOpacity } from "react-native";
import { List } from "react-native-paper";
import Styles from "../styles/Styles";

const MyItem = ({item, next}) => {
    return (
        <List.Item  title={item.subject}
                    description={item.created_date}
                    left={() => <TouchableOpacity onPress={next}>
                        <Image style={Styles.avatar} source={{uri: item.image}} />
                    </TouchableOpacity>}
        />
    );
}

export default MyItem
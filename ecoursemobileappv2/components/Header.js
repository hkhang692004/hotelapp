import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Apis, { endpoints } from "../configs/Apis";
import { Chip } from "react-native-paper";
import Styles from "../styles/Styles";

const Header = ({cateId, setCateId}) => {
    const [categories, setCategories] = useState([]);

    const loadCategories = async () => {
        try {
            let res = await Apis.get(endpoints['categories']);
            setCategories(res.data);
        } catch (ex) {
            console.error(ex);
        }
    }

    useEffect(() => {
        loadCategories();
    }, []);

    return (
        <View style={[Styles.row, Styles.wrap]}>
            <TouchableOpacity onPress={() => setCateId(null)} style={Styles.padding}>
                <Chip mode={cateId===null?"outlined":"flat"} icon="label">Tất cả</Chip>
            </TouchableOpacity>

            {categories.map(c => <TouchableOpacity onPress={() => setCateId(c.id)} style={Styles.padding}  key={`c${c.id}`}>
                <Chip mode={cateId===c.id?"outlined":"flat"} icon="label">{c.name}</Chip>
            </TouchableOpacity>)}
        </View>
    );
}

export default Header;
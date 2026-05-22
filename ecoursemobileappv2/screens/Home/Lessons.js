import { FlatList, Text, View } from "react-native";
import Styles from "../../styles/Styles";
import { useEffect, useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import MyItem from "../../components/MyItem";
import { useNavigation } from "@react-navigation/native";

const Lessons = ({route}) => {
    const courseId = route.params?.courseId;
    const [lessons, setLessons] = useState([]);
    const nav = useNavigation();

    const loadLessons = async () => {
        let res = await Apis.get(endpoints['lessons'](courseId));
        setLessons(res.data)
    }

    useEffect(() => {
        loadLessons();
    }, [courseId])

    return (
        <View style={Styles.padding}>
            <FlatList data={lessons} 
                      renderItem={({item}) => <MyItem key={item.id} item={item} 
                                                      next={() => nav.navigate('lesson-details', {lessonId: item.id})} />} />
       </View>
    );
}

export default Lessons;
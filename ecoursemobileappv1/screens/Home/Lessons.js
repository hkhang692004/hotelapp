import { FlatList, Text } from "react-native";
import Styles from "../../styles/Styles";
import Apis, { endpoints } from "../../configs/Apis";
import { useEffect, useState } from "react";
import MyItem from "../../components/MyItem";
import { useNavigation } from "@react-navigation/native";

const Lessons = ({route}) => {
    const courseId = route.params?.courseId;
    const [lessons, setLessons] = useState([]);
    const nav = useNavigation();

    const loadLessons = async () => {
        let res = await Apis.get(endpoints['lessons'](courseId));
        setLessons(res.data);
    }

    useEffect(() => {
        loadLessons();
    }, [courseId]);

    return (
        <FlatList data={lessons} renderItem={ ({item}) => <MyItem key={item.id} item={item} next={() => nav.navigate('lesson-details', {'lessonId': item.id})} />} />
    );
}

export default Lessons;
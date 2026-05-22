import { ScrollView } from "react-native";
import Styles from "../../styles/Styles";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from "../../configs/Contexts";

const Login = () => {
    const userInfo = [{
        field: 'username',
        label: 'Tên đăng nhập',
        icon: 'account'
    }, {
        field: 'password',
        label: 'Mật khẩu',
        icon: 'eye',
        secureTextEntry: true
    }];

    const [user, setUser] = useState({});
    const [err, setErr] = useState();
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();
    const [, dispatch] = useContext(MyUserContext);


    const validate = () => {
        for (var i of userInfo)
            if (!(i.field in user) || !user[i.field]) {
                setErr(`Vui lòng nhập ${i.label}!`);
                return false;
            } 
            

        return true;
    }

    const login = async () => {
        if (validate() === true) {
            setErr("");
            try {
                setLoading(true);
                let res = await Apis.post(endpoints['login'], {
                    ...user,
                    'client_id': 'kPWFlwLyiqLXERBb5eLKweI18DctNC9mCThs06GO',
                    'client_secret': 'YKmrXKVdgpjlTVjcvB7A32X2yuJl3DZhLHLPiT3iUDDq1pXCsg6gWH8enSkK59AgsATiTQRAiVP36zN0FY1nMcwMzh0zpMfmK89YDOw47HuiycxYWDYFNO4ABJ2YnGJA', 
                    'grant_type': 'password'
                });
                console.info(res.data);
                await AsyncStorage.setItem('token', res.data.access_token);
                
                let u = await authApis(res.data.access_token).get(endpoints['current-user']);
                console.info(u.data);
                dispatch({
                    "type": "LOGIN",
                    "payload": u.data
                });
            } catch (ex) {
                console.error(ex);
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <ScrollView style={Styles.padding}>
            {err && <HelperText type="error" visible={err}>{err}</HelperText>}
            {userInfo.map(i => <TextInput key={i.field} style={Styles.margin} 
                                        value={user[i.field]} onChangeText={t => setUser({...user, [i.field]: t})}
                                        label={i.label}
                                        secureTextEntry={i.secureTextEntry}
                                        right={<TextInput.Icon icon={i.icon} />} />)}


            <Button loading={loading} disabled={loading} onPress={login} 
                    style={Styles.margin} mode="contained">Đăng nhập</Button>
        </ScrollView>
    );
}

export default Login;
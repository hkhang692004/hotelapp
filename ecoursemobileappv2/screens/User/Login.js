import { Image, Text, TouchableOpacity, View } from "react-native";
import Styles from "../../styles/Styles";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from "../../configs/Contexts";

const Login = ({ route }) => {

    const userInfo = [{
        field: 'username',
        title: 'Tên đăng nhập',
        icon: 'account',
    }, {
        field: 'password',
        title: 'Mật khẩu',
        icon: 'eye',
        secureTextEntry: true
    }];

    const [user, setUser] = useState({});
    const [err, setErr] = useState(null);
    const nav = useNavigation();
    const [loading, setLoading] = useState(false);
    const [, dispatch] = useContext(MyUserContext);
    const next = route.params?.next || "home";

    const validate = () => {
        if (!user.username)
            setErr('Vui lòng nhập tên đăng nhập');
        else if (!user.password)
            setErr('Vui lòng nhập tên mật khẩu!');
        else
            return true;
    }

    const login = async () => {
        if (validate()) {

            try {
                setLoading(true);

                let res = await Apis.post(endpoints['login'], {
                    ...user,
                    'client_id': 'yov5fEFnCDCNee1DXzFVYQg9F3Jo9XuRKNhUkC3Y',
                    'client_secret': '0amImsdzdjR2g3uASzSJr03RiBLRYLqxB0OQ34z8YBVO04BSaKdKI19Hf9cnWyd8vKpl8itT4NOT72lfQNSO4gtuHrwOqfuEy6T88wHZTW7rHUs58UNw7bGXMoWgpxcy',
                    'grant_type': 'password'
                })

                // AsyncS
                console.info(res.data);
                await AsyncStorage.setItem('token', res.data.access_token);


                // setTimeout(async () => {
                let u = await authApis(res.data.access_token).get(endpoints['current-user']);

                dispatch({
                    "type": "LOGIN",
                    "payload": u.data
                })

                nav.navigate(next, route.params?.params);

                // }, 500);
            } catch (ex) {
                console.error(ex);
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <View style={Styles.padding}>
            <HelperText style={Styles.margin} type="error" visible={err}>
                {err}
            </HelperText>
            {userInfo.map(u => <TextInput value={user[u.field]} key={u.field}
                onChangeText={(t) => setUser({ ...user, [u.field]: t })}
                style={Styles.margin} label={u.title} placeholder={u.title}
                secureTextEntry={u.secureTextEntry}
                right={<TextInput.Icon icon={u.icon} />} />)}


            <Button loading={loading} disabled={loading} mode="contained" onPress={login}>Đăng nhập</Button>

        </View>
    );
}

export default Login;
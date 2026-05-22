import { Image, ScrollView, Text, TouchableOpacity } from "react-native";
import Styles from "../../styles/Styles";
import { Button, HelperText, TextInput } from "react-native-paper";
import * as ImgPicker from 'expo-image-picker';
import { useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";

const Register = () => {
    const userInfo = [{
        field: 'first_name',
        label: 'Tên',
        icon: 'text'
    }, {
        field: 'last_name',
        label: 'Họ và tên lót',
        icon: 'text'
    }, {
        field: 'username',
        label: 'Tên đăng nhập',
        icon: 'account'
    }, {
        field: 'password',
        label: 'Mật khẩu',
        icon: 'eye',
        secureTextEntry: true
    }, {
        field: 'confirm',
        label: 'Xác nhận mật khẩu',
        icon: 'eye',
        secureTextEntry: true
    }];

    const [user, setUser] = useState({});
    const [err, setErr] = useState();
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();

    const picker = async () => {
        let { status }  = await ImgPicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert("Permissions denied!");
        } else {
            const result = await ImgPicker.launchImageLibraryAsync();
            if (!result.canceled) {
                setUser({...user, 'avatar': result.assets[0]});
            }
        }
    }

    const validate = () => {
        for (var i of userInfo)
            if (!(i.field in user) || !user[i.field]) {
                setErr(`Vui lòng nhập ${i.label}!`);
                return false;
            } 
            
        if (user.password !== user.confirm) {
                setErr("Mật khẩu không khớp");
                return false;
            }

        return true;
    }

    const register = async () => {
        if (validate() === true) {
            setErr("");
            try {
                setLoading(true);

                let form = new FormData();
                for (let key of Object.keys(user)) {
                    if (key !== 'confirm') {
                        if (key === 'avatar') {
                            form.append('avatar', {
                                uri: user.avatar.uri,
                                name: user.avatar.fileName,
                                type: "image/jpeg" //user.avatar.type
                            });
                        } else
                            form.append(key, user[key]);
                    }
                }

                let res = await Apis.post(endpoints['register'], form, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                if (res.status === 201)
                    nav.navigate('login');
                else
                    alert("Hệ thống có lỗi!");
            } catch (ex) {

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

            <TouchableOpacity onPress={picker}>
                <Text style={Styles.margin}>Chọn ảnh đại diện...</Text>
            </TouchableOpacity>

            {user.avatar && <Image source={{uri: user.avatar.uri}} style={[Styles.avatar, Styles.margin]} />}

            <Button loading={loading} disabled={loading} onPress={register} 
                    style={Styles.margin} mode="contained">Đăng ký</Button>
        </ScrollView>
    );
}

export default Register;
import { View } from "react-native";
import Styles from "./styles/Styles";
import Header from "./components/Header";
import Home from "./screens/Home/Home";
import { useContext, useReducer, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Login from "./screens/User/Login";
import Register from "./screens/User/Register";
import { NavigationContainer } from "@react-navigation/native";
import { Icon } from "react-native-paper";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Lessons from "./screens/Home/Lessons";
import { MyUserContext } from "./configs/Contexts";
import { MyUserReducer } from "./reducers/reducers";
import Profile from "./screens/User/Profile";

const Stack = createNativeStackNavigator();
const StackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="index" component={Home} />
      <Stack.Screen name="lessons" component={Lessons} options={{title: "Bài học", headerShown: true}} />
    </Stack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const [user, ] = useContext(MyUserContext);

  return (
    <Tab.Navigator>
      <Tab.Screen name="home" component={StackNavigator} options={{title: 'Khóa học', tabBarIcon: () => <Icon source="home" size={30} />}} />

      {user === null ? <>
        <Tab.Screen name="login" component={Login} options={{title: 'Đăng nhập', tabBarIcon: () => <Icon source="account" size={30} />}} />
        <Tab.Screen name="register" component={Register} options={{title: 'Đăng ký', tabBarIcon: () => <Icon source="account-plus" size={30} />}} />
      </>:<>
      <Tab.Screen name="profile" component={Profile} options={{title: 'Thông tin', tabBarIcon: () => <Icon source="account" size={30} />}} />
      </>}

      
    </Tab.Navigator>
  );
}

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <MyUserContext.Provider value={[user, dispatch]}>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </MyUserContext.Provider>
  );
}

export default App;
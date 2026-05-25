import { useReducer, useState, useContext, useEffect } from "react";
import { AppState } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { navigationRef, setAuthDispatch } from "./configs/NavigationService";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { MyUserContext, NotifUnreadContext } from "./configs/Contexts";
import MyUserReducer from "./reducers/MyUserReducer";
import { authApis, endpoints } from "./configs/Apis";

import Splash from "./screens/Splash/Splash";
import Login from "./screens/User/Login";
import Register from "./screens/User/Register";
import ForgotPassword from "./screens/User/ForgotPassword";
import Home from "./screens/Home/Home";
import RoomTypeDetail from "./screens/Home/RoomTypeDetail";
import AvailabilityResults from "./screens/Home/AvailabilityResults";
import Profile from "./screens/User/Profile";
import HousekeepingTasks from "./screens/Housekeeping/HousekeepingTasks";
import BookingList from "./screens/Booking/BookingList";
import BookingDetail from "./screens/Booking/BookingDetail";
import BookingCreate from "./screens/Booking/BookingCreate";
import VNPayScreen from "./screens/Booking/VNPayScreen";
import Notifications from "./screens/Notifications/Notifications";
import Services from "./screens/Services/Services";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#1A1A2E",
    card: "#1A1A2E",
    border: "rgba(255,255,255,0.08)",
    text: "#FFFFFF",
  },
};

// Bottom Tab dành cho Customer / Staff
const MainTabNavigator = () => {
  const [user] = useContext(MyUserContext);
  const [notifUnread] = useContext(NotifUnreadContext);
  const [, setNotifUnread] = useContext(NotifUnreadContext);

  useEffect(() => {
    if (!user?.token) {
      setNotifUnread(0);
      return;
    }

    const syncUnread = async () => {
      try {
        const r = await authApis(user.token).get(endpoints.notifications, {
          params: { is_read: "false", page_size: 1 },
        });
        setNotifUnread(r.data.meta?.total_count ?? 0);
      } catch { /* Auth interceptor handles token errors */ }
    };

    // Fetch ngay khi đăng nhập / token đổi
    syncUnread();

    // Chỉ sync lại khi người dùng quay lại app từ nền
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") syncUnread();
    });

    return () => sub.remove();
  }, [user?.token]);

  return (
  <Tab.Navigator
    screenOptions={{
      tabBarStyle: {
        backgroundColor: "#1A1A2E",
        borderTopColor: "rgba(255,255,255,0.08)",
        height: 64,
        paddingBottom: 8,
      },
      tabBarActiveTintColor: "#C9A84C",
      tabBarInactiveTintColor: "#666",
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="home-tab"
      component={Home}
      options={{
        title: "Trang chủ",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="home-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="booking-list"
      component={BookingList}
      options={{
        title: "Đặt phòng",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="calendar-text-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="notifications-tab"
      component={Notifications}
      options={{
        title: "Thông báo",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="bell-outline" size={size} color={color} />
        ),
        tabBarBadge: notifUnread > 0 ? notifUnread : undefined,
        tabBarBadgeStyle: { backgroundColor: "#E05252", fontSize: 10, minWidth: 18, height: 18 },
      }}
    />
    <Tab.Screen
      name="services-tab"
      component={Services}
      options={{
        title: "Dịch vụ",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="room-service-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="profile-tab"
      component={Profile}
      options={{
        title: "Tài khoản",
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account-outline" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
  );
};

// Root Stack — quản lý điều hướng toàn app
const RootNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: "#1A1A2E" },
    }}
  >
    <Stack.Screen name="splash" component={Splash} />
    <Stack.Screen name="login" component={Login} />
    <Stack.Screen name="register" component={Register} />
    <Stack.Screen name="forgot-password" component={ForgotPassword} />
    <Stack.Screen name="main" component={MainTabNavigator} />
    <Stack.Screen name="room-type-detail" component={RoomTypeDetail} />
    <Stack.Screen name="housekeeping-tasks" component={HousekeepingTasks} />
    <Stack.Screen name="availability-results" component={AvailabilityResults} />
    <Stack.Screen name="booking-list" component={BookingList} />
    <Stack.Screen name="booking-detail" component={BookingDetail} />
    <Stack.Screen name="booking-create" component={BookingCreate} />
    <Stack.Screen name="vnpay-payment" component={VNPayScreen} options={{ gestureEnabled: false }} />
  </Stack.Navigator>
);

export default function App() {
  const [user, dispatch] = useReducer(MyUserReducer, null);
  const [notifUnread, setNotifUnread] = useState(0);

  // Đăng ký dispatch toàn cục để interceptor có thể gọi LOGOUT từ ngoài component
  useEffect(() => {
    setAuthDispatch(dispatch);
  }, [dispatch]);

  return (
    <MyUserContext.Provider value={[user, dispatch]}>
      <NotifUnreadContext.Provider value={[notifUnread, setNotifUnread]}>
        <NavigationContainer ref={navigationRef} theme={AppTheme}>
          <RootNavigator />
        </NavigationContainer>
      </NotifUnreadContext.Provider>
    </MyUserContext.Provider>
  );
}

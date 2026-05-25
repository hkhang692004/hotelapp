import { createRef } from "react";

// Ref được gán vào <NavigationContainer ref={navigationRef} /> trong App.js
export const navigationRef = createRef();

// Reset về màn hình chỉ định (dùng khi logout)
export const navigationReset = (routeName) => {
    if (navigationRef.current) {
        navigationRef.current.reset({ index: 0, routes: [{ name: routeName }] });
    }
};

// Kho lưu dispatch của MyUserContext để dùng ngoài component
let _authDispatch = null;

export const setAuthDispatch = (dispatch) => {
    _authDispatch = dispatch;
};

export const getAuthDispatch = () => _authDispatch;

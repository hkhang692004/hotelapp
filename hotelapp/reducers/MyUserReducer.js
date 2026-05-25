// action.type: "LOGIN" | "LOGOUT" | "UPDATE_USER"
// action.payload: user object từ /auth/me/ hoặc /auth/login/

export default (current, action) => {
    switch (action.type) {
        case "LOGIN":
            return action.payload;
        case "LOGOUT":
            return null;
        case "UPDATE_USER":
            return { ...current, ...action.payload };
    }
    return current;
};

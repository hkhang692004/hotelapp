import axios from "axios";

export const endpoints = {
    'categories': '/categories/',
    'courses': '/courses/',
    'register': '/users/',
    'login': '/o/token/',
    'current-user': '/users/current-user/',
    'lessons': (courseId) => `/courses/${courseId}/lessons/`
}

export const authApis = (token) => {
    return axios.create({
        baseURL: "http://192.168.2.23:8000/",
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

export default axios.create({
    baseURL: "http://192.168.2.23:8000/"
})
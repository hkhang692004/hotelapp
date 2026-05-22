import axios from "axios";

export const endpoints = {
    'categories': '/categories/',
    'courses': '/courses/',
    'lessons': (courseId) => `/courses/${courseId}/lessons/`,
    'register': '/users/',
    'login': '/o/token/',
    'current-user': '/users/current-user/',
    'lesson-details': (lessonId) => `/lessons/${lessonId}/`,
    'comments': (lessonId) => `/lessons/${lessonId}/comments/`
}

export const authApis = (token) => {
    return axios.create({
        baseURL: 'http://192.168.2.23:8000/',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

export default axios.create({
    baseURL: 'http://192.168.2.23:8000/'
})
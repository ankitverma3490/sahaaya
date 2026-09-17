import axios from "axios";
import { BASE_URL } from "./baseUrl";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
});

// token agar future me lagana ho
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("login_details");
            localStorage.removeItem("user_id");
            localStorage.removeItem("role");
            if (window.location.pathname !== "/") {
                window.location.href = "/";
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const FILE_BASE = API.replace(/\/api\/?$/, "");
export const fileUrl = (p) => (!p ? "" : p.startsWith("http") ? p : FILE_BASE + p);

const api = axios.create({ baseURL: API });

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto logout if the token is rejected
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e.response?.data?.message || (e.request ? "Cannot reach the server. Is the backend running?" : "Something went wrong. Please try again.");
export default api;

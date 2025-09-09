import axios from "axios";

const base = (import.meta.env.VITE_API_URL as string) || "http://localhost:4000/api";
const api = axios.create({ baseURL: base, withCredentials: false });

// attach token if present
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("nb_token");
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;

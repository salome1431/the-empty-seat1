import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("token"));
  const [unread, setUnread] = useState(0);

  // Restore session on page load
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    api.get("/auth/me").then((r) => setUser(r.data.data)).catch(() => localStorage.removeItem("token")).finally(() => setLoading(false));
  }, []);

  const refreshUnread = useCallback(() => {
    if (!localStorage.getItem("token")) return;
    api.get("/notifications/count").then((r) => setUnread(r.data.data.unread)).catch(() => {});
  }, []);

  // Poll unread count every 30s while logged in
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    refreshUnread();
    const t = setInterval(refreshUnread, 30000);
    return () => clearInterval(t);
  }, [user, refreshUnread]);

  const saveSession = (data) => { localStorage.setItem("token", data.token); setUser(data.user); };
  const login = async (email, password) => saveSession((await api.post("/auth/login", { email, password })).data.data);
  const register = async (form) => saveSession((await api.post("/auth/register", form)).data.data);
  const logout = () => { localStorage.removeItem("token"); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, unread, refreshUnread }}>
      {children}
    </AuthContext.Provider>
  );
}

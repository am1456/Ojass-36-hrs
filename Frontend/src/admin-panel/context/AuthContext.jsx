import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import {
  setAccessToken,
  clearAccessToken,
} from "../api/tokenService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const login = async (data) => {
    const res = await api.post("/auth/login", data);
    const { accessToken } = res.data;

    setAccessToken(accessToken);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    clearAccessToken();
    setIsAuthenticated(false);
  };

  // 🔥 Auto refresh on app load
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const res = await api.post("/auth/refresh");
        setAccessToken(res.data.accessToken);
        setIsAuthenticated(true);
      } catch (err) {
        clearAccessToken();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    tryRefresh();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        isAuthenticated,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedToken) setToken(savedToken);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const updateUserContext = (userData) => {
    console.log("Updating user context with:", userData);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    console.log("User context updated successfully");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

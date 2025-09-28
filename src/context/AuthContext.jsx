import React, { createContext, useContext } from "react";


const AuthContext = createContext({ user: null, logout: () => {} });

export const AuthProvider = ({ children }) => {
  
  return (
    <AuthContext.Provider value={{ user: null, logout: () => {} }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

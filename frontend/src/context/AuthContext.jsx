import { createContext, useState, useContext, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const login = async (nombre_usuario, password) => {
    const response = await api.post("/auth/login", { nombre_usuario, password });

    const token = response.data.access_token;
    const userData = response.data.user;

    // Guardamos todo
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("role", userData.role_name || userData.role);

    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setUser(null);
    window.location.href = "/login";
  };

  // Función de permisos reactiva
  const tienePermiso = (rolesPermitidos) => {
    if (!user) return false;
    const rolActual = user.role_name || user.role;
    const permitido = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
    return permitido.includes(rolActual);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && user) logout();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


























// import { createContext, useState, useContext } from "react";
// import api from "../services/api";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(
//     JSON.parse(localStorage.getItem("user")) || null
//   );

//   const login = async (nombre_usuario, password) => {
//     const response = await api.post("/auth/login", {
//       nombre_usuario,
//       password,
//     });

//     const token = response.data.access_token
//     const user = response.data.user;

//     localStorage.setItem("token", token);
//     localStorage.setItem("user", JSON.stringify(user));

//     setUser(user);
//   };

//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

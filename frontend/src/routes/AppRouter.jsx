import { BrowserRouter, Routes, Route, Router, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import { Actividades } from "../pages/actividades/Actividades";
import ProtectedRoute from "./ProtectedRoutes";
import { CrearActividades } from "../pages/actividades/CrearActividades";
import { VerActividad } from "../pages/actividades/VerActividad";
import { VistaPrincipal } from "../pages/actividades/VistaPrincipal";
import { Logout } from "../components/Logout";
import { ForceLogout } from "../components/ForceLogout";
import CalendarioActividades from "../pages/actividades/CalendarioActividades";
import { ListarUsuarios } from "../pages/usuarios/ListarUsuarios";
import CrearUsuario from "../pages/usuarios/CrearUsuario";

const Dashboard = () => <h1>Dashboard</h1>;

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Ruta de Login y Raíz */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 2. Ruta de Salida */}
        <Route path="/force-logout" element={<ForceLogout />} />

        {/* 3. Rutas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/actividades" element={<Actividades />} />
          <Route path="/crear-actividades" element={<CrearActividades />} />
          <Route path="/ver-actividad/:id" element={<VerActividad />} />
          <Route path="/vista-principal" element={<VistaPrincipal />} />
          <Route path="/crear-usuario" element={<CrearUsuario />} />
          <Route path="/calendario" element={<CalendarioActividades />} />
          <Route path="/usuarios" element={<ListarUsuarios />} />
        </Route>

        <Route path="*" element={<Navigate to="/force-logout" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

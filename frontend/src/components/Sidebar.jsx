import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./styles/Sidebar.css";
import { tienePermiso } from "../utils/Permisos";

export const Sidebar = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();

    // console.log("Usuario actual:", user);

    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className={`sidebar-container ${collapsed ? "collapsed" : ""}`}>

            <div className="sidebar-header">
                <h2 className="logo">{collapsed ? "Dash" : "Dashboard"}</h2>
                <button
                    className="toggle-btn"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    ☰
                </button>
            </div>

            <ul className="sidebar-menu">

                <li>
                    <Link to="/actividades" className="menu-item">
                        {/* <span className="icon">📊</span> */}
                        <i className="fa-solid fa-house"></i>
                        {!collapsed && <span>Inicio</span>}
                    </Link>
                </li>

                <li>
                    <Link to="/crear-actividades" className="menu-item">
                        <i className="fa-regular fa-newspaper"></i>
                        {!collapsed && <span>Crear actividad</span>}
                    </Link>
                </li>

                {/* <li>
                    <Link to="/vista-principal" className="menu-item">
                        <i className="fa-solid fa-chart-column"></i>
                        {!collapsed && <span>Reportes</span>}
                    </Link>
                </li> */}
                <li>
                    <Link to="/crear-actividades-recurrentes" className="menu-item">
                        {/* <span className="icon">📊</span> */}
                        <i className="fa-solid fa-list-check"></i>
                        {!collapsed && <span>Planeador <br />de actividades</span>}
                    </Link>
                </li>

                {tienePermiso(['Administrador']) && (
                    <li>
                        <Link to="/usuarios" className="menu-item">
                            {/* <span className="icon">⚙</span> */}
                            <i className="fa-solid fa-users"></i>
                            {!collapsed && <span>Usuarios</span>}
                        </Link>
                    </li>
                )}
            </ul>

            <div className="sidebar-footer">
                {!collapsed && user && (
                    <div>
                        <p>{user.nombre} {user.apellido}</p>
                        <small onClick={handleLogout} style={{ cursor: "pointer" }}>
                            <i className="fa-solid fa-right-from-bracket"></i> Cerrar sesión
                        </small>
                    </div>
                )}
            </div>
        </div>
    );
};

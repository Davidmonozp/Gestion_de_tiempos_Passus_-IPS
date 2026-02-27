import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./styles/Navbar.css";


export const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [openUser, setOpenUser] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const closeMenu = () => setOpen(false);

    return (
        <nav className="navbar">
            <div className="navbar-container">

                <Link to="/vista-principal" className="logo" onClick={closeMenu}>
                    <img className="img-navbar" src="./logoPassusTransp.png" alt="" />
                </Link>

                <button
                    className={`hamburger ${open ? "show" : ""}`}
                    onClick={() => setOpen(!open)}
                >
                    ☰
                </button>

                <div className={`navbar-links ${open ? "show" : ""}`}>

                    <Link to="/vista-principal" onClick={closeMenu}>
                        Inicio
                    </Link>

                    <Link to="/actividades" onClick={closeMenu}>
                        Actividades
                    </Link>

                    <Link to="/vista-principal" onClick={closeMenu}>
                        Reportes
                    </Link>

                    <Link to="/vista-principal" onClick={closeMenu}>
                        Configuración
                    </Link>

                    <div className="user-dropdown">
                        <button
                            className="user-button"
                            onClick={() => setOpenUser(!openUser)}
                        >
                            {user?.nombre_usuario} ▾
                        </button>

                        {openUser && (
                            <div className="user-menu">
                                <button onClick={handleLogout}>
                                    Cerrar sesión
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    );
};

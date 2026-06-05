import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./styles/Navbar.css";
import { Notificationes } from "./Notificaciones";
import { FloatingTimer } from "./FloatingTimer";
import { useAuth } from "../context/AuthContext";
import { tienePermiso } from "../utils/Permisos";

export const Navbar = () => {
    // 2. Trae tiempoTranscurrido y jornadaActiva desde el context
    const { user, logout, tiempoTranscurrido, jornadaActiva } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [openConfig, setOpenConfig] = useState(false);
    const [openUser, setOpenUser] = useState(false);
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const closeMenu = () => setOpen(false);

    const mostrarTimer = jornadaActiva && location.pathname !== "/vista-principal";

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/actividades" className="logo" onClick={closeMenu}>
                    <img className="img-navbar" src="/logoPassusTransp.png" alt="" />
                </Link>

                {/* 3. Renderizamos el timer si la jornada está activa */}
                {mostrarTimer && (
                    <FloatingTimer
                        tiempoTranscurrido={tiempoTranscurrido}
                        jornadaActiva={jornadaActiva}
                    />
                )}

                <button
                    className={`hamburger ${open ? "show" : ""}`}
                    onClick={() => setOpen(!open)}
                >
                    ☰
                </button>

                <div className={`navbar-links ${open ? "show" : ""}`}>
                    <Link to="/actividades" onClick={closeMenu}>Inicio</Link>
                    <Link to="/vista-principal" onClick={closeMenu}>Dashboard</Link>
                    {/* <Link to="/calendario" onClick={closeMenu}>Calendario</Link> */}
                    {/* <Link to="/vista-principal" onClick={closeMenu}>Reportes</Link> */}
                    {/* --- DROPDOWN DE CONFIGURACIÓN --- */}
                    <div className="user-dropdown">

                        {tienePermiso(['Administrador']) && (
                            <>
                                <button
                                    className="user-button"
                                    onClick={() => {
                                        setOpenConfig(!openConfig);
                                        setOpenUser(false);
                                    }}
                                >
                                    Configuración ▾
                                </button>

                                {openConfig && (
                                    <div className="user-menu">
                                        <Link
                                            to="/usuarios"
                                            className="menu-item"
                                            onClick={() => {
                                                setOpenConfig(false);
                                                closeMenu();
                                            }}
                                        >
                                            Usuarios
                                        </Link>
                                        <Link
                                            to="/gestion-areas"
                                            className="menu-item"
                                            onClick={() => {
                                                setOpenConfig(false);
                                                closeMenu();
                                            }}
                                        >
                                            Áreas y Actividades
                                        </Link>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <Notificationes />

                    {/* --- DROPDOWN DE USUARIO --- */}
                    <div className="user-dropdown">
                        <button
                            className="user-button"
                            onClick={() => {
                                setOpenUser(!openUser);
                                setOpenConfig(false);
                            }}
                        >
                            {`${user?.nombre} ${user?.apellido}`} ▾
                        </button>

                        {openUser && (
                            <div className="user-menu">
                                <Link
                                    to="/cambiar-contraseña"
                                    className="menu-item"
                                    onClick={() => setOpenUser(false)}
                                >
                                    Cambiar contraseña
                                </Link>
                                <button className="menu-item" onClick={handleLogout}>
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

























// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import "./styles/Navbar.css";
// import { Notificationes } from "./Notificaciones";


// export const Navbar = () => {
//     const { user, logout } = useAuth();
//     const navigate = useNavigate();
//     const [open, setOpen] = useState(false);
//     const [openUser, setOpenUser] = useState(false);

//     const handleLogout = () => {
//         logout();
//         navigate("/login");
//     };

//     const closeMenu = () => setOpen(false);

//     return (
//         <nav className="navbar">
//             <div className="navbar-container">

//                 <Link to="/vista-principal" className="logo" onClick={closeMenu}>
//                     <img className="img-navbar" src="/logoPassusTransp.png" alt="" />
//                 </Link>

//                 <button
//                     className={`hamburger ${open ? "show" : ""}`}
//                     onClick={() => setOpen(!open)}
//                 >
//                     ☰
//                 </button>

//                 <div className={`navbar-links ${open ? "show" : ""}`}>

//                     <Link to="/vista-principal" onClick={closeMenu}>
//                         Inicio
//                     </Link>

//                     <Link to="/actividades" onClick={closeMenu}>
//                         Actividades
//                     </Link>

//                     <Link to="/vista-principal" onClick={closeMenu}>
//                         Reportes
//                     </Link>

//                     <Link to="/vista-principal" onClick={closeMenu}>
//                         Configuración
//                     </Link>

//                     <Notificationes />


//                     <div className="user-dropdown">
//                         <button
//                             className="user-button"
//                             onClick={() => setOpenUser(!openUser)}
//                         >
//                             {user?.nombre_usuario} ▾
//                         </button>

//                         {openUser && (
//                             <div className="user-menu">
//                                 <button onClick={handleLogout}>
//                                     Cerrar sesión
//                                 </button>
//                             </div>
//                         )}
//                     </div>

//                 </div>
//             </div>
//         </nav>
//     );
// };

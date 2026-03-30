import { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import "./styles/Actividades.css";
import { Navbar } from "../../components/Navbar";
import { Sidebar } from "../../components/Sidebar";
import { Version } from "../../components/Version";
import CalendarioActividades from "./CalendarioActividades";
import { tienePermiso } from "../../utils/Permisos";

export const Actividades = () => {
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [vista, setVista] = useState("calendario");

    // 🟢 ESTADO PARA EL FILTRO: false = solo mías, true = todo el área
    const [verTodoElArea, setVerTodoElArea] = useState(false);

    const TEXTOS_ESTADOS = {
        Por_corregir: "Por corregir",
        Espera_aprobacion: "Espera de aprobación",
        En_progreso: "En progreso",
    };

    const BASE_URL = api.defaults.baseURL.replace(/\/api$/, "");

    useEffect(() => {
        const fetchActividades = async () => {
            try {
                // Solo mostramos el loader principal si no hay datos previos 
                // para evitar parpadeos molestos al cambiar de vista
                if (actividades.length === 0) setLoading(true);

                // 1. Preparamos los parámetros base
                const params = {
                    todo_el_area: verTodoElArea ? 1 : 0,
                };

                // 2. Lógica condicional según la vista
                if (vista === "calendario") {
                    // Enviamos un flag para que Laravel devuelva TODO (get())
                    params.sin_paginar = 1;
                } else {
                    // Enviamos la página actual para que Laravel devuelva solo 10-15 (paginate())
                    params.page = currentPage;
                }

                const response = await api.get(`/ver-actividades`, { params });

                // 3. Manejo de la respuesta (Laravel devuelve los datos en .data si es paginado)
                const rawData = response.data.data || response.data;

                // Validamos que sea un array antes de ordenar
                const listaActividades = Array.isArray(rawData) ? rawData : [];

                const datosOrdenados = listaActividades.sort((a, b) => b.id - a.id);

                setActividades(datosOrdenados);

                // 4. Actualizamos el total de páginas solo si la respuesta es paginada
                if (response.data.last_page) {
                    setLastPage(response.data.last_page);
                }

            } catch (error) {
                console.error(
                    "Error al obtener actividades:",
                    error.response?.data || error.message
                );
            } finally {
                setLoading(false);
            }
        };

        fetchActividades();


    }, [currentPage, verTodoElArea, vista]);

    if (loading) return <p className="loading-text">Cargando actividades...</p>;

    return (
        <>
            <Navbar />
            <div className="container-actividades">
                <Sidebar />
                <div className="container-principal">
                    <div className="header-seccion">
                        <h1>
                            {verTodoElArea ? "Actividades del Área" : "Mis Actividades"}
                        </h1>
                    </div>

                    <div className="view-actions">
                        {/* Botones de vistas */}
                        <button
                            onClick={() => setVista("tabla")}
                            className={vista === "tabla" ? "active" : ""}
                        >
                            <i className="fa-solid fa-list"></i>
                        </button>
                        <button
                            onClick={() => setVista("tarjetas")}
                            className={vista === "tarjetas" ? "active" : ""}
                        >
                            <i className="fa-solid fa-table-cells-large"></i>
                        </button>
                        <button
                            onClick={() => setVista("calendario")}
                            className={vista === "calendario" ? "active" : ""}
                        >
                            <i className="fa-solid fa-calendar-days"></i>
                        </button>

                        <Link to="/crear-actividades">
                            <button className="btn-crear">Crear actividad</button>
                        </Link>

                        {/* 🟢 BOTÓN DE FILTRO RESPETANDO TU DISEÑO ORIGINAL */}
                        {tienePermiso(["JefeInmediato"]) && (
                            <button
                                onClick={() => {
                                    setVerTodoElArea(!verTodoElArea);
                                    setCurrentPage(1);
                                }}
                                className={`btn-toggle-area ${verTodoElArea ? "active" : ""}`}
                            >
                                <i
                                    className={`fa-solid ${verTodoElArea ? "fa-user" : "fa-users"}`}
                                ></i>
                                {verTodoElArea
                                    ? " Ver solo mis actividades"
                                    : " Ver actividades del área"}
                            </button>
                        )}
                    </div>

                    {actividades.length === 0 ? (
                        <p>No hay actividades registradas.</p>
                    ) : (
                        <div className="main-content-view">
                            {vista === "tabla" && (
                                <div className="tabla-container">
                                    <table className="tabla-actividades">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nombre</th>
                                                <th>Estado</th>
                                                <th>Asignado A</th>
                                                <th>Minutos planeados</th>
                                                <th>Minutos ejecutados</th>
                                                <th>Area</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {actividades.map((act) => (
                                                <tr key={act.id}>
                                                    <td>{act.id}</td>
                                                    <td>{act.nombre}</td>
                                                    <td>
                                                        <span
                                                            className={`estado-badge estado-${act.estado}`}
                                                        >
                                                            {TEXTOS_ESTADOS[act.estado] || act.estado}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {act.asignado_a?.nombre} {act.asignado_a?.apellido}
                                                    </td>
                                                    <td>{act.minutos_planeados}</td>
                                                    <td>{act.minutos_ejecutados}</td>
                                                    <td>{act.area?.nombre || act.area || "N/A"}</td>
                                                    <td>
                                                        <Link to={`/ver-actividad/${act.id}`}>
                                                            <i className="fa-solid fa-eye"></i>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {vista === "tarjetas" && (
                                <div className="cards-container">
                                    {actividades.map((actividad) => (
                                        <div className="card" key={actividad.id}>
                                            <div className="inner-card">
                                                <div className="info">
                                                    <span
                                                        className={`estado-badge estado-${actividad.estado}`}
                                                    >
                                                        {actividad.estado}
                                                    </span>
                                                    <h3>{actividad.nombre}</h3>
                                                    <p>
                                                        <strong>ID:</strong> {actividad.id}
                                                    </p>
                                                    <p>
                                                        <strong>Asignado A:</strong>{" "}
                                                        {actividad.asignado_a?.nombre}
                                                    </p>
                                                    <p>
                                                        <strong>Fecha límite:</strong>{" "}
                                                        {actividad.fecha_finalizacion || "-"}
                                                    </p>
                                                </div>
                                                <Link
                                                    to={`/ver-actividad/${actividad.id}`}
                                                    className="button-link"
                                                >
                                                    <div className="button">Ver Detalle</div>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {vista === "calendario" && (
                                <CalendarioActividades actividades={actividades} />
                            )}
                        </div>
                    )}

                    {vista !== "calendario" && (
                        <div className="pagination-wrapper">
                            <nav className="modern-pagination">
                                <button
                                    className="btn-nav"
                                    onClick={() =>
                                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                                    }
                                    disabled={currentPage === 1}
                                >
                                    ←
                                </button>
                                <div className="page-info">
                                    PÁGINA {currentPage} DE {lastPage}
                                </div>
                                <button
                                    className="btn-nav"
                                    onClick={() =>
                                        setCurrentPage((prev) => Math.min(prev + 1, lastPage))
                                    }
                                    disabled={currentPage === lastPage}
                                >
                                    →
                                </button>
                            </nav>
                        </div>
                    )}
                </div>
            </div>
            <Version />
        </>
    );
};

// import { useEffect, useState } from "react";
// import api from "../../services/api";
// import { Link } from "react-router-dom";
// import "./styles/Actividades.css";
// import { Navbar } from "../../components/Navbar";
// import { Sidebar } from "../../components/Sidebar";
// import { Version } from "../../components/Version";
// import CalendarioActividades from "./CalendarioActividades";

// export const Actividades = () => {
//     const [actividades, setActividades] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [lastPage, setLastPage] = useState(1);

//     // Controlamos las 3 vistas con un solo estado: 'tabla', 'tarjetas' o 'calendario'
//     const [vista, setVista] = useState('calendario');

//     const TEXTOS_ESTADOS = {
//         "Por_corregir": "Por corregir",
//         "Espera_aprobacion": "Espera de aprobación",
//         "En_progreso": "En progreso"
//     };

//     const BASE_URL = api.defaults.baseURL.replace(/\/api$/, "");

//     useEffect(() => {
//         const fetchActividades = async () => {
//             try {
//                 setLoading(true);
//                 // Si la vista es calendario, podrías aumentar el límite si lo deseas
//                 const response = await api.get(`/ver-actividades?page=${currentPage}`);

//                 // Invertimos el array para mostrar las más recientes (ID más alto) primero
//                 const datosOrdenados = response.data.data.sort((a, b) => b.id - a.id);

//                 setActividades(datosOrdenados);
//                 setLastPage(response.data.last_page);
//             } catch (error) {
//                 console.error("Error al obtener actividades:", error.response?.data || error.message);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchActividades();
//     }, [currentPage]);

//     if (loading) return <p className="loading-text">Cargando actividades...</p>;

//     return (
//         <>
//             <Navbar />

//             <div className="container-actividades">
//                 <Sidebar />
//                 <div className="container-principal">

//                     <h1>Lista de Actividades</h1>

//                     {/* Botones para alternar las 3 vistas */}
//                     <div className="view-actions">
//                         <button
//                             onClick={() => setVista('tabla')}
//                             className={vista === 'tabla' ? 'active' : ''}
//                             title="Vista de Lista"
//                         >
//                             <i className="fa-solid fa-list"></i>
//                         </button>
//                         <button
//                             onClick={() => setVista('tarjetas')}
//                             className={vista === 'tarjetas' ? 'active' : ''}
//                             title="Vista de Tarjetas"
//                         >
//                             <i className="fa-solid fa-table-cells-large"></i>
//                         </button>
//                         <button
//                             onClick={() => setVista('calendario')}
//                             className={vista === 'calendario' ? 'active' : ''}
//                             title="Vista de Calendario"
//                         >
//                             <i className="fa-solid fa-calendar-days"></i>
//                         </button>

//                         <Link to="/crear-actividades">
//                             <button className="btn-crear">Crear actividad</button>
//                         </Link>
//                     </div>

//                     {actividades.length === 0 ? (
//                         <p>No hay actividades registradas.</p>
//                     ) : (
//                         <div className="main-content-view">

//                             {/* 1. VISTA DE TABLA */}
//                             {vista === 'tabla' && (
//                                 <div className="tabla-container">
//                                     <table className="tabla-actividades">
//                                         <thead>
//                                             <tr>
//                                                 <th>ID</th>
//                                                 <th>Nombre</th>
//                                                 <th>Estado</th>
//                                                 <th>Asignado A</th>
//                                                 <th>Minutos planeados</th>
//                                                 <th>Minutos ejecutados</th>
//                                                 <th>Area</th>
//                                                 <th>Acciones</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {actividades.map((act) => (
//                                                 <tr key={act.id}>
//                                                     <td>{act.id}</td>
//                                                     <td>{act.nombre}</td>
//                                                     <td>
//                                                         <span className={`estado-badge estado-${act.estado}`}>
//                                                             {TEXTOS_ESTADOS[act.estado] || act.estado}
//                                                         </span>
//                                                     </td>
//                                                     <td>{act.asignado_a?.nombre} {act.asignado_a?.apellido}</td>
//                                                     <td>{act.minutos_planeados}</td>
//                                                     <td>{act.minutos_ejecutados}</td>
//                                                     <td>{act.area?.nombre || act.area || 'N/A'}</td>
//                                                     <td>
//                                                         <Link to={`/ver-actividad/${act.id}`}>
//                                                             <i className="fa-solid fa-eye"></i>
//                                                         </Link>
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             )}

//                             {/* 2. VISTA DE TARJETAS */}
//                             {vista === 'tarjetas' && (
//                                 <div className="cards-container">
//                                     {actividades.map((actividad) => {
//                                         const archivos = Array.isArray(actividad.archivos) ? actividad.archivos : [];
//                                         return (
//                                             <div className="card" key={actividad.id}>
//                                                 <div className="inner-card">
//                                                     <div className="info">
//                                                         <span className={`estado-badge estado-${actividad.estado}`}>
//                                                             {actividad.estado}
//                                                         </span>
//                                                         <h3>{actividad.nombre}</h3>
//                                                          <p><strong>ID:</strong> {actividad.id}</p>
//                                                         <p><strong>Área:</strong> {actividad.area?.nombre}</p>
//                                                         <p><strong>Asignado A:</strong> {actividad.asignado_a?.nombre}</p>
//                                                         <p><strong>Fecha límite:</strong> {actividad.fecha_finalizacion || "-"}</p>
//                                                         <div className="archivos">
//                                                             <strong>Archivos: </strong>
//                                                             {archivos.length === 0 ? " Sin archivos" : (
//                                                                 <a href={`${BASE_URL}/storage/${archivos[0].path}`} target="_blank" rel="noopener noreferrer">
//                                                                     {archivos[0].original_name}
//                                                                 </a>
//                                                             )}
//                                                         </div>
//                                                     </div>
//                                                     <Link to={`/ver-actividad/${actividad.id}`} className="button-link">
//                                                         <div className="button">Ver Detalle</div>
//                                                     </Link>
//                                                 </div>
//                                             </div>
//                                         );
//                                     })}
//                                 </div>
//                             )}

//                             {/* 3. VISTA DE CALENDARIO (LLAMADA AL COMPONENTE) */}
//                             {vista === 'calendario' && (
//                                 <CalendarioActividades actividades={actividades} />
//                             )}
//                         </div>
//                     )}

//                     {/* PAGINACIÓN (Se oculta en calendario si prefieres cargar todo allí) */}
//                     {vista !== 'calendario' && (
//                         <div className="pagination-wrapper">
//                             <nav className="modern-pagination">
//                                 <button
//                                     className="btn-nav"
//                                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                                     disabled={currentPage === 1}
//                                 >
//                                     <span className="icon-arrow">←</span>
//                                 </button>

//                                 <div className="page-info">
//                                     PÁGINA <span className="current-num">{currentPage}</span> DE <span>{lastPage}</span>
//                                 </div>

//                                 <button
//                                     className="btn-nav"
//                                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))}
//                                     disabled={currentPage === lastPage}
//                                 >
//                                     <span className="icon-arrow">→</span>
//                                 </button>
//                             </nav>
//                         </div>
//                     )}
//                 </div>
//             </div>
//             <Version />
//         </>
//     );
// };

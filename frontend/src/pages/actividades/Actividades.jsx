import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { Link, useNavigate } from "react-router-dom";
import "./styles/Actividades.css";
import { Navbar } from "../../components/Navbar";
import { Sidebar } from "../../components/Sidebar";
import { Version } from "../../components/Version";
import CalendarioActividades from "./CalendarioActividades";
import { tienePermiso } from "../../utils/Permisos";
import { useAuth } from '../../context/AuthContext';
import { FiltrosActividades } from "../../components/FiltrosActividades";
import { ResumenActividades } from "../../components/ResumenActividades";

export const Actividades = () => {

    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [vista, setVista] = useState(() => {
        return tienePermiso(["Administrador"]) ? "tabla" : "calendario";
    });
    const navigate = useNavigate();
    const [filtros, setFiltros] = useState(() => {
        const guardados = localStorage.getItem('actividades_filtros');
        return guardados ? JSON.parse(guardados) : {
            id: '',
            nombre: '',
            estado: '',
            fecha_desde: '',
            fecha_hasta: '',
            area_id: '',
            asignado_a: ''
        };
    });


    const minutosProgramados = useMemo(() => {
        // 1. Obtenemos el día, mes y año de hoy en tu zona horaria
        const hoy = new Date();
        const hoyStr = `${hoy.getFullYear()}-${hoy.getMonth() + 1}-${hoy.getDate()}`;

        return actividades.reduce((total, act) => {
            // 2. Convertimos el string 'created_at' a objeto Date para extraer sus partes locales
            const fechaAct = new Date(act.created_at);
            const fechaActStr = `${fechaAct.getFullYear()}-${fechaAct.getMonth() + 1}-${fechaAct.getDate()}`;


            // 3. Comparamos los strings (ej: "2026-6-2" === "2026-6-2")
            if (fechaActStr === hoyStr) {
                const mins = parseInt(act.minutos_planeados) || 0;
                return total + mins;
            }

            return total;
        }, 0);
    }, [actividades]);

    // 2. Asegúrate de tener esta función auxiliar definida ANTES del return
    const formatoTiempo = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    const actividadesProgramadas = useMemo(() => {
        return actividades
            .filter(act => act.estado && act.estado.toLowerCase() === 'programada')
            .sort((a, b) => new Date(b.fecha_inicio || b.created_at) - new Date(a.fecha_inicio || a.created_at));
        // Hemos eliminado el .slice(0, 5) para que no se pierdan actividades
    }, [actividades]);
    const [resumenDia, setResumenDia] = useState(null);

    const [filtrosAplicados, setFiltrosAplicados] = useState(() => {
        const guardados = localStorage.getItem('actividades_filtros');
        return guardados ? JSON.parse(guardados) : {};
    });

    const actividadesMemorizadas = useMemo(() => actividades, [actividades]);

    // 🟢 ESTADO PARA EL FILTRO: false = solo mías, true = todo el área
    const [verTodoElArea, setVerTodoElArea] = useState(true);
    const {
        tiempoTranscurrido, handleEntrada, handleSalida, jornadaActiva, horaInicio, obtenerResumenJornada
    } = useAuth();

    useEffect(() => {
        if (jornadaActiva && typeof obtenerResumenJornada === 'function') {
            obtenerResumenJornada().then((data) => {
                if (data) setResumenDia(data);
            });
        }
    }, [jornadaActiva, obtenerResumenJornada]);

    const TEXTOS_ESTADOS = {
        Por_corregir: "Por corregir",
        Espera_aprobacion: "Espera de aprobación",
        En_progreso: "En progreso",
    };

    const BASE_URL = api.defaults.baseURL.replace(/\/api$/, "");
    const fetchActividades = async () => {
        try {
            // Solo mostramos el loader si NO tenemos datos previos
            if (actividades.length === 0) setLoading(true);

            const params = {
                todo_el_area: verTodoElArea ? 1 : 0,
                ...filtrosAplicados
            };

            if (vista === "calendario") {
                params.sin_paginar = 1;
            } else {
                params.page = currentPage;
            }

            const response = await api.get(`/ver-actividades`, { params });
            if (response.data.resumen) {
                setResumenDia(response.data.resumen);
            }

            const rawData = response.data.data || response.data;
            const listaActividades = Array.isArray(rawData) ? rawData : [];

            // Ordenamiento
            const datosOrdenados = listaActividades.sort((a, b) => b.id - a.id);

            // PERSISTENCIA: Guardamos para la próxima visita
            localStorage.setItem("actividades", JSON.stringify(datosOrdenados));

            // Actualizamos estado
            setActividades(datosOrdenados);

            if (response.data.last_page) {
                setLastPage(response.data.last_page);
            }

        } catch (error) {
            console.error("Error al obtener actividades:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        localStorage.setItem('actividades_filtros', JSON.stringify(filtros));
    }, [filtros]);

    useEffect(() => {
        fetchActividades();
        // Stringify convierte el objeto en un string para que React pueda compararlo bien
    }, [currentPage, verTodoElArea, vista, JSON.stringify(filtrosAplicados)]);



    if (loading) return <p className="loading-text">Cargando actividades...</p>;

    const handleApply = () => {
        setCurrentPage(1); // Reiniciar paginación
        setFiltrosAplicados(filtros); // Al hacer esto, el useEffect se dispara automáticamente
    };

    const handleClearFiltros = () => {
        const filtrosVacios = {
            id: '', nombre: '', estado: '',
            fecha_desde: '', fecha_hasta: '',
            area_id: '', asignado_a: ''
        };

        setFiltros(filtrosVacios);         // Limpia el estado de los inputs
        setFiltrosAplicados(filtrosVacios); // Dispara el useEffect de fetchActividades
        localStorage.removeItem('actividades_filtros'); // Limpia la persistencia
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A'; // Manejo de valores vacíos
        return new Date(fecha).toLocaleString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };


    return (
        <>
            <Navbar />
            <div className="container-actividades">
                <Sidebar />
                <div className="container-principal">
                    <div className="header-seccion">
                        <h1>
                            {verTodoElArea ? "Todas las actividades" : "Mis Actividades"}
                        </h1>
                        {/* <div className='cronometro-actividades'>{tiempoTranscurrido}</div> */}
                        <div className='cronometro-actividades'>
                            {/* COL 1: Hora */}
                            {jornadaActiva && horaInicio ? (
                                <div className="hora-inicio-wrapper">
                                    <label>Turno activo</label>
                                    <span className="hora-valor">Desde {horaInicio}</span>
                                </div>
                            ) : (
                                <div className="hora-inicio-wrapper estado-inactivo">
                                    <label>Turno no iniciado</label>
                                    <span className="hora-valor">--:--</span>
                                </div>
                            )}

                            {/* COL 2: Tiempo */}
                            <span className="tiempo-cronometro">{tiempoTranscurrido}</span>

                            {/* COL 3: Botón */}
                            {!jornadaActiva ? (
                                <button className='entrada-actividades' onClick={handleEntrada}>
                                    Iniciar Entrada
                                </button>
                            ) : (
                                <button className='salida-actividades' onClick={handleSalida}>
                                    Registrar Salida
                                </button>
                            )}
                        </div>
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

                        <Link to="/crear-actividades-recurrentes">
                            <button className="btn-crear">Planeador de Actividades</button>
                        </Link>


                        {/* 🟢 BOTÓN DE FILTRO RESPETANDO TU DISEÑO ORIGINAL */}
                        {tienePermiso(["JefeInmediato", "Administrador"]) && (
                            <div className="button-group-area">
                                <button
                                    onClick={() => {
                                        setVerTodoElArea(true);
                                        setCurrentPage(1);
                                    }}
                                    className={`btn-toggle-area ${verTodoElArea ? "active" : ""}`}
                                >
                                    <i className="fa-solid fa-users"></i> Todas las actividades
                                </button>

                                <button
                                    onClick={() => {
                                        setVerTodoElArea(false);
                                        setCurrentPage(1);
                                    }}
                                    className={`btn-toggle-area ${!verTodoElArea ? "active" : ""}`}
                                >
                                    <i className="fa-solid fa-user"></i> Mis actividades
                                </button>
                            </div>
                        )}
                    </div>

                    <FiltrosActividades
                        filtros={filtros}
                        setFiltros={setFiltros}
                        onApply={handleApply}
                        onClear={handleClearFiltros}
                    />
                    {actividades.length === 0 ? (
                        <p>No hay actividades registradas.</p>
                    ) : (
                        <div className="main-content-view">
                            {vista === "tabla" && (
                                <div className="main-layout-container">

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
                                                    <th>Fecha Registro</th>
                                                    <th>Fecha de Inicio</th>
                                                    <th>Fecha de Finalización</th>
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
                                                        <td>{formatearFecha(act.created_at)}</td>
                                                        <td>{formatearFecha(act.fecha_inicio)}</td>
                                                        <td>{formatearFecha(act.fecha_finalizacion)}</td>
                                                        <td>
                                                            <Link to={`/ver-actividad/${act.id}`}>
                                                                <i className="fa-solid fa-eye"></i>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {actividades.length > 0 ? (
                                            <ResumenActividades actividades={actividades} />
                                        ) : (
                                            <p>Cargando totales...</p>
                                        )}
                                    </div>


                                    <div className="main-indicadores">
                                        <div className="indicadores">
                                            <h3>Resumen del día</h3>
                                            {resumenDia ? (
                                                <div className="resumen-detalle">
                                                    {horaInicio && (
                                                        <p>🕒 Inicio del turno: <b>{horaInicio}</b></p>
                                                    )}
                                                    <p>⏱️ Tiempo trabajado <b>{tiempoTranscurrido}</b></p>
                                                    <p>📅 Tiempo programado <b>{formatoTiempo(minutosProgramados)}</b></p>
                                                    <p>📋 Tiempo ejecutado <b>{resumenDia.tiempo_actividades}</b></p>
                                                    <p className={`resumen-diferencia ${resumenDia.diferencia_minutos > 0 ? 'text-danger' : 'text-success'}`}>
                                                        Diferencia: <b>{resumenDia.diferencia_minutos} minutos</b>
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="cargando-resumen">Turno no iniciado</p>
                                            )}
                                        </div>
                                        <div className="indicadores-2">
                                            <h3>Próximas Programadas</h3>
                                            <div className="lista-actividades-mini">
                                                {actividadesProgramadas.length > 0 ? (
                                                    actividadesProgramadas.map((act) => (
                                                        <div
                                                            key={act.id}
                                                            className="actividad-item-mini"
                                                            onClick={() => navigate(`/ver-actividad/${act.id}`)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <span className="actividad-nombre">{act.nombre}</span>
                                                            <span className="actividad-estado">{act.estado}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                        No hay actividades programadas.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

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
                                <CalendarioActividades actividades={actividadesMemorizadas} filtros={filtrosAplicados} />
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

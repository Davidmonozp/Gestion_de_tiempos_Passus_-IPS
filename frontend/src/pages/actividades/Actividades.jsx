import { useEffect, useState } from "react";
import api from "../../services/api";
import { Link } from "react-router-dom";
import { Logout } from "../../components/Logout";
import "./styles/Actividades.css";
import { Navbar } from "../../components/Navbar";

export const Actividades = () => {
    const [actividades, setActividades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    // Extraemos la URL base de Axios y quitamos el "/api" 
    // Esto convierte "http://127.0.0.1:8000/api" en "http://127.0.0.1:8000"
    const BASE_URL = api.defaults.baseURL.replace(/\/api$/, "");

    useEffect(() => {
        const fetchActividades = async () => {
            try {
                setLoading(true);

                const response = await api.get(
                    `/ver-actividades?page=${currentPage}`
                );

                setActividades(response.data.data);
                setLastPage(response.data.last_page);

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
    }, [currentPage]);


    if (loading) return <p>Cargando actividades...</p>;

    return (
        <>
        <Navbar />
            <div>
                <Link to="/crear-actividades">
                    <button>Crear</button>
                </Link>
                
                <h1>Lista de Actividades</h1>

                {actividades.length === 0 ? (
                    <p>No hay actividades</p>
                ) : (
                    <div className="cards-container">
                        {actividades.map((actividad) => {

                            const archivos = Array.isArray(actividad.archivos)
                                ? actividad.archivos
                                : [];

                            return (
                                <div className="card" key={actividad.id}>
                                    <div className="inner-card">

                                        <div className="info">
                                            <span className={`estado-badge estado-${actividad.estado}`}>
                                                {actividad.estado}
                                            </span>
                                            <h3>{actividad.nombre}</h3>

                                            <p><strong>Estado:</strong> {actividad.estado}</p>

                                            <p><strong>Área:</strong> {actividad.area?.nombre}</p>

                                            <p>
                                                <strong>Asignado Por:</strong>{" "}
                                                {actividad.asignado_por?.nombre}{" "}
                                                {actividad.asignado_por?.apellido}
                                            </p>

                                            <p>
                                                <strong>Asignado A:</strong>{" "}
                                                {actividad.asignado_a?.nombre}{" "}
                                                {actividad.asignado_a?.apellido}
                                            </p>

                                            <p><strong>Fecha límite:</strong> {actividad.fecha_finalizacion || "-"}</p>

                                            <p>
                                                <strong>Minutos:</strong>{" "}
                                                {actividad.minutos_ejecutados} / {actividad.minutos_planeados}
                                            </p>

                                            <p>
                                                <strong>Requiere aprobación:</strong>{" "}
                                                {actividad.requiere_aprobacion ? "Sí" : "No"}
                                            </p>

                                            <div className="archivos">
                                                <strong>Archivos:</strong>
                                                {archivos.length === 0
                                                    ? " Sin archivos"
                                                    : archivos.map((archivo, index) => (
                                                        <div key={index}>
                                                            <a
                                                                href={`${BASE_URL}/storage/${archivo.path}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {archivo.original_name}
                                                            </a>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>

                                        <Link to={`/ver-actividad/${actividad.id}`} className="button-link">
                                            <div className="button">
                                                Ver Detalle
                                            </div>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Paginación */}
                <div className="paginacion">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </button>

                    <span>
                        Página {currentPage} de {lastPage}
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))}
                        disabled={currentPage === lastPage}
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </>
    );
};



































// import { useEffect, useState } from "react";
// import api from "../../services/api";
// import { Link } from "react-router-dom";
// import { Logout } from "../../components/Logout";
// import "./styles/Actividades.css";

// export const Actividades = () => {
//     const [actividades, setActividades] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [lastPage, setLastPage] = useState(1);

//     // Extraemos la URL base de Axios y quitamos el "/api"
//     // Esto convierte "http://127.0.0.1:8000/api" en "http://127.0.0.1:8000"
//     const BASE_URL = api.defaults.baseURL.replace(/\/api$/, "");

//     useEffect(() => {
//         const fetchActividades = async () => {
//             try {
//                 setLoading(true);

//                 const response = await api.get(
//                     `/ver-actividades?page=${currentPage}`
//                 );

//                 setActividades(response.data.data);
//                 setLastPage(response.data.last_page);

//             } catch (error) {
//                 console.error(
//                     "Error al obtener actividades:",
//                     error.response?.data || error.message
//                 );
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchActividades();
//     }, [currentPage]);


//     if (loading) return <p>Cargando actividades...</p>;

//     return (
//         <>
//             <div>
//                 <Link to="/crear-actividades">
//                     <button>Crear</button>
//                 </Link>

//                 <Logout />

//                 <h1>Lista de Actividades</h1>

//                 {actividades.length === 0 ? (
//                     <p>No hay actividades</p>
//                 ) : (
//                     <div className="cards-container">
//                         {actividades.map((actividad) => {

//                             const archivos = Array.isArray(actividad.archivos)
//                                 ? actividad.archivos
//                                 : [];

//                             return (
//                                 <div className="actividad-card" key={actividad.id}>

//                                     <div className="card-header">
//                                         <h3>{actividad.nombre}</h3>
//                                         <span className={`estado ${actividad.estado}`}>
//                                             {actividad.estado}
//                                         </span>
//                                     </div>

//                                     <p><strong>Área:</strong> {actividad.area?.nombre}</p>

//                                     <p>
//                                         <strong>Asignado Por:</strong>{" "}
//                                         {actividad.asignado_por?.nombre}{" "}
//                                         {actividad.asignado_por?.apellido}
//                                     </p>

//                                     <p>
//                                         <strong>Asignado A:</strong>{" "}
//                                         {actividad.asignado_a?.nombre}{" "}
//                                         {actividad.asignado_a?.apellido}
//                                     </p>

//                                     <p><strong>Fecha límite:</strong> {actividad.fecha_finalizacion || "-"}</p>

//                                     <p>
//                                         <strong>Minutos:</strong>{" "}
//                                         {actividad.minutos_ejecutados} / {actividad.minutos_planeados}
//                                     </p>

//                                     <p>
//                                         <strong>Requiere aprobación:</strong>{" "}
//                                         {actividad.requiere_aprobacion ? "Sí" : "No"}
//                                     </p>

//                                     <div className="archivos">
//                                         <strong>Archivos:</strong>
//                                         {archivos.length === 0
//                                             ? " Sin archivos"
//                                             : archivos.map((archivo, index) => (
//                                                 <div key={index}>
//                                                     <a
//                                                         href={`${BASE_URL}/storage/${archivo.path}`}
//                                                         target="_blank"
//                                                         rel="noopener noreferrer"
//                                                     >
//                                                         {archivo.original_name}
//                                                     </a>
//                                                 </div>
//                                             ))}
//                                     </div>

//                                     <div className="card-actions">
//                                         <Link to={`/ver-actividad/${actividad.id}`}>
//                                             <button>Ver Detalle</button>
//                                         </Link>
//                                     </div>

//                                 </div>
//                             );
//                         })}
//                     </div>
//                 )}

//                 {/* Paginación */}
//                 <div className="paginacion">
//                     <button
//                         onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                         disabled={currentPage === 1}
//                     >
//                         Anterior
//                     </button>

//                     <span>
//                         Página {currentPage} de {lastPage}
//                     </span>

//                     <button
//                         onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))}
//                         disabled={currentPage === lastPage}
//                     >
//                         Siguiente
//                     </button>
//                 </div>
//             </div>
//         </>
//     );
// };


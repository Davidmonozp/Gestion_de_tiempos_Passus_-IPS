
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { EnviarSolucion } from "./EnviarSolucion";
import "./styles/VerActividad.css";
import Swal from "sweetalert2";
import { VerSoluciones } from "./VerSoluciones";
import RevisarActividad from "./RevisarActividad";
import { tienePermiso } from "../../utils/Permisos";
import { Navbar } from "../../components/Navbar";
import { Version } from "../../components/Version";
import { Sidebar } from "../../components/Sidebar";



export const VerActividad = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [areas, setAreas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [nuevosArchivos, setNuevosArchivos] = useState([]);
    const [form, setForm] = useState(null);
    const [nuevosArchivosSolucion, setNuevosArchivosSolucion] = useState([]);
    const userJson = localStorage.getItem("user");
    const currentUser = userJson ? JSON.parse(userJson) : null;


    const BASE_URL = api.defaults.baseURL.replace(/\/api$/, "");

    const ESTADOS_ACTIVIDAD = [
        { value: 'Programada', label: 'Programada' },
        { value: 'Ejecución', label: 'En Ejecución' },
        { value: 'Finalizada', label: 'Finalizada' },
        { value: 'Espera_aprobacion', label: 'Espera de aprobacón' },
        { value: 'Aplazada', label: 'Aplazada' },
        { value: 'Por_corregir', label: 'Por corregir' },
        { value: 'Cancelada', label: 'Cancelada' }
    ];

    // 1. Definimos la función fuera del useEffect para que sea accesible globalmente en el componente
    const cargarDetalles = async () => {
        try {
            const [resAct, resAreas, resUsers] = await Promise.all([
                api.get(`/ver-actividad/${id}`),
                api.get("/ver-areas"),
                api.get("/ver-usuarios")
            ]);

            setForm(resAct.data); // Aquí vienen los archivos con sus nombres reales
            setAreas(resAreas.data.data);
            setUsuarios(resUsers.data.data);
        } catch (error) {
            console.error("Error al cargar:", error);
            if (error.response?.status === 401) window.location.href = "/force-logout";
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            setLoading(true);
            cargarDetalles();
        }
    }, [id]);



    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm(prev => {
            const newState = { ...prev };

            // Si estamos cambiando el area_id, eliminamos el objeto 'area' viejo
            // para que no confunda a la lógica de handleUpdate
            if (name === 'area_id') {
                delete newState.area;
            }

            // Lo mismo para el usuario asignado
            if (name === 'asignado_a') {
                delete newState.asignado_a_user;
            }

            return {
                ...newState,
                [name]: type === "checkbox" ? (checked ? 1 : 0) : value
            };
        });
    };

    const handleFilesChange = (e) => {
        const selected = Array.from(e.target.files);
        setNuevosArchivos((prev) => [...prev, ...selected]);
        e.target.value = null;
    };


    const handleSolucionFilesChange = (e) => {
        const selected = Array.from(e.target.files);
        setNuevosArchivosSolucion((prev) => [...prev, ...selected]);
        e.target.value = null;
    };

    const handleUpdate = async (e) => {
        if (e) e.preventDefault();

        // 1. Mostrar alerta de carga
        Swal.fire({
            title: 'Guardando cambios...',
            text: 'Por favor espera un momento',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const data = new FormData();
        data.append('_method', 'PUT');

        // 2. PROCESAR CAMPOS DE TEXTO Y RELACIONES
        Object.keys(form).forEach(key => {
            const value = form[key];

            // 1. Manejo de Usuarios (Asignado a)
            if (key === 'asignado_a') {
                const userId = value?.id || value;
                if (userId) data.append('asignado_a', userId);
            }

            // 2. Manejo de Áreas (EL PUNTO CLAVE)
            // Buscamos el ID ya sea que esté en 'area_id' o dentro del objeto 'area'
            else if (key === 'area_id' || key === 'area') {
                const areaId = value?.id || value;

                // Usamos una variable de control para enviarlo solo una vez
                // Si el key es 'area_id', lo mandamos. Si es 'area', solo si no existe 'area_id' en el form
                if (areaId && !data.has('area_id')) {
                    data.append('area_id', areaId);
                }
            }

            // 3. Manejo de Booleanos
            else if (['requiere_aprobacion', 'notificar_asignacion'].includes(key)) {
                data.append(key, value ? "1" : "0");
            }

            // 4. EXCLUSIONES Y RESTO DE CAMPOS
            else if (![
                'archivos', 'archivos_solucion', 'asignado_por',
                'asignado_a_user', 'evidencias', 'observaciones', 'aprobada_por',
                'area', 'area_id' // 👈 Importante: los excluimos aquí porque ya los manejamos arriba
            ].includes(key)) {
                if (value !== null && value !== undefined) {
                    data.append(key, value);
                }
            }
        });

        // 3. ENVIAR ARCHIVOS EXISTENTES (Como String JSON)
        // Esto permite que el controlador sepa cuáles NO borraste
        if (form.archivos) {
            // Si form.archivos ya es un objeto/array, lo convertimos a texto
            const archivosAEnviar = typeof form.archivos === 'string'
                ? form.archivos
                : JSON.stringify(form.archivos);

            data.append('archivos', archivosAEnviar);
        }

        // 4. AGREGAR ARCHIVOS NUEVOS (Files binarios)
        if (nuevosArchivos && nuevosArchivos.length > 0) {
            nuevosArchivos.forEach(file => {
                data.append("archivos[]", file); // Importante los corchetes []
            });
        }

        /**
         * IMPORTANTE PARA LARAVEL Y MULTIPART:
         * Laravel a veces falla con PUT + FormData. 
         * La solución estándar es usar POST y añadir _method = PUT.
         */
        data.append("_method", "PUT");

        try {
            const response = await api.post(`/actualizar-actividad/${id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                await Swal.fire({
                    icon: 'success',
                    title: '¡Actualizado!',
                    text: 'La actividad se guardó correctamente',
                    timer: 2000,
                    showConfirmButton: false
                });

                setEditMode(false);
                setNuevosArchivos([]); // Limpiar cola
                if (typeof cargarDetalles === 'function') {
                    await cargarDetalles(); // Refrescar vista
                }
            }
        } catch (error) {
            console.error("Error en la petición:", error.response?.data || error);

            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: error.response?.data?.error || error.response?.data?.message || 'Error interno del servidor (500)',
            });
        }
    };

    // Esta función quita el archivo de la lista local (antes de subir)
    const eliminarArchivoDeColumna = (index) => {
        // 1. Clonamos el array de archivos actuales
        const archivosActualizados = [...form.archivos];

        // 2. Eliminamos el elemento en esa posición
        archivosActualizados.splice(index, 1);

        // 3. Actualizamos el estado del formulario
        setForm({
            ...form,
            archivos: archivosActualizados
        });
    };
    const eliminarArchivoDeFila = (index) => {
        const filtrados = nuevosArchivos.filter((_, i) => i !== index);
        setNuevosArchivos(filtrados);
    };

    if (loading) return <p>Cargando detalles...</p>;
    if (!form) return <p>No se encontró la actividad</p>;




    return (
        <>
            <Navbar />

            <div className="container-ver-actividad">
                <Sidebar />
                <div className="actividad-detalle-container">
                    <div className="actividad-header">
                        <button className="btn-volver" onClick={() => navigate("/actividades")}>← Volver</button>
                        <button
                            className={`btn-editar ${editMode ? "btn-cancelar" : "btn-editar"}`}
                            onClick={() => setEditMode(!editMode)}
                        >
                            {editMode ? "Cancelar" : "Editar Actividad"}
                        </button>
                    </div>

                    <form onSubmit={handleUpdate} className="actividad-form">

                        {/* --- SECCIÓN TITULO Y ESTADO --- */}
                        <div className="seccion">
                            <div className="seccion-titulo">
                                <div className="seccion-estado">
                                    <label >Nombre de la Actividad</label>
                                    {editMode ? (
                                        <input
                                            className="input-titulo"
                                            name="nombre"
                                            value={form.nombre || ""}
                                            onChange={handleChange}
                                        />
                                    ) : <h1 className="titulo-actividad">{form.nombre}</h1>}
                                </div>

                                <div className="estado-container">
                                    <label style={{ display: "block", color: "#7a7a7aff" }}>Estado Actual</label>
                                    {editMode ? (
                                        <select
                                            name="estado"
                                            value={form.estado || ""}
                                            onChange={handleChange}
                                            className="select-estado"
                                        >
                                            {ESTADOS_ACTIVIDAD.map(est => (
                                                <option key={est.value} value={est.value}>{est.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={`badge-estado badge-${form.estado}`}>
                                            {form.estado}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="actividad-grid">

                            {/* --- COLUMNA IZQUIERDA: DETALLES --- */}
                            <div className="column-izq">
                                <h3>Detalles</h3>
                                <label>Descripción:</label>
                                {editMode ? (
                                    <textarea name="descripcion" value={form.descripcion || ""}
                                        onChange={handleChange} className="textarea-descripcion" />
                                ) : <p style={{ background: "rgb(246 246 246)", padding: "10px" }}>{form.descripcion || "Sin descripción"}</p>}

                                <label>Área:</label>
                                {editMode ? (
                                    <select
                                        name="area_id"
                                        // Usamos prioritariamente area_id del form, si no existe, el id del objeto area
                                        value={form.area_id || form.area?.id || ""}
                                        onChange={handleChange}
                                    >
                                        <option value="">Seleccione un área</option> {/* Siempre es bueno tener una opción vacía */}
                                        {areas.map(a => (
                                            <option key={a.id} value={a.id}>{a.nombre}</option>
                                        ))}
                                    </select>
                                ) : <p><strong>{form.area?.nombre}</strong></p>}
                            </div>

                            {/* --- COLUMNA DERECHA: PERSONAS --- */}
                            <div className="column-der">
                                <h3>Participantes</h3>
                                <label>Asignado por:</label>

                                <p> {form.asignado_por?.nombre} {form.asignado_por?.apellido}</p>

                                <label>Asignado a:</label>
                                {editMode ? (
                                    <select
                                        name="asignado_a"
                                        value={form.asignado_a?.id || form.asignado_a || ""}
                                        onChange={handleChange}
                                        style={{ width: "100%" }}
                                    >
                                        {usuarios.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.nombre_completo || u.nombre}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p>
                                        {form.asignado_a?.nombre} {form.asignado_a?.apellido}
                                        {form.asignado_a?.cargo && ` (${form.asignado_a.cargo})`}
                                    </p>
                                )}
                            </div>
                        </div>

                        <hr className="divider" />

                        {/* --- SECCIÓN DE TIEMPOS --- */}
                        <div className="actividad-tiempos">

                            {/* Minutos Planeados (Solo Jefe suele editar esto) */}
                            <div>
                                <label style={{ fontSize: "0.8em", color: "#7a7a7aff" }}>Mins. Planeados:</label>
                                {editMode ? (
                                    <input type="number" name="minutos_planeados" value={form.minutos_planeados} onChange={handleChange} style={{ width: "100%" }} />
                                ) : <p>{form.minutos_planeados} min </p>}
                            </div>
                            <div>
                                <label style={{ fontSize: "0.8em", color: "#7a7a7aff" }}>Mins. Ejecutados:</label>
                                {editMode ? (
                                    <input
                                        type="number"
                                        name="minutos_ejecutados"
                                        value={form.minutos_ejecutados}
                                        readOnly // <--- Esto bloquea la edición
                                        style={{ width: "100%", backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                                    />
                                ) : <p>{form.minutos_ejecutados} min </p>}
                            </div>
                            <div>
                                <label style={{ fontSize: "0.8em", color: "#7a7a7aff" }}>Fecha finalización:</label>
                                {editMode ? (
                                    <input type="datetime-local" name="fecha_finalizacion" value={
                                        form.fecha_finalizacion
                                            ? form.fecha_finalizacion.replace(" ", "T").slice(0, 16)
                                            : ""
                                    } onChange={handleChange} style={{ width: "100%" }} />
                                ) : <p>{form.fecha_finalizacion} </p>}
                            </div>
                            <div>
                                <label style={{ fontSize: "0.8em", color: "#7a7a7aff" }}>Fecha de registro:</label>
                                <p>
                                    {form.created_at ?
                                        new Date(form.created_at).toLocaleString('sv-SE', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        }).replace(',', '')
                                        : 'Sin fecha'}
                                </p>
                            </div>
                        </div>

                        <div className="checkbox-group">
                            {tienePermiso(["JefeInmediato", "Administrador"]) && (
                                <label style={{ marginRight: "20px" }}>
                                    <input type="checkbox" name="requiere_aprobacion"
                                        checked={!!form.requiere_aprobacion} onChange={handleChange} disabled={!editMode} />
                                    Requiere Aprobación
                                </label>
                            )}
                            <label>
                                <input type="checkbox" name="notificar_asignacion" checked={!!form.notificar_asignacion} onChange={handleChange} disabled={!editMode} />
                                Notificar Asignación
                            </label>
                        </div>

                        {/* --- SECCIÓN DE ARCHIVOS --- */}
                        <div className="actividad-archivos">
                            <h3>📂 Archivos Adjuntos</h3>
                            <div className="archivos-grid">

                                {/* MAPEAMOS DIRECTAMENTE LA COLUMNA 'archivos' */}
                                {form.archivos && form.archivos.length > 0 ? (
                                    form.archivos.map((arc, i) => (
                                        <div key={i} className="archivo-item-guardado">
                                            <a
                                                href={arc.url} // 👈 Usamos la URL directa del Accessor
                                                target="_blank"
                                                rel="noreferrer"
                                                style={{ textDecoration: "none", color: "#333" }}
                                            >
                                                📄 {arc.original_name || "Archivo"}
                                            </a>

                                            {editMode && (
                                                <button
                                                    type="button"
                                                    className="btn-quitar-archivo"
                                                    onClick={() => eliminarArchivoDeColumna(i)}
                                                    title="Quitar de la lista"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: "#777", fontSize: "0.9em" }}>No hay archivos guardados.</p>
                                )}
                            </div>

                            {/* SECCIÓN PARA SUBIR NUEVOS ARCHIVOS */}
                            {editMode && (
                                <div className="archivo-upload">
                                    <label>Añadir nuevos archivos:</label><br />
                                    <input type="file" multiple onChange={handleFilesChange} style={{ marginTop: "10px" }} />

                                    <div className="nuevos-archivos-lista">
                                        {nuevosArchivos.map((file, i) => (
                                            <div key={i} className="archivo-fila-item">
                                                <div className="archivo-fila-info">
                                                    <span style={{ color: "#2e7d32" }}>+ {file.name}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn-quitar-archivo"
                                                    onClick={() => eliminarArchivoDeFila(i)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {editMode && (
                            <button type="submit" style={{ marginTop: "30px", width: "100%", background: "#4CAF50", color: "white", padding: "12px", border: "none", borderRadius: "4px", fontSize: "1.1em", cursor: "pointer" }}>
                                💾 Guardar Todos los Cambios
                            </button>
                        )}
                    </form>



                    <VerSoluciones
                        evidencias={form.evidencias}
                        revisiones={form.revisiones}
                        solicitudes={form.solicitudes}
                        actividad={form}
                        BASE_URL={BASE_URL}
                        onUpdate={cargarDetalles}
                    />


                    {/* --- LÓGICA DE REVISIÓN DEL JEFE --- */}
                    {tienePermiso(['JefeInmediato', 'Administrador']) && form.estado === 'Espera_aprobacion' && (
                        <RevisarActividad
                            actividad={form}
                            onUpdate={cargarDetalles}
                        />
                    )}

                    {tienePermiso(['Usuario', 'JefeInmediato']) && (
                        <EnviarSolucion
                            actividad={form}
                            onSuccess={cargarDetalles}
                        />
                    )}
                </div>
            </div>
            <Version />
        </>
    );
};























// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import api from "../../services/api";
// import { EnviarSolucion } from "./EnviarSolucion";

// export const VerActividad = () => {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const [loading, setLoading] = useState(true);
//     const [editMode, setEditMode] = useState(false);
//     const [areas, setAreas] = useState([]);
//     const [usuarios, setUsuarios] = useState([]);
//     const [nuevosArchivos, setNuevosArchivos] = useState([]);
//     const [form, setForm] = useState(null);
//     const [nuevosArchivosSolucion, setNuevosArchivosSolucion] = useState([]);


//     const BASE_URL = api.defaults.baseURL.replace(/\/api$/, "");

//     const ESTADOS_ACTIVIDAD = [
//         { value: 'Programada', label: 'Programada' },
//         { value: 'Ejecución', label: 'En Ejecución' },
//         { value: 'Finalizada', label: 'Finalizada' },
//         { value: 'Espera_aprobacion', label: 'Espera de aprobacón' },
//         { value: 'Aplazada', label: 'Aplazada' },
//         { value: 'Por_corregir', label: 'Por corregir' },
//         { value: 'Cancelada', label: 'Cancelada' }
//     ];

//    useEffect(() => {
//     setForm({});
//     setLoading(true);

//     const cargarDetalles = async () => {
//         try {
//             const [resAct, resAreas, resUsers] = await Promise.all([
//                 api.get(`/ver-actividad/${id}`),
//                 api.get("/ver-areas"),
//                 api.get("/ver-usuarios")
//             ]);

//             setForm(resAct.data);

//             setAreas(resAreas.data.data);
//             setUsuarios(resUsers.data.data);

//         } catch (error) {
//             console.error("Error al cargar actividad:", error);

//             if (error.response?.status === 401) {
//                 window.location.href = "/force-logout";
//             }
//             else if (error.response?.status === 403) {
//                 alert("No tienes permiso para ver esta actividad");
//                 navigate("/actividades");
//             }
//             else if (error.response?.status === 404) {
//                 alert("Actividad no encontrada");
//                 navigate("/actividades");
//             }
//             else {
//                 alert("Error inesperado");
//                 navigate("/actividades");
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     if (id) {
//         cargarDetalles();
//     }

// }, [id, navigate]);



//     const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setForm({ ...form, [name]: type === "checkbox" ? (checked ? 1 : 0) : value });
//     };

//     const handleFilesChange = (e) => {
//         const selected = Array.from(e.target.files);
//         setNuevosArchivos((prev) => [...prev, ...selected]);
//         e.target.value = null;
//     };


//     const handleSolucionFilesChange = (e) => {
//         const selected = Array.from(e.target.files);
//         setNuevosArchivosSolucion((prev) => [...prev, ...selected]);
//         e.target.value = null;
//     };

//     const handleUpdate = async (e) => {
//         e.preventDefault();
//         const data = new FormData();

//         // 1. Procesar el formulario
//         Object.keys(form).forEach(key => {
//             const value = form[key];

//             if (key === 'area' && value?.id) {
//                 data.append('area_id', value.id);
//             }
//             else if (key === 'asignado_a' && value?.id) {
//                 data.append('asignado_a', value.id);
//             }
//             else if (key === 'requiere_aprobacion' || key === 'notificar_asignacion') {
//                 data.append(key, value ? "1" : "0");
//             }
//             else if (!['archivos', 'archivos_solucion', 'area', 'asignado_por', 'asignado_a_user', 'aprobada_por'].includes(key)) {
//                 if (value !== null && value !== undefined) {
//                     data.append(key, value);
//                 }
//             }
//         }); // <--- ASEGÚRATE DE QUE ESTA LLAVE Y PARÉNTESIS ESTÉN AQUÍ

//         // 2. Archivos
//         nuevosArchivos.forEach(file => data.append("archivos[]", file));
//         nuevosArchivosSolucion.forEach(file => data.append("archivos_solucion[]", file));

//         // 3. Método Spoofing
//         data.append("_method", "PUT");

//         try {
//             const response = await api.post(`/actualizar-actividad/${id}`, data, {
//                 headers: { 'Content-Type': 'multipart/form-data' }
//             });

//             if (response.data.success) {
//                 alert("¡Cambios guardados!");
//                 setEditMode(false);
//                 setNuevosArchivos([]);
//                 setNuevosArchivosSolucion([]);
//                 setEditMode(false);
//             }
//         } catch (error) {
//             console.error("Error:", error.response?.data);
//             alert("Error al guardar");
//         }
//     };


//     if (loading) return <p>Cargando detalles...</p>;
//     if (!form) return <p>No se encontró la actividad</p>;


//     return (
//         <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto", fontFamily: "Arial" }}>
//             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
//                 <button onClick={() => navigate("/actividades")}>← Volver</button>
//                 <button
//                     onClick={() => setEditMode(!editMode)}
//                     style={{ background: editMode ? "#f44336" : "#2196F3", color: "white", padding: "8px 15px", border: "none", borderRadius: "4px" }}
//                 >
//                     {editMode ? "Cancelar" : "Editar Actividad"}
//                 </button>
//             </div>

//             <form onSubmit={handleUpdate} style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>

//                 {/* --- SECCIÓN TITULO Y ESTADO --- */}
//                 <div style={{ borderBottom: "2px solid #eee", marginBottom: "20px", paddingBottom: "10px" }}>
//                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                         <div style={{ flex: 1 }}>
//                             <label style={{ display: "block", color: "#7a7a7aff" }}>Nombre de la Actividad</label>
//                             {editMode ? (
//                                 <input
//                                     name="nombre"
//                                     value={form.nombre || ""}
//                                     onChange={handleChange}
//                                     style={{ width: "90%", fontSize: "1.5em", padding: "5px" }}
//                                 />
//                             ) : <h1 style={{ margin: "5px 0" }}>{form.nombre}</h1>}
//                         </div>

//                         <div style={{ textAlign: "right" }}>
//                             <label style={{ display: "block", color: "#7a7a7aff" }}>Estado Actual</label>
//                             {editMode ? (
//                                 <select
//                                     name="estado"
//                                     value={form.estado || ""}
//                                     onChange={handleChange}
//                                     style={{
//                                         padding: "8px",
//                                         borderRadius: "5px",
//                                         border: "1px solid #2196F3",
//                                         fontWeight: "bold",
//                                         backgroundColor: "#e3f2fd"
//                                     }}
//                                 >
//                                     {ESTADOS_ACTIVIDAD.map(est => (
//                                         <option key={est.value} value={est.value}>{est.label}</option>
//                                     ))}
//                                 </select>
//                             ) : (
//                                 <span style={{
//                                     background: form.estado === 'completada' ? '#4CAF50' : '#e0e0e0',
//                                     color: form.estado === 'completada' ? 'white' : 'black',
//                                     padding: "6px 12px",
//                                     borderRadius: "20px",
//                                     fontSize: "0.9em",
//                                     fontWeight: "bold",
//                                     textTransform: "uppercase"
//                                 }}>
//                                     {form.estado}
//                                 </span>
//                             )}
//                         </div>
//                     </div>
//                 </div>

//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

//                     {/* --- COLUMNA IZQUIERDA: DETALLES --- */}
//                     <div>
//                         <h3>Detalles</h3>
//                         <label>Descripción:</label>
//                         {editMode ? (
//                             <textarea name="descripcion" value={form.minutos_planeados} onChange={handleChange} style={{ width: "100%", height: "80px" }} />
//                         ) : <p style={{ background: "#f9f9f9", padding: "10px" }}>{form.descripcion || "Sin descripción"}</p>}

//                         <label>Área:</label>
//                         {editMode ? (
//                             <select name="area_id" value={form.area_id} onChange={handleChange} style={{ width: "100%" }}>
//                                 {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
//                             </select>
//                         ) : <p><strong>{form.area?.nombre}</strong></p>}
//                     </div>

//                     {/* --- COLUMNA DERECHA: PERSONAS --- */}
//                     <div>
//                         <h3>Participantes</h3>
//                         <p><strong>Asignado por:</strong> {form.asignado_por?.nombre} {form.asignado_por?.apellido}</p>

//                         <label>Asignado a:</label>
//                         {editMode ? (
//                             <select name="asignado_a" value={form.asignado_a?.id || form.asignado_a || ""}
//                                 onChange={handleChange} style={{ width: "100%" }}>
//                                 {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre_completo || u.nombre}</option>)}
//                             </select>
//                         ) : <p>{form.asignado_a?.nombre} {form.asignado_a?.apellido} ({form.asignado_a?.cargo})</p>}
//                     </div>
//                 </div>

//                 <hr style={{ margin: "20px 0", border: "0.5px solid #eee" }} />

//                 {/* --- TIEMPOS Y CHECKS --- */}
//                 {/* --- SECCIÓN DE TIEMPOS --- */}
//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginTop: "15px" }}>

//                     {/* Minutos Planeados (Solo Jefe suele editar esto) */}
//                     <div>
//                         <label style={{ fontSize: "0.8em", color: "#7a7a7aff" }}>Mins. Planeados:</label>
//                         {editMode ? (
//                             <input type="number" name="minutos_planeados" value={form.minutos_planeados} onChange={handleChange} style={{ width: "100%" }} />
//                         ) : <p>{form.minutos_planeados} min</p>}
//                     </div>

//                     {/* Minutos Ejecutados (Se bloquea si está en Por_corregir) */}
//                     {/* Campo Minutos Ejecutados */}
//                     {/* <div>
//                         <label>Mins. Ejecutados:</label>
//                         <input
//                             type="number"
//                             name="minutos_ejecutados"
//                             value={form.minutos_ejecutados}
//                             onChange={handleChange}
//                             // BLOQUEO TOTAL SI ES POR CORREGIR
//                             disabled={form.estado === 'Por_corregir'}
//                             style={{
//                                 backgroundColor: form.estado === 'Por_corregir' ? "#eee" : "white",
//                                 cursor: form.estado === 'Por_corregir' ? "not-allowed" : "text"
//                             }}
//                         />
//                     </div> */}
//                 </div>

//                 <div style={{ marginTop: "15px" }}>
//                     <label style={{ marginRight: "20px" }}>
//                         <input type="checkbox" name="requiere_aprobacion" checked={!!form.requiere_aprobacion} onChange={handleChange} disabled={!editMode} />
//                         Requiere Aprobación
//                     </label>
//                     <label>
//                         <input type="checkbox" name="notificar_asignacion" checked={!!form.notificar_asignacion} onChange={handleChange} disabled={!editMode} />
//                         Notificar Asignación
//                     </label>
//                 </div>

//                 {/* --- SECCIÓN DE ARCHIVOS --- */}
//                 <div style={{ marginTop: "30px", padding: "15px", background: "#f1f1f1", borderRadius: "8px" }}>
//                     <h3>📂 Archivos Adjuntos</h3>
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
//                         {form.archivos?.map((arc, i) => (
//                             <div key={i} style={{ background: "white", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}>
//                                 <a href={`${BASE_URL}/storage/${arc.path}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#333" }}>
//                                     📄 {arc.original_name}
//                                 </a>
//                             </div>
//                         ))}
//                     </div>

//                     {editMode && (
//                         <div style={{ marginTop: "15px", borderTop: "1px dashed #999", paddingTop: "10px" }}>
//                             <label><strong>Añadir más archivos a la fila:</strong></label><br />
//                             <input type="file" multiple onChange={handleFilesChange} />
//                             {nuevosArchivos.map((file, i) => (
//                                 <div key={i} style={{ color: "green", fontSize: "0.9em" }}>+ {file.name}</div>
//                             ))}
//                         </div>
//                     )}
//                 </div>

//                 {editMode && (
//                     <button type="submit" style={{ marginTop: "30px", width: "100%", background: "#4CAF50", color: "white", padding: "12px", border: "none", borderRadius: "4px", fontSize: "1.1em", cursor: "pointer" }}>
//                         💾 Guardar Todos los Cambios
//                     </button>
//                 )}
//             </form>
//             {/* <div style={{
//                 marginTop: "30px",
//                 padding: "20px",
//                 background: "#e8f5e9",
//                 borderRadius: "8px",
//                 border: "1px solid #c8e6c9"
//             }}>
//                 <h3 style={{ color: "#2e7d32", marginTop: 0 }}>✅ Solución y Evidencias</h3>

//                 <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>
//                     Descripción de la Solución:
//                 </label>
//                 {editMode ? (
//                     <textarea
//                         name="solucion"
//                         value={form.solucion || ""}
//                         onChange={handleChange}
//                         placeholder="Describe aquí lo que realizaste..."
//                         style={{ width: "100%", height: "100px", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
//                     />
//                 ) : (
//                     <p style={{ background: "white", padding: "15px", borderRadius: "5px", border: "1px solid #dee2e6" }}>
//                         {form.solucion || "No se ha registrado una solución aún."}
//                     </p>
//                 )}

//                 <div style={{ marginTop: "15px" }}>
//                     <label style={{ fontWeight: "bold" }}>📂 Archivos de Evidencia:</label>
//                     <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
//                         {form.archivos_solucion?.map((arc, i) => (
//                             <div key={i} style={{ background: "white", padding: "8px", borderRadius: "5px", border: "1px solid #A5D6A7" }}>
//                                 <a href={`${BASE_URL}/storage/${arc.path}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#2e7d32", fontSize: "0.9em" }}>
//                                     📎 {arc.original_name}
//                                 </a>
//                             </div>
//                         ))}
//                         {(!form.archivos_solucion || form.archivos_solucion.length === 0) && <span style={{ color: "#7a7a7aff", fontSize: "0.9em" }}>Ningún archivo adjunto</span>}
//                     </div>
//                 </div>

//                 {editMode && (
//                     <div style={{ marginTop: "15px", borderTop: "1px dashed #2e7d32", paddingTop: "10px" }}>
//                         <label><strong>Adjuntar evidencias de cumplimiento:</strong></label><br />
//                         <input type="file" multiple onChange={handleSolucionFilesChange} style={{ marginTop: "5px" }} />
//                         {nuevosArchivosSolucion.map((file, i) => (
//                             <div key={i} style={{ color: "#2e7d32", fontSize: "0.85em", fontWeight: "bold" }}>+ {file.name}</div>
//                         ))}
//                     </div>
//                 )}
//             </div> */}
//             <EnviarSolucion
//                 actividad={form}
//                 onSuccess={() => window.location.reload()}
//             />
//         </div>
//     );
// };

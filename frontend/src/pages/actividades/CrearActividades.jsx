import { useState, useEffect } from "react";
import api from "../../services/api";
import { useNavigate } from "react-router-dom";
import { tienePermiso } from "../../utils/Permisos";
import "./styles/CrearActividades.css"; // Asegúrate de que la ruta sea correcta
import { Navbar } from "../../components/Navbar";
import { Sidebar } from "../../components/Sidebar";
import Swal from "sweetalert2";

export const CrearActividades = () => {
    const navigate = useNavigate();
    const [areas, setAreas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [archivos, setArchivos] = useState([]);

    const [form, setForm] = useState({
        nombre: "",
        descripcion: "",
        area_id: "",
        asignado_a: "",
        minutos_planeados: "",
        minutos_ejecutados: "",
        fecha_finalizacion: "",
        estado: "Programada", 
        requiere_aprobacion: 0,
        notificar_asignacion: 1,
    });

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const resAreas = await api.get("/ver-areas");
                const listaA = resAreas.data.data || resAreas.data;
                setAreas(listaA);

                const resUsuarios = await api.get("/ver-usuarios");
                const listaU = resUsuarios.data.data || resUsuarios.data;
                setUsuarios(listaU);

                setForm(prev => {
                    const nuevoEstado = { ...prev };
                    if (listaU.length === 1) nuevoEstado.asignado_a = listaU[0].id;
                    if (listaA.length === 1) nuevoEstado.area_id = listaA[0].id;
                    return nuevoEstado;
                });
            } catch (error) {
                console.error("Error cargando datos:", error);
            }
        };
        cargarDatos();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
        });
    };

    const handleFilesChange = (e) => {
        const nuevosArchivos = Array.from(e.target.files);
        setArchivos((prev) => [...prev, ...nuevosArchivos]);
        e.target.value = null;
    };

    const removerArchivo = (indexARemover) => {
        setArchivos((prev) => prev.filter((_, index) => index !== indexARemover));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. Mostrar alerta de "Procesando"
        Swal.fire({
            title: 'Creando actividad...',
            text: 'Estamos subiendo los archivos y registrando la información.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const data = new FormData();
            for (const key in form) {
                if (form[key] !== undefined && form[key] !== null) {
                    data.append(key, form[key]);
                }
            }
            archivos.forEach((file) => {
                data.append("archivos[]", file);
            });

            await api.post("/crear-actividad", data);

            // 2. Alerta de Éxito
            await Swal.fire({
                icon: 'success',
                title: '¡Actividad Creada!',
                text: 'La actividad se ha registrado correctamente.',
                timer: 2000,
                showConfirmButton: false,
            });

            navigate("/actividades");

        } catch (error) {
            console.error(error.response?.data || error.message);

            // 3. Alerta de Error
            Swal.fire({
                icon: 'error',
                title: 'Ups, algo salió mal',
                text: error.response?.data?.message || 'No se pudo crear la actividad. Intenta de nuevo.',
                confirmButtonColor: '#0087cd'
            });
        }
    };

    return (
        <>
            <Navbar />

            <div className="container-crear-actividad">
                <Sidebar />
                <div className="actividad-form-container">
                    <h2 className="form-title">Crear Actividad</h2>

                    <form onSubmit={handleSubmit} encType="multipart/form-data" className="actividad-form">

                        {/* --- SECCIÓN 1: INFORMACIÓN BÁSICA --- */}
                        <fieldset className="form-section">
                            <legend className="section-legend">Información General</legend>
                            <div className="form-group">
                                <label className="form-label">Nombre de la actividad:</label>
                                <input type="text" name="nombre" className="form-input" placeholder="Ej: Reporte mensual" onChange={handleChange} required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Descripción:</label>
                                <textarea name="descripcion" className="form-textarea" placeholder="Detalles de la tarea..." onChange={handleChange} />
                            </div>
                        </fieldset>

                        {/* --- SECCIÓN 2: ASIGNACIÓN Y ÁREA --- */}
                        <fieldset className="form-section">
                            <legend className="section-legend">Asignación</legend>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Área responsable:</label>
                                    <select name="area_id" className="form-select" value={form.area_id} onChange={handleChange} required>
                                        <option value="">Seleccione un área</option>
                                        {areas.map((area) => (
                                            <option key={area.id} value={area.id}>{area.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Asignar a usuario:</label>
                                    {tienePermiso(["JefeInmediato", "Administrador"]) ? (
                                        <select name="asignado_a" className="form-select" value={form.asignado_a} onChange={handleChange} required>
                                            <option value="">Seleccione un usuario</option>
                                            {usuarios.map((user) => (
                                                <option key={user.id} value={user.id}>{user.nombre_completo}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="user-readonly-badge">
                                            <span className="user-icon">👤</span> {usuarios[0]?.nombre_completo || "Cargando..."}
                                            <input type="hidden" name="asignado_a" value={form.asignado_a} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </fieldset>

                        {/* --- SECCIÓN 3: TIEMPOS Y FECHAS --- */}
                        <fieldset className="form-section">
                            <legend className="section-legend">Planificación y Tiempos</legend>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Minutos Planeados:</label>
                                    <input type="number" name="minutos_planeados" className="form-input" onChange={handleChange} value={form.minutos_planeados} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Minutos Ejecutados:</label>
                                    <input type="number" name="minutos_ejecutados" className="form-input" onChange={handleChange} value={form.minutos_ejecutados} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Fecha de Finalización:</label>
                                    <input type="datetime-local" name="fecha_finalizacion" className="form-input" onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Estado de la Actividad:</label>
                                    <select name="estado" className="form-select" value={form.estado} onChange={handleChange} required>
                                        <option value="Programada">Programada</option>
                                        <option value="Ejecución">En Ejecución</option>
                                        <option value="Finalizada">Finalizada</option>
                                        <option value="Por_corregir">Por corregir</option>
                                        <option value="Aplazada">Aplazada</option>
                                        <option value="Cancelada">Cancelada</option>
                                    </select>
                                </div>
                            </div>
                        </fieldset>

                        {/* --- SECCIÓN 4: CONFIGURACIONES --- */}
                        <fieldset className="form-section no-border">
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input type="checkbox" name="requiere_aprobacion" onChange={handleChange} />
                                    <span>Requiere aprobación de un superior</span>
                                </label>
                                <label className="checkbox-label">
                                    <input type="checkbox" name="notificar_asignacion" defaultChecked onChange={handleChange} />
                                    <span>Notificar al usuario por correo</span>
                                </label>
                            </div>
                        </fieldset>

                        {/* --- SECCIÓN 5: ARCHIVOS ADJUNTOS --- */}
                        <fieldset className="form-section">
                            <legend className="section-legend">Documentos y Archivos</legend>
                            <div className="file-input-wrapper">
                                <input type="file" multiple onChange={handleFilesChange} className="form-file-input" id="file-upload" />
                                <label htmlFor="file-upload" className="file-upload-btn">📎 Seleccionar Archivos</label>
                            </div>

                            <div className="file-list">
                                {archivos.map((file, index) => (
                                    <div key={index} className="file-item">
                                        <span className="file-name">📄 {file.name}</span>
                                        <button type="button" className="btn-remove-file" onClick={() => removerArchivo(index)}>Quitar</button>
                                    </div>
                                ))}
                            </div>
                        </fieldset>

                        <div className="form-actions">
                            <button type="submit" className="btn-submit-main">Guardar Nueva Actividad</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};























// import { useState, useEffect } from "react";
// import api from "../../services/api";
// import { useNavigate } from "react-router-dom";
// import { tienePermiso } from "../../utils/Permisos";

// export const CrearActividades = () => {
//     const navigate = useNavigate();
//     const [areas, setAreas] = useState([]);
//     const [usuarios, setUsuarios] = useState([]);

//     // Estado para acumular archivos en fila
//     const [archivos, setArchivos] = useState([]);

//     const [form, setForm] = useState({
//         nombre: "",
//         descripcion: "",
//         area_id: "",
//         asignado_a: "",
//         minutos_planeados: "",
//         minutos_ejecutados: "",
//         fecha_finalizacion: "",
//         estado: "",
//         requiere_aprobacion: 0,
//         notificar_asignacion: 1, // Por defecto 1 según tu código
//     });

//     useEffect(() => {
//         const cargarDatos = async () => {
//             try {
//                 const resAreas = await api.get("/ver-areas");
//                 const listaA = resAreas.data.data || resAreas.data;
//                 setAreas(listaA);

//                 const resUsuarios = await api.get("/ver-usuarios");
//                 const listaU = resUsuarios.data.data || resUsuarios.data;
//                 setUsuarios(listaU);

//                 // 🌟 LÓGICA DE AUTO-ASIGNACIÓN
//                 setForm(prev => {
//                     const nuevoEstado = { ...prev };

//                     // Si solo hay un usuario (caso Rol Usuario), asignarlo
//                     if (listaU.length === 1) {
//                         nuevoEstado.asignado_a = listaU[0].id;
//                     }

//                     // Si solo hay una área, asignarla también para evitar el 422
//                     if (listaA.length === 1) {
//                         nuevoEstado.area_id = listaA[0].id;
//                     }

//                     return nuevoEstado;
//                 });

//             } catch (error) {
//                 console.error("Error cargando datos:", error);
//             }
//         };
//         cargarDatos();
//     }, []);

//     const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setForm({
//             ...form,
//             [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
//         });
//     };

//     // Lógica para acumular archivos sin borrar los anteriores
//     const handleFilesChange = (e) => {
//         const nuevosArchivos = Array.from(e.target.files);
//         setArchivos((prev) => [...prev, ...nuevosArchivos]);
//         e.target.value = null; // Reset del input para permitir repetir archivos si se desea
//     };

//     // Función para quitar un archivo de la lista antes de enviar
//     const removerArchivo = (indexARemover) => {
//         setArchivos((prev) => prev.filter((_, index) => index !== indexARemover));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         try {
//             const data = new FormData();

//             // Campos normales del form
//             for (const key in form) {
//                 if (form[key] !== undefined && form[key] !== null) {
//                     data.append(key, form[key]);
//                 }
//             }

//             // Agregar todos los archivos acumulados
//             archivos.forEach((file) => {
//                 data.append("archivos[]", file);
//             });

//             await api.post("/crear-actividad", data);

//             alert("Actividad creada correctamente ✅");
//             navigate("/actividades");
//         } catch (error) {
//             console.error(error.response?.data || error.message);
//             alert("Error al crear actividad ❌");
//         }
//     };

//     return (
//         <>
//             <div>
//                 <h2>Crear Actividad</h2>

//                 <form onSubmit={handleSubmit} encType="multipart/form-data">

//                     {/* --- SECCIÓN 1: INFORMACIÓN BÁSICA --- */}
//                     <fieldset>
//                         <legend>Información General</legend>
//                         <div>
//                             <label>Nombre de la actividad:</label>
//                             <input type="text" name="nombre" placeholder="Ej: Reporte mensual" onChange={handleChange} required />
//                         </div>

//                         <div>
//                             <label>Descripción:</label>
//                             <textarea name="descripcion" placeholder="Detalles de la tarea..." onChange={handleChange} />
//                         </div>
//                     </fieldset>

//                     {/* --- SECCIÓN 2: ASIGNACIÓN Y ÁREA --- */}

//                     {/* --- SECCIÓN 2: ASIGNACIÓN Y ÁREA --- */}
//                     <fieldset>
//                         <legend>Asignación</legend>
//                         <div>
//                             <label>Área responsable:</label>
//                             <select name="area_id" value={form.area_id} onChange={handleChange} required>
//                                 <option value="">Seleccione un área</option>
//                                 {areas.map((area) => (
//                                     <option key={area.id} value={area.id}>{area.nombre}</option>
//                                 ))}
//                             </select>
//                         </div>

//                         <div>
//                             <label>Asignar a usuario:</label>

//                             {/* Lógica condicional por ROL */}
//                             {tienePermiso(["JefeInmediato", "Administrador"]) ? (
//                                 /* CASO JEFES/ADMIN: Ven el selector para elegir a cualquier usuario */
//                                 <select
//                                     name="asignado_a"
//                                     value={form.asignado_a}
//                                     onChange={handleChange}
//                                     required
//                                 >
//                                     <option value="">Seleccione un usuario</option>
//                                     {usuarios.map((user) => (
//                                         <option key={user.id} value={user.id}>{user.nombre_completo}</option>
//                                     ))}
//                                 </select>
//                             ) : (
//                                 /* CASO USUARIO: Solo ve su propio nombre (la listaU que cargó el useEffect ya viene filtrada) */
//                                 usuarios.length > 0 ? (
//                                     <div>
//                                         {usuarios[0].nombre_completo}
//                                         {/* Input invisible para que el valor viaje en el form sin que el usuario lo toque */}
//                                         <input type="hidden" name="asignado_a" value={form.asignado_a} />
//                                     </div>
//                                 ) : (
//                                     <span>Cargando tus datos...</span>
//                                 )
//                             )}
//                         </div>
//                     </fieldset>

//                     {/* --- SECCIÓN 3: TIEMPOS Y FECHAS --- */}
//                     <fieldset>
//                         <legend>Planificación y Tiempos</legend>
//                         <div>
//                             <label>Minutos Planeados:</label>
//                             <input type="number" name="minutos_planeados" onChange={handleChange} value={form.minutos_planeados} required />
//                         </div>

//                         <div>
//                             <label>Minutos Ejecutados:</label>
//                             <input type="number" name="minutos_ejecutados" onChange={handleChange} value={form.minutos_ejecutados} />
//                         </div>

//                         <div>
//                             <label>Fecha de Finalización:</label>
//                             <input type="datetime-local" name="fecha_finalizacion" onChange={handleChange} required />
//                         </div>
//                         <div>
//                             <label>Estado de la Actividad:</label>
//                             <select
//                                 name="estado"
//                                 value={form.estado}
//                                 onChange={handleChange}
//                                 required
//                             >
//                                 <option value="Programada">Programada</option>
//                                 <option value="Ejecución">En Ejecución</option>
//                                 <option value="Finalizada">Finalizada</option>
//                                 <option value="Por_corregir">Por corregir</option>
//                                 <option value="Aplazada">Aplazada</option>
//                                 <option value="Cancelada">Cancelada</option>
//                             </select>
//                         </div>
//                     </fieldset>

//                     {/* --- SECCIÓN 4: CONFIGURACIONES --- */}
//                     <fieldset>
//                         <legend>Opciones adicionales</legend>
//                         <label>
//                             <input type="checkbox" name="requiere_aprobacion" onChange={handleChange} />
//                             Requiere aprobación de un superior
//                         </label>
//                         <br />
//                         <label>
//                             <input type="checkbox" name="notificar_asignacion" defaultChecked onChange={handleChange} />
//                             Notificar al usuario por correo
//                         </label>
//                     </fieldset>

//                     {/* --- SECCIÓN 5: ARCHIVOS ADJUNTOS --- */}
//                     <fieldset>
//                         <legend>Documentos y Archivos</legend>
//                         <input type="file" multiple onChange={handleFilesChange} />

//                         {/* Listado de archivos seleccionados */}
//                         <div>
//                             {archivos.map((file, index) => (
//                                 <div key={index} >
//                                     <span>{file.name}</span>
//                                     <button type="button" onClick={() => removerArchivo(index)} >Quitar</button>
//                                 </div>
//                             ))}
//                         </div>
//                     </fieldset>

//                     <div>
//                         <button type="submit" >Guardar Nueva Actividad</button>
//                     </div>
//                 </form>
//             </div>
//         </>
//     );
// };
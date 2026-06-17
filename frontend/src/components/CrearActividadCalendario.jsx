import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ModalAreas } from "./ModalAreas";
import api from "../services/api";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { tienePermiso } from "../utils/Permisos";
import './styles/CrearAtividadCalendario.css';
// import { ModalTiposActividad } from "../../components/ModalTiposActividad";

const VALOR_INICIAL_FORM = {
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
};
export const CrearActividadCalendario = ({ onActividadCreada }) => {
    const navigate = useNavigate();
    const [areas, setAreas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [archivos, setArchivos] = useState([]);
    // const [actividadesDisponibles, setActividadesDisponibles] = useState([]);
    const [showModalAreas, setShowModalAreas] = useState(false);



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
                // 1. Traemos las áreas de la API
                const resAreas = await api.get("/ver-areas");
                const listaA = resAreas.data.data || resAreas.data;
                setAreas(listaA);

                // 2. Traemos los usuarios de la API
                const resUsuarios = await api.get("/ver-usuarios");
                const listaU = resUsuarios.data.data || resUsuarios.data;
                setUsuarios(listaU);

                // 3. Sincronizamos el formulario con los datos cargados
                setForm(prev => {
                    const nuevoEstado = { ...prev };

                    // Lógica de usuarios que ya tenías
                    if (listaU.length === 1) {
                        nuevoEstado.asignado_a = listaU[0].id;
                    } else if (listaU.length > 0) {
                        nuevoEstado.asignado_a = listaU[0].id;
                    }

                    // 🔥 LA SOLUCIÓN EXPRESO:
                    // Si la lista de áreas tiene exactamente 1 elemento (como le pasa a tu usuario)
                    // la seleccionamos en el estado inmediatamente convirtiendo el ID a String.
                    if (listaA.length === 1) {
                        nuevoEstado.area_id = listaA[0].id.toString();
                    } else {
                        // Si es Administrador o Jefe con muchas áreas, sí empieza en blanco
                        nuevoEstado.area_id = "";
                    }

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

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
        }));

        // Cuando cambie el área
        if (name === "area_id") {

            const areaSeleccionada = areas.find(
                (area) => area.id.toString() === value.toString()
            );

            if (areaSeleccionada) {

                // limpiar actividad seleccionada
                setForm((prev) => ({
                    ...prev,
                    area_id: value,
                    nombre: ""
                }));
            }
        }
    };

    const handleFilesChange = (e) => {
        const nuevosArchivos = Array.from(e.target.files);
        setArchivos((prev) => [...prev, ...nuevosArchivos]);
        e.target.value = null;
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
            setForm(VALOR_INICIAL_FORM);
            setArchivos([]);

            if (onActividadCreada) {
                onActividadCreada();
            }
            
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

    const areaSeleccionada = areas.find(
        (area) => String(area.id) === String(form.area_id)
    );
    const actividadesDisponibles = areaSeleccionada?.tipos_actividad || [];

    const removerArchivo = (indexARemover) => {
        setArchivos((prev) => prev.filter((_, index) => index !== indexARemover));
    };

    return (
        <>

            {/* <div className="container_crear_actividad"> */}
            <div className="actv-form-container">
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="actividad_form">
                    {/* --- SECCIÓN 1: INFORMACIÓN BÁSICA --- */}
                    <fieldset className="grid-form-container-crear">
                        <legend className="section-legend">Crear Actividad</legend>


                        <div className="form_group">
                            <div >
                                <label className="form-label">Área responsable:</label>

                            </div>

                            <select
                                name="area_id"
                                className="form_select"
                                value={form.area_id} // Forzado por React
                                onChange={handleChange}
                                required
                            >
                                {/* Deja la opción sin interactuar con atributos que confundan al navegador */}
                                <option value="">Seleccione un área</option>

                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>
                                        {area.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* TIPO ACTIVIDAD */}
                        <div className="form_group">

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "5px"
                                }}
                            >
                                <label className="form-label">
                                    Tipo de actividades:
                                </label>


                            </div>

                            <select
                                name="nombre"
                                className="form_select"
                                value={form.nombre}
                                onChange={handleChange}
                                required
                            >
                                <option value="">
                                    Seleccione actividad
                                </option>

                                {actividadesDisponibles.map((actividad) => (
                                    <option
                                        key={actividad.id}
                                        value={actividad.nombre}
                                    >
                                        {actividad.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* DESCRIPCIÓN */}
                        <div className="form_group">
                            <label className="form-label">Descripción:</label>

                            <textarea
                                name="descripcion"
                                className="form_textarea"
                                placeholder="Detalles de la tarea..."
                                onChange={handleChange}
                                value={form.descripcion}
                            />
                        </div>
                        <div className="form_group">
                            <label className="form-label">Minutos Planeados:</label>
                            <input type="number" name="minutos_planeados" className="form_input" onChange={handleChange} value={form.minutos_planeados} required />
                        </div>
                        <div className="form_group">
                            <label className="form-label">Fecha de Finalización:</label>
                            <input type="datetime-local" name="fecha_finalizacion" className="form_input" onChange={handleChange} value={form.fecha_finalizacion} required />
                        </div>
                        <div className="form_group">
                            <label className="form-label">Estado de la Actividad:</label>
                            <select name="estado" className="form_select" value={form.estado} onChange={handleChange} required>
                                <option value="Programada">Programada</option>
                                <option value="Ejecución">En Ejecución</option>
                                <option value="Finalizada">Finalizada</option>
                                <option value="Por_corregir">Por corregir</option>
                                <option value="Aplazada">Aplazada</option>
                                <option value="Cancelada">Cancelada</option>
                            </select>
                        </div>
                        <div className="form_group">
                            <label className="form-label">Asignar a usuario:</label>
                            {tienePermiso(["JefeInmediato", "Administrador"]) ? (
                                <select name="asignado_a" className="form_select" value={form.asignado_a} onChange={handleChange} required>
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
                        <div className="checkbox_group">
                            {tienePermiso(["JefeInmediato", "Administrador"]) && (
                                <label className="checkbox_label">
                                    <input type="checkbox" name="requiere_aprobacion" onChange={handleChange} />
                                    <span>Requiere aprobación de un superior</span>
                                </label>
                            )}
                            <label className="checkbox_label">
                                <input type="checkbox" name="notificar_asignacion" defaultChecked onChange={handleChange} />
                                <span>Notificar al usuario por correo</span>
                            </label>
                        </div>
                        <div className="file-input-wrapper">
                            <input type="file" multiple onChange={handleFilesChange} className="form-file-input" id="file-upload" />
                            <label htmlFor="file-upload" className="file-upload-btn">📎 Seleccionar Archivos</label>
                            <div className="form_actions">
                                <button type="submit" className="btn_submit_main">Guardar Nueva Actividad</button>
                            </div>
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
                </form>
            </div>

            {/* </div> */}
            {/* MODAL ADMINISTRACIÓN */}
            {showModalAreas && (
                <ModalAreas
                    onClose={() => setShowModalAreas(false)}
                    reloadAreas={async () => {

                        const resAreas = await api.get("/ver-areas");

                        setAreas(resAreas.data.data || []);
                    }}
                />
            )}
        </>
    );
};




















































// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Swal from "sweetalert2";
// import { ModalAreas } from "./ModalAreas";
// import api from "../services/api";
// import { Sidebar } from "./Sidebar";
// import { Navbar } from "./Navbar";
// import { tienePermiso } from "../utils/Permisos";
// import './styles/CrearAtividadCalendario.css';
// // import { ModalTiposActividad } from "../../components/ModalTiposActividad";

// const VALOR_INICIAL_FORM = {
//     nombre: "",
//     descripcion: "",
//     area_id: "",
//     asignado_a: "",
//     minutos_planeados: "",
//     minutos_ejecutados: "",
//     fecha_finalizacion: "",
//     estado: "Programada",
//     requiere_aprobacion: 0,
//     notificar_asignacion: 1,
// };
// export const CrearActividadCalendario = () => {
//     const navigate = useNavigate();
//     const [areas, setAreas] = useState([]);
//     const [usuarios, setUsuarios] = useState([]);
//     const [archivos, setArchivos] = useState([]);
//     // const [actividadesDisponibles, setActividadesDisponibles] = useState([]);
//     const [showModalAreas, setShowModalAreas] = useState(false);



//     const [form, setForm] = useState({
//         nombre: "",
//         descripcion: "",
//         area_id: "",
//         asignado_a: "",
//         minutos_planeados: "",
//         minutos_ejecutados: "",
//         fecha_finalizacion: "",
//         estado: "Programada",
//         requiere_aprobacion: 0,
//         notificar_asignacion: 1,
//     });

//     useEffect(() => {
//         const cargarDatos = async () => {
//             try {
//                 // 1. Traemos las áreas de la API
//                 const resAreas = await api.get("/ver-areas");
//                 const listaA = resAreas.data.data || resAreas.data;
//                 setAreas(listaA);

//                 // 2. Traemos los usuarios de la API
//                 const resUsuarios = await api.get("/ver-usuarios");
//                 const listaU = resUsuarios.data.data || resUsuarios.data;
//                 setUsuarios(listaU);

//                 // 3. Sincronizamos el formulario con los datos cargados
//                 setForm(prev => {
//                     const nuevoEstado = { ...prev };

//                     // Lógica de usuarios que ya tenías
//                     if (listaU.length === 1) {
//                         nuevoEstado.asignado_a = listaU[0].id;
//                     } else if (listaU.length > 0) {
//                         nuevoEstado.asignado_a = listaU[0].id;
//                     }

//                     // 🔥 LA SOLUCIÓN EXPRESO:
//                     // Si la lista de áreas tiene exactamente 1 elemento (como le pasa a tu usuario)
//                     // la seleccionamos en el estado inmediatamente convirtiendo el ID a String.
//                     if (listaA.length === 1) {
//                         nuevoEstado.area_id = listaA[0].id.toString();
//                     } else {
//                         // Si es Administrador o Jefe con muchas áreas, sí empieza en blanco
//                         nuevoEstado.area_id = "";
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

//         setForm((prev) => ({
//             ...prev,
//             [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
//         }));

//         // Cuando cambie el área
//         if (name === "area_id") {

//             const areaSeleccionada = areas.find(
//                 (area) => area.id.toString() === value.toString()
//             );

//             if (areaSeleccionada) {

//                 // limpiar actividad seleccionada
//                 setForm((prev) => ({
//                     ...prev,
//                     area_id: value,
//                     nombre: ""
//                 }));
//             }
//         }
//     };

//     const handleFilesChange = (e) => {
//         const nuevosArchivos = Array.from(e.target.files);
//         setArchivos((prev) => [...prev, ...nuevosArchivos]);
//         e.target.value = null;
//     };



//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         // 1. Mostrar alerta de "Procesando"
//         Swal.fire({
//             title: 'Creando actividad...',
//             text: 'Estamos subiendo los archivos y registrando la información.',
//             allowOutsideClick: false,
//             didOpen: () => {
//                 Swal.showLoading();
//             }
//         });

//         try {
//             const data = new FormData();
//             for (const key in form) {
//                 if (form[key] !== undefined && form[key] !== null) {
//                     data.append(key, form[key]);
//                 }
//             }
//             archivos.forEach((file) => {
//                 data.append("archivos[]", file);
//             });

//             await api.post("/crear-actividad", data);

//             // 2. Alerta de Éxito
//             await Swal.fire({
//                 icon: 'success',
//                 title: '¡Actividad Creada!',
//                 text: 'La actividad se ha registrado correctamente.',
//                 timer: 2000,
//                 showConfirmButton: false,
//             });
//             setForm(VALOR_INICIAL_FORM);
//             setArchivos([]);
//             navigate("/actividades");

//         } catch (error) {
//             console.error(error.response?.data || error.message);

//             // 3. Alerta de Error
//             Swal.fire({
//                 icon: 'error',
//                 title: 'Ups, algo salió mal',
//                 text: error.response?.data?.message || 'No se pudo crear la actividad. Intenta de nuevo.',
//                 confirmButtonColor: '#0087cd'
//             });
//         }
//     };

//     const areaSeleccionada = areas.find(
//         (area) => String(area.id) === String(form.area_id)
//     );
//     const actividadesDisponibles = areaSeleccionada?.tipos_actividad || [];

//     const removerArchivo = (indexARemover) => {
//         setArchivos((prev) => prev.filter((_, index) => index !== indexARemover));
//     };

//     return (
//         <>

//             {/* <div className="container_crear_actividad"> */}
//             <div className="actv-form-container">
//                 <form onSubmit={handleSubmit} encType="multipart/form-data" className="actividad_form">
//                     {/* --- SECCIÓN 1: INFORMACIÓN BÁSICA --- */}
//                     <fieldset className="grid-form-container-crear">
//                         <legend className="section-legend">Crear Actividad</legend>


//                         <div className="form_group">
//                             <div >
//                                 <label className="form-label">Área responsable:</label>

//                             </div>

//                             <select
//                                 name="area_id"
//                                 className="form_select"
//                                 value={form.area_id} // Forzado por React
//                                 onChange={handleChange}
//                                 required
//                             >
//                                 {/* Deja la opción sin interactuar con atributos que confundan al navegador */}
//                                 <option value="">Seleccione un área</option>

//                                 {areas.map((area) => (
//                                     <option key={area.id} value={area.id}>
//                                         {area.nombre}
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>

//                         {/* TIPO ACTIVIDAD */}
//                         <div className="form_group">

//                             <div
//                                 style={{
//                                     display: "flex",
//                                     justifyContent: "space-between",
//                                     alignItems: "center",
//                                     marginBottom: "5px"
//                                 }}
//                             >
//                                 <label className="form-label">
//                                     Tipo de actividades:
//                                 </label>


//                             </div>

//                             <select
//                                 name="nombre"
//                                 className="form_select"
//                                 value={form.nombre}
//                                 onChange={handleChange}
//                                 required
//                             >
//                                 <option value="">
//                                     Seleccione actividad
//                                 </option>

//                                 {actividadesDisponibles.map((actividad) => (
//                                     <option
//                                         key={actividad.id}
//                                         value={actividad.nombre}
//                                     >
//                                         {actividad.nombre}
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>

//                         {/* DESCRIPCIÓN */}
//                         <div className="form_group">
//                             <label className="form-label">Descripción:</label>

//                             <textarea
//                                 name="descripcion"
//                                 className="form_textarea"
//                                 placeholder="Detalles de la tarea..."
//                                 onChange={handleChange}
//                                 value={form.descripcion}
//                             />
//                         </div>
//                         <div className="form_group">
//                             <label className="form-label">Minutos Planeados:</label>
//                             <input type="number" name="minutos_planeados" className="form_input" onChange={handleChange} value={form.minutos_planeados} required />
//                         </div>
//                         <div className="form_group">
//                             <label className="form-label">Fecha de Finalización:</label>
//                             <input type="datetime-local" name="fecha_finalizacion" className="form_input" onChange={handleChange} value={form.fecha_finalizacion} required />
//                         </div>
//                         <div className="form_group">
//                             <label className="form-label">Estado de la Actividad:</label>
//                             <select name="estado" className="form_select" value={form.estado} onChange={handleChange} required>
//                                 <option value="Programada">Programada</option>
//                                 <option value="Ejecución">En Ejecución</option>
//                                 <option value="Finalizada">Finalizada</option>
//                                 <option value="Por_corregir">Por corregir</option>
//                                 <option value="Aplazada">Aplazada</option>
//                                 <option value="Cancelada">Cancelada</option>
//                             </select>
//                         </div>
//                         <div className="form_group">
//                             <label className="form-label">Asignar a usuario:</label>
//                             {tienePermiso(["JefeInmediato", "Administrador"]) ? (
//                                 <select name="asignado_a" className="form_select" value={form.asignado_a} onChange={handleChange} required>
//                                     <option value="">Seleccione un usuario</option>
//                                     {usuarios.map((user) => (
//                                         <option key={user.id} value={user.id}>{user.nombre_completo}</option>
//                                     ))}
//                                 </select>
//                             ) : (
//                                 <div className="user-readonly-badge">
//                                     <span className="user-icon">👤</span> {usuarios[0]?.nombre_completo || "Cargando..."}
//                                     <input type="hidden" name="asignado_a" value={form.asignado_a} />
//                                 </div>
//                             )}
//                         </div>
//                         <div className="checkbox_group">
//                             {tienePermiso(["JefeInmediato", "Administrador"]) && (
//                                 <label className="checkbox_label">
//                                     <input type="checkbox" name="requiere_aprobacion" onChange={handleChange} />
//                                     <span>Requiere aprobación de un superior</span>
//                                 </label>
//                             )}
//                             <label className="checkbox_label">
//                                 <input type="checkbox" name="notificar_asignacion" defaultChecked onChange={handleChange} />
//                                 <span>Notificar al usuario por correo</span>
//                             </label>
//                         </div>
//                         <div className="file-input-wrapper">
//                             <input type="file" multiple onChange={handleFilesChange} className="form-file-input" id="file-upload" />
//                             <label htmlFor="file-upload" className="file-upload-btn">📎 Seleccionar Archivos</label>
//                             <div className="form_actions">
//                                 <button type="submit" className="btn_submit_main">Guardar Nueva Actividad</button>
//                             </div>
//                         </div>
//                         <div className="file-list">
//                             {archivos.map((file, index) => (
//                                 <div key={index} className="file-item">
//                                     <span className="file-name">📄 {file.name}</span>
//                                     <button type="button" className="btn-remove-file" onClick={() => removerArchivo(index)}>Quitar</button>
//                                 </div>
//                             ))}
//                         </div>
//                     </fieldset>
//                 </form>
//             </div>

//             {/* </div> */}
//             {/* MODAL ADMINISTRACIÓN */}
//             {showModalAreas && (
//                 <ModalAreas
//                     onClose={() => setShowModalAreas(false)}
//                     reloadAreas={async () => {

//                         const resAreas = await api.get("/ver-areas");

//                         setAreas(resAreas.data.data || []);
//                     }}
//                 />
//             )}
//         </>
//     );
// };























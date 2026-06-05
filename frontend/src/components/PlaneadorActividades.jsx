import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import "./styles/PlaneadorActividades.css";
import api from '../services/api';
import { tienePermiso } from '../utils/Permisos';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const PlaneadorActividades = () => {
    const navigate = useNavigate();
    const [areas, setAreas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        nombre: '',
        descripcion: '',
        area_id: '',
        asignado_a: '',
        minutos_planeados: '',
        fecha_inicio: '',
        fecha_fin: '',
        dias_semana: [],
        requiere_aprobacion: 0,
        notificar_asignacion: 1
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
                    if (listaU.length > 0) {
                        nuevoEstado.asignado_a = listaU[0].id;
                    }
                    if (listaA.length === 1) {
                        nuevoEstado.area_id = listaA[0].id.toString();
                    } else {
                        nuevoEstado.area_id = "";
                    }
                    return nuevoEstado;
                });
            } catch (error) {
                console.error("Error cargando datos en el planeador:", error);
            }
        };
        cargarDatos();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));

        if (name === "area_id") {
            setForm((prev) => ({
                ...prev,
                area_id: value,
                nombre: ""
            }));
        }
    };

    const handleDayChange = (dayNumber) => {
        let updatedDays = [...form.dias_semana];
        if (updatedDays.includes(dayNumber)) {
            updatedDays = updatedDays.filter(d => d !== dayNumber);
        } else {
            updatedDays.push(dayNumber);
        }
        setForm({ ...form, dias_semana: updatedDays });
    };

    const diasDeLaSemana = [
        { id: 1, nombre: 'Lunes' },
        { id: 2, nombre: 'Martes' },
        { id: 3, nombre: 'Miércoles' },
        { id: 4, nombre: 'Jueves' },
        { id: 5, nombre: 'Viernes' },
        { id: 6, nombre: 'Sábado' },
        { id: 0, nombre: 'Domingo' },
    ];

  // ... resto de tus importaciones
const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSend = {
        ...form,
        fecha_inicio: form.fecha_inicio.replace('T', ' ') + ':00',
        fecha_fin: form.fecha_fin.replace('T', ' ') + ':00'
    };

    if (form.dias_semana.length === 0) {
        Swal.fire('Error', 'Debe seleccionar al menos un día de la semana.', 'error');
        return;
    }

    // Validación extra de fechas antes de enviar
    if (new Date(form.fecha_inicio) >= new Date(form.fecha_fin)) {
        Swal.fire('Error', 'La fecha de fin debe ser posterior a la de inicio.', 'error');
        return;
    }

    Swal.fire({
        title: 'Programando actividades...',
        text: 'Validando disponibilidad y creando el ciclo.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    setLoading(true);
    try {
        // Enviar el objeto form completo
        const response = await api.post('/crear-actividades-recurrentes', dataToSend);

        Swal.fire({
            icon: 'success',
            title: '¡Ciclo Programado!',
            text: response.data.message,
            timer: 2500,
            showConfirmButton: false,
        });

        navigate("/actividades");
    } catch (error) {
        console.error("Error en la programación:", error);
        console.log("Respuesta completa del servidor:", error.response?.data);
        
        // Manejo específico del error 409
        const isConflict = error.response?.status === 409;
        const errorMessage = isConflict 
            ? error.response.data.message 
            : (error.response?.data?.message || 'Error al conectar con el servidor.');

        Swal.fire({
            icon: isConflict ? 'warning' : 'error',
            title: isConflict ? 'Conflicto de Horario' : 'Error',
            text: errorMessage,
            confirmButtonColor: '#0087cd'
        });
    } finally {
        setLoading(false);
    }
};

    const areaSeleccionada = areas.find(
        (area) => String(area.id) === String(form.area_id)
    );
    const actividadesDisponibles = areaSeleccionada?.tipos_actividad || [];

    return (
        <>
            <Navbar />
            <div className="container-planear-actividad ">
                <Sidebar />
                <div className="planner-main-content">
                    <div className="planner-header">
                        <h2>Planeador de Actividades Recurrentes</h2>
                        <p>Programa una actividad de forma masiva en un rango de fechas específico.</p>
                    </div>

                    <div className="planner-card">
                        <form onSubmit={handleSubmit} className="planner-form">
                            <div className="form-inline-group">
                                <div className="form-field">
                                    <label className="field-label">Área responsable</label>
                                    <select
                                        name="area_id"
                                        className="field-input"
                                        value={form.area_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Seleccione un área</option>
                                        {areas.map((area) => (
                                            <option key={area.id} value={area.id}>
                                                {area.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label className="field-label">Tipo de actividad</label>
                                    <select
                                        name="nombre"
                                        className="field-input"
                                        value={form.nombre}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Seleccione una actividad</option>
                                        {actividadesDisponibles.map((actividad) => (
                                            <option key={actividad.id} value={actividad.nombre}>
                                                {actividad.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label className="field-label">Minutos (por sesión)</label>
                                    <input
                                        type="number"
                                        className="field-input"
                                        name="minutos_planeados"
                                        placeholder="Ej: 90"
                                        min="0"
                                        value={form.minutos_planeados}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-field">
                                    <label className="field-label">Asignar actividades a</label>
                                    {tienePermiso(["JefeInmediato", "Administrador"]) ? (
                                        <select
                                            name="asignado_a"
                                            className="field-input"
                                            value={form.asignado_a}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Seleccione un colaborador</option>
                                            {usuarios.map((user) => (
                                                <option key={user.id} value={user.id}>{user.nombre_completo || user.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="auto-assign-badge">
                                            <span>👤</span> {usuarios[0]?.nombre_completo || "Se autoasignará a usted mismo"}
                                            <input type="hidden" name="asignado_a" value={form.asignado_a} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-full-width">
                                <label className="field-label">Descripción del planeador</label>
                                <textarea
                                    className="field-input textarea-input"
                                    name="descripcion"
                                    rows="1"
                                    placeholder="Detalles u observaciones de la actividad..."
                                    value={form.descripcion}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            <div className="form-divider" />

                            <div className="form-scheduling-group">
                                <div className="date-range-container">
                                    <div className="form-field">
                                        <label className="field-label label-highlight">Inicio del ciclo</label>
                                        <input
                                            type="datetime-local"
                                            className="field-input date-input"
                                            name="fecha_inicio"
                                            value={form.fecha_inicio}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label className="field-label label-highlight">Fin del ciclo</label>
                                        <input
                                            type="datetime-local"
                                            className="field-input date-input"
                                            name="fecha_fin"
                                            value={form.fecha_fin}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="days-selector-container">
                                    <label className="field-label">Días de la semana en que se repetirá:</label>
                                    <div className="days-checkbox-row">
                                        {diasDeLaSemana.map((dia) => (
                                            <label key={dia.id} className="day-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox-input"
                                                    checked={form.dias_semana.includes(dia.id)}
                                                    onChange={() => handleDayChange(dia.id)}
                                                />
                                                <span>{dia.nombre}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="form-footer">
                                <div className="switches-group">
                                    <label className="switch-label">
                                        <input
                                            type="checkbox"
                                            className="switch-input"
                                            name="requiere_aprobacion"
                                            checked={form.requiere_aprobacion === 1}
                                            onChange={handleChange}
                                        />
                                        <span className="switch-text">¿Requiere aprobación del jefe?</span>
                                    </label>

                                    <label className="switch-label">
                                        <input
                                            type="checkbox"
                                            className="switch-input"
                                            name="notificar_asignacion"
                                            checked={form.notificar_asignacion === 1}
                                            onChange={handleChange}
                                        />
                                        <span className="switch-text">Enviar alerta por correo</span>
                                    </label>
                                </div>

                                <div className="submit-container">
                                    <button
                                        type="submit"
                                        className="submit-btn"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="loader-container">
                                                <span className="spinner"></span>
                                                <span>Procesando...</span>
                                            </div>
                                        ) : (
                                            'Programar'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};




// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Swal from 'sweetalert2';
// import "./styles/PlaneadorActividades.css";
// import api from '../services/api';
// import { tienePermiso } from '../utils/Permisos';
// import { Navbar } from './Navbar';
// import { Sidebar } from './Sidebar';

// export const PlaneadorActividades = () => {
//     const navigate = useNavigate();
//     const [areas, setAreas] = useState([]);
//     const [usuarios, setUsuarios] = useState([]);
//     const [loading, setLoading] = useState(false);

//     // 1. Estado inicial del formulario adaptado
//     const [form, setForm] = useState({
//         nombre: '', // Guardará el tipo de actividad seleccionado
//         descripcion: '',
//         area_id: '',
//         asignado_a: '',
//         minutos_planeados: '',
//         fecha_inicio: '',
//         fecha_fin: '',
//         dias_semana: [],
//         requiere_aprobacion: 0,
//         notificar_asignacion: 1
//     });

//     // 2. Cargar áreas y usuarios al montar el componente
//     useEffect(() => {
//         const cargarDatos = async () => {
//             try {
//                 const resAreas = await api.get("/ver-areas");
//                 const listaA = resAreas.data.data || resAreas.data;
//                 setAreas(listaA);

//                 const resUsuarios = await api.get("/ver-usuarios");
//                 const listaU = resUsuarios.data.data || resUsuarios.data;
//                 setUsuarios(listaU);

//                 setForm(prev => {
//                     const nuevoEstado = { ...prev };

//                     // Sincronizar asignación inicial de colaboradores
//                     if (listaU.length > 0) {
//                         nuevoEstado.asignado_a = listaU[0].id;
//                     }

//                     // Solución Expreso para Áreas únicas
//                     if (listaA.length === 1) {
//                         nuevoEstado.area_id = listaA[0].id.toString();
//                     } else {
//                         nuevoEstado.area_id = "";
//                     }

//                     return nuevoEstado;
//                 });
//             } catch (error) {
//                 console.error("Error cargando datos en el planeador:", error);
//             }
//         };
//         cargarDatos();
//     }, []);

//     // 3. Manejar cambios en inputs básicos y checkboxes de control
//     const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;

//         setForm((prev) => ({
//             ...prev,
//             [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
//         }));

//         // Limpiar el tipo de actividad si cambia el área responsable
//         if (name === "area_id") {
//             setForm((prev) => ({
//                 ...prev,
//                 area_id: value,
//                 nombre: ""
//             }));
//         }
//     };

//     // 4. Manejar la selección/deselección de los días de la semana
//     const handleDayChange = (dayNumber) => {
//         let updatedDays = [...form.dias_semana];
//         if (updatedDays.includes(dayNumber)) {
//             updatedDays = updatedDays.filter(d => d !== dayNumber);
//         } else {
//             updatedDays.push(dayNumber);
//         }
//         setForm({ ...form, dias_semana: updatedDays });
//     };

//     const diasDeLaSemana = [
//         { id: 1, nombre: 'Lunes' },
//         { id: 2, nombre: 'Martes' },
//         { id: 3, nombre: 'Miércoles' },
//         { id: 4, nombre: 'Jueves' },
//         { id: 5, nombre: 'Viernes' },
//         { id: 6, nombre: 'Sábado' },
//         { id: 0, nombre: 'Domingo' },
//     ];

//     // 5. Envío del formulario al Backend
//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         if (form.dias_semana.length === 0) {
//             Swal.fire('Error', 'Debe seleccionar al menos un día de la semana para la recurrencia.', 'error');
//             return;
//         }

//         Swal.fire({
//             title: 'Configurando ciclo recurrente...',
//             text: 'Estamos registrando la programación masiva de actividades.',
//             allowOutsideClick: false,
//             didOpen: () => {
//                 Swal.showLoading();
//             }
//         });

//         setLoading(true);
//         try {
//             // Nota: Si tu backend requiere un FormData en vez de JSON para esta ruta, 
//             // puedes estructurarlo igual que en CrearActividades.
//             const response = await api.post('/crear-actividades-recurrentes', form);

//             await Swal.fire({
//                 icon: 'success',
//                 title: '¡Ciclo Programado!',
//                 text: response.data.message || 'El ciclo de actividades se ha registrado con éxito.',
//                 timer: 2000,
//                 showConfirmButton: false,
//             });

//             navigate("/actividades");
//         } catch (error) {
//             console.error(error);
//             Swal.fire({
//                 icon: 'error',
//                 title: 'Ups, algo salió mal',
//                 text: error.response?.data?.message || 'No se pudo procesar el planeador de actividades.',
//                 confirmButtonColor: '#0087cd'
//             });
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Filtrado en vivo de tipos de actividad según la selección del área
//     const areaSeleccionada = areas.find(
//         (area) => String(area.id) === String(form.area_id)
//     );
//     const actividadesDisponibles = areaSeleccionada?.tipos_actividad || [];

//     return (
//         <>
//             <Navbar />
//             <div className="container-planear-actividad ">
//                 <Sidebar />

//                 <div className="planner-main-content">
//                     {/* Encabezado */}
//                     <div className="planner-header">
//                         <h2>Planeador de Actividades Recurrentes</h2>
//                         <p>Programa una actividad de forma masiva en un rango de fechas específico.</p>
//                     </div>

//                     <div className="planner-card">
//                         <form onSubmit={handleSubmit} className="planner-form">

//                             {/* SECCIÓN 1: Fila de Inputs Principales */}
//                             <div className="form-inline-group">
//                                 {/* Selección de Área Responsable */}
//                                 <div className="form-field">
//                                     <label className="field-label">Área responsable</label>
//                                     <select
//                                         name="area_id"
//                                         className="field-input"
//                                         value={form.area_id}
//                                         onChange={handleChange}
//                                         required
//                                     >
//                                         <option value="">Seleccione un área</option>
//                                         {areas.map((area) => (
//                                             <option key={area.id} value={area.id}>
//                                                 {area.nombre}
//                                             </option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 {/* Selección de Tipo de Actividad */}
//                                 <div className="form-field">
//                                     <label className="field-label">Tipo de actividad</label>
//                                     <select
//                                         name="nombre"
//                                         className="field-input"
//                                         value={form.nombre}
//                                         onChange={handleChange}
//                                         required
//                                     >
//                                         <option value="">Seleccione una actividad</option>
//                                         {actividadesDisponibles.map((actividad) => (
//                                             <option key={actividad.id} value={actividad.nombre}>
//                                                 {actividad.nombre}
//                                             </option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 {/* Minutos Planeados */}
//                                 <div className="form-field">
//                                     <label className="field-label">Minutos (por sesión)</label>
//                                     <input
//                                         type="number"
//                                         className="field-input"
//                                         name="minutos_planeados"
//                                         placeholder="Ej: 90"
//                                         min="0"
//                                         value={form.minutos_planeados}
//                                         onChange={handleChange}
//                                         required
//                                     />
//                                 </div>

//                                 {/* Asignación de Usuario */}
//                                 <div className="form-field">
//                                     <label className="field-label">Asignar actividades a</label>
//                                     {tienePermiso(["JefeInmediato", "Administrador"]) ? (
//                                         <select
//                                             name="asignado_a"
//                                             className="field-input"
//                                             value={form.asignado_a}
//                                             onChange={handleChange}
//                                             required
//                                         >
//                                             <option value="">Seleccione un colaborador</option>
//                                             {usuarios.map((user) => (
//                                                 <option key={user.id} value={user.id}>{user.nombre_completo || user.name}</option>
//                                             ))}
//                                         </select>
//                                     ) : (
//                                         <div className="auto-assign-badge">
//                                             <span>👤</span> {usuarios[0]?.nombre_completo || "Se autoasignará a usted mismo"}
//                                             <input type="hidden" name="asignado_a" value={form.asignado_a} />
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>

//                             {/* Descripción (Ocupa el ancho completo pero de poca altura) */}
//                             <div className="form-full-width">
//                                 <label className="field-label">Descripción del planeador</label>
//                                 <textarea
//                                     className="field-input textarea-input"
//                                     name="descripcion"
//                                     rows="1"
//                                     placeholder="Detalles u observaciones de la actividad..."
//                                     value={form.descripcion}
//                                     onChange={handleChange}
//                                 ></textarea>
//                             </div>

//                             <div className="form-divider" />

//                             {/* SECCIÓN 2: Tiempos y Repetición en paralelo */}
//                             <div className="form-scheduling-group">
//                                 {/* Rango de Fechas */}
//                                 <div className="date-range-container">
//                                     <div className="form-field">
//                                         <label className="field-label label-highlight">Inicio del ciclo</label>
//                                         <input
//                                             type="datetime-local" // Cambiado de "date" a "datetime-local"
//                                             className="field-input date-input"
//                                             name="fecha_inicio"
//                                             value={form.fecha_inicio}
//                                             onChange={handleChange}
//                                             required
//                                         />
//                                     </div>
//                                     <div className="form-field">
//                                         <label className="field-label label-highlight">Fin del ciclo</label>
//                                         <input
//                                             type="datetime-local" // Cambiado de "date" a "datetime-local"
//                                             className="field-input date-input"
//                                             name="fecha_fin"
//                                             value={form.fecha_fin}
//                                             onChange={handleChange}
//                                             required
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Checkboxes de los días */}
//                                 <div className="days-selector-container">
//                                     <label className="field-label">Días de la semana en que se repetirá:</label>
//                                     <div className="days-checkbox-row">
//                                         {diasDeLaSemana.map((dia) => (
//                                             <label key={dia.id} className="day-checkbox-label">
//                                                 <input
//                                                     type="checkbox"
//                                                     className="checkbox-input"
//                                                     checked={form.dias_semana.includes(dia.id)}
//                                                     onChange={() => handleDayChange(dia.id)}
//                                                 />
//                                                 <span>{dia.nombre}</span>
//                                             </label>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </div>

//                             {/* SECCIÓN 3: Footer de Ajustes y Envío */}
//                             <div className="form-footer">
//                                 <div className="switches-group">
//                                     <label className="switch-label">
//                                         <input
//                                             type="checkbox"
//                                             className="switch-input"
//                                             name="requiere_aprobacion"
//                                             checked={form.requiere_aprobacion === 1}
//                                             onChange={handleChange}
//                                         />
//                                         <span className="switch-text">¿Requiere aprobación del jefe?</span>
//                                     </label>

//                                     <label className="switch-label">
//                                         <input
//                                             type="checkbox"
//                                             className="switch-input"
//                                             name="notificar_asignacion"
//                                             checked={form.notificar_asignacion === 1}
//                                             onChange={handleChange}
//                                         />
//                                         <span className="switch-text">Enviar alerta por correo</span>
//                                     </label>
//                                 </div>

//                                 <div className="submit-container">
//                                     <button
//                                         type="submit"
//                                         className="submit-btn"
//                                         disabled={loading}
//                                     >
//                                         {loading ? (
//                                             <div className="loader-container">
//                                                 <span className="spinner"></span>
//                                                 <span>Procesando...</span>
//                                             </div>
//                                         ) : (
//                                             'Programar'
//                                         )}
//                                     </button>
//                                 </div>
//                             </div>

//                         </form>
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// };
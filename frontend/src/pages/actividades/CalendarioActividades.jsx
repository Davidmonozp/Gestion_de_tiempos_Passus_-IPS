import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./styles/CalendarioActividades.css";

import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import { LabelList } from "recharts";
import { AlignJustify, Joystick } from "lucide-react";
import { CrearActividadCalendario } from "../../components/CrearActividadCalendario";
import { useAuth } from "../../context/AuthContext";

const CalendarioActividades = ({ actividades }) => {
    const navigate = useNavigate();
    const { obtenerResumenJornada, jornadaActiva } = useAuth();
    const [resumenDia, setResumenDia] = useState(null);
    const { tiempoTranscurrido } = useAuth();

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

    useEffect(() => {
        if (jornadaActiva) {
            obtenerResumenJornada().then((data) => {
                if (data) setResumenDia(data);
            });
        }
    }, [jornadaActiva, obtenerResumenJornada]);

    const { eventos, leyendaAreas } = useMemo(() => {
        const coloresVistos = new Map();

        const evs = actividades.map((act) => {
            const nombreArea = act.area?.nombre || "Sin área";
            const colorFinal = act.area?.color || "#95a5a6";

            // ✅ Extraemos el nombre del usuario asignado
            const nombreAsignado =
                act.asignado_a?.name || act.asignado_a?.nombre || "No asignado";

            if (!coloresVistos.has(nombreArea)) {
                coloresVistos.set(nombreArea, colorFinal);
            }

            return {
                id: act.id,
                title: act.nombre,
                start: act.fecha_finalizacion,
                backgroundColor: colorFinal,
                borderColor: colorFinal,
                extendedProps: {
                    descripcion: act.descripcion || "Sin descripción",
                    estado: act.estado || "N/A",
                    areaNombre: nombreArea,
                    // ✅ Pasamos el nombre procesado a las propiedades extendidas
                    asignadoNombre: nombreAsignado,
                },
            };
        });

        return {
            eventos: evs,
            leyendaAreas: Array.from(coloresVistos.entries()),
        };
    }, [actividades]);

    const handleEventDidMount = (info) => {
        // ✅ Extraemos asignadoNombre de las extendedProps
        const { descripcion, estado, areaNombre, asignadoNombre } =
            info.event.extendedProps;

        tippy(info.el, {
            content: `
                <div style="text-align: left; padding: 5px; color: white;">
                    <strong style="font-size: 14px;">${info.event.title}</strong><br/>
                    <div style="margin-top: 5px;">
                        <small><strong>Área:</strong> ${areaNombre}</small><br/>
                        <small><strong>Estado:</strong> ${estado}</small><br/>
                        <small><strong>Asignado a:</strong> ${asignadoNombre}</small>
                    </div>
                    <hr style="margin: 8px 0; border: 0; border-top: 1px solid #555;"/>
                    <p style="margin: 0; font-size: 12px; color: #ccc;">${descripcion}</p>
                </div>
            `,
            allowHTML: true,
            placement: "top",
            interactive: true,
            appendTo: () => document.body,
            zIndex: 9999,
            offset: [0, 10],
        });
    };

    const handleEventClick = (info) => {
        navigate(`/ver-actividad/${info.event.id}`);
    };


    return (
        <div className="calendar-container">
            <div className="calendar-legend">
                {leyendaAreas.map(([nombre, color]) => (
                    <div key={nombre} className="legend-item">
                        <div className="legend-color-dot" style={{ background: color }} />
                        <span className="legend-text">{nombre}</span>
                    </div>
                ))}
            </div>

            <div className="main-layout-container">
                <div className="calendar-wrapper">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale="es"
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,timeGridDay",
                        }}
                        buttonText={{
                            today: "Hoy",
                            month: "Mes",
                            week: "Semana",
                            day: "Día",
                        }}
                        events={eventos}
                        eventClick={handleEventClick}
                        eventDidMount={handleEventDidMount}
                        height="400px"
                        aspectRatio={1.8}
                        dayMaxEvents={true}
                        eventMouseEnter={(info) => {
                            info.el.style.cursor = "pointer";
                        }}
                    />
                </div>
                <div className="main-indicadores">
                    <div className="indicadores">
                        <h3>Resumen del día</h3>
                        {resumenDia ? (
                            <div className="resumen-detalle">
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
                                    <div key={act.id} className="actividad-item-mini">
                                        <span className="actividad-nombre">{act.nombre}</span>
                                        <span className="actividad-estado">{act.estado}</span>
                                    </div>
                                ))
                            ) : (
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No hay actividades programadas.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="container-creacion">
                <div className="crear-actividad">
                    <CrearActividadCalendario />
                </div>
                <div className="planner-dashboard-card">
                    <div className="planner-content">
                        <div className="planner-text">
                            <h3>Planeador de Actividades </h3>
                            <span className="highlight">Crea actividades <br /> recurrentes fácilmente</span>
                        </div>

                        <Link to="/crear-actividades-recurrentes">
                            <button className="btn-open-planner">
                                Abrir planeador
                            </button>
                        </Link>
                    </div>

                    {/* Ilustración de fondo */}
                    <div className="bg-illustration-container">
                        <i className="fas fa-calendar-days"></i>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CalendarioActividades;





























// import React, { useEffect, useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import interactionPlugin from "@fullcalendar/interaction";
// import "./styles/CalendarioActividades.css";

// import tippy from "tippy.js";
// import "tippy.js/dist/tippy.css";
// import { LabelList } from "recharts";
// import { AlignJustify, Joystick } from "lucide-react";
// import { CrearActividadCalendario } from "../../components/CrearActividadCalendario";
// import { useAuth } from "../../context/AuthContext";

// const CalendarioActividades = ({ actividades }) => {
//     const navigate = useNavigate();
//     const { obtenerResumenJornada, jornadaActiva } = useAuth();
//     const [resumenDia, setResumenDia] = useState(null);
//     const { tiempoTranscurrido } = useAuth();

//     const minutosProgramados = useMemo(() => {
//         // 1. Esto siempre toma la fecha de HOY en formato YYYY-MM-DD
//         const hoy = new Date().toISOString().split('T')[0];

//         return actividades.reduce((total, act) => {
//             // 2. Priorizamos 'fecha_inicio' o 'created_at'
//             const fechaRaw = act.fecha_inicio || act.created_at;

//             // 3. Limpiamos la fecha de la actividad para que sea igual a 'hoy'
//             // Usamos .split(' ')[0] porque tus datos vienen como "YYYY-MM-DD HH:mm:ss"
//             const fechaActividad = fechaRaw ? fechaRaw.toString().split(' ')[0] : null;

//             // 4. Comparación directa: "2026-06-02" === "2026-06-02"
//             if (fechaActividad === hoy) {
//                 const mins = parseInt(act.minutos_planeados) || 0;
//                 return total + mins;
//             }

//             return total;
//         }, 0);
//     }, [actividades]);

//     // 2. Asegúrate de tener esta función auxiliar definida ANTES del return
//     const formatoTiempo = (mins) => {
//         const h = Math.floor(mins / 60);
//         const m = mins % 60;
//         return `${h}h ${m}m`;
//     };

//     const actividadesProgramadas = useMemo(() => {
//         return actividades
//             .filter(act => act.estado && act.estado.toLowerCase() === 'programada')
//             .sort((a, b) => new Date(b.fecha_inicio || b.created_at) - new Date(a.fecha_inicio || a.created_at))
//             .slice(0, 2);
//     }, [actividades]);

//     useEffect(() => {
//         if (jornadaActiva) {
//             obtenerResumenJornada().then((data) => {
//                 if (data) setResumenDia(data);
//             });
//         }
//     }, [jornadaActiva, obtenerResumenJornada]);

//     const { eventos, leyendaAreas } = useMemo(() => {
//         const coloresVistos = new Map();

//         const evs = actividades.map((act) => {
//             const nombreArea = act.area?.nombre || "Sin área";
//             const colorFinal = act.area?.color || "#95a5a6";

//             // ✅ Extraemos el nombre del usuario asignado
//             const nombreAsignado =
//                 act.asignado_a?.name || act.asignado_a?.nombre || "No asignado";

//             if (!coloresVistos.has(nombreArea)) {
//                 coloresVistos.set(nombreArea, colorFinal);
//             }

//             return {
//                 id: act.id,
//                 title: act.nombre,
//                 start: act.fecha_finalizacion,
//                 backgroundColor: colorFinal,
//                 borderColor: colorFinal,
//                 extendedProps: {
//                     descripcion: act.descripcion || "Sin descripción",
//                     estado: act.estado || "N/A",
//                     areaNombre: nombreArea,
//                     // ✅ Pasamos el nombre procesado a las propiedades extendidas
//                     asignadoNombre: nombreAsignado,
//                 },
//             };
//         });

//         return {
//             eventos: evs,
//             leyendaAreas: Array.from(coloresVistos.entries()),
//         };
//     }, [actividades]);

//     const handleEventDidMount = (info) => {
//         // ✅ Extraemos asignadoNombre de las extendedProps
//         const { descripcion, estado, areaNombre, asignadoNombre } =
//             info.event.extendedProps;

//         tippy(info.el, {
//             content: `
//                 <div style="text-align: left; padding: 5px; color: white;">
//                     <strong style="font-size: 14px;">${info.event.title}</strong><br/>
//                     <div style="margin-top: 5px;">
//                         <small><strong>Área:</strong> ${areaNombre}</small><br/>
//                         <small><strong>Estado:</strong> ${estado}</small><br/>
//                         <small><strong>Asignado a:</strong> ${asignadoNombre}</small>
//                     </div>
//                     <hr style="margin: 8px 0; border: 0; border-top: 1px solid #555;"/>
//                     <p style="margin: 0; font-size: 12px; color: #ccc;">${descripcion}</p>
//                 </div>
//             `,
//             allowHTML: true,
//             placement: "top",
//             interactive: true,
//             appendTo: () => document.body,
//             zIndex: 9999,
//             offset: [0, 10],
//         });
//     };

//     const handleEventClick = (info) => {
//         navigate(`/ver-actividad/${info.event.id}`);
//     };

//     return (
//         <div className="calendar-container">
//             <div className="calendar-legend">
//                 {leyendaAreas.map(([nombre, color]) => (
//                     <div key={nombre} className="legend-item">
//                         <div className="legend-color-dot" style={{ background: color }} />
//                         <span className="legend-text">{nombre}</span>
//                     </div>
//                 ))}
//             </div>

//             <div className="main-layout-container">
//                 <div className="calendar-wrapper">
//                     <FullCalendar
//                         plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
//                         initialView="dayGridMonth"
//                         locale="es"
//                         headerToolbar={{
//                             left: "prev,next today",
//                             center: "title",
//                             right: "dayGridMonth,timeGridWeek,timeGridDay",
//                         }}
//                         buttonText={{
//                             today: "Hoy",
//                             month: "Mes",
//                             week: "Semana",
//                             day: "Día",
//                         }}
//                         events={eventos}
//                         eventClick={handleEventClick}
//                         eventDidMount={handleEventDidMount}
//                         height="400px"
//                         aspectRatio={1.8}
//                         dayMaxEvents={true}
//                         eventMouseEnter={(info) => {
//                             info.el.style.cursor = "pointer";
//                         }}
//                     />
//                 </div>
//                 <div className="main-indicadores">
//                     <div className="indicadores">
//                         <h3>Resumen del día</h3>
//                         {resumenDia ? (
//                             <div className="resumen-detalle">
//                                 <p>⏱️ Tiempo trabajado <b>{tiempoTranscurrido}</b></p>
//                                 <p>📅 Tiempo programado <b>{formatoTiempo(minutosProgramados)}</b></p>
//                                 <p>📋 Tiempo ejecutado <b>{resumenDia.tiempo_actividades}</b></p>
//                                 <p className={`resumen-diferencia ${resumenDia.diferencia_minutos > 0 ? 'text-danger' : 'text-success'}`}>
//                                     Diferencia: <b>{resumenDia.diferencia_minutos} minutos</b>
//                                 </p>
//                             </div>
//                         ) : (
//                             <p className="cargando-resumen">Turno no iniciado</p>
//                         )}
//                     </div>
//                     <div className="indicadores-2">
//                         <h3>Próximas Programadas</h3>
//                         <div className="lista-actividades-mini">
//                             {actividadesProgramadas.length > 0 ? (
//                                 actividadesProgramadas.map((act) => (
//                                     <div key={act.id} className="actividad-item-mini">
//                                         <span className="actividad-nombre">{act.nombre}</span>
//                                         <span className="actividad-estado">{act.estado}</span>
//                                     </div>
//                                 ))
//                             ) : (
//                                 <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No hay actividades programadas.</p>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//             <div className="container-creacion">
//                 <div className="crear-actividad">
//                     <CrearActividadCalendario />
//                 </div>
//                 <div className="planner-dashboard-card">
//                     <div className="planner-content">
//                         <div className="planner-text">
//                             <h3>Planeador de Actividades </h3>
//                             <span className="highlight">Crea actividades <br /> recurrentes fácilmente</span>
//                         </div>

//                         <Link to="/crear-actividades-recurrentes">
//                             <button className="btn-open-planner">
//                                 Abrir planeador
//                             </button>
//                         </Link>
//                     </div>

//                     {/* Ilustración de fondo */}
//                     <div className="bg-illustration-container">
//                         <i className="fas fa-calendar-days"></i>
//                     </div>
//                 </div>

//             </div>
//         </div>
//     );
// };

// export default CalendarioActividades;





















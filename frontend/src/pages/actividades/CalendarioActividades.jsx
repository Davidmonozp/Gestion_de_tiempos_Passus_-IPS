import React, { useMemo } from 'react'; // Añadimos useMemo por rendimiento
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import "./styles/CalendarioActividades.css";

import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'; 

const CalendarioActividades = ({ actividades }) => {
    const navigate = useNavigate();

    // 1. Procesamos los eventos y extraemos las áreas únicas para la leyenda
    // Usamos useMemo para que esto solo se recalcule si "actividades" cambia
    const { eventos, leyendaAreas } = useMemo(() => {
        const coloresVistos = new Map(); // Para la leyenda dinámica

        const evs = actividades.map(act => {
            const nombreArea = act.area?.nombre || 'Sin área';
            const colorFinal = act.area?.color || '#95a5a6'; // Color de la DB o gris

            // Guardamos el color para la leyenda si no lo tenemos
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
                    descripcion: act.descripcion || 'Sin descripción',
                    estado: act.estado || 'N/A',
                    areaNombre: nombreArea
                }
            };
        });

        return { 
            eventos: evs, 
            leyendaAreas: Array.from(coloresVistos.entries()) 
        };
    }, [actividades]);

    const handleEventDidMount = (info) => {
        const { descripcion, estado, areaNombre } = info.event.extendedProps;
        
        tippy(info.el, {
            content: `
                <div style="text-align: left; padding: 5px; color: white;">
                    <strong>${info.event.title}</strong><br/>
                    <small>Área: ${areaNombre}</small><br/>
                    <small>Estado: ${estado}</small><hr style="margin: 5px 0; border: 0; border-top: 1px solid #555;"/>
                    <p style="margin: 0; font-size: 12px;">${descripcion}</p>
                </div>
            `,
            allowHTML: true,
            placement: 'top',
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
            
            {/* 2. Leyenda Dinámica: Ahora usa los colores reales de tu DB */}
            <div className="calendar-legend">
                {leyendaAreas.map(([nombre, color]) => (
                    <div key={nombre} className="legend-item">
                        <div 
                            className="legend-color-dot" 
                            style={{ background: color }} 
                        />
                        <span className="legend-text">{nombre}</span>
                    </div>
                ))}
            </div>

            <div className="calendar-wrapper">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale="es"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    buttonText={{
                        today: 'Hoy',
                        month: 'Mes',
                        week: 'Semana',
                        day: 'Día'
                    }}
                    events={eventos} // Usamos los eventos procesados
                    eventClick={handleEventClick}
                    eventDidMount={handleEventDidMount} 
                    height="700px"
                    aspectRatio={1.5}
                    dayMaxEvents={true}
                    eventMouseEnter={(info) => {
                        info.el.style.cursor = 'pointer';
                    }}
                />
            </div>
        </div>
    );
};

export default CalendarioActividades;











// import React, { useState, useEffect } from 'react';
// import FullCalendar from '@fullcalendar/react';
// import dayGridPlugin from '@fullcalendar/daygrid';
// import interactionPlugin from '@fullcalendar/interaction';
// import './styles/Calendario.css'; 
// import api from '../../services/api';

// const CalendarioActividades = () => {
//     const [actividades, setActividades] = useState([]);
//     const [loading, setLoading] = useState(true);

//     // 1. Carga de datos desde la API
//     useEffect(() => {
//         const cargarDatos = async () => {
//             try {
//                 // Traemos una cantidad alta de registros para que el calendario se vea lleno
//                 const response = await api.get('/ver-actividades?per_page=100');
//                 setActividades(response.data.data);
//             } catch (error) {
//                 console.error("Error al cargar el calendario", error);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         cargarDatos();
//     }, []);

//     // 2. Transformación de datos para FullCalendar
//     const eventos = actividades.map(act => ({
//         id: act.id,
//         title: act.nombre,
//         start: act.fecha_finalizacion, // Ajusta según tu campo de fecha en Laravel
//         backgroundColor: act.area?.color || '#3498db',
//         borderColor: act.area?.color || '#3498db',
//         extendedProps: {
//             descripcion: act.descripcion,
//             estado: act.estado,
//             asignado_por: act.asignado_por?.nombre || 'N/A'
//         }
//     }));

//     // 3. Manejador de clics
//     const handleEventClick = (info) => {
//         alert(
//             `Actividad: ${info.event.title}\n` +
//             `Estado: ${info.event.extendedProps.estado}\n` +
//             `Descripción: ${info.event.extendedProps.descripcion}`
//         );
//     };

//     return (
//         <div className="calendario-layout" style={{ padding: '20px' }}>
//             <header className="page-header" style={{ marginBottom: '20px' }}>
//                 <h2 style={{ color: '#2c3e50' }}>📅 Cronograma de Trabajo</h2>
//             </header>
            
//             {loading ? (
//                 <div className="spinner" style={{ textAlign: 'center', padding: '50px' }}>
//                     Cargando actividades...
//                 </div>
//             ) : (
//                 <div className="calendar-card" style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
//                     <FullCalendar
//                         plugins={[dayGridPlugin, interactionPlugin]}
//                         initialView="dayGridMonth"
//                         locale="es"
//                         events={eventos}
//                         eventClick={handleEventClick}
//                         headerToolbar={{
//                             left: 'prev,next today',
//                             center: 'title',
//                             right: 'dayGridMonth,dayGridWeek'
//                         }}
//                         buttonText={{
//                             today: 'Hoy',
//                             month: 'Mes',
//                             week: 'Semana'
//                         }}
//                         height="auto"
//                     />
//                 </div>
//             )}
//         </div>
//     );
// };

// export default CalendarioActividades;
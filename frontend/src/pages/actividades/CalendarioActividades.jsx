import React from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import "./styles/CalendarioActividades.css";

// Importamos Tippy y sus estilos
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'; 

const CalendarioActividades = ({ actividades }) => {
    const navigate = useNavigate();

    const COLORES_AREAS = {
        'Gestión Del Riesgo - Operaciones Misionales': '#3498db', 
        'Desarrollo': '#9b59b6',     
        'Administración': '#27ae60',   
        'Contabilidad': '#f1c40f',     
        'Automatización Y Desarrollo Tecnológico': '#e74c3c',        
        'Default': '#95a5a6'           
    };

    const eventos = actividades.map(act => {
        const colorAsignado = COLORES_AREAS[act.area?.nombre] || act.area?.color || COLORES_AREAS['Default'];
        
        return {
            id: act.id,
            title: act.nombre,
            start: act.fecha_finalizacion, 
            backgroundColor: colorAsignado,
            borderColor: colorAsignado,
            extendedProps: {
                // Asegúrate de que estos nombres coincidan con tu API
                descripcion: act.descripcion || 'Sin descripción',
                estado: act.estado || 'N/A',
                areaNombre: act.area?.nombre || 'Sin área'
            }
        };
    });

    // Función para renderizar el Tooltip
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
        // ESTO SOLUCIONA EL CORTE:
        appendTo: () => document.body, 
        zIndex: 9999,
        // Opcional: añade un poco de separación para que no pegue al borde
        offset: [0, 10], 
    });
};

    const handleEventClick = (info) => {      
        navigate(`/ver-actividad/${info.event.id}`);
    };

   return (
    <div className="calendar-container">
        
        {/* Leyenda de colores */}
        <div className="calendar-legend">
            {Object.entries(COLORES_AREAS).map(([nombre, color]) => (
                <div key={nombre} className="legend-item">
                    <div 
                        className="legend-color-dot" 
                        style={{ background: color }} // El color sí debe ser dinámico
                    />
                    <span className="legend-text">{nombre}</span>
                </div>
            ))}
        </div>

        {/* El Calendario */}
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
                events={eventos}
                eventClick={handleEventClick}
                eventDidMount={handleEventDidMount} 
                height="700px"
                eventMouseEnter={(info) => {
                    info.el.style.cursor = 'pointer';
                }}
                slotLabelFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    omitZeroMinute: false,
                    meridiem: 'short'
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
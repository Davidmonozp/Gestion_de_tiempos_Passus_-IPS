import React from 'react';
import "./styles/VerSoluciones.css";
import { AprobarAplazamiento } from './AprobarAplazamiento';
import { tienePermiso } from '../../utils/Permisos';

export const VerSoluciones = ({ evidencias = [], revisiones = [], solicitudes = [], actividad, BASE_URL, onUpdate }) => {

    // 1. Unificar y ordenar cronológicamente por fecha de creación
    const historial = [
        ...evidencias.map(ev => ({ ...ev, tipoItem: 'solucion' })),
        ...revisiones.map(rev => ({ ...rev, tipoItem: 'revision' })),
        ...solicitudes.map(sol => ({ ...sol, tipoItem: 'solicitud' }))
    ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (historial.length === 0) return null;

    // Variable para llevar el conteo del tiempo extra conforme recorremos el historial
    let acumuladorExtraGlobal = 0;

    let contadorSoluciones = 0;

    return (

        <div className="soluciones-container">
            <h3 className="soluciones-main-title">🚀 Seguimiento de Actividad</h3>
            <hr />

            <div className="soluciones-list">
                {historial.map((item, index) => {

                    if (item.tipoItem === 'solucion') {
                        contadorSoluciones++;
                    }

                    if (item.tipoItem === 'solucion') {
                        // Sumamos el extra de ESTA solución al acumulador global
                        acumuladorExtraGlobal += (Number(item.minutos_extra) || 0);

                        // Lógica de desfase inicial (solo para la visualización del total)
                        const desfaseInicial = Math.max(
                            0,
                            (actividad?.minutos_ejecutados || 0) - (actividad?.minutos_planeados || 0)
                        );

                        // El Tiempo Extra Total Actividad en este punto es: Desfase + lo acumulado hasta ahora
                        const tiempoExtraTotalEnEstePunto = desfaseInicial + acumuladorExtraGlobal;

                        return (
                            <div key={`sol-${item.id}`} className="solucion-item-card">
                                <div className="solucion-header">
                                    {/* ✅ Recuperamos el número consecutivo como lo tenías antes */}
                                    <span className="solucion-number">Solución #{contadorSoluciones}</span>
                                    <span className="solucion-fecha">
                                        {new Date(item.created_at).toLocaleString()}
                                    </span>
                                </div>

                                <div className="solucion-body">
                                    <div className="solucion-text-display">
                                        {item.descripcion}
                                    </div>

                                    <div className="solucion-tiempos-container">
                                        <div className="solucion-grid-tiempos">

                                            <div className="solucion-field-group">
                                                <label className="solucion-label-view">Tiempo Planeado</label>
                                                <div className="solucion-input-readonly ejecutado-style">
                                                    <span className="icon">📋</span>
                                                    <span className="value">{actividad?.minutos_planeados || 0} min</span>
                                                </div>
                                            </div>

                                            <div className="solucion-field-group">
                                                <label className="solucion-label-view">Tiempo Ejecutado Inicial</label>
                                                <div className="solucion-input-readonly ejecutado-style">
                                                    <span className="icon">⏱️</span>
                                                    <span className="value">{actividad?.minutos_ejecutados || 0} min</span>
                                                </div>
                                            </div>

                                            <div className="solucion-field-group">
                                                <label className="solucion-label-view">Adición en esta Solución</label>
                                                <div className="solucion-input-readonly extra-individual-style">
                                                    <span className="icon">🚀</span>
                                                    <span className="value">+{item.minutos_extra || 0} min</span>
                                                </div>
                                            </div>

                                            {/* AHORA SÍ: Tiempo Extra Total Acumulado en la Actividad hasta esta fecha */}
                                            <div className="solucion-field-group">
                                                <label className="solucion-label-view">Tiempo Extra Total Actividad</label>
                                                <div className={`solucion-input-readonly extra-total-style ${tiempoExtraTotalEnEstePunto > 0 ? 'text-danger-custom' : ''}`}>
                                                    <span className="icon">{tiempoExtraTotalEnEstePunto > 0 ? '⚠️' : '📊'}</span>
                                                    <span className="value">
                                                        {tiempoExtraTotalEnEstePunto} min totales
                                                    </span>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                                <div className="solucion-footer">
                                    {item.archivo_path ? (
                                        <div className="solucion-archivo-box">
                                            {/* href usa la URL generada por el Accessor */}
                                            <a href={item.url} target="_blank" rel="noreferrer" className="btn-descarga-evidencia">
                                                📄 {item.nombre_original || "Ver Archivo"}
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="solucion-no-archivo">
                                            <small>🚫 Sin adjunto</small>
                                        </div>
                                    )}
                                    <div className="solucion-user-tag">
                                        👤 Por: <strong>{item.user?.nombre} {item.user?.apellido}</strong>
                                    </div>
                                </div>
                            </div>
                        );
                    }


                    if (item.tipoItem === 'solicitud') {
                        // 1. Definimos si el usuario tiene permiso para GESTIONAR
                        const puedeGestionar = tienePermiso(['JefeInmediato', 'Administrador']) && actividad.estado === 'Espera_aprobacion';

                        return (
                            <AprobarAplazamiento
                                key={`solic-${item.id}`}
                                solicitud={item}
                                onUpdate={onUpdate}
                                // Pasamos una prop extra para decirle al componente si debe permitir editar o no
                                puedeGestionar={puedeGestionar}
                            />
                        );
                    }

                    // --- DISEÑO PARA REVISIÓN (Jefe) ---
                    return (
                        <div key={`rev-${item.id}`} className={`revision-item ${item.estado_aplicado === 'Aprobado' ? 'aprobado' : 'devuelto'}`}>
                            <div className="revision-header">
                                <div className="usuario-info">
                                    <span className="icon-user">👤</span>
                                    <span className="nombre-jefe">{item.usuario?.nombre} {item.usuario?.apellido}</span>
                                </div>
                                <span className={`badge-estado ${item.estado_aplicado === 'Aprobado' ? 'bg-success-soft' : 'bg-danger-soft'}`}>
                                    {item.estado_aplicado}
                                </span>
                            </div>
                            <div className="revision-body">
                                <p className="observacion-texto">{item.observacion}</p>
                            </div>
                            {item.archivos_revision?.length > 0 && (
                                <div className="revision-adjuntos">
                                    <div className="adjuntos-lista">
                                        {item.archivos_revision.map((file, i) => {
                                            const isNewFile = file instanceof File;

                                            // 1. Intentar obtener la URL
                                            const fileUrl = isNewFile
                                                ? URL.createObjectURL(file)
                                                : (file.url || (file.path ? `${BASE_URL}/storage/${file.path}` : "#"));

                                            // 2. Intentar obtener el nombre (Busca en todas las posibilidades de Laravel)
                                            // Agregamos 'nombre_archivo', 'archivo', y 'original_name'
                                            const fileName = isNewFile
                                                ? file.name
                                                : (file.nombre_original || file.original_name || file.nombre_archivo || file.name || file.archivo || "Ver adjunto");

                                            return (
                                                <a
                                                    key={`file-rev-${item.id}-${i}`}
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="btn-adjunto-rev"
                                                    title={fileName}
                                                >
                                                    {isNewFile ? '🆕' : '📎'} {fileName}
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div className="revision-footer">
                                <span className="fecha-rev">{new Date(item.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};












// import React, { useEffect, useState } from 'react';
// import "./styles/VerSoluciones.css";
// import api from '../../services/api';

// export const VerSoluciones = ({ actividadId }) => {
//     const [evidencias, setEvidencias] = useState([]);
//     const [loading, setLoading] = useState(true);

//     // ✅ Definimos la BASE_URL igual que en VerActividad
//     const BASE_URL = api.defaults.baseURL.replace(/\/api$/, "");

//     useEffect(() => {
//         const fetchSoluciones = async () => {
//             try {
//                 const res = await api.get(`/actividad/${actividadId}/soluciones`);
//                 if (res.data.success) {
//                     // ✅ Usamos 'soluciones' que es lo que manda tu API
//                     setEvidencias(res.data.soluciones);
//                 }
//             } catch (error) {
//                 console.error("Error al cargar soluciones:", error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (actividadId) fetchSoluciones();
//     }, [actividadId]);

//     if (loading) return <div className="soluciones-loading">Cargando soluciones...</div>;

//     if (!evidencias || evidencias.length === 0) {
//         return (
//             <div className="soluciones-empty">
//                 <p>No se han registrado soluciones o evidencias para esta actividad.</p>
//             </div>
//         );
//     }

//     return (
//         <div className="soluciones-container">
//             <h3 className="soluciones-main-title">🚀 Soluciones y Evidencias</h3>

//             <div className="soluciones-list">


//                 {evidencias.map((ev, index) => {
//                     const numeroConsecutivo = evidencias.length - index;
//                     const esPrimera = numeroConsecutivo === 1; // La primera que se creó históricamente
//                     const esUltima = index === 0; // La más reciente (la última registrada)

//                     // --- Lógica de Cálculo Visual ---
//                     const desfaseInicial = Math.max(
//                         0,
//                         (ev.actividad?.minutos_ejecutados || 0) - (ev.actividad?.minutos_planeados || 0)
//                     );
//                     const totalVisualExtra = desfaseInicial + (ev.actividad?.minutos_extra || 0);

//                     return (
//                         <div key={ev.id} className="solucion-item-card">
//                             <div className="solucion-header">
//                                 <span className="solucion-number">Solución #{numeroConsecutivo}</span>
//                                 <span className="solucion-fecha">
//                                     📅 {new Date(ev.created_at).toLocaleDateString()}
//                                 </span>
//                             </div>

//                             <div className="solucion-body">
//                                 <div className="solucion-text-display">
//                                     {ev.descripcion}
//                                 </div>

//                                 <div className="solucion-tiempos-container">
//                                     <div className="solucion-grid-tiempos">

//                                         {/* Siempre mostramos Planeado y Ejecutado Inicial para referencia */}
//                                         <div className="solucion-field-group">
//                                             <label className="solucion-label-view">Tiempo Planeado</label>
//                                             <div className="solucion-input-readonly ejecutado-style">
//                                                 <span className="icon">📋</span>
//                                                 <span className="value">{ev.actividad?.minutos_planeados || 0} min</span>
//                                             </div>
//                                         </div>

//                                         <div className="solucion-field-group">
//                                             <label className="solucion-label-view">Tiempo Ejecutado Inicial</label>
//                                             <div className="solucion-input-readonly ejecutado-style">
//                                                 <span className="icon">⏱️</span>
//                                                 <span className="value">{ev.actividad?.minutos_ejecutados || 0} min</span>
//                                             </div>
//                                         </div>

//                                         {/* Si NO es la primera, mostramos cuánto aportó esta solución individualmente */}
//                                         {!esPrimera && (
//                                             <div className="solucion-field-group">
//                                                 <label className="solucion-label-view">Adición en esta Solución</label>
//                                                 <div className="solucion-input-readonly extra-individual-style">
//                                                     <span className="icon">🚀</span>
//                                                     <span className="value">+{ev.minutos_extra || 0} min</span>
//                                                 </div>
//                                             </div>
//                                         )}

//                                         {/* 🌟 ESTO SOLO SE MUESTRA EN LA ÚLTIMA SOLUCIÓN REGISTRADA 🌟 */}
//                                         {esUltima && (
//                                             <div className="solucion-field-group">
//                                                 <label className="solucion-label-view">Tiempo Extra Total Actividad</label>
//                                                 <div className={`solucion-input-readonly extra-total-style ${totalVisualExtra > 0 ? 'text-danger-custom' : ''}`}>
//                                                     <span className="icon">{totalVisualExtra > 0 ? '⚠️' : '📊'}</span>
//                                                     <span className="value">
//                                                         {totalVisualExtra} min totales
//                                                     </span>
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="solucion-footer">
//                                 {ev.archivo_path ? (
//                                     <div className="solucion-archivo-box">
//                                         <a
//                                             href={`${BASE_URL}/storage/${ev.archivo_path}`}
//                                             target="_blank"
//                                             rel="noreferrer"
//                                             className="btn-descarga-evidencia"
//                                         >
//                                             📄 {ev.nombre_original || "Ver Archivo"}
//                                         </a>
//                                     </div>
//                                 ) : (
//                                     <div className="solucion-no-archivo">
//                                         <small style={{ color: '#888', fontStyle: 'italic' }}>
//                                             🚫 Sin archivo adjunto
//                                         </small>
//                                     </div>
//                                 )}

//                                 <div className="solucion-user-tag">
//                                     👤 Por: <strong>{ev.user?.nombre} {ev.user?.apellido}</strong>
//                                 </div>
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>
//         </div>
//     );
// };
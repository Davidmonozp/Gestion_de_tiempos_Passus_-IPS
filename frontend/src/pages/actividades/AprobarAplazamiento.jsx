import React, { useState } from 'react';
import Swal from 'sweetalert2';
import api from '../../services/api';
import './styles/AprobarAplazamiento.css';

export const AprobarAplazamiento = ({ solicitud, onUpdate, puedeGestionar }) => {
    const [comentario, setComentario] = useState("");

    const estaGestionada = solicitud.estado_solicitud !== 'pendiente';

    // Función auxiliar para formatear todas las fechas igual: 4/3/2026, 8:37:39
    const formatearFecha = (fechaRaw) => {
        if (!fechaRaw) return "N/A";

        const d = new Date(fechaRaw);

        // Si la fecha es inválida, devolvemos el string original para ver qué llega
        if (isNaN(d.getTime())) return fechaRaw;

        const dia = d.getDate();
        const mes = d.getMonth() + 1;
        const anio = d.getFullYear();
        const hora = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const seg = String(d.getSeconds()).padStart(2, '0');

        return `${dia}/${mes}/${anio}, ${hora}:${min}:${seg}`;
    };

    const handleDecision = async (decision) => {
        if (estaGestionada || !puedeGestionar) return;

        const comentarioLimpio = comentario.trim();

        try {
            const res = await api.post(`solicitudes/decidir/${solicitud.id}`, {
                decision: decision,
                observacion_jefe: comentarioLimpio
            });

            await Swal.fire({
                title: '¡Logrado!',
                text: res.data.message || 'Decisión guardada',
                icon: 'success'
            });

            if (onUpdate) onUpdate();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.response?.data?.message || 'No se pudo procesar la solicitud',
                icon: 'error'
            });
        }
    };

    return (
        <div className={`solucion-item-card solicitud-especial-card ${estaGestionada ? 'gestionada' : ''}`}>
            <div className="solucion-header solicitud-pendiente-header">
                <span className="solucion-number tipo-solicitud">
                    {estaGestionada ? '✅ Solicitud Procesada' : `⏳ Solicitud de ${solicitud.tipo.toUpperCase()}`}
                </span>
                <span className="solucion-fecha">
                    {/* Fecha de creación con hora */}
                    {formatearFecha(solicitud.created_at)}
                </span>
            </div>

            <div className="solucion-body">
                <div className="motivo-solicitante">
                    <strong>Motivo del trabajador:</strong>
                    <p>{solicitud.motivo}</p>
                </div>

                {solicitud.tipo === 'aplazamiento' && (
                    <div className="cambio-fechas-container">
                        <div className="solucion-grid-tiempos">
                            <div className="solucion-field-group">
                                <label className="solucion-label-view">Fecha Actual</label>
                                <div className="solucion-input-readonly ejecutado-style">
                                    <span className="icon">📅</span>
                                    <span className="value">
                                        {formatearFecha(solicitud.fecha_original)}
                                    </span>
                                </div>
                            </div>

                            <div className="flecha-separador">➔</div>

                            <div className="solucion-field-group">
                                <label className="solucion-label-view">Nueva Propuesta</label>
                                <div className="solucion-input-readonly extra-total-style">
                                    <span className="icon">🚀</span>
                                    <span className="value" style={{ color: estaGestionada ? '#666' : '#d32f2f', fontWeight: 'bold' }}>
                                        {formatearFecha(solicitud.nueva_fecha_propuesta)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="gestion-jefe-area">
                    <label className="solucion-label-view">Respuesta del Jefe</label>

                    {estaGestionada ? (
                        <div className="respuesta-fija-container">
                            <div className="solucion-text-display">
                                {solicitud.observacion_jefe || "Sin observaciones registradas."}
                            </div>
                        </div>
                    ) : puedeGestionar ? (
                        <>
                            <textarea
                                className="input-observacion-jefe"
                                placeholder="Escribe el motivo de tu aprobación o rechazo..."
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                            />
                            <div className="solucion-acciones">
                                <button type='button' className="btn-aprobar-sol" onClick={() => handleDecision('aprobada')}>
                                    ✅ Aprobar
                                </button>
                                <button type='button' className="btn-rechazar-sol" onClick={() => handleDecision('rechazada')}>
                                    ❌ Rechazar
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="espera-mensaje">
                            <p>Esta solicitud está pendiente de revisión por el Jefe Inmediato.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="solucion-footer">
                <div className="solucion-user-tag">
                    👤 Por: <strong>{solicitud.solicitante?.nombre} {solicitud.solicitante?.apellido}</strong>
                </div>
                <span className={`badge-solicitud ${solicitud.estado_solicitud}`}>
                    {solicitud.estado_solicitud}
                </span>
            </div>
        </div>
    );
};
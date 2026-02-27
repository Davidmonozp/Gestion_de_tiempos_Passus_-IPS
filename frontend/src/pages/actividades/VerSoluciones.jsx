import React, { useEffect, useState } from 'react';
import "./styles/VerSoluciones.css";
import api from '../../services/api';

export const VerSoluciones = ({ actividadId }) => {
    const [evidencias, setEvidencias] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ Definimos la BASE_URL igual que en VerActividad
    const BASE_URL = api.defaults.baseURL.replace(/\/api$/, "");

    useEffect(() => {
        const fetchSoluciones = async () => {
            try {
                const res = await api.get(`/actividad/${actividadId}/soluciones`);
                if (res.data.success) {
                    // ✅ Usamos 'soluciones' que es lo que manda tu API
                    setEvidencias(res.data.soluciones); 
                }
            } catch (error) {
                console.error("Error al cargar soluciones:", error);
            } finally {
                setLoading(false);
            }
        };

        if (actividadId) fetchSoluciones();
    }, [actividadId]);

    if (loading) return <div className="soluciones-loading">Cargando soluciones...</div>;

    if (!evidencias || evidencias.length === 0) {
        return (
            <div className="soluciones-empty">
                <p>No se han registrado soluciones o evidencias para esta actividad.</p>
            </div>
        );
    }

    return (
        <div className="soluciones-container">
            <h3 className="soluciones-main-title">🚀 Soluciones y Evidencias</h3>
            
            <div className="soluciones-list">
                {evidencias.map((ev, index) => (
                    <div key={ev.id} className="solucion-item-card">
                        <div className="solucion-header">
                            <span className="solucion-number">Solución #{index + 1}</span>
                            <span className="solucion-fecha">
                                📅 {new Date(ev.created_at).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="solucion-body">
                            <label className="solucion-label-view">Descripción técnica:</label>
                            <div className="solucion-text-display">
                                {ev.descripcion || "Sin descripción detallada."}
                            </div>
                        </div>

                        <div className="solucion-footer">
                            <div className="solucion-archivo-box">
                                {/* ✅ URL Corregida usando BASE_URL */}
                                <a 
                                    href={`${BASE_URL}/storage/${ev.archivo_path}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="btn-descarga-evidencia"
                                >
                                    📄 {ev.nombre_original || "Ver Archivo"}
                                </a>
                            </div>
                            <div className="solucion-user-tag">
                                👤 Por: <strong>{ev.user?.nombre} {ev.user?.apellido}</strong>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
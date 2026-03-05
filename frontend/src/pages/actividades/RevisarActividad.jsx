import React, { useState } from 'react';
import axios from 'axios';
import api from '../../services/api';
import './styles/RevisarActividad.css';
import Swal from "sweetalert2";

const RevisarActividad = ({ actividad, onUpdate }) => {
    const [observacion, setObservacion] = useState('');
    const [loading, setLoading] = useState(false);
    const [archivos, setArchivos] = useState([]);

    const handleDecision = async (aprobado) => {
        const formData = new FormData();
        formData.append('aprobado', aprobado);
        formData.append('observacion_jefe', observacion);

        // Agregar archivos al FormData
        archivos.forEach(file => {
            formData.append('archivos_jefe[]', file);
        });

        setLoading(true);
        try {
            await api.post(`/actividades/${actividad.id}/revisar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            Swal.fire("Éxito", "Revisión enviada", "success");
            onUpdate();
        } catch (error) {
            Swal.fire("Error", "No se pudo enviar", "error");
        } finally { setLoading(false); }
    };

    return (
        <div className="seccion panel-revision">
            <div className="seccion-titulo">
                <h3>📋 Revisión de Solución</h3>
                <span className="badge-revision">Panel de Jefe Inmediato</span>
            </div>
            <hr className="divider" />

            <div className="revision-body">
                <label>Observaciones o Retroalimentación:</label>
                <textarea
                    className="textarea-descripcion" // Reutilizamos tu clase de descripción
                    rows="4"
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    placeholder="Escribe aquí por qué apruebas o qué debe corregir el colaborador..."
                ></textarea>
                <div className="archivo-upload mt-3">
                    <label>Adjuntar documentos de referencia (opcional):</label>
                    <input
                        type="file"
                        multiple
                        className="form-control"
                        onChange={(e) => setArchivos(Array.from(e.target.files))}
                    />
                </div>
            </div>

            <div className="revision-acciones">
                <button
                    className="btn-accion btn-aprobar"
                    onClick={() => handleDecision(true)}
                    disabled={loading}
                >
                    {loading ? 'Procesando...' : '✅ Aprobar y Finalizar'}
                </button>

                <button
                    className="btn-accion btn-devolver"
                    onClick={() => handleDecision(false)}
                    disabled={loading}
                >
                    {loading ? 'Procesando...' : '❌ Devolver para Corrección'}
                </button>
            </div>
        </div>
    );
};

export default RevisarActividad;
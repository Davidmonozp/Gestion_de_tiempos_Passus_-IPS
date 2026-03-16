import React, { useState } from 'react';
import api from '../../services/api';
import './styles/RevisarActividad.css';
import Swal from "sweetalert2";

const RevisarActividad = ({ actividad, onUpdate }) => {
    const [observacion, setObservacion] = useState('');
    const [loading, setLoading] = useState(false);
    const [archivos, setArchivos] = useState([]);

    const handleDecision = async (aprobado) => {
        // NUEVA VALIDACIÓN: Obligatorio para AMBOS casos (Aprobar o Devolver)
        if (!observacion.trim()) {
            return Swal.fire({
                icon: 'warning',
                title: 'Campo obligatorio',
                text: 'Por favor, agrega una observación o retroalimentación antes de procesar la revisión.',
                confirmButtonColor: '#3085d6',
            });
        }

        const formData = new FormData();
        formData.append('aprobado', aprobado);
        formData.append('observacion_jefe', observacion);

        archivos.forEach(file => {
            formData.append('archivos_jefe[]', file);
        });

        // Alerta de carga...
        Swal.fire({
            title: 'Procesando revisión...',
            didOpen: () => { Swal.showLoading(); },
            allowOutsideClick: false
        });

        setLoading(true);
        try {
            const response = await api.post(`/actividades/${actividad.id}/revisar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                await Swal.fire("¡Listo!", "La revisión ha sido enviada correctamente", "success");

                // Limpiar el formulario
                setObservacion('');
                setArchivos([]);

                // Refrescar la vista principal
                onUpdate();
            }
        } catch (error) {
            console.error("Error en revisión:", error);
            Swal.fire("Error", error.response?.data?.message || "No se pudo procesar la revisión", "error");
        } finally {
            setLoading(false);
        }
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
                    className="textarea-descripcion"
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
                        onChange={(e) => {
                            const listaArchivos = Array.from(e.target.files);
                            setArchivos(listaArchivos);
                            console.log("Archivos cargados al estado:", listaArchivos);
                        }}
                    />

                    {/* Lista visual de archivos seleccionados */}
                    <div className="mt-2 container-nombres-archivos">
                        {archivos.length > 0 ? (
                            archivos.map((f, i) => (
                                <div key={i} className="d-flex align-items-center mb-1">
                                    <small style={{ display: 'block', color: '#2e7d32', fontWeight: 'bold' }}>
                                        📎{f.name}
                                        <span style={{ color: '#888', marginLeft: '5px' }}>
                                            ({(f.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </small>
                                </div>
                            ))
                        ) : (
                            <small style={{ color: '#999' }}>No se han seleccionado archivos</small>
                        )}
                    </div>
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

// import React, { useState } from 'react';
// import axios from 'axios';
// import api from '../../services/api';
// import './styles/RevisarActividad.css';
// import Swal from "sweetalert2";

// const RevisarActividad = ({ actividad, onUpdate }) => {
//     const [observacion, setObservacion] = useState('');
//     const [loading, setLoading] = useState(false);
//     const [archivos, setArchivos] = useState([]);

//     const handleDecision = async (aprobado) => {
//         const formData = new FormData();
//         formData.append('aprobado', aprobado);
//         formData.append('observacion_jefe', observacion);

//         // Agregar archivos al FormData
//         archivos.forEach(file => {
//             formData.append('archivos_jefe[]', file);
//         });

//         setLoading(true);
//         try {
//             await api.post(`/actividades/${actividad.id}/revisar`, formData, {
//                 headers: { 'Content-Type': 'multipart/form-data' }
//             });
//             Swal.fire("Éxito", "Revisión enviada", "success");
//             onUpdate();
//         } catch (error) {
//             Swal.fire("Error", "No se pudo enviar, agregue una descripción", "error");
//         } finally { setLoading(false); }
//     };

//     return (
//         <div className="seccion panel-revision">
//             <div className="seccion-titulo">
//                 <h3>📋 Revisión de Solución</h3>
//                 <span className="badge-revision">Panel de Jefe Inmediato</span>
//             </div>
//             <hr className="divider" />

//             <div className="revision-body">
//                 <label>Observaciones o Retroalimentación:</label>
//                 <textarea
//                     className="textarea-descripcion" // Reutilizamos tu clase de descripción
//                     rows="4"
//                     value={observacion}
//                     onChange={(e) => setObservacion(e.target.value)}
//                     placeholder="Escribe aquí por qué apruebas o qué debe corregir el colaborador..."
//                 ></textarea>
//                 <div className="archivo-upload mt-3">
//                     <label>Adjuntar documentos de referencia (opcional):</label>
//                     <input
//                         type="file"
//                         multiple
//                         className="form-control"
//                         onChange={(e) => setArchivos(Array.from(e.target.files))}
//                     />
//                 </div>
//             </div>

//             <div className="revision-acciones">
//                 <button
//                     className="btn-accion btn-aprobar"
//                     onClick={() => handleDecision(true)}
//                     disabled={loading}
//                 >
//                     {loading ? 'Procesando...' : '✅ Aprobar y Finalizar'}
//                 </button>

//                 <button
//                     className="btn-accion btn-devolver"
//                     onClick={() => handleDecision(false)}
//                     disabled={loading}
//                 >
//                     {loading ? 'Procesando...' : '❌ Devolver para Corrección'}
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default RevisarActividad;
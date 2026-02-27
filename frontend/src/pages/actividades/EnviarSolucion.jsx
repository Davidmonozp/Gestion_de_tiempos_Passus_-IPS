import { useState } from "react";
import api from "../../services/api";
import "./styles/EnviarSolucion.css";
import Swal from "sweetalert2"; // Opcional, pero recomendado para feedback visual

export const EnviarSolucion = ({ actividad, onSuccess }) => {
    const [solucion, setSolucion] = useState("");
    const [minutosEjecutados, setMinutosEjecutados] = useState("");
    const [minutosExtra, setMinutosExtra] = useState("0");
    // ✅ Inicializamos con un valor por defecto para que nunca se envíe vacío
    const [estado, setEstado] = useState("Finalizada");
    const [requiereAprobacion, setRequiereAprobacion] = useState(false);
    const [archivos, setArchivos] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleFilesChange = (e) => {
        setArchivos(Array.from(e.target.files));
    };

    const handleEnviar = async () => {
        // Validaciones básicas antes de enviar
        if (!solucion.trim()) {
            return Swal.fire("Error", "Debes escribir una descripción de la solución", "error");
        }
        if (!minutosEjecutados || minutosEjecutados <= 0) {
            return Swal.fire("Error", "Debes ingresar minutos ejecutados válidos", "error");
        }

        setLoading(true);
        const data = new FormData();

        // Campos requeridos por el backend
        data.append("solucion", solucion);
        data.append("minutos_ejecutados", Number(minutosEjecutados));
        data.append("minutos_extra", minutosExtra ? Number(minutosExtra) : 0);

        // Lógica de estado: Si requiere aprobación, el backend prioriza 'Espera_aprobacion'
        const estadoFinal = requiereAprobacion ? "Espera_aprobacion" : estado;
        data.append("estado", estadoFinal);

        // ✅ Clave: Los archivos van con corchetes para que Laravel los reciba como array
        archivos.forEach(file => {
            data.append("archivos_solucion[]", file);
        });

        try {
            const res = await api.post(
                `/enviar-solucion/${actividad.id}`,
                data,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (res.data.success) {
                await Swal.fire("¡Éxito!", "Solución y evidencias guardadas correctamente", "success");

                // Resetear el formulario
                setSolucion("");
                setMinutosEjecutados("");
                setMinutosExtra("0");
                setArchivos([]);
                setEstado("Finalizada");
                setRequiereAprobacion(false);

                // Refrescar la vista padre
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error("Error al enviar:", error.response?.data);
            const msg = error.response?.data?.message || "Error al procesar la solicitud";
            Swal.fire("Error", msg, "error");
        } finally {
            setLoading(false);
        }
    };
    const eliminarArchivoDeLista = (index) => {
        setArchivos(prevArchivos => prevArchivos.filter((_, i) => i !== index));
    };

    return (
        <div className="solucion-card">
            <h3 className="solucion-title">Enviar Solución</h3>

            <label className="solucion-label">Descripción de la solución:</label>
            <textarea
                value={solucion}
                onChange={(e) => setSolucion(e.target.value)}
                placeholder="¿Qué se hizo? (Esta descripción se guardará en evidencias)"
                className="solucion-textarea"
            />

            <div className="solucion-grid">
                <div>
                    <label className="solucion-label">Min. Ejecutados: </label>
                    <input
                        type="number"
                        value={minutosEjecutados}
                        onChange={(e) => setMinutosEjecutados(e.target.value)}
                        className="solucion-input"
                    />
                </div>
                <div>
                    <label className="solucion-label">Min. Extra: </label>
                    <input
                        type="number"
                        value={minutosExtra}
                        onChange={(e) => setMinutosExtra(e.target.value)}
                        className="solucion-input"
                    />
                </div>
            </div>

            <div className="solucion-select-container">
                <label className="solucion-label">Cambiar estado a: </label>
                <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    disabled={requiereAprobacion}
                    className="solucion-select"
                >
                    <option value="Finalizada">Finalizada</option>
                    <option value="Ejecución">En Ejecución</option>
                    <option value="Por_corregir">Por corregir</option>
                    <option value="Aplazada">Aplazada</option>
                    <option value="Cancelada">Cancelada</option>
                </select>
            </div>

            <div className="solucion-checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={requiereAprobacion}
                        onChange={(e) => setRequiereAprobacion(e.target.checked)}
                    />
                    Enviar a espera de aprobación
                </label>
            </div>

            <div className="solucion-files">
                <label className="solucion-label">Adjuntar Evidencias (Fotos, PDFs, etc):</label>

                <div className="archivo-upload-container">
                    <input
                        type="file"
                        multiple
                        onChange={handleFilesChange}
                        id="file-upload-solucion"
                        className="file-input-hidden"
                        style={{ display: 'none' }} // Ocultamos el input feo por defecto
                    />
                    <label htmlFor="file-upload-solucion" className="btn-seleccionar-archivos">
                        📁 Seleccionar archivos
                    </label>

                    <div className="nuevos-archivos-lista" style={{ marginTop: '15px' }}>
                        {archivos.map((file, i) => (
                            <div key={i} className="archivo-fila-item">
                                <div className="archivo-fila-info">
                                    <span>📄 {file.name}</span>
                                    <small>{(file.size / 1024).toFixed(1)} KB</small>
                                </div>
                                <button
                                    type="button"
                                    className="btn-quitar-archivo"
                                    onClick={() => eliminarArchivoDeLista(i)}
                                    title="Quitar archivo"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={handleEnviar}
                className={`solucion-button ${loading ? "btn-disabled" : ""}`}
                disabled={loading}
            >
                {loading ? "Enviando..." : "Enviar Respuesta"}
            </button>
        </div>
    );
};
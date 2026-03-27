import { useState } from "react";
import api from "../../services/api";
import "./styles/EnviarSolucion.css";
import Swal from "sweetalert2";
import { AplazarActividad } from "./AplazarActividad";

export const EnviarSolucion = ({ actividad, onSuccess, userIdLogueado }) => {
    const [solucion, setSolucion] = useState("");
    const [minutosEjecutados, setMinutosEjecutados] = useState("");
    const [minutosExtra, setMinutosExtra] = useState("0");
    const [estado, setEstado] = useState("Finalizada");
    const [requiereAprobacion, setRequiereAprobacion] = useState(false);
    const [archivos, setArchivos] = useState([]);
    const [loading, setLoading] = useState(false);

    // ✅ Detectamos si ya existen evidencias para saber si estamos en modo "acumular"
    const yaTieneSoluciones = actividad.evidencias && actividad.evidencias.length > 0;

    const handleFilesChange = (e) => {
        setArchivos(Array.from(e.target.files));
    };

    const handleEnviar = async () => {
        if (!solucion.trim()) {
            return Swal.fire("Error", "Debes escribir una descripción de la solución", "error");
        }

        // ✅ Validación dinámica: Si ya tiene soluciones, validamos minutos extra. Si no, los ejecutados.
        if (yaTieneSoluciones) {
            if (!minutosExtra || minutosExtra <= 0) {
                return Swal.fire("Error", "Debes ingresar los minutos adicionales dedicados a esta corrección", "error");
            }
        } 
        else {
            if (!minutosEjecutados || minutosEjecutados <= 0) {
                return Swal.fire("Error", "Debes ingresar los minutos ejecutados iniciales", "error");
            }
        }

        setLoading(true);
        const data = new FormData();

        data.append("solucion", solucion);

        // ✅ Enviamos ambos campos. El backend decidirá cuál sumar según la lógica que vimos.
        data.append("minutos_ejecutados", Number(minutosEjecutados) || 0);
        data.append("minutos_extra", Number(minutosExtra) || 0);

        const estadoFinal = requiereAprobacion ? "Espera_aprobacion" : estado;
        data.append("estado", estadoFinal);

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
                await Swal.fire("¡Éxito!", "Solución registrada y tiempos actualizados", "success");
                setSolucion("");
                setMinutosEjecutados("");
                setMinutosExtra("0");
                setArchivos([]);
                setEstado("Finalizada");
                setRequiereAprobacion(false);
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

            <AplazarActividad
                actividad={actividad}
                onUpdate={onSuccess}
                userIdLogueado={userIdLogueado}
            />
            <h3 className="solucion-title">
                {/* ✅ Título dinámico para dar contexto al usuario */}
                {yaTieneSoluciones ? "Añadir Avance / Corrección" : "Enviar Solución"}
            </h3>

            <label className="solucion-label">Descripción de la solución:</label>
            <textarea
                value={solucion}
                onChange={(e) => setSolucion(e.target.value)}
                placeholder="¿Qué se hizo en esta entrega?"
                className="solucion-textarea"
            />

            <div className="solucion-grid">
                {/* ✅ Si es la primera vez, muestra Min. Ejecutados. Si no, lo bloquea o podrías ocultarlo. */}
                <div>
                    <label className="solucion-label">Min. Ejecutados: </label>
                    <input
                        type="number"
                        // 1. Mostramos el valor que viene de la base de datos O el estado local
                        value={actividad?.minutos_ejecutados > 0 ? actividad.minutos_ejecutados : minutosEjecutados}

                        // 2. Solo permitimos el cambio si en la base de datos aún es 0 o null
                        onChange={(e) => setMinutosEjecutados(e.target.value)}

                        className="solucion-input"

                        // 3. Bloqueo estricto: Si ya hay minutos > 0, se deshabilita
                        disabled={actividad?.minutos_ejecutados > 0 || yaTieneSoluciones}

                        // 4. Placeholder dinámico para mejor UX
                        placeholder={actividad?.minutos_ejecutados > 0 ? "Tiempo ya registrado" : "Registra los minutos"}
                    />

                    {/* Opcional: Un pequeño aviso visual para el usuario */}
                    {actividad?.minutos_ejecutados > 0 && (
                        <span style={{ fontSize: '12px', color: 'gray', display: 'block' }}>
                            * Estos minutos ya fueron reportados y no se pueden editar.
                        </span>
                    )}
                </div>
                {/* ✅ Si ya existen soluciones, el usuario debe usar este campo obligatoriamente. */}
                <div>
                    <label className="solucion-label">Min. Adicionales: </label>
                    <input
                        type="number"
                        value={minutosExtra}
                        onChange={(e) => setMinutosExtra(e.target.value)}
                        className="solucion-input"
                        disabled={!yaTieneSoluciones}
                        placeholder={!yaTieneSoluciones ? "N/A" : "0"}
                    />
                </div>
            </div>

            {/* Resto del diseño exactamente igual... */}
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
                <label className="solucion-label">Adjuntar Evidencias:</label>
                <div className="archivo-upload-container">
                    <input
                        type="file"
                        multiple
                        onChange={handleFilesChange}
                        id="file-upload-solucion"
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="file-upload-solucion" className="btn-seleccionar-archivos">
                        📁 Seleccionar archivos
                    </label>

                    <div className="nuevos-archivos-lista" style={{ marginTop: '15px' }}>
                        {archivos.map((file, i) => (
                            <div key={i} className="archivo-fila-item">
                                <div className="archivo-fila-info">
                                    <span>📄 {file.name}</span>
                                </div>
                                <button type="button" className="btn-quitar-archivo" onClick={() => eliminarArchivoDeLista(i)}>✕</button>
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
import Swal from "sweetalert2";
import api from "../../services/api";
import './styles/Versoluciones.css';

export const AplazarActividad = ({ actividad, onUpdate, userIdLogueado }) => {

    const handleAccion = async (tipo) => {
        const isAplazar = tipo === 'aplazamiento';
        const esCreador = actividad.asignado_por === userIdLogueado;

        const { value: formValues } = await Swal.fire({
            title: isAplazar ? 'Aplazar Actividad' : 'Cancelar Actividad',
            html: `
                <div style="text-align: left; font-family: sans-serif;">
                    <div style="padding: 10px; background: #f8f9fa; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid ${esCreador ? '#00933f' : '#ffc107'};">
                        <small style="display: block; color: #333;">
                            ${esCreador
                    ? '<b>Info:</b> Eres el creador. El cambio será inmediato.'
                    : '<b>Info:</b> Se enviará una solicitud de aprobación a tu jefe.'}
                        </small>
                    </div>

                    ${isAplazar ? `
                        <label style="font-size: 14px;"><b>Nueva Fecha propuesta:</b></label>
                        <input type="date" id="swal-fecha" class="swal2-input" style="margin-top: 5px;"
                               min="${new Date().toISOString().split('T')[0]}">
                    ` : ''}

                    <label style="font-size: 14px;"><b>Motivo o Justificación:</b></label>
                    <textarea id="swal-motivo" class="swal2-textarea" style="margin-top: 5px;" placeholder="Describe brevemente el porqué..."></textarea>

                    <label style="font-size: 14px;"><b>Evidencias (Opcional):</b></label>
                    <input type="file" id="swal-archivos" class="swal2-file" style="font-size: 12px;" multiple>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: esCreador ? 'Aplicar ahora' : 'Enviar solicitud',
            confirmButtonColor: isAplazar ? '#0087cd' : '#e74c3c',
            cancelButtonText: 'Cerrar',
            preConfirm: () => {
                const motivo = document.getElementById('swal-motivo').value;
                const nueva_fecha = isAplazar ? document.getElementById('swal-fecha').value : null;
                const archivos = document.getElementById('swal-archivos').files;

                if (!motivo) return Swal.showValidationMessage('El motivo es obligatorio');
                if (isAplazar && !nueva_fecha) return Swal.showValidationMessage('Debes elegir una fecha');

                return { motivo, nueva_fecha, archivos };
            }
        });

        if (formValues) {
            ejecutarSolicitud(tipo, formValues, esCreador);
        }
    };
const ejecutarSolicitud = async (tipo, datos, esCreador) => {
    const formData = new FormData();
    formData.append("actividad_id", actividad.id);
    formData.append("tipo", tipo);
    formData.append("motivo", datos.motivo);
    if (datos.nueva_fecha) formData.append("nueva_fecha_propuesta", datos.nueva_fecha);

    if (datos.archivos.length > 0) {
        Array.from(datos.archivos).forEach(file => {
            formData.append("archivos[]", file);
        });
    }

    try {
        // 1. Loading inicial
        Swal.fire({
            title: 'Procesando...',
            text: 'Guardando solicitud en el servidor',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const res = await api.post("/solicitudes", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });

        // 2. IMPORTANTE: Usamos .then() o await para asegurar que el alert de éxito 
        // se dispare después de que el loading se haya limpiado internamente.
        if (res.data.success) {
            
            // Forzamos el cierre del loading
            Swal.close(); 

            // 3. ✅ Alert Persistente (Sin timer)
            const confirmacion = await Swal.fire({
                icon: 'success',
                title: esCreador ? '¡Cambio Aplicado!' : '¡Solicitud Enviada!',
                text: res.data.message || 'La operación se completó con éxito.',
                confirmButtonText: 'Cerrar',
                confirmButtonColor: '#28a745',
                allowOutsideClick: false, // Obliga a dar click al botón
                allowEscapeKey: false,    // Evita cerrar con ESC
                allowEnterKey: true
            });

            // 4. SOLO cuando el usuario haga click en el botón de confirmación
            // se ejecuta el onUpdate (refresco de UI)
            if (confirmacion.isConfirmed) {
                if (onUpdate) onUpdate();
            }
        }
    } catch (error) {
        console.error("Error completo:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error al procesar',
            text: error.response?.data?.message || "No se pudo conectar con el servidor",
            confirmButtonColor: '#d33'
        });
    }
};

    // ✅ EL RETURN DEBE ESTAR AQUÍ ADENTRO
    return (
        <div className="aplazar-container-buttons">
            <button
                type="button"
                className="btn-aplazar-opt"
                onClick={() => handleAccion('aplazamiento')}
            >
                <i className="fa-solid fa-clock-rotate-left"></i> Aplazar
            </button>
            <button
                type="button"
                className="btn-cancelar-opt"
                onClick={() => handleAccion('cancelacion')}
            >
                <i className="fa-solid fa-ban"></i> Cancelar
            </button>
        </div>
    );
}; // ✅ FIN DEL COMPONENTE
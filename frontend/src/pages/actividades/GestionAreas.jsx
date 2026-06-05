import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../services/api";
import "../../components/styles/Modal.css";

export const GestionAreas = () => {
    const navigate = useNavigate();
    const [areas, setAreas] = useState([]);
    const [nuevaArea, setNuevaArea] = useState("");
    const [nuevaActividad, setNuevaActividad] = useState({});

    // EDITAR
    const [editandoArea, setEditandoArea] = useState(null);
    const [nombreEditArea, setNombreEditArea] = useState("");
    const [editandoActividad, setEditandoActividad] = useState(null);
    const [nombreEditActividad, setNombreEditActividad] = useState("");

    const cargarAreas = async () => {
        try {
            const res = await api.get("/ver-areas");
            setAreas(res.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const inicializar = async () => {
            await cargarAreas();
        };

        inicializar();
    }, []);

    const crearArea = async () => {
        if (!nuevaArea.trim()) return;
        try {
            await api.post("/crear-area", { nombre: nuevaArea });
            Swal.fire("Éxito", "Área creada correctamente", "success");
            setNuevaArea("");
            cargarAreas();
        } catch {
            Swal.fire("Error", "No se pudo crear el área", "error");
        }
    };

    const eliminarArea = async (id) => {
        const confirmar = await Swal.fire({
            title: "¿Eliminar área?",
            text: "Esta acción no se puede deshacer",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar"
        });
        if (!confirmar.isConfirmed) return;
        try {
            await api.delete(`/eliminar-area/${id}`);
            cargarAreas();
        } catch {
            Swal.fire("Error", "No se pudo eliminar", "error");
        }
    };

    const actualizarArea = async (id) => {
        if (!nombreEditArea.trim()) return;
        try {
            await api.put(`/editar-area/${id}`, { nombre: nombreEditArea });
            setEditandoArea(null);
            cargarAreas();
        } catch {
            Swal.fire("Error", "No se pudo actualizar", "error");
        }
    };

    const crearActividad = async (areaId) => {
        const nombre = nuevaActividad[areaId];
        if (!nombre?.trim()) return;
        try {
            await api.post("/tipos-actividad", { nombre, area_id: areaId });
            setNuevaActividad((prev) => ({ ...prev, [areaId]: "" }));
            cargarAreas();
        } catch {
            Swal.fire("Error", "No se pudo crear actividad", "error");
        }
    };

    const eliminarActividad = async (id) => {
        const confirmar = await Swal.fire({
            title: "¿Eliminar actividad?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Eliminar"
        });
        if (!confirmar.isConfirmed) return;
        try {
            await api.delete(`/tipos-actividad/${id}`);
            cargarAreas();
        } catch {
            Swal.fire("Error", "No se pudo eliminar", "error");
        }
    };

    const actualizarActividad = async (id) => {
        if (!nombreEditActividad.trim()) return;
        try {
            await api.put(`/tipos-actividad/${id}`, { nombre: nombreEditActividad });
            setEditandoActividad(null);
            cargarAreas();
        } catch {
            Swal.fire("Error", "No se pudo actualizar", "error");
        }
    };

    return (
        <div className="modal-overlay"> {/* Mantenemos la clase para heredar los estilos de fondo */}
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Gestión de Áreas y Actividades</h2>
                    <button className="btn-close" onClick={() => navigate(-1)}>
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                </div>

                <div className="crear-area-container">
                    <input
                        type="text"
                        placeholder="Nueva área"
                        value={nuevaArea}
                        onChange={(e) => setNuevaArea(e.target.value)}
                        className="modal-input"
                    />
                    <button className="boton" onClick={crearArea}>Agregar Área</button>
                </div>

                <div className="areas-container">
                    {areas.map((area) => (
                        <div key={area.id} className="area-card">
                            <div className="area-header">
                                {editandoArea === area.id ? (
                                    <div className="edit-container">
                                        <input value={nombreEditArea} onChange={(e) => setNombreEditArea(e.target.value)} className="modal-input" />
                                        <button className="btn-icon-action btn-save" onClick={() => actualizarArea(area.id)}><i className="fa-solid fa-floppy-disk"></i></button>
                                    </div>
                                ) : (
                                    <h3>{area.nombre}</h3>
                                )}
                                <div className="acciones-area">
                                    <button className="btn-icon btn-edit" onClick={() => { setEditandoArea(area.id); setNombreEditArea(area.nombre); }}><i className="fa-solid fa-pen-to-square"></i></button>
                                    <button className="btn-icon btn-delete" onClick={() => eliminarArea(area.id)}><i className="fa-solid fa-trash-can"></i></button>
                                </div>
                            </div>

                            <div className="actividades-container">
                                {area.tipos_actividad?.map((act) => (
                                    <div key={act.id} className="actividad-item">
                                        {editandoActividad === act.id ? (
                                            <div className="edit-container">
                                                <input value={nombreEditActividad} onChange={(e) => setNombreEditActividad(e.target.value)} className="modal-input" />
                                                <button className="btn-save" onClick={() => actualizarActividad(act.id)}>Guardar</button>
                                            </div>
                                        ) : (
                                            <span>• {act.nombre}</span>
                                        )}
                                        <div className="acciones-actividad">
                                            <button className="btn-icon-sub btn-edit-sub" onClick={() => { setEditandoActividad(act.id); setNombreEditActividad(act.nombre); }}><i className="fa-solid fa-pen"></i></button>
                                            <button className="btn-icon-sub btn-delete-sub" onClick={() => eliminarActividad(act.id)}><i className="fa-solid fa-trash"></i></button>
                                        </div>
                                    </div>
                                ))}
                                <div className="nueva-actividad">
                                    <input
                                        placeholder="Nueva actividad"
                                        value={nuevaActividad[area.id] || ""}
                                        onChange={(e) => setNuevaActividad({ ...nuevaActividad, [area.id]: e.target.value })}
                                        className="modal-input"
                                    />
                                    <button className="boton" onClick={() => crearActividad(area.id)}>Agregar</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
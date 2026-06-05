import { useEffect, useState } from "react";
import "./styles/Modal.css";
import api from "../services/api";
import Swal from "sweetalert2";



export const ModalAreas = ({ onClose, reloadAreas }) => {

    const [areas, setAreas] = useState([]);

    const [nuevaArea, setNuevaArea] = useState("");

    const [nuevaActividad, setNuevaActividad] = useState({});

    // EDITAR ÁREA
    const [editandoArea, setEditandoArea] = useState(null);

    const [nombreEditArea, setNombreEditArea] = useState("");

    // EDITAR ACTIVIDAD
    const [editandoActividad, setEditandoActividad] = useState(null);

    const [nombreEditActividad, setNombreEditActividad] = useState("");

    // CARGAR ÁREAS
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

    // CREAR ÁREA
    const crearArea = async () => {

        if (!nuevaArea.trim()) return;

        try {

            await api.post("/crear-area", {
                nombre: nuevaArea
            });

            Swal.fire(
                "Éxito",
                "Área creada correctamente",
                "success"
            );

            setNuevaArea("");

            cargarAreas();

            if (reloadAreas) {
                reloadAreas();
            }

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "No se pudo crear el área",
                "error"
            );
        }
    };

    // ELIMINAR ÁREA
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

            Swal.fire(
                "Eliminada",
                "Área eliminada correctamente",
                "success"
            );

            cargarAreas();

            if (reloadAreas) {
                reloadAreas();
            }

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "No se pudo eliminar",
                "error"
            );
        }
    };

    // ACTUALIZAR ÁREA
    const actualizarArea = async (id) => {

        if (!nombreEditArea.trim()) return;

        try {

            await api.put(`/editar-area/${id}`, {
                nombre: nombreEditArea
            });

            Swal.fire(
                "Actualizada",
                "Área actualizada correctamente",
                "success"
            );

            setEditandoArea(null);

            setNombreEditArea("");

            cargarAreas();

            if (reloadAreas) {
                reloadAreas();
            }

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "No se pudo actualizar",
                "error"
            );
        }
    };

    // CREAR ACTIVIDAD
    const crearActividad = async (areaId) => {

        const nombre = nuevaActividad[areaId];

        if (!nombre?.trim()) return;

        try {

            await api.post("/tipos-actividad", {
                nombre,
                area_id: areaId
            });

            Swal.fire(
                "Éxito",
                "Actividad creada",
                "success"
            );

            setNuevaActividad((prev) => ({
                ...prev,
                [areaId]: ""
            }));

            cargarAreas();

            if (reloadAreas) {
                reloadAreas();
            }

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "No se pudo crear actividad",
                "error"
            );
        }
    };

    // ELIMINAR ACTIVIDAD
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

            Swal.fire(
                "Eliminada",
                "Actividad eliminada",
                "success"
            );

            cargarAreas();

            if (reloadAreas) {
                reloadAreas();
            }

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "No se pudo eliminar",
                "error"
            );
        }
    };

    // ACTUALIZAR ACTIVIDAD
    const actualizarActividad = async (id) => {

        if (!nombreEditActividad.trim()) return;

        try {

            await api.put(`/tipos-actividad/${id}`, {
                nombre: nombreEditActividad
            });

            Swal.fire(
                "Actualizada",
                "Actividad actualizada",
                "success"
            );

            setEditandoActividad(null);

            setNombreEditActividad("");

            cargarAreas();

            if (reloadAreas) {
                reloadAreas();
            }

        } catch (error) {

            console.error(error);

            Swal.fire(
                "Error",
                "No se pudo actualizar",
                "error"
            );
        }
    };

    return (

        <div className="modal-overlay">

            <div className="modal-content">

                {/* HEADER */}
                <div className="modal-header">

                    <h2>
                        Gestión de Áreas y Actividades
                    </h2>

                    <button
                        className="btn-close"
                        onClick={onClose}
                        aria-label="Cerrar"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>

                </div>

                {/* CREAR ÁREA */}
                <div className="crear-area-container">

                    <input
                        type="text"
                        placeholder="Nueva área"
                        value={nuevaArea}
                        onChange={(e) =>
                            setNuevaArea(e.target.value)
                        }
                        className="modal-input"
                    />

                    <button
                        className="boton"
                        onClick={crearArea}
                    >
                        Agregar Área
                    </button>

                </div>

                {/* LISTADO */}
                <div className="areas-container">

                    {areas.map((area) => (

                        <div
                            key={area.id}
                            className="area-card"
                        >

                            {/* ÁREA */}
                            <div className="area-header">

                                {editandoArea === area.id ? (

                                    <div className="edit-container">

                                        <input
                                            value={nombreEditArea}
                                            onChange={(e) =>
                                                setNombreEditArea(
                                                    e.target.value
                                                )
                                            }
                                            className="modal-input"
                                        />
                                        <button
                                            className="btn-icon-action btn-save"
                                            onClick={() => actualizarArea(area.id)}
                                            title="Guardar cambios"
                                        >
                                            <i className="fa-solid fa-floppy-disk"></i>
                                        </button>

                                    </div>

                                ) : (

                                    <h3>
                                        {area.nombre}
                                    </h3>

                                )}

                                <div className="acciones-area">

                                    <button
                                        className="btn-icon btn-edit"
                                        onClick={() => {
                                            setEditandoArea(area.id);
                                            setNombreEditArea(area.nombre);
                                        }}
                                        title="Editar área"
                                    >
                                        <i className="fa-solid fa-pen-to-square"></i>
                                    </button>

                                    <button
                                        className="btn-icon btn-delete"
                                        onClick={() => eliminarArea(area.id)}
                                        title="Eliminar área"
                                    >
                                        <i className="fa-solid fa-trash-can"></i>
                                    </button>

                                </div>

                            </div>

                            {/* ACTIVIDADES */}
                            <div className="actividades-container">

                                {area.tipos_actividad?.map((actividad) => (

                                    <div
                                        key={actividad.id}
                                        className="actividad-item"
                                    >

                                        {editandoActividad === actividad.id ? (

                                            <div className="edit-container">

                                                <input
                                                    value={nombreEditActividad}
                                                    onChange={(e) =>
                                                        setNombreEditActividad(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="modal-input"
                                                />

                                                <button
                                                    className="btn-save"
                                                    onClick={() =>
                                                        actualizarActividad(
                                                            actividad.id
                                                        )
                                                    }
                                                >
                                                    Guardar
                                                </button>

                                            </div>

                                        ) : (

                                            <span>
                                                • {actividad.nombre}
                                            </span>

                                        )}

                                        <div className="acciones-actividad">

                                            <button
                                                className="btn-icon-sub btn-edit-sub"
                                                onClick={() => {
                                                    setEditandoActividad(actividad.id);
                                                    setNombreEditActividad(actividad.nombre);
                                                }}
                                                title="Editar actividad"
                                            >
                                                <i className="fa-solid fa-pen"></i> {/* Icono de lápiz de Font Awesome */}
                                            </button>

                                            <button
                                                className="btn-icon-sub btn-delete-sub"
                                                onClick={() => eliminarActividad(actividad.id)}
                                                title="Eliminar actividad"
                                            >
                                                <i className="fa-solid fa-trash"></i> {/* Icono de basura de Font Awesome */}
                                            </button>

                                        </div>

                                    </div>
                                ))}

                                {/* NUEVA ACTIVIDAD */}
                                <div className="nueva-actividad">

                                    <input
                                        type="text"
                                        placeholder="Nueva actividad"
                                        value={
                                            nuevaActividad[area.id] || ""
                                        }
                                        onChange={(e) =>
                                            setNuevaActividad((prev) => ({
                                                ...prev,
                                                [area.id]:
                                                    e.target.value
                                            }))
                                        }
                                        className="modal-input"
                                    />

                                    <button
                                        className="boton"
                                        onClick={() =>
                                            crearActividad(area.id)
                                        }
                                    >
                                        Agregar
                                    </button>

                                </div>

                            </div>

                        </div>
                    ))}

                </div>

            </div>

        </div>
    );
};
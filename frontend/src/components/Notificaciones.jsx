import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./styles/Notificaciones.css";

export const Notificationes = () => {
    const [notifications, setNotifications] = useState([]);
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const res = await api.get("/notificaciones");
            setNotifications(res.data);
        } catch (error) {
            console.error("Error al cargar notificaciones", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleItemClick = async (notifId, actividadId) => {
        try {
            await api.post(`/notificaciones/${notifId}/leer`);

            setNotifications(prev => prev.filter(n => n.id !== notifId));

            setShowMenu(false);

            navigate(`/ver-actividad/${actividadId}`);

        } catch (error) {
            console.error("Error al procesar notificación", error);
            // Si falla la API, igual intentamos navegar
            navigate(`/ver-actividad/${actividadId}`);
        }
    };

    return (
        /* 🚩 Usando tus clases del CSS: notif-wrapper */
        <div className="notif-wrapper">
            <button
                className="notif-button"
                onClick={() => setShowMenu(!showMenu)}
            >
                <i className="fa-solid fa-bell"></i>
                {notifications.length > 0 && (
                    <span className="notif-badge">{notifications.length}</span>
                )}
            </button>

            {showMenu && (
                <div className="notif-dropdown">
                    <div className="notif-header">
                        Notificaciones ({notifications.length})
                    </div>
                    <div className="notif-body">
                        {notifications.length === 0 ? (
                            <p className="notif-empty">No tienes mensajes nuevos</p>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className="notif-item"
                                    onClick={() => handleItemClick(n.id, n.data.actividad_id)}
                                    style={{ cursor: 'pointer' }} /* Para que sepa que es clickeable */
                                >
                                    <p>{n.data.mensaje}</p>
                                    <small>{new Date(n.created_at).toLocaleString()}</small>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
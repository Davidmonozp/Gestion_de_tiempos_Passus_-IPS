import { useEffect } from 'react';
import api from '../services/api';

export const ForceLogout = () => {
    useEffect(() => {
        const handleKillSession = async () => {
            try {
                // Intentamos avisar a Laravel para que invalide el JWT en su lista negra
                await api.post('/logout');
            } catch (error) {
                // Si el token ya no servía, Laravel dará error, pero ignoramos y seguimos limpiando
            } finally {
                // 1. Limpieza radical del navegador
                localStorage.clear();
                sessionStorage.clear();
                
                // 2. Quitamos la autorización de Axios
                delete api.defaults.headers.common['Authorization'];

                // 3. RECARGA TOTAL AL LOGIN
                // Esto es lo que rompe el botón "atrás" definitivamente
                window.location.href = "/login";
            }
        };

        handleKillSession();
    }, []);

    return null; // O un spinner de "Cerrando sesión..."
};
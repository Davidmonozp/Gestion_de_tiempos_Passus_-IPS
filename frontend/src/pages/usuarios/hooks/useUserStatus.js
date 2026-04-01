import { useState } from 'react';
import Swal from 'sweetalert2';
import api from '../../../services/api';

export const useUserStatus = (setUsuarios) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const toggleStatus = async (user) => {
        setIsUpdating(true);
        try {
            // Llamada a tu API de Laravel
            const res = await api.patch(`/usuarios/${user.id}/status`);

            if (res.data.status === 'success') {
                // Actualizamos el estado local de React
                setUsuarios(prevUsuarios =>
                    prevUsuarios.map(u =>
                        u.id === user.id
                            ? { 
                                ...u, 
                                // Convertimos el 1/0 del server a "Activo"/"Inactivo"
                                estado: res.data.activo === 1 ? 'Activo' : 'Inactivo' 
                              }
                            : u
                    )
                );

                Swal.fire({
                    icon: 'success',
                    title: `Usuario ${res.data.activo === 1 ? 'activado' : 'inactivado'}`,
                    toast: true,
                    position: 'center',
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        } catch (error) {
            console.error("Error al cambiar estado:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cambiar el estado del usuario'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return { toggleStatus, isUpdating };
};
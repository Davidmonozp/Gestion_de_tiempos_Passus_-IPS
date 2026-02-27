import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import "./styles/Sidebar.css";


export const Logout = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            // 1. Llamamos a tu función de Laravel para invalidar el token
            await api.post('auth/logout');
        } catch (error) {
            console.error("Error al invalidar token en servidor:", error);
            // Aunque falle la red, procedemos a limpiar el cliente por seguridad
        } finally {
            // 2. Limpieza total del lado del cliente
            localStorage.removeItem('token');
            localStorage.removeItem('user'); // Si guardas datos del usuario, bórralos también

            // 3. Quitamos el token de los headers de Axios
            delete api.defaults.headers.common['Authorization'];

            // 4. Redirigimos al Login
            navigate('/login');
        }
    };

    return (
        <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                </svg>
            </span>
            <span>Cerrar sesión</span>
        </button>

    );
};
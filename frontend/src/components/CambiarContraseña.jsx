import React, { useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import './styles/CambiarContraseña.css';
import { Version } from './Version';
import { Navbar } from './Navbar';

export const CambiarContrasena = () => {
    const { logout } = useAuth();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmationPassword, setShowConfirmationPassword] = useState(false);
    const [formData, setFormData] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/user/change-my-password', formData);

            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: response.data.message || 'Contraseña actualizada correctamente.',
                confirmButtonText: 'Aceptar'
            });

            logout();

        } catch (error) {

            let errorMsg = 'Error al actualizar la contraseña.';

            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                errorMsg = Object.values(errors)[0][0];
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: errorMsg,
                confirmButtonText: 'Entendido'
            });

        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="auth-wrapper">
                <div className="card">
                    <h3>Cambiar Contraseña</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3 password-container">
                            <input
                                className="form-control"
                                name="current_password"
                                type={showCurrentPassword ? "text" : "password"}
                                placeholder="Contraseña actual"
                                onChange={handleChange}
                                value={formData.current_password}
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                {showCurrentPassword ? "🙈" : "👁️‍🗨️"}
                            </button>
                        </div>
                        <div className="mb-3 password-container">
                            <input
                                className="form-control"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Nueva contraseña"
                                onChange={handleChange}
                                value={formData.password}
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "🙈" : "👁️‍🗨️"}
                            </button>
                        </div>
                        <div className="mb-3 password-container">
                            <input
                                className="form-control"
                                name="password_confirmation"
                                type={showConfirmationPassword ? "text" : "password"}
                                placeholder="Confirmar nueva contraseña"
                                onChange={handleChange}
                                value={formData.password_confirmation}
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmationPassword(!showConfirmationPassword)}
                            >
                                {showConfirmationPassword ? "🙈" : "👁️‍🗨️"}
                            </button>
                        </div>

                        <button type="submit" className="boton" disabled={loading}>
                            {loading ? 'Procesando...' : 'Actualizar Contraseña'}
                        </button>
                    </form>
                </div>
            </div>
            <Version />
        </>
    );
}
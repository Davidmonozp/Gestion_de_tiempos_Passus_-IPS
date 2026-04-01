import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import '../auth/styles/Login.css';
import Swal from 'sweetalert2';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre_usuario: "",
    password: "",
    rememberMe: false, 
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        // Al llamar a login, si Laravel responde 401 o 403, 
        // el 'throw error' del Context disparará el catch de aquí abajo.
        await login(form.nombre_usuario, form.password, form.rememberMe);
        
        Swal.fire({
            icon: 'success',
            title: '¡Bienvenido!',
            text: 'Inicio de sesión exitoso',
            timer: 1500,
            showConfirmButton: false
        });

        navigate("/vista-principal");

    } catch (error) {
        // Extraemos el mensaje real de tu controlador de Laravel:
        // "Credenciales inválidas" O "Tu cuenta se encuentra inactiva..."
        const mensajeServidor = error.response?.data?.message || 'Credenciales incorrectas, por favor intenta de nuevo.';

        Swal.fire({
            icon: 'error',
            title: 'Error de acceso',
            text: mensajeServidor, // <--- Aquí mostramos el mensaje dinámico
            confirmButtonColor: '#00933f', 
        });
    }
};

  return (
    <>
      <div className="login">
        <div className="container">
          <div className="img-login">
            <img src="/logoPassusTransp.png" alt="" className="logo-login" />
          </div>

          {/* Login */}
          <form onSubmit={handleSubmit} id="login" className="form">
            <input className="form__input"
              required type="text"
              name="nombre_usuario"
              placeholder="Usuario"
              onChange={handleChange}
            />
            <input className="form__input"
              type="password"
              name="password"
              placeholder="Contraseña"
              onChange={handleChange}
              required />
            <div className="form__options">
              {/* Anexo: name, checked y onChange añadidos */}
              <input 
                type="checkbox" 
                className="form__check-box" 
                id="login-check" 
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
              />
              <label htmlFor="login-check" className="form__terms">Recordar mis datos</label>
            </div>
            <button type="submit" className="form__submit-btn">Ingresar</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
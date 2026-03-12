import { createContext, useState, useContext, useEffect, useRef } from "react";
import api from "../services/api";
import Swal from 'sweetalert2';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
    const [jornadaActiva, setJornadaActiva] = useState(!!localStorage.getItem("jornada_inicio"));
    const [segundos, setSegundos] = useState(0);
    const timerRef = useRef(null);

    // Formatea segundos a HH:MM:SS para la interfaz
    const formatearTiempo = (s) => {
        const hrs = Math.floor(s / 3600).toString().padStart(2, "0");
        const mins = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
        const secs = (s % 60).toString().padStart(2, "0");
        return `${hrs}:${mins}:${secs}`;
    };

    // Sincroniza el estado de la jornada con el servidor
    const sincronizarEstadoReal = async () => {
        if (!localStorage.getItem("token")) return;
        try {
            const res = await api.get('/jornada/estado');
            if (res.data.jornada_activa) {
                const inicio = new Date(res.data.datos.hora_entrada).getTime();
                localStorage.setItem("jornada_inicio", inicio.toString());
                setJornadaActiva(true);
            } else {
                localStorage.removeItem("jornada_inicio");
                setJornadaActiva(false);
                setSegundos(0);
            }
        } catch (error) {
            console.error("Error al sincronizar jornada:", error);
        }
    };

    useEffect(() => {
        if (user) sincronizarEstadoReal();
    }, [user]);

    // Cronómetro visual basado en tiempo real absoluto
    useEffect(() => {
        if (jornadaActiva) {
            const calcularDiferencia = () => {
                const inicioGuardado = localStorage.getItem("jornada_inicio");
                if (inicioGuardado) {
                    const ahora = new Date().getTime();
                    const diferencia = Math.floor((ahora - parseInt(inicioGuardado)) / 1000);
                    setSegundos(diferencia > 0 ? diferencia : 0);
                }
            };
            calcularDiferencia();
            timerRef.current = setInterval(calcularDiferencia, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
            setSegundos(0);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [jornadaActiva]);

    const handleEntrada = async () => {
        try {
            const res = await api.post('/jornada/entrada');
            const inicio = new Date(res.data.data.hora_entrada).getTime();
            localStorage.setItem("jornada_inicio", inicio.toString());
            setJornadaActiva(true);
            Swal.fire({ icon: 'success', title: 'Jornada Iniciada', timer: 1500, showConfirmButton: false });
        } catch (error) {
            if (error.response?.status === 400) {
                sincronizarEstadoReal();
            } else {
                Swal.fire('Error', 'No se pudo iniciar jornada', 'error');
            }
        }
    };

    const handleSalida = async () => {
        try {
            // PASO CLAVE: El backend compara (Tiempo de Reloj) vs (Suma de minutos de actividades hoy)
            const resPreview = await api.get('/jornada/previsualizar-salida');
            const { tiempo_laboral, tiempo_actividades, diferencia_minutos } = resPreview.data.calculo;
            
            // Si la diferencia entre lo trabajado y lo registrado es > 10 min, alertamos
            const esIncompleto = diferencia_minutos > 0;

            const decision = await Swal.fire({
                title: 'Resumen de Jornada',
                html: `
                <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
                    <p>⏱️ <b>Tiempo de Trabajo:</b> ${tiempo_laboral}</p>
                    <p>📋 <b>Minutos en Actividades:</b> ${tiempo_actividades}</p>
                    <hr>
                    <p style="color: ${esIncompleto ? '#d32f2f' : '#28a745'}; text-align: center; font-size: 1.1em;">
                        <b>Diferencia: ${diferencia_minutos} min</b><br>
                        <small>${esIncompleto ? '⚠️ Debes registrar más tiempo en tus tareas.' : '✅ ¡Registro al día!'}</small>
                    </p>
                </div>`,
                icon: esIncompleto ? 'warning' : 'success',
                showCancelButton: true,
                confirmButtonText: 'Finalizar Jornada',
                cancelButtonText: 'Volver a Actividades',
                confirmButtonColor: esIncompleto ? '#f39c12' : '#28a745',
            });

            if (decision.isConfirmed) {
                const resFinal = await api.post('/jornada/salida');
                if (resFinal.data.success) {
                    localStorage.removeItem("jornada_inicio");
                    setJornadaActiva(false);
                    setSegundos(0);
                    await Swal.fire({ icon: 'success', title: 'Jornada Cerrada', timer: 1500, showConfirmButton: false });
                    logout(); 
                }
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo calcular el balance de actividades', 'error');
        }
    };

    const login = async (nombre_usuario, password) => {
        const response = await api.post("/auth/login", { nombre_usuario, password });
        const { access_token, user: userData } = response.data;
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.clear();
        setJornadaActiva(false);
        setSegundos(0);
        setUser(null);
        window.location.href = "/login";
    };

    const tienePermiso = (rolesPermitidos) => {
        if (!user) return false;
        const rolActual = user.role_name || user.role;
        const permitido = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
        return permitido.includes(rolActual);
    };

    return (
        <AuthContext.Provider value={{ 
            user, login, logout, tienePermiso,
            tiempoTranscurrido: formatearTiempo(segundos),
            jornadaActiva, handleEntrada, handleSalida 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);



// import { createContext, useState, useContext, useEffect, useRef } from "react";
// import api from "../services/api";
// import Swal from 'sweetalert2';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
//     const [jornadaActiva, setJornadaActiva] = useState(!!localStorage.getItem("jornada_inicio"));
//     const [segundos, setSegundos] = useState(0);
//     const timerRef = useRef(null);

//     const formatearTiempo = (s) => {
//         const hrs = Math.floor(s / 3600).toString().padStart(2, "0");
//         const mins = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
//         const secs = (s % 60).toString().padStart(2, "0");
//         return `${hrs}:${mins}:${secs}`;
//     };

//     // --- FUNCIÓN PARA SINCRONIZAR CON EL SERVIDOR ---
//     const sincronizarEstadoReal = async () => {
//         try {
//             const res = await api.get('/jornada/estado');
//             if (res.data.jornada_activa) {
//                 const inicio = new Date(res.data.datos.hora_entrada).getTime();
//                 localStorage.setItem("jornada_inicio", inicio.toString());
//                 setJornadaActiva(true);
//             } else {
//                 localStorage.removeItem("jornada_inicio");
//                 setJornadaActiva(false);
//             }
//         } catch (error) {
//             console.error("Error al sincronizar con servidor", error);
//         }
//     };

//     // Sincronizar al cargar la app si el usuario está logueado
//     useEffect(() => {
//         if (user) sincronizarEstadoReal();
//     }, [user]);

//     // --- LÓGICA DEL CRONÓMETRO ---
//     useEffect(() => {
//         if (jornadaActiva) {
//             const calcularDiferencia = () => {
//                 const inicioGuardado = localStorage.getItem("jornada_inicio");
//                 if (inicioGuardado) {
//                     const ahora = new Date().getTime();
//                     const diferencia = Math.floor((ahora - parseInt(inicioGuardado)) / 1000);
//                     setSegundos(diferencia > 0 ? diferencia : 0);
//                 }
//             };
//             calcularDiferencia();
//             timerRef.current = setInterval(calcularDiferencia, 1000);
//         } else {
//             clearInterval(timerRef.current);
//             setSegundos(0);
//         }
//         return () => clearInterval(timerRef.current);
//     }, [jornadaActiva]);

//     // --- ACCIONES ---

//     const handleEntrada = async () => {
//         try {
//             const res = await api.post('/jornada/entrada');
//             const inicio = new Date(res.data.data.hora_entrada).getTime();
//             localStorage.setItem("jornada_inicio", inicio.toString());
//             setJornadaActiva(true);
//             Swal.fire({ icon: 'success', title: 'Jornada Iniciada', timer: 1500, showConfirmButton: false });
//         } catch (error) {
//             // Si el error es 400, sincronizamos porque ya hay una activa
//             if (error.response?.status === 400) {
//                 sincronizarEstadoReal();
//             } else {
//                 Swal.fire('Error', 'No se pudo iniciar jornada', 'error');
//             }
//         }
//     };

//     const handleSalida = async () => {
//         try {
//             const resPreview = await api.get('/jornada/previsualizar-salida');
//             const { tiempo_laboral, tiempo_actividades, diferencia_minutos } = resPreview.data.calculo;
//             const esIncompleto = diferencia_minutos > 10;

//             const decision = await Swal.fire({
//                 title: 'Resumen de Jornada',
//                 html: `
//                 <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
//                     <p>⏱️ <b>Trabajado:</b> ${tiempo_laboral}</p>
//                     <p>📋 <b>Registrado:</b> ${tiempo_actividades}</p>
//                     <hr>
//                     <p style="color: ${esIncompleto ? '#d32f2f' : '#28a745'}; text-align: center;">
//                         <b>Diferencia: ${diferencia_minutos} min</b>
//                     </p>
//                 </div>`,
//                 icon: esIncompleto ? 'warning' : 'success',
//                 showCancelButton: true,
//                 confirmButtonText: 'Finalizar y Salir',
//                 cancelButtonText: 'Seguir trabajando'
//             });

//             if (decision.isConfirmed) {
//                 const resFinal = await api.post('/jornada/salida');
//                 if (resFinal.data.success) {
//                     localStorage.removeItem("jornada_inicio");
//                     setJornadaActiva(false);
//                     setSegundos(0);
//                     logout(); // Opcional
//                 }
//             }
//         } catch (error) {
//             Swal.fire('Error', 'No se pudo cerrar la jornada', 'error');
//         }
//     };

//     const login = async (nombre_usuario, password) => {
//         const response = await api.post("/auth/login", { nombre_usuario, password });
//         const { access_token, user: userData } = response.data;
//         localStorage.setItem("token", access_token);
//         localStorage.setItem("user", JSON.stringify(userData));
//         setUser(userData);
//     };

//     const logout = () => {
//         localStorage.clear();
//         setUser(null);
//         window.location.href = "/login";
//     };

//     const tienePermiso = (rolesPermitidos) => {
//         if (!user) return false;
//         const rolActual = user.role_name || user.role;
//         const permitido = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
//         return permitido.includes(rolActual);
//     };

//     return (
//         <AuthContext.Provider value={{ 
//             user, login, logout, tienePermiso,
//             tiempoTranscurrido: formatearTiempo(segundos),
//             jornadaActiva, handleEntrada, handleSalida 
//         }}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => useContext(AuthContext);
























// import { createContext, useState, useContext, useEffect } from "react";
// import api from "../services/api";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(
//     JSON.parse(localStorage.getItem("user")) || null
//   );

//   const login = async (nombre_usuario, password) => {
//     const response = await api.post("/auth/login", { nombre_usuario, password });

//     const token = response.data.access_token;
//     const userData = response.data.user;

//     // Guardamos todo
//     localStorage.setItem("token", token);
//     localStorage.setItem("user", JSON.stringify(userData));
//     localStorage.setItem("role", userData.role_name || userData.role);

//     setUser(userData);
//   };

//   const logout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("user");
//     localStorage.removeItem("role");
//     setUser(null);
//     window.location.href = "/login";
//   };

//   // Función de permisos reactiva
//   const tienePermiso = (rolesPermitidos) => {
//     if (!user) return false;
//     const rolActual = user.role_name || user.role;
//     const permitido = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
//     return permitido.includes(rolActual);
//   };

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token && user) logout();
//   }, [user]);

//   return (
//     <AuthContext.Provider value={{ user, login, logout, tienePermiso }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from "../../services/api";
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './styles/VistaPrincipal.css';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { Version } from '../../components/Version';
// import { Version } from '../../components/Version';


export const VistaPrincipal = () => {
    const [jornadaActiva, setJornadaActiva] = useState(false);
    const [horaInicio, setHoraInicio] = useState(null);
    const [tiempoTranscurrido, setTiempoTranscurrido] = useState("00:00:00");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [balance, setBalance] = useState(null);
    const [totalActividades, setTotalActividades] = useState(0);
    const [actividadesPendientes, setActividadesPendientes] = useState(0);
    const [resumenEstados, setResumenEstados] = useState({});
    const [resumenAreas, setResumenAreas] = useState({});

    const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];






    useEffect(() => {
        const fetchActividades = async () => {
            try {
                const res = await api.get('/ver-actividades');
                const actividades = res.data.data;

                // 🔹 Total general
                setTotalActividades(actividades.length);

                // 🔹 Pendientes (todas menos Finalizada)
                const pendientes = actividades.filter(act =>
                    act.estado !== 'Finalizada'
                );
                setActividadesPendientes(pendientes.length);

                // 🔹 Agrupar por estado
                const resumen = actividades.reduce((acc, act) => {
                    acc[act.estado] = (acc[act.estado] || 0) + 1;
                    return acc;
                }, {});

                setResumenEstados(resumen);
                const resumenPorArea = actividades.reduce((acc, act) => {
                    const nombreArea = act.area?.nombre || 'Sin área';
                    acc[nombreArea] = (acc[nombreArea] || 0) + 1;
                    return acc;
                }, {});

                setResumenAreas(resumenPorArea);

            } catch (error) {
                console.error("Error al cargar actividades:", error);
            }
        };

        fetchActividades();
    }, []);


    // 1. Verificar estado al cargar
    useEffect(() => {
        const verificarEstado = async () => {
            try {
                const res = await api.get('/jornada/estado');
                if (res.data.jornada_activa) {
                    setJornadaActiva(true);
                    setHoraInicio(new Date(res.data.datos.hora_entrada));
                }
            } catch (error) {
                console.error("Error al obtener estado");
            } finally {
                setLoading(false);
            }
        };
        verificarEstado();
    }, []);

    // 2. Lógica del Cronómetro
    useEffect(() => {
        let intervalo = null;

        if (jornadaActiva && horaInicio) {
            intervalo = setInterval(() => {
                const ahora = new Date();
                const diferenciaMs = ahora - horaInicio; // Diferencia en milisegundos

                // Cálculos matemáticos para tiempo
                const horas = Math.floor(diferenciaMs / 3600000);
                const minutos = Math.floor((diferenciaMs % 3600000) / 60000);
                const segundos = Math.floor((diferenciaMs % 60000) / 1000);

                // Formatear a 00:00:00
                const formato =
                    `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

                setTiempoTranscurrido(formato);
            }, 1000);
        } else {
            setTiempoTranscurrido("00:00:00");
            clearInterval(intervalo);
        }

        return () => clearInterval(intervalo); // Limpieza al desmontar
    }, [jornadaActiva, horaInicio]);

    const handleEntrada = async () => {
        try {
            const res = await api.post('/jornada/entrada');
            setHoraInicio(new Date(res.data.data.hora_entrada));
            setJornadaActiva(true);
        } catch (error) {
            alert("Error al iniciar jornada");
        }
    };


    const handleSalida = async () => {
        try {
            // PASO 1: Obtener el cálculo sin cerrar la jornada
            const resPreview = await api.get('/jornada/previsualizar-salida');
            const { tiempo_laboral, tiempo_actividades, diferencia_minutos } = resPreview.data.calculo;

            const esIncompleto = diferencia_minutos > 10; // Margen de 10 min

            // PASO 2: Mostrar el balance y preguntar qué hacer
            const decision = await Swal.fire({
                title: 'Resumen de Jornada Actual',
                html: `
                <div style="text-align: left; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
                    <p>⏱️ <b>Tiempo de trabajo:</b> ${tiempo_laboral}</p>
                    <p>📋 <b>Registrado en tareas:</b> ${tiempo_actividades}</p>
                    <hr>
                    <p style="color: ${esIncompleto ? '#d32f2f' : '#28a745'}; text-align: center; font-size: 1.1em;">
                        <b>Diferencia: ${diferencia_minutos} minutos</b><br>
                        <small>${esIncompleto ? '⚠️ Tienes tiempo sin justificar.' : '✅ ¡Tu registro está al día!'}</small>
                    </p>
                </div>
                <p style="margin-top: 15px;">¿Deseas finalizar tu jornada y cerrar sesión ahora?</p>
            `,
                icon: esIncompleto ? 'warning' : 'success',
                showCancelButton: true,
                confirmButtonText: 'Sí, finalizar y salir',
                cancelButtonText: 'No, completar registros',
                confirmButtonColor: esIncompleto ? '#f39c12' : '#28a745',
                cancelButtonColor: '#3085d6',
                allowOutsideClick: false
            });

            // PASO 3: Si confirma, llamar al endpoint de salida real
            if (decision.isConfirmed) {
                const resFinal = await api.post('/jornada/salida');
                if (resFinal.data.success) {
                    await Swal.fire({
                        title: '¡Sesión Cerrada!',
                        text: 'Tu jornada ha sido registrada. ¡Hasta mañana!',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo obtener el balance actual', 'error');
        }
    };
    const cargarBalance = async () => {
        try {
            const res = await api.get('/jornada/balance');
            setBalance(res.data.data);
        } catch (error) {
            console.error("Error al cargar balance");
        }
    };

    if (loading) return <p>Cargando...</p>;

    const dataEstados = Object.entries(resumenEstados).map(([estado, cantidad]) => ({
        name: estado.replace("_", " "),
        cantidad,
    }));

    const dataAreas = Object.entries(resumenAreas).map(([area, cantidad]) => ({
        name: area,
        cantidad,
    }));


    return (
        <>
            <div className="parent">
                <div className="navbar">
                    <Navbar />
                </div>
                <div className="sidebar">
                    <Sidebar />
                </div>



                <div className="registro-tiempo">
                    <h4 className='tiempo-principal'>Seguimiento de tiempo</h4>
                    <div>
                        {/* Visualización del Cronómetro */}
                        <div className='cronometro'>
                            {tiempoTranscurrido}
                        </div>

                        {!jornadaActiva ? (
                            <button className='entrada' onClick={handleEntrada}><span>Iniciar Entrada</span></button>
                        ) : (
                            <button className='salida' onClick={handleSalida}>Registrar Salida</button>
                        )}
                    </div>
                </div>



                <div className="cards">
                    <div className="tiempo-hoy">
                        <h4 className='titulo-cards'>Total actividades</h4>
                        <p>{totalActividades} actividades</p>
                    </div>
                    <div className="actv-pendientes">
                        <Link to="/actividades" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <h4 className='titulo-cards'>Actividades pendientes</h4>
                            <p>{actividadesPendientes} pendientes</p>
                        </Link>
                    </div>
                    <div className="reporte-jornadas">
                        <h4 className='titulo-cards'>Reporte semanal de tiempo</h4>
                        <p></p>
                    </div>
                </div>

                <div className="actividades">
                    <div className="tabla">
                        <h2>Mis actividades</h2>
                        <table className="tabla-resumen">
                            <thead>
                                <tr>
                                    <th>Estado</th>
                                    <th>Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(resumenEstados).map(([estado, cantidad]) => (
                                    <tr key={estado}>
                                        <td>{estado.replace('_', ' ')}</td>
                                        <td>{cantidad}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="tabla-2 tabla-scroll">
                        <h2>Actividades por área</h2>
                        <table className="tabla-resumen">
                            <thead>
                                <tr>
                                    <th>Área</th>
                                    <th>Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(resumenAreas).map(([area, cantidad]) => (
                                    <tr key={area}>
                                        <td>{area}</td>
                                        <td>{cantidad}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grafica">
                    <div className="grafica-1">
                        <h3>Actividades por Estado</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dataEstados}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="cantidad" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grafica-2">
                        <h3>Actividades por Área</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={dataAreas}
                                    dataKey="cantidad"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {dataAreas.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>

                    </div>
                </div>
                <div className="footer">
                    <Version />
                </div>
            </div>
        </>
    );
};


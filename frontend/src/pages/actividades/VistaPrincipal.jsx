import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from "../../services/api";
import { useAuth } from '../../context/AuthContext';
import './styles/VistaPrincipal.css';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    LabelList,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Treemap
} from "recharts";
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { Version } from '../../components/Version';

export const VistaPrincipal = () => {
    const {
        jornadaActiva,
        tiempoTranscurrido,
        handleEntrada,
        handleSalida
    } = useAuth();

    // ESTADOS
    const [loading, setLoading] = useState(true);
    const [actividadesRaw, setActividadesRaw] = useState([]); // Guardamos la data bruta para los memos
    const [totalActividades, setTotalActividades] = useState(0);
    const [actividadesPendientes, setActividadesPendientes] = useState(0);
    const [resumenEstados, setResumenEstados] = useState({});
    const [resumenAreas, setResumenAreas] = useState({});
    const [statsCumplimiento, setStatsCumplimiento] = useState({
        aTiempo: 0, conRetraso: 0, pctATiempo: 0, pctConRetraso: 0
    });

    const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];
    const COLORES_POR_AREA = {
        1: "#3498db", // ADMINISTRATIVA
        2: "#2ecc71", // ADMISIONES
        3: "#e74c3c", // AUTOMATIZACIÓN
        4: "#f1c40f", // BIENESTAR
        5: "#9b59b6", // CALIDAD
        6: "#1abc9c", // COMERCIAL
        7: "#e67e22", // CONTABILIDAD
        8: "#34495e", // DIRECCION
        9: "#16a085", // FACTURACIÓN Y CARTERA
        10: "#2980b9", // GESTIÓN HUMANA
        11: "#8e44ad", // INFRAESTRUCTURA
        12: "#2c3e50", // LOGISTICA
        13: "#d35400", // OPERACIONES
        14: "#c0392b", // SERVICIOS DE SALUD
        15: "#7f8c8d"  // TESORERIA
    };

    // Busca esta función en tu código
    const CustomizedContent = (props) => {
        const { x, y, width, height, name, fill } = props;

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                        fill: fill || '#127fa0ff',
                        stroke: '#fff',
                        strokeWidth: 2,
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.fillOpacity = 0.8;
                        e.target.style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.fillOpacity = 1;
                    }}
                />
                {/* Solo muestra el texto si el recuadro es lo suficientemente grande */}
                {width > 120 && height > 40 && (
                    <text
                        x={x + width / 2}
                        y={y + height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#fff"
                        fontSize="12"
                        fontWeight="bold"
                        pointerEvents="none"
                    >
                        {name}
                    </text>
                )}
            </g>
        );
    };

    useEffect(() => {
        const fetchActividades = async () => {
            try {
                const res = await api.get('/ver-actividades', {
                    params: { sin_paginar: 1 }
                });
                // Nota: Si usas paginación en Laravel, es res.data.data
                const actividades = res.data.data || res.data;
                setActividadesRaw(actividades);

                setTotalActividades(actividades.length);
                setActividadesPendientes(actividades.filter(act => act.estado !== 'Finalizada').length);

                // 1. Reducers de estados y áreas (se mantienen igual)
                const resumen = actividades.reduce((acc, act) => {
                    acc[act.estado] = (acc[act.estado] || 0) + 1;
                    return acc;
                }, {});
                setResumenEstados(resumen);

                const porArea = actividades.reduce((acc, act) => {
                    const nombreArea = act.area?.nombre || 'Sin área';
                    acc[nombreArea] = (acc[nombreArea] || 0) + 1;
                    return acc;
                }, {});
                setResumenAreas(porArea);

                // 2. FILTRAR FINALIZADAS PARA ESTADÍSTICAS DE CUMPLIMIENTO
                const finalizadas = actividades.filter(act => act.estado === 'Finalizada');
                const totalFin = finalizadas.length;

                let contadorATiempo = 0;
                let contadorRetrasoFecha = 0;
                let contadorExcedioMinutos = 0;



                finalizadas.forEach(act => {
                    // 1. Normalizamos Límite: de "2026-03-25 11:00:00" a "2026-03-25"
                    const fechaLimiteStr = act.fecha_finalizacion ? act.fecha_finalizacion.split(' ')[0] : null;

                    let fechaCierreStr = null;

                    // 2. Buscamos la evidencia más reciente
                    if (act.evidencias && act.evidencias.length > 0) {
                        const ultimaEv = act.evidencias.reduce((prev, curr) => {
                            return new Date(prev.updated_at) > new Date(curr.updated_at) ? prev : curr;
                        });
                        // 🚩 CORRECCIÓN AQUÍ: Usamos split('T') porque el log mostró formato ISO con T
                        fechaCierreStr = ultimaEv.updated_at ? ultimaEv.updated_at.split('T')[0] : null;
                    } else {
                        // Por si acaso, también aquí
                        fechaCierreStr = act.updated_at ? act.updated_at.split('T')[0] : null;
                    }

                    // 3. COMPARACIÓN
                    if (fechaLimiteStr && fechaCierreStr) {
                        // Ahora sí: "2026-03-25" <= "2026-03-25" es TRUE ✅
                        if (fechaCierreStr <= fechaLimiteStr) {
                            contadorATiempo++;
                        } else {
                            contadorRetrasoFecha++;
                        }
                    } else {
                        contadorRetrasoFecha++;
                    }
                    console.groupEnd();

                    // --- Lógica de minutos (igual que antes) ---
                    const totalMinutos = act.evidencias?.reduce((acc, ev) =>
                        acc + (Number(ev.minutos_ejecutados) || 0) + (Number(ev.minutos_extra) || 0), 0) || 0;

                    if (totalMinutos > (Number(act.minutos_planeados) || 0)) {
                        contadorExcedioMinutos++;
                    }
                });

                // 3. ACTUALIZAR ESTADO DE ESTADÍSTICAS
                setStatsCumplimiento({
                    aTiempo: contadorATiempo,
                    conRetraso: contadorRetrasoFecha,
                    excedioMinutos: contadorExcedioMinutos,
                    pctATiempo: totalFin > 0 ? ((contadorATiempo / totalFin) * 100).toFixed(1) : "0.0",
                    pctConRetraso: totalFin > 0 ? ((contadorRetrasoFecha / totalFin) * 100).toFixed(1) : "0.0",
                    pctExcedioMin: totalFin > 0 ? ((contadorExcedioMinutos / totalFin) * 100).toFixed(1) : "0.0"
                });

            } catch (error) {
                console.error("Error al cargar actividades:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchActividades();
    }, []);

    const [coloresAreas, setColoresAreas] = useState({});

    useEffect(() => {
        const cargarColores = async () => {
            try {
                const response = await api.get('/ver-areas');
                const areasArray = Array.isArray(response.data) ? response.data : response.data.data;

                const mapa = {};
                areasArray.forEach(area => {
                    mapa[area.id] = area.color;
                });
                // 💡 Cambiado para que coincida con el nombre de tu estado
                setColoresAreas(mapa);
            } catch (error) {
                console.error("Error cargando colores de áreas", error);
            }
        };

        cargarColores();
    }, []);

    // --- MEMORIZACIÓN DE DATOS (Evita parpadeos por cronómetro) ---

    const dataEstados = useMemo(() => {
        return Object.entries(resumenEstados).map(([estado, cantidad]) => ({
            name: estado.replace("_", " "),
            cantidad,
            porcentaje: totalActividades > 0 ? ((cantidad / totalActividades) * 100).toFixed(1) : 0
        }));
    }, [resumenEstados, totalActividades]);

    const dataAreas = useMemo(() => {
        if (actividadesRaw.length === 0) return [];

        const agrupado = actividadesRaw.reduce((acc, act) => {
            const areaId = act.area_id;
            const nombreArea = act.area?.nombre || 'Sin área';

            if (!acc[nombreArea]) {
                acc[nombreArea] = {
                    cantidad: 0,
                    // Buscamos el color en tu constante usando el ID
                    fill: COLORES_POR_AREA[areaId] || "#7f8c8d"
                };
            }
            acc[nombreArea].cantidad += 1;
            return acc;
        }, {});

        return Object.entries(agrupado).map(([name, info]) => ({
            name,
            cantidad: info.cantidad,
            fill: info.fill,
            porcentaje: totalActividades > 0 ? ((info.cantidad / totalActividades) * 100).toFixed(1) : 0
        }));
    }, [actividadesRaw, totalActividades]);

    // const memoComparativa = useMemo(() => {
    //     return actividadesRaw.slice(-10).map(act => {
    //         const planeados = act.minutos_planeados || 0;
    //         const ejecutados = act.minutos_ejecutados || 0;
    //         const extra = ejecutados > planeados ? ejecutados - planeados : 0;
    //         const cumplidos = ejecutados > planeados ? planeados : ejecutados;
    //         return {
    //             name: act.nombre.substring(0, 30) + '...',
    //             planeados, cumplidos, extra,
    //             porcentajeCumplimiento: planeados > 0 ? ((cumplidos / planeados) * 100).toFixed(1) : 0
    //         };
    //     });
    // }, [actividadesRaw]);

    const memoComparativa = useMemo(() => {
        // 1. Clonamos el array para no afectar el estado original
        return [...actividadesRaw]
            // 2. Ordenamos explícitamente por fecha (Más reciente PRIMERO)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            // 3. Cortamos los primeros 10 (Los 10 más nuevos que existen)
            .slice(0, 10)
            // 4. Invertimos el resultado para que en la gráfica el tiempo 
            // fluya de izquierda (pasado) a derecha (presente/más reciente)
            .reverse()
            .map(act => {
                const planeados = Number(act.minutos_planeados) || 0;

                // Cálculo de ejecución sumando minutos ejecutados y extra
                const totalEjecutadoEvidencias = act.evidencias?.reduce((acc, ev) => {
                    return acc + (Number(ev.minutos_ejecutados) || 0) + (Number(ev.minutos_extra) || 0);
                }, 0) || 0;

                const extra = totalEjecutadoEvidencias > planeados
                    ? totalEjecutadoEvidencias - planeados
                    : 0;

                const cumplidos = totalEjecutadoEvidencias > planeados
                    ? planeados
                    : totalEjecutadoEvidencias;

                return {
                    name: act.nombre.length > 25 ? act.nombre.substring(0, 25) + '...' : act.nombre,
                    planeados,
                    cumplidos,
                    extra,
                    porcentajeCumplimiento: planeados > 0
                        ? ((totalEjecutadoEvidencias / planeados) * 100).toFixed(1)
                        : 0
                };
            });
    }, [actividadesRaw]);



    const miArea = "Desarrollo";

    const dataTreemap = useMemo(() => {
        const ajenas = actividadesRaw.filter(act => act.area?.nombre?.toUpperCase() !== "DESARROLLO");

        const agrupado = ajenas.reduce((acc, act) => {
            const nombreArea = act.area?.nombre || 'OTRO';
            const areaId = act.area_id;

            if (!acc[nombreArea]) {
                acc[nombreArea] = {
                    size: 0,
                    fill: COLORES_POR_AREA[areaId] || "#94a3b8"
                };
            }
            acc[nombreArea].size += 1;
            return acc;
        }, {});

        return Object.entries(agrupado).map(([name, info]) => ({
            name,
            size: info.size,
            fill: info.fill
        }));
    }, [actividadesRaw]);

    if (loading) return <div className="loading-container"><p>Cargando dashboard...</p></div>;




    return (
        <div className="parent">
            <div className="navbar"><Navbar /></div>
            <div className="sidebar"><Sidebar /></div>

            <div className="registro-tiempo">
                <h4 className='tiempo-principal'>Seguimiento de tiempo</h4>
                <div>
                    <div className='cronometro'>{tiempoTranscurrido}</div>
                    {!jornadaActiva ? (
                        <button className='entrada' onClick={handleEntrada}>
                            <span>Iniciar Entrada</span>
                        </button>
                    ) : (
                        <button className='salida' onClick={handleSalida}>
                            Registrar Salida
                        </button>
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
                    <h4 className='titulo-cards'>Estado de jornada</h4>
                    <p>{jornadaActiva ? "🟢 En curso" : "🔴 Fuera de turno"}</p>
                </div>
            </div>

            <div className="actividades">
                <div className="tabla">
                    <h2>Mis actividades</h2>
                    <table className="tabla-resumen">
                        <thead>
                            <tr><th>Estado</th><th>Cantidad</th></tr>
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
                            <tr><th>Área</th><th>Cantidad</th></tr>
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
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis
                                allowDecimals={false}
                                domain={[0, 'dataMax + 1']}
                                tickCount={4}
                            />

                            <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.porcentaje}%)`, "Cantidad"]} />

                            <Bar dataKey="cantidad" fill="#6366f1" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                                <LabelList
                                    dataKey="porcentaje"
                                    position="top"
                                    offset={10} // 2. Añade un offset para que no pegue a la barra
                                    formatter={(val) => `${val}%`}
                                    style={{
                                        fill: '#6366f1',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        visibility: 'visible' // Fuerza la visibilidad
                                    }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grafica-2">
                    <h3>Distribución por Área</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={dataAreas}
                                dataKey="cantidad"
                                nameKey="name"
                                isAnimationActive={false}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, porcentaje }) => `${name}: ${porcentaje}%`}
                            >
                                {dataAreas.map((entry, index) => (
                                    // Aquí está el cambio clave: entry.fill
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Cards de Cumplimiento (Div corregido) */}
                <div className="cumplimiento-stats">
                    {/* Card Éxito: Fecha correcta */}
                    <div className="stat-card card-success">
                        <h5>Dentro de la fecha establecida</h5>
                        <p>{statsCumplimiento.aTiempo} <span>({statsCumplimiento.pctATiempo}%)</span></p>
                    </div>

                    {/* Card Advertencia: Se pasó de la fecha límite */}
                    <div className="stat-card card-warning">
                        <h5>Fuera de la fecha establecida</h5>
                        <p>
                            {statsCumplimiento.conRetraso}
                            <span>({statsCumplimiento.pctConRetraso}%)</span>
                        </p>
                    </div>

                    {/* Card Peligro: Se pasó de los minutos planeados */}
                    <div className="stat-card card-danger">
                        <h5>Fuera del tiempo establecido</h5>
                        <p>
                            {statsCumplimiento.excedioMinutos}
                            <span>({statsCumplimiento.pctExcedioMin}%)</span>
                        </p>
                    </div>
                </div>

                <div className="grafica-comparativa">
                    <h3>Comparativa de Tiempos (Últimas 10 actividades)</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={memoComparativa}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="planeados" fill="#127fa0ff" name="Meta Planeada" isAnimationActive={false}>
                                {/*                                 
                                <LabelList
                                    dataKey="porcentajeCumplimiento"
                                    position="insideTop"
                                    formatter={(val) => `${val}%`}
                                    style={{ fill: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                                /> */}
                            </Bar>

                            <Bar dataKey="cumplidos" stackId="a" fill="#22c55e" name="Cumplidos" isAnimationActive={false}>
                                <LabelList dataKey="porcentajeCumplimiento" position="insideTop" formatter={(val) => `${val}%`} style={{ fill: '#fff', fontSize: '11px', fontWeight: 'bold' }} />
                            </Bar>

                            <Bar dataKey="extra" stackId="a" fill="#ef4444" name="Minutos Extra" isAnimationActive={false}>
                                <LabelList dataKey="extra" position="top" formatter={(val) => val > 0 ? `+${val}m` : ''} style={{ fill: '#ef4444', fontSize: '12px' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grafica-ajena treemap-container">
                    <h3>Distribución de Tareas Ajenas</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <Treemap
                            data={dataTreemap}
                            dataKey="size"
                            aspectRatio={4 / 3}
                            // 2. Aquí vinculas la función que definiste arriba
                            content={<CustomizedContent />}
                        >
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none' }}
                                // 3. Asegúrate de que el Tooltip muestre el nombre del área
                                formatter={(value, name, props) => [`${value} Actividades`, `Área: ${props.payload.name}`]}
                            />
                        </Treemap>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="footer"><Version /></div>
        </div>
    );
};













































// import { useEffect, useMemo, useState } from 'react';
// import { Link } from 'react-router-dom';
// import api from "../../services/api";
// import { useAuth } from '../../context/AuthContext';
// import './styles/VistaPrincipal.css';
// import {
//     BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
//     ResponsiveContainer, PieChart, Pie, Cell, Legend,
//     LabelList,
//     RadarChart,
//     PolarGrid,
//     PolarAngleAxis,
//     PolarRadiusAxis,
//     Radar,
//     Treemap
// } from "recharts";
// import { Sidebar } from '../../components/Sidebar';
// import { Navbar } from '../../components/Navbar';
// import { Version } from '../../components/Version';

// export const VistaPrincipal = () => {
//     const {
//         jornadaActiva,
//         tiempoTranscurrido,
//         handleEntrada,
//         handleSalida
//     } = useAuth();

//     // ESTADOS
//     const [loading, setLoading] = useState(true);
//     const [actividadesRaw, setActividadesRaw] = useState([]); // Guardamos la data bruta para los memos
//     const [totalActividades, setTotalActividades] = useState(0);
//     const [actividadesPendientes, setActividadesPendientes] = useState(0);
//     const [resumenEstados, setResumenEstados] = useState({});
//     const [resumenAreas, setResumenAreas] = useState({});
//     const [statsCumplimiento, setStatsCumplimiento] = useState({
//         aTiempo: 0, conRetraso: 0, pctATiempo: 0, pctConRetraso: 0
//     });

//     const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6"];
//     const COLORES_POR_AREA = {
//         1: "#3498db", // ADMINISTRATIVA
//         2: "#2ecc71", // ADMISIONES
//         3: "#e74c3c", // AUTOMATIZACIÓN
//         4: "#f1c40f", // BIENESTAR
//         5: "#9b59b6", // CALIDAD
//         6: "#1abc9c", // COMERCIAL
//         7: "#e67e22", // CONTABILIDAD
//         8: "#34495e", // DIRECCION
//         9: "#16a085", // FACTURACIÓN Y CARTERA
//         10: "#2980b9", // GESTIÓN HUMANA
//         11: "#8e44ad", // INFRAESTRUCTURA
//         12: "#2c3e50", // LOGISTICA
//         13: "#d35400", // OPERACIONES
//         14: "#c0392b", // SERVICIOS DE SALUD
//         15: "#7f8c8d"  // TESORERIA
//     };

//     // Busca esta función en tu código
//     const CustomizedContent = (props) => {
//         const { root, depth, x, y, width, height, index, name, fill } = props; // <--- Agrega 'fill' aquí

//         return (
//             <g>
//                 <rect
//                     x={x}
//                     y={y}
//                     width={width}
//                     height={height}
//                     style={{
//                         // ANTES: fill: COLORS_AREAS[index % COLORS_AREAS.length]
//                         // AHORA: Usa el fill que viene de la data
//                         fill: fill || '#7f8c8d',
//                         stroke: '#fff',
//                         strokeWidth: 2,
//                     }}
//                 />
//                 {depth === 1 && (
//                     <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={12}>
//                         {name}
//                     </text>
//                 )}
//             </g>
//         );
//     };

//     useEffect(() => {
//         const fetchActividades = async () => {
//             try {
//                 const res = await api.get('/ver-actividades');
//                 const actividades = res.data.data;
//                 setActividadesRaw(actividades); // Guardamos para useMemo

//                 setTotalActividades(actividades.length);
//                 setActividadesPendientes(actividades.filter(act => act.estado !== 'Finalizada').length);

//                 const resumen = actividades.reduce((acc, act) => {
//                     acc[act.estado] = (acc[act.estado] || 0) + 1;
//                     return acc;
//                 }, {});
//                 setResumenEstados(resumen);

//                 const porArea = actividades.reduce((acc, act) => {
//                     const nombreArea = act.area?.nombre || 'Sin área';
//                     acc[nombreArea] = (acc[nombreArea] || 0) + 1;
//                     return acc;
//                 }, {});
//                 setResumenAreas(porArea);

//                 const finalizadas = actividades.filter(act => act.estado === 'Finalizada');
//                 const aTiempo = finalizadas.filter(act => act.minutos_ejecutados <= act.minutos_planeados).length;
//                 const conRetraso = finalizadas.filter(act => act.minutos_ejecutados > act.minutos_planeados).length;
//                 const totalFin = aTiempo + conRetraso;

//                 setStatsCumplimiento({
//                     aTiempo,
//                     conRetraso,
//                     pctATiempo: totalFin > 0 ? ((aTiempo / totalFin) * 100).toFixed(1) : 0,
//                     pctConRetraso: totalFin > 0 ? ((conRetraso / totalFin) * 100).toFixed(1) : 0
//                 });

//             } catch (error) {
//                 console.error("Error al cargar actividades:", error);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchActividades();
//     }, []);

//     const [coloresAreas, setColoresAreas] = useState({});

//     useEffect(() => {
//         const cargarColores = async () => {
//             try {
//                 const response = await api.get('/ver-areas');
//                 // Extraemos el array 'data' si viene paginado, si no, usamos el response.data directamente
//                 const areasArray = Array.isArray(response.data) ? response.data : response.data.data;

//                 const mapa = {};
//                 areasArray.forEach(area => {
//                     mapa[area.id] = area.color;
//                 });
//                 setMapaAreas(mapa);
//             } catch (error) {
//                 console.error("Error cargando colores de áreas", error);
//             }
//         };
//     }, []);

//     // --- MEMORIZACIÓN DE DATOS (Evita parpadeos por cronómetro) ---

//     const dataEstados = useMemo(() => {
//         return Object.entries(resumenEstados).map(([estado, cantidad]) => ({
//             name: estado.replace("_", " "),
//             cantidad,
//             porcentaje: totalActividades > 0 ? ((cantidad / totalActividades) * 100).toFixed(1) : 0
//         }));
//     }, [resumenEstados, totalActividades]);

//     const dataAreas = useMemo(() => {
//         if (actividadesRaw.length === 0) return [];

//         const agrupado = actividadesRaw.reduce((acc, act) => {
//             const areaId = act.area_id;
//             const nombreArea = act.area?.nombre || 'Sin área';

//             if (!acc[nombreArea]) {
//                 acc[nombreArea] = {
//                     cantidad: 0,
//                     // Buscamos el color en tu constante usando el ID
//                     fill: COLORES_POR_AREA[areaId] || "#7f8c8d"
//                 };
//             }
//             acc[nombreArea].cantidad += 1;
//             return acc;
//         }, {});

//         return Object.entries(agrupado).map(([name, info]) => ({
//             name,
//             cantidad: info.cantidad,
//             fill: info.fill,
//             porcentaje: totalActividades > 0 ? ((info.cantidad / totalActividades) * 100).toFixed(1) : 0
//         }));
//     }, [actividadesRaw, totalActividades]);

//     // const memoComparativa = useMemo(() => {
//     //     return actividadesRaw.slice(-10).map(act => {
//     //         const planeados = act.minutos_planeados || 0;
//     //         const ejecutados = act.minutos_ejecutados || 0;
//     //         const extra = ejecutados > planeados ? ejecutados - planeados : 0;
//     //         const cumplidos = ejecutados > planeados ? planeados : ejecutados;
//     //         return {
//     //             name: act.nombre.substring(0, 30) + '...',
//     //             planeados, cumplidos, extra,
//     //             porcentajeCumplimiento: planeados > 0 ? ((cumplidos / planeados) * 100).toFixed(1) : 0
//     //         };
//     //     });
//     // }, [actividadesRaw]);

//     const memoComparativa = useMemo(() => {
//         return actividadesRaw.slice(-10).map(act => {
//             const planeados = Number(act.minutos_planeados) || 0;

//             // SUMAMOS las evidencias asociadas a esta actividad
//             // Asumiendo que 'act.evidencias' es un array que viene de tu API
//             const totalEjecutadoEvidencias = act.evidencias?.reduce((acc, ev) => {
//                 return acc + (Number(ev.minutos_ejecutados) || 0) + (Number(ev.minutos_extra) || 0);
//             }, 0) || 0;

//             // Determinamos el extra (lo que superó la planeación)
//             const extra = totalEjecutadoEvidencias > planeados
//                 ? totalEjecutadoEvidencias - planeados
//                 : 0;

//             // El cumplimiento es el tiempo trabajado que NO es extra (tope de planeación)
//             const cumplidos = totalEjecutadoEvidencias > planeados
//                 ? planeados
//                 : totalEjecutadoEvidencias;

//             return {
//                 name: act.nombre.length > 25 ? act.nombre.substring(0, 25) + '...' : act.nombre,
//                 planeados,
//                 cumplidos,
//                 extra,
//                 porcentajeCumplimiento: planeados > 0
//                     ? ((totalEjecutadoEvidencias / planeados) * 100).toFixed(1)
//                     : 0
//             };
//         });
//     }, [actividadesRaw]);



//     const miArea = "Desarrollo";

//     const dataTreemap = useMemo(() => {
//         const ajenas = actividadesRaw.filter(act => act.area?.nombre?.toUpperCase() !== "DESARROLLO");

//         const agrupado = ajenas.reduce((acc, act) => {
//             const nombreArea = act.area?.nombre || 'OTRO';
//             const areaId = act.area_id;

//             if (!acc[nombreArea]) {
//                 acc[nombreArea] = {
//                     size: 0,
//                     fill: COLORES_POR_AREA[areaId] || "#94a3b8"
//                 };
//             }
//             acc[nombreArea].size += 1;
//             return acc;
//         }, {});

//         return Object.entries(agrupado).map(([name, info]) => ({
//             name,
//             size: info.size,
//             fill: info.fill
//         }));
//     }, [actividadesRaw]);

//     if (loading) return <div className="loading-container"><p>Cargando dashboard...</p></div>;


//     return (
//         <div className="parent">
//             <div className="navbar"><Navbar /></div>
//             <div className="sidebar"><Sidebar /></div>

//             <div className="registro-tiempo">
//                 <h4 className='tiempo-principal'>Seguimiento de tiempo</h4>
//                 <div>
//                     <div className='cronometro'>{tiempoTranscurrido}</div>
//                     {!jornadaActiva ? (
//                         <button className='entrada' onClick={handleEntrada}>
//                             <span>Iniciar Entrada</span>
//                         </button>
//                     ) : (
//                         <button className='salida' onClick={handleSalida}>
//                             Registrar Salida
//                         </button>
//                     )}
//                 </div>
//             </div>

//             <div className="cards">
//                 <div className="tiempo-hoy">
//                     <h4 className='titulo-cards'>Total actividades</h4>
//                     <p>{totalActividades} actividades</p>
//                 </div>
//                 <div className="actv-pendientes">
//                     <Link to="/actividades" style={{ textDecoration: 'none', color: 'inherit' }}>
//                         <h4 className='titulo-cards'>Actividades pendientes</h4>
//                         <p>{actividadesPendientes} pendientes</p>
//                     </Link>
//                 </div>
//                 <div className="reporte-jornadas">
//                     <h4 className='titulo-cards'>Estado de jornada</h4>
//                     <p>{jornadaActiva ? "🟢 En curso" : "🔴 Fuera de turno"}</p>
//                 </div>
//             </div>

//             <div className="actividades">
//                 <div className="tabla">
//                     <h2>Mis actividades</h2>
//                     <table className="tabla-resumen">
//                         <thead>
//                             <tr><th>Estado</th><th>Cantidad</th></tr>
//                         </thead>
//                         <tbody>
//                             {Object.entries(resumenEstados).map(([estado, cantidad]) => (
//                                 <tr key={estado}>
//                                     <td>{estado.replace('_', ' ')}</td>
//                                     <td>{cantidad}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>

//                 <div className="tabla-2 tabla-scroll">
//                     <h2>Actividades por área</h2>
//                     <table className="tabla-resumen">
//                         <thead>
//                             <tr><th>Área</th><th>Cantidad</th></tr>
//                         </thead>
//                         <tbody>
//                             {Object.entries(resumenAreas).map(([area, cantidad]) => (
//                                 <tr key={area}>
//                                     <td>{area}</td>
//                                     <td>{cantidad}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>

//             <div className="grafica">
//                 <div className="grafica-1">
//                     <h3>Actividades por Estado</h3>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <BarChart data={dataEstados}>
//                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                             <XAxis dataKey="name" />
//                             <YAxis
//                                 allowDecimals={false}
//                                 domain={[0, 'dataMax + 1']}
//                                 tickCount={4}
//                             />

//                             <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.porcentaje}%)`, "Cantidad"]} />

//                             <Bar dataKey="cantidad" fill="#6366f1" radius={[8, 8, 0, 0]} isAnimationActive={false}>
//                                 <LabelList
//                                     dataKey="porcentaje"
//                                     position="top"
//                                     offset={10} // 2. Añade un offset para que no pegue a la barra
//                                     formatter={(val) => `${val}%`}
//                                     style={{
//                                         fill: '#6366f1',
//                                         fontSize: '12px',
//                                         fontWeight: 'bold',
//                                         visibility: 'visible' // Fuerza la visibilidad
//                                     }}
//                                 />
//                             </Bar>
//                         </BarChart>
//                     </ResponsiveContainer>
//                 </div>

//                 <div className="grafica-2">
//                     <h3>Distribución por Área</h3>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <PieChart>
//                             <Pie
//                                 data={dataAreas}
//                                 dataKey="cantidad"
//                                 nameKey="name"
//                                 isAnimationActive={false}
//                                 cx="50%"
//                                 cy="50%"
//                                 outerRadius={80}
//                                 label={({ name, porcentaje }) => `${name}: ${porcentaje}%`}
//                             >
//                                 {dataAreas.map((entry, index) => (
//                                     // Aquí está el cambio clave: entry.fill
//                                     <Cell key={`cell-${index}`} fill={entry.fill} />
//                                 ))}
//                             </Pie>
//                             <Tooltip />
//                             <Legend />
//                         </PieChart>
//                     </ResponsiveContainer>
//                 </div>

//                 {/* Cards de Cumplimiento (Div corregido) */}
//                 <div className="cumplimiento-stats">
//                     <div className="stat-card card-success">
//                         <h5>Cumplidas a Tiempo</h5>
//                         <p>{statsCumplimiento.aTiempo} <span>({statsCumplimiento.pctATiempo}%)</span></p>
//                     </div>
//                     <div className="stat-card card-danger">
//                         <h5>Excedieron Tiempo</h5>
//                         <p>{statsCumplimiento.conRetraso} <span>({statsCumplimiento.pctConRetraso}%)</span></p>
//                     </div>
//                 </div>

//                 <div className="grafica-comparativa">
//                     <h3>Comparativa de Tiempos (Últimas 10 actividades)</h3>
//                     <ResponsiveContainer width="100%" height={400}>
//                         <BarChart data={memoComparativa}>
//                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
//                             <XAxis dataKey="name" />
//                             <YAxis label={{ value: 'Minutos', angle: -90, position: 'insideLeft' }} />
//                             <Tooltip />
//                             <Legend />
//                             <Bar dataKey="planeados" fill="#127fa0ff" name="Meta Planeada" isAnimationActive={false}>
//                                 {/*
//                                 <LabelList
//                                     dataKey="porcentajeCumplimiento"
//                                     position="insideTop"
//                                     formatter={(val) => `${val}%`}
//                                     style={{ fill: '#fff', fontSize: '11px', fontWeight: 'bold' }}
//                                 /> */}
//                             </Bar>

//                             <Bar dataKey="cumplidos" stackId="a" fill="#22c55e" name="Cumplidos" isAnimationActive={false}>
//                                 <LabelList dataKey="porcentajeCumplimiento" position="insideTop" formatter={(val) => `${val}%`} style={{ fill: '#fff', fontSize: '11px', fontWeight: 'bold' }} />
//                             </Bar>

//                             <Bar dataKey="extra" stackId="a" fill="#ef4444" name="Minutos Extra" isAnimationActive={false}>
//                                 <LabelList dataKey="extra" position="top" formatter={(val) => val > 0 ? `+${val}m` : ''} style={{ fill: '#ef4444', fontSize: '12px' }} />
//                             </Bar>
//                         </BarChart>
//                     </ResponsiveContainer>
//                 </div>

//                 <div className="grafica-ajena treemap-container">
//                     <h3>Distribución de Tareas Ajenas </h3>
//                     <ResponsiveContainer width="100%" height={400}>
//                         <Treemap
//                             data={dataTreemap}
//                             dataKey="size"
//                             aspectRatio={4 / 3}
//                             content={<CustomizedContent />} // Tu componente ahora maneja el color
//                         >
//                             <Tooltip
//                                 contentStyle={{ borderRadius: '8px', border: 'none' }}
//                                 formatter={(value) => [`${value} Actividades`, 'Cantidad']}
//                             />
//                         </Treemap>
//                     </ResponsiveContainer>
//                 </div>
//             </div>
//             <div className="footer"><Version /></div>
//         </div>
//     );
// };

















































































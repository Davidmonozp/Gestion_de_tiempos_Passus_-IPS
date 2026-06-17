import React, { useState, useEffect } from 'react';
import './styles/FiltrosActividades.css';
import api from '../services/api';
import { tienePermiso } from '../utils/Permisos';

export const FiltrosActividades = ({ filtros, setFiltros, onApply, onClear }) => {
    // 1. Estados definidos una sola vez
    const [areas, setAreas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    // 2. Carga de datos
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Usamos el archivo 'api' que mencionaste
                const [resAreas, resUsuarios] = await Promise.all([
                    api.get('/ver-areas'),
                    api.get('/ver-usuarios')
                ]);

                // IMPORTANTE: Si tu API responde con un objeto { data: [...] }, 
                // usa resAreas.data.data o resAreas.data
                setAreas(resAreas.data.data);
                setUsuarios(resUsuarios.data.data);
            } catch (error) {
                console.error("Error al cargar datos:", error);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, [name]: value }));
    };
    const handleClear = () => {
        const filtrosVacios = {
            id: '', nombre: '', estado: '',
            fecha_desde: '', fecha_hasta: '',
            area_id: '', asignado_a: ''
        };

        // 1. Limpiamos el estado local de los inputs
        setFiltros(filtrosVacios);

        // 2. Avisamos al padre que limpie y recargue
        onClear();
    };
    return (
        <>
            <div className="filtros-container">
                {/* <input name="id" placeholder="ID" type="number" onChange={handleChange} value={filtros.id || ''} /> */}
                <div className="input-container">
                    <label htmlFor="id">ID</label>
                    <input
                        id="id"
                        name="id"
                        placeholder="Buscar por ID"
                        type="number"
                        onChange={handleChange}
                        value={filtros.id || ''}
                    />
                </div>
                <div className="input-container">
                    <label htmlFor="nombre">Nombre de la actividad</label>
                    <input
                        id="nombre"
                        name="nombre"
                        placeholder="Buscar actividad"
                        type="text"
                        onChange={handleChange}
                        value={filtros.nombre || ''}
                    />
                </div>
                {/* <input name="nombre" placeholder="Nombre de la actividad" type="text" onChange={handleChange} value={filtros.nombre || ''} /> */}
                <div className="input-container">
                    <label htmlFor="estados">Estado</label>
                    <select name="estado" onChange={handleChange} value={filtros.estado || ''}>
                        <option value="">Todos los estados</option>
                        <option value="Programada">Programada</option>
                        <option value="Ejecución">En Ejecución</option>
                        <option value="Finalizada">Finalizada</option>
                        <option value="Por_corregir">Por corregir</option>
                        <option value="Aplazada">Aplazada</option>
                        <option value="Cancelada">Cancelada</option>
                    </select>
                </div>

                <div className="input-container">
                    <label>Fecha inicio</label>
                    <input name="fecha_desde" type="date" onChange={handleChange} value={filtros.fecha_desde || ''} />
                </div>
                <div className="input-container">
                    <label>Fecha fin</label>
                    <input name="fecha_hasta" type="date" onChange={handleChange} value={filtros.fecha_hasta || ''} />
                </div>

                {tienePermiso(["JefeInmediato", "Administrador"]) && (
                    <>
                        <div className="input-container">
                            <label htmlFor="areas">Área</label>
                            <select name="area_id" onChange={handleChange} value={filtros.area_id || ''}>
                                <option value="">Todas las áreas</option>
                                {areas && areas.map((area) => (
                                    <option key={area.id} value={area.id}>{area.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-container">
                            <label htmlFor="colaboradores">Colaborador</label>
                            <select name="asignado_a" onChange={handleChange} value={filtros.asignado_a || ''}>
                                <option value="">Todos los colaboradores</option>
                                {usuarios && usuarios.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.nombre_completo || user.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </>
                )}
                <div className="button-actions-container">
                    <button type="button" onClick={handleClear} className="btn-limpiar">
                        <i className="fa-solid fa-eraser"></i> Limpiar Filtros
                    </button>
                    <button type="button" onClick={onApply} className="btn-aplicar">
                        <i className="fa-solid fa-filter"></i> Aplicar Filtros
                    </button>
                </div>
            </div>
            <h3></h3>
        </>
    );
};


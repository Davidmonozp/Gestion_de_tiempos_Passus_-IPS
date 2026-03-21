import React, { useEffect, useState } from 'react';
import {
    LayoutGrid, List, Search, UserPlus, Mail,
    ShieldCheck, Edit2, Eye, Trash2, Briefcase
} from 'lucide-react';
import './styles/ListarUsuarios.css';
import api from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Version } from '../../components/Version';
import { useNavigate } from 'react-router-dom';

export const ListarUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

  
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

    const fetchUsuarios = async () => {
        const res = await api.get('/ver-usuarios');
        setUsuarios(res.data.data);
    };

    useEffect(() => { fetchUsuarios(); }, []);

    const filteredUsuarios = usuarios.filter(u =>
        u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.rol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Función para obtener el color basado en la primera área del usuario
    const getAreaColor = (userAreas) => {
        if (userAreas && userAreas.length > 0) {
            const areaId = userAreas[0].id;
            return COLORES_POR_AREA[areaId] || "#cccccc"; // Gris si no encuentra el ID
        }
        return "#cccccc"; // Color por defecto si no tiene áreas
    };
      const goToCreate = () => {
        navigate('/crear-usuario'); 
    };


    return (
        <>
            <Navbar />
            <div className="container-usuarios">

                <Sidebar />

                <main className="content-container">
                    <div className="usuarios-view">
                        <div className="view-controls">
                            <div className="search-box">
                                <Search size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar personal..."
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="action-buttons">
                                <div className="view-switcher">
                                    <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
                                        <LayoutGrid size={20} />
                                    </button>
                                    <button className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>
                                        <List size={20} />
                                    </button>
                                </div>
                                <button className="btn-new-user" onClick={goToCreate}>
                                    <i className="fa-solid fa-user-plus"></i>
                                </button>
                            </div>
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="users-cards-container">
                                {filteredUsuarios.map(u => {
                                    const areaColor = getAreaColor(u.areas);
                                    return (
                                        <div key={u.id} className="user-card" style={{ borderTop: `4px solid ${areaColor}` }}>
                                            <div className="user-card-header">
                                                <div className="user-avatar" style={{ backgroundColor: areaColor }}>
                                                    {u.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                {/* El badge del rol ahora toma el color del área con opacidad */}
                                                <span className="role-tag" style={{ backgroundColor: `${areaColor}20`, color: areaColor }}>
                                                    {u.rol}
                                                </span>
                                            </div>
                                            <div className="user-card-content">
                                                <h3>{u.nombre_completo}</h3>
                                                <p className="username">@{u.nombre_usuario}</p>
                                                <div className="info-item email-text">
                                                    <Mail size={14} /> <span>{u.email}</span>
                                                </div>
                                                <div className="areas-list">
                                                    {u.areas.map(a => (
                                                        <span key={a.id} className="area-badge" style={{ color: COLORES_POR_AREA[a.id] }}>
                                                            <Briefcase size={12} /> {a.nombre}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="user-card-actions">
                                                <button className="btn-icon-view"><i className="fa-solid fa-eye"></i></button>
                                                <button className="btn-icon-edit"><i className="fa-regular fa-pen-to-square"></i></button>
                                                <button className="btn-icon-delete"><i className="fa-regular fa-trash-can"></i></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="users-table-wrapper">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Email</th>
                                            <th>Áreas</th>
                                            <th>Rol</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsuarios.map(u => {
                                            const areaColor = getAreaColor(u.areas);
                                            return (
                                                <tr key={u.id}>
                                                    <td className="td-user">
                                                        <div className="td-avatar" style={{ backgroundColor: areaColor }}>
                                                            {u.nombre.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <strong>{u.nombre_completo}</strong>
                                                            <br /><small>@{u.nombre_usuario}</small>
                                                        </div>
                                                    </td>
                                                    <td className="email-cell">{u.email}</td>
                                                    <td>
                                                        <div className="td-areas">
                                                            {u.areas.map(a => (
                                                                <span key={a.id} className="chip" style={{
                                                                    backgroundColor: `${COLORES_POR_AREA[a.id]}15`,
                                                                    color: COLORES_POR_AREA[a.id],
                                                                    border: `1px solid ${COLORES_POR_AREA[a.id]}40`
                                                                }}>
                                                                    {a.nombre}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="role-pill" style={{ backgroundColor: `${areaColor}20`, color: areaColor }}>
                                                            {u.rol}
                                                        </span>
                                                    </td>
                                                    <td className="td-actions">
                                                        <button className="action-btn view"><Eye size={16} /></button>
                                                        <button className="action-btn edit"><Edit2 size={16} /></button>
                                                        <button className="action-btn delete"><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            <Version />
        </>
    );
};
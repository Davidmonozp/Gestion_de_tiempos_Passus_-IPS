import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export const ListaUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);

    const fetchUsuarios = async () => {
        const res = await api.get('/usuarios');
        setUsuarios(res.data.data);
    };

    useEffect(() => { fetchUsuarios(); }, []);

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Áreas / Cargo</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {usuarios.map(u => (
                        <tr key={u.id}>
                            <td>{u.nombre_completo} <br/><small>{u.nombre_usuario}</small></td>
                            <td>{u.email}</td>
                            <td>
                                {u.areas.map(a => (
                                    <span key={a.id} className={`badge ${a.tipo === 'Jefe' ? 'bg-gold' : 'bg-blue'}`}>
                                        {a.nombre} ({a.tipo})
                                    </span>
                                ))}
                            </td>
                            <td>{u.rol}</td>
                            <td>
                                <button onClick={() => console.log("Editar", u.id)}>✏️</button>
                                <button onClick={() => console.log("Ver Detalle", u.id)}>👁️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
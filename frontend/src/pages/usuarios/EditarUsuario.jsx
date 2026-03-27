import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import api from '../../services/api';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Version } from '../../components/Version';
import {
    User, IdCard, Mail, Lock, Briefcase,
    Save, ArrowLeft, Loader2, ChevronDown
} from 'lucide-react';
import "./styles/EditarUsuario.css";

export const EditarUsuario = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Estados para datos externos
    const [roles, setRoles] = useState([]);
    const [areasDisponibles, setAreasDisponibles] = useState([]);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // 1. Esquema de Validación (Igual al de creación, pero password opcional)
    const validationSchema = Yup.object().shape({
        nombre: Yup.string().required('Requerido'),
        apellido: Yup.string().required('Requerido'),
        segundo_apellido: Yup.string().required('Requerido'),
        tipo_documento: Yup.string().required('Requerido'),
        numero_documento: Yup.string().required('Requerido'),
        nombre_usuario: Yup.string().required('Requerido'),
        email: Yup.string().email('Email inválido').required('Requerido'),
        cargo: Yup.string().required('Requerido'),
        rol_nombre: Yup.string().required('Requerido'),
        area_id: Yup.array().min(1, 'Seleccione al menos un área'),
        password: Yup.string().min(6, 'Mínimo 6 caracteres'), // Opcional en edición
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resRoles, resAreas, resUser] = await Promise.all([
                    api.get('/ver-roles'),
                    api.get('/ver-areas'),
                    api.get(`/ver-usuario/${id}`)
                ]);

                setRoles(Array.isArray(resRoles.data) ? resRoles.data : resRoles.data.data || []);
                setAreasDisponibles(Array.isArray(resAreas.data) ? resAreas.data : resAreas.data.data || []);

                const u = resUser.data.data;
                setUserData({
                    nombre: u.nombre || '',
                    segundo_nombre: u.segundo_nombre || '',
                    apellido: u.apellido || '',
                    segundo_apellido: u.segundo_apellido || '',
                    tipo_documento: u.tipo_documento || '',
                    numero_documento: u.numero_documento || '',
                    nombre_usuario: u.nombre_usuario || '',
                    email: u.email || '',
                    password: '',
                    cargo: u.cargo || '',
                    rol_nombre: u.rol || '',
                    // Importante: Convertir IDs a String para que el checkbox haga match
                    area_id: u.areas ? u.areas.map(a => a.id.toString()) : []
                });
            } catch (error) {
                Swal.fire('Error', 'No se pudo cargar la información', 'error');
                navigate('/usuarios');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            await api.put(`/editar-usuario/${id}`, values);
            Swal.fire('¡Éxito!', 'Usuario actualizado correctamente', 'success');
            navigate('/usuarios');
        } catch (error) {
            Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !userData) {
        return (
            <div className="loading-full">
                <Loader2 className="spin" size={40} />
                <p>Cargando datos del colaborador...</p>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container-usuarios">
                <Sidebar />

                <div className="editar-usuario-container">
                    <header className="form-header">
                        <button className="btn-back" onClick={() => navigate('/usuarios')}>
                            <ArrowLeft size={20} />
                        </button>
                        <div className="header-text">
                            <h2>Editar Perfil de Usuario</h2>
                            <p>Modifique los campos necesarios para actualizar al colaborador</p>
                        </div>
                    </header>

                    <Formik
                        initialValues={userData}
                        validationSchema={validationSchema}
                        onSubmit={handleSubmit}
                        enableReinitialize={true} // Crucial para que cargue cuando userData deje de ser null
                    >
                        {({ isSubmitting, values, setFieldValue }) => (
                            <Form className="modern-form">
                                <div className="form-sections-grid">

                                    {/* SECCIÓN 1: DATOS PERSONALES */}
                                    <section className="form-section">
                                        <div className="section-title">
                                            <User size={18} /> <h3>Información Personal</h3>
                                        </div>
                                        <div className="fields-grid">
                                            <div className="form-group">
                                                <label>Primer Nombre*</label>
                                                <Field name="nombre" type="text" />
                                                <ErrorMessage name="nombre" component="span" className="error-msg" />
                                            </div>
                                            <div className="form-group">
                                                <label>Segundo Nombre</label>
                                                <Field name="segundo_nombre" type="text" />
                                            </div>
                                            <div className="form-group">
                                                <label>Primer Apellido*</label>
                                                <Field name="apellido" type="text" />
                                                <ErrorMessage name="apellido" component="span" className="error-msg" />
                                            </div>
                                            <div className="form-group">
                                                <label>Segundo Apellido*</label>
                                                <Field name="segundo_apellido" type="text" />
                                                <ErrorMessage name="segundo_apellido" component="span" className="error-msg" />
                                            </div>
                                        </div>
                                    </section>

                                    {/* SECCIÓN 2: IDENTIFICACIÓN Y ACCESO */}
                                    <section className="form-section">
                                        <div className="section-title">
                                            <IdCard size={18} /> <h3>Identificación y Acceso</h3>
                                        </div>
                                        <div className="fields-grid">
                                            <div className="form-group">
                                                <label>Tipo Documento*</label>
                                                <Field as="select" name="tipo_documento">
                                                    <option value="">Seleccione...</option>
                                                    <option value="CC">Cédula de Ciudadanía</option>
                                                    <option value="CE">Cédula de Extranjería</option>
                                                </Field>
                                                <ErrorMessage name="tipo_documento" component="span" className="error-msg" />
                                            </div>
                                            <div className="form-group">
                                                <label>No. Documento*</label>
                                                <Field name="numero_documento" type="text" />
                                                <ErrorMessage name="numero_documento" component="span" className="error-msg" />
                                            </div>
                                            <div className="form-group">
                                                <label>Nombre de Usuario*</label>
                                                <Field name="nombre_usuario" type="text" />
                                                <ErrorMessage name="nombre_usuario" component="span" className="error-msg" />
                                            </div>
                                            <div className="form-group">
                                                <label>Email*</label>
                                                <Field name="email" type="email" />
                                                <ErrorMessage name="email" component="span" className="error-msg" />
                                            </div>

                                        </div>
                                        <div className="form-group full-width">
                                            <label>Nueva Contraseña (Opcional)</label>
                                            <div className="input-with-icon">
                                                <Field name="password" type="password" placeholder="Dejar en blanco para mantener actual" className="form-control-full" />
                                                <Lock size={16} className="icon-inside" />
                                            </div>
                                            <ErrorMessage name="password" component="span" className="error-msg" />
                                        </div>
                                    </section>

                                    {/* SECCIÓN 3: DATOS LABORALES */}
                                    <section className="form-section full-width">
                                        <div className="section-title">
                                            <Briefcase size={18} /> <h3>Asignación Laboral</h3>
                                        </div>
                                        <div className="fields-grid">
                                            <div className="form-group">
                                                <label>Cargo*</label>
                                                <Field name="cargo" type="text" />
                                                <ErrorMessage name="cargo" component="span" className="error-msg" />
                                            </div>
                                            <div className="form-group">
                                                <label>Rol en Sistema*</label>
                                                <Field as="select" name="rol_nombre">
                                                    <option value="">Seleccione Rol...</option>
                                                    {roles.map(rol => (
                                                        <option key={rol.id} value={rol.name}>{rol.name}</option>
                                                    ))}
                                                </Field>
                                                <ErrorMessage name="rol_nombre" component="span" className="error-msg" />
                                            </div>
                                        </div>

                                        <div className="form-group full-width" ref={dropdownRef}>
                                            <label className="label-main">Áreas Asignadas*</label>
                                            <div className={`custom-multiselect ${isDropdownOpen ? 'open' : ''}`}>
                                                <div
                                                    className="multiselect-header"
                                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                >
                                                    <span>
                                                        {values.area_id.length > 0
                                                            ? `${values.area_id.length} área(s) seleccionada(s)`
                                                            : "Seleccionar áreas..."}
                                                    </span>
                                                    <ChevronDown size={16} />
                                                </div>

                                                {isDropdownOpen && (
                                                    <div className="multiselect-options">
                                                        {areasDisponibles.map(area => (
                                                            <label key={area.id} className="checkbox-item">
                                                                <input
                                                                    type="checkbox"
                                                                    name="area_id"
                                                                    value={area.id.toString()}
                                                                    checked={values.area_id.includes(area.id.toString())}
                                                                    onChange={(e) => {
                                                                        const { checked, value } = e.target;
                                                                        const nextValue = checked
                                                                            ? [...values.area_id, value]
                                                                            : values.area_id.filter(id => id !== value);
                                                                        setFieldValue("area_id", nextValue);
                                                                    }}
                                                                />
                                                                <span className="checkmark"></span>
                                                                <span className="label-text">{area.nombre}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <ErrorMessage name="area_id" component="span" className="error-msg" />
                                        </div>
                                    </section>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-cancelar" onClick={() => navigate('/usuarios')}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-guardar" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
                                        {isSubmitting ? 'Guardando...' : 'Actualizar Usuario'}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
                <Version />
            </div>
        </>
    );
};

export default EditarUsuario;
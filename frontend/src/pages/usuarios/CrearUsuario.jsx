import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // 1. Importar SweetAlert
import {
  ArrowLeft, Save, Loader2, User, Lock,
  IdCard, Briefcase, ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import './styles/CrearUsuario.css';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Version } from '../../components/Version';

const CrearUsuario = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null); // Ref para el dropdown
  const [areasDisponibles, setAreasDisponibles] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Cargar áreas
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await api.get('/ver-areas');
        const data = response.data.data || response.data;
        setAreasDisponibles(data);
      } catch (error) {
        console.error("Error al cargar áreas:", error);
      } finally {
        setLoadingAreas(false);
      }
    };
    fetchAreas();
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validationSchema = Yup.object().shape({
    nombre: Yup.string().required('El primer nombre es obligatorio'),
    apellido: Yup.string().required('El primer apellido es obligatorio'),
    segundo_apellido: Yup.string().required('El segundo apellido es obligatorio'),
    tipo_documento: Yup.string().required('Seleccione un tipo'),
    numero_documento: Yup.string().required('Documento obligatorio'),
    nombre_usuario: Yup.string().required('El nombre de usuario es obligatorio'),
    email: Yup.string().email('Email inválido').required('El email es obligatorio'),
    password: Yup.string().min(6, 'Mínimo 6 caracteres').required('La contraseña es obligatoria'),
    cargo: Yup.string().required('El cargo es obligatorio'),
    rol_nombre: Yup.string().required('Seleccione un rol'),
    area_id: Yup.array().min(1, 'Seleccione al menos un área').required('El área es obligatoria')
  });

  const initialValues = {
    nombre: '', segundo_nombre: '', apellido: '', segundo_apellido: '',
    tipo_documento: '', numero_documento: '', nombre_usuario: '',
    email: '', password: '', cargo: '', rol_nombre: '', area_id: []
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const valuesToSend = {
        ...values,
        area_id: values.area_id.map(id => parseInt(id))
      };

      await api.post('/registro-usuario', valuesToSend);

      // 2. Alerta de Éxito
      await Swal.fire({
        icon: 'success',
        title: '¡Registro Exitoso!',
        text: 'El personal ha sido dado de alta correctamente.',
        confirmButtonColor: '#2563eb', // Color acorde a tu CSS
        timer: 2000
      });

      resetForm();
      navigate('/usuarios');
    } catch (error) {
      // 3. Alerta de Error
      const msjs = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join('<br>')
        : 'Hubo un problema al procesar la solicitud.';

      Swal.fire({
        icon: 'error',
        title: 'Error de Validación',
        html: msjs, // Usamos HTML para que los saltos de línea de Laravel se vean bien
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container-usuarios">
        <Sidebar />

        <div className="crear-usuario-container">
          <header className="form-header">
            <button className="btn-back" onClick={() => navigate('/usuarios')}>
              <ArrowLeft size={20} />
            </button>
            <div className="header-text">
              <h2>Registrar Nuevo Usuario</h2>
              <p>Complete la información para registrar un usuario</p>
            </div>
          </header>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
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
                        <Field name="nombre" type="text" placeholder="Ej: Carlos" />
                        <ErrorMessage name="nombre" component="span" className="error-msg" />
                      </div>
                      <div className="form-group">
                        <label>Segundo Nombre</label>
                        <Field name="segundo_nombre" type="text" placeholder="(Opcional)" />
                      </div>
                      <div className="form-group">
                        <label>Primer Apellido*</label>
                        <Field name="apellido" type="text" placeholder="Ej: Pérez" />
                        <ErrorMessage name="apellido" component="span" className="error-msg" />
                      </div>
                      <div className="form-group">
                        <label>Segundo Apellido*</label>
                        <Field name="segundo_apellido" type="text" placeholder="Ej: Rodríguez" />
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
                        <Field name="nombre_usuario" type="text" placeholder="#cedula" />
                        <ErrorMessage name="nombre_usuario" component="span" className="error-msg" />
                      </div>
                      <div className="form-group">
                        <label>Email*</label>
                        <Field name="email" type="email" placeholder="ejemplo@passus.com" />
                        <ErrorMessage name="email" component="span" className="error-msg" />
                      </div>
                      <div className="form-group full-width">
                        <label>Contraseña de Acceso*</label>
                        <div className="input-with-icon">
                          <Field name="password" type="password" />
                          <Lock size={16} className="icon-inside" />
                        </div>
                        <ErrorMessage name="password" component="span" className="error-msg" />
                      </div>
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
                        <Field name="cargo" type="text" placeholder="Ej: Auxiliar de automatización" />
                        <ErrorMessage name="cargo" component="span" className="error-msg" />
                      </div>
                      <div className="form-group">
                        <label>Rol en Sistema*</label>
                        <Field as="select" name="rol_nombre">
                          <option value="">Seleccione Rol...</option>
                          <option value="Administrador">Administrador</option>
                          <option value="Usuario">Usuario</option>
                          <option value="JefeInmediato">Jefe Inmediato</option>
                        </Field>
                        <ErrorMessage name="rol_nombre" component="span" className="error-msg" />
                      </div>
                    </div>

                    <div className="form-group full-width" ref={dropdownRef}>
                      <label className="label-main">Asignar Áreas*</label>
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
                          <ChevronDown
                            size={16}
                            style={{
                              transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: '0.3s'
                            }}
                          />
                        </div>

                        {isDropdownOpen && (
                          <div className="multiselect-options">
                            {loadingAreas ? (
                              <div className="loading-inline"><Loader2 className="spin" size={14} /> Cargando...</div>
                            ) : (
                              areasDisponibles.map(area => (
                                <label key={area.id} className="checkbox-item">
                                  <input
                                    type="checkbox"
                                    name="area_id"
                                    value={area.id.toString()}
                                    checked={values.area_id.includes(area.id.toString())}
                                    onChange={(e) => {
                                      const { checked, value } = e.target;
                                      if (checked) {
                                        setFieldValue("area_id", [...values.area_id, value]);
                                      } else {
                                        setFieldValue("area_id", values.area_id.filter(id => id !== value));
                                      }
                                    }}
                                  />
                                  <span className="checkmark"></span>
                                  <span className="label-text">{area.nombre}</span>
                                </label>
                              ))
                            )}
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
                    {isSubmitting ? 'Guardando...' : 'Registrar Personal'}
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

export default CrearUsuario;
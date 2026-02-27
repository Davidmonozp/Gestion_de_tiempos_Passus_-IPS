import { useState, useEffect } from "react";
import api from "../../services/api";

export const CrearUsuario = () => {
  const [form, setForm] = useState({
    nombre: "",
    segundo_nombre: "",
    apellido: "",
    segundo_apellido: "",
    tipo_documento: "CC",
    numero_documento: "",
    nombre_usuario: "",
    email: "",
    cargo: "",
    password: "",
    rol_id: "",   // ID del rol seleccionado
    area_id: "",  // ID del área seleccionada
  });

  const [roles, setRoles] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, areasRes] = await Promise.all([
          api.get("/ver-roles"),
          api.get("/ver-areas"),
        ]);
        setRoles(rolesRes.data.data);
        setAreas(areasRes.data.data);
      } catch (error) {
        console.error("Error al cargar roles o áreas:", error);
        alert("Error al cargar roles o áreas");
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("nombre", form.nombre);
      data.append("segundo_nombre", form.segundo_nombre);
      data.append("apellido", form.apellido);
      data.append("segundo_apellido", form.segundo_apellido);
      data.append("tipo_documento", form.tipo_documento);
      data.append("numero_documento", form.numero_documento);
      data.append("nombre_usuario", form.nombre_usuario);
      data.append("email", form.email);
      data.append("cargo", form.cargo);
      data.append("password", form.password);

      // Enviar nombre del rol, no el id
      const rolSeleccionado = roles.find(r => r.id === parseInt(form.rol_id));
      if (rolSeleccionado) {
        data.append("rol_nombre", rolSeleccionado.name);
      }

      // Enviar área como array
      data.append("area_id[]", form.area_id);

      const response = await api.post("/registro-usuario", data);

      if (response.data.status === "success") {
        alert("Usuario creado con éxito");
        setForm({
          nombre: "",
          segundo_nombre: "",
          apellido: "",
          segundo_apellido: "",
          tipo_documento: "CC",
          numero_documento: "",
          nombre_usuario: "",
          email: "",
          cargo: "",
          password: "",
          rol_id: "",
          area_id: "",
        });
      } else {
        alert("Error: " + response.data.message);
      }
    } catch (error) {
      console.error("Error al crear usuario:", error.response?.data || error);
      if (error.response?.data?.errors) {
        const errs = error.response.data.errors;
        let msg = "";
        for (let key in errs) {
          msg += `${key}: ${errs[key].join(", ")}\n`;
        }
        alert(msg);
      } else {
        alert("Ocurrió un error al crear el usuario");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", fontFamily: "Arial" }}>
      <h2>Crear Usuario</h2>
      <form onSubmit={handleSubmit}>
        {/* Campos básicos */}
        <div style={{ marginBottom: "10px" }}>
          <label>Nombre:</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} required style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Segundo Nombre:</label>
          <input name="segundo_nombre" value={form.segundo_nombre} onChange={handleChange} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Apellido:</label>
          <input name="apellido" value={form.apellido} onChange={handleChange} required style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Segundo Apellido:</label>
          <input name="segundo_apellido" value={form.segundo_apellido} onChange={handleChange} style={{ width: "100%" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Tipo Documento:</label>
          <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange}>
            <option value="CC">CC</option>
            <option value="TI">TI</option>
            <option value="CE">CE</option>
          </select>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Número Documento:</label>
          <input name="numero_documento" value={form.numero_documento} onChange={handleChange} required style={{ width: "100%" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Nombre de Usuario:</label>
          <input name="nombre_usuario" value={form.nombre_usuario} onChange={handleChange} required style={{ width: "100%" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Email:</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required style={{ width: "100%" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Cargo:</label>
          <input name="cargo" value={form.cargo} onChange={handleChange} style={{ width: "100%" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Password:</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required style={{ width: "100%" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Rol:</label>
          <select name="rol_id" value={form.rol_id} onChange={handleChange} required>
            <option value="">Seleccione un rol</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Área:</label>
          <select name="area_id" value={form.area_id} onChange={handleChange} required>
            <option value="">Seleccione un área</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={loading} style={{ background: "#4CAF50", color: "white", padding: "10px 20px", border: "none", borderRadius: "4px" }}>
          {loading ? "Creando..." : "Crear Usuario"}
        </button>
      </form>
    </div>
  );
};

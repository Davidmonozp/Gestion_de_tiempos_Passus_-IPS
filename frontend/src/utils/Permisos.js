export const tienePermiso = (rolesPermitidos) => {
  const rol = localStorage.getItem("role"); // Asegúrate de que en el Login guardes: localStorage.setItem("role", user.role_name)
  
  if (!rol) return false;

  // Si pasas un string único, lo convertimos en array para que el .includes funcione siempre
  const permitido = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
  
  return permitido.includes(rol);
};
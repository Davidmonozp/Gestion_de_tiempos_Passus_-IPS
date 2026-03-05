export const tienePermiso = (rolesPermitidos) => {
  // 1. Obtenemos el objeto usuario completo
  const userJson = localStorage.getItem("user");
  if (!userJson) return false;

  const user = JSON.parse(userJson);

  // 2. Verificamos si el usuario tiene el array de roles
  if (!user.roles || !Array.isArray(user.roles)) return false;

  // 3. Verificamos si alguno de los roles del usuario coincide con los permitidos
  return user.roles.some(rol => rolesPermitidos.includes(rol));
};



// export const tienePermiso = (rolesPermitidos) => {
//   const rol = localStorage.getItem("role"); 
  
//   if (!rol) return false;

//   const permitido = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
  
//   return permitido.includes(rol);
// };
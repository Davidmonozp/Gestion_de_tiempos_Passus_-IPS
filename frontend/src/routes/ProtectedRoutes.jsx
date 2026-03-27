import { Navigate, Outlet } from "react-router-dom";
import Swal from "sweetalert2"; // Importar SweetAlert

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");

  // 1. Si no hay token, al login sin alerta (es comportamiento normal)
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si la ruta requiere roles específicos
  if (allowedRoles) {
    const user = JSON.parse(userJson);
    
    // Extraer nombres de roles
    const rolesDelUsuario = user?.roles?.map(rol => 
      typeof rol === 'object' ? rol.name : rol
    ) || [];

    // Verificar permiso
    const tienePermiso = rolesDelUsuario.some(rol => allowedRoles.includes(rol));

    if (!tienePermiso) {
      // --- AQUÍ AGREGAMOS EL SWEET ALERT ---
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: 'No tienes los permisos necesarios para entrar a esta sección.',
        confirmButtonColor: '#3085d6',
        timer: 3000, // Se cierra solo en 3 segundos si el usuario no hace clic
        timerProgressBar: true
      });

      // Redirigir a la vista principal
      return <Navigate to="/vista-principal" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
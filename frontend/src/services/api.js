import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  // baseURL: "http://192.168.1.34:8000/api",
  // baseURL: "https://test-api-cronos.passus.cloud/api",  
  // baseURL: "https://api-cronos.passus.cloud/api",  

});

// Interceptor para incluir el token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// INTERCEPTOR DE RESPUESTA: Aquí ocurre la magia
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Opción A: Limpieza rápida si no necesitas lógica de React aquí
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Forzar recarga para limpiar estados de memoria y redirigir
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;












// import axios from "axios";

// const api = axios.create({
//   // baseURL: "http://127.0.0.1:8000/api",
//   baseURL: "http://192.168.1.18:8000/api",

// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export default api;

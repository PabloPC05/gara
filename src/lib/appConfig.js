// URL base de la API. Para desarrollo local, apunta al backend en :8000.
// En producción se inyecta a través de la variable de entorno VITE_API_BASE_URL.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// Interruptor global entre modo mock (datos hardcodeados, sin backend) y
// modo real (llamadas a la API). Se lee de variables de entorno de Vite.
//
// Por defecto: mock activado para seguir desarrollando UI sin depender del
// backend. Para apuntar a un backend real, arranca con:
//
//   VITE_USE_MOCK=false VITE_API_BASE_URL=https://api.tudominio.com npm run dev
//
export const USE_MOCK =
  (import.meta.env.VITE_USE_MOCK ?? 'true').toString().toLowerCase() !== 'false'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

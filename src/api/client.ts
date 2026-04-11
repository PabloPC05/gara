import axios from "axios";
import type { AxiosError } from "axios";

export const API_BASE_URL = "https://api-mock-cesga.onrender.com";

export class ApiError extends Error {
  status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Extracts a readable message from FastAPI's 422 body (or the `detail` string from 400/404).
function extractMessage(err: AxiosError<any>): string {
  const data = err.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail) && data.detail[0]?.msg)
    return data.detail[0].msg;
  if (err.code === "ECONNABORTED")
    return "El servidor tarda en responder (posible arranque en frío). Inténtalo de nuevo.";
  if (err.code === "ERR_NETWORK") return "Sin conexión con el simulador CESGA.";
  return err.message || "Ha ocurrido un error inesperado.";
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 40_000, // covers Render cold-start (~30 s)
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    throw new ApiError(extractMessage(err), err.response?.status ?? null);
  },
);

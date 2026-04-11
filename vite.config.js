import { fileURLToPath, URL } from "url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    // Mol* uses dynamic imports and import.meta.url — exclude from Vite pre-bundling
    exclude: ['molstar'],
  },
})
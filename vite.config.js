import { fileURLToPath, URL } from "url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        sidebarTest: fileURLToPath(new URL('./sidebar-test.html', import.meta.url)),
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "mutative/dist/index.js": fileURLToPath(new URL("./node_modules/mutative/dist/mutative.esm.mjs", import.meta.url)),
      "mutative": fileURLToPath(new URL("./node_modules/mutative/dist/mutative.esm.mjs", import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['molstar'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['src/test/**', 'src/**/*.d.ts', 'src/types.ts'],
    },
  },
})
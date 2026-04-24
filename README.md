# BioHack / CAMELIA

Frontend web para **carga, predicción, visualización 3D y análisis de proteínas**.  
La app combina un visor Mol* con flujos de FASTA, catálogo, importación de estructuras, comparación y asistencia por IA.

## Stack principal

- **React 19 + Vite 5**
- **TypeScript + JavaScript mixto** (`allowJs: true`)
- **Zustand** para estado global
- **Tailwind CSS + componentes tipo shadcn/ui + Radix**
- **Vitest + Testing Library** para tests
- **Mol\*** para visualización molecular

## Arquitectura general

Flujo de entrada:

1. `index.html` monta `src/main.jsx`.
2. `main.jsx` envuelve `App` con `ThemeProvider` y `ErrorBoundary`.
3. `App.tsx` arma el layout principal:
   - `MenuBar` (arriba)
   - `ActivityBar` + `CommandSidebar` (izquierda)
   - `FastaBar` (barra de secuencia superior)
   - `MolecularScene` (visor 3D central)
   - `RightSidebar` (detalles/comparación)

## Flujo de datos (alto nivel)

Entradas soportadas:

- FASTA manual (`FilesSection`, `AminoAcidPicker`, `FastaBar`)
- Catálogo de API (`SearchSection`)
- Chat IA (`AiSection`, incluyendo búsqueda por nombre de proteína)
- Archivos locales (FASTA/PDB/CIF/.session)
- RCSB PDB por ID

Pipeline:

1. `lib/proteinLoadService.js` envía secuencia (`submitJob`) y hace polling (`pollJob`).
2. `lib/apiClient.js` consulta `/jobs` y `/proteins`.
3. `lib/apiSchema.js` valida/normaliza respuesta API.
4. `lib/proteinAdapter.js` convierte a **UnifiedProtein**.
5. `stores/useProteinStore.js` actualiza catálogo/selección activa.
6. UI reacciona: `MolecularScene`, `FastaBar`, `RightSidebar`, paneles de estado.

## Estructura del proyecto

```text
.
├─ src/
│  ├─ ai/                # Integración Gemini y prompts
│  ├─ api/               # Tipos de contrato API
│  ├─ components/
│  │  ├─ navigation/     # Menús superiores
│  │  ├─ sidebar/        # Panel izquierdo (search/files/ai/workspace...)
│  │  ├─ molecular/      # Escena y viewer 3D
│  │  ├─ protein-details/# Panel derecho de detalle/comparación
│  │  ├─ fastabar/       # Subcomponentes de edición de secuencia
│  │  ├─ ui/             # Primitivos UI reutilizables
│  │  └─ workspace/      # Diálogos de import/export
│  ├─ config/            # Firebase
│  ├─ hooks/             # Lógica de interacción, sincronización y carga
│  ├─ lib/               # Clientes API, adapters, export, utilidades
│  │  ├─ molstar/
│  │  └─ math/
│  ├─ stores/            # Estado global con Zustand
│  ├─ test/              # Suites por dominio (components/hooks/lib/stores/utils)
│  └─ utils/             # Helpers transversales (FASTA, deep links, bioquímica)
├─ vite.config.js
├─ tsconfig.json
├─ tailwind.config.js
└─ package.json
```

## Stores globales (Zustand)

- `useProteinStore`: catálogo de proteínas, selección activa/múltiple (máx 2).
- `useViewerConfigStore`: configuración de visor, foco de residuo, cámara pendiente.
- `useLayoutStore`: tabs/layout, dark mode, recursos de job.
- `useJobStatusStore`: paneles de estado por flujo (`catalog`, `files-fasta`, `amino-builder`).
- `useFileSystemStore`: árbol tipo workspace persistente (`.session`, `.fasta`, estructuras).
- `useAuthStore`: autenticación Firebase.
- `useAnalysisStore`: estado de mediciones/análisis en visor.
- `useMolstarStore`: referencia global al plugin Mol*.

## Variables de entorno

Configura un `.env` en la raíz (ejemplo):

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_GEMINI_API_KEY=...
VITE_GOOGLE_CLIENT_ID=...

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

## Scripts disponibles

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run test:watch
npm run test:coverage
```

## Cómo arrancar

```bash
npm install
npm run dev
```

## Integraciones externas

- **Backend de predicción** (`/jobs`, `/proteins`) por `src/lib/apiClient.js`
- **UniProt** (fallback de FASTA) por `src/lib/uniprotClient.js`
- **RCSB PDB** (estructura + metadata) por `src/lib/rcsbClient.js`
- **Gemini** para chat/explicación (`src/ai/`)
- **Firebase** para auth/analytics (`src/config/firebase.js`)
- **Google Workspace** export a Drive/Docs/Sheets (`src/lib/googleDriveService.js`)

## Testing

- Framework: **Vitest** (`vite.config.js`).
- Setup global: `src/test/setup.js`.
- Suites por capas:
  - `src/test/components`
  - `src/test/hooks`
  - `src/test/lib`
  - `src/test/stores`
  - `src/test/utils`

## Documentación interna

- `src/components/FastaBar.mdx`: documentación funcional del componente `FastaBar`.

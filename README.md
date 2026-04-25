# 🧬 Gara (BioHack)
### Portal Web para la Predicción y Análisis de Estructuras Proteicas

**Gara** es una plataforma frontend avanzada desarrollada para la **Cátedra CAMELIA**, diseñada para democratizar el acceso a herramientas de predicción de vanguardia como **AlphaFold2**. Permite a investigadores cargar secuencias, visualizar estructuras en 3D, analizar métricas de confianza y gestionar trabajos de computación de alto rendimiento (HPC) a través de una interfaz intuitiva y moderna.

---

## 🚀 Propósito del Proyecto
Este sistema ha sido diseñado como el portal de acceso al supercomputador **Finis Terrae III (CESGA)**. Resuelve la barrera técnica que supone AlphaFold2, el cual requiere infraestructuras complejas (Linux, GPUs NVIDIA de última generación y hasta 3 TB de almacenamiento para bases de datos genéticas), centralizando el procesamiento en el CESGA y exponiéndolo mediante esta aplicación web (SPA).

---

## ✨ Características Principales

### 🔍 Gestión de Datos y Secuencias
* **Carga de Secuencias:** Soporte para pegado manual de FASTA, carga de archivos locales (.fasta, .pdb, .cif, .session) e importación directa desde **RCSB PDB** por ID.
* **Asistente IA:** Integración con **Google Gemini** para realizar consultas sobre proteínas, búsqueda por nombre y asistencia técnica en el flujo de trabajo.
* **Catálogo Curado:** Acceso rápido a 22 proteínas de prueba (como Ubiquitina, p53 o Calmodulina) con metadatos reales de UniProt y estructuras precomputadas.

### 🖥️ Visualización y Análisis Científico
* **Visor 3D Molecular:** Integración completa de **Mol*** para rotación, zoom y selección precisa de residuos.
* **Métricas de Confianza:** * Visualización de **pLDDT** mediante código de colores (azul para alta confianza, naranja para regiones desordenadas).
    * **Heatmap 2D de PAE** (Error de Alineación Previsto) para identificar la orientación relativa de los dominios.
* **Panel de Detalles:** Análisis profundo que incluye propiedades físicas, funciones biológicas y taxonomía del organismo.

### ⚙️ Flujo de Trabajo HPC
* **Monitoreo de Jobs:** Interfaz clara para seguir el estado de la predicción en tiempo real: `PENDIENTE`, `EJECUTANDO`, `COMPLETADO` o `FALLIDO`.
* **Exportación Profesional:** Botones de descarga para archivos PDB, mmCIF, JSON de confianza y generación de reportes en PDF.

---

## 🛠️ Stack Tecnológico

* **Core:** [React 19](https://react.dev/) + [Vite 5](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/).
* **Estado Global:** [Zustand](https://github.com/pmndrs/zustand) para la gestión del catálogo de proteínas, visor 3D y sistema de archivos persistente.
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) + componentes tipo [shadcn/ui](https://ui.shadcn.com/).
* **Visualización Científica:** [Mol*](https://molstar.org/) y [Recharts](https://recharts.org/) para gráficos analíticos.
* **Backend/Auth:** [Firebase](https://firebase.google.com/) para autenticación y analíticas.

---

## 📁 Arquitectura del Proyecto
El flujo de datos sigue un pipeline estandarizado para asegurar la compatibilidad con el sistema real del CESGA:

1.  **Entrada:** Se captura la secuencia a través de `FastaBar`, `SearchSection` o el chat de IA.
2.  **Servicio:** `proteinLoadService.js` gestiona el envío del trabajo (`submitJob`) y el monitoreo mediante polling.
3.  **Adaptador:** `proteinAdapter.js` valida y normaliza la respuesta de la API al modelo **UnifiedProtein**.
4.  **Estado:** `useProteinStore` actualiza globalmente la interfaz para que el visor y los paneles laterales reaccionen al cambio.

---

## 🔧 Configuración y Desarrollo

### Variables de Entorno
Configura un archivo `.env` en la raíz del proyecto con los siguientes parámetros:
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_GEMINI_API_KEY=tu_api_key
VITE_FIREBASE_API_KEY=tu_api_key
# ... configuraciones adicionales de Firebase y Google

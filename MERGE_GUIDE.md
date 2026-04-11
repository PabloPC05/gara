Contexto
Tenemos dos ramas con cambios significativos que deben fusionarse:
- sidebar-nuevo (rama base de tu compañero): refactor profundo del sidebar, nueva API client, búsqueda de catálogo, AI assistant, settings, amino acid picker, y cambios en el store de proteínas (selección single en vez de múltiple).
- main (mis cambios): migración completa del visor 3D de 3Dmol a Mol* (Molstar), sistema de temas dark/light, menús de navegación nuevos y ampliados, panel de detalles de proteína completamente reescrito, sistema de testing con Vitest, y adaptador de datos enriquecido con _raw.
Estrategia de Fusión
La rama base debe ser sidebar-nuevo. Sobre ella se deben integrar mis cambios de main adaptándolos para que sean compatibles con las decisiones arquitectónicas de tu compañero.
---
NOTAS DETALLADAS DE LO QUE YO IMPLEMENTÉ (para integrar sobre sidebar-nuevo)
A. Motor de Visualización 3D — Migración 3Dmol → Mol* (Molstar)
Archivos nuevos que DEBEN añadirse:
- src/hooks/useMolstarViewer.js — Hook React que inicializa PluginContext de Mol* headless (sin UI), crea <canvas> dinámico, ResizeObserver. Reemplaza funcionalmente a use3DmolViewer.
- src/hooks/plddtColorTheme.js — Tema de color AlphaFold pLDDT custom para Mol* (4-tier: azul >90, cyan 70-90, amarillo 50-70, naranja <50). Se registra en el colorThemeRegistry del plugin.
Archivos que DEBEN reescribirse:
- src/components/molecular/MolecularViewer.jsx — Reescritura completa:
  - Usa useMolstarViewer en vez de use3DmolViewer.
  - Pipeline de carga loadStructureEntry() con state tree de Mol*: rawData → trajectory → model → structure → TransformStructureConformation → representation.
  - Soporte para mmCIF además de PDB.
  - Presets de iluminación: ao (SSAO), flat, studio con plugin.canvas3d.setProps().
  - Picking por píxel con plugin.canvas3d.identify().
  - Transformaciones matriciales (Mat4 de Mol*) para drag: rotación alrededor del centroide, traslación alineada con ejes de cámara.
  - Tooltip de residuo con pLDDT vía plugin.behaviors.interaction.hover.
  - Halo de selección con representación cartoon semitransparente amarilla.
  - Lee viewerRepresentation, viewerLighting, sceneBackground de useUIStore.
  NOTA DE COMPATIBILIDAD: En sidebar-nuevo, la propiedad protein.structureData y protein.structureFormat reemplazan a protein.pdbData. El visor Mol* debe leer ambas:
    const text = protein.cifData ?? protein.structureData ?? protein.pdbData
  const format = protein.structureFormat === 'cif' ? 'mmcif' : 'pdb'
  
- src/components/molecular/MolecularScene.jsx — Refactorizado:
  - Ya no alterna entre mock y real. Siempre renderiza MolecularViewer (Mol*).
  - En modo mock, pobla el store con replaceCatalog().
  - Recibe background como prop dinámica.
- src/components/molecular/ViewerCanvas.jsx — Ampliado significativamente:
  - Tooltip enriquecido de residuo con: nombre aminoácido, posición, cadena, propiedades, barra visual de pLDDT.
  - Desplazamiento dinámico del tooltip según si el drawer está abierto y cuántas columnas son visibles.
  - Importa getAminoAcidInfo de utils/aminoAcids.
  - Usa useProteinStore para estado del drawer.
- src/hooks/use3DmolViewer.js — Cambio menor: busca window.$3Dmol en vez de importar como módulo ESM.
Dependencia nueva requerida: molstar (npm package). Añadir a package.json.
B. Sistema de Temas y Estilos
Archivos nuevos:
- src/components/theme-provider.tsx — Provider de tema (light/dark/system) con localStorage. Context API con ThemeProvider + hook useTheme.
Archivos que DEBEN modificarse:
- src/main.jsx — Envolver <App /> con:
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
    <App />
  </ThemeProvider>
  
- tailwind.config.js — Añadir:
  - darkMode: ['class']
  - Variables CSS de shadcn/ui en theme.extend.colors: border, input, ring, background, foreground, primary, secondary, destructive, muted, accent, popover, card — todas usando hsl(var(--...)).
- src/index.css — Añadir:
  - Variables CSS light (:root) y dark (.dark) para el design system completo.
  - border-color: hsl(var(--border)) global.
  - Scrollbar minimalista (.minimal-scrollbar).
NOTA DE COMPATIBILIDAD: sidebar-nuevo ya tiene darkMode y viewerBackground en useUIStore. Mi ThemeProvider añade soporte adicional para la clase CSS dark en <html>. Ambos sistemas pueden coexistir: el store controla el toggle, el ThemeProvider aplica la clase. En mi implementación, App.jsx sincroniza sceneBackground al fondo del visor, mientras que sidebar-nuevo usa viewerBackground para lo mismo. Hay que unificar: usar sceneBackground (mi nombre) o viewerBackground (su nombre) pero no ambos. Recomendación: mantener el nombre de sidebar-nuevo (viewerBackground) y renombrar mis referencias.
C. Store UI (src/stores/useUIStore.js)
Mi versión añade sobre la base original:
sceneBackground: '#ffffff',
setSceneBackground: (color) => set({ sceneBackground: color }),
viewerRepresentation: 'cartoon',
setViewerRepresentation: (repr) => set({ viewerRepresentation: repr }),
viewerLighting: 'ao',
setViewerLighting: (lighting) => set({ viewerLighting: lighting }),
La versión de sidebar-nuevo añade:
darkMode, language, compactMode, viewerBackground
// + persistencia en localStorage
// + toggleDarkMode, setLanguage, toggleCompactMode, setViewerBackground
Fusión: Combinar ambas. Las propiedades de sidebar-nuevo (darkMode, language, compactMode, viewerBackground con localStorage) se mantienen. Se añaden mis propiedades nuevas:
- viewerRepresentation / setViewerRepresentation
- viewerLighting / setViewerLighting
- Eliminar sceneBackground — usar viewerBackground de sidebar-nuevo en su lugar.
D. Menús de Navegación
Archivos nuevos que DEBEN añadirse:
- src/components/navigation/FileMenu.jsx — Menú "Archivo" con secciones: Espacio de Trabajo, Importar Estructura, Exportar Datos, Colaboración.
- src/components/navigation/VisionMenu.jsx — Menú "Visión" con zoom interactivo, Proyección de Cámara, Ayudas Visuales, Sección Transversal.
Archivos que DEBEN modificarse:
- src/components/navigation/FloatingNavbar.jsx — Añadir <FileMenu /> y <VisionMenu />. Fondo a bg-black.
- src/components/navigation/EnvironmentMenu.jsx — Reescrito con funcionalidad real:
  - Sección Fondos: selector claro/oscuro conectado a useUIStore.setSceneBackground (adaptar a setViewerBackground).
  - Sección Iluminación: 3 presets (studio, flat, ao) conectados a useUIStore.setViewerLighting.
  - Secciones placeholder: Efectos de Cámara, Calidad de Renderizado.
- src/components/navigation/StyleMenu.jsx — Reescrito con estado real:
  - 5 representaciones funcionales conectadas a useUIStore.viewerRepresentation.
  - Sección Coloración expandida (pLDDT activo fijo, + placeholders).
  - Sección Destacados Rápidos.
- src/components/navigation/ToolsMenu.jsx — Ampliado de ~5 items a ~18 items en 5 secciones organizadas.
- src/components/navigation/SearchBarTrigger.jsx — Ancho de w-[400px] a w-[600px].
- src/components/navigation/SidebarHybridInput.jsx — Border radius de rounded-xl a rounded-md.
- src/components/navigation/UserAccountModule.jsx — Limpiar imports no usados.
E. Panel de Detalles de Proteína (Drawer)
Archivos nuevos que DEBEN añadirse:
- src/components/protein-details/ConfidenceSection.jsx — Tarjeta de confianza con pLDDT (barra visual) y PAE medio.
- src/components/protein-details/ActionButtons.jsx — Botones de descarga PDB y visor de logs HPC.
Archivos que DEBEN reescribirse:
- src/components/protein-details/DrawerBody.jsx — Reescritura completa (~815 líneas):
  - Normalizador normalizeProtein() que unifica datos de _raw, biological y propiedades directas.
  - 8 secciones: Identidad, Función biológica, Propiedades físico-químicas, Confianza estructural, Viabilidad biológica, Estructuras experimentales, Secuencia + backbone químico SVG, Barra de acciones.
  - Visor de backbone peptídico SVG (ChemicalBackbone).
  - Secuencia FASTA formateada en bloques de 10.
  - Descarga PDB y visor de logs integrados.
  - Links externos a UniProt, RCSB, AlphaFold DB, PubMed.
- src/components/protein-details/DrawerHeader.jsx — Ahora lee de protein._raw.protein_metadata con fallback. Muestra PDB badge condicional. Badge de fuente de datos.
- src/components/protein-details/BiologicalStatusCard.jsx — Ahora recibe protein en vez de biological. Componentes StatusRow y AlertsRow. Añade alertas de alergenicidad.
- src/components/protein-details/PhysicalPropertiesCard.jsx — Ahora recibe protein. Lee de _raw.sequence_properties. Añade cargas, balance neto, cisteínas.
- src/components/protein-details/ComparisonBody.jsx — visibleCount prop dinámica. Clase minimal-scrollbar.
- src/components/protein-details/ComparisonColumn.jsx — Null safety. Pasa protein completo.
- src/components/protein-details/index.js — Exportar ConfidenceSection y ActionButtons.
NOTA DE COMPATIBILIDAD: sidebar-nuevo cambia useProteinStore para forzar selección single (0 o 1 proteína). Mis componentes de comparación (ComparisonBody, ComparisonColumn) asumían selección múltiple. Si la selección es siempre single, los componentes de comparación pueden simplificarse, pero el DrawerBody y DrawerHeader son compatibles sin cambios pues operan sobre una única proteína.
F. Adaptador de Datos (src/lib/proteinAdapter.js)
Mis cambios que DEBEN integrarse sobre la versión de sidebar-nuevo:
- Campo meanPae añadido al tipo UnifiedProtein.
- Campo _raw añadido: objeto API-style completo con protein_metadata, structural_data, biological_data, sequence_properties, logs.
- Funciones nuevas:
  - buildRawFromMock(mock, pdbData) — Construye _raw a partir de datos mock.
  - buildRawFromApi(validated) — Construye _raw a partir de respuesta validada.
- Ambas mockToUnified y apiToUnified ahora incluyen _raw y meanPae.
- apiToUnified añade cifData: structural.cifFile || null.
NOTA DE COMPATIBILIDAD: sidebar-nuevo ya añadió structureData y structureFormat al adaptador. Mi _raw es aditivo y no entra en conflicto. La fusión debe mantener AMBOS conjuntos de campos: structureData/structureFormat (de tu compañero) + meanPae/_raw/cifData (míos). La función buildRawFromApi debe adaptarse para leer validated.structuralData y validated.proteinMetadata tal como los deja validateApiResponse en sidebar-nuevo.
G. Infraestructura de Build y Testing
Cambios que DEBEN aplicarse a package.json:
- Scripts nuevos: test, test:watch, test:coverage con Vitest.
- DevDependencies nuevas: vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, @vitest/coverage-v8, jsdom.
Cambios a vite.config.js:
- Alias para mutative apuntando a mutative.esm.mjs.
- optimizeDeps.exclude: ['molstar'].
- Bloque test completo con Vitest (jsdom, setup, coverage).
Directorio nuevo: src/test/ con setup.js y subdirectorios vacíos.
tsconfig.json — Cambios de nodenext a Bundler + opciones ESNext. NOTA: sidebar-nuevo ya hizo cambios similares. Verificar si son compatibles y si no, usar mi versión más completa.
H. Firebase (src/config/firebase.js)
- Analytics se inicializa de forma asíncrona con isSupported().
- Solo crea getAnalytics() si el entorno lo soporta (SSR-safe).
- analytics es let (export mutable).
I. Datos Mock (src/data/mockProteinCatalog.js)
Cada proteína mock ahora incluye campos adicionales: pdbId, meanPae, molecularWeightKda, positiveCharges, negativeCharges, cysteineResidues, toxicityAlerts (array), allergenicityAlerts (array), solubilityPrediction, stabilityStatus. Estos campos son necesarios para que el DrawerBody y BiologicalStatusCard muestren la información completa en modo mock.
J. Auth (src/components/auth/AuthDialog.jsx)
- Desestructura el store en selects individuales (mejor re-renders).
- Loader2 → LoaderCircle.
K. src/App.jsx (mis cambios)
- Importa useUIStore para sceneBackground → adaptar a viewerBackground.
- Fondo del layout: bg-black.
- SidebarInset con style={{ backgroundColor: sceneBackground }} + transición CSS → usar viewerBackground.
- MolecularScene recibe background como prop dinámica → usar viewerBackground.
- Eliminados botones de zoom flotantes (Zoom In/Out con console.log).
NOTA DE COMPATIBILIDAD: sidebar-nuevo ya tiene viewerBackground en el store y lo usa en App.jsx. Fusionar manteniendo su lógica de darkMode y añadiendo mi ThemeProvider wrapper + mi fondo dinámico del SidebarInset.
L. index.html
- Añade <link rel="icon" type="image/png" href="/src/assets/logo.png">.
---
RESUMEN DE CONFLICTOS ESPERADOS
Archivo	Conflicto	Resolución
src/stores/useUIStore.js	Ambos añaden props nuevas	Combinar ambas, unificar sceneBackground→viewerBackground
src/App.jsx	Ambos lo modifican	Base sidebar-nuevo + ThemeProvider + fondo dinámico + sin zoom buttons
src/lib/proteinAdapter.js	Ambos lo modifican	Base sidebar-nuevo (structureData/format) + añadir _raw, meanPae, cifData
src/components/molecular/MolecularViewer.jsx	sidebar-nuevo tiene cambios menores, yo reescribí completo	Usar mi reescritura Mol* completa, adaptando para leer structureData/structureFormat
src/hooks/useCommandEntries.js	Ambos lo reescribieron	Base sidebar-nuevo (su sistema de entries/picker/addEntry es el canónico)
src/components/sidebar/ActivityBar.jsx	Ambos lo modifican	Base sidebar-nuevo (tabs dinámicos + Bot + Settings) + mi bg-black y SquarePlus
src/components/sidebar/EntriesSection.jsx	Ambos lo modifican	Base sidebar-nuevo (su nueva API sin proteinIdForIndex)
src/components/sidebar/EntryRow.jsx	Ambos lo modifican	Base sidebar-nuevo + mi isSelectable y null safety
src/stores/useProteinStore.js	sidebar-nuevo cambia a selección single	Base sidebar-nuevo (selección single es la decisión arquitectónica)
src/components/CommandSidebar.jsx	sidebar-nuevo lo reescribió	Base sidebar-nuevo
src/lib/apiClient.js	sidebar-nuevo lo reescribió	Base sidebar-nuevo
src/hooks/useProteinLoader.js	sidebar-nuevo añadió toFasta	Base sidebar-nuevo
tailwind.config.js	Ambos lo modifican	Base sidebar-nuevo + mi darkMode: ['class'] + mis colores shadcn/ui
package.json	Ambos lo modifican	Combinar: deps de ambos + mis deps de testing
tsconfig.json	Ambos lo modifican	Usar mi versión más completa
src/config/firebase.js	Solo yo lo modifiqué	Aplicar mis cambios directamente
---
ORDEN SUGERIDO DE INTEGRACIÓN
1. Partir de sidebar-nuevo como base.
2. Instalar molstar como dependencia.
3. Añadir archivos nuevos: useMolstarViewer.js, plddtColorTheme.js, theme-provider.tsx, FileMenu.jsx, VisionMenu.jsx, ConfidenceSection.jsx, ActionButtons.jsx, src/test/.
4. Reescribir MolecularViewer.jsx, MolecularScene.jsx, ViewerCanvas.jsx con las versiones Mol*.
5. Fusionar useUIStore.js (combinar props de ambos).
6. Fusionar App.jsx (base sidebar-nuevo + ThemeProvider + fondo dinámico).
7. Fusionar proteinAdapter.js (base sidebar-nuevo + _raw + meanPae).
8. Reescribir DrawerBody.jsx y componentes de detalles de proteína.
9. Fusionar tailwind.config.js, index.css, package.json, vite.config.js.
10. Aplicar cambios en menús de navegación.
11. Aplicar cambios menores: firebase, auth, mock data, index.html.
12. Adaptar MolecularViewer para leer protein.structureData/protein.structureFormat en vez de solo protein.pdbData.
13. Verificar que todo compila y los menús de Estilo/Entorno controlan el visor Mol*.
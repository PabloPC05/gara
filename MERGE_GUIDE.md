# Changelog — cambios desde el último push (b641e19 shalom)

> Rama: main · Commit base: b641e19
> Archivos modificados: 10 · Archivos nuevos: 2

---

## 1. Sidebar — resize horizontal (CommandSidebar.jsx)

*Qué hace:* El usuario puede arrastrar el borde derecho de la sidebar para cambiar su ancho.

- Se añade un <div> invisible de 4 px en el borde derecho de la sidebar (absolute right-0, cursor-col-resize).
- Al hacer mousedown se capturan mousemove / mouseup globales.
- Se actualiza la CSS custom property --sidebar-width directamente en el nodo DOM del sidebar-wrapper, sin pasar por React state.
- Las transiciones CSS se desactivan durante el arrastre y se restauran al soltar.
- Límites: mínimo 200 px, máximo 600 px.
- El div interno pasa de flex h-full a relative flex h-full para que el handle se posicione correctamente.

*Archivos:* src/components/CommandSidebar.jsx

---

## 2. Sidebar — botón eliminar con confirmación por entrada (EntryRow.jsx)

*Qué hace:* Cada proteína en la lista de entradas activas tiene un icono de papelera que al pulsarlo abre un diálogo de confirmación antes de eliminar.

- El componente EntryRow se reestructura: el elemento raíz pasa de ser un <button> a un <div className="group ..."> (necesario porque no se puede anidar <button> dentro de <button>).
- Se añade un <button> interno para la zona de selección (comportamiento idéntico al anterior).
- Se añade un <button> con icono Trash2 (lucide-react) que aparece al hacer hover (opacity-0 group-hover:opacity-100).
- Estado local confirmOpen con useState(false) controla el diálogo.
- El diálogo reutiliza los componentes Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter ya existentes en ui/dialog.tsx.
- La acción de eliminar llama directamente a removeProtein(protein.id) del store (sin prop threading).
- No se tocan EntriesSection, el store ni ningún otro componente.

*Archivos:* src/components/sidebar/EntryRow.jsx

---

## 3. Búsqueda — live search + navegación por teclado (SearchSection.jsx)

*Qué hace:* La búsqueda en "Explore Catalog" ya no requiere pulsar Enter; los resultados se actualizan mientras el usuario escribe. Las flechas del teclado navegan la lista y Enter carga la entrada seleccionada.

### Live search con debounce
- Se elimina el onSubmit de búsqueda; en su lugar un useEffect observa query, category, minLength y maxLength.
- 350 ms después del último cambio en cualquier filtro se lanza doSearch().
- Si todos los filtros están vacíos, la lista se limpia inmediatamente sin llamar a la API.
- El <form> se mantiene pero su onSubmit sólo llama a e.preventDefault().

### Filtros adicionales (añadidos por el compañero)
- *Category:* desplegable <select> con 10 categorías predefinidas (enzyme, receptor, transporter, etc.).
- *Length (aa):* dos inputs numéricos (Min / Max) para filtrar por número de aminoácidos.
- searchCatalogProteins ahora acepta { search, category, minLength, maxLength } y construye los query params correspondientes.
- Se añade botón "Clear filters" cuando hay algún filtro activo.

### Navegación por teclado
- onKeyDown en el input de texto:
  - ArrowDown → mueve el índice activo hacia abajo (clamped al último resultado).
  - ArrowUp → mueve el índice activo hacia arriba (clamped a 0).
  - Enter → si hay un índice activo y no está ocupado, llama a handleSelectProtein(results[activeIndex]).
- El item activo hace scroll automático con scrollIntoView({ block: 'nearest' }) via useEffect.
- El item resaltado recibe bg-[#fde8e8]/70 border-l-2 border-l-[#e31e24] (acento rojo del sistema de diseño).
- Se elimina el texto de ayuda "Press Enter to query the catalog endpoint."

*Archivos:* src/components/sidebar/SearchSection.jsx, src/lib/apiClient.js

---

## 4. API client — searchCatalogProteins con filtros múltiples (apiClient.js)

*Qué hace:* La función acepta un objeto de filtros en lugar de un string simple.

js
// Antes:
searchCatalogProteins(query: string)
// → GET /proteins/?search={query}

// Ahora:
searchCatalogProteins({ search, category, minLength, maxLength })
// → GET /proteins/?search=…&category=…&min_length=…&max_length=…


- Los parámetros vacíos no se incluyen en la query string.
- Si ningún parámetro tiene valor, devuelve [] sin llamar a la API.

*Archivos:* src/lib/apiClient.js

---

## 5. AI Assistant — mejora mayor de AiSection.jsx

*Qué hace:* El chat con Gemini se convierte en un asistente que puede cargar proteínas directamente desde la conversación, ya sea por nombre o por secuencia FASTA.

### Carga de proteínas por nombre desde el chat
- Si el mensaje del usuario contiene palabras clave de intención de carga (carga, muéstrame, enséñame, visualiza, fetch, etc.), se llama a extractProteinQuery() (Gemini) para extraer el nombre canónico.
- Si se extrae un nombre, se busca primero en el *catálogo interno* (searchCatalogProteins) y si hay resultado se llama a getCatalogProteinDetail + load().
- Si no está en el catálogo, se intenta *UniProt* (searchUniprotFasta) y se carga la secuencia FASTA resultante.
- Si ambas búsquedas fallan, Gemini responde con un mensaje de error en el chat.
- El resultado exitoso actualiza selectedProteinIds en el store, apareciendo en el visor 3D.

### Carga de FASTA directo desde el chat
- Si el input empieza por >, se interpreta como una secuencia FASTA.
- Se valida con validateFasta() antes de enviar.
- Si es válida, se carga directamente con useProteinLoader.load().

### Otras mejoras
- El estado de explanation se fusiona en el sistema de mensajes del chat (un único historial, ya no dos áreas separadas).
- Botón "Analizar proteína activa" genera el informe técnico como un mensaje AI en el chat.
- El historial se resetea cuando cambia la proteína activa o cuando no hay ninguna (contextKey = activeProteinId ?? '__general__').
- Streaming robusto: streamTokenRef evita actualizaciones de estado de streamings cancelados (race condition).
- El chat funciona aunque no haya ninguna proteína cargada (modo general).
- Se elimina el botón RefreshCw / explicación separada; la UI queda unificada en el chat.

*Archivos:* src/components/sidebar/AiSection.jsx

---

## 6. Gemini client — extractProteinQuery (geminiClient.ts)

*Qué hace:* Nueva función que dado un mensaje de usuario determina si es una petición de carga de proteína y, en tal caso, devuelve su nombre canónico en inglés.

- Usa un prompt en español con ejemplos positivos y negativos (few-shot) para clasificar la intención.
- Devuelve string con el nombre (ej: "human SOD1") o null si no es una petición de carga.
- Usada por AiSection para disparar el flujo de búsqueda/carga desde el chat.

*Archivos:* src/ai/geminiClient.ts

---

## 7. Prompts — ajuste de tono y estructura (prompts.ts)

*Qué hace:* Los prompts de explicación y chat pasan de un tono coloquial a uno formal y técnico.

- buildExplanationPrompt / buildExplanationPromptFromUnified: el párrafo 1 ahora prioriza la identidad y función biológica de la proteína antes que los scores de predicción.
- buildChatPrompt: acepta protein: UnifiedProtein | null (antes era obligatoria). Permite conversación general sin proteína activa.
- Tono en todos los prompts: de "colega accesible" a "formal, riguroso, científico".

*Archivos:* src/ai/prompts.ts

---

## 8. UI — icono de Gemini en ActivityBar (ActivityBar.jsx, GeminiIcon.jsx)

*Qué hace:* El tab de AI Assistant usa el icono oficial de Gemini (estrella de 4 puntas) en lugar del icono genérico Bot de lucide-react.

- Nuevo componente GeminiIcon (SVG inline, acepta size y className).
- ActivityBar importa GeminiIcon y lo usa para el tab ai.

*Archivos:* src/components/sidebar/ActivityBar.jsx, src/components/ui/GeminiIcon.jsx (nuevo)

---

## 9. Cliente UniProt (uniprotClient.js) (nuevo)

*Qué hace:* Wrapper sobre la API REST pública de UniProt para obtener secuencias FASTA por nombre.

- Estrategia en dos pasos: primero busca en Swiss-Prot (revisado, canónico); si no hay resultado, busca en cualquier entrada.
- Exporta searchUniprotFasta(query: string): Promise<string>.
- Usado por AiSection como fallback cuando una proteína no está en el catálogo interno.

*Archivos:* src/lib/uniprotClient.js (nuevo)

---

## 10. Sidebar container — h-svh → h-full (ui/sidebar.tsx)

*Qué hace:* Corrección menor de altura en el contenedor fijo del panel de la sidebar.

- h-svh (small viewport height, puede causar recorte en ciertos navegadores/OS) → h-full (hereda la altura del ancestro, más predecible).

*Archivos:* src/components/ui/sidebar.tsx

---

## 11. Dependencias (package-lock.json)

Actualización del lockfile por cambios en dependencias transitivas. No se han añadido ni eliminado dependencias directas del proyecto.

---

## Resumen de archivos

| Archivo | Estado | Área |
|---|---|---|
| src/components/CommandSidebar.jsx | Modificado | Sidebar resize |
| src/components/sidebar/EntryRow.jsx | Modificado | Botón eliminar |
| src/components/sidebar/SearchSection.jsx | Modificado | Live search + teclado |
| src/components/sidebar/AiSection.jsx | Modificado | Chat IA mejorado |
| src/components/sidebar/ActivityBar.jsx | Modificado | Icono Gemini |
| src/components/ui/sidebar.tsx | Modificado | Fix altura |
| src/components/ui/GeminiIcon.jsx | *Nuevo* | Icono SVG Gemini |
| src/lib/apiClient.js | Modificado | Filtros de búsqueda |
| src/lib/uniprotClient.js | *Nuevo* | Cliente UniProt |
| src/ai/geminiClient.ts | Modificado | extractProteinQuery |
| src/ai/prompts.ts | Modificado | Tono + estructura prompts |
| package-lock.json | Modificado | Lockfile |
// ============================================================
//  BioHack — Mock Data
//  Todos los datos son simulados. No hay llamadas a APIs reales.
// ============================================================

export const UBIQUITIN_SEQUENCE = `>sp|P0CG47|UBQ_HUMAN Ubiquitin OS=Homo sapiens OX=9606 GN=UBB PE=1 SV=2
MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG`

// ── Mock PAE Matrix (20×20, simplificado de 76×76) ──────────────────────────
// Simula la estructura real de ubiquitina: dos dominios con baja correlación
// entre ellos (valores altos en la esquina top-right y bottom-left)
function generatePAEMatrix(size = 20) {
  const matrix = []
  for (let i = 0; i < size; i++) {
    const row = []
    for (let j = 0; j < size; j++) {
      const dist = Math.abs(i - j)
      const base = Math.min(dist * 1.6, 28)
      // Ruido suave para que parezca real
      const noise =
        Math.sin(i * 0.73 + j * 0.31) * 2.5 +
        Math.cos(i * 0.41 - j * 0.82) * 1.8
      // Bonus de dominio: esquina top-left y bottom-right son más precisas
      let domainBonus = 0
      if (i < 9 && j < 9) domainBonus = -4
      if (i >= 11 && j >= 11) domainBonus = -3.5
      row.push(Math.min(30, Math.max(0.3, base + noise + domainBonus)))
    }
    matrix.push(row)
  }
  return matrix
}

export const mockPAEMatrix = generatePAEMatrix(20)

// ── Logs simulados del clúster ────────────────────────────────────────────────
export const mockLogs = [
  { time: '00:00:01', msg: 'Inicializando entorno de ejecución AlphaFold2...' },
  { time: '00:00:02', msg: 'Cargando pesos del modelo (2.4 GB en VRAM)...' },
  { time: '00:00:03', msg: 'Secuencia detectada: 76 aminoácidos (ubiquitina).' },
  { time: '00:00:04', msg: 'Iniciando búsqueda MSA en UniRef90 (271 M seqs)...' },
  { time: '00:00:05', msg: 'MSA construida: 4,127 secuencias homólogas encontradas.' },
  { time: '00:00:06', msg: 'Buscando templates estructurales en base de datos PDB...' },
  { time: '00:00:07', msg: '3 templates seleccionados (identidad de secuencia > 30%).' },
  { time: '00:00:08', msg: 'Lanzando inferencia en GPU NVIDIA A100 SXM (80 GB)...' },
  { time: '00:00:10', msg: 'Reciclado estructural: iteración 1 / 3 completada.' },
  { time: '00:00:12', msg: 'Reciclado estructural: iteración 2 / 3 completada.' },
  { time: '00:00:14', msg: 'Reciclado estructural: iteración 3 / 3 completada.' },
  { time: '00:00:16', msg: 'Aplicando relajación de energía con OpenMM + Amber FF...' },
  { time: '00:00:18', msg: 'Calculando métricas de confianza pLDDT por residuo...' },
  { time: '00:00:19', msg: 'Generando matriz PAE (76 × 76 residuos)...' },
  { time: '00:00:20', msg: 'Exportando estructura en formatos PDB y mmCIF...' },
  { time: '00:00:21', msg: '✓ Predicción completada con éxito. pLDDT medio: 85.4' },
]

// ── Resultado principal de la predicción ─────────────────────────────────────
export const mockPredictionResult = {
  jobId: 'BH-2024-001337',

  protein: {
    name: 'Ubiquitina Humana',
    uniprotId: 'P0CG47',
    length: 76,
    organism: 'Homo sapiens',
  },

  // pLDDT: predicted Local Distance Difference Test
  // Rango 0–100. >70 = fiable. Colores estándar de AlphaFold.
  plddt: {
    mean: 85.4,
    perResidue: [
      72.1, 75.3, 82.4, 88.1, 91.2, 93.4, 95.1, 94.3, 92.2, 89.5,
      87.3, 88.7, 90.2, 91.5, 92.8, 93.1, 94.2, 92.7, 90.3, 88.1,
      85.4, 83.2, 82.1, 84.3, 87.5, 90.1, 92.3, 91.4, 89.2, 87.4,
      85.1, 84.3, 83.2, 82.4, 81.3, 83.1, 85.2, 87.4, 89.3, 90.5,
      92.1, 93.4, 91.2, 89.3, 88.1, 87.4, 86.2, 85.1, 84.3, 83.1,
      82.4, 83.2, 85.1, 87.4, 89.2, 91.3, 92.4, 93.1, 92.3, 90.4,
      88.2, 86.1, 84.3, 83.1, 82.2, 81.3, 80.1, 79.2, 78.3, 77.1,
      76.2, 75.4, 74.1, 73.2, 72.1, 71.3,
    ],
  },

  // Datos biológicos y fisicoquímicos
  biological: {
    solubility: 79.8,
    solubilityLabel: 'Soluble',
    instabilityIndex: 24.3,
    instabilityLabel: 'Estable',
    toxicityAlert: false,
    toxicityLabel: 'No tóxica',
    molecularWeight: 8564.9,     // Da
    isoelectricPoint: 6.56,
    halfLife: '>10 horas (mamíferos)',
    extinctionCoefficient: 1490, // M⁻¹cm⁻¹
  },

  // Contabilidad de recursos HPC
  hpc: {
    cpuHours: 0.007,
    gpuHours: 0.001,
    memoryGb: 0.84,
    cluster: 'BioHack-A1-GPU',
    completedAt: new Date().toISOString(),
  },
}

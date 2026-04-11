/**
 * Layouts geométricos + metadatos de las hélices del universo mock.
 * Esta lista es la única fuente de verdad del modo mock: el catálogo
 * del store, el visor 3D y el drawer se derivan de aquí.
 */
export const MOCK_HELIX_LAYOUTS = [
  {
    id: 'helix-0',
    residues: 40,
    offset: { x: 0, y: 0, z: 0 },
    color: 0x3b82f6,
    details: {
      name: 'Ubiquitina Humana',
      uniprotId: 'P0CG47',
      length: 76,
      organism: 'Homo sapiens',
      plddtMean: 85.4,
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
      }
    },
  },
  {
    id: 'helix-1',
    residues: 25,
    offset: { x: 40, y: 10, z: -10 },
    color: 0x10b981,
    details: {
      name: 'Lisozima C',
      uniprotId: 'P00698',
      length: 147,
      organism: 'Gallus gallus',
      plddtMean: 92.1,
      biological: {
        solubility: 83.2,
        solubilityLabel: 'Soluble',
        instabilityIndex: 29.4,
        instabilityLabel: 'Estable',
        toxicityAlert: false,
        toxicityLabel: 'No tóxica',
        molecularWeight: 16239.1,
        isoelectricPoint: 11.35,
        halfLife: '~30 horas (mamíferos)',
        extinctionCoefficient: 38940,
      },
    },
  },
  {
    id: 'helix-2',
    residues: 30,
    offset: { x: -35, y: -20, z: 15 },
    color: 0xec4899,
    details: {
      name: 'Insulina (cadena B)',
      uniprotId: 'P01308',
      length: 30,
      organism: 'Homo sapiens',
      plddtMean: 78.3,
      biological: {
        solubility: 95.7,
        solubilityLabel: 'Muy soluble',
        instabilityIndex: 18.1,
        instabilityLabel: 'Estable',
        toxicityAlert: false,
        toxicityLabel: 'No tóxica',
        molecularWeight: 3429.7,
        isoelectricPoint: 5.39,
        halfLife: '~5 minutos (sangre)',
        extinctionCoefficient: 5960,
      },
    },
  },
]

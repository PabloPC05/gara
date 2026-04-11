import { mockToUnified, apiToUnified } from '@/lib/proteinAdapter'

describe('proteinAdapter', () => {
  describe('mockToUnified', () => {
    const mockDetails = {
      name: 'Ubiquitina Humana',
      uniprotId: 'P0CG47',
      pdbId: '1UBQ',
      length: 76,
      organism: 'Homo sapiens',
      plddtMean: 85.4,
      meanPae: 3.8,
      biological: {
        solubility: 79.8,
        solubilityLabel: 'Soluble',
        instabilityIndex: 24.3,
        instabilityLabel: 'Estable',
        toxicityAlert: false,
        toxicityLabel: 'No tóxica',
        molecularWeight: 8564.9,
        isoelectricPoint: 6.56,
        halfLife: '>10 horas',
        extinctionCoefficient: 1490,
      },
    }

    it('maps basic fields correctly', () => {
      const result = mockToUnified('helix-0', mockDetails)
      expect(result.id).toBe('helix-0')
      expect(result.name).toBe('Ubiquitina Humana')
      expect(result.uniprotId).toBe('P0CG47')
      expect(result.pdbId).toBe('1UBQ')
      expect(result.length).toBe(76)
      expect(result.organism).toBe('Homo sapiens')
      expect(result.source).toBe('mock')
    })

    it('preserves biological data', () => {
      const result = mockToUnified('helix-0', mockDetails)
      expect(result.biological.solubility).toBe(79.8)
      expect(result.biological.instabilityIndex).toBe(24.3)
    })

    it('handles missing optional fields with defaults', () => {
      const minimal = { name: 'Simple' }
      const result = mockToUnified('x', minimal)
      expect(result.uniprotId).toBeNull()
      expect(result.pdbId).toBeNull()
      expect(result.length).toBe(0)
      expect(result.organism).toBe('Unknown')
      expect(result.plddtMean).toBeNull()
      expect(result.meanPae).toBeNull()
      expect(result.biological).toBeNull()
      expect(result.pdbData).toBeNull()
    })

    it('passes pdbData through', () => {
      const result = mockToUnified('x', mockDetails, 'ATOM data here')
      expect(result.pdbData).toBe('ATOM data here')
    })

    it('builds _raw object from mock data', () => {
      const result = mockToUnified('helix-0', mockDetails)
      expect(result._raw).toBeDefined()
      expect(result._raw.protein_metadata.protein_name).toBe('Ubiquitina Humana')
      expect(result._raw.sequence_properties.length).toBe(76)
    })
  })

  describe('apiToUnified', () => {
    it('returns null for null input', () => {
      expect(apiToUnified(null)).toBeNull()
    })

    it('returns null for non-COMPLETED status', () => {
      expect(apiToUnified({ status: 'PENDING' })).toBeNull()
    })

    it('returns null when required metadata is missing', () => {
      expect(apiToUnified({ status: 'COMPLETED' })).toBeNull()
      expect(apiToUnified({ status: 'COMPLETED', proteinMetadata: {} })).toBeNull()
    })

    const makeValidApiData = (overrides = {}) => ({
      status: 'COMPLETED',
      jobId: 'job-123',
      proteinMetadata: {
        proteinName: 'Ubiquitin',
        organism: 'Homo sapiens',
        uniprotId: 'P0CG47',
        pdbId: '1UBQ',
        dataSource: 'AlphaFold DB',
        plddtAverage: 85.4,
        ...overrides.proteinMetadata,
      },
      structuralData: {
        pdbFile: 'ATOM  ...',
        cifFile: '',
        confidence: {
          plddtMean: 85.4,
          meanPae: 3.8,
        },
        ...overrides.structuralData,
      },
      biologicalData: {
        solubilityScore: 79.8,
        solubilityPrediction: 'soluble',
        instabilityIndex: 24.3,
        stabilityStatus: 'stable',
        toxicityAlerts: [],
        allergenicityAlerts: [],
        sequenceProperties: {
          length: 76,
          molecularWeightKda: 8.6,
          positiveCharges: 7,
          negativeCharges: 8,
          cysteineResidues: 0,
        },
        ...overrides.biologicalData,
      },
      ...overrides,
    })

    it('maps a valid COMPLETED response correctly', () => {
      const result = apiToUnified(makeValidApiData())
      expect(result.id).toBe('job-123')
      expect(result.name).toBe('Ubiquitin')
      expect(result.uniprotId).toBe('P0CG47')
      expect(result.pdbId).toBe('1UBQ')
      expect(result.length).toBe(76)
      expect(result.organism).toBe('Homo sapiens')
      expect(result.source).toBe('api')
      expect(result.pdbData).toBe('ATOM  ...')
    })

    it('maps biological data with label conversions', () => {
      const result = apiToUnified(makeValidApiData())
      expect(result.biological.solubility).toBe(79.8)
      expect(result.biological.solubilityLabel).toBe('Soluble')
      expect(result.biological.instabilityIndex).toBe(24.3)
      expect(result.biological.toxicityAlert).toBe(false)
      expect(result.biological.molecularWeight).toBeCloseTo(8600, -1)
    })

    it('handles "very_soluble" prediction label', () => {
      const result = apiToUnified(
        makeValidApiData({
          biologicalData: {
            solubilityPrediction: 'very_soluble',
          },
        }),
      )
      expect(result.biological.solubilityLabel).toBe('Muy soluble')
    })

    it('handles "insoluble" prediction label', () => {
      const result = apiToUnified(
        makeValidApiData({
          biologicalData: {
            solubilityPrediction: 'insoluble',
          },
        }),
      )
      expect(result.biological.solubilityLabel).toBe('Insoluble')
    })

    it('handles unknown prediction label', () => {
      const result = apiToUnified(
        makeValidApiData({
          biologicalData: {
            solubilityPrediction: 'something_else',
          },
        }),
      )
      expect(result.biological.solubilityLabel).toBe('Desconocida')
    })

    it('derives instability label from index when status is unknown', () => {
      const result = apiToUnified(
        makeValidApiData({
          biologicalData: {
            instabilityIndex: 50,
            stabilityStatus: 'unknown',
          },
        }),
      )
      expect(result.biological.instabilityLabel).toBe('Inestable')
    })

    it('flags toxicity when alerts exist', () => {
      const result = apiToUnified(
        makeValidApiData({
          biologicalData: {
            toxicityAlerts: ['Hemolytic peptide detected'],
          },
        }),
      )
      expect(result.biological.toxicityAlert).toBe(true)
      expect(result.biological.toxicityLabel).toBe('Alerta')
    })

    it('falls back to jobId then uniprotId then pdbId for id', () => {
      const noJobId = makeValidApiData()
      delete noJobId.jobId
      const result = apiToUnified(noJobId)
      expect(result.id).toBe('P0CG47')
    })

    it('generates a timestamped id when no stable id available', () => {
      const noIds = makeValidApiData({
        jobId: undefined,
      })
      noIds.proteinMetadata.uniprotId = null
      noIds.proteinMetadata.pdbId = null

      const result = apiToUnified(noIds)
      expect(result.id).toMatch(/^job-\d+$/)
    })

    it('returns null biological when no biologicalData', () => {
      const noBio = makeValidApiData()
      delete noBio.biologicalData
      const result = apiToUnified(noBio)
      expect(result.biological).toBeNull()
    })
  })
})

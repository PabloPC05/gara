import { validateApiResponse } from '@/lib/apiSchema'

describe('validateApiResponse', () => {
  it('rejects non-object input', () => {
    expect(validateApiResponse(null).valid).toBe(false)
    expect(validateApiResponse('string').valid).toBe(false)
    expect(validateApiResponse(42).valid).toBe(false)
  })

  it('handles non-COMPLETED status gracefully', () => {
    const result = validateApiResponse({ status: 'PENDING', job_id: 'j1' })
    expect(result.valid).toBe(true)
    expect(result.data.status).toBe('PENDING')
    expect(result.data.proteinMetadata).toBeNull()
    expect(result.data.structuralData).toBeNull()
    expect(result.data.biologicalData).toBeNull()
  })

  it('defaults status to UNKNOWN if missing', () => {
    const result = validateApiResponse({ job_id: 'j1' })
    expect(result.data.status).toBe('UNKNOWN')
  })

  it('parses a COMPLETED response with full data', () => {
    const raw = {
      status: 'COMPLETED',
      job_id: 'job-123',
      protein_metadata: {
        protein_name: 'Ubiquitin',
        organism: 'Homo sapiens',
        uniprot_id: 'P0CG47',
        pdb_id: '1UBQ',
        data_source: 'AlphaFold DB',
      },
      structural_data: {
        pdb_file: 'ATOM...',
        cif_file: '',
        confidence: {
          plddt_mean: 85.4,
          mean_pae: 3.8,
          plddt_per_residue: [90, 88, 85],
          plddt_histogram: { very_high: 50, high: 30, medium: 15, low: 5 },
          pae_matrix: [[0, 1], [1, 0]],
        },
      },
      biological_data: {
        solubility_score: 79.8,
        solubility_prediction: 'soluble',
        instability_index: 24.3,
        stability_status: 'stable',
        toxicity_alerts: [],
        allergenicity_alerts: [],
        secondary_structure_prediction: {
          helix_percent: 30,
          strand_percent: 20,
          coil_percent: 50,
        },
        sequence_properties: {
          length: 76,
          molecular_weight_kda: 8.6,
          positive_charges: 7,
          negative_charges: 8,
          cysteine_residues: 0,
          aromatic_residues: 3,
        },
      },
      logs: 'Completed successfully',
    }

    const result = validateApiResponse(raw)
    expect(result.valid).toBe(true)
    expect(result.data.jobId).toBe('job-123')
    expect(result.data.status).toBe('COMPLETED')

    expect(result.data.proteinMetadata.proteinName).toBe('Ubiquitin')
    expect(result.data.proteinMetadata.organism).toBe('Homo sapiens')

    expect(result.data.structuralData.pdbFile).toBe('ATOM...')
    expect(result.data.structuralData.confidence.plddtMean).toBe(85.4)
    expect(result.data.structuralData.confidence.plddtPerResidue).toEqual([90, 88, 85])

    expect(result.data.biologicalData.solubilityScore).toBe(79.8)
    expect(result.data.biologicalData.sequenceProperties.length).toBe(76)

    expect(result.data.logs).toBe('Completed successfully')
  })

  it('handles COMPLETED with missing optional fields using defaults', () => {
    const raw = {
      status: 'COMPLETED',
      job_id: 'job-min',
      protein_metadata: { protein_name: 'Test' },
      structural_data: { pdb_file: '' },
    }

    const result = validateApiResponse(raw)
    expect(result.valid).toBe(true)
    expect(result.data.proteinMetadata.organism).toBe('Unknown')
    expect(result.data.structuralData.confidence).toBeNull()
    expect(result.data.biologicalData).toBeNull()
  })

  it('parses logs field correctly', () => {
    const result = validateApiResponse({ status: 'PENDING', logs: 'processing...' })
    expect(result.data.logs).toBe('processing...')
  })

  it('defaults logs to empty string when not a string', () => {
    const result = validateApiResponse({ status: 'PENDING', logs: 123 })
    expect(result.data.logs).toBe('')
  })
})

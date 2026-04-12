import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { AminoAcidPicker } from '@/components/sidebar/AminoAcidPicker'
import { JOB_PANEL_KEYS, useJobStatusStore } from '@/stores/useJobStatusStore'

describe('AminoAcidPicker job status persistence', () => {
  const defaultProps = {
    open: true,
    onOpenChange: () => {},
    onAppendLetter: () => {},
    onDeleteLast: () => {},
    onClear: () => {},
    onConfirm: () => {},
    canConfirm: true,
  }

  beforeEach(() => {
    useJobStatusStore.setState({ panelsByKey: {} })
  })

  afterEach(() => {
    cleanup()
  })

  it('reads the persisted RUNNING panel again after remount', () => {
    useJobStatusStore.getState().upsertJobPanel(JOB_PANEL_KEYS.aminoBuilder, {
      status: 'RUNNING',
      error: null,
      jobId: 'job-1',
    })

    const { unmount } = render(<AminoAcidPicker {...defaultProps} />)

    expect(screen.getByText('RUNNING')).toBeInTheDocument()

    unmount()
    render(<AminoAcidPicker {...defaultProps} />)

    expect(screen.getByText('RUNNING')).toBeInTheDocument()
  })

  it('keeps FAILED visible until dismissed', async () => {
    useJobStatusStore.getState().upsertJobPanel(JOB_PANEL_KEYS.aminoBuilder, {
      status: 'FAILED',
      error: 'Boom',
      jobId: 'job-1',
    })

    render(<AminoAcidPicker {...defaultProps} />)

    expect(screen.getByText('FAILED')).toBeInTheDocument()
    expect(screen.getByText('Boom')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /descartar/i }))
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(screen.queryByText('FAILED')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Gly')).toBeInTheDocument()
  })
})

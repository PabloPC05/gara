import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ComparisonBody } from '@/components/protein-details/ComparisonBody'

vi.mock('@/components/protein-details/ComparisonColumn', () => ({
  ComparisonColumn: ({ protein }) => (
    <div data-testid={`col-${protein.id}`}>{protein.name}</div>
  ),
}))

const makeProteins = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `prot-${i}`,
    name: `Protein ${i}`,
  }))

describe('ComparisonBody', () => {
  it('renders header with protein count', () => {
    render(<ComparisonBody proteins={makeProteins(3)} />)
    expect(screen.getByText('3 proteínas seleccionadas')).toBeInTheDocument()
  })

  it('renders columns for visible proteins', () => {
    render(<ComparisonBody proteins={makeProteins(2)} visibleCount={2} />)
    expect(screen.getByTestId('col-prot-0')).toBeInTheDocument()
    expect(screen.getByTestId('col-prot-1')).toBeInTheDocument()
  })

  it('limits visible columns to visibleCount', () => {
    render(<ComparisonBody proteins={makeProteins(5)} visibleCount={2} />)
    expect(screen.getAllByTestId(/^col-/)).toHaveLength(2)
  })

  it('shows navigation arrows when proteins exceed visibleCount', () => {
    render(<ComparisonBody proteins={makeProteins(4)} visibleCount={2} />)

    expect(screen.getByLabelText('Proteína anterior')).toBeInTheDocument()
    expect(screen.getByLabelText('Proteína siguiente')).toBeInTheDocument()
  })

  it('hides navigation arrows when all proteins fit', () => {
    render(<ComparisonBody proteins={makeProteins(2)} visibleCount={2} />)

    expect(screen.queryByLabelText('Proteína anterior')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Proteína siguiente')).not.toBeInTheDocument()
  })

  it('navigates forward with next button', async () => {
    const user = userEvent.setup()
    render(<ComparisonBody proteins={makeProteins(4)} visibleCount={2} />)

    expect(screen.getByTestId('col-prot-0')).toBeInTheDocument()
    expect(screen.getByTestId('col-prot-1')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Proteína siguiente'))

    expect(screen.getByTestId('col-prot-1')).toBeInTheDocument()
    expect(screen.getByTestId('col-prot-2')).toBeInTheDocument()
  })

  it('navigates backward with prev button', async () => {
    const user = userEvent.setup()
    render(<ComparisonBody proteins={makeProteins(4)} visibleCount={2} />)

    await user.click(screen.getByLabelText('Proteína siguiente'))
    await user.click(screen.getByLabelText('Proteína anterior'))

    expect(screen.getByTestId('col-prot-0')).toBeInTheDocument()
  })

  it('disables prev at start and next at end', () => {
    render(<ComparisonBody proteins={makeProteins(3)} visibleCount={2} />)

    expect(screen.getByLabelText('Proteína anterior')).toBeDisabled()
  })

  it('shows pagination indicators', () => {
    render(<ComparisonBody proteins={makeProteins(4)} visibleCount={2} />)
    const indicators = document.querySelectorAll('.h-1.rounded-full')
    expect(indicators).toHaveLength(4)
  })

  it('shows helper text when no navigation needed', () => {
    render(<ComparisonBody proteins={makeProteins(2)} visibleCount={2} />)
    expect(screen.getByText(/Shift \+ click/i)).toBeInTheDocument()
  })

  it('shows navigation helper text when needed', () => {
    render(<ComparisonBody proteins={makeProteins(4)} visibleCount={2} />)
    expect(screen.getByText(/usa las flechas/i)).toBeInTheDocument()
  })
})

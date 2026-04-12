import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FastaBar } from '@/components/FastaBar'
import { vi } from 'vitest'
import { useEffect } from 'react'

// Mock de stores
const mockProteinStore = {
  activeProteinId: null,
  proteinsById: {},
  selectedProteinIds: [],
}

const mockUIStore = {
  activeTab: null,
  detailsPanelOpen: false,
  focusedResidueByProtein: {},
  setFocusedResidue: vi.fn(),
}

vi.mock('@/stores/useProteinStore', () => ({
  useProteinStore: (selector) => selector(mockProteinStore),
}))

vi.mock('@/stores/useUIStore', () => ({
  useUIStore: (selector) => selector(mockUIStore),
}))

// Mock de useAminoAcidBuilder
const mockBuilder = {
  isPickerOpen: false,
  draftSequence: '',
  handlePickerOpenChange: vi.fn(),
  handleConfirmPicker: vi.fn(),
  appendLetter: vi.fn(),
  deleteLastLetter: vi.fn(),
  clearDraft: vi.fn(),
  setDraftSequence: vi.fn(),
}

vi.mock('@/hooks/useAminoAcidBuilder', () => ({
  useAminoAcidBuilder: () => mockBuilder,
}))

// Mock de isValidEntry
vi.mock('@/hooks/useCommandEntries', () => ({
  isValidEntry: (seq) => seq.length > 0,
}))

// Mock de componentes UI (Tooltip puede ser problemático en tests)
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }) => children,
  TooltipContent: ({ children }) => <div>{children}</div>,
  TooltipProvider: ({ children }) => children,
  TooltipTrigger: ({ children }) => children,
}))

// Mock de shadcn Carousel
vi.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children, setApi }) => {
    useEffect(() => {
      if (setApi) setApi({
        scrollTo: vi.fn(),
        scrollBy: vi.fn(),
        containerNode: () => null,
      })
    }, [setApi])
    return <div data-testid="mock-carousel">{children}</div>
  },
  CarouselContent: ({ children }) => <div data-testid="mock-carousel-content">{children}</div>,
  CarouselItem: ({ children }) => <div data-testid="mock-carousel-item">{children}</div>,
}))

// Mock de AminoAcidPicker
vi.mock('./sidebar/AminoAcidPicker', () => ({
  AminoAcidPicker: () => <div data-testid="amino-acid-picker" />,
}))

describe('FastaBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProteinStore.activeProteinId = null
    mockProteinStore.proteinsById = {}
    mockProteinStore.selectedProteinIds = []
    mockUIStore.activeTab = null
    mockUIStore.detailsPanelOpen = false
    mockUIStore.focusedResidueByProtein = {}
    mockBuilder.draftSequence = ''
  })

  it('renders empty state message when no sequence', () => {
    render(<FastaBar />)
    expect(screen.getByText(/Sin secuencia/i)).toBeInTheDocument()
  })

  it('renders sequence as buttons when protein is loaded', () => {
    mockProteinStore.activeProteinId = 'p1'
    mockProteinStore.proteinsById = { p1: { sequence: 'MAG' } }
    
    render(<FastaBar />)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons.filter(b => ['M', 'A', 'G'].includes(b.textContent)).length).toBe(3)
  })

  it('handles keyboard input to append amino acids', async () => {
    const user = userEvent.setup()
    render(<FastaBar />)
    
    const container = screen.getByTestId('fasta-bar')
    container.focus()
    
    await user.keyboard('M')
    expect(mockBuilder.appendLetter).toHaveBeenCalledWith('M')
  })

  it('starts editing when typing over a loaded protein', async () => {
    mockProteinStore.activeProteinId = 'p1'
    mockProteinStore.proteinsById = { p1: { sequence: 'MAG' } }
    const user = userEvent.setup()
    
    render(<FastaBar />)
    
    const container = screen.getByTestId('fasta-bar')
    container.focus()
    
    await user.keyboard('I')
    expect(mockBuilder.setDraftSequence).toHaveBeenCalledWith('MAGI')
  })

  it('handles backspace to delete last letter', async () => {
    mockBuilder.draftSequence = 'MAG'
    const user = userEvent.setup()
    
    render(<FastaBar />)
    
    const container = screen.getByTestId('fasta-bar')
    container.focus()
    
    await user.keyboard('{Backspace}')
    expect(mockBuilder.deleteLastLetter).toHaveBeenCalled()
  })

  it('handles arrow keys for navigation when not editing', async () => {
    mockProteinStore.activeProteinId = 'p1'
    mockProteinStore.proteinsById = { p1: { sequence: 'MAG' } }
    mockUIStore.focusedResidueByProtein = { p1: { seqId: 1 } }
    const user = userEvent.setup()

    render(<FastaBar />)

    const container = screen.getByTestId('fasta-bar')
    container.focus()

    await user.keyboard('{ArrowRight}')
    expect(mockUIStore.setFocusedResidue).toHaveBeenCalledWith('p1', { seqId: 2 })
  })

  it('confirms draft on Enter key', async () => {
    mockBuilder.draftSequence = 'MAGIC'
    const user = userEvent.setup()
    
    render(<FastaBar />)
    
    const container = screen.getByTestId('fasta-bar')
    container.focus()
    
    await user.keyboard('{Enter}')
    expect(mockBuilder.handleConfirmPicker).toHaveBeenCalled()
  })

  it('uses zero right margin plus keyboard button width when no proteins are selected', () => {
    render(<FastaBar />)

    expect(screen.getByTestId('fasta-bar')).toHaveStyle({
      marginRight: 'calc(0rem + 2.5rem)',
    })
  })

  it('reserves collapsed details sidebar width when protein is loaded and drawer is closed', () => {
    mockProteinStore.selectedProteinIds = ['p1']
    mockProteinStore.proteinsById = { p1: { name: 'Protein 1', sequence: 'MAG' } }
    mockProteinStore.activeProteinId = 'p1'

    render(<FastaBar />)

    expect(screen.getByTestId('fasta-bar')).toHaveStyle({
      marginRight: 'calc(var(--details-sidebar-collapsed-width, 2.5rem) + 2.5rem)',
    })
  })

  it('renders two carousel rows when comparing two proteins', () => {
    mockProteinStore.activeProteinId = 'p1'
    mockProteinStore.selectedProteinIds = ['p1', 'p2']
    mockProteinStore.proteinsById = {
      p1: { name: 'Protein 1', sequence: 'MAG' },
      p2: { name: 'Protein 2', sequence: 'GAM' },
    }

    render(<FastaBar />)

    // Ambos nombres de proteína deben aparecer como labels
    expect(screen.getByText('Protein 1')).toBeInTheDocument()
    expect(screen.getByText('Protein 2')).toBeInTheDocument()

    // Debe mostrar "Comparación" como header
    expect(screen.getByText('Comparación')).toBeInTheDocument()

    // Debe haber dos carruseles (uno por proteína)
    const carousels = screen.getAllByTestId('mock-carousel')
    expect(carousels.length).toBe(2)
  })

  it('shows single carousel when only one protein is selected', () => {
    mockProteinStore.activeProteinId = 'p1'
    mockProteinStore.selectedProteinIds = ['p1']
    mockProteinStore.proteinsById = {
      p1: { name: 'Protein 1', sequence: 'MAG' },
    }

    render(<FastaBar />)

    expect(screen.getByText('Secuencia')).toBeInTheDocument()
    const carousels = screen.getAllByTestId('mock-carousel')
    expect(carousels.length).toBe(1)
  })

  it('navigates arrow keys on the protein that has focus in comparison mode', async () => {
    mockProteinStore.activeProteinId = 'p1'
    mockProteinStore.selectedProteinIds = ['p1', 'p2']
    mockProteinStore.proteinsById = {
      p1: { name: 'Protein 1', sequence: 'MAG' },
      p2: { name: 'Protein 2', sequence: 'GAMK' },
    }
    // Focus está en p2, residuo 2
    mockUIStore.focusedResidueByProtein = { p2: { seqId: 2 } }
    const user = userEvent.setup()

    render(<FastaBar />)
    screen.getByTestId('fasta-bar').focus()

    await user.keyboard('{ArrowRight}')
    // Debe navegar dentro de p2 (la proteína con foco), no de p1
    expect(mockUIStore.setFocusedResidue).toHaveBeenCalledWith('p2', { seqId: 3 })
  })

  it('uses comparison drawer width as fallback when details panel is open', () => {
    mockUIStore.detailsPanelOpen = true
    mockProteinStore.selectedProteinIds = ['p1', 'p2']
    mockProteinStore.proteinsById = {
      p1: { name: 'Protein 1', sequence: 'MAG' },
      p2: { name: 'Protein 2', sequence: 'GAM' },
    }

    render(<FastaBar />)

    expect(screen.getByTestId('fasta-bar')).toHaveStyle({
      marginRight: 'calc(var(--details-sidebar-width, min(44rem, calc(100vw - 4rem))) + 2.5rem)',
    })
  })
})

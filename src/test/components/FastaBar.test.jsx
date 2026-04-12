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
  focusedResidue: null,
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
    mockUIStore.focusedResidue = null
    mockBuilder.draftSequence = ''
  })

  it('renders empty state message when no sequence', () => {
    render(<FastaBar />)
    expect(screen.getByText(/Haz clic aquí para empezar a escribir/i)).toBeInTheDocument()
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
    mockUIStore.focusedResidue = { proteinId: 'p1', seqId: 1 }
    const user = userEvent.setup()
    
    render(<FastaBar />)
    
    const container = screen.getByTestId('fasta-bar')
    container.focus()
    
    await user.keyboard('{ArrowRight}')
    expect(mockUIStore.setFocusedResidue).toHaveBeenCalledWith({ proteinId: 'p1', seqId: 2 })
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

  it('reserves collapsed details sidebar width when drawer is closed', () => {
    render(<FastaBar />)

    expect(screen.getByTestId('fasta-bar')).toHaveStyle({
      marginRight: 'var(--details-sidebar-collapsed-width, 2.5rem)',
    })
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
      marginRight: 'var(--details-sidebar-width, min(44rem, calc(100vw - 4rem)))',
    })
  })
})

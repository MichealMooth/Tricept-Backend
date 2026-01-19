import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from './LoginPage'

// Mocks
type MockedAuth = { login: (email: string, password: string) => Promise<void> }
vi.mock('@/hooks/useAuth', () => {
  const mock: MockedAuth = {
    login: vi.fn(async () => {}),
  }
  return { useAuth: () => mock }
})

vi.mock('react-router-dom', () => {
  return {
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null }),
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rendert Login-Formular', () => {
    render(<LoginPage />)
    expect(screen.getByRole('heading', { name: 'Anmelden' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-Mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument()
  })

  it('zeigt Fehler bei ungültiger Email', async () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('E-Mail'), { target: { value: 'not-an-email' } })
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: '1234567890' } })
    fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }))

    await waitFor(() => {
      // zodResolver erzeugt Standardtext für Email-Fehler
      expect(screen.getByText(/Invalid email|Ungültig|E-Mail/i)).toBeTruthy()
    })
  })

  it('ruft login() bei Submit auf', async () => {
    const { useAuth } = await import('@/hooks/useAuth') as any
    const mock = useAuth() as MockedAuth

    render(<LoginPage />)
    fireEvent.change(screen.getByLabelText('E-Mail'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText('Passwort'), { target: { value: '1234567890' } })
    fireEvent.click(screen.getByRole('button', { name: 'Anmelden' }))

    await waitFor(() => {
      expect(mock.login).toHaveBeenCalledWith('user@example.com', '1234567890')
    })
  })
})

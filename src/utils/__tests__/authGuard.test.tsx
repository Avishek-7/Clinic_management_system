import { render, screen } from '@testing-library/react'
import useAuthGuard from '../authGuard'

// Mock Firebase auth
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-uid', email: 'test@example.com' },
    onAuthStateChanged: jest.fn(),
  },
  db: {},
}))

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}))

// Mock the hook to test its behavior
const TestComponent = ({ expectedRole }: { expectedRole?: 'doctor' | 'receptionist' }) => {
  const loading = useAuthGuard(expectedRole)
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return <div>Authenticated</div>
}

describe('AuthGuard Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show loading state initially', () => {
    render(<TestComponent />)
    expect(screen.getByText('Loading...')).toBeDefined()
  })

  it('should handle authentication state changes', () => {
    render(<TestComponent expectedRole="doctor" />)
    
    // Initially should show loading
    expect(screen.getByText('Loading...')).toBeDefined()
  })
}) 
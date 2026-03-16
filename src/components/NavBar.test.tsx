import { render, screen, fireEvent } from '@testing-library/react';
import { NavBar } from './NavBar';
import { AuthProvider } from '../contexts/AuthContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock useAuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuthContext: vi.fn(() => ({
    user: null,
    profile: null,
    loading: false,
    isConfirmed: false
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NavBar', () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo and basic links', () => {
    render(
      <BrowserRouter>
        <NavBar onNavigate={mockOnNavigate} />
      </BrowserRouter>
    );

    expect(screen.getByText(/SPARK/i)).toBeInTheDocument();
    expect(screen.getByText(/Wavv/i)).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
  });

  it('shows Dashboard button when unauthenticated', () => {
    render(
      <BrowserRouter>
        <NavBar onNavigate={mockOnNavigate} />
      </BrowserRouter>
    );

    const dashboardBtn = screen.getByRole('button', { name: /Dashboard/i });
    expect(dashboardBtn).toBeInTheDocument();
    
    fireEvent.click(dashboardBtn);
    expect(mockOnNavigate).toHaveBeenCalledWith('login');
  });

  it('shows user dashboard and settings when authenticated', async () => {
    const { useAuthContext } = await import('../contexts/AuthContext');
    (useAuthContext as any).mockReturnValue({
      user: { uid: '123' },
      profile: { uid: '123' },
      loading: false,
      isConfirmed: true
    });

    render(
      <BrowserRouter>
        <NavBar onNavigate={mockOnNavigate} />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByTitle('Settings')).toBeInTheDocument();
    expect(screen.getByTitle('Sign Out')).toBeInTheDocument();
  });
});

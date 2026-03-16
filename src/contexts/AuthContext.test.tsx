import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuthContext } from './AuthContext';
import { onAuthStateChanged } from 'firebase/auth';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  auth: {},
  db: {},
  isFirebaseConfigured: true,
}));

const TestComponent = () => {
  const { status, user } = useAuthContext();
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="user">{user ? 'logged-in' : 'logged-out'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch for profile requests
    global.fetch = vi.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ uid: '123', role: 'user' })
      })
    ) as any;
  });

  it('starts in initializing status', () => {
    (onAuthStateChanged as any).mockReturnValue(() => {});
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('status')).toHaveTextContent('initializing');
  });

  it('transitions to unauthenticated when no user is found', async () => {
    let authCallback: any;
    (onAuthStateChanged as any).mockImplementation((_auth: any, callback: any) => {
      authCallback = callback;
      return () => {};
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Simulate Firebase returning null user
    await act(async () => {
      authCallback(null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
    });
  });

  it('transitions to authenticated when a user is found', async () => {
    let authCallback: any;
    (onAuthStateChanged as any).mockImplementation((_auth: any, callback: any) => {
      authCallback = callback;
      return () => {};
    });

    const mockUser = {
      uid: '123',
      email: 'test@example.com',
      getIdToken: vi.fn().mockResolvedValue('mock-token')
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Simulate Firebase returning a user
    await act(async () => {
      authCallback(mockUser);
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready');
      expect(screen.getByTestId('user')).toHaveTextContent('logged-in');
    });
  });
});

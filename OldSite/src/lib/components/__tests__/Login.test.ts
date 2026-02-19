import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import Login from '../Login.svelte';
import { setupTestEnvironment, mockUserContext } from '../../../../test-utils/test-helpers';

// Mock Firebase auth
const mockSignIn = vi.fn();
const mockOnAuthStateChanged = vi.fn();

vi.mock('$lib/firebase', () => ({
  auth: {
    signInWithEmailAndPassword: mockSignIn,
    onAuthStateChanged: mockOnAuthStateChanged
  }
}));

// Mock SvelteKit functions
vi.mock('@sveltejs/kit', () => ({
  fail: vi.fn((status, data) => ({ type: 'failure', status, data })),
  redirect: vi.fn()
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupTestEnvironment();
    mockUserContext(null);
  });

  it('renders login form', () => {
    render(Login);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(Login);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(Login);
    
    const emailInput = screen.getByLabelText(/email/i);
    await fireEvent.input(emailInput, {
      target: { value: 'invalid-email' }
    });
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    render(Login);
    
    const passwordInput = screen.getByLabelText(/password/i);
    await fireEvent.input(passwordInput, {
      target: { value: '123' }
    });
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockSignIn.mockResolvedValue({
      user: { 
        uid: 'test-uid', 
        email: 'test@example.com',
        getIdToken: vi.fn().mockResolvedValue('mock-token')
      }
    });

    render(Login);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await fireEvent.input(emailInput, {
      target: { value: 'test@example.com' }
    });
    await fireEvent.input(passwordInput, {
      target: { value: 'password123' }
    });
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error message on login failure', async () => {
    mockSignIn.mockRejectedValue({
      code: 'auth/invalid-credential',
      message: 'Invalid credentials'
    });

    render(Login);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await fireEvent.input(emailInput, {
      target: { value: 'test@example.com' }
    });
    await fireEvent.input(passwordInput, {
      target: { value: 'wrongpassword' }
    });
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    // Mock a slow sign in
    mockSignIn.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        user: { uid: 'test-uid', email: 'test@example.com' }
      }), 100))
    );

    render(Login);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await fireEvent.input(emailInput, {
      target: { value: 'test@example.com' }
    });
    await fireEvent.input(passwordInput, {
      target: { value: 'password123' }
    });
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await fireEvent.click(submitButton);
    
    // Check loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
    });
  });

  it('handles different Firebase auth errors', async () => {
    const testCases = [
      { code: 'auth/user-not-found', expectedMessage: /no account found/i },
      { code: 'auth/wrong-password', expectedMessage: /invalid email or password/i },
      { code: 'auth/too-many-requests', expectedMessage: /too many failed attempts/i },
      { code: 'auth/user-disabled', expectedMessage: /account has been disabled/i }
    ];

    for (const testCase of testCases) {
      vi.clearAllMocks();
      mockSignIn.mockRejectedValue({ code: testCase.code });

      const { unmount } = render(Login);
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      await fireEvent.input(emailInput, {
        target: { value: 'test@example.com' }
      });
      await fireEvent.input(passwordInput, {
        target: { value: 'password123' }
      });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testCase.expectedMessage)).toBeInTheDocument();
      });

      unmount();
    }
  });

  it('shows forgot password link', () => {
    render(Login);
    
    const forgotPasswordLink = screen.getByText(/forgot password/i);
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
  });

  it('shows register link', () => {
    render(Login);
    
    const registerLink = screen.getByText(/create account/i);
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register/loved-one');
  });
});

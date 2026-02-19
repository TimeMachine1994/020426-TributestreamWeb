import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Login from './Login.svelte';

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
	signInWithEmailAndPassword: vi.fn(),
	signInWithPopup: vi.fn(),
	GoogleAuthProvider: vi.fn()
}));

vi.mock('$lib/firebase', () => ({
	auth: {}
}));

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

describe('Login Component', () => {
	it('renders login form with correct fields', () => {
		render(Login);

		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
	});

	it('allows user to enter email and password', async () => {
		render(Login);

		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.input(passwordInput, { target: { value: 'password123' } });

		expect(emailInput).toHaveValue('test@example.com');
		expect(passwordInput).toHaveValue('password123');
	});

	it('shows loading state when submitting', async () => {
		const { signInWithEmailAndPassword } = await import('firebase/auth');
		vi.mocked(signInWithEmailAndPassword).mockImplementation(
			() => new Promise((resolve) => setTimeout(resolve, 100))
		);

		render(Login);

		const submitButton = screen.getByRole('button', { name: /login/i });
		await fireEvent.click(submitButton);

		expect(screen.getByText('Logging in...')).toBeInTheDocument();
	});

	it('displays error message on login failure', async () => {
		const { signInWithEmailAndPassword } = await import('firebase/auth');
		vi.mocked(signInWithEmailAndPassword).mockRejectedValue(new Error('Invalid credentials'));

		render(Login);

		const emailInput = screen.getByLabelText(/email/i);
		const passwordInput = screen.getByLabelText(/password/i);
		const submitButton = screen.getByRole('button', { name: /login/i });

		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.input(passwordInput, { target: { value: 'wrongpassword' } });
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
		});
	});

	it('has link to register page', () => {
		render(Login);

		const registerLink = screen.getByRole('link', { name: /register here/i });
		expect(registerLink).toHaveAttribute('href', '/register');
	});
});

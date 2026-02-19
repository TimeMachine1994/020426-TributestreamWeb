import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Navbar from '../Navbar.svelte';
import { setupTestEnvironment, mockUserContext } from '../../../../test-utils/test-helpers';
import { createTestUser } from '../../../../test-utils/factories';

describe('Navbar Component', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  it('renders brand logo and name', () => {
    mockUserContext(null);
    render(Navbar);
    
    expect(screen.getByText('Tributestream')).toBeInTheDocument();
    expect(screen.getByAltText('Tributestream')).toBeInTheDocument();
  });

  it('shows login/register links when not authenticated', () => {
    mockUserContext(null);
    render(Navbar);
    
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/create memorial/i)).toBeInTheDocument();
  });

  it('shows owner-specific navigation when logged in as owner', () => {
    const ownerUser = createTestUser({ role: 'owner' });
    mockUserContext(ownerUser);
    
    render(Navbar);
    
    expect(screen.getByText(/my memorials/i)).toBeInTheDocument();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
    expect(screen.queryByText(/admin portal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/funeral director portal/i)).not.toBeInTheDocument();
  });

  it('shows funeral director navigation when logged in as funeral director', () => {
    const fdUser = createTestUser({ role: 'funeral_director' });
    mockUserContext(fdUser);
    
    render(Navbar);
    
    expect(screen.getByText(/funeral director portal/i)).toBeInTheDocument();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
    expect(screen.queryByText(/my memorials/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/admin portal/i)).not.toBeInTheDocument();
  });

  it('shows admin navigation when logged in as admin', () => {
    const adminUser = createTestUser({ role: 'admin' });
    mockUserContext(adminUser);
    
    render(Navbar);
    
    expect(screen.getByText(/admin portal/i)).toBeInTheDocument();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
  });

  it('shows user email in dropdown', () => {
    const user = createTestUser({ email: 'test@example.com' });
    mockUserContext(user);
    
    render(Navbar);
    
    // Click user menu button
    const userButton = screen.getByRole('button', { name: /user menu/i });
    fireEvent.click(userButton);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('handles logout', async () => {
    const mockSignOut = vi.fn();
    vi.mock('$lib/firebase', () => ({
      auth: {
        signOut: mockSignOut
      }
    }));

    const user = createTestUser();
    mockUserContext(user);
    
    render(Navbar);
    
    // Open user menu
    const userButton = screen.getByRole('button', { name: /user menu/i });
    await fireEvent.click(userButton);
    
    // Click logout
    const logoutButton = screen.getByText(/sign out/i);
    await fireEvent.click(logoutButton);
    
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('toggles mobile menu', async () => {
    mockUserContext(null);
    render(Navbar);
    
    // Mobile menu should be hidden initially
    expect(screen.queryByText(/mobile menu/i)).not.toBeInTheDocument();
    
    // Click hamburger menu
    const menuButton = screen.getByRole('button', { name: /menu/i });
    await fireEvent.click(menuButton);
    
    // Mobile menu should be visible
    expect(screen.getByRole('navigation', { name: /mobile menu/i })).toBeInTheDocument();
  });

  it('shows correct navigation links in mobile menu', async () => {
    const user = createTestUser({ role: 'owner' });
    mockUserContext(user);
    
    render(Navbar);
    
    // Open mobile menu
    const menuButton = screen.getByRole('button', { name: /menu/i });
    await fireEvent.click(menuButton);
    
    const mobileMenu = screen.getByRole('navigation', { name: /mobile menu/i });
    expect(mobileMenu).toBeInTheDocument();
    
    // Check owner-specific links in mobile menu
    expect(screen.getAllByText(/my memorials/i)).toHaveLength(2); // Desktop + mobile
    expect(screen.getAllByText(/profile/i)).toHaveLength(2); // Desktop + mobile
  });

  it('highlights active navigation item', () => {
    const user = createTestUser({ role: 'owner' });
    mockUserContext(user);
    
    // Mock current page
    vi.mock('$app/stores', () => ({
      page: {
        subscribe: vi.fn((callback) => {
          callback({
            url: new URL('http://localhost:5173/profile'),
            route: { id: '/profile' }
          });
          return () => {};
        })
      }
    }));
    
    render(Navbar);
    
    const profileLink = screen.getByRole('link', { name: /profile/i });
    expect(profileLink).toHaveClass('text-amber-600'); // Active state for owner theme
  });

  it('shows search functionality', () => {
    mockUserContext(null);
    render(Navbar);
    
    expect(screen.getByPlaceholderText(/search memorials/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('handles search submission', async () => {
    const { goto } = setupTestEnvironment();
    mockUserContext(null);
    
    render(Navbar);
    
    const searchInput = screen.getByPlaceholderText(/search memorials/i);
    await fireEvent.input(searchInput, {
      target: { value: 'John Doe' }
    });
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    await fireEvent.click(searchButton);
    
    expect(goto).toHaveBeenCalledWith('/search?q=John+Doe');
  });

  it('shows notification badge when user has notifications', () => {
    const user = createTestUser({ 
      role: 'funeral_director',
      notifications: [{ id: '1', message: 'New memorial created' }]
    });
    mockUserContext(user);
    
    render(Navbar);
    
    expect(screen.getByText('1')).toBeInTheDocument(); // Notification count
  });

  it('applies correct theme colors based on user role', () => {
    const ownerUser = createTestUser({ role: 'owner' });
    mockUserContext(ownerUser);
    
    const { rerender } = render(Navbar);
    
    // Check owner theme (amber)
    const ownerButton = screen.getByRole('button', { name: /user menu/i });
    expect(ownerButton).toHaveClass('text-amber-600');
    
    // Switch to funeral director
    const fdUser = createTestUser({ role: 'funeral_director' });
    mockUserContext(fdUser);
    rerender({});
    
    // Check funeral director theme (purple)
    const fdButton = screen.getByRole('button', { name: /user menu/i });
    expect(fdButton).toHaveClass('text-purple-600');
  });

});

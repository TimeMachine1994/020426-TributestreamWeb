import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Button from '../minimal-modern/Button.svelte';
import { setupTestEnvironment } from '../../../../test-utils/test-helpers';

describe('Button Component', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  it('renders with default props', () => {
    render(Button, {
      props: {
        children: () => 'Click me'
      }
    });
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('applies different themes correctly', () => {
    const { rerender } = render(Button, {
      props: {
        theme: 'owner',
        variant: 'primary',
        children: () => 'Owner Button'
      }
    });
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-amber-600'); // owner theme
    
    rerender({
      theme: 'funeral_director',
      variant: 'primary',
      children: () => 'FD Button'
    });
    
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-purple-600'); // funeral_director theme
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(Button, {
      props: {
        variant: 'primary',
        children: () => 'Primary'
      }
    });
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-900'); // primary variant
    
    rerender({
      variant: 'secondary',
      children: () => 'Secondary'
    });
    
    button = screen.getByRole('button');
    expect(button).toHaveClass('border-gray-300'); // secondary variant
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    
    render(Button, {
      props: {
        onclick: handleClick,
        children: () => 'Click me'
      }
    });
    
    const button = screen.getByRole('button');
    await fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(Button, {
      props: {
        disabled: true,
        children: () => 'Disabled'
      }
    });
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('applies custom CSS classes', () => {
    render(Button, {
      props: {
        class: 'custom-class another-class',
        children: () => 'Custom'
      }
    });
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class', 'another-class');
  });

  it('supports different button types', () => {
    const { rerender } = render(Button, {
      props: {
        type: 'submit',
        children: () => 'Submit'
      }
    });
    
    let button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');
    
    rerender({
      type: 'reset',
      children: () => 'Reset'
    });
    
    button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'reset');
  });

  it('prevents click when disabled', async () => {
    const handleClick = vi.fn();
    
    render(Button, {
      props: {
        disabled: true,
        onclick: handleClick,
        children: () => 'Disabled'
      }
    });
    
    const button = screen.getByRole('button');
    await fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('passes through additional props', () => {
    render(Button, {
      props: {
        'data-testid': 'custom-button',
        'aria-label': 'Custom button',
        children: () => 'Custom'
      }
    });
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-testid', 'custom-button');
    expect(button).toHaveAttribute('aria-label', 'Custom button');
  });
});

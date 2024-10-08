import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Input from './Input';

describe('Input component', () => {
  it('renders input field with label', () => {
    render(<Input label='Test Label' />);
    expect(screen.getByTestId('input-label')).toBeInTheDocument();
    expect(screen.getByTestId('input-field')).toBeInTheDocument();
  });

  it('displays validation error message', () => {
    render(<Input label='Test Label' errorMsg='This field is required' />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays placeholder text', () => {
    render(<Input placeholder='Enter your name' />);
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('disables input field when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByTestId('input-field')).toBeDisabled();
  });

  it('displays the correct aria attributes', () => {
    render(<Input name='Test Input' />);
    expect(screen.getByTestId('input-field')).toHaveAttribute(
      'aria-label',
      'Test Input'
    );
  });
});

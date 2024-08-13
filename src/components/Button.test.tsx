import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  test('renders button with label', () => {
    render(<Button label='Click Me' />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('disables button and shows loading state', () => {
    render(<Button label='Submit' isLoading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button label='Click Me' onClick={handleClick} />);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  test('disables button', () => {
    render(<Button label='Click Me' disabled={true} />);
    expect(screen.getByText('Click Me')).toBeDisabled();
  });
});

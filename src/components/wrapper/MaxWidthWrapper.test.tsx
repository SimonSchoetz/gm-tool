import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import MaxWidthWrapper from './MaxWidthWrapper';

describe('MaxWidthWrapper', () => {
  test('renders children correctly', () => {
    const { getByText } = render(
      <MaxWidthWrapper>
        <div>Test Child</div>
      </MaxWidthWrapper>
    );
    expect(getByText('Test Child')).toBeInTheDocument();
  });

  test('applies correct class names', () => {
    const { container } = render(
      <MaxWidthWrapper>
        <div>Test Child</div>
      </MaxWidthWrapper>
    );

    expect(container.firstChild).toHaveClass('max-w-md w-full');
  });
});

import React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import ConditionWrapper from './ConditionWrapper';

describe('ConditionWrapper', () => {
  test('renders children when condition is true', () => {
    const { getByText } = render(
      <ConditionWrapper condition={true}>
        <div>Visible Child</div>
      </ConditionWrapper>
    );
    expect(getByText('Visible Child')).toBeInTheDocument();
  });

  test('does not render children when condition is false', () => {
    const { queryByText } = render(
      <ConditionWrapper condition={false}>
        <div>Invisible Child</div>
      </ConditionWrapper>
    );
    expect(queryByText('Invisible Child')).not.toBeInTheDocument();
  });
});

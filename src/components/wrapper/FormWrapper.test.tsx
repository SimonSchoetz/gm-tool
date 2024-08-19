import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormWrapper from './FormWrapper';
import { SchemaName } from '@/schemas/util';
import Input from '../Input';

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      prefetch: () => null,
    };
  },
}));

describe('FormWrapper', () => {
  it('renders the form with children', () => {
    const mockOnSubmit = jest.fn();

    render(
      <FormWrapper
        buttonLabel='Submit'
        schemaName={SchemaName.LOGIN}
        submitAction={mockOnSubmit}
      >
        <Input id='email' placeholder='Email' />
        <Input id='password' placeholder='Password' type='password' />
      </FormWrapper>
    );

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders a submit button', () => {
    const mockOnSubmit = jest.fn();
    render(
      <FormWrapper
        buttonLabel='Submit'
        schemaName={SchemaName.LOGIN}
        submitAction={mockOnSubmit}
      ></FormWrapper>
    );

    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('should have a disabled submit button when form is invalid', async () => {
    const mockOnSubmit = jest.fn();
    render(
      <FormWrapper
        buttonLabel='Submit'
        schemaName={SchemaName.LOGIN}
        submitAction={mockOnSubmit}
      >
        <Input id='email' placeholder='Email' value='test@example.com' />
        <Input id='password' placeholder='Password' type='password' />
      </FormWrapper>
    );
    const passwordInput = screen.getByPlaceholderText('Password');

    userEvent.type(passwordInput, 'tooshort');
    userEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeDisabled();
    });
  });
  it('should provide error messages if form is invalid', async () => {
    const mockOnSubmit = jest.fn();
    render(
      <FormWrapper
        buttonLabel='Submit'
        schemaName={SchemaName.LOGIN}
        submitAction={mockOnSubmit}
      >
        <Input id='email' placeholder='Email' value='test@example.com' />
        <Input id='password' placeholder='Password' type='password' />
      </FormWrapper>
    );
    const passwordInput = screen.getByPlaceholderText('Password');

    userEvent.type(passwordInput, 'tooshort');
    userEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(
        screen.getByText('Too short, use at least 10 characters.')
      ).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form values when submitted', async () => {
    const mockOnSubmit = jest.fn(async (values) => {
      return Promise.resolve(values);
    });

    render(
      <FormWrapper
        buttonLabel='Submit'
        schemaName={SchemaName.LOGIN}
        submitAction={mockOnSubmit}
      >
        <Input
          id='email'
          name='email'
          placeholder='Email'
          value='test@example.com'
        />
        <Input
          id='password'
          name='password'
          placeholder='Password'
          type='password'
          value='password123'
        />
      </FormWrapper>
    );

    userEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
  it('should encrypt data when encryption function is provided provided', async () => {
    const mockEncryption = jest.fn(async (values) => {
      return JSON.stringify(values);
    });

    const mockOnSubmit = jest.fn(async (values) => {
      return Promise.resolve(values);
    });

    render(
      <FormWrapper
        buttonLabel='Submit'
        schemaName={SchemaName.LOGIN}
        submitAction={mockOnSubmit}
        encrypt={mockEncryption}
      >
        <Input
          id='email'
          name='email'
          placeholder='Email'
          value='test@example.com'
        />
        <Input
          id='password'
          name='password'
          placeholder='Password'
          type='password'
          value='password123'
        />
      </FormWrapper>
    );

    userEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockEncryption).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        '5s'
      );
    });
  });
});

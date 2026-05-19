import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, test, expect } from 'vitest';
import Login from '../pages/Login';

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({ login: vi.fn() }),
}));

vi.mock('../services/api', () => ({
  authApi: { forgotPassword: vi.fn() },
}));

test('shows validation errors when fields are empty', async () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByText(/email is required/i)).toBeTruthy();
  expect(await screen.findByText(/password is required/i)).toBeTruthy();
});

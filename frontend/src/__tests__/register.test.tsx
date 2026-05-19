import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, test, expect } from 'vitest';
import Register from '../pages/Register';

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({ register: vi.fn() }),
}));

test('shows validation errors when fields are empty', async () => {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole('button', { name: /create account/i }));

  expect(await screen.findByText(/name is required/i)).toBeTruthy();
  expect(await screen.findByText(/email is required/i)).toBeTruthy();
  expect(await screen.findByText(/password must be at least 6/i)).toBeTruthy();
});

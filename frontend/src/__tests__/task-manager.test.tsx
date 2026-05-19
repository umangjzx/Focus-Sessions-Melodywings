import { render, screen } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import TaskManager from '../pages/TaskManager';

vi.mock('../services/api', () => ({
  tasksApi: {
    getAll: vi.fn(() => Promise.resolve({ data: [] })),
    create: vi.fn(() => Promise.resolve({})),
    update: vi.fn(() => Promise.resolve({})),
    delete: vi.fn(() => Promise.resolve({})),
  },
}));

test('renders task manager heading', async () => {
  render(<TaskManager />);
  expect(await screen.findByText(/tasks/i)).toBeTruthy();
});

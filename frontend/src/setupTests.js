import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Existing test files use jest.fn()/jest.mock() — alias to vitest's equivalent
// rather than rewriting every test file during the Vite migration.
globalThis.jest = vi;

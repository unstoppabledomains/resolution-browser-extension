// extends jest to include DOM expectations
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import {setLogger as setReactQueryLogger} from 'react-query';
import {TextDecoder, TextEncoder} from 'util';

// https://react-query.tanstack.com/guides/testing#turn-off-network-error-logging
setReactQueryLogger({
  log: console.log,
  warn: console.warn,
  error: () => {},
});

// Prevent URL.createObjectURL from failing inside tests
window.URL.createObjectURL = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).TextEncoder = TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).TextDecoder = TextDecoder;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}

  disconnect() {
    return null;
  }

  observe() {
    return null;
  }

  takeRecords() {
    return null;
  }

  unobserve() {
    return null;
  }
};

// It fails in tests so we mock it
jest.mock('bip322-js', () => ({
  Verifier: {
    verifySignature: jest.fn(),
  },
}));

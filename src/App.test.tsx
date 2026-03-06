import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <HelmetProvider>
        <App />
      </HelmetProvider>
    );
    // Basic smoke test - ensure the app renders
    expect(container).toBeDefined();
  });
});

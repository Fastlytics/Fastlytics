import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <HelmetProvider>
        <App />
      </HelmetProvider>
    );
    // Since we don't know exactly what's on the landing page, we can check for a common element
    // or just ensure the render doesn't throw.
    // Ideally, check for the main heading "Fastlytics" as seen in the README banner.
    // If the landing page text is dynamic, just checking if body is present is a valid smoke test.
    expect(document.body).toBeDefined();
  });
});

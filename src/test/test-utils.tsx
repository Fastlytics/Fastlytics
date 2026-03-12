import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});

interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

/**
 * Wrapper component that provides all necessary context providers for testing.
 * Includes:
 * - React Router (BrowserRouter)
 * - TanStack Query (QueryClientProvider)
 */
function AllProviders({ children, queryClient = defaultQueryClient }: AllProvidersProps) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BrowserRouter>
  );
}

/**
 * Custom render function that wraps components with all required providers.
 * Use this instead of render() for component tests that need routing/query context.
 *
 * @example
 * ```tsx
 * import { renderWithProviders } from '@test/test-utils';
 *
 * test('renders component', () => {
 *   renderWithProviders(<MyComponent />);
 * });
 * ```
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return {
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
}

/**
 * Creates a custom query client for testing with specific options.
 *
 * @example
 * ```tsx
 * const queryClient = createTestQueryClient();
 * renderWithProviders(<Component />, { queryClient });
 * ```
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

// Re-export all testing-library utilities
export * from '@testing-library/react';

// Export query client creator for more control
export { defaultQueryClient };

import { createHashRouter } from 'react-router'
import ErrorBoundary from './pages/error/ErrorBoundary'
import { RootLayout } from './layouts/RootLayout'

const router = createHashRouter(
  [
    {
      errorElement: <ErrorBoundary />,
      Component: RootLayout,
      children: [
        {},
        {
          path: '*',
          lazy: () => import('./pages/error/NotFoundPage')
        }
      ]
    }
  ],
  {
    future: {
      // v7_partialHydration: true,
    }
  }
)

export default router

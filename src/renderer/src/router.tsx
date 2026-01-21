import { createHashRouter } from 'react-router'
import ErrorBoundary from './pages/error/ErrorBoundary'

const router = createHashRouter(
  [
    {
      errorElement: <ErrorBoundary />,
      children: [
        {
          path: '/',
          lazy: () => import('./pages/home/HomePage')
        },
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

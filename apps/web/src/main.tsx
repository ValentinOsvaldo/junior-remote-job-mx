import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import { JobRoute, NotFound, Shell } from './routes.tsx'

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } })
const motionFeatures = () => import('./lib/motion-features.ts').then((mod) => mod.default)

// Data mode: add `loader`s here when there's an API (apps/api).
const router = createBrowserRouter([
  { path: '/', Component: Shell, children: [{ path: 'job/:id', Component: JobRoute }] },
  { path: '*', Component: NotFound },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={motionFeatures} strict>
        <MotionConfig reducedMotion="user">
          <RouterProvider router={router} />
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  </StrictMode>,
)

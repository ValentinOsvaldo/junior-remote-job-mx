import { Activity, ViewTransition } from 'react'
import { Link, Outlet, ScrollRestoration, useMatch, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { JobPage } from './features/jobs/JobPage.tsx'
import { ListPage } from './features/jobs/ListPage.tsx'

/**
 * Root layout. The list stays mounted (hidden) while a job is open, so filters, loaded pages
 * and scroll position survive; child routes (job detail) render in the <Outlet>.
 *
 * Slides: the list only ever leaves "forward" (into a job) and comes back "back", the job page
 * the opposite, so static classes do it (React Router has no API for transition types).
 */
export function Shell() {
  const onList = useMatch('/') !== null
  return (
    <>
      <ScrollRestoration />
      <Activity mode={onList ? 'visible' : 'hidden'}>
        <ViewTransition enter="nav-back" exit="nav-forward" default="none">
          <ListPage />
        </ViewTransition>
      </Activity>
      <Outlet />
    </>
  )
}

export function JobRoute() {
  const { id = '' } = useParams()
  return (
    <ViewTransition enter="nav-forward" exit="nav-back" default="none">
      <JobPage key={id} id={id} />
    </ViewTransition>
  )
}

export function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center px-4 text-center">
      <h1 className="text-lg font-semibold">Página no encontrada</h1>
      <p className="mt-1 text-sm text-muted-foreground">La dirección no existe o cambió.</p>
      <Button asChild className="mx-auto mt-5 px-5 font-semibold">
        <Link to="/">Ver vacantes</Link>
      </Button>
    </main>
  )
}

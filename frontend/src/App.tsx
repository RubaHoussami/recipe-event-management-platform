import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { DashboardLayout } from './layouts/DashboardLayout'
import { RecipesPage } from './pages/RecipesPage'
import { EventsPage } from './pages/EventsPage'
import { DashboardHome } from './pages/DashboardHome'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'recipes', element: <RecipesPage /> },
      { path: 'events', element: <EventsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}

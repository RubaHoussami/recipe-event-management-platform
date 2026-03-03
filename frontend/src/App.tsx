import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { DashboardLayout } from './layouts/DashboardLayout'
import { RecipesPage } from './pages/RecipesPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipeFormPage } from './pages/RecipeFormPage'
import { EventsPage } from './pages/EventsPage'
import { EventsNewPage } from './pages/EventsNewPage'
import { DashboardHome } from './pages/DashboardHome'
import { SettingsPage } from './pages/SettingsPage'
import { FriendsPage } from './pages/FriendsPage'
import { NotificationsPage } from './pages/NotificationsPage'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'recipes', element: <RecipesPage /> },
      { path: 'recipes/new', element: <RecipeFormPage /> },
      { path: 'recipes/:id', element: <RecipeDetailPage /> },
      { path: 'recipes/:id/edit', element: <RecipeFormPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'events/new', element: <EventsNewPage /> },
      { path: 'friends', element: <FriendsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}

import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { DashboardLayout } from './layouts/DashboardLayout'
import { RecipesPage } from './pages/RecipesPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipeFormPage } from './pages/RecipeFormPage'
import { ParseRecipePage } from './pages/ParseRecipePage'
import { EventsPage } from './pages/EventsPage'
import { EventFormPage } from './pages/EventFormPage'
import { ParseEventPage } from './pages/ParseEventPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { DashboardHome } from './pages/DashboardHome'
import { SettingsPage } from './pages/SettingsPage'
import { FriendsPage } from './pages/FriendsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { SharedWithMePage } from './pages/SharedWithMePage'
import { InviteRespondPage } from './pages/InviteRespondPage'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'recipes', element: <RecipesPage /> },
      { path: 'recipes/new', element: <RecipeFormPage /> },
      { path: 'recipes/new/parse', element: <ParseRecipePage /> },
      { path: 'recipes/:id', element: <RecipeDetailPage /> },
      { path: 'recipes/:id/edit', element: <RecipeFormPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'events/new', element: <EventFormPage /> },
      { path: 'events/new/parse', element: <ParseEventPage /> },
      { path: 'events/:id', element: <EventDetailPage /> },
      { path: 'events/:id/edit', element: <EventFormPage /> },
      { path: 'shared', element: <SharedWithMePage /> },
      { path: 'invites/respond/:token', element: <InviteRespondPage /> },
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

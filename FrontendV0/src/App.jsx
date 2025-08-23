import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router';

import CallHistory from './screens/callHistory';
import ConfigScreen from './screens/configScreen';
import ContactDirectoryScreen from './screens/contactDirectoryScreen';
import NavigationSidebar from './components/navBar';
import Setup1 from './screens/setup/setup_1';
import Setup2 from './screens/setup/setup_2';
import Setup3 from './screens/setup/setup_3';
import CampaignEdit from './screens/campaign_edit'

import Login from './screens/auth/Login';
import Signup from './screens/auth/Signup';
import ForgotPassword from './screens/auth/ForgotPassword';
import EnterCode from './screens/auth/EnterCode';
import ResetPassword from './screens/auth/ResetPassword';
import PasswordResetSuccess from './screens/auth/PasswordResetSuccess';
import NotAuthenticated from './screens/auth/NotAuthenticated';

// Auth check utility
function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}

// Wrapper for protected routes
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/not-authenticated" replace />;
  }
  return children;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
        <Login />
    ),
  },
  {
    path: '/contactDirectory',
    element: (
      <ProtectedRoute>
        <NavigationSidebar>
          <ContactDirectoryScreen />
        </NavigationSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/config',
    element: (
      <ProtectedRoute>
        <NavigationSidebar>
          <ConfigScreen />
        </NavigationSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/callHistory',
    element: (
      <ProtectedRoute>
        <NavigationSidebar>
          <CallHistory />
        </NavigationSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/config/setup1',
    element: (
      <ProtectedRoute>
        <NavigationSidebar>
          <Setup1 />
        </NavigationSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/config/setup2',
    element: (
      <ProtectedRoute>
        <NavigationSidebar>
          <Setup2 />
        </NavigationSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/config/setup3',
    element: (
      <ProtectedRoute>
        <NavigationSidebar>
          <Setup3 />
        </NavigationSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/campaign-edit',
    element: (
      <ProtectedRoute>
        <NavigationSidebar>
          <CampaignEdit />
        </NavigationSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/enter-code',
    element: <EnterCode />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/password-reset-success',
    element: <PasswordResetSuccess />,
  },
  {
    path: '/not-authenticated',
    element: <NotAuthenticated />,
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
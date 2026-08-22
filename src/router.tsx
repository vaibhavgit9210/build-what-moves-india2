/**
 * Route table. Pages are lazy-loaded; authenticated areas sit behind
 * RequireAuth. Uses hash routing so deep links work on GitHub Pages.
 */
import { lazy, Suspense, type ReactNode } from 'react';
import { createHashRouter, Navigate, useLocation } from 'react-router-dom';
import AppShell from '@/components/shell/AppShell';
import { Spinner } from '@/components/ui/Misc';
import { useAuth } from '@/state/AuthContext';

const Landing = lazy(() => import('@/pages/Landing'));
const Help = lazy(() => import('@/pages/Help'));
const SafetyTips = lazy(() => import('@/pages/SafetyTips'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const AccessibilityStatement = lazy(() => import('@/pages/AccessibilityStatement'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const Profile = lazy(() => import('@/pages/auth/Profile'));
const Settings = lazy(() => import('@/pages/auth/Settings'));

const ReportStart = lazy(() => import('@/pages/report/ReportStart'));
const ReportLocation = lazy(() => import('@/pages/report/ReportLocation'));
const ReportIdentity = lazy(() => import('@/pages/report/ReportIdentity'));
const ReportQuestions = lazy(() => import('@/pages/report/ReportQuestions'));
const ReportCategory = lazy(() => import('@/pages/report/ReportCategory'));
const ReportGuidance = lazy(() => import('@/pages/report/ReportGuidance'));
const ReportDescription = lazy(() => import('@/pages/report/ReportDescription'));
const ReportDetails = lazy(() => import('@/pages/report/ReportDetails'));
const ReportEvidence = lazy(() => import('@/pages/report/ReportEvidence'));
const ReportReview = lazy(() => import('@/pages/report/ReportReview'));
const ReportSuccess = lazy(() => import('@/pages/report/ReportSuccess'));

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ReportDetail = lazy(() => import('@/pages/ReportDetail'));
const Track = lazy(() => import('@/pages/Track'));

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    const next = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}

const wrap = (node: ReactNode, protect = false) => (
  <Suspense fallback={<Spinner />}>{protect ? <RequireAuth>{node}</RequireAuth> : node}</Suspense>
);

export const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: wrap(<Landing />) },
      { path: '/help', element: wrap(<Help />) },
      { path: '/safety', element: wrap(<SafetyTips />) },
      { path: '/privacy', element: wrap(<Privacy />) },
      { path: '/accessibility', element: wrap(<AccessibilityStatement />) },
      { path: '/track', element: wrap(<Track />) },

      { path: '/login', element: wrap(<Login />) },
      { path: '/register', element: wrap(<Register />) },
      { path: '/forgot', element: wrap(<ForgotPassword />) },
      { path: '/profile', element: wrap(<Profile />, true) },
      { path: '/settings', element: wrap(<Settings />, true) },

      { path: '/report', element: wrap(<ReportStart />) },
      { path: '/report/location', element: wrap(<ReportLocation />, true) },
      { path: '/report/identity', element: wrap(<ReportIdentity />, true) },
      { path: '/report/questions', element: wrap(<ReportQuestions />, true) },
      { path: '/report/category', element: wrap(<ReportCategory />, true) },
      { path: '/report/guidance', element: wrap(<ReportGuidance />, true) },
      { path: '/report/description', element: wrap(<ReportDescription />, true) },
      { path: '/report/details', element: wrap(<ReportDetails />, true) },
      { path: '/report/evidence', element: wrap(<ReportEvidence />, true) },
      { path: '/report/review', element: wrap(<ReportReview />, true) },
      { path: '/report/success', element: wrap(<ReportSuccess />, true) },

      { path: '/dashboard', element: wrap(<Dashboard />, true) },
      { path: '/reports/:id', element: wrap(<ReportDetail />, true) },

      { path: '*', element: wrap(<NotFound />) },
    ],
  },
]);

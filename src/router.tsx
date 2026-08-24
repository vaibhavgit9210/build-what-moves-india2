/**
 * Route table. Pages are lazy-loaded; authenticated areas sit behind
 * RequireAuth. Uses hash routing so deep links work on GitHub Pages.
 */
import { lazy, Suspense, type ReactNode } from 'react';
import { createHashRouter, Navigate, useLocation } from 'react-router-dom';
import AppShell from '@/components/shell/AppShell';
import { Spinner } from '@/components/ui/Misc';
import { useAuth } from '@/state/AuthContext';
import { useDraft } from '@/state/DraftContext';

const Landing = lazy(() => import('@/pages/Landing'));
const ChatReport = lazy(() => import('@/pages/ChatReport'));
const ServicePromise = lazy(() => import('@/pages/Promise'));
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

/** Report steps: signed-in users OR an in-progress anonymous draft. */
function RequireReportAccess({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { draft } = useDraft();
  const location = useLocation();
  if (!user && draft?.mode !== 'anonymous') {
    const next = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}

const wrap = (node: ReactNode, protect = false) => (
  <Suspense fallback={<Spinner />}>{protect ? <RequireAuth>{node}</RequireAuth> : node}</Suspense>
);

const wrapReport = (node: ReactNode) => (
  <Suspense fallback={<Spinner />}>
    <RequireReportAccess>{node}</RequireReportAccess>
  </Suspense>
);

export const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: wrap(<Landing />) },
      { path: '/chat', element: wrap(<ChatReport />) },
      { path: '/promise', element: wrap(<ServicePromise />) },
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
      { path: '/report/location', element: wrapReport(<ReportLocation />) },
      { path: '/report/identity', element: wrapReport(<ReportIdentity />) },
      { path: '/report/questions', element: wrapReport(<ReportQuestions />) },
      { path: '/report/category', element: wrapReport(<ReportCategory />) },
      { path: '/report/guidance', element: wrapReport(<ReportGuidance />) },
      { path: '/report/description', element: wrapReport(<ReportDescription />) },
      { path: '/report/details', element: wrapReport(<ReportDetails />) },
      { path: '/report/evidence', element: wrapReport(<ReportEvidence />) },
      { path: '/report/review', element: wrapReport(<ReportReview />) },
      { path: '/report/success', element: wrap(<ReportSuccess />) },

      { path: '/dashboard', element: wrap(<Dashboard />, true) },
      { path: '/reports/:id', element: wrap(<ReportDetail />, true) },

      { path: '*', element: wrap(<NotFound />) },
    ],
  },
]);

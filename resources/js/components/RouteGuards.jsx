import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { Spinner } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

/** Private area: guests are sent to the login page (and returned afterwards). */
export function RequireAuth() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <Spinner className="min-h-screen" />;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

    return <Outlet />;
}

/** Login / register: signed-in users go straight to their workspace. */
export function GuestOnly() {
    const { user, loading } = useAuth();

    if (loading) return <Spinner className="min-h-screen" />;
    if (user) return <Navigate to="/app" replace />;

    return <Outlet />;
}

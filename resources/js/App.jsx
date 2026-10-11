import { Link, Route, Routes } from 'react-router-dom';

import { GuestOnly, RequireAuth } from '@/components/RouteGuards';
import { ButtonLink, Logo } from '@/components/ui';
import AppLayout from '@/layouts/AppLayout';
import { LoginPage, RegisterPage } from '@/pages/AuthPages';
import Landing from '@/pages/Landing';
import Overview from '@/pages/Overview';
import Products from '@/pages/Products';
import Profile from '@/pages/Profile';

function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
            <Link to="/" aria-label="BizSpace home">
                <Logo />
            </Link>
            <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
            <p className="text-slate-500">The page you're looking for doesn't exist.</p>
            <ButtonLink to="/">Back to home</ButtonLink>
        </div>
    );
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />} />

            <Route element={<GuestOnly />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route path="/app" element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                    <Route index element={<Overview />} />
                    <Route path="products" element={<Products />} />
                    <Route path="profile" element={<Profile />} />
                </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

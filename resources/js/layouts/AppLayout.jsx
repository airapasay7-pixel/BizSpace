import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Package, Plus, UserCog, X } from 'lucide-react';

import { ButtonLink, Logo } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const nav = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/app/products', label: 'Products', icon: Package },
    { to: '/app/profile', label: 'Profile & Settings', icon: UserCog },
];

const titles = {
    '/app': 'Overview',
    '/app/products': 'Products',
    '/app/profile': 'Profile & Settings',
};

function SidebarContent({ onLogout }) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-5">
                <Link to="/app" aria-label="BizSpace workspace">
                    <Logo />
                </Link>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Workspace">
                {nav.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-brand-50 text-brand-700'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`
                        }
                    >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        {label}
                    </NavLink>
                ))}
            </nav>
            <div className="border-t border-slate-200 p-3">
                <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                    <LogOut className="h-5 w-5" aria-hidden="true" />
                    Log out
                </button>
            </div>
        </div>
    );
}

export default function AppLayout() {
    const { user, logout } = useAuth();
    const toast = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => setDrawerOpen(false), [location.pathname]);

    const handleLogout = async () => {
        // Leave the private area first so the route guard doesn't bounce us to /login.
        navigate('/', { replace: true });
        try {
            await logout();
        } catch {
            toast.error('Logout could not be completed on the server, but you have been signed out here.');
        }
    };

    const title = titles[location.pathname] ?? 'BizSpace';
    const initials = user.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return (
        <div className="min-h-screen bg-slate-50">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
                <SidebarContent onLogout={handleLogout} />
            </aside>

            {drawerOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
                    <aside className="relative h-full w-72 max-w-[85%] bg-white shadow-xl" aria-label="Navigation menu">
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(false)}
                            className="absolute right-3 top-4 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                            aria-label="Close menu"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <SidebarContent onLogout={handleLogout} />
                    </aside>
                </div>
            )}

            <div className="lg:pl-64">
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
                    <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <h1 className="flex-1 truncate text-lg font-semibold text-slate-900">{title}</h1>

                    {location.pathname !== '/app/products' && (
                        <ButtonLink to="/app/products?new=1" className="hidden sm:inline-flex">
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Add product
                        </ButtonLink>
                    )}

                    <Link
                        to="/app/profile"
                        className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100"
                        aria-label={`Account: ${user.name}`}
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                            {initials}
                        </span>
                        <span className="hidden max-w-[10rem] truncate text-sm font-medium text-slate-700 md:block">
                            {user.name}
                        </span>
                    </Link>
                </header>

                <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

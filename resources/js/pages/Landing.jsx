import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, ListChecks, Lock, PackagePlus, Search, UserPlus } from 'lucide-react';

import { ButtonLink, Logo } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

const features = [
    {
        icon: Boxes,
        title: 'Track every product',
        text: 'Keep names, categories, prices and stock quantities in one organised list.',
    },
    {
        icon: ListChecks,
        title: 'Spot low stock early',
        text: 'Your overview highlights items that are running out so you can reorder in time.',
    },
    {
        icon: Search,
        title: 'Find things fast',
        text: 'Search by name, filter by category, and sort by price or quantity.',
    },
    {
        icon: Lock,
        title: 'Private by design',
        text: 'Every account gets its own workspace. Nobody else can see or change your records.',
    },
];

const steps = [
    { icon: UserPlus, title: 'Create your account', text: 'Register with your name and email in under a minute.' },
    { icon: PackagePlus, title: 'Add your products', text: 'Enter what you sell, along with its price and stock level.' },
    { icon: ListChecks, title: 'Stay in control', text: 'Review totals, update stock and keep your records tidy.' },
];

export default function Landing() {
    const { user } = useAuth();

    useEffect(() => {
        document.title = 'BizSpace · Your Business. Your Workspace.';
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-slate-100">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <Link to="/" aria-label="BizSpace home">
                        <Logo />
                    </Link>
                    <nav className="flex items-center gap-2" aria-label="Primary">
                        <a href="#features" className="hidden px-3 text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">
                            Features
                        </a>
                        <a href="#how-it-works" className="hidden px-3 text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">
                            How it works
                        </a>
                        {user ? (
                            <ButtonLink to="/app">Open workspace</ButtonLink>
                        ) : (
                            <>
                                <ButtonLink to="/login" variant="ghost">
                                    Log in
                                </ButtonLink>
                                <ButtonLink to="/register">Get started</ButtonLink>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main>
                <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
                    <p className="mb-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                        Simple business records
                    </p>
                    <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Your Business. Your Workspace. Your Control.
                    </h1>
                    <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
                        Manage your products, track stock, and organize your business records in one simple workspace.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        {user ? (
                            <ButtonLink to="/app" className="px-6 py-3">
                                Go to your workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </ButtonLink>
                        ) : (
                            <>
                                <ButtonLink to="/register" className="px-6 py-3">
                                    Create your workspace <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </ButtonLink>
                                <ButtonLink to="/login" variant="secondary" className="px-6 py-3">
                                    Log in
                                </ButtonLink>
                            </>
                        )}
                    </div>
                </section>

                <section id="features" className="border-t border-slate-100 bg-slate-50 py-16">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-slate-900">Everything you need, nothing you don't</h2>
                        <p className="mt-2 max-w-2xl text-slate-600">
                            BizSpace focuses on the essentials small business owners use every day.
                        </p>
                        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {features.map(({ icon: Icon, title, text }) => (
                                <div key={title} className="rounded-xl border border-slate-200 bg-white p-5">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                                        <Icon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                    <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                                    <p className="mt-1 text-sm text-slate-600">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="how-it-works" className="py-16">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
                        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
                            {steps.map(({ icon: Icon, title, text }, index) => (
                                <li key={title} className="flex gap-4">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                                            <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                                            {title}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-600">{text}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {!user && (
                    <section className="px-4 pb-16 sm:px-6">
                        <div className="mx-auto max-w-4xl rounded-2xl bg-slate-900 px-6 py-12 text-center">
                            <h2 className="text-2xl font-bold text-white">Ready to organise your business?</h2>
                            <p className="mt-2 text-slate-300">Create your free workspace and add your first product today.</p>
                            <div className="mt-6 flex justify-center gap-3">
                                <ButtonLink to="/register">Get started</ButtonLink>
                                <ButtonLink to="/login" variant="secondary">
                                    Log in
                                </ButtonLink>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

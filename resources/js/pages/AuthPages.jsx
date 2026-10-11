import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { TextField } from '@/components/forms';
import { Alert, Button, Logo } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { parseError } from '@/lib/api';

function AuthShell({ title, subtitle, children, footer }) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <header className="px-4 py-5 sm:px-8">
                <Link to="/" aria-label="BizSpace home">
                    <Logo />
                </Link>
            </header>
            <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
                    <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                    <div className="mt-6">{children}</div>
                </div>
            </main>
            <p className="pb-8 text-center text-sm text-slate-500">{footer}</p>
        </div>
    );
}

export function LoginPage() {
    const { login } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        document.title = 'Log in · BizSpace';
    }, []);

    const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        const local = {};
        if (!form.email.trim()) local.email = 'Enter your email address.';
        if (!form.password) local.password = 'Enter your password.';
        setErrors(local);
        setMessage('');
        if (Object.keys(local).length) return;

        setSubmitting(true);
        try {
            await login({ email: form.email.trim(), password: form.password });
            toast.success('Welcome back!');
            navigate(location.state?.from ?? '/app', { replace: true });
        } catch (error) {
            const parsed = parseError(error);
            setErrors(parsed.fields);
            setMessage(Object.keys(parsed.fields).length ? '' : parsed.message);
            setSubmitting(false);
        }
    };

    return (
        <AuthShell
            title="Log in to your workspace"
            subtitle="Enter your details to continue."
            footer={
                <>
                    New to BizSpace?{' '}
                    <Link to="/register" className="font-medium text-brand-700 hover:underline">
                        Create an account
                    </Link>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                <Alert>{message}</Alert>
                <TextField
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={set('email')}
                    error={errors.email}
                />
                <TextField
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={set('password')}
                    error={errors.password}
                />
                <Button type="submit" className="w-full" loading={submitting}>
                    Log in
                </Button>
            </form>
        </AuthShell>
    );
}

export function RegisterPage() {
    const { register } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        document.title = 'Create account · BizSpace';
    }, []);

    const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        const local = {};
        if (!form.name.trim()) local.name = 'Enter your full name.';
        if (!form.email.trim()) local.email = 'Enter your email address.';
        if (form.password.length < 8) local.password = 'Use at least 8 characters.';
        else if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/\d/.test(form.password)) {
            local.password = 'Include upper and lower case letters and a number.';
        }
        if (form.password !== form.password_confirmation) {
            local.password_confirmation = 'The passwords do not match.';
        }
        setErrors(local);
        setMessage('');
        if (Object.keys(local).length) return;

        setSubmitting(true);
        try {
            await register({ ...form, name: form.name.trim(), email: form.email.trim() });
            toast.success('Your workspace is ready. Welcome to BizSpace!');
            navigate('/app', { replace: true });
        } catch (error) {
            const parsed = parseError(error);
            setErrors(parsed.fields);
            setMessage(Object.keys(parsed.fields).length ? '' : parsed.message);
            setSubmitting(false);
        }
    };

    return (
        <AuthShell
            title="Create your workspace"
            subtitle="Free to start. Your products stay private to you."
            footer={
                <>
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-brand-700 hover:underline">
                        Log in
                    </Link>
                </>
            }
        >
            <form onSubmit={submit} className="space-y-4" noValidate>
                <Alert>{message}</Alert>
                <TextField
                    label="Full name"
                    autoComplete="name"
                    value={form.name}
                    onChange={set('name')}
                    error={errors.name}
                />
                <TextField
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={set('email')}
                    error={errors.email}
                />
                <TextField
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    hint="At least 8 characters with upper and lower case letters and a number."
                    value={form.password}
                    onChange={set('password')}
                    error={errors.password}
                />
                <TextField
                    label="Confirm password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password_confirmation}
                    onChange={set('password_confirmation')}
                    error={errors.password_confirmation}
                />
                <Button type="submit" className="w-full" loading={submitting}>
                    Create account
                </Button>
            </form>
        </AuthShell>
    );
}

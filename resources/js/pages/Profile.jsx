import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import { TextField } from '@/components/forms';
import { Alert, Button, Card } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { http, parseError } from '@/lib/api';

function ProfileForm() {
    const { user, setUser } = useAuth();
    const toast = useToast();
    const [form, setForm] = useState({ name: user.name, email: user.email });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        const local = {};
        if (!form.name.trim()) local.name = 'Enter your name.';
        if (!form.email.trim()) local.email = 'Enter your email address.';
        setErrors(local);
        setMessage('');
        if (Object.keys(local).length) return;

        setSaving(true);
        try {
            const res = await http.patch('/profile', { name: form.name.trim(), email: form.email.trim() });
            setUser(res.data.data);
            setForm({ name: res.data.data.name, email: res.data.data.email });
            toast.success('Profile updated.');
        } catch (error) {
            const parsed = parseError(error);
            setErrors(parsed.fields);
            setMessage(Object.keys(parsed.fields).length ? '' : parsed.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="p-5">
            <h2 className="font-semibold text-slate-900">Profile</h2>
            <p className="mb-4 text-sm text-slate-500">Update your name and the email you log in with.</p>
            <form onSubmit={submit} className="max-w-md space-y-4" noValidate>
                <Alert>{message}</Alert>
                <TextField label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
                <TextField
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={set('email')}
                    error={errors.email}
                />
                <Button type="submit" loading={saving}>
                    Save profile
                </Button>
            </form>
        </Card>
    );
}

function PasswordForm() {
    const toast = useToast();
    const blank = { current_password: '', password: '', password_confirmation: '' };
    const [form, setForm] = useState(blank);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        const local = {};
        if (!form.current_password) local.current_password = 'Enter your current password.';
        if (form.password.length < 8) local.password = 'Use at least 8 characters.';
        if (form.password !== form.password_confirmation) local.password_confirmation = 'The passwords do not match.';
        setErrors(local);
        setMessage('');
        if (Object.keys(local).length) return;

        setSaving(true);
        try {
            await http.put('/profile/password', form);
            setForm(blank);
            toast.success('Password changed.');
        } catch (error) {
            const parsed = parseError(error);
            setErrors(parsed.fields);
            setMessage(Object.keys(parsed.fields).length ? '' : parsed.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="p-5">
            <h2 className="font-semibold text-slate-900">Change password</h2>
            <p className="mb-4 text-sm text-slate-500">Use a strong password you don't use anywhere else.</p>
            <form onSubmit={submit} className="max-w-md space-y-4" noValidate>
                <Alert>{message}</Alert>
                <TextField
                    label="Current password"
                    type="password"
                    autoComplete="current-password"
                    value={form.current_password}
                    onChange={set('current_password')}
                    error={errors.current_password}
                />
                <TextField
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    hint="At least 8 characters with upper and lower case letters and a number."
                    value={form.password}
                    onChange={set('password')}
                    error={errors.password}
                />
                <TextField
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password_confirmation}
                    onChange={set('password_confirmation')}
                    error={errors.password_confirmation}
                />
                <Button type="submit" loading={saving}>
                    Update password
                </Button>
            </form>
        </Card>
    );
}

export default function Profile() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        document.title = 'Profile & Settings · BizSpace';
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        await logout(() => navigate('/', { replace: true })).catch(() => {});
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-slate-900">Your account</h2>
                <p className="text-sm text-slate-500">Manage your account details and security.</p>
            </div>
            <ProfileForm />
            <PasswordForm />
            <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                    <h2 className="font-semibold text-slate-900">Log out</h2>
                    <p className="text-sm text-slate-500">End your session on this device.</p>
                </div>
                <Button variant="secondary" onClick={handleLogout} loading={loggingOut}>
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Log out
                </Button>
            </Card>
        </div>
    );
}

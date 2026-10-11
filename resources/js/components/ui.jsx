import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, Store } from 'lucide-react';

const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
};

export const buttonClasses = (variant = 'primary', className = '') =>
    `${base} ${variants[variant]} ${className}`.trim();

export function Button({ variant = 'primary', loading = false, className = '', children, disabled, ...props }) {
    return (
        <button
            type="button"
            className={buttonClasses(variant, className)}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {children}
        </button>
    );
}

export function ButtonLink({ variant = 'primary', className = '', ...props }) {
    return <Link className={buttonClasses(variant, className)} {...props} />;
}

export function Logo({ className = '' }) {
    return (
        <span className={`inline-flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 ${className}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Store className="h-5 w-5" aria-hidden="true" />
            </span>
            BizSpace
        </span>
    );
}

export function Spinner({ label = 'Loading…', className = '' }) {
    return (
        <div className={`flex items-center justify-center gap-2 py-12 text-sm text-slate-500 ${className}`} role="status">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" aria-hidden="true" />
            {label}
        </div>
    );
}

export function Alert({ children, className = '' }) {
    if (!children) return null;

    return (
        <div
            className={`flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 ${className}`}
            role="alert"
        >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>{children}</div>
        </div>
    );
}

export function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center px-6 py-14 text-center">
            {Icon && (
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
            )}
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

export function Badge({ tone = 'neutral', children }) {
    const tones = {
        neutral: 'bg-slate-100 text-slate-700',
        warning: 'bg-amber-100 text-amber-800',
        success: 'bg-brand-50 text-brand-700',
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
            {children}
        </span>
    );
}

export function Card({ className = '', children }) {
    return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

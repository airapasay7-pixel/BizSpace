import { useId } from 'react';

const control =
    'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-brand-600 focus:ring-1 focus:ring-brand-600';

function Wrapper({ label, error, hint, id, children }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
                {label}
            </label>
            {children}
            {hint && !error && (
                <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
                    {hint}
                </p>
            )}
            {error && (
                <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-600" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

function describedBy(id, error, hint) {
    if (error) return `${id}-error`;
    return hint ? `${id}-hint` : undefined;
}

export function TextField({ label, error, hint, id, className = '', ...props }) {
    const auto = useId();
    const fieldId = id ?? auto;

    return (
        <Wrapper label={label} error={error} hint={hint} id={fieldId}>
            <input
                id={fieldId}
                className={`${control} ${error ? 'border-red-400' : 'border-slate-300'} ${className}`}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={describedBy(fieldId, error, hint)}
                {...props}
            />
        </Wrapper>
    );
}

export function TextAreaField({ label, error, hint, id, ...props }) {
    const auto = useId();
    const fieldId = id ?? auto;

    return (
        <Wrapper label={label} error={error} hint={hint} id={fieldId}>
            <textarea
                id={fieldId}
                rows={3}
                className={`${control} ${error ? 'border-red-400' : 'border-slate-300'}`}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={describedBy(fieldId, error, hint)}
                {...props}
            />
        </Wrapper>
    );
}

export function SelectField({ label, error, id, children, className = '', ...props }) {
    const auto = useId();
    const fieldId = id ?? auto;

    return (
        <Wrapper label={label} error={error} id={fieldId}>
            <select
                id={fieldId}
                className={`${control} ${error ? 'border-red-400' : 'border-slate-300'} ${className}`}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={describedBy(fieldId, error)}
                {...props}
            >
                {children}
            </select>
        </Wrapper>
    );
}

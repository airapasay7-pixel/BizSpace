import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

import { Alert, Button } from '@/components/ui';

export function Modal({ open, onClose, title, description, children, size = 'md' }) {
    const titleId = useId();
    const panelRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const focusable = panelRef.current?.querySelector(
            'input, select, textarea, button:not([data-modal-close])',
        );
        (focusable ?? panelRef.current)?.focus();

        const onKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus?.();
        };
    }, [open, onClose]);

    if (!open) return null;

    const width = size === 'sm' ? 'max-w-md' : 'max-w-lg';

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden="true" />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`relative flex max-h-[92vh] w-full ${width} flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl`}
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 id={titleId} className="text-base font-semibold text-slate-900">
                            {title}
                        </h2>
                        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
                    </div>
                    <button
                        type="button"
                        data-modal-close
                        onClick={onClose}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close dialog"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
            </div>
        </div>
    );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', loading, error, onConfirm, onCancel }) {
    return (
        <Modal open={open} onClose={loading ? () => {} : onCancel} title={title} size="sm">
            <p className="text-sm text-slate-600">{message}</p>
            <Alert className="mt-3">{error}</Alert>
            <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button variant="danger" onClick={onConfirm} loading={loading}>
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}

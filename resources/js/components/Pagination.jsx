import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui';

export default function Pagination({ meta, onChange }) {
    if (!meta || meta.last_page <= 1) {
        return meta?.total ? (
            <p className="px-4 py-3 text-sm text-slate-500">
                Showing {meta.from}–{meta.to} of {meta.total}
            </p>
        ) : null;
    }

    return (
        <nav
            className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3"
            aria-label="Pagination"
        >
            <p className="text-sm text-slate-500">
                Showing {meta.from}–{meta.to} of {meta.total}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="secondary"
                    className="px-2.5"
                    disabled={meta.current_page <= 1}
                    onClick={() => onChange(meta.current_page - 1)}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600">
                    Page {meta.current_page} of {meta.last_page}
                </span>
                <Button
                    variant="secondary"
                    className="px-2.5"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => onChange(meta.current_page + 1)}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </nav>
    );
}

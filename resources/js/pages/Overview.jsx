import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Boxes, Package, Plus } from 'lucide-react';

import { Alert, Badge, Button, ButtonLink, Card, EmptyState, Spinner } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { http, parseError } from '@/lib/api';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';

function StatCard({ icon: Icon, label, value, tone = 'brand', hint }) {
    const tones = {
        brand: 'bg-brand-50 text-brand-600',
        warning: 'bg-amber-100 text-amber-700',
    };

    return (
        <Card className="flex items-center gap-4 p-5">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-2xl font-semibold text-slate-900">{value}</p>
                {hint && <p className="text-xs text-slate-500">{hint}</p>}
            </div>
        </Card>
    );
}

export default function Overview() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    const load = useCallback(() => {
        setError('');
        http.get('/overview')
            .then((res) => setData(res.data.data))
            .catch((err) => setError(parseError(err, 'We could not load your overview.').message));
    }, []);

    useEffect(() => {
        document.title = 'Overview · BizSpace';
        load();
    }, [load]);

    if (error) {
        return (
            <div className="space-y-3">
                <Alert>{error}</Alert>
                <Button variant="secondary" onClick={load}>
                    Try again
                </Button>
            </div>
        );
    }

    if (!data) return <Spinner label="Loading your overview…" />;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Welcome, {user.name.split(' ')[0]}</h2>
                    <p className="text-sm text-slate-500">Here is where your business stands today.</p>
                </div>
                <ButtonLink to="/app/products?new=1">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add product
                </ButtonLink>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard icon={Package} label="Total products" value={formatNumber(data.total_products)} />
                <StatCard icon={Boxes} label="Total stock units" value={formatNumber(data.total_stock)} />
                <StatCard
                    icon={AlertTriangle}
                    tone="warning"
                    label="Low-stock products"
                    value={formatNumber(data.low_stock_count)}
                    hint={`${data.low_stock_threshold} units or fewer`}
                />
            </div>

            <Card>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h3 className="font-semibold text-slate-900">Recently added</h3>
                    <Link to="/app/products" className="text-sm font-medium text-brand-700 hover:underline">
                        View all
                    </Link>
                </div>
                {data.recent_products.length === 0 ? (
                    <EmptyState
                        icon={Package}
                        title="No products yet"
                        description="Add your first product to start tracking your stock."
                        action={
                            <ButtonLink to="/app/products?new=1">
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Add your first product
                            </ButtonLink>
                        }
                    />
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {data.recent_products.map((product) => (
                            <li key={product.id} className="flex items-center justify-between gap-4 px-5 py-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {product.category} · Added {formatDate(product.created_at)}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-3 text-sm">
                                    <span className="text-slate-700">{formatCurrency(product.price)}</span>
                                    <Badge tone={product.quantity <= data.low_stock_threshold ? 'warning' : 'neutral'}>
                                        {formatNumber(product.quantity)} in stock
                                    </Badge>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownAZ, ArrowUpAZ, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';

import { SelectField } from '@/components/forms';
import { ConfirmDialog } from '@/components/Modal';
import Pagination from '@/components/Pagination';
import { Alert, Badge, Button, Card, EmptyState, Spinner } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { http, parseError } from '@/lib/api';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import ProductFormModal from '@/pages/ProductFormModal';

const sortOptions = [
    { value: 'created_at', label: 'Date added' },
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'quantity', label: 'Quantity' },
];

function useDebounced(value, delay = 300) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}

export default function Products() {
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState('created_at');
    const [direction, setDirection] = useState('desc');
    const [page, setPage] = useState(1);

    const [products, setProducts] = useState([]);
    const [meta, setMeta] = useState(null);
    const [threshold, setThreshold] = useState(5);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [deleteBusy, setDeleteBusy] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const debouncedSearch = useDebounced(search);
    const filtersActive = Boolean(debouncedSearch || category);

    useEffect(() => {
        document.title = 'Products · BizSpace';
    }, []);

    // "Add product" shortcuts elsewhere link here with ?new=1.
    useEffect(() => {
        if (searchParams.get('new')) {
            setEditing(null);
            setFormOpen(true);
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, category, sort, direction]);

    const loadCategories = useCallback(() => {
        http.get('/products/categories')
            .then((res) => setCategories(res.data.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');

        http.get('/products', {
            params: {
                search: debouncedSearch || undefined,
                category: category || undefined,
                sort,
                direction,
                page,
                per_page: 10,
            },
        })
            .then((res) => {
                if (!active) return;
                setProducts(res.data.data);
                setMeta(res.data.meta);
                setThreshold(res.data.low_stock_threshold ?? 5);
                // A deletion can leave the current page empty: step back one page.
                if (res.data.data.length === 0 && res.data.meta.current_page > 1) {
                    setPage(res.data.meta.last_page || 1);
                }
            })
            .catch((err) => active && setError(parseError(err, 'We could not load your products.').message))
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, [debouncedSearch, category, sort, direction, page, reloadKey]);

    const reload = () => setReloadKey((k) => k + 1);

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (product) => {
        setEditing(product);
        setFormOpen(true);
    };

    const handleSaved = (_product, wasEdit) => {
        setFormOpen(false);
        toast.success(wasEdit ? 'Product updated.' : 'Product added.');
        loadCategories();
        reload();
    };

    const confirmDelete = async () => {
        setDeleteBusy(true);
        setDeleteError('');
        try {
            await http.delete(`/products/${deleting.id}`);
            setDeleting(null);
            toast.success('Product deleted.');
            loadCategories();
            reload();
        } catch (err) {
            setDeleteError(parseError(err, 'The product could not be deleted.').message);
        } finally {
            setDeleteBusy(false);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setCategory('');
    };

    const stock = (product) => (
        <Badge tone={product.quantity <= threshold ? 'warning' : 'neutral'}>
            {product.quantity <= threshold && product.quantity > 0 ? `Low · ${formatNumber(product.quantity)}` : null}
            {product.quantity === 0 ? 'Out of stock' : null}
            {product.quantity > threshold ? formatNumber(product.quantity) : null}
        </Badge>
    );

    const actions = (product) => (
        <div className="flex justify-end gap-1">
            <button
                type="button"
                onClick={() => openEdit(product)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label={`Edit ${product.name}`}
            >
                <Pencil className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => {
                    setDeleteError('');
                    setDeleting(product);
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete ${product.name}`}
            >
                <Trash2 className="h-4 w-4" />
            </button>
        </div>
    );

    const isEmpty = !loading && !error && products.length === 0;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Your catalogue</h2>
                    <p className="text-sm text-slate-500">Manage the items in your catalogue and their stock levels.</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add product
                </Button>
            </div>

            <Card className="p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_11rem_auto]">
                    <div>
                        <label htmlFor="product-search" className="mb-1 block text-sm font-medium text-slate-700">
                            Search
                        </label>
                        <div className="relative">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                aria-hidden="true"
                            />
                            <input
                                id="product-search"
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by product name"
                                className="block w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                            />
                        </div>
                    </div>
                    <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">All categories</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </SelectField>
                    <SelectField label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
                        {sortOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </SelectField>
                    <div className="flex items-end">
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
                            aria-label={`Sort direction: ${direction === 'asc' ? 'ascending' : 'descending'}. Click to reverse.`}
                        >
                            {direction === 'asc' ? (
                                <ArrowUpAZ className="h-4 w-4" aria-hidden="true" />
                            ) : (
                                <ArrowDownAZ className="h-4 w-4" aria-hidden="true" />
                            )}
                            {direction === 'asc' ? 'Ascending' : 'Descending'}
                        </Button>
                    </div>
                </div>
            </Card>

            {error && (
                <div className="space-y-3">
                    <Alert>{error}</Alert>
                    <Button variant="secondary" onClick={reload}>
                        Try again
                    </Button>
                </div>
            )}

            {!error && (
                <Card className="overflow-hidden">
                    {loading && products.length === 0 && <Spinner label="Loading products…" />}

                    {isEmpty && (
                        <EmptyState
                            icon={Package}
                            title={filtersActive ? 'No products match your filters' : 'No products yet'}
                            description={
                                filtersActive
                                    ? 'Try a different search term or clear the filters.'
                                    : 'Add your first product to start tracking prices and stock.'
                            }
                            action={
                                filtersActive ? (
                                    <Button variant="secondary" onClick={clearFilters}>
                                        Clear filters
                                    </Button>
                                ) : (
                                    <Button onClick={openCreate}>
                                        <Plus className="h-4 w-4" aria-hidden="true" />
                                        Add your first product
                                    </Button>
                                )
                            }
                        />
                    )}

                    {products.length > 0 && (
                        <div className={loading ? 'opacity-60 transition-opacity' : ''} aria-busy={loading}>
                            {/* Table on tablets and up */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th scope="col" className="px-4 py-3">Product</th>
                                            <th scope="col" className="px-4 py-3">Category</th>
                                            <th scope="col" className="px-4 py-3 text-right">Price</th>
                                            <th scope="col" className="px-4 py-3 text-right">Stock</th>
                                            <th scope="col" className="px-4 py-3">Created</th>
                                            <th scope="col" className="px-4 py-3 text-right">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {products.map((product) => (
                                            <tr key={product.id} className="hover:bg-slate-50">
                                                <td className="max-w-xs px-4 py-3">
                                                    <p className="truncate font-medium text-slate-900">{product.name}</p>
                                                    {product.description && (
                                                        <p className="truncate text-xs text-slate-500">{product.description}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{product.category}</td>
                                                <td className="px-4 py-3 text-right text-slate-900">
                                                    {formatCurrency(product.price)}
                                                </td>
                                                <td className="px-4 py-3 text-right">{stock(product)}</td>
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                                    {formatDate(product.created_at)}
                                                </td>
                                                <td className="px-4 py-2">{actions(product)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Cards on phones */}
                            <ul className="divide-y divide-slate-100 md:hidden">
                                {products.map((product) => (
                                    <li key={product.id} className="space-y-2 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-900">{product.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {product.category} · {formatDate(product.created_at)}
                                                </p>
                                            </div>
                                            {actions(product)}
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-slate-900">{formatCurrency(product.price)}</span>
                                            {stock(product)}
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <Pagination meta={meta} onChange={setPage} />
                        </div>
                    )}
                </Card>
            )}

            <ProductFormModal
                open={formOpen}
                product={editing}
                categories={categories}
                onClose={() => setFormOpen(false)}
                onSaved={handleSaved}
            />

            <ConfirmDialog
                open={Boolean(deleting)}
                title="Delete this product?"
                message={deleting ? `“${deleting.name}” will be permanently removed from your workspace. This cannot be undone.` : ''}
                loading={deleteBusy}
                error={deleteError}
                onConfirm={confirmDelete}
                onCancel={() => setDeleting(null)}
            />
        </div>
    );
}

import { useState } from 'react';

import { TextAreaField, TextField } from '@/components/forms';
import { Modal } from '@/components/Modal';
import { Alert, Button } from '@/components/ui';
import { http, parseError } from '@/lib/api';

const empty = { name: '', description: '', category: '', price: '', quantity: '' };

function validate(form) {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Enter a product name.';
    if (!form.category.trim()) errors.category = 'Enter or choose a category.';

    const price = Number(form.price);
    if (form.price === '' || Number.isNaN(price) || price < 0) {
        errors.price = 'Enter a price of 0 or more.';
    } else if (!/^\d+(\.\d{1,2})?$/.test(String(form.price).trim())) {
        errors.price = 'Use at most two decimal places.';
    }

    if (!/^\d+$/.test(String(form.quantity).trim())) {
        errors.quantity = 'Enter a whole number of 0 or more.';
    }

    return errors;
}

const toForm = (product) =>
    product
        ? {
              name: product.name,
              description: product.description ?? '',
              category: product.category,
              price: String(product.price),
              quantity: String(product.quantity),
          }
        : empty;

/** Create (product = null) or edit an existing product. */
export default function ProductFormModal({ open, product, categories, onClose, onSaved }) {
    const [saving, setSaving] = useState(false);

    return (
        <Modal
            open={open}
            onClose={saving ? () => {} : onClose}
            title={product ? 'Edit product' : 'Add product'}
            description={product ? 'Update the details of this product.' : 'Add a product to your workspace.'}
        >
            {/* Mounted fresh on every open, so the fields start with the right values. */}
            <ProductForm
                key={product?.id ?? 'new'}
                product={product}
                categories={categories}
                saving={saving}
                setSaving={setSaving}
                onClose={onClose}
                onSaved={onSaved}
            />
        </Modal>
    );
}

function ProductForm({ product, categories, saving, setSaving, onClose, onSaved }) {
    const [form, setForm] = useState(() => toForm(product));
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');

    const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        const local = validate(form);
        setErrors(local);
        setMessage('');
        if (Object.keys(local).length) return;

        setSaving(true);
        const body = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            category: form.category.trim(),
            price: form.price,
            quantity: Number(form.quantity),
        };

        try {
            const res = product
                ? await http.put(`/products/${product.id}`, body)
                : await http.post('/products', body);
            setSaving(false);
            onSaved(res.data.data, Boolean(product));
        } catch (error) {
            const parsed = parseError(error);
            setErrors(parsed.fields);
            setMessage(Object.keys(parsed.fields).length ? '' : parsed.message);
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4" noValidate>
            <Alert>{message}</Alert>
            <TextField label="Product name" value={form.name} onChange={set('name')} error={errors.name} maxLength={255} />
            <TextAreaField
                label="Description (optional)"
                value={form.description}
                onChange={set('description')}
                error={errors.description}
                maxLength={5000}
            />
            <div>
                <TextField
                    label="Category"
                    value={form.category}
                    onChange={set('category')}
                    error={errors.category}
                    list="category-options"
                    maxLength={100}
                    autoComplete="off"
                />
                <datalist id="category-options">
                    {categories.map((c) => (
                        <option key={c} value={c} />
                    ))}
                </datalist>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                    label="Price (USD)"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.price}
                    onChange={set('price')}
                    error={errors.price}
                />
                <TextField
                    label="Stock quantity"
                    inputMode="numeric"
                    placeholder="0"
                    value={form.quantity}
                    onChange={set('quantity')}
                    error={errors.quantity}
                />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button type="submit" loading={saving}>
                    {product ? 'Save changes' : 'Add product'}
                </Button>
            </div>
        </form>
    );
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Shared by create (POST), full update (PUT) and partial update (PATCH).
 * Ownership is never accepted from the client: user_id is not a validated field.
 */
class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['name', 'category'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => trim($this->input($field))]);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $presence = $this->isMethod('PATCH') ? ['sometimes', 'required'] : ['required'];

        return [
            'name' => [...$presence, 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'category' => [...$presence, 'string', 'max:100'],
            'price' => [...$presence, 'numeric', 'min:0', 'max:99999999.99', 'decimal:0,2'],
            'quantity' => [...$presence, 'integer', 'min:0', 'max:1000000000'],
        ];
    }
}

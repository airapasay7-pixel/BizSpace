<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /** Columns the client may sort by; anything else is rejected. */
    private const SORTABLE = ['name', 'price', 'quantity', 'created_at'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $params = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', Rule::in(self::SORTABLE)],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = $request->user()->products();

        if (filled($params['search'] ?? null)) {
            // Explicit ESCAPE so a literal % or _ in the search behaves the same on every database.
            $query->whereRaw("name LIKE ? ESCAPE '!'", ['%'.preg_replace('/[!%_]/', '!$0', $params['search']).'%']);
        }

        if (filled($params['category'] ?? null)) {
            $query->where('category', $params['category']);
        }

        $query->orderBy($params['sort'] ?? 'created_at', $params['direction'] ?? 'desc')
            ->orderBy('id', 'desc');

        return ProductResource::collection($query->paginate($params['per_page'] ?? 10))
            ->additional(['low_stock_threshold' => config('bizspace.low_stock_threshold')]);
    }

    public function categories(Request $request): JsonResponse
    {
        $categories = $request->user()->products()
            ->select('category')->distinct()->orderBy('category')->pluck('category');

        return response()->json(['data' => $categories]);
    }

    public function store(ProductRequest $request): JsonResponse
    {
        // Created through the relationship, so user_id always comes from the session.
        $product = $request->user()->products()->create($request->validated());

        return (new ProductResource($product))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Product $product): ProductResource
    {
        Gate::authorize('view', $product);

        return new ProductResource($product);
    }

    public function update(ProductRequest $request, Product $product): ProductResource
    {
        Gate::authorize('update', $product);

        $product->update($request->validated());

        return new ProductResource($product);
    }

    public function destroy(Product $product): Response
    {
        Gate::authorize('delete', $product);

        $product->delete();

        return response()->noContent();
    }
}

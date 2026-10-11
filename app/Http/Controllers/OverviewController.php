<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OverviewController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $products = $request->user()->products();
        $threshold = config('bizspace.low_stock_threshold');

        return response()->json(['data' => [
            'total_products' => (clone $products)->count(),
            'total_stock' => (int) (clone $products)->sum('quantity'),
            'low_stock_count' => (clone $products)->where('quantity', '<=', $threshold)->count(),
            'low_stock_threshold' => $threshold,
            'recent_products' => ProductResource::collection(
                (clone $products)->latest()->latest('id')->limit(5)->get()
            ),
        ]]);
    }
}

<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\OverviewController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

// Guest-only: authenticated users have no reason to hit these, and throttling limits brute force.
Route::middleware(['guest:web', 'throttle:auth'])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/overview', OverviewController::class);

    // Declared before the resource so "categories" isn't treated as a product ID.
    Route::get('/products/categories', [ProductController::class, 'categories']);
    Route::apiResource('products', ProductController::class);

    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->middleware('throttle:6,1');
});

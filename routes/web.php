<?php

use Illuminate\Support\Facades\Route;

// The React SPA owns every browser route. API and framework endpoints are excluded.
Route::view('/{any?}', 'app')->where('any', '^(?!api|sanctum|up).*$');

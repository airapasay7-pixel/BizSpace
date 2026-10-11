<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // One place defines password strength for registration and password changes.
        Password::defaults(function () {
            $rule = Password::min(8)->letters()->mixedCase()->numbers();

            // The breach lookup calls an external service, so only enforce it in production.
            return $this->app->isProduction() ? $rule->uncompromised() : $rule;
        });

        // Brute-force protection for login and registration: keyed by IP + email.
        RateLimiter::for('auth', function (Request $request) {
            $key = strtolower((string) $request->input('email')).'|'.$request->ip();

            return Limit::perMinute(10)->by($key);
        });
    }
}

<?php

namespace Tests\Concerns;

use App\Models\User;

trait SpaRequests
{
    /** Make requests look like they come from the stateful SPA origin. */
    protected function setUpSpaRequests(): void
    {
        $this->withHeaders([
            'Origin' => 'http://127.0.0.1:8000',
            'Accept' => 'application/json',
        ]);
    }

    protected function signIn(?User $user = null): User
    {
        $user ??= User::factory()->create();
        $this->actingAs($user, 'web');

        return $user;
    }
}

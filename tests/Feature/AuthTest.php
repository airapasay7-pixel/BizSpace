<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Requests must look like they come from the stateful SPA origin so the
        // session (cookie) auth path is exercised, exactly as in the browser.
        $this->withHeaders([
            'Origin' => 'http://127.0.0.1:8000',
            'Accept' => 'application/json',
        ]);
    }

    private function validRegistration(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Ada Owner',
            'email' => 'ada@example.com',
            'password' => 'Str0ngPassw0rd',
            'password_confirmation' => 'Str0ngPassw0rd',
        ], $overrides);
    }

    public function test_visitor_can_register_and_is_logged_in(): void
    {
        $response = $this->postJson('/api/register', $this->validRegistration());

        $response->assertCreated()
            ->assertJsonPath('data.email', 'ada@example.com')
            ->assertJsonMissingPath('data.password');

        $this->assertAuthenticated('web');
        $this->assertDatabaseHas('users', ['email' => 'ada@example.com']);
        // Password is stored hashed, never as plaintext.
        $this->assertNotSame('Str0ngPassw0rd', User::first()->password);
    }

    public function test_registration_rejects_duplicate_email_case_insensitively(): void
    {
        User::factory()->create(['email' => 'ada@example.com']);

        $this->postJson('/api/register', $this->validRegistration(['email' => 'ADA@example.com']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_registration_validates_password_strength_and_confirmation(): void
    {
        $this->postJson('/api/register', $this->validRegistration([
            'password' => 'weak',
            'password_confirmation' => 'different',
        ]))->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->postJson('/api/register', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_registered_user_can_log_in(): void
    {
        $user = User::factory()->create(['password' => 'Str0ngPassw0rd']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'Str0ngPassw0rd'])
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_incorrect_password_is_rejected(): void
    {
        $user = User::factory()->create(['password' => 'Str0ngPassw0rd']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'wrong-password'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertGuest('web');
    }

    public function test_guest_cannot_access_private_endpoints(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
        $this->postJson('/api/logout')->assertUnauthorized();
    }

    public function test_csrf_endpoint_returns_the_session_token(): void
    {
        $response = $this->getJson('/api/csrf')->assertOk();

        $this->assertSame(session()->token(), $response->json('token'));
        $this->assertNotEmpty($response->json('token'));
    }

    public function test_guest_gets_json_401_even_without_a_json_accept_header(): void
    {
        // e.g. opening /api/user directly in the browser address bar.
        $this->withHeaders(['Accept' => 'text/html'])
            ->get('/api/user')
            ->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_authenticated_user_can_fetch_profile_without_sensitive_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.remember_token');
    }

    public function test_logout_ends_the_authenticated_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'web')
            ->postJson('/api/logout')
            ->assertNoContent();

        $this->assertGuest('web');

        // Each real request gets fresh guards; the test app instance is reused, so
        // drop the resolved guards to avoid the request guard's in-memory user cache.
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_login_is_rate_limited(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/login', ['email' => $user->email, 'password' => 'nope'])
                ->assertUnprocessable();
        }

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'nope'])
            ->assertTooManyRequests();
    }
}

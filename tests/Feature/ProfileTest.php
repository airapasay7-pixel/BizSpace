<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Concerns\SpaRequests;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase, SpaRequests;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpSpaRequests();
    }

    public function test_guest_cannot_update_profile(): void
    {
        $this->patchJson('/api/profile', ['name' => 'X'])->assertUnauthorized();
        $this->putJson('/api/profile/password', [])->assertUnauthorized();
    }

    public function test_user_can_update_name_and_email(): void
    {
        $user = $this->signIn();

        $this->patchJson('/api/profile', ['name' => 'New Name', 'email' => 'NEW@example.com'])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.email', 'new@example.com');

        $this->assertDatabaseHas('users', ['id' => $user->id, 'email' => 'new@example.com']);
    }

    public function test_user_can_keep_their_own_email_but_not_take_anothers(): void
    {
        $user = $this->signIn();
        $other = User::factory()->create();

        $this->patchJson('/api/profile', ['name' => 'Same', 'email' => $user->email])->assertOk();
        $this->patchJson('/api/profile', ['email' => $other->email])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_extra_fields_cannot_be_mass_assigned(): void
    {
        $user = $this->signIn();

        $this->patchJson('/api/profile', ['name' => 'Ok', 'id' => 9999, 'password' => 'Hacked123x'])->assertOk();

        $user->refresh();
        $this->assertNotSame(9999, $user->id);
        $this->assertFalse(Hash::check('Hacked123x', $user->password));
    }

    public function test_user_can_change_password_with_correct_current_password(): void
    {
        $user = $this->signIn(User::factory()->create(['password' => 'OldPassw0rd1']));

        $this->putJson('/api/profile/password', [
            'current_password' => 'OldPassw0rd1',
            'password' => 'NewPassw0rd2',
            'password_confirmation' => 'NewPassw0rd2',
        ])->assertNoContent();

        $this->assertTrue(Hash::check('NewPassw0rd2', $user->fresh()->password));
    }

    public function test_password_change_requires_correct_current_password_and_strength(): void
    {
        $this->signIn(User::factory()->create(['password' => 'OldPassw0rd1']));

        $this->putJson('/api/profile/password', [
            'current_password' => 'wrong',
            'password' => 'NewPassw0rd2',
            'password_confirmation' => 'NewPassw0rd2',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->putJson('/api/profile/password', [
            'current_password' => 'OldPassw0rd1',
            'password' => 'weak',
            'password_confirmation' => 'weak',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }
}

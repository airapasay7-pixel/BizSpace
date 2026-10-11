<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\SpaRequests;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase, SpaRequests;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpSpaRequests();
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Arabica Beans 1kg',
            'description' => 'Whole bean coffee',
            'category' => 'Beverages',
            'price' => '12.50',
            'quantity' => 40,
        ], $overrides);
    }

    public function test_guest_cannot_use_product_endpoints(): void
    {
        $product = Product::factory()->create();

        $this->getJson('/api/products')->assertUnauthorized();
        $this->postJson('/api/products', $this->payload())->assertUnauthorized();
        $this->getJson("/api/products/{$product->id}")->assertUnauthorized();
        $this->putJson("/api/products/{$product->id}", $this->payload())->assertUnauthorized();
        $this->deleteJson("/api/products/{$product->id}")->assertUnauthorized();
        $this->getJson('/api/overview')->assertUnauthorized();
    }

    public function test_user_can_create_a_product_owned_by_themselves(): void
    {
        $user = $this->signIn();

        $this->postJson('/api/products', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.name', 'Arabica Beans 1kg')
            ->assertJsonPath('data.price', 12.5)
            ->assertJsonMissingPath('data.user_id');

        $this->assertDatabaseHas('products', ['user_id' => $user->id, 'name' => 'Arabica Beans 1kg']);
    }

    public function test_client_supplied_owner_id_is_ignored(): void
    {
        $user = $this->signIn();
        $other = User::factory()->create();

        $this->postJson('/api/products', $this->payload(['user_id' => $other->id]))->assertCreated();

        $this->assertDatabaseHas('products', ['name' => 'Arabica Beans 1kg', 'user_id' => $user->id]);
        $this->assertDatabaseMissing('products', ['user_id' => $other->id]);
    }

    public function test_invalid_input_is_rejected(): void
    {
        $this->signIn();

        $this->postJson('/api/products', $this->payload(['price' => -1]))
            ->assertUnprocessable()->assertJsonValidationErrors('price');
        $this->postJson('/api/products', $this->payload(['price' => 'abc']))
            ->assertUnprocessable()->assertJsonValidationErrors('price');
        $this->postJson('/api/products', $this->payload(['price' => '1.999']))
            ->assertUnprocessable()->assertJsonValidationErrors('price');
        $this->postJson('/api/products', $this->payload(['quantity' => -3]))
            ->assertUnprocessable()->assertJsonValidationErrors('quantity');
        $this->postJson('/api/products', $this->payload(['quantity' => 2.5]))
            ->assertUnprocessable()->assertJsonValidationErrors('quantity');
        $this->postJson('/api/products', [])
            ->assertUnprocessable()->assertJsonValidationErrors(['name', 'category', 'price', 'quantity']);

        $this->assertDatabaseCount('products', 0);
    }

    public function test_user_sees_only_their_own_products(): void
    {
        $user = $this->signIn();
        Product::factory()->count(3)->for($user)->create();
        Product::factory()->count(2)->create();

        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 3);
    }

    public function test_user_can_view_and_update_their_own_product(): void
    {
        $user = $this->signIn();
        $product = Product::factory()->for($user)->create();

        $this->getJson("/api/products/{$product->id}")->assertOk()->assertJsonPath('data.id', $product->id);

        $this->putJson("/api/products/{$product->id}", $this->payload(['name' => 'Renamed', 'quantity' => 7]))
            ->assertOk()->assertJsonPath('data.name', 'Renamed');

        $this->patchJson("/api/products/{$product->id}", ['price' => 99])
            ->assertOk()->assertJsonPath('data.price', 99)->assertJsonPath('data.name', 'Renamed');

        $this->assertDatabaseHas('products', ['id' => $product->id, 'name' => 'Renamed', 'quantity' => 7]);
    }

    public function test_user_cannot_view_update_or_delete_another_users_product(): void
    {
        $this->signIn();
        $foreign = Product::factory()->create(['name' => 'Secret']);

        $this->getJson("/api/products/{$foreign->id}")->assertNotFound();
        $this->putJson("/api/products/{$foreign->id}", $this->payload())->assertNotFound();
        $this->patchJson("/api/products/{$foreign->id}", ['name' => 'Hacked'])->assertNotFound();
        $this->deleteJson("/api/products/{$foreign->id}")->assertNotFound();

        $this->assertDatabaseHas('products', ['id' => $foreign->id, 'name' => 'Secret']);
    }

    public function test_user_can_delete_their_own_product(): void
    {
        $user = $this->signIn();
        $product = Product::factory()->for($user)->create();

        $this->deleteJson("/api/products/{$product->id}")->assertNoContent();

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_search_filter_sort_and_pagination(): void
    {
        $user = $this->signIn();
        Product::factory()->for($user)->create(['name' => 'Green Tea', 'category' => 'Beverages', 'price' => 5, 'quantity' => 30]);
        Product::factory()->for($user)->create(['name' => 'Black Tea', 'category' => 'Beverages', 'price' => 3, 'quantity' => 10]);
        Product::factory()->for($user)->create(['name' => 'Chips', 'category' => 'Snacks', 'price' => 2, 'quantity' => 50]);
        Product::factory()->create(['name' => 'Foreign Tea', 'category' => 'Beverages']);

        $names = fn ($r) => collect($r->json('data'))->pluck('name')->all();

        $this->assertEqualsCanonicalizing(['Green Tea', 'Black Tea'], $names($this->getJson('/api/products?search=tea')));
        $this->assertSame(['Chips'], $names($this->getJson('/api/products?category=Snacks')));
        $this->assertSame(['Black Tea', 'Chips', 'Green Tea'], $names($this->getJson('/api/products?sort=name&direction=asc')));
        $this->assertSame(['Chips', 'Green Tea', 'Black Tea'], $names($this->getJson('/api/products?sort=quantity&direction=desc')));
        $this->assertSame(['Chips', 'Black Tea', 'Green Tea'], $names($this->getJson('/api/products?sort=price&direction=asc')));

        $page = $this->getJson('/api/products?per_page=2&page=2&sort=name&direction=asc');
        $this->assertSame(['Green Tea'], $names($page));
        $page->assertJsonPath('meta.last_page', 2)->assertJsonPath('meta.total', 3);
    }

    public function test_sort_field_is_whitelisted_and_like_wildcards_are_escaped(): void
    {
        $user = $this->signIn();
        Product::factory()->for($user)->create(['name' => '100% Cotton']);
        Product::factory()->for($user)->create(['name' => 'Plain Shirt']);

        $this->getJson('/api/products?sort=user_id')->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->getJson('/api/products?sort=name;drop table users')->assertUnprocessable();

        $this->getJson('/api/products?search=%25')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_overview_statistics_are_scoped_to_the_user(): void
    {
        $user = $this->signIn();
        Product::factory()->for($user)->create(['quantity' => 2]);
        Product::factory()->for($user)->create(['quantity' => 5]);
        Product::factory()->for($user)->create(['quantity' => 20]);
        Product::factory()->count(4)->create(['quantity' => 1]);

        $this->getJson('/api/overview')
            ->assertOk()
            ->assertJsonPath('data.total_products', 3)
            ->assertJsonPath('data.total_stock', 27)
            ->assertJsonPath('data.low_stock_count', 2)
            ->assertJsonPath('data.low_stock_threshold', 5)
            ->assertJsonCount(3, 'data.recent_products');
    }

    public function test_categories_are_scoped_to_the_user(): void
    {
        $user = $this->signIn();
        Product::factory()->for($user)->create(['category' => 'Snacks']);
        Product::factory()->for($user)->create(['category' => 'Snacks']);
        Product::factory()->create(['category' => 'Hidden']);

        $this->getJson('/api/products/categories')->assertOk()->assertExactJson(['data' => ['Snacks']]);
    }
}

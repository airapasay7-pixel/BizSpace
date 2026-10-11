<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ProductPolicy
{
    public function view(User $user, Product $product): Response
    {
        return $this->owns($user, $product);
    }

    public function update(User $user, Product $product): Response
    {
        return $this->owns($user, $product);
    }

    public function delete(User $user, Product $product): Response
    {
        return $this->owns($user, $product);
    }

    // Answer 404 rather than 403 so product IDs belonging to others can't be probed.
    private function owns(User $user, Product $product): Response
    {
        return $user->id === $product->user_id
            ? Response::allow()
            : Response::denyAsNotFound();
    }
}

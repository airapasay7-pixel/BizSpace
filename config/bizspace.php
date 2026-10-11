<?php

return [
    // A product is "low stock" when its quantity is at or below this number.
    'low_stock_threshold' => (int) env('LOW_STOCK_THRESHOLD', 5),
];

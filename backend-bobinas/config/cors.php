<?php
// config/cors.php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'me'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['http://localhost:3001', 'http://192.168.84.3:3001'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
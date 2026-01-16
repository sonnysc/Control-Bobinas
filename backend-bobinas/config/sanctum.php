<?php
// config/sanctum.php

use Laravel\Sanctum\Sanctum;

return [
    // config/sanctum.php
    'stateful' => array_filter(array_merge(
        // Esto lee la IP/Dominio del frontend desde el .env
        explode(',', env('SANCTUM_STATEFUL_DOMAINS', '')),
        [
            'localhost',
            'localhost:3000',
            '127.0.0.1',
            '127.0.0.1:8000',
            '::1',
        ]
    )),

    'guard' => ['web'],

    'expiration' => null,

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
    ],
];

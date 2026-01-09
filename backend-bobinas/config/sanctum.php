<?php
// config/sanctum.php

use Laravel\Sanctum\Sanctum;

$currentHost = $_SERVER['HTTP_HOST'] ?? 'localhost';

$currentDomain = preg_replace('/:\d+$/', '', $currentHost);

return [

    'stateful' => array_filter(array_merge(
        explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,127.0.0.1')),
        [$currentHost, $currentDomain]
    )),

    'guard' => ['web'],

    'expiration' => null,

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],

];
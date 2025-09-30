<?php
// app/Http/Middleware/CustomCors.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CustomCors
{
    public function handle(Request $request, Closure $next)
    {
        $allowedOrigin = 'http://localhost:3000';

        $response = $next($request);

        $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Expose-Headers', 'Authorization');

        // Handle preflight requests
        if ($request->getMethod() === 'OPTIONS') {
            $response->setStatusCode(200);
            $response->setContent(null);
        }

        return $response;
    }
}
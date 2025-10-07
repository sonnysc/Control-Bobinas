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
        $allowedOrigin = 'http://192.168.84.3:3000';

        // Handle preflight requests FIRST
        if ($request->getMethod() === 'OPTIONS') {
            $response = new Response('', 200);
        } else {
            $response = $next($request);
        }

        $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Expose-Headers', 'Authorization');
        $response->headers->set('Access-Control-Max-Age', '86400');

        return $response;
    }
}

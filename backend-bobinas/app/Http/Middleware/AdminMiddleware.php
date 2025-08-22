<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (session('role') !== 'admin') {
            return response()->json(['error' => 'No autorizado'], 403);
        }
        return $next($request);
    }
}

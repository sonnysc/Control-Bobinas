<?php
// app/Http/Middleware/CustomCors.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CustomCors
{
    public function handle(Request $request, Closure $next): Response
    {
        // ✅ DETECCIÓN DINÁMICA DEL ORIGEN
        $origin = $request->headers->get('Origin');
        
        // Permitir múltiples orígenes en desarrollo
        $allowedOrigins = [
            'http://localhost:3001',
            'http://127.0.0.1:3001',
        ];
        
        // Si hay un origen en la petición, agregarlo
        if ($origin) {
            $allowedOrigins[] = $origin;
        }
        
        // Determinar el origen permitido
        if (app()->environment('local')) {
            // En desarrollo, permitir el origen de la petición o cualquier localhost
            $allowedOrigin = $origin ?: 'http://localhost:3001';
        } else {
            // En producción, usar configuración del .env
            $allowedOrigin = env('CORS_ALLOWED_ORIGIN', $origin);
        }

        // ✅ MANEJAR PREFLIGHT REQUESTS
        if ($request->getMethod() === 'OPTIONS') {
            $response = new Response('', 200);
        } else {
            $response = $next($request);
        }

        // ✅ CONFIGURAR HEADERS CORS
        $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Origin');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Expose-Headers', 'Authorization');
        $response->headers->set('Access-Control-Max-Age', '86400');

        return $response;
    }
}
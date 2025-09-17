<?php
// routes/api.php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BobinaController;
use App\Http\Controllers\ConfiguracionController;
use Illuminate\Support\Facades\Route;


// Rutas de Sanctum para CSRF
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

// Auth - SIN middleware
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Bobinas - accesible para todos los roles autenticados
    Route::get('/bobinas', [BobinaController::class, 'index']);
    Route::get('/bobinas/clientes', [BobinaController::class, 'getClientes']);
    Route::get('/bobinas/{id}', [BobinaController::class, 'show']);
    Route::post('/bobinas', [BobinaController::class, 'store']);

    // Solo admin puede gestionar aprobaciones
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/bobinas/solicitudes/pendientes', [BobinaController::class, 'getSolicitudesPendientes']);
        Route::post('/bobinas/{id}/aprobar', [BobinaController::class, 'aprobarActualizacion']);
        Route::post('/bobinas/{id}/rechazar', [BobinaController::class, 'rechazarActualizacion']);
    });

    // Embarcadores y admin pueden actualizar, pero embarcadores requieren aprobación
    Route::middleware(['role:admin,embarcador'])->group(function () {
        Route::put('/bobinas/{id}', [BobinaController::class, 'update']);
    });

    // Solo admin puede eliminar bobinas y gestionar configuraciones
    Route::middleware(['role:admin'])->group(function () {
        Route::delete('/bobinas/{id}', [BobinaController::class, 'destroy']); // DEJAR SOLO ESTA

        Route::get('/configuraciones', [ConfiguracionController::class, 'index']);
        Route::post('/configuraciones', [ConfiguracionController::class, 'store']);
        Route::put('/configuraciones/{id}', [ConfiguracionController::class, 'update']);
        Route::delete('/configuraciones/{id}', [ConfiguracionController::class, 'destroy']);

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });

    // Ruta para verificar autorización de líder
    Route::post('/bobinas/verificar-autorizacion', [BobinaController::class, 'verificarAutorizacionLider']);
});

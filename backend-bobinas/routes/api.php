<?php
// routes/api.php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BobinaController;
use App\Http\Controllers\ConfiguracionController;
use App\Http\Controllers\InventoryController;
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

    // ✅ RUTAS DE INVENTARIO - Agregar estas rutas
    Route::prefix('inventario')->group(function () {
        Route::get('/', [InventoryController::class, 'index']);
        Route::get('/stats', [InventoryController::class, 'stats']);
        Route::get('/hu/{hu}', [InventoryController::class, 'findByHU']);
        Route::get('/{id}', [InventoryController::class, 'show']);
        Route::post('/scan', [InventoryController::class, 'processScan']);
        Route::post('/', [InventoryController::class, 'store']);
        Route::put('/{id}', [InventoryController::class, 'update']);
        Route::delete('/{id}', [InventoryController::class, 'destroy']);
    });

    // Bobinas - accesible para todos los roles autenticados
    Route::get('/bobinas', [BobinaController::class, 'index']);
    Route::get('/bobinas/clientes', [BobinaController::class, 'getClientes']);
    Route::get('/bobinas/{id}', [BobinaController::class, 'show']);
    Route::post('/bobinas', [BobinaController::class, 'store']);
    Route::post('/bobinas/verificar-autorizacion', [BobinaController::class, 'verificarAutorizacionLider']);

    // Embarcadores y admin pueden actualizar
    Route::put('/bobinas/{id}', [BobinaController::class, 'update']);

    // Solo admin puede eliminar bobinas y gestionar configuraciones
    Route::middleware(['role:admin'])->group(function () {
        Route::delete('/bobinas/{id}', [BobinaController::class, 'destroy']);

        // Configuraciones
        Route::get('/configuraciones', [ConfiguracionController::class, 'index']);
        Route::post('/configuraciones', [ConfiguracionController::class, 'store']);
        Route::put('/configuraciones/{id}', [ConfiguracionController::class, 'update']);
        Route::delete('/configuraciones/{id}', [ConfiguracionController::class, 'destroy']);

        // Usuarios
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        // ✅ Inventario - solo admin puede eliminar
        Route::delete('/inventario/{id}', [InventoryController::class, 'destroy']);
    });
});
?>
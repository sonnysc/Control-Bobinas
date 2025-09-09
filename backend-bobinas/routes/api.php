<?php
// routes/api.php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BobinaController;
use App\Http\Controllers\ConfiguracionController;
use Illuminate\Support\Facades\Route;

// Auth - SIN middleware
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas con Sanctum
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Bobinas - accesible para todos los roles autenticados
    Route::get('/bobinas', [BobinaController::class, 'index']);
    Route::get('/bobinas/clientes', [BobinaController::class, 'getClientes']);
    Route::get('/bobinas/{id}', [BobinaController::class, 'show']);
    
    // Solo embarcadores y admin pueden crear/actualizar bobinas
    Route::middleware(['role:admin,embarcador'])->group(function () {
        Route::post('/bobinas', [BobinaController::class, 'store']);
        Route::put('/bobinas/{id}', [BobinaController::class, 'update']);
    });
    
    // Solo admin puede eliminar bobinas y gestionar configuraciones
    Route::middleware(['role:admin'])->group(function () {
        Route::delete('/bobinas/{id}', [BobinaController::class, 'destroy']);
        
        Route::get('/configuraciones', [ConfiguracionController::class, 'index']);
        Route::post('/configuraciones', [ConfiguracionController::class, 'store']);
        Route::put('/configuraciones/{id}', [ConfiguracionController::class, 'update']);
        Route::delete('/configuraciones/{id}', [ConfiguracionController::class, 'destroy']);
        
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });
});
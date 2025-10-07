<?php
// bootstrap/app.php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\CustomCors;
use App\Http\Middleware\RoleMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'cors' => CustomCors::class,
            'role' => RoleMiddleware::class,
        ]);
    })
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule) {
        // Programar depuración diaria a las 2:00 AM
        $schedule->command('registros:depurar')
            ->dailyAt('02:00')
            ->timezone('America/Mexico_City')
            ->environments(['production'])
            ->evenInMaintenanceMode();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
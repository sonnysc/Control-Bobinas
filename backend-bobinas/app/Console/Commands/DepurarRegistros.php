<?php
// app/Console/Commands/DepurarRegistros.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Bobina;
use App\Models\Configuracion;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class DepurarRegistros extends Command
{
    protected $signature = 'registros:depurar';
    protected $description = 'Elimina registros y fotos antiguas según los días de retención configurados';

    public function handle()
    {
        $configuraciones = Configuracion::all();

        // Depuración por clientes con configuración
        foreach ($configuraciones as $config) {
            $fechaLimite = Carbon::now()->subDays($config->dias_retencion);

            $bobinas = Bobina::where('cliente', $config->cliente)
                ->where(function($query) use ($fechaLimite) {
                    $query->where('fecha_embarque', '<', $fechaLimite)
                          ->orWhere('fecha_reemplazo', '<', $fechaLimite);
                })
                ->get();

            foreach ($bobinas as $bobina) {
                if ($bobina->foto_path && Storage::exists($bobina->foto_path)) {
                    Storage::delete($bobina->foto_path);
                }
                $bobina->delete();
            }

            $this->info("Eliminadas " . count($bobinas) . " bobinas del cliente " . $config->cliente);
        }

        // Depuración para clientes sin configuración (valor por defecto: 90 días)
        $fechaLimiteDefault = Carbon::now()->subDays(90);

        $bobinasDefault = Bobina::whereNotIn('cliente', $configuraciones->pluck('cliente'))
            ->orWhereNull('cliente')
            ->where(function($query) use ($fechaLimiteDefault) {
                $query->where('fecha_embarque', '<', $fechaLimiteDefault)
                      ->orWhere('fecha_reemplazo', '<', $fechaLimiteDefault);
            })
            ->get();

        foreach ($bobinasDefault as $bobina) {
            if ($bobina->foto_path && Storage::exists($bobina->foto_path)) {
                Storage::delete($bobina->foto_path);
            }
            $bobina->delete();
        }

        $this->info("Eliminadas " . count($bobinasDefault) . " bobinas con configuración por defecto");
    }
}
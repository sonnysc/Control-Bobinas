<?php

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

            $count = 0;
            foreach ($bobinas as $bobina) {
                if ($bobina->foto_path && Storage::disk('public')->exists($bobina->foto_path)) {
                    Storage::disk('public')->delete($bobina->foto_path);
                }
                $bobina->delete();
                $count++;
            }

            $this->info("Eliminadas {$count} bobinas del cliente {$config->cliente}");
        }

        // Depuración para clientes sin configuración (valor por defecto: 90 días)
        $fechaLimiteDefault = Carbon::now()->subDays(90);
        $clientesConfigurados = $configuraciones->pluck('cliente')->toArray();

        $bobinasDefault = Bobina::where(function($query) use ($clientesConfigurados, $fechaLimiteDefault) {
            $query->whereNotIn('cliente', $clientesConfigurados)
                  ->orWhereNull('cliente');
        })
        ->where(function($query) use ($fechaLimiteDefault) {
            $query->where('fecha_embarque', '<', $fechaLimiteDefault)
                  ->orWhere('fecha_reemplazo', '<', $fechaLimiteDefault);
        })
        ->get();

        $countDefault = 0;
        foreach ($bobinasDefault as $bobina) {
            if ($bobina->foto_path && Storage::disk('public')->exists($bobina->foto_path)) {
                Storage::disk('public')->delete($bobina->foto_path);
            }
            $bobina->delete();
            $countDefault++;
        }

        $this->info("Eliminadas {$countDefault} bobinas con configuración por defecto");
        
        return Command::SUCCESS;
    }
}
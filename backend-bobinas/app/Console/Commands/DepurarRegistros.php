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
        
        foreach ($configuraciones as $config) {
            $fechaLimite = Carbon::now()->subDays($config->dias_retencion);
            
            $bobinas = Bobina::where('cliente', $config->cliente)
                            ->where('fecha_embarque', '<', $fechaLimite)
                            ->get();
            
            foreach ($bobinas as $bobina) {
                // Eliminar imagen
                if ($bobina->foto_path && Storage::exists($bobina->foto_path)) {
                    Storage::delete($bobina->foto_path);
                }
                
                // Eliminar registro
                $bobina->delete();
            }
            
            $this->info("Eliminadas " . count($bobinas) . " bobinas del cliente " . $config->cliente);
        }
        
        // Para clientes sin configuración específica, usar el valor por defecto (90 días)
        $fechaLimiteDefault = Carbon::now()->subDays(90);
        $bobinasDefault = Bobina::whereNotIn('cliente', $configuraciones->pluck('cliente'))
                                ->orWhereNull('cliente')
                                ->where('fecha_embarque', '<', $fechaLimiteDefault)
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
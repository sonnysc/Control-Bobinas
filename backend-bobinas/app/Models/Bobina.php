<?php
// app/Models/Bobina.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class Bobina extends Model
{
    use HasFactory;

    protected $fillable = [
        'hu',
        'cliente',
        'foto_path',
        'user_id',
        'fecha_reemplazo',
        'estado_aprobacion',
        'aprobado_por',
        'reemplazado_por',
        'fecha_aprobacion'
    ];

    protected $casts = [
        'fecha_embarque' => 'datetime',
        'fecha_reemplazo' => 'datetime',
        'fecha_aprobacion' => 'datetime'
    ];

    // Usuario que registró la bobina
    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Líder que aprobó
    public function aprobador()
    {
        return $this->belongsTo(User::class, 'aprobado_por');
    }

    // Usuario que hizo el reemplazo
    public function reemplazador()
    {
        return $this->belongsTo(User::class, 'reemplazado_por');
    }

    // URL de la imagen
    public function getFotoUrlAttribute()
    {
        if ($this->foto_path) {
            return Storage::disk('public')->url($this->foto_path);
        }
        return null;
    }

    // Calcular días restantes antes de depuración
    public function diasRestantes($diasRetencion = 90)
    {
        $fechaBase = $this->fecha_reemplazo ?? $this->fecha_embarque;
        $fechaLimite = $fechaBase->copy()->addDays($diasRetencion);
        $restantes = $fechaLimite->diffInDays(now(), false);
        return $restantes > 0 ? $restantes : 0;
    }
}

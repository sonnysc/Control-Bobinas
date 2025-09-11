<?php
// app/Models/Bobina.php

namespace app\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Bobina extends Model
{
    use HasFactory;

    protected $fillable = [
        'hu',
        'cliente',
        'estado',
        'foto_path',
        'user_id',
        'fecha_reemplazo',
        'estado_aprobacion'
    ];

    protected $casts = [
        'fecha_embarque' => 'datetime',
        'fecha_reemplazo' => 'datetime',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function aprobador()
    {
        return $this->belongsTo(User::class, 'aprobado_por');
    }

    public function getFotoUrlAttribute()
    {
        if ($this->foto_path) {
            return Storage::disk('public')->url($this->foto_path);
        }
        return null;
    }
}

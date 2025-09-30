<?php

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

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    
    protected $appends = ['foto_url'];


    // Relaciones (sin cambios)
    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function aprobador()
    {
        return $this->belongsTo(User::class, 'aprobado_por');
    }

    public function reemplazador()
    {
        return $this->belongsTo(User::class, 'reemplazado_por');
    }

    public function getFotoUrlAttribute()
    {
        if ($this->foto_path && Storage::disk('public')->exists($this->foto_path)) {
            return Storage::disk('public')->url($this->foto_path);
        }
        return null; // O una URL a una imagen por defecto
    }

}

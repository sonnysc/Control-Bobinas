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
        'fecha_embarque',
        'fecha_reemplazo',
        'fecha_borrado',
        'estado_aprobacion',
        'aprobado_por',
        'reemplazado_por',
        'fecha_aprobacion',
        'comentarios_aprobacion',
        'estado'
    ];

    protected $casts = [
        'fecha_embarque' => 'datetime',
        'fecha_reemplazo' => 'datetime',
        'fecha_aprobacion' => 'datetime',
        'fecha_borrado' => 'datetime'
    ];

    protected $appends = ['foto_url'];

    // Relaciones
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
        return null;
    }
}
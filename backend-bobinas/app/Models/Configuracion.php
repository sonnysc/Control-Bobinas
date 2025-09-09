<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Configuracion extends Model
{
    // Nombre de la tabla si no sigue la convención plural
    protected $table = 'configuraciones';

    // Campos que se pueden asignar masivamente
    protected $fillable = [
        'cliente',
        'dias_retencion',
    ];

    // Si no usas timestamps (created_at, updated_at)
    public $timestamps = false;
}

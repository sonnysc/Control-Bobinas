<?php
// app/Models/Inventory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    // ✅ Nombre de la tabla
    protected $table = 'inventario';

    // ✅ Campos que se pueden llenar
    protected $fillable = [
        'hu',
        'descripcion'
    ];

    // ✅ Campos de fecha
    protected $dates = [
        'created_at',
        'updated_at'
    ];

    // ✅ Buscar por HU
    public static function findByHU($hu)
    {
        return static::where('hu', $hu)->first();
    }

    // ✅ Verificar si un HU ya existe
    public static function huExists($hu)
    {
        return static::where('hu', $hu)->exists();
    }

    // ✅ Scope para búsqueda
    public function scopeSearch($query, $search)
    {
        return $query->where('hu', 'like', "%{$search}%")
                    ->orWhere('descripcion', 'like', "%{$search}%");
    }
}
?>
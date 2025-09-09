<?php
// app/Models/Bobina.php

namespace app\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bobina extends Model
{
    use HasFactory;

    protected $fillable = [
        'hu',
        'cliente',
        'estado',
        'foto_path',
        'user_id',
        'fecha_reemplazo'
    ];

    protected $casts = [
        'fecha_embarque' => 'datetime',
        'fecha_reemplazo' => 'datetime',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Modificar el enum para incluir el rol de líder
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'ingeniero', 'embarcador', 'lider')");
    }

    public function down(): void
    {
        // Revertir el cambio (puede causar pérdida de datos si hay usuarios con rol 'lider')
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'ingeniero', 'embarcador')");
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('bobinas', function (Blueprint $table) {
            $table->enum('estado_aprobacion', ['pendiente', 'aprobado', 'rechazado'])->default('pendiente');
            $table->unsignedBigInteger('aprobado_por')->nullable();
            $table->timestamp('fecha_aprobacion')->nullable();
            $table->text('comentarios_aprobacion')->nullable();
            
            $table->foreign('aprobado_por')->references('id')->on('users');
        });
    }

    public function down()
    {
        Schema::table('bobinas', function (Blueprint $table) {
            $table->dropColumn(['estado_aprobacion', 'aprobado_por', 'fecha_aprobacion', 'comentarios_aprobacion']);
        });
    }
};
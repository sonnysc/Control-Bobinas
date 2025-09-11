<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('bobinas', function (Blueprint $table) {
            $table->dropColumn('estado');
        });
    }

    public function down()
    {
        Schema::table('bobinas', function (Blueprint $table) {
            $table->string('estado')->default('bueno');
        });
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('solicitud_actividades', function (Blueprint $table) {
            // Cambiamos de date a dateTime
            $table->dateTime('fecha_original')->change();
            $table->dateTime('nueva_fecha_propuesta')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('solicitud_actividades', function (Blueprint $table) {
            $table->date('fecha_original')->change();
            $table->date('nueva_fecha_propuesta')->nullable()->change();
        });
    }
};

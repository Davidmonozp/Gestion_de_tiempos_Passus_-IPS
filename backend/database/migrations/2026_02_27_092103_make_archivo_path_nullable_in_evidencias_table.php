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
        Schema::table('evidencias', function (Blueprint $table) {
            // Esto permite que la columna acepte valores nulos
            $table->string('archivo_path')->nullable()->change();
            $table->string('nombre_original')->nullable()->change();
            $table->integer('minutos_ejecutados')->default(0)->after('descripcion');
            $table->integer('minutos_extra')->default(0)->after('minutos_ejecutados');
        });
    }

    public function down(): void
    {
        Schema::table('evidencias', function (Blueprint $table) {
            $table->string('archivo_path')->nullable(false)->change();
            $table->string('nombre_original')->nullable()->change();
            $table->integer('minutos_ejecutados')->default(0)->after('descripcion');
            $table->integer('minutos_extra')->default(0)->after('minutos_ejecutados');
        });
    }
};

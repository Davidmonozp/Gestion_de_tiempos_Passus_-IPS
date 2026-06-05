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
        Schema::create('tipos_actividad', function (Blueprint $table) {

            $table->id();

            // Relación con áreas
            $table->foreignId('area_id')
                ->constrained('areas')
                ->onDelete('cascade');

            // Nombre de la actividad configurable
            $table->string('nombre');

            $table->timestamps();

            // Evita duplicados por área
            $table->unique(['area_id', 'nombre']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipos_actividad');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('revision_actividads', function (Blueprint $table) {
            $table->id();
            // Relación con la actividad
            $table->foreignId('actividad_id')->constrained('actividades')->onDelete('cascade');
            // Relación con el jefe que revisa
            $table->foreignId('user_id')->constrained('users');

            $table->text('observacion');
            $table->string('estado_aplicado'); // 'Aprobado' o 'Por_corregir'

            // Aquí guardaremos el array de archivos como JSON
            $table->json('archivos_revision')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('revision_actividads');
    }
};

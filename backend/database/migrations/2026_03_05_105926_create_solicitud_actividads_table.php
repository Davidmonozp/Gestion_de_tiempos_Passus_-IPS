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
        Schema::create('solicitud_actividades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actividad_id')->constrained('actividades')->onDelete('cascade');
            $table->foreignId('solicitante_id')->constrained('users');
            $table->foreignId('revisado_por')->nullable()->constrained('users');

            $table->enum('tipo', ['aplazamiento', 'cancelacion']);
            $table->enum('estado_solicitud', ['pendiente', 'aprobada', 'rechazada'])->default('pendiente');

            $table->text('motivo'); 
            $table->text('observacion_jefe')->nullable(); 

            $table->date('fecha_original'); 
            $table->date('nueva_fecha_propuesta')->nullable(); 

            $table->json('archivos_solicitud')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('solicitud_actividades');
    }
};

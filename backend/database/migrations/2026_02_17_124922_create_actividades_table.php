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
         Schema::create('actividades', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->foreignId('area_id')->constrained('areas')->onDelete('cascade');
            $table->foreignId('asignado_por')->constrained('users')->onDelete('cascade');
            $table->foreignId('asignado_a')->constrained('users')->onDelete('cascade');
            $table->integer('minutos_planeados')->default(0);
            $table->integer('minutos_ejecutados')->default(0);
            $table->boolean('requiere_aprobacion')->default(false);
            $table->boolean('notificar_asignacion')->default(true);
            $table->string('estado')->default('programada');
            $table->dateTime('fecha_finalizacion')->nullable();
            $table->foreignId('aprobada_por')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTime('fecha_aprobacion')->nullable();
            $table->integer('calificacion')->nullable();
            $table->text('observacion_jefe')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actividades');
    }
};

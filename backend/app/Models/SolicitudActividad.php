<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SolicitudActividad extends Model
{
    protected $table = 'solicitud_actividades';
    
    protected $fillable = [
        'actividad_id',
        'solicitante_id',
        'revisado_por',
        'tipo',
        'estado_solicitud',
        'motivo',
        'observacion_jefe',
        'fecha_original',
        'nueva_fecha_propuesta',
        'archivos_solicitud'
    ];

    protected $casts = [
        'archivos_solicitud' => 'array',
        'fecha_original' => 'date',
        'nueva_fecha_propuesta' => 'datetime',
    ];

    // Relación con la actividad
    public function actividad()
    {
        return $this->belongsTo(Actividad::class);
    }
    public function solicitante()
    {
        return $this->belongsTo(User::class, 'solicitante_id');
    }
    public function revisor()
    {
        return $this->belongsTo(User::class, 'revisado_por');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Actividad extends Model
{
    use HasFactory;
    protected $table = 'actividades';

    protected $fillable = [
        'nombre',
        'descripcion',
        'area_id',
        'asignado_por',
        'asignado_a',
        'minutos_planeados',
        'minutos_ejecutados',
        'minutos_extra',
        'requiere_aprobacion',
        'notificar_asignacion',
        'estado',
        'fecha_finalizacion',
        'aprobada_por',
        'fecha_aprobacion',
        'calificacion',
        'observacion_jefe',
        'archivos',
        'solucion',
        'archivos_solucion'
    ];

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    public function asignadoPor()
    {
        return $this->belongsTo(User::class, 'asignado_por');
    }

    public function asignadoA()
    {
        return $this->belongsTo(User::class, 'asignado_a');
    }

    public function aprobadaPor()
    {
        return $this->belongsTo(User::class, 'aprobada_por');
    }

    public function evidencias()
    {
        return $this->hasMany(Evidencia::class);
    }
    public function observaciones()
    {
        return $this->hasMany(Observacion::class);
    }
    protected $casts = [
        'archivos' => 'array',
        'archivos_solucion' => 'array',
    ];
    // public function actividad()
    // {
    //     return $this->belongsTo(Actividad::class, 'actividad_id');
    // }
    public function revisiones()
    {
        return $this->hasMany(RevisionActividad::class)->with('usuario')->latest();
    }
    public function solicitudes()
    {
        return $this->hasMany(SolicitudActividad::class, 'actividad_id');
    }

    public function getArchivosAttribute($value)
    {
        // Como ya está en $casts como 'array', $value ya es un array de PHP.
        // Solo verificamos si es una cadena por si acaso, si no, lo usamos directo.
        $archivos = is_string($value) ? json_decode($value, true) : $value;

        if (empty($archivos)) return [];

        return array_map(function ($archivo) {
            return [
                'original_name' => $archivo['original_name'] ?? 'Archivo',
                'url' => isset($archivo['path']) ? asset($archivo['path']) : null,
                'path' => $archivo['path'] ?? null
            ];
        }, $archivos);
    }

    /**
     * Accessor para archivos de solución (hacemos lo mismo)
     */
    public function getArchivosSolucionAttribute($value)
    {
        $archivos = is_string($value) ? json_decode($value, true) : $value;

        if (empty($archivos)) return [];

        return array_map(function ($archivo) {
            return [
                'original_name' => $archivo['original_name'] ?? 'Archivo',
                'url' => isset($archivo['path']) ? asset($archivo['path']) : null,
                'path' => $archivo['path'] ?? null
            ];
        }, $archivos);
    }
}

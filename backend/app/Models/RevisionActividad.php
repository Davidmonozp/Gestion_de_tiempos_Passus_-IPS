<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RevisionActividad extends Model
{
    protected $fillable = [
        'actividad_id',
        'user_id',
        'observacion',
        'estado_aplicado',
        'archivos_revision'
    ];

    protected $casts = [
        'archivos_revision' => 'array', // Crucial para manejar los archivos como array
    ];

    // Relación inversa: una revisión pertenece a un usuario (el jefe)
    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jornada extends Model
{
    protected $fillable = [
        'user_id',
        'hora_entrada',
        'hora_salida',
        'total_minutos',
        'fecha',
        'estado'
    ];

    // Esto le dice a Laravel que trate estos campos como objetos Carbon (fechas)
    protected $casts = [
        'hora_entrada' => 'datetime',
        'hora_salida' => 'datetime',
        'fecha' => 'date',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

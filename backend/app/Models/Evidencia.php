<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evidencia extends Model
{
    protected $fillable = [
        'actividad_id',
        'user_id',
        'archivo_path',
        'nombre_original',
        'descripcion'
    ];

    public function actividad()
    {
        return $this->belongsTo(Actividad::class);
    }

    public function user()
    {
        // return $this->belongsTo(User::class);
        return $this->belongsTo(User::class, 'user_id');
    }
}

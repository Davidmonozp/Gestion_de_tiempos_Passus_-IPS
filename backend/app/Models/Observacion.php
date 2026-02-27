<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Observacion extends Model
{
    protected $table = 'observaciones';

    protected $fillable = [
        'actividad_id',
        'user_id',
        'comentario',
        'archivo_path',
        'nombre_original'
    ];
    public function actividad()
    {
        return $this->belongsTo(Actividad::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

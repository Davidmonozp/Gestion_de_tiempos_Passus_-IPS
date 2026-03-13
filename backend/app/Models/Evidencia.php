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
        'descripcion',
        'minutos_ejecutados',
        'minutos_extra'
    ];
    protected $appends = ['url'];

    public function getUrlAttribute()
    {
        return $this->archivo_path ? asset($this->archivo_path) : null;
    }

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

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipoActividad extends Model
{
    protected $table = 'tipos_actividad';

    protected $fillable = [
        'area_id',
        'nombre',
    ];

    public function area()
    {
        return $this->belongsTo(Area::class);
    }
}

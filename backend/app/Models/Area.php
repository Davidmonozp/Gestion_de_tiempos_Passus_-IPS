<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    public function usuarios()
{
    return $this->belongsToMany(User::class, 'area_usuario')
                ->withPivot('tipo')
                ->withTimestamps();
}
}

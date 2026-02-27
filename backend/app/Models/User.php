<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements JWTSubject
{
    use HasRoles;

    protected $fillable = [
        'nombre',
        'segundo_nombre',
        'apellido',
        'segundo_apellido',
        'tipo_documento',
        'numero_documento',
        'nombre_usuario',
        'email',
        'password',
        'cargo'
    ];
    protected $hidden = ['password', 'remember_token'];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }
    protected $guard_name = 'api';

    public function areas()
    {
        // Relación muchos a muchos con la tabla pivote area_usuario
        // especificando que guardaremos el campo 'tipo' (Jefe/Integrante)
        return $this->belongsToMany(Area::class, 'area_usuario')
            ->withPivot('tipo')
            ->withTimestamps();
    }
}

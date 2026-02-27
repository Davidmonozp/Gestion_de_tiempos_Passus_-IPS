<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Exception;
use Illuminate\Support\Facades\Auth;

class UsuarioController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validación (Mantenemos tu lógica)
        $validator = Validator::make($request->all(), [
            'nombre'           => 'required|string|max:255',
            'segundo_nombre'   => 'nullable|string|max:255',
            'apellido'         => 'required|string|max:255',
            'segundo_apellido' => 'required|string|max:255',
            'tipo_documento'   => 'required|string',
            'numero_documento' => 'required|string|unique:users,numero_documento',
            'nombre_usuario'   => 'required|string|unique:users,nombre_usuario',
            'email'            => 'required|email|unique:users,email',
            'password'         => 'required|string|min:6',
            'cargo'            => 'required|string',
            'rol_nombre'       => 'required|exists:roles,name',
            'area_id'   => 'required|array',
            'area_id.*' => 'exists:areas,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        try {
            DB::beginTransaction();

            // 2. Crear el registro en la tabla Users
            $user = User::create([
                'nombre'           => $request->nombre,
                'segundo_nombre'   => $request->segundo_nombre,
                'apellido'         => $request->apellido,
                'segundo_apellido' => $request->segundo_apellido,
                'tipo_documento'   => $request->tipo_documento,
                'numero_documento' => $request->numero_documento,
                'nombre_usuario'   => $request->nombre_usuario,
                'email'            => $request->email,
                'password'         => Hash::make($request->password),
                'cargo'            => $request->cargo,
            ]);

            // 3. Asignar el Rol especificando el guard 'api'
            // Esto evita el error "There is no role named... for guard api"
            // 3. Asignar el Rol de Spatie de forma segura
            // Primero buscamos el objeto del rol para asegurarnos de que existe con el guard correcto
            $rolEncontrado = \Spatie\Permission\Models\Role::where('name', $request->rol_nombre)
                ->where('guard_name', 'api')
                ->first();

            if (!$rolEncontrado) {
                throw new Exception("El rol '{$request->rol_nombre}' no está configurado correctamente para la API.");
            }

            // Al pasarle el OBJETO del rol, Spatie ya no tiene que adivinar el guard
            $user->assignRole($rolEncontrado);

            // 4. Lógica de relación con el Área
            // Si el rol es Usuario -> Integrante. De lo contrario -> Jefe.
            $tipoRelacion = ($request->rol_nombre === 'Usuario') ? 'Integrante' : 'Jefe';

            $user->areas()->attach($request->area_id, [
                'tipo' => $tipoRelacion
            ]);

            DB::commit();

            // Cargamos las relaciones para la respuesta JSON
            return response()->json([
                'status'  => 'success',
                'message' => 'Usuario creado integralmente con cargo, rol y área.',
                'data'    => $user->load(['roles:id,name', 'areas:id,nombre'])
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al procesar el registro: ' . $e->getMessage()
            ], 500);
        }
    }

  public function index()
{
    try {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Iniciamos la consulta base
        $query = User::select(
            'id',
            DB::raw("CONCAT_WS(' ', nombre, segundo_nombre, apellido, segundo_apellido) as nombre_completo")
        );

        // 🔒 FILTRO POR ROL:
        // Si es "Usuario", solo se puede ver a él mismo.
        if ($user->hasRole('Usuario')) {
            $query->where('id', $user->id);
        } 
        // Si es "JefeInmediato", podrías filtrar por los de su área aquí también
        // else if ($user->hasRole('JefeInmediato')) { ... }

        $usuarios = $query->orderBy('nombre')->get();

        return response()->json([
            'success' => true,
            'data' => $usuarios
        ], 200);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al obtener usuarios',
            'error' => $e->getMessage()
        ], 500);
    }
}
}

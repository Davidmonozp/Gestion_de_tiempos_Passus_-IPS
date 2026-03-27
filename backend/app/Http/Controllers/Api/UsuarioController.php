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
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->hasRole('Administrador')) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No tienes permisos de administrador para realizar esta acción.'
            ], 403);
        }
        // 1. Validación (Mantenemos tu lógica)
        $validator = Validator::make($request->all(), [
            'nombre'           => 'required|string|max:255',
            'segundo_nombre'   => 'nullable|string|max:255',
            'apellido'         => 'required|string|max:255',
            'segundo_apellido' => 'required|string|max:255',
            'tipo_documento'   => 'required|string',
            'numero_documento' => 'required|string|unique:users,numero_documento',
            'nombre_usuario'   => 'required|string|unique:users,nombre_usuario',
            'email' => 'required|email',
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

    public function update(Request $request, $id)
    {
        /** @var \App\Models\User $admin */
        $admin = Auth::user();

        // 1. Verificación de permisos
        if (!$admin->hasRole('Administrador')) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No tienes permisos de administrador para realizar esta acción.'
            ], 403);
        }

        $user = User::findOrFail($id);

        // 2. Validación
        $validator = Validator::make($request->all(), [
            'nombre'           => 'required|string|max:255',
            'segundo_nombre'   => 'nullable|string|max:255',
            'apellido'         => 'required|string|max:255',
            'segundo_apellido' => 'required|string|max:255',
            'tipo_documento'   => 'required|string',
            // Ignoramos el ID actual para que no falle la validación de unique
            'numero_documento' => 'required|string|unique:users,numero_documento,' . $id,
            'nombre_usuario'   => 'required|string|unique:users,nombre_usuario,' . $id,
            'email'            => 'required|email',
            'password'         => 'nullable|string|min:6', // Opcional en update
            'cargo'            => 'required|string',
            'rol_nombre'       => 'required|exists:roles,name',
            'area_id'          => 'required|array',
            'area_id.*'        => 'exists:areas,id',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        try {
            DB::beginTransaction();

            // 3. Actualizar datos básicos
            $data = $request->only([
                'nombre',
                'segundo_nombre',
                'apellido',
                'segundo_apellido',
                'tipo_documento',
                'numero_documento',
                'nombre_usuario',
                'email',
                'cargo'
            ]);

            // Solo actualizar contraseña si se envió una nueva
            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            $user->update($data);

            // 4. Actualizar Rol (Spatie)
            $rolEncontrado = \Spatie\Permission\Models\Role::where('name', $request->rol_nombre)
                ->where('guard_name', 'api')
                ->first();

            if (!$rolEncontrado) {
                throw new Exception("El rol '{$request->rol_nombre}' no está configurado correctamente para la API.");
            }

            // syncRoles elimina los anteriores y asigna el nuevo
            $user->syncRoles([$rolEncontrado]);

            // 5. Lógica de relación con el Área (Pivot)
            // Determinamos el tipo basado en el nuevo rol
            $tipoRelacion = ($request->rol_nombre === 'Usuario') ? 'Integrante' : 'Jefe';

            // Preparamos el array para sync: [id => ['tipo' => '...']]
            $syncData = [];
            foreach ($request->area_id as $areaId) {
                $syncData[$areaId] = ['tipo' => $tipoRelacion];
            }

            // sync actualiza la tabla intermedia eliminando lo que no esté en el array
            $user->areas()->sync($syncData);

            DB::commit();

            return response()->json([
                'status'  => 'success',
                'message' => 'Usuario actualizado integralmente.',
                'data'    => $user->load(['roles:id,name', 'areas:id,nombre'])
            ], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'status'  => 'error',
                'message' => 'Error al actualizar el registro: ' . $e->getMessage()
            ], 500);
        }
    }

    // app/Http/Controllers/UsuarioController.php

    public function show($id)
    {
        try {
            // Buscamos el usuario con sus áreas y roles (si usas Spatie)
            $usuario = User::with(['areas', 'roles'])->find($id);

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            // Formateamos la respuesta para que coincida con lo que espera tu React
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $usuario->id,
                    'nombre' => $usuario->nombre,
                    'segundo_nombre' => $usuario->segundo_nombre,
                    'apellido' => $usuario->apellido,
                    'segundo_apellido' => $usuario->segundo_apellido,
                    'nombre_completo' => "{$usuario->nombre} {$usuario->apellido}",
                    'email' => $usuario->email,
                    'nombre_usuario' => $usuario->nombre_usuario,
                    'tipo_documento' => $usuario->tipo_documento,
                    'numero_documento' => $usuario->numero_documento,
                    'cargo' => $usuario->cargo,
                    'rol' => $usuario->getRoleNames()->first(), // Si usas Spatie Roles
                    'areas' => $usuario->areas->map(function ($area) {
                        return [
                            'id' => $area->id,
                            'nombre' => $area->nombre,
                            'tipo' => $area->pivot->tipo ?? 'Integrante'
                        ];
                    }),
                    'estado' => $usuario->estado
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el usuario: ' . $e->getMessage()
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

            // 1. Usamos with() para cargar relaciones (rol y área) y evitar el problema N+1
            // 2. Seleccionamos todos los campos relevantes
            $query = User::with('areas');

            // Filtro de seguridad (opcional, según tu lógica anterior)
            if ($user->hasRole('Usuario')) {
                $query->where('id', $user->id);
            }

            $usuarios = $query->get()->map(function ($u) {
                return [
                    'id' => $u->id,
                    'nombre' => $u->nombre,
                    'apellido' => $u->apellido,
                    'nombre_completo' => "{$u->nombre} {$u->apellido}",
                    'email' => $u->email,
                    'nombre_usuario' => $u->nombre_usuario,
                    // Mapeamos las áreas para traer su nombre y el tipo (Jefe/Integrante) del pivote
                    'areas' => $u->areas->map(function ($area) {
                        return [
                            'id' => $area->id,
                            'nombre' => $area->nombre,
                            'tipo' => $area->pivot->tipo // Acceso al campo 'tipo' de la tabla pivote
                        ];
                    }),
                    'rol' => $u->getRoleNames()->first() ?? 'Sin Rol',
                    'estado' => $u->estado ?? 'Activo',
                ];
            });

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

    //     public function index()
    //     {
    //         try {
    //             /** @var \App\Models\User $user */
    //             $user = Auth::user();

    //             // Iniciamos la consulta base
    //             $query = User::select(
    //                 'id',
    //                 DB::raw("CONCAT_WS(' ', nombre, segundo_nombre, apellido, segundo_apellido) as nombre_completo")
    //             );

    //             // 🔒 FILTRO POR ROL:
    //             // Si es "Usuario", solo se puede ver a él mismo.
    //             if ($user->hasRole('Usuario')) {
    //                 $query->where('id', $user->id);
    //             }
    //             // Si es "JefeInmediato", podrías filtrar por los de su área aquí también
    //             // else if ($user->hasRole('JefeInmediato')) { ... }

    //             $usuarios = $query->orderBy('nombre')->get();

    //             return response()->json([
    //                 'success' => true,
    //                 'data' => $usuarios
    //             ], 200);
    //         } catch (\Exception $e) {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Error al obtener usuarios',
    //                 'error' => $e->getMessage()
    //             ], 500);
    //         }
    //     }
    // }
}

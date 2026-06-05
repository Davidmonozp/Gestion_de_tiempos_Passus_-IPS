<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Area;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AreaController extends Controller
{
    /**
     * Listar áreas
     */
public function index()
{
    try {
        // 1. Capturar el usuario autenticado a través del token de la API
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 2. Iniciar la consulta base eliminando el ->select(...) restrictivo
        // De esta forma Eloquent traerá todas las columnas y no romperá 'tiposActividad'
        $query = Area::with('tiposActividad')
            ->where('activa', 1);

        // 3. Aplicar el filtro dinámico según el rol del usuario
        if ($user && !$user->hasRole('Administrador')) {
            // Usamos la relación 'usuarios' para filtrar por el ID del usuario actual
            $query->whereHas('usuarios', function ($q) use ($user) {
                $q->where('users.id', $user->id);
            });
        }

        // 4. Ejecutar la consulta final
        $areas = $query->get();

        return response()->json([
            'success' => true,
            'data' => $areas
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error al obtener las áreas',
            'error' => $e->getMessage()
        ], 500);
    }
}
    // public function index()
    // {
    //     try {

    //         $areas = Area::with('tiposActividad')
    //             ->where('activa', 1)
    //             ->select('id', 'nombre', 'color', 'activa')
    //             ->get();

    //         return response()->json([
    //             'success' => true,
    //             'data' => $areas
    //         ], 200);
    //     } catch (\Exception $e) {

    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Error al obtener las áreas',
    //             'error' => $e->getMessage()
    //         ], 500);
    //     }
    // }

    /**
     * Crear área
     */
    public function store(Request $request)
    {
        try {

            $request->validate([
                'nombre' => 'required|string|unique:areas,nombre',
                'color' => 'nullable|string|max:7',
                'activa' => 'boolean'
            ]);

            $area = Area::create([
                'nombre' => $request->nombre,
                'color' => $request->color ?? '#3498db',
                'activa' => $request->activa ?? true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Área creada correctamente',
                'data' => $area
            ], 201);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error al crear el área',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar área
     */
    public function update(Request $request, $id)
    {
        try {

            $area = Area::findOrFail($id);

            $request->validate([
                'nombre' => 'required|string|unique:areas,nombre,' . $id,
                'color' => 'nullable|string|max:7',
                'activa' => 'boolean'
            ]);

            $area->update([
                'nombre' => $request->nombre,
                'color'  => $request->filled('color') ? $request->color : $area->color,
                'activa' => $request->has('activa') ? $request->activa : $area->activa
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Área actualizada correctamente',
                'data' => $area
            ], 200);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el área',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar área
     */
    public function destroy($id)
    {
        try {

            $area = Area::findOrFail($id);

            $area->delete();

            return response()->json([
                'success' => true,
                'message' => 'Área eliminada correctamente'
            ], 200);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el área',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

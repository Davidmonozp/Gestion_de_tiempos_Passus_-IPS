<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TipoActividad;
use Illuminate\Http\Request;

class TipoActividadController extends Controller
{
    /**
     * Listar tipos de actividad
     */
    public function index()
    {
        try {

            $tipos = TipoActividad::with('area')
                ->select('id', 'nombre', 'area_id')
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $tipos
            ], 200);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los tipos de actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear tipo de actividad
     */
    public function store(Request $request)
    {
        try {

            $request->validate([
                'nombre' => 'required|string|max:255',
                'area_id' => 'required|exists:areas,id'
            ]);

            $tipo = TipoActividad::create([
                'nombre' => $request->nombre,
                'area_id' => $request->area_id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tipo de actividad creado correctamente',
                'data' => $tipo->load('area')
            ], 201);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error al crear el tipo de actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar tipo de actividad
     */
    public function show(int $id)
    {
        try {

            $tipo = TipoActividad::with('area')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $tipo
            ], 200);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el tipo de actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar tipo de actividad
     */
    public function update(Request $request, int $id)
    {
        try {
            $tipo = TipoActividad::findOrFail($id);

            // Cambiamos 'required' por 'nullable' para que no explote si no se envía
            $request->validate([
                'nombre'  => 'required|string|max:255',
                'area_id' => 'nullable|exists:areas,id'
            ]);

            $tipo->update([
                'nombre'  => $request->nombre,
                // Si viene un area_id nuevo lo cambia, si no, mantiene el que ya tenía
                'area_id' => $request->filled('area_id') ? $request->area_id : $tipo->area_id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tipo de actividad actualizado correctamente',
                'data' => $tipo->load('area')
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el tipo de actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar tipo de actividad
     */
    public function destroy(int $id)
    {
        try {

            $tipo = TipoActividad::findOrFail($id);

            $tipo->delete();

            return response()->json([
                'success' => true,
                'message' => 'Tipo de actividad eliminado correctamente'
            ], 200);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el tipo de actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

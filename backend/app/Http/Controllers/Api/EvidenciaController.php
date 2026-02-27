<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Actividad;
use App\Models\Evidencia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EvidenciaController extends Controller
{
    public function index()
    {
        return Evidencia::with('actividad')->get();
    }

    public function store(Request $request, Actividad $actividad)
    {
        try {

            $request->validate([
                'archivos' => 'required',
                'archivos.*' => 'file|max:10240'
            ]);

            $evidencias = [];

            foreach ($request->file('archivos') as $archivo) {

                $path = $archivo->store('evidencias');

                $evidencias[] = Evidencia::create([
                    'actividad_id' => $actividad->id,
                    'ruta_archivo' => $path,
                    'tipo' => $archivo->getClientOriginalExtension(),
                    'subido_por' => Auth::id()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Evidencias subidas correctamente',
                'data' => $evidencias
            ], 201);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error al subir evidencias',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function show($id)
    {
        $evidencia = Evidencia::with('actividad')->findOrFail($id);
        return response()->json($evidencia);
    }

    public function update(Request $request, $id)
    {
        $evidencia = Evidencia::findOrFail($id);
        $evidencia->update($request->all());
        return response()->json($evidencia);
    }

    public function destroy($id)
    {
        Evidencia::destroy($id);
        return response()->json(null, 204);
    }
}

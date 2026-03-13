<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Actividad;
use App\Models\Evidencia;
use App\Models\RevisionActividad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EvidenciaController extends Controller
{
    public function index()
    {
        return Evidencia::with('actividad')->get();
    }

    // public function enviarSolucion(Request $request, $id)
    // {
    //     try {
    //         return DB::transaction(function () use ($request, $id) {
    //             $user = Auth::user();
    //             $actividad = Actividad::findOrFail($id);

    //             $request->validate([
    //                 'solucion' => 'required|string',
    //                 'minutos_ejecutados' => 'nullable|numeric',
    //                 'minutos_extra' => 'nullable|numeric',
    //                 'estado' => 'required|string',
    //                 'archivos_solucion.*' => 'nullable|file|max:10240'
    //             ]);

    //             // Lógica de Tiempos
    //             $tieneEvidencias = $actividad->evidencias()->exists();
    //             $minEjEvidencia = 0;
    //             $minExEvidencia = 0;

    //             if ($tieneEvidencias) {
    //                 $minExEvidencia = $request->minutos_extra ?? 0;
    //                 $actividad->minutos_extra += $minExEvidencia;
    //             } else {
    //                 $minEjEvidencia = $request->minutos_ejecutados ?? 0;
    //                 $actividad->minutos_ejecutados = $minEjEvidencia;
    //                 $actividad->minutos_extra = 0;
    //             }

    //             // 3. Estado de la Actividad
    //             // Si requiere aprobación, pasa a 'Espera_aprobacion', sino al estado del request
    //             $estadoFinal = $actividad->requiere_aprobacion ? 'Espera_aprobacion' : $request->estado;

    //             $actividad->fill([
    //                 'estado' => $estadoFinal,
    //                 'solucion' => $request->solucion, // Guardamos la última solución en el modelo principal
    //             ]);
    //             $actividad->save();

    //             // 4. Registro de Evidencias
    //             if ($request->hasFile('archivos_solucion')) {
    //                 foreach ($request->file('archivos_solucion') as $archivo) {
    //                     if ($archivo->isValid()) {
    //                         $path = $archivo->store('evidencias', 'public');
    //                         $actividad->evidencias()->create([
    //                             'user_id' => $user->id,
    //                             'descripcion' => $request->solucion,
    //                             'archivo_path' => $path,
    //                             'nombre_original' => $archivo->getClientOriginalName(),
    //                             'minutos_ejecutados' => $minEjEvidencia,
    //                             'minutos_extra' => $minExEvidencia
    //                         ]);
    //                     }
    //                 }
    //             } else {
    //                 $actividad->evidencias()->create([
    //                     'user_id' => $user->id,
    //                     'descripcion' => $request->solucion,
    //                     'minutos_ejecutados' => $minEjEvidencia,
    //                     'minutos_extra' => $minExEvidencia
    //                 ]);
    //             }

    //             // ENVÍO DE NOTIFICACIÓN AL JEFE
    //             if ($estadoFinal === 'Espera_aprobacion' && $actividad->asignadoPor) {
    //                 // Asegúrate de crear esta notificación: php artisan make:notification SolucionRecibida
    //                 $actividad->asignadoPor->notify(new \App\Notifications\SolucionRecibida($actividad));
    //             }

    //             return response()->json([
    //                 'success' => true,
    //                 'message' => 'Solución enviada correctamente.'
    //             ]);
    //         });
    //     } catch (\Exception $e) {
    //         return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    //     }
    // }


    public function enviarSolucion(Request $request, $id)
    {
        try {
            return DB::transaction(function () use ($request, $id) {
                $user = Auth::user();
                $actividad = Actividad::findOrFail($id);

                $request->validate([
                    'solucion' => 'required|string',
                    'minutos_ejecutados' => 'nullable|numeric',
                    'minutos_extra' => 'nullable|numeric',
                    'estado' => 'required|string',
                    'archivos_solucion.*' => 'nullable|file|max:10240'
                ]);

                // 1. Lógica de Tiempos
                $tieneEvidencias = $actividad->evidencias()->exists();
                $minEjEvidencia = 0;
                $minExEvidencia = 0;

                if ($tieneEvidencias) {
                    $minExEvidencia = $request->minutos_extra ?? 0;
                    $actividad->minutos_extra += $minExEvidencia;
                } else {
                    $minEjEvidencia = $request->minutos_ejecutados ?? 0;
                    $actividad->minutos_ejecutados = $minEjEvidencia;
                    $actividad->minutos_extra = 0;
                }

                // 2. Estado de la Actividad
                $estadoFinal = $actividad->requiere_aprobacion ? 'Espera_aprobacion' : $request->estado;

                $actividad->fill([
                    'estado' => $estadoFinal,
                    'solucion' => $request->solucion,
                ]);
                $actividad->save();

                // 3. Preparación de datos comunes para evidencias
                $evidenciaBase = [
                    'user_id' => $user->id,
                    'descripcion' => $request->solucion,
                    'minutos_ejecutados' => $minEjEvidencia,
                    'minutos_extra' => $minExEvidencia
                ];

                // 4. Registro de Evidencias (Guardado Directo en PUBLIC)
                if ($request->hasFile('archivos_solucion')) {
                    foreach ($request->file('archivos_solucion') as $archivo) {
                        if ($archivo->isValid()) {
                            // Generamos nombre único para evitar sobrescribir
                            $nombreFinal = time() . '_' . $archivo->getClientOriginalName();

                            // Movemos a public/uploads/evidencias (No requiere symlink)
                            $archivo->move(public_path('uploads/evidencias'), $nombreFinal);

                            $path = 'uploads/evidencias/' . $nombreFinal;

                            $actividad->evidencias()->create(array_merge($evidenciaBase, [
                                'archivo_path' => $path,
                                'nombre_original' => $archivo->getClientOriginalName(),
                            ]));
                        }
                    }
                } else {
                    $actividad->evidencias()->create($evidenciaBase);
                }

                // 5. Notificación
                if ($estadoFinal === 'Espera_aprobacion' && $actividad->asignadoPor) {
                    $actividad->asignadoPor->notify(new \App\Notifications\SolucionRecibida($actividad));
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Solución enviada correctamente.'
                ]);
            });
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function listarSoluciones($id)
    {
        try {
            $actividad = Actividad::findOrFail($id);

            // Agregamos 'actividad' al método with()
            $soluciones = Evidencia::with(['user', 'actividad'])
                ->where('actividad_id', $actividad->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'soluciones' => $soluciones
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener soluciones',
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


    public function revisarActividad(Request $request, $id)
    {
        try {
            return DB::transaction(function () use ($request, $id) {
                $actividad = Actividad::findOrFail($id);
                $user = Auth::user();

                // 1. Procesar Archivos (Igual que en enviarSolucion)
                $archivosRevision = [];
                if ($request->hasFile('archivos_jefe')) {
                    foreach ($request->file('archivos_jefe') as $archivo) {
                        if ($archivo->isValid()) {
                            $path = $archivo->store('revisiones_jefes', 'public');
                            $archivosRevision[] = [
                                'nombre_original' => $archivo->getClientOriginalName(),
                                'path' => $path
                            ];
                        }
                    }
                }

                // 2. Crear el registro en el historial
                $actividad->revisiones()->create([
                    'user_id' => $user->id,
                    'observacion' => $request->observacion_jefe,
                    'estado_aplicado' => $request->aprobado === 'true' ? 'Finalizada' : 'Por_corregir',
                    'archivos_revision' => $archivosRevision
                ]);

                // 3. Actualizar la actividad principal
                $actividad->estado = $request->aprobado === 'true' ? 'Finalizada' : 'Por_corregir';
                $actividad->observacion_jefe = $request->observacion_jefe; // Mantener la última nota a mano
                $actividad->save();

                return response()->json(['success' => true, 'message' => 'Revisión registrada']);
            });
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    // public function revisarActividad(Request $request, $id)
    // {
    //     $request->validate([
    //         'aprobado' => 'required|boolean',
    //         'observacion_jefe' => 'required_if:aprobado,false|string|nullable',
    //         'calificacion' => 'nullable|integer|min:1|max:5'
    //     ]);

    //     try {
    //         $actividad = Actividad::findOrFail($id);

    //         // Verificación básica de seguridad
    //         if (Auth::id() !== $actividad->asignado_por) {
    //             return response()->json(['success' => false, 'message' => 'No tienes permiso para aprobar esta actividad.'], 403);
    //         }

    //         if ($request->aprobado) {
    //             $actividad->estado = 'Completada';
    //             $actividad->fecha_aprobacion = now();
    //             $actividad->aprobada_por = Auth::id();
    //         } else {
    //             // Si no se aprueba, vuelve a estado 'Por corregir' o 'En_Correccion'
    //             $actividad->estado = 'Por corregir';
    //         }

    //         $actividad->observacion_jefe = $request->observacion_jefe;
    //         $actividad->calificacion = $request->calificacion;
    //         $actividad->save();

    //         // Notificar al empleado sobre el veredicto
    //         $actividad->asignadoA->notify(new \App\Notifications\ActividadRevisada($actividad));

    //         return response()->json([
    //             'success' => true,
    //             'message' => $request->aprobado ? 'Actividad cerrada y aprobada.' : 'Actividad devuelta para corrección.'
    //         ]);
    //     } catch (\Exception $e) {
    //         return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    //     }
    // }
}

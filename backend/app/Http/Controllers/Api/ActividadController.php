<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NuevaActividadAsignada;
use App\Models\Actividad;
use App\Models\Evidencia;
use App\Models\Observacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;

class ActividadController extends Controller
{
    // public function index()
    // {
    //     try {
    //         /** @var \App\Models\User $user */
    //         $user = Auth::user();

    //         $query = Actividad::with([
    //             'area',
    //             'asignadoA',
    //             'asignadoPor',
    //             'aprobadaPor',
    //             'evidencias'
    //         ]);

    //         // 👑 Administrador ve todo
    //         if ($user->hasRole('Administrador')) {

    //             $actividades = $query->get();
    //         }

    //         // 👔 JefeInmediato ve actividades de su área
    //         elseif ($user->hasRole('JefeInmediato')) {

    //             $areasIds = $user->areas->pluck('id');

    //             if ($areasIds->isNotEmpty()) {
    //                 $query->whereIn('area_id', $areasIds);
    //             } else {
    //                 $query->whereRaw('1 = 0');
    //             }

    //             $actividades = $query->get();
    //         }

    //         // 👤 Usuario ve solo las asignadas a él
    //         else {

    //             $query->where('asignado_a', $user->id);
    //             $actividades = $query->get();
    //         }

    //         return response()->json([
    //             'success' => true,
    //             'data' => $actividades
    //         ], 200);
    //     } catch (\Exception $e) {

    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Error al obtener las actividades',
    //             'error' => $e->getMessage()
    //         ], 500);
    //     }
    // }

    public function index()
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            // 🔥 Primero construimos el query
            $query = Actividad::with([
                'area',
                'asignadoA',
                'asignadoPor',
                'aprobadaPor',
                'evidencias'
            ]);

            // 👑 Administrador ve todo
            if ($user->hasRole('Administrador')) {
                // no se aplica filtro
            }

            // 👔 JefeInmediato ve actividades de su área
            elseif ($user->hasRole('JefeInmediato')) {

                $areasIds = $user->areas->pluck('id');

                if ($areasIds->isNotEmpty()) {
                    $query->whereIn('area_id', $areasIds);
                } else {
                    $query->whereRaw('1 = 0');
                }
            }

            // 👤 Usuario ve solo las asignadas a él
            else {
                $query->where('asignado_a', $user->id);
            }

            // 🔥 AL FINAL se pagina
            $actividades = $query->paginate(10);

            return response()->json($actividades);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las actividades',
                'error' => $e->getMessage()
            ], 500);
        }
    }



    public function store(Request $request)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            // Validación
            $request->validate([
                'nombre' => 'required|string|max:255',
                'descripcion' => 'nullable|string',
                'area_id' => 'required|exists:areas,id',
                'asignado_a' => 'required|exists:users,id',
                'minutos_planeados' => 'nullable|integer|min:0',
                'minutos_ejecutados' => 'nullable|integer|min:0',
                'fecha_finalizacion' => 'nullable|date',
                'estado' => 'required|string|in:Programada,Ejecución,Finalizada,Por_corregir,Aplazada,Cancelada, Espera_aprobacion',
                'archivos.*' => 'nullable|file|max:10240',
                'requiere_aprobacion' => 'nullable|boolean',
                'notificar_asignacion' => 'nullable|boolean',
            ]);

            // 🔒 Validación por rol
            if (!$user->hasRole('Administrador')) {

                // Restricción para JefeInmediato
                if ($user->hasRole('JefeInmediato')) {
                    $areasIds = $user->areas()->pluck('areas.id');
                    if (!$areasIds->contains($request->area_id)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Como Jefe Inmediato, no puede crear actividades fuera de sus áreas asignadas.'
                        ], 403);
                    }
                }

                // Restricción para Usuario común
                if ($user->hasRole('Usuario')) {
                    if ($request->asignado_a != $user->id) {
                        return response()->json([
                            'success' => false,
                            'message' => 'No tiene permisos para asignar actividades a otros usuarios.'
                        ], 403);
                    }
                }
            }

            // Manejo de archivos múltiples en disk "public"
            $archivosArray = [];
            if ($request->hasFile('archivos')) {
                foreach ($request->file('archivos') as $archivo) {
                    $nombreArchivo = time() . '_' . $archivo->getClientOriginalName();

                    // Lo guardas en public/uploads/actividades
                    $archivo->move(public_path('uploads/actividades'), $nombreArchivo);

                    $archivosArray[] = [
                        // IMPORTANTE: Guarda la ruta partiendo desde la raíz pública
                        'path' => 'uploads/actividades/' . $nombreArchivo,
                        'original_name' => $archivo->getClientOriginalName(),
                    ];
                }
            }


            // Crear actividad
            $actividad = Actividad::create([
                'nombre' => $request->nombre,
                'descripcion' => $request->descripcion,
                'area_id' => $request->area_id,
                'asignado_por' => $user->id,
                'asignado_a' => $request->asignado_a,
                'minutos_planeados' => $request->minutos_planeados ?? 0,
                'minutos_ejecutados' => $request->minutos_ejecutados ?? 0,
                'estado' => $request->estado,
                'fecha_finalizacion' => $request->fecha_finalizacion,
                'requiere_aprobacion' => $request->requiere_aprobacion ?? false,
                'notificar_asignacion' => $request->notificar_asignacion ?? true,
                'archivos' => $archivosArray,
            ]);

            if ($actividad->notificar_asignacion) {
                // Obtenemos el usuario asignado (ya cargado en las relaciones)
                $usuarioAsignado = $actividad->asignadoA;

                if ($usuarioAsignado && $usuarioAsignado->email) {
                    Mail::to($usuarioAsignado->email)->send(new NuevaActividadAsignada($actividad));
                }
            }


            // Cargar relaciones
            $actividad->load([
                'area',
                'asignadoA',
                'asignadoPor',
                'aprobadaPor',
                'evidencias'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Actividad creada correctamente',
                'data' => $actividad
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear la actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            $actividad = Actividad::with([
                'area',
                'asignadoA',
                'asignadoPor',
                'aprobadaPor',
                'evidencias',
                'revisiones.usuario',
                'evidencias.user',
                'solicitudes.solicitante',
                'solicitudes.revisor'
            ])->findOrFail($id);

            // 👑 Administrador puede ver todo
            if ($user->hasRole('Administrador')) {
                return response()->json($actividad);
            }

            // 👔 JefeInmediato solo si pertenece a su área
            if ($user->hasRole('JefeInmediato')) {
                if ($user->areas->pluck('id')->contains($actividad->area_id)) {
                    return response()->json($actividad);
                }
            }

            // 👤 Usuario solo si está asignada a él
            if ($user->hasRole('Usuario') && $actividad->asignado_a == $user->id) {
                return response()->json($actividad);
            }
            

            // ❌ Si no cumple nada
            return response()->json([
                'success' => false,
                'message' => 'No tiene permiso para ver esta actividad'
            ], 403);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    //    public function show($id)
    //     {
    //         try {
    //             // Buscar actividad por ID con relaciones
    //             $actividad = Actividad::with([
    //                 'area',
    //                 'asignadoA',
    //                 'asignadoPor',
    //                 'aprobadaPor',
    //                 'evidencias'
    //             ])->findOrFail($id);

    //             return response()->json([
    //                 'success' => true,
    //                 'data' => $actividad
    //             ], 200);
    //         } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Actividad no encontrada'
    //             ], 404);
    //         } catch (\Exception $e) {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Error al obtener la actividad',
    //                 'error' => $e->getMessage()
    //             ], 500);
    //         }
    //     }

    public function update(Request $request, $id)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            $actividad = Actividad::findOrFail($id);

            $request->validate([
                'nombre' => 'sometimes|required|string|max:255',
                'descripcion' => 'nullable|string',
                'area_id' => 'sometimes|required|exists:areas,id',
                'asignado_a' => 'sometimes|required|exists:users,id',
                'minutos_planeados' => 'nullable|integer|min:0',
                'fecha_finalizacion' => 'nullable|date',
                'requiere_aprobacion' => 'nullable|boolean',
                'notificar_asignacion' => 'nullable|boolean',
                'estado' => 'sometimes|string',

                // Archivos nuevos
                'archivos_solucion.*' => 'nullable|file|max:10240',
                'solucion' => 'nullable|string',

                // Observaciones
                'observacion' => 'nullable|string',
                'archivo_observacion' => 'nullable|file|max:10240'
            ]);

            // 🔒 VALIDACIÓN POR ROL (Tu lógica original)
            if ($user->hasRole('JefeInmediato') && $request->has('area_id')) {
                $areasIds = $user->areas()->pluck('areas.id');
                if (!$areasIds->contains($request->area_id)) {
                    return response()->json(['success' => false, 'message' => 'No tiene permiso'], 403);
                }
            }

            // 🛠 PREPARAR DATA
            $data = $request->except(['archivos_solucion', 'solucion', 'observacion', 'archivo_observacion', 'archivos']);

            // ✨ REGLAS DE ESTADO (Tu lógica original)
            if ($actividad->estado === 'Por_corregir') {
                $data['minutos_ejecutados'] = $actividad->minutos_ejecutados;
            }

            if (!$request->has('estado') || $request->estado == $actividad->estado) {
                if ($request->filled('solucion') || $request->hasFile('archivos_solucion')) {
                    $reqApp = $request->has('requiere_aprobacion')
                        ? filter_var($request->requiere_aprobacion, FILTER_VALIDATE_BOOLEAN)
                        : $actividad->requiere_aprobacion;
                    $data['estado'] = $reqApp ? 'Espera_aprobacion' : 'Finalizada';
                }
            } else {
                $data['estado'] = $request->estado;
            }

            // 📂 LÓGICA DE ARCHIVOS EN COLUMNA JSON
            // 1. Obtenemos lo que el Front mandó como "archivos que se quedan"
            // Si el front mandó una lista filtrada, la tomamos; si no, la actual.
            $archivosFinales = $request->has('archivos')
                ? json_decode($request->archivos, true)
                : (is_array($actividad->archivos) ? $actividad->archivos : []);

            // 2. Si vienen archivos nuevos físicamente, los subimos y agregamos al array
            if ($request->hasFile('archivos_solucion')) {
                foreach ($request->file('archivos_solucion') as $archivo) {
                    $path = $archivo->store('soluciones', 'public');
                    $archivosFinales[] = [
                        'path' => $path,
                        'nombre_original' => $archivo->getClientOriginalName(),
                        'user_id' => $user->id,
                        'fecha' => now()->toDateTimeString()
                    ];
                }
            }

            // Guardamos el array resultante en la columna 'archivos'
            $data['archivos'] = $archivosFinales;

            // 🚀 ACTUALIZAR ACTIVIDAD
            $actividad->update($data);

            // 📝 GUARDAR OBSERVACIÓN (Tu lógica original)
            if ($request->filled('observacion')) {
                $pathObs = null;
                $nomObs = null;
                if ($request->hasFile('archivo_observacion')) {
                    $file = $request->file('archivo_observacion');
                    $pathObs = $file->store('observaciones', 'public');
                    $nomObs = $file->getClientOriginalName();
                }

                Observacion::create([
                    'actividad_id' => $actividad->id,
                    'user_id' => $user->id,
                    'comentario' => $request->observacion,
                    'archivo_path' => $pathObs,
                    'nombre_original' => $nomObs
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Actualizado con éxito',
                'data' => $actividad->load(['area', 'asignadoA', 'asignadoPor', 'evidencias', 'observaciones'])
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    // public function update(Request $request, $id)
    // {
    //     try {
    //         /** @var \App\Models\User $user */
    //         $user = Auth::user();
    //         $actividad = Actividad::findOrFail($id);

    //         $request->validate([
    //             'nombre' => 'sometimes|required|string|max:255',
    //             'descripcion' => 'nullable|string',
    //             'solucion' => 'nullable|string',
    //             'area_id' => 'sometimes|required|exists:areas,id',
    //             'asignado_a' => 'sometimes|required|exists:users,id',
    //             'minutos_planeados' => 'nullable|integer|min:0',
    //             'minutos_ejecutados' => 'nullable|integer|min:0',
    //             'minutos_extra' => 'nullable|integer|min:0',
    //             'fecha_finalizacion' => 'nullable|date',
    //             'archivos.*' => 'nullable|file|max:10240',
    //             'archivos_solucion.*' => 'nullable|file|max:10240',
    //             'requiere_aprobacion' => 'nullable|boolean',
    //             'notificar_asignacion' => 'nullable|boolean',
    //             'estado' => 'sometimes|string'
    //         ]);

    //         // 🔒 1. Validación por rol
    //         if ($user->hasRole('JefeInmediato') && $request->has('area_id')) {
    //             $areasIds = $user->areas()->pluck('areas.id');
    //             if (!$areasIds->contains($request->area_id)) {
    //                 return response()->json(['success' => false, 'message' => 'No tiene permiso en esta área'], 403);
    //             }
    //         }

    //         // 📂 2. Manejo de Archivos de la Actividad
    //         $archivosActividad = $actividad->archivos ?? [];
    //         if ($request->hasFile('archivos')) {
    //             foreach ($request->file('archivos') as $archivo) {
    //                 $path = $archivo->store('actividades', 'public');
    //                 $archivosActividad[] = [
    //                     'path' => $path,
    //                     'original_name' => $archivo->getClientOriginalName(),
    //                 ];
    //             }
    //         }

    //         // 📂 3. Manejo de Archivos de la Solución
    //         $archivosSolucion = $actividad->archivos_solucion ?? [];
    //         if ($request->hasFile('archivos_solucion')) {
    //             foreach ($request->file('archivos_solucion') as $archivo) {
    //                 $path = $archivo->store('soluciones', 'public');
    //                 $archivosSolucion[] = [
    //                     'path' => $path,
    //                     'original_name' => $archivo->getClientOriginalName(),
    //                     'fecha_carga' => now()
    //                 ];
    //             }
    //         }

    //         // 🛠️ 4. PREPARAR VARIABLE $data (Definimos los datos que vienen del request)
    //         $data = $request->except(['archivos', 'archivos_solucion']);
    //         $data['archivos'] = $archivosActividad;
    //         $data['archivos_solucion'] = $archivosSolucion;

    //         // ✨ 5. REGLAS DE NEGOCIO (Estados y Bloqueos)

    //         // Si el estado actual de la DB es 'Por_corregir', protegemos los minutos originales
    //         if ($actividad->estado === 'Por_corregir') {
    //             $data['minutos_ejecutados'] = $actividad->minutos_ejecutados;
    //         }

    //         // Si NO se está enviando un cambio de estado manual, aplicamos lógica automática
    //         // Solo si hay texto en 'solucion' o nuevos archivos de solución
    //         if (!$request->has('estado') || $request->estado == $actividad->estado) {
    //             if ($request->filled('solucion') || $request->hasFile('archivos_solucion')) {

    //                 $requiereAprobacion = $request->has('requiere_aprobacion')
    //                     ? filter_var($request->requiere_aprobacion, FILTER_VALIDATE_BOOLEAN)
    //                     : $actividad->requiere_aprobacion;

    //                 $data['estado'] = $requiereAprobacion ? 'Espera_aprobacion' : 'Finalizada';
    //             }
    //         } else {
    //             // Si el Jefe envió un estado diferente (ej: Por_corregir) desde el select, se respeta
    //             $data['estado'] = $request->estado;
    //         }

    //         // 🚀 6. Actualizar
    //         $actividad->update($data);

    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Actividad actualizada con éxito',
    //             'data' => $actividad->load(['area', 'asignadoA', 'asignadoPor'])
    //         ]);
    //     } catch (\Exception $e) {
    //         return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    //     }
    // }

    public function destroy($id)
    {
        try {
            // Buscar la actividad
            $actividad = Actividad::findOrFail($id);

            // Eliminar archivo asociado si existe
            if ($actividad->archivo) {

                // Construir ruta física real
                $filePath = public_path('storage/' . $actividad->archivo);

                if (File::exists($filePath)) {
                    File::delete($filePath);
                }
            }

            // Eliminar la actividad
            $actividad->delete();

            return response()->json([
                'success' => true,
                'message' => 'Actividad eliminada correctamente'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Actividad no encontrada'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

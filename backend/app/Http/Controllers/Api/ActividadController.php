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

    //         // 1. Iniciamos el query con sus relaciones
    //         $query = Actividad::with([
    //             'area',
    //             'asignadoA',
    //             'asignadoPor',
    //             'aprobadaPor',
    //             'evidencias'
    //         ]);

    //         // 👑 Administrador: Ve todo (no aplicamos filtros adicionales)
    //         if ($user->hasRole('Administrador')) {
    //             // Se queda igual
    //         }

    //         // 👔 JefeInmediato: Ve actividades de personas que pertenecen a su área
    //         elseif ($user->hasRole('JefeInmediato')) {
    //             // Obtenemos los IDs de las áreas a las que pertenece el Jefe
    //             $misAreasIds = $user->areas->pluck('id');

    //             if ($misAreasIds->isNotEmpty()) {
    //                 // Buscamos los IDs de todos los usuarios que pertenecen a esas áreas
    //                 // Esto incluye al mismo jefe y a sus subordinados
    //                 $usuariosDeMisAreas = \App\Models\User::whereHas('areas', function ($q) use ($misAreasIds) {
    //                     $q->whereIn('areas.id', $misAreasIds);
    //                 })->pluck('id');

    //                 // Filtramos las actividades donde el "asignado_a" esté en esa lista de usuarios
    //                 $query->whereIn('asignado_a', $usuariosDeMisAreas);
    //             } else {
    //                 // Si el jefe no tiene área asignada, no ve nada
    //                 $query->whereRaw('1 = 0');
    //             }
    //         }

    //         // 👤 Usuario: Ve solo las asignadas a él
    //         else {
    //             $query->where('asignado_a', $user->id);
    //         }

    //         // 2. Ejecutamos la paginación al final
    //         $actividades = $query->latest()->paginate(10);

    //         return response()->json($actividades);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Error al obtener las actividades',
    //             'error' => $e->getMessage()
    //         ], 500);
    //     }
    // }




    public function index(Request $request) // 👈 Agregamos el Request para capturar el filtro
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            $query = Actividad::with([
                'area',
                'asignadoA',
                'asignadoPor',
                'aprobadaPor',
                'evidencias'
            ]);

            // Capturamos el filtro que viene de React
            $verTodoElArea = $request->query('todo_el_area', 0);

            // 👑 Administrador: Ve todo
            if ($user->hasRole('Administrador')) {
                // Sin filtros adicionales
            }

            // 👔 JefeInmediato: Lógica condicional
            elseif ($user->hasRole('JefeInmediato')) {

                if ($verTodoElArea == 1) {
                    // 🟢 OPCIÓN: VER TODO EL ÁREA
                    $misAreasIds = $user->areas->pluck('id');

                    if ($misAreasIds->isNotEmpty()) {
                        $usuariosDeMisAreas = \App\Models\User::whereHas('areas', function ($q) use ($misAreasIds) {
                            $q->whereIn('areas.id', $misAreasIds);
                        })->pluck('id');

                        $query->whereIn('asignado_a', $usuariosDeMisAreas);
                    } else {
                        $query->whereRaw('1 = 0');
                    }
                } else {
                    // 🔵 OPCIÓN POR DEFECTO: VER SOLO MIS ACTIVIDADES
                    $query->where('asignado_a', $user->id);
                }
            }

            // 👤 Usuario: Ve solo las asignadas a él
            else {
                $query->where('asignado_a', $user->id);
            }

            $actividades = $query->latest()->paginate(10);

            return response()->json($actividades);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las actividades',
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
                'asignadoA.areas', // Cargamos las áreas del asignado para validar
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

            // 👔 JefeInmediato: Puede ver si el asignado pertenece a su área
            if ($user->hasRole('JefeInmediato')) {
                $misAreasIds = $user->areas->pluck('id');

                // Obtenemos las áreas del usuario que tiene la actividad asignada
                $areasDelAsignado = $actividad->asignadoA->areas->pluck('id');

                // Si hay alguna intersección entre mis áreas y las del usuario asignado, tengo permiso
                if ($misAreasIds->intersect($areasDelAsignado)->isNotEmpty()) {
                    return response()->json($actividad);
                }
            }

            // 👤 Usuario solo si está asignada a él
            if ($actividad->asignado_a == $user->id) {
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
                // if ($user->hasRole('JefeInmediato')) {
                //     $areasIds = $user->areas()->pluck('areas.id');
                //     if (!$areasIds->contains($request->area_id)) {
                //         return response()->json([
                //             'success' => false,
                //             'message' => 'Como Jefe Inmediato, no puede crear actividades fuera de sus áreas asignadas.'
                //         ], 403);
                //     }
                // }

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

            $estadoFinal = $request->estado;

            // Si se enviaron minutos ejecutados mayores a 0, forzamos el estado a 'Finalizada'
            if ($request->filled('minutos_ejecutados') && $request->minutos_ejecutados > 0) {
                $estadoFinal = 'Finalizada';
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
                'estado' => $estadoFinal,
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


public function update(Request $request, $id)
{
    try {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $actividad = Actividad::findOrFail($id);

        // 1. 🛑 RESTRICCIÓN DE ESTADO
        $estadosRestringidos = ['Finalizada', 'Espera_aprobacion'];
        if (in_array($actividad->estado, $estadosRestringidos)) {
            return response()->json([
                'success' => false,
                'message' => "No se puede editar una actividad con estado: {$actividad->estado}."
            ], 403);
        }

        // 2. VALIDACIÓN (Aseguramos que area_id sea opcional pero válido)
        $request->validate([
            'area_id' => 'nullable|exists:areas,id',
            'asignado_a' => 'sometimes|required|exists:users,id',
            'nombre' => 'sometimes|required|string|max:255',
        ]);

        // 3. 🔒 SEGURIDAD POR ROL (JefeInmediato = Usuario)
        if (!$user->hasRole('Administrador')) {
            if (($user->hasRole('JefeInmediato') || $user->hasRole('Usuario')) && $actividad->asignado_a != $user->id) {
                return response()->json(['success' => false, 'message' => 'No tiene permisos para editar esta actividad.'], 403);
            }
        }

        // 4. GESTIÓN DE ARCHIVOS (Mantenemos tu lógica original)
        $archivosFinales = [];
        $inputArchivos = $request->input('archivos');
        if ($inputArchivos) {
            $existentes = is_string($inputArchivos) ? json_decode($inputArchivos, true) : $inputArchivos;
            if (is_array($existentes)) {
                foreach ($existentes as $arc) {
                    if (isset($arc['path'])) {
                        $archivosFinales[] = $arc;
                    }
                }
            }
        }

        if ($request->hasFile('archivos')) {
            foreach ($request->file('archivos') as $archivo) {
                $nombreArchivo = time() . '_' . str_replace(' ', '_', $archivo->getClientOriginalName());
                $archivo->move(public_path('uploads/actividades'), $nombreArchivo);
                $archivosFinales[] = [
                    'path' => 'uploads/actividades/' . $nombreArchivo,
                    'original_name' => $archivo->getClientOriginalName(),
                ];
            }
        }

        // 5. 🛠️ SOLUCIÓN AL PROBLEMA DEL ÁREA
        // Extraemos todos los datos excepto archivos
        $data = $request->except(['archivos']);
        
        // Sincronizamos los campos básicos
        $actividad->fill($data);

        // FORZADO MANUAL: Si area_id viene en el request, lo asignamos directamente
        // Esto soluciona problemas si el FormData lo envía como string o dentro de otro campo
        if ($request->has('area_id')) {
            $actividad->area_id = $request->input('area_id');
        } 
        // A veces React envía el objeto 'area' completo, intentamos extraer el ID de ahí también
        elseif ($request->has('area') && is_array($request->input('area'))) {
            $actividad->area_id = $request->input('area')['id'];
        }

        $actividad->archivos = $archivosFinales;

        // 6. GUARDADO
        $actividad->save();

        // 7. RESPUESTA
        $actividad->load(['area', 'asignadoA', 'asignadoPor']);

        return response()->json([
            'success' => true,
            'message' => 'Actividad actualizada con éxito',
            'data' => $actividad
        ]);

    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
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

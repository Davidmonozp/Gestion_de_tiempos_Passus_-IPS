<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NuevaActividadAsignada;
use App\Models\Actividad;
use App\Models\Evidencia;
use App\Models\Observacion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use GdFont;
use Illuminate\Support\Facades\Log;

class ActividadController extends Controller
{
    //     public function index(Request $request) // 👈 Agregamos el Request para capturar el filtro
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

    //         // Capturamos el filtro que viene de React
    //         $verTodoElArea = $request->query('todo_el_area', 0);
    //         $sinPaginar = $request->query('sin_paginar', 0);

    //         // 👑 Administrador: Ve todo
    //         if ($user->hasRole('Administrador')) {
    //             // Sin filtros adicionales
    //         }

    //         // 👔 JefeInmediato: Lógica condicional
    //         elseif ($user->hasRole('JefeInmediato')) {

    //             if ($verTodoElArea == 1) {
    //                 // 🟢 OPCIÓN: VER TODO EL ÁREA
    //                 $misAreasIds = $user->areas->pluck('id');

    //                 if ($misAreasIds->isNotEmpty()) {
    //                     $usuariosDeMisAreas = \App\Models\User::whereHas('areas', function ($q) use ($misAreasIds) {
    //                         $q->whereIn('areas.id', $misAreasIds);
    //                     })->pluck('id');

    //                     $query->whereIn('asignado_a', $usuariosDeMisAreas);
    //                 } else {
    //                     $query->whereRaw('1 = 0');
    //                 }
    //             } else {
    //                 // 🔵 OPCIÓN POR DEFECTO: VER SOLO MIS ACTIVIDADES
    //                 $query->where('asignado_a', $user->id);
    //             }
    //         }

    //         // 👤 Usuario: Ve solo las asignadas a él
    //         else {
    //             $query->where('asignado_a', $user->id);
    //         }

    //         if ($sinPaginar == 1) {
    //             $actividades = $query->latest()->get(); // Trae los 30+ registros
    //             return response()->json([
    //                 'data' => $actividades,
    //                 'total' => $actividades->count()
    //             ]);
    //         }
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

    public function index(Request $request)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            // 1. Consulta base con relaciones
            $query = Actividad::with([
                'area',
                'asignadoA',
                'asignadoPor',
                'aprobadaPor',
                'evidencias'
            ]);

            // 2. LÓGICA DE PERMISOS Y SEGURIDAD
            $verTodoElArea = $request->query('todo_el_area', 0);

            if ($user->hasRole('Administrador')) {
                // Si es administrador, permitimos elegir si ver todo o solo lo propio
                if ($verTodoElArea == 1) {
                    // El administrador ve todo, no aplicamos filtro de asignado_a
                } else {
                    // Solo ve lo suyo
                    $query->where('asignado_a', $user->id);
                }
            } elseif ($user->hasRole('JefeInmediato')) {
                if ($verTodoElArea == 1) {
                    $misAreasIds = $user->areas->pluck('id');
                    if ($misAreasIds->isNotEmpty()) {
                        $usuariosDeMisAreas = \App\Models\User::whereHas('areas', function ($q) use ($misAreasIds) {
                            $q->whereIn('areas.id', $misAreasIds);
                        })->pluck('id');
                        $query->whereIn('asignado_a', $usuariosDeMisAreas);
                    } else {
                        $query->whereRaw('1 = 0'); // No tiene áreas, no ve nada
                    }
                } else {
                    $query->where('asignado_a', $user->id);
                }
            } else {
                // Usuario estándar solo ve lo suyo
                $query->where('asignado_a', $user->id);
            }

            // 3. FILTROS DINÁMICOS (Se aplican solo si vienen en la petición)
            $query->when($request->query('id'), function ($q, $id) {
                $q->where('id', $id);
            })
                ->when($request->query('nombre'), function ($q, $nombre) {
                    $q->where('nombre', 'like', "%{$nombre}%");
                })
                ->when($request->query('estado'), function ($q, $estado) {
                    $q->where('estado', $estado);
                })
                ->when($request->query('area_id'), function ($q, $areaId) {
                    $q->where('area_id', $areaId);
                })
                ->when($request->query('asignado_a'), function ($q, $asignadoA) {
                    $q->where('asignado_a', $asignadoA);
                })
                ->when($request->query('fecha_desde') && $request->query('fecha_hasta'), function ($query) use ($request) {
                    $fechaDesde = $request->query('fecha_desde');
                    $fechaHasta = $request->query('fecha_hasta');

                    $query->whereRaw("DATE(created_at) BETWEEN ? AND ?", [$fechaDesde, $fechaHasta]);
                });

            // 4. LÓGICA DE PAGINACIÓN O RETORNO COMPLETO
            if ($request->query('sin_paginar') == 1) {
                $actividades = $query->latest()->get();
                return response()->json([
                    'data' => $actividades,
                    'total' => $actividades->count()
                ]);
            }

            return response()->json($query->latest()->paginate(10));
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
            $inicioDatetime = Carbon::parse($request->fecha_inicio)->format('Y-m-d H:i:00');
            $finDatetime = Carbon::parse($request->fecha_finalizacion)->format('Y-m-d H:i:00');

            // 3. VALIDACIÓN DE CRUCE DE HORARIOS
            // Buscamos si ya existe una actividad para el mismo usuario en ese rango
            $actividadConflictiva = Actividad::where('asignado_a', $request->asignado_a)
                ->where('fecha_inicio', '<=', $finDatetime)
                ->where('fecha_finalizacion', '>=', $inicioDatetime)
                ->first();

            $actividadConflictiva = Actividad::where('asignado_a', $request->asignado_a)
                ->where('fecha_finalizacion', $finDatetime) // Comparamos solo la fecha de finalización
                ->first();

            if ($actividadConflictiva) {
                $hFin = Carbon::parse($actividadConflictiva->fecha_finalizacion)->format('h:i A');

                return response()->json([
                    'success' => false,
                    'message' => "Conflicto: Ya tienes otra actividad programada que finaliza exactamente a las $hFin."
                ], 409);
            }
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
            return response()->json(['success' => false, 'message' => 'Error de validación', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
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

    public function storeRecurrentes(Request $request)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            // 1. Validación inicial
            $request->validate([
                'nombre' => 'required|string|max:255',
                'area_id' => 'required|exists:areas,id',
                'fecha_inicio' => 'required|date',
                'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
                'dias_semana' => 'required|array|min:1',
            ]);

            // 2. Control de asignación según rol
            $asignadoAId = ($user->hasRole(['Administrador', 'JefeInmediato']))
                ? $request->asignado_a
                : $user->id;

            // 3. Procesamiento de horas
            $inicioBase = Carbon::parse($request->fecha_inicio);
            $finBase = Carbon::parse($request->fecha_fin);

            $horaInicio = $inicioBase->format('H:i:s');
            $horaFin = $finBase->format('H:i:s');

            $periodo = CarbonPeriod::create($inicioBase->startOfDay(), $finBase->startOfDay());
            $actividadesCreadas = [];
            $diasSeleccionados = array_map('intval', $request->dias_semana);

            // 4. Ciclo de creación
            foreach ($periodo as $fecha) {
                if (in_array((int)$fecha->dayOfWeek, $diasSeleccionados)) {

                    // Definimos los tiempos normalizados para esta fecha específica
                    $inicioDatetime = Carbon::parse($fecha->format('Y-m-d') . ' ' . $horaInicio)->format('Y-m-d H:i:00');
                    $finDatetime = Carbon::parse($fecha->format('Y-m-d') . ' ' . $horaFin)->format('Y-m-d H:i:00');

                    // Lógica de conflicto: (inicio_BD < fin_nuevo) AND (fin_BD > inicio_nuevo)
                    $actividadConflictiva = Actividad::where('asignado_a', $asignadoAId)
                        ->where('fecha_inicio', '<=', $finDatetime)
                        ->where('fecha_finalizacion', '>=', $inicioDatetime)
                        ->first();

                    if ($actividadConflictiva) {
                        $horaInicioConflicto = Carbon::parse($actividadConflictiva->fecha_inicio)->format('h:i A');
                        $horaFinConflicto = Carbon::parse($actividadConflictiva->fecha_finalizacion)->format('h:i A');

                        return response()->json([
                            'success' => false,
                            'message' => "Conflicto el día " . $fecha->format('Y-m-d') .
                                ". Ya tienes una actividad programada de " . $horaInicioConflicto .
                                " a " . $horaFinConflicto . "."
                        ], 409);
                    }

                    // Crear actividad (asegurando area_id y formato de tiempo)
                    $actividad = Actividad::create([
                        'nombre' => $request->nombre,
                        'descripcion' => $request->descripcion ?? '',
                        'area_id' => $request->area_id,
                        'asignado_por' => $user->id,
                        'asignado_a' => $asignadoAId,
                        'minutos_planeados' => $request->minutos_planeados ?? 0,
                        'minutos_ejecutados' => 0,
                        'estado' => 'Programada',
                        'fecha_inicio' => $inicioDatetime,
                        'fecha_finalizacion' => $finDatetime,
                        'requiere_aprobacion' => $request->requiere_aprobacion ?? false,
                        'notificar_asignacion' => $request->notificar_asignacion ?? true,
                        'archivos' => [],
                    ]);

                    $actividadesCreadas[] = $actividad->id;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Se han programado ' . count($actividadesCreadas) . ' actividades correctamente.'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }


    // public function storeRecurrentes(Request $request)
    // {
    //     try {
    //         /** @var \App\Models\User $user */
    //         $user = Auth::user();

    //         // 1. Validación inicial
    //         $request->validate([
    //             'nombre' => 'required|string|max:255',
    //             'descripcion' => 'nullable|string',
    //             'area_id' => 'required|exists:areas,id',
    //             'minutos_planeados' => 'nullable|integer|min:0',
    //             'fecha_inicio' => 'required|date|before_or_equal:fecha_fin',
    //             'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
    //             'dias_semana' => 'required|array|min:1',
    //             'dias_semana.*' => 'integer|between:0,6',
    //             'requiere_aprobacion' => 'nullable|boolean',
    //             'notificar_asignacion' => 'nullable|boolean',
    //         ]);

    //         // 2. Control de asignación según rol
    //         $asignadoAId = null;
    //         if ($user->hasRole('Administrador') || $user->hasRole('JefeInmediato')) {
    //             if (!$request->filled('asignado_a')) {
    //                 return response()->json(['success' => false, 'message' => 'El campo asignado a es obligatorio.'], 422);
    //             }
    //             if (!User::where('id', $request->asignado_a)->exists()) {
    //                 return response()->json(['success' => false, 'message' => 'El usuario seleccionado no existe.'], 422);
    //             }
    //             $asignadoAId = $request->asignado_a;

    //             if ($user->hasRole('JefeInmediato')) {
    //                 $areasIds = $user->areas()->pluck('areas.id');
    //                 if (!$areasIds->contains($request->area_id)) {
    //                     return response()->json(['success' => false, 'message' => 'No tiene acceso a esta área.'], 403);
    //                 }
    //             }
    //         } else if ($user->hasRole('Usuario')) {
    //             $asignadoAId = $user->id;
    //         } else {
    //             return response()->json(['success' => false, 'message' => 'Rol no autorizado.'], 403);
    //         }

    //         // 3. Procesamiento de Fechas
    //         $fechaInicioCompleta = Carbon::parse($request->fecha_inicio);
    //         $fechaFinCompleta = Carbon::parse($request->fecha_fin);

    //         $horaInicio = $fechaInicioCompleta->format('H:i:s');
    //         $horaFin = $fechaFinCompleta->format('H:i:s');

    //         // Creamos el periodo de días naturales
    //         $periodo = CarbonPeriod::create($fechaInicioCompleta->startOfDay(), $fechaFinCompleta->startOfDay());
    //         $actividadesCreadas = [];
    //         // Convertimos a enteros para asegurar comparación correcta
    //         $diasSeleccionados = array_map('intval', $request->dias_semana);

    //         // 4. Creación de actividades
    //         foreach ($periodo as $fecha) {
    //             if (in_array((int)$fecha->dayOfWeek, $diasSeleccionados)) {

    //                 $actividad = Actividad::create([
    //                     'nombre' => $request->nombre,
    //                     'descripcion' => $request->descripcion,
    //                     'area_id' => $request->area_id,
    //                     'asignado_por' => $user->id,
    //                     'asignado_a' => $asignadoAId,
    //                     'minutos_planeados' => $request->minutos_planeados ?? 0,
    //                     'minutos_ejecutados' => 0,
    //                     'estado' => 'Programada',
    //                     'fecha_inicio' => $fecha->format('Y-m-d') . ' ' . $horaInicio,
    //                     'fecha_finalizacion' => $fecha->format('Y-m-d') . ' ' . $horaFin,
    //                     'requiere_aprobacion' => $request->requiere_aprobacion ?? false,
    //                     'notificar_asignacion' => $request->notificar_asignacion ?? true,
    //                     'archivos' => [],
    //                 ]);

    //                 $actividadesCreadas[] = $actividad->id;
    //             }
    //         }

    //         if (empty($actividadesCreadas)) {
    //             return response()->json(['success' => false, 'message' => 'No se encontraron días válidos en el rango seleccionado.'], 422);
    //         }

    //         return response()->json([
    //             'success' => true,
    //             'message' => 'Se crearon ' . count($actividadesCreadas) . ' actividades correctamente.'
    //         ], 201);
    //     } catch (\Illuminate\Validation\ValidationException $e) {
    //         return response()->json(['success' => false, 'errors' => $e->errors()], 422);
    //     } catch (\Exception $e) {
    //         return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    //     }
    // }

}

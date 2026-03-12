<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Actividad;
use App\Models\SolicitudActividad;
use App\Models\User;
use App\Notifications\SolicitudAplazamiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SolicitudActividadController extends Controller
{
    public function store(Request $request)
    {
        $actividad = Actividad::findOrFail($request->actividad_id);
        $user_id = Auth::id();

        // Determinar si es el creador/jefe
        $esCreador = ($actividad->asignado_por === $user_id);

        // Procesar archivos
        $archivosData = [];
        if ($request->hasFile('archivos')) {
            foreach ($request->file('archivos') as $file) {
                $path = $file->store('evidencias_solicitudes', 'public');
                $archivosData[] = [
                    'path' => $path,
                    'original_name' => $file->getClientOriginalName()
                ];
            }
        }

        // Crear el registro de la solicitud
        $solicitud = SolicitudActividad::create([
            'actividad_id' => $actividad->id,
            'solicitante_id' => $user_id,
            'tipo' => $request->tipo,
            'motivo' => $request->motivo,
            'fecha_original' => $actividad->fecha_finalizacion,
            'nueva_fecha_propuesta' => $request->nueva_fecha_propuesta,
            'archivos_solicitud' => $archivosData,
            'estado_solicitud' => $esCreador ? 'aprobada' : 'pendiente',
            'revisado_por' => $esCreador ? $user_id : null,
        ]);

        if ($esCreador) {
            // ✅ ACCIÓN DIRECTA (Es el jefe)
            if ($request->tipo === 'aplazamiento') {
                $actividad->fecha_finalizacion = $request->nueva_fecha_propuesta;
            } else {
                $actividad->estado = 'Cancelada';
            }
            $actividad->save();

            $msg = 'Cambio aplicado correctamente.';
        } else {
            // ⏳ SOLICITUD DE SUBORDINADO (Requiere aprobación)
            $actividad->update(['estado' => 'Espera_aprobacion']);

            // 🔥 ENVIAR NOTIFICACIÓN (Email + Campanita)
            $jefe = User::find($actividad->asignado_por);
            if ($jefe) {
                // Se envía la notificación que creamos al jefe
                $jefe->notify(new SolicitudAplazamiento($solicitud));
            }

            $msg = 'Solicitud enviada al jefe correctamente.';
        }

        // Retornar respuesta para React
        return response()->json([
            'success' => true,
            'message' => $msg,
            'solicitud' => $solicitud
        ], 201);
    }


    public function decidir(Request $request, $id)
    {
        
        $solicitud = SolicitudActividad::findOrFail($id);
        $actividad = $solicitud->actividad;

        if ($request->decision === 'aprobada') {
            $solicitud->estado_solicitud = 'aprobada';

            if ($solicitud->tipo === 'aplazamiento') {
                $actividad->fecha_finalizacion = $solicitud->nueva_fecha_propuesta;
                $actividad->estado = 'Aplazada'; 
            } else {
                $actividad->estado = 'Cancelada';
            }
        } else {
            $solicitud->estado_solicitud = 'rechazada';
            $actividad->estado = 'En_proceso'; // Vuelve al estado anterior
        }

        $solicitud->revisado_por = Auth::id();
        $solicitud->observacion_jefe = $request->observacion_jefe;
        $solicitud->save();
        $actividad->save();

        return response()->json(['message' => 'Decisión registrada']);
    }
}

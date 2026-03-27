<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Jornada;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class JornadaController extends Controller
{
    // Registrar la Entrada
    public function registrarEntrada(Request $request)
    {
        $user = Auth::user();
        $hoy = Carbon::today()->toDateString();

        // Verificar si ya tiene una jornada activa (sin hora de salida)
        $jornadaActiva = Jornada::where('user_id', $user->id)
            ->where('estado', 'activo')
            ->first();

        if ($jornadaActiva) {
            return response()->json([
                'success' => false,
                'message' => 'Ya tienes una jornada activa iniciada el ' . $jornadaActiva->hora_entrada
            ], 400);
        }

        $jornada = Jornada::create([
            'user_id' => $user->id,
            'hora_entrada' => Carbon::now(),
            'fecha' => $hoy,
            'estado' => 'activo'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Entrada registrada con éxito',
            'data' => $jornada
        ]);
    }

    // Registrar la Salida
    public function registrarSalida(Request $request)
    {
        $user = Auth::user();
        $hoy = Carbon::today()->toDateString();
        $jornada = Jornada::where('user_id', $user->id)->where('estado', 'activo')->first();

        if (!$jornada) {
            return response()->json(['success' => false, 'message' => 'No hay jornada activa'], 404);
        }

        $horaSalida = Carbon::now();
        $horaEntrada = Carbon::parse($jornada->hora_entrada);
        $minutosBrutos = (int) $horaEntrada->diffInMinutes($horaSalida);

        // NUEVA LÓGICA: Si trabajó más de 360 min (6 horas), descuenta 60.
        $descuentoAlmuerzo = ($minutosBrutos > 360) ? 60 : 0;
        $minutosNetos = $minutosBrutos - $descuentoAlmuerzo;

        $jornada->update([
            'hora_salida' => $horaSalida,
            'total_minutos' => $minutosNetos,
            'estado' => 'finalizado'
        ]);

        // --- CÁLCULO DE BALANCE DE ACTIVIDADES ---
        $minutosActividades = \App\Models\Actividad::where('asignado_a', $user->id)
            ->whereDate('updated_at', $hoy)
            ->get()
            ->sum(function ($act) {
                return $act->minutos_ejecutados + ($act->minutos_extra ?? 0);
            });

        $diferencia = $minutosNetos - $minutosActividades;

        return response()->json([
            'success' => true,
            'desglose' => [
                'tiempo_total' => $this->formatearMinutos($minutosNetos),
                'almuerzo' => "60 min",
                'actividades' => $this->formatearMinutos($minutosActividades),
                'diferencia' => $diferencia,
                'estado_productividad' => $diferencia <= 15 ? 'Óptimo' : 'Incompleto'
            ]
        ]);
    }

    // Función auxiliar para leer mejor los minutos
    private function formatearMinutos($total)
    {
        $h = floor($total / 60);
        $m = $total % 60;
        return "{$h}h {$m}m";
    }

    // Consultar estado actual (Para saber si mostrar botón Entrada o Salida en React)
    public function estadoActual()
    {
        $jornada = Jornada::where('user_id', Auth::id())
            ->where('estado', 'activo')
            ->first();

        return response()->json([
            'success' => true,
            'jornada_activa' => $jornada ? true : false,
            'datos' => $jornada
        ]);
    }

    // public function obtenerBalanceDiario()
    // {
    //     $user = Auth::user();
    //     $hoy = Carbon::today()->toDateString();

    //     // 1. Obtener el tiempo total de la jornada laboral de hoy (ya con almuerzo descontado)
    //     $minutosJornada = Jornada::where('user_id', $user->id)
    //         ->where('fecha', $hoy)
    //         ->sum('total_minutos');

    //     // 2. Sumar minutos de actividades (ejecutados + extras) registrados hoy
    //     // Nota: Filtramos por la fecha de actualización o finalización
    //     $minutosActividades = \App\Models\Actividad::where('asignado_a', $user->id)
    //         ->whereDate('updated_at', $hoy) // O usa el campo de fecha que prefieras
    //         ->get()
    //         ->sum(function ($actividad) {
    //             return $actividad->minutos_ejecutados + ($actividad->minutos_extra ?? 0);
    //         });

    //     $diferencia = $minutosJornada - $minutosActividades;

    //     return response()->json([
    //         'success' => true,
    //         'data' => [
    //             'fecha' => $hoy,
    //             'minutos_laborales' => $minutosJornada,
    //             'minutos_actividades' => $minutosActividades,
    //             'diferencia' => $diferencia,
    //             'mensaje' => $this->generarMensajeBalance($diferencia)
    //         ]
    //     ]);
    // }

    public function obtenerBalanceDiario()
{
    $user = Auth::user();
    $hoy = Carbon::today()->toDateString();

    // 1. Obtener el tiempo total de la jornada laboral de hoy
    $minutosJornada = Jornada::where('user_id', $user->id)
        ->where('fecha', $hoy)
        ->sum('total_minutos');

    // 2. CORRECCIÓN: Sumar minutos desde la tabla EVIDENCIAS (ejecutados + extras)
    // Filtramos solo por lo que se creó HOY para evitar arrastrar acumulados de ayer
    $minutosActividades = \App\Models\Evidencia::where('user_id', $user->id)
        ->whereDate('created_at', $hoy)
        ->selectRaw('SUM(minutos_ejecutados + COALESCE(minutos_extra, 0)) as total')
        ->value('total') ?? 0;

    $diferencia = $minutosJornada - $minutosActividades;

    return response()->json([
        'success' => true,
        'data' => [
            'fecha' => $hoy,
            'minutos_laborales' => $minutosJornada,
            'minutos_actividades' => $minutosActividades, // Ahora es esfuerzo real del día
            'diferencia' => $diferencia,
            'mensaje' => $this->generarMensajeBalance($diferencia)
        ]
    ]);
}

    private function generarMensajeBalance($dif)
    {
        if ($dif > 0) return "Tienes $dif minutos sin justificar en actividades.";
        if ($dif < 0) return "Has registrado " . abs($dif) . " minutos más que tu jornada laboral.";
        return "¡Excelente! Tu tiempo de actividades coincide con tu jornada.";
    }
    // JornadaController.php

    public function previsualizarSalida()
    {
        $user = Auth::user();
        $hoy = Carbon::today()->toDateString();

        $jornada = Jornada::where('user_id', $user->id)->where('estado', 'activo')->first();

        if (!$jornada) {
            return response()->json(['success' => false, 'message' => 'No hay jornada activa'], 404);
        }

        $horaSalidaSimulada = Carbon::now();
        $horaEntrada = Carbon::parse($jornada->hora_entrada);

        // 1. Cálculos de tiempo de reloj
        $minutosBrutos = (int) $horaEntrada->diffInMinutes($horaSalidaSimulada);

        // Lógica de almuerzo (umbral de 6 horas)
        $descuentoAlmuerzo = ($minutosBrutos > 360) ? 60 : 0;
        $minutosNetos = $minutosBrutos - $descuentoAlmuerzo;

        // 2. CORRECCIÓN: Sumar ambas columnas de la tabla Evidencias
        // Usamos selectRaw para sumar la combinación de ambos campos en una sola pasada
        $minutosActividades = \App\Models\Evidencia::where('user_id', $user->id)
            ->whereDate('created_at', $hoy)
            ->selectRaw('SUM(minutos_ejecutados + COALESCE(minutos_extra, 0)) as total')
            ->value('total') ?? 0;

        $diferencia = $minutosNetos - $minutosActividades;

        return response()->json([
            'success' => true,
            'calculo' => [
                'tiempo_laboral' => $this->formatearMinutos($minutosNetos),
                'tiempo_actividades' => $this->formatearMinutos($minutosActividades),
                'diferencia_minutos' => $diferencia,
                'almuerzo' => $descuentoAlmuerzo,
                'mensaje_estado' => $diferencia > 0
                    ? "Te faltan " . $this->formatearMinutos($diferencia) . " por justificar."
                    : "Has justificado todo tu tiempo correctamente."
            ]
        ]);
    }

    // public function previsualizarSalida()
    // {
    //     $user = Auth::user();
    //     $hoy = Carbon::today()->toDateString();

    //     $jornada = Jornada::where('user_id', $user->id)->where('estado', 'activo')->first();

    //     if (!$jornada) {
    //         return response()->json(['success' => false, 'message' => 'No hay jornada activa'], 404);
    //     }

    //     $horaSalidaSimulada = Carbon::now();
    //     $horaEntrada = Carbon::parse($jornada->hora_entrada);

    //     // Cálculos
    //     $minutosBrutos = (int) $horaEntrada->diffInMinutes($horaSalidaSimulada);

    //     // NUEVA LÓGICA: Aplicar el mismo umbral de 6 horas
    //     $descuentoAlmuerzo = ($minutosBrutos > 360) ? 60 : 0;
    //     $minutosNetos = $minutosBrutos - $descuentoAlmuerzo;

    //     // Suma de actividades
    //     $minutosActividades = \App\Models\Actividad::where('asignado_a', $user->id)
    //         ->whereDate('updated_at', $hoy)
    //         ->get()
    //         ->sum(function ($act) {
    //             return $act->minutos_ejecutados + ($act->minutos_extra ?? 0);
    //         });

    //     $diferencia = $minutosNetos - $minutosActividades;

    //     return response()->json([
    //         'success' => true,
    //         'calculo' => [
    //             'tiempo_laboral' => $this->formatearMinutos($minutosNetos),
    //             'tiempo_actividades' => $this->formatearMinutos($minutosActividades),
    //             'diferencia_minutos' => $diferencia,
    //             'almuerzo' => $descuentoAlmuerzo
    //         ]
    //     ]);
    // }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Jornada;
use App\Models\Actividad;
use Carbon\Carbon;

class CerrarJornadasAutomaticamente extends Command
{
    protected $signature = 'jornadas:cerrar-automaticamente';

    protected $description = 'Cierra automáticamente las jornadas activas a las 7 PM';

    public function handle()
    {
        $jornadas = Jornada::where('estado', 'activo')->get();

        foreach ($jornadas as $jornada) {

            $horaEntrada = Carbon::parse($jornada->hora_entrada);

            // Hora de cierre fija
            $horaSalida = Carbon::parse(
                Carbon::today()->format('Y-m-d') . ' 19:00:00'
            );

            $minutosBrutos = $horaEntrada->diffInMinutes($horaSalida);

            $descuentoAlmuerzo = ($minutosBrutos > 360) ? 60 : 0;

            $minutosNetos = $minutosBrutos - $descuentoAlmuerzo;

            $jornada->update([
                'hora_salida' => $horaSalida,
                'total_minutos' => $minutosNetos,
                'estado' => 'finalizado'
            ]);
        }

        $this->info('Jornadas cerradas correctamente.');
    }
}

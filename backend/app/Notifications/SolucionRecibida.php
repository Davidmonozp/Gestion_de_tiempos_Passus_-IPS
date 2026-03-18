<?php

namespace App\Notifications;

use App\Models\Actividad;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SolucionRecibida extends Notification
{
    use Queueable;

    public $actividad;

    public function __construct(Actividad $actividad)
    {
        $this->actividad = $actividad;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        $url = url('/actividades/' . $this->actividad->id);

        // Obtenemos el nombre del colaborador que entrega (asignadoA)
        $colaborador = $this->actividad->asignadoA
            ? ($this->actividad->asignadoA->nombre . ' ' . $this->actividad->asignadoA->apellido)
            : 'Un colaborador';

        return (new MailMessage)
            ->subject('✅ Solución Enviada: ' . $this->actividad->nombre)
            ->view('emails.solucion_recibida', [
                'notifiable' => $notifiable,
                'actividad'  => $this->actividad,
                'colaboradorNombre' => $colaborador,
                'url'        => $url
            ]);
    }

    public function toArray($notifiable)
    {
        return [
            'actividad_id' => $this->actividad->id,
            'mensaje' => 'Nueva solución enviada para: ' . $this->actividad->nombre,
            'tipo' => 'solucion_recibida'
        ];
    }
}

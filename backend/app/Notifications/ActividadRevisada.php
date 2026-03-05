<?php

namespace App\Notifications;

use App\Models\Actividad;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ActividadRevisada extends Notification
{
    use Queueable;

    protected $actividad;

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
        $status = $this->actividad->estado === 'Completada' ? 'APROBADA' : 'DEVUELTA PARA CORRECCIÓN';

        $email = (new MailMessage)
            ->subject('Tu actividad ha sido revisada: ' . $status)
            ->greeting('Hola, ' . $notifiable->name)
            ->line('Tu actividad "' . $this->actividad->nombre . '" ha sido marcada como: ' . $status);

        if ($this->actividad->estado !== 'Completada') {
            $email->line('Observaciones del jefe: ' . $this->actividad->observacion_jefe)
                  ->line('Por favor, realiza los ajustes necesarios y vuelve a enviar la solución.');
        }

        return $email->action('Ver Actividad', url('/actividades/' . $this->actividad->id));
    }

    public function toArray($notifiable)
    {
        return [
            'actividad_id' => $this->actividad->id,
            'estado' => $this->actividad->estado,
        ];
    }
}
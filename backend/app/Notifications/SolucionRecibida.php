<?php

namespace App\Notifications;

use App\Models\Actividad;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SolucionRecibida extends Notification
{
    use Queueable;

    protected $actividad;

    public function __construct(Actividad $actividad)
    {
        $this->actividad = $actividad;
    }

    public function via($notifiable)
    {
        return ['mail', 'database']; // Se envía por email y queda en la DB
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Nueva solución por aprobar: ' . $this->actividad->nombre)
            ->greeting('Hola, ' . $notifiable->name)
            ->line('El colaborador ' . $this->actividad->asignadoA->name . ' ha enviado una solución.')
            ->action('Revisar Solución', url('/actividades/' . $this->actividad->id))
            ->line('Gracias por usar nuestro sistema de gestión.');
    }

    public function toArray($notifiable)
    {
        return [
            'actividad_id' => $this->actividad->id,
            'mensaje' => 'Nueva solución enviada para: ' . $this->actividad->nombre,
        ];
    }
}
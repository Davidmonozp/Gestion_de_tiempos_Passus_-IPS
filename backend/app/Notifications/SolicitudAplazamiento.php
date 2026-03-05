<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Auth;

class SolicitudAplazamiento extends Notification
{
    use Queueable;

    protected $solicitud;

    public function __construct($solicitud)
    {
        $this->solicitud = $solicitud;
    }

    // 🚩 Activa ambos canales: Correo y Base de Datos (Campanita)
    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    // 📧 Configuración del Correo Electrónico
    public function toMail($notifiable)
    {
        $url = url('/actividades/revision/' . $this->solicitud->id);
        $nombreSolicitante = Auth::user() ? Auth::user()->nombre : 'Un usuario';

        return (new MailMessage)
            ->subject('🚨 Nueva Solicitud de Aplazamiento')
            ->greeting('Hola, ' . $notifiable->name)
            ->line('Has recibido una nueva solicitud para aplazar una actividad.')
            ->line('**Solicitante:** ' . $nombreSolicitante)
            ->line('**Motivo:** ' . $this->solicitud->motivo)
            ->line('**Nueva Fecha Propuesta:** ' . \Carbon\Carbon::parse($this->solicitud->nueva_fecha_propuesta)->format('d/m/Y'))
            ->action('Revisar y Aprobar', $url)
            ->line('Por favor, ingresa al sistema para dar una respuesta a esta solicitud.')
            ->salutation('Saludos, Sistema de Gestión de Tiempos');
    }

    // 🔔 Configuración para la "Campanita" (Base de Datos)
    public function toArray($notifiable)
    {
        return [
            'solicitud_id' => $this->solicitud->id,
            'mensaje' => "Solicitud de aplazamiento de " . (Auth::user()->name ?? 'Alguien'),
            'tipo' => 'aplazamiento',
            'actividad_id' => $this->solicitud->actividad_id,
        ];
    }
}

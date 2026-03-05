<?php

namespace App\Mail;

use App\Models\Actividad;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NuevaActividadAsignada extends Mailable
{
    use Queueable, SerializesModels;

    public $actividad;

    public function __construct(Actividad $actividad)
    {
        $this->actividad = $actividad;
    }

    public function build()
    {
        return $this->subject('Nueva Actividad Asignada: ' . $this->actividad->nombre)
                    ->view('emails.actividad_asignada'); 
    }
}

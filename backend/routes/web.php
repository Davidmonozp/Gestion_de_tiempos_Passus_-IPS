<?php

use App\Mail\NuevaActividadAsignada;
use App\Models\Actividad;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;

Route::get('/', function () {
    return view('welcome');
});
// Ejecuta esto una sola vez entrando a tudominio.com/generar-link
Route::get('/generar-link', function () {
    Artisan::call('storage:link');
    return "Enlace simbólico creado. Ahora tus archivos serán visibles.";
});
//     Route::get('/test-email', function () {
//     $actividad = Actividad::first(); 
//     Mail::to('auxiliarautomatizacion3@passusips.com')->send(new NuevaActividadAsignada($actividad));
//     return "Correo enviado";
// });

<?php

use App\Http\Controllers\Api\ActividadController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\EvidenciaController;
use App\Http\Controllers\Api\JornadaController;
use App\Http\Controllers\Api\SolicitudActividadController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Auth\AuthController;
use App\Mail\NuevaActividadAsignada;
use App\Models\Actividad;
use App\Models\SolicitudActividad;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;


Route::prefix('auth')->group(function () {
    // Rutas Públicas
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    // Rutas de sesión protegidas (Requieren Token)
    Route::middleware('auth:api')->group(function () {
        Route::post('profile', [AuthController::class, 'profile']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
    });
});

// 2. Grupo de Gestión y Operaciones (Sin prefijo 'auth', pero con protección)
Route::middleware('auth:api')->group(function () {

    // Rutas de Usuario
    Route::post('/registro-usuario', [UsuarioController::class, 'store']);
    Route::get('/ver-usuarios', [UsuarioController::class, 'index']);
    Route::put('/editar-usuario/{id}', [UsuarioController::class, 'update']);
    Route::get('/ver-usuario/{id}', [UsuarioController::class, 'show']);


    // Rutas de Actividades y Evidencias
    Route::get('/ver-actividades', [ActividadController::class, 'index']);
    Route::post('/crear-actividad', [ActividadController::class, 'store']);
    Route::post('/actividades/{actividad}/evidencias', [EvidenciaController::class, 'store']);
    Route::get('/ver-actividad/{id}', [ActividadController::class, 'show']);
    Route::put('/actualizar-actividad/{id}', [ActividadController::class, 'update']);
    Route::post('/enviar-solucion/{id}', [EvidenciaController::class, 'enviarSolucion']);
    Route::get('/actividad/{id}/soluciones', [EvidenciaController::class, 'listarSoluciones']);

    // Rutas para registro de jornada laboral
    Route::get('/jornada/estado', [JornadaController::class, 'estadoActual']);
    Route::post('/jornada/entrada', [JornadaController::class, 'registrarEntrada']);
    Route::post('/jornada/salida', [JornadaController::class, 'registrarSalida']);
    Route::get('/jornada/balance', [JornadaController::class, 'obtenerBalanceDiario']);
    Route::get('/jornada/previsualizar-salida', [JornadaController::class, 'previsualizarSalida']);

    // Rutas publicas
    Route::get('/ver-areas', [AreaController::class, 'verAreas']);
    Route::get('/ver-roles', [App\Http\Controllers\Api\RolController::class, 'verRoles']);

    // Rutas para revisar actividad por el jefe
    Route::post('/actividades/{id}/revisar', [EvidenciaController::class, 'revisarActividad']);

    // rutas de solicitudes de aplazamiento o cancelacion 
    Route::post('/solicitudes', [SolicitudActividadController::class, 'store']);
    Route::put('/solicitudes/{id}/decidir', [SolicitudActividadController::class, 'decidir']);
    Route::get('/actividades/{id}/historial', function ($id) {
        return SolicitudActividad::where('actividad_id', $id)->with('solicitante')->get();
    });

    // Rutas para notificaciones 
    Route::get('/notificaciones', function () {
        // Retorna las notificaciones sin leer del usuario del token JWT
        return Auth::user()->unreadNotifications;
    });

    Route::post('/notificaciones/marcar-leida', function () {
        // Marca todas como leídas
        Auth::user()->unreadNotifications->markAsRead();
        return response()->json(['success' => true]);
    });

    Route::post('/notificaciones/{id}/leer', function ($id) {
        /** @var User */
        $user = Auth::user();

        if ($user) {
            $notification = $user->notifications()->findOrFail($id);
            $notification->markAsRead();
            return response()->json(['success' => true]);
        }

        return response()->json(['error' => 'No autorizado'], 401);
    });

    // Rutas de aplazamiento de una actividad
    Route::post('/solicitudes/decidir/{id}', [SolicitudActividadController::class, 'decidir']);
});

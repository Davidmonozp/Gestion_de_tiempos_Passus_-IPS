<?php

use App\Http\Controllers\Api\ActividadController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\EvidenciaController;
use App\Http\Controllers\Api\JornadaController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Auth\AuthController;
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

    // Rutas de Actividades y Evidencias
    Route::get('/ver-actividades', [ActividadController::class, 'index']);
    Route::post('/crear-actividad', [ActividadController::class, 'store']);
    Route::post('/actividades/{actividad}/evidencias', [EvidenciaController::class, 'store']);
    Route::get('/ver-actividad/{id}', [ActividadController::class, 'show']);
    Route::put('/actualizar-actividad/{id}', [ActividadController::class, 'update']);
    Route::post('/enviar-solucion/{id}', [ActividadController::class, 'enviarSolucion']);
    Route::get('/actividad/{id}/soluciones', [ActividadController::class, 'listarSoluciones']);

    // Rutas para registro de jornada laboral
    Route::get('/jornada/estado', [JornadaController::class, 'estadoActual']);
    Route::post('/jornada/entrada', [JornadaController::class, 'registrarEntrada']);
    Route::post('/jornada/salida', [JornadaController::class, 'registrarSalida']);
    Route::get('/jornada/balance', [JornadaController::class, 'obtenerBalanceDiario']);
    Route::get('/jornada/previsualizar-salida', [JornadaController::class, 'previsualizarSalida']);

    // Rutas publicas
    Route::get('/ver-areas', [AreaController::class, 'verAreas']);
    Route::get('/ver-roles', [App\Http\Controllers\Api\RolController::class, 'verRoles']);
});

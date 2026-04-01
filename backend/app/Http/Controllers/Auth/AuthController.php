<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    // Register new user
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre'           => 'required|string|max:255',
            'segundo_nombre'   => 'nullable|string|max:255', // Opcional
            'apellido'         => 'required|string|max:255',
            'segundo_apellido' => 'required|string|max:255',
            'tipo_documento'   => 'required|string|max:10', // Ej: CC, TI, CE
            'numero_documento' => 'required|string|max:20|unique:users',
            'nombre_usuario'   => 'required|string|max:255|unique:users',
            'email'            => 'required|string|email|max:255|unique:users',
            'password'         => 'required|string|min:6|confirmed',
        ]);


        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'nombre'           => $request->nombre,
            'segundo_nombre'   => $request->segundo_nombre,
            'apellido'         => $request->apellido,
            'segundo_apellido' => $request->segundo_apellido,
            'tipo_documento'   => $request->tipo_documento,
            'numero_documento' => $request->numero_documento,
            'nombre_usuario'   => $request->nombre_usuario,
            'email'            => $request->email,
            'password'         => Hash::make($request->password), // Usando Hash por seguridad
        ]);

        $user->assignRole('Usuario');


        return response()->json([
            'message' => 'User registered successfully',
            'user'    => $user
        ], 201);
    }

    // Login user and return JWT token
    public function login(Request $request)
    {
        $credentials = $request->only('nombre_usuario', 'password');

        try {
            // 1. Intentar autenticar
            if (!$token = Auth::guard('api')->attempt($credentials)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Credenciales inválidas.'
                ], 401);
            }

            // 2. Obtener al usuario autenticado para sacar sus roles
            $user = Auth::guard('api')->user();

            if ($user->activo !== 1) {
                // Invalidamos el token que se acaba de crear para que no pueda usarse
                Auth::guard('api')->logout();

                return response()->json([
                    'status' => 'error',
                    'message' => 'Tu cuenta se encuentra inactiva. Por favor, contacta al administrador.'
                ], 403); 
            }

            // 3. Respuesta de éxito (Fuera de los catch)
            return response()->json([
                'status' => 'success',
                'message' => 'Login exitoso',
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => Auth::guard('api')->factory()->getTTL() * 60,
                'user' => [
                    'nombre' => $user->nombre,
                    'apellido' => $user->apellido,
                    'nombre_usuario' => $user->nombre_usuario,
                    'email' => $user->email,
                    'roles' => $user->getRoleNames(),
                    'activo' => $user->activo
                ]
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'No se pudo crear el token.'
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error inesperado: ' . $e->getMessage()
            ], 500);
        }
    }
    // Get user profile
    public function profile()
    {
        return response()->json(auth('api')->user());
    }

    // Logout user (invalidate token)
    public function logout()
    {
        // Invalida el token actual
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json(['message' => 'Cierre de sesón exitoso']);
    }

    // Refresh JWT token
    public function refresh()
    {
        // Genera un nuevo token basado en el anterior (refresh)
        $newToken = JWTAuth::refresh(JWTAuth::getToken());

        return $this->respondWithToken($newToken);
    }

    // Return token response structure

    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            // Obtenemos el TTL directamente del Facade de JWT
            'expires_in'   => JWTAuth::factory()->getTTL() * 60,
        ]);
    }
}

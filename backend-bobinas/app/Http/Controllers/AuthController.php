<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Usuario o contraseña incorrectos'], 401);
        }

        // Generar token JWT para el usuario
        $token = JWTAuth::fromUser($user);

        // Devolver token JWT junto con los datos del usuario
        return response()->json([
            'message' => 'Login correcto',
            'token' => $token,
            'role' => $user->role,
            'user_id' => $user->id
        ]);
    }

    public function me(Request $request)
    {
        try {
            // Obtener el usuario autenticado a partir del token JWT
            $user = JWTAuth::parseToken()->authenticate();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no encontrado'], 404);
            }
            
            return response()->json($user);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Token inválido o usuario no autenticado'], 401);
        }
    }

    public function logout(Request $request)
    {
        try {
            // Invalidar el token JWT
            JWTAuth::invalidate(JWTAuth::getToken());
            
            return response()->json(['message' => 'Logout exitoso']);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al hacer logout'], 500);
        }
    }

    public function refresh(Request $request)
    {
        try {
            // Refrescar el token JWT
            $newToken = JWTAuth::refresh(JWTAuth::getToken());
            
            return response()->json(['token' => $newToken]);
            
        } catch (\Exception $e) {
            return response()->json(['error' => 'No se pudo refrescar el token'], 401);
        }
    }
}
<?php
// app/Http/Controllers/AuthController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        try {
            $user = User::where('username', $request->username)->first();

            // Verificar primero si el usuario existe
            if (!$user) {
                return response()->json(['error' => 'El usuario no existe'], 401);
            }

            // Luego verificar la contraseña
            if (!Hash::check($request->password, $user->password)) {
                return response()->json(['error' => 'Contraseña incorrecta'], 401);
            }

            // Eliminar tokens existentes y crear uno nuevo
            $user->tokens()->delete();
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Login correcto',
                'token' => $token,
                'role' => $user->role,
                'user_id' => $user->id
            ]);
        } catch (\Exception $e) {
            \Log::error('Error en login: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    public function me(Request $request)
    {
        try {
            return response()->json($request->user());
        } catch (\Exception $e) {
            \Log::error('Error en me: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno'], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            return response()->json(['message' => 'Logout exitoso']);
        } catch (\Exception $e) {
            \Log::error('Error en logout: ' . $e->getMessage());
            return response()->json(['error' => 'Error al hacer logout'], 500);
        }
    }
}

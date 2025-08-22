<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserController extends Controller
{
    //Listar usuarios
    public function index(Request $request)
    {
        $query = User::query();

        // Búsqueda por username si viene en la request
        if ($request->has('search') && !empty($request->search)) {
            $query->where('username', 'like', '%' . $request->search . '%');
        }

    // Paginación (10 por página)
    return response()->json(
        $query->paginate(10)
    );
    }

    //Crear usuario
    public function store(Request $request)
    {
        $request->validate([
            'username' => 'required|string|unique:users,username',
            'password' => 'required|string|min:4',
            'role' => 'required|string|in:admin,ingeniero,embarcador'
        ]);

        $user = User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => $request->role
        ]);

        return response()->json($user, 201);
    }

    //Actualizar usuario
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'username' => 'required|string|unique:users,username,' . $user->id,
            'role' => 'required|string|in:admin,ingeniero,embarcador'
        ]);

        $user->username = $request->username;
        $user->role = $request->role;

        if ($request->filled('password')) {
            $request->validate([
                'password' => 'string|min:4'
            ]);
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json($user);
    }

    //Eliminar usuario
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'Usuario eliminado']);
    }
}

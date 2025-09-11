<?php
// app/Http/Controllers/ConfiguracionController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Configuracion;

class ConfiguracionController extends Controller
{
    public function index()
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $configuraciones = Configuracion::all();
        return response()->json($configuraciones);
    }

    // app/Http/Controllers/ConfiguracionController.php
    public function store(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $request->validate([
            'cliente' => 'required|string|unique:configuraciones,cliente',
            'dias_retencion' => 'required|integer|min:1'
        ]);

        // Cambiar updateOrCreate por create
        $configuracion = Configuracion::create([
            'cliente' => $request->cliente,
            'dias_retencion' => $request->dias_retencion
        ]);

        return response()->json($configuracion, 201);
    }

    public function update(Request $request, $id)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $configuracion = Configuracion::findOrFail($id);

        $request->validate([
            'dias_retencion' => 'required|integer|min:1'
        ]);

        $configuracion->dias_retencion = $request->dias_retencion;
        $configuracion->save();

        return response()->json($configuracion);
    }

    public function destroy($id)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $configuracion = Configuracion::findOrFail($id);
        $configuracion->delete();

        return response()->json(['message' => 'Configuración eliminada']);
    }
}

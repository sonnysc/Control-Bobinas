<?php
// app/Http/Controllers/ConfiguracionController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Configuracion;

class ConfiguracionController extends Controller
{
    public function index()
    {
        $configuraciones = Configuracion::all();
        return response()->json($configuraciones);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cliente' => 'required|string',
            'dias_retencion' => 'required|integer|min:1'
        ]);

        $configuracion = Configuracion::updateOrCreate(
            ['cliente' => $request->cliente],
            ['dias_retencion' => $request->dias_retencion]
        );

        return response()->json($configuracion, 201);
    }

    public function update(Request $request, $id)
    {
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
        $configuracion = Configuracion::findOrFail($id);
        $configuracion->delete();

        return response()->json(['message' => 'Configuración eliminada']);
    }
}
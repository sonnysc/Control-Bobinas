<?php
// app/Http/Controllers/InventoryController.php

namespace App\Http\Controllers;

use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    /**
     * Obtener todos los items de inventario
     */
    public function index(Request $request)
    {
        try {
            $query = Inventory::query();
            
            // ✅ Búsqueda si se proporciona
            if ($request->has('search') && $request->search != '') {
                $query->search($request->search);
            }
            
            $inventory = $query->orderBy('created_at', 'desc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $inventory,
                'count' => $inventory->count()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el inventario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buscar item por HU
     */
    public function findByHU($hu)
    {
        try {
            $item = Inventory::findByHU($hu);
            
            if ($item) {
                return response()->json([
                    'success' => true,
                    'data' => $item,
                    'message' => 'Item encontrado en el inventario'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'HU no encontrado en el inventario'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en la búsqueda: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo item en inventario
     */
    public function store(Request $request)
    {
        // ✅ Validación de datos
        $validator = Validator::make($request->all(), [
            'hu' => 'required|string|max:255|unique:inventario,hu',
            'descripcion' => 'required|string|max:1000'
        ], [
            'hu.required' => 'El número de serie (HU) es obligatorio',
            'hu.unique' => 'Este número de serie (HU) ya existe en el inventario',
            'descripcion.required' => 'La descripción es obligatoria',
            'descripcion.max' => 'La descripción no puede tener más de 1000 caracteres'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $inventory = Inventory::create([
                'hu' => $request->hu,
                'descripcion' => $request->descripcion
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $inventory,
                'message' => 'Item agregado al inventario correctamente'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar item específico
     */
    public function show($id)
    {
        try {
            $item = Inventory::find($id);
            
            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $item
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener el item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar item existente
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'hu' => 'sometimes|required|string|max:255|unique:inventario,hu,' . $id,
            'descripcion' => 'sometimes|required|string|max:1000'
        ], [
            'hu.unique' => 'Este número de serie (HU) ya existe en el inventario',
            'descripcion.required' => 'La descripción es obligatoria'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $inventory = Inventory::find($id);
            
            if (!$inventory) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item no encontrado'
                ], 404);
            }

            $inventory->update($request->all());

            return response()->json([
                'success' => true,
                'data' => $inventory,
                'message' => 'Item actualizado correctamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar item del inventario
     */
    public function destroy($id)
    {
        try {
            $inventory = Inventory::find($id);
            
            if (!$inventory) {
                return response()->json([
                    'success' => false,
                    'message' => 'Item no encontrado'
                ], 404);
            }

            $inventory->delete();

            return response()->json([
                'success' => true,
                'message' => 'Item eliminado del inventario correctamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el item: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Procesar escaneo de HU
     */
    public function processScan(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'hu' => 'required|string|max:255'
        ], [
            'hu.required' => 'El número de serie (HU) es requerido para el escaneo'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $hu = $request->hu;
            $item = Inventory::findByHU($hu);

            if ($item) {
                return response()->json([
                    'success' => true,
                    'data' => $item,
                    'action' => 'exists',
                    'message' => 'HU encontrado en el inventario'
                ]);
            }

            return response()->json([
                'success' => true,
                'action' => 'new',
                'hu' => $hu,
                'message' => 'Nuevo HU detectado, complete la información'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el escaneo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Estadísticas del inventario
     */
    public function stats()
    {
        try {
            $totalItems = Inventory::count();
            $recentItems = Inventory::where('created_at', '>=', now()->subDays(7))->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_items' => $totalItems,
                    'recent_items' => $recentItems
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas: ' . $e->getMessage()
            ], 500);
        }
    }
}
?>
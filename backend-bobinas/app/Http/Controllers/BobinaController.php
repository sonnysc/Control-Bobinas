<?php
// app/Http/Controllers/BobinaController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bobina;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;

class BobinaController extends Controller
{
    public function index(Request $request)
    {
        $query = Bobina::with('usuario');
        
        if ($request->has('search') && !empty($request->search)) {
            $query->where('hu', 'like', '%' . $request->search . '%')
                  ->orWhere('cliente', 'like', '%' . $request->search . '%');
        }
        
        if ($request->has('cliente') && !empty($request->cliente)) {
            $query->where('cliente', $request->cliente);
        }
        
        if ($request->has('fecha_inicio') && !empty($request->fecha_inicio)) {
            $query->whereDate('fecha_embarque', '>=', $request->fecha_inicio);
        }
        
        if ($request->has('fecha_fin') && !empty($request->fecha_fin)) {
            $query->whereDate('fecha_embarque', '<=', $request->fecha_fin);
        }
        
        return response()->json($query->orderBy('fecha_embarque', 'desc')->paginate(15));
    }

    public function store(Request $request)
    {
        $request->validate([
            'hu' => 'required|string|unique:bobinas,hu',
            'cliente' => 'nullable|string',
            'estado' => 'required|string|in:bueno,regular,malo',
            'foto' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120'
        ]);

        // Verificar si ya existe el HU
        $existingBobina = Bobina::where('hu', $request->hu)->first();
        if ($existingBobina) {
            return response()->json([
                'message' => 'Esta bobina ya tiene una fotografía registrada. ¿Desea reemplazarla?',
                'exists' => true
            ], 409);
        }

        // Procesar la imagen
        $imagePath = $this->storeImage($request);
        
        $bobina = Bobina::create([
            'hu' => $request->hu,
            'cliente' => $request->cliente,
            'estado' => $request->estado,
            'foto_path' => $imagePath,
            'user_id' => auth()->id()
        ]);

        return response()->json($bobina, 201);
    }

    public function update(Request $request, $id)
    {
        $bobina = Bobina::findOrFail($id);
        
        $request->validate([
            'hu' => 'required|string|unique:bobinas,hu,' . $bobina->id,
            'cliente' => 'nullable|string',
            'estado' => 'required|string|in:bueno,regular,malo',
            'foto' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:5120'
        ]);

        if ($request->hasFile('foto')) {
            // Eliminar imagen anterior
            if ($bobina->foto_path && Storage::exists($bobina->foto_path)) {
                Storage::delete($bobina->foto_path);
            }
            
            // Guardar nueva imagen
            $imagePath = $this->storeImage($request);
            $bobina->foto_path = $imagePath;
            $bobina->fecha_reemplazo = now();
        }

        $bobina->hu = $request->hu;
        $bobina->cliente = $request->cliente;
        $bobina->estado = $request->estado;
        $bobina->save();

        return response()->json($bobina);
    }

    public function show($id)
    {
        $bobina = Bobina::with('usuario')->findOrFail($id);
        return response()->json($bobina);
    }

    public function destroy($id)
    {
        $bobina = Bobina::findOrFail($id);
        
        // Eliminar imagen
        if ($bobina->foto_path && Storage::exists($bobina->foto_path)) {
            Storage::delete($bobina->foto_path);
        }
        
        $bobina->delete();
        
        return response()->json(['message' => 'Bobina eliminada']);
    }

    private function storeImage(Request $request)
    {
        $image = $request->file('foto');
        $hu = $request->hu;
        $cliente = $request->cliente ?: 'general';
        
        // Crear estructura de carpetas
        $folderPath = 'public/imagenes/' . $cliente . '/' . date('Y-m-d');
        $fileName = $hu . '.' . $image->getClientOriginalExtension();
        
        // Redimensionar y comprimir imagen
        $img = Image::make($image->getRealPath());
        $img->resize(800, null, function ($constraint) {
            $constraint->aspectRatio();
        });
        
        // Guardar imagen
        $fullPath = $folderPath . '/' . $fileName;
        Storage::put($fullPath, $img->encode());
        
        return $fullPath;
    }

    public function getClientes()
    {
        $clientes = Bobina::distinct()->pluck('cliente')->filter();
        return response()->json($clientes);
    }
}
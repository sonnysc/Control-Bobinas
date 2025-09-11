<?php
// app/Http/Controllers/BobinaController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bobina;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class BobinaController extends Controller
{
    public function index(Request $request)
    {
        $query = Bobina::with(['usuario', 'aprobador']);

        // Filtros
        if ($request->has('search') && !empty($request->search)) {
            if ($request->has('exact') && $request->exact == 'true') {
                // Búsqueda exacta por HU
                $query->where('hu', $request->search);
            } else {
                // Búsqueda parcial
                $query->where('hu', 'like', '%' . $request->search . '%')
                    ->orWhere('cliente', 'like', '%' . $request->search . '%');
            }
        }

        if ($request->has('cliente') && !empty($request->cliente)) {
            $query->where('cliente', $request->cliente);
        }

        if ($request->has('estado_aprobacion') && !empty($request->estado_aprobacion)) {
            $query->where('estado_aprobacion', $request->estado_aprobacion);
        }

        if ($request->has('fecha_inicio') && !empty($request->fecha_inicio)) {
            $query->whereDate('fecha_embarque', '>=', $request->fecha_inicio);
        }

        if ($request->has('fecha_fin') && !empty($request->fecha_fin)) {
            $query->whereDate('fecha_embarque', '<=', $request->fecha_fin);
        }

        // Para embarcadores, solo ver sus propias bobinas
        if (auth()->user()->role === 'embarcador') {
            $query->where('user_id', auth()->id());
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
                'message' => 'Esta bobina ya tiene una fotografía registrada',
                'bobina_existente' => [
                    'id' => $existingBobina->id,
                    'hu' => $existingBobina->hu,
                    'cliente' => $existingBobina->cliente,
                    'estado' => $existingBobina->estado,
                    'foto_path' => $existingBobina->foto_path,
                    'user_id' => $existingBobina->user_id,
                    'fecha_embarque' => $existingBobina->fecha_embarque
                ],
                'exists' => true
            ], 409); // 409 Conflict
        }

        // Procesar la imagen
        $imagePath = $this->storeImage($request);

        $bobina = Bobina::create([
            'hu' => $request->hu,
            'cliente' => $request->cliente,
            'estado' => $request->estado,
            'foto_path' => $imagePath,
            'user_id' => auth()->id(),
            'estado_aprobacion' => auth()->user()->role === 'admin' ? 'aprobado' : 'pendiente'
        ]);

        return response()->json($bobina, 201);
    }

    public function update(Request $request, $id)
    {
        $bobina = Bobina::findOrFail($id);

        // Verificar permisos
        if (auth()->user()->role === 'embarcador' && $bobina->user_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        if (auth()->user()->role === 'ingeniero') {
            return response()->json(['error' => 'No autorizado. Ingenieros no pueden editar bobinas.'], 403);
        }

        $request->validate([
            'hu' => 'required|string|unique:bobinas,hu,' . $bobina->id,
            'cliente' => 'nullable|string',
            'estado' => 'required|string|in:bueno,regular,malo',
            'foto' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:5120'
        ]);

        // Si es embarcador, requiere autorización de líder (nuevo flujo)
        if (auth()->user()->role === 'embarcador') {
            // Verificar si viene con autorización de líder
            if (!$request->has('autorizacion_lider') || $request->autorizacion_lider !== true) {
                return response()->json([
                    'error' => 'Se requiere autorización de líder para editar bobinas',
                    'requiere_autorizacion' => true
                ], 403);
            }
        }

        // Admin puede actualizar directamente (con o sin autorización)
        if ($request->hasFile('foto')) {
            // Eliminar imagen anterior
            if ($bobina->foto_path && Storage::disk('public')->exists($bobina->foto_path)) {
                Storage::disk('public')->delete($bobina->foto_path);
            }

            // Guardar nueva imagen
            $imagePath = $this->storeImage($request);
            $bobina->foto_path = $imagePath;
            $bobina->fecha_reemplazo = now();
        }

        $bobina->hu = $request->hu;
        $bobina->cliente = $request->cliente;
        $bobina->estado = $request->estado;
        
        // Si fue autorizado por líder, marcar como aprobado
        if ($request->has('autorizacion_lider') && $request->autorizacion_lider === true) {
            $bobina->estado_aprobacion = 'aprobado';
            $bobina->aprobado_por = auth()->id();
            $bobina->fecha_aprobacion = now();
        }

        $bobina->save();

        return response()->json($bobina);
    }

    public function show($id)
    {
        $bobina = Bobina::with(['usuario', 'aprobador'])->findOrFail($id);

        // Verificar permisos
        if (auth()->user()->role === 'embarcador' && $bobina->user_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        return response()->json($bobina);
    }

    public function destroy($id)
    {
        $bobina = Bobina::findOrFail($id);

        // Solo admin puede eliminar
        if (auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // Eliminar imagen
        if ($bobina->foto_path && Storage::disk('public')->exists($bobina->foto_path)) {
            Storage::disk('public')->delete($bobina->foto_path);
        }

        $bobina->delete();

        return response()->json(['message' => 'Bobina eliminada']);
    }

    // Método para verificar autorización de líder
    public function verificarAutorizacionLider(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string'
        ]);

        // Buscar usuario líder
        $user = \App\Models\User::where('username', $request->username)
                               ->where('role', 'lider')
                               ->first();

        if (!$user) {
            return response()->json(['error' => 'Usuario líder no encontrado'], 404);
        }

        // Verificar contraseña
        if (!\Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Contraseña incorrecta'], 401);
        }

        return response()->json([
            'autorizado' => true,
            'lider' => [
                'id' => $user->id,
                'username' => $user->username,
                'nombre' => $user->username // Puedes agregar campo nombre si lo tienes
            ]
        ]);
    }

    // Mantener métodos existentes para compatibilidad
    private function solicitarActualizacion($bobina, $request)
    {
        // Crear una nueva bobina con estado pendiente
        $nuevaBobina = $bobina->replicate();
        $nuevaBobina->hu = $request->hu;
        $nuevaBobina->cliente = $request->cliente;
        $nuevaBobina->estado = $request->estado;
        $nuevaBobina->estado_aprobacion = 'pendiente';
        $nuevaBobina->user_id = auth()->id();

        if ($request->hasFile('foto')) {
            $imagePath = $this->storeImage($request);
            $nuevaBobina->foto_path = $imagePath;
        }

        $nuevaBobina->save();

        return response()->json([
            'message' => 'Solicitud de actualización enviada. Esperando aprobación del administrador.',
            'bobina' => $nuevaBobina
        ], 202);
    }

    public function aprobarActualizacion($id)
    {
        $bobina = Bobina::findOrFail($id);

        if ($bobina->estado_aprobacion !== 'pendiente') {
            return response()->json(['error' => 'La bobina no está pendiente de aprobación'], 400);
        }

        $bobina->estado_aprobacion = 'aprobado';
        $bobina->aprobado_por = auth()->id();
        $bobina->fecha_aprobacion = now();
        $bobina->save();

        return response()->json(['message' => 'Bobina aprobada', 'bobina' => $bobina]);
    }

    public function rechazarActualizacion($id, Request $request)
    {
        $bobina = Bobina::findOrFail($id);

        if ($bobina->estado_aprobacion !== 'pendiente') {
            return response()->json(['error' => 'La bobina no está pendiente de aprobación'], 400);
        }

        $bobina->estado_aprobacion = 'rechazado';
        $bobina->aprobado_por = auth()->id();
        $bobina->fecha_aprobacion = now();
        $bobina->comentarios_aprobacion = $request->comentarios;
        $bobina->save();

        return response()->json(['message' => 'Bobina rechazada', 'bobina' => $bobina]);
    }

    public function getSolicitudesPendientes()
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $solicitudes = Bobina::with('usuario')
            ->where('estado_aprobacion', 'pendiente')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($solicitudes);
    }

    private function storeImage(Request $request)
    {
        $image = $request->file('foto');
        $hu = $request->hu;
        $cliente = $request->cliente ?: 'general';

        // Crear estructura de carpetas en el disco public
        $folderPath = 'imagenes/' . $cliente . '/' . date('Y-m-d');
        $fileName = $hu . '.' . $image->getClientOriginalExtension();

        // Crear manager de Intervention Image
        $manager = new ImageManager(new Driver());

        // Leer y redimensionar imagen
        $img = $manager->read($image->getRealPath());
        $img->scale(width: 800);

        // Guardar imagen en el disco public (storage/app/public)
        $fullPath = $folderPath . '/' . $fileName;

        // Usar Storage para guardar en el disco public
        Storage::disk('public')->put($fullPath, $img->encode());

        // Retornar la ruta relativa (sin 'public/')
        return $fullPath;
    }

    public function getClientes()
    {
        $clientes = Bobina::distinct()->pluck('cliente')->filter();
        return response()->json($clientes);
    }
}
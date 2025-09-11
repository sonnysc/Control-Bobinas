<?php
// app/Http/Controllers/BobinaController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bobina;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Carbon\Carbon;

class BobinaController extends Controller
{
    // Listado de bobinas con filtros y días restantes

    public function index(Request $request)
    {
        $configuraciones = \App\Models\Configuracion::all()->keyBy('cliente');
        $diasRetencionDefault = 90;

        $query = Bobina::with(['usuario', 'aprobador', 'reemplazador']);

        // Filtros (mantener igual)
        if ($request->filled('search')) {
            if ($request->boolean('exact')) {
                $query->where('hu', $request->search);
            } else {
                $query->where('hu', 'like', '%' . $request->search . '%')
                    ->orWhere('cliente', 'like', '%' . $request->search . '%');
            }
        }

        if ($request->filled('cliente')) {
            $query->where('cliente', $request->cliente);
        }

        if ($request->filled('estado_aprobacion')) {
            $query->where('estado_aprobacion', $request->estado_aprobacion);
        }

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha_embarque', '>=', $request->fecha_inicio);
        }

        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha_embarque', '<=', $request->fecha_fin);
        }

        // Solo ver sus propias bobinas para embarcadores
        if (auth()->user()->role === 'embarcador') {
            $query->where('user_id', auth()->id());
        }

        $bobinasPag = $query->orderBy('fecha_embarque', 'desc')->paginate(15);

        $bobinasPag->getCollection()->transform(function ($bobina) use ($configuraciones, $diasRetencionDefault) {
            // Días restantes - CÁLCULO CORREGIDO
            $diasRetencion = $configuraciones[$bobina->cliente]->dias_retencion ?? $diasRetencionDefault;
            $fechaBase = $bobina->fecha_reemplazo ?? $bobina->fecha_embarque;

            if ($fechaBase) {
                $fechaLimite = $fechaBase->copy()->addDays($diasRetencion);
                $bobina->dias_restantes = max(0, now()->diffInDays($fechaLimite, false));
            } else {
                $bobina->dias_restantes = $diasRetencion;
            }

            return $bobina;
        });

        return response()->json($bobinasPag);
    }

    // Crear bobina
    public function store(Request $request)
    {
        $request->validate([
            'hu' => 'required|string',
            'cliente' => 'nullable|string',
            'foto' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120'
        ]);

        // Verificar si ya existe el HU
        $existingBobina = Bobina::where('hu', $request->hu)->first();

        if ($existingBobina) {
            if (!$request->has('lider_username') || !$request->has('lider_password')) {
                return response()->json([
                    'message' => 'Esta bobina ya tiene una fotografía registrada. Se requiere autorización de líder.',
                    'exists' => true,
                    'bobina_existente' => $existingBobina
                ], 409);
            }

            $lider = \App\Models\User::where('username', $request->lider_username)
                ->where('role', 'lider')
                ->first();

            if (!$lider || !\Hash::check($request->lider_password, $lider->password)) {
                return response()->json(['error' => 'Credenciales de líder inválidas'], 401);
            }

            if ($existingBobina->foto_path && Storage::disk('public')->exists($existingBobina->foto_path)) {
                Storage::disk('public')->delete($existingBobina->foto_path);
            }

            $imagePath = $this->storeImage($request);

            $existingBobina->update([
                'cliente' => $request->cliente,
                'foto_path' => $imagePath,
                'aprobado_por' => $lider->id,
                'aprobado_por_nombre' => $lider->username,
                'reemplazado_por' => auth()->id(),
                'reemplazado_por_nombre' => auth()->user()->username,
                'fecha_aprobacion' => now(),
                'fecha_reemplazo' => now(),
                'estado_aprobacion' => 'aprobado'
            ]);

            return response()->json([
                'message' => 'Bobina reemplazada con autorización del líder',
                'bobina' => $existingBobina
            ], 200);
        }

        $imagePath = $this->storeImage($request);

        $bobina = Bobina::create([
            'hu' => $request->hu,
            'cliente' => $request->cliente,
            'foto_path' => $imagePath,
            'user_id' => auth()->id(),
            'registrado_por_nombre' => auth()->user()->username,
            'estado_aprobacion' => auth()->user()->role === 'admin' ? 'aprobado' : 'pendiente',
            'fecha_embarque' => now(),
            'fecha_reemplazo' => null
        ]);

        return response()->json($bobina, 201);
    }

    // Mostrar bobina
    public function show($id)
    {
        $bobina = Bobina::with(['usuario', 'aprobador', 'reemplazador'])->findOrFail($id);

        if (auth()->user()->role === 'embarcador' && $bobina->user_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        // Días restantes - CÁLCULO CORREGIDO
        $diasRetencionDefault = 90;
        $diasRetencion = $configuraciones[$bobina->cliente]->dias_retencion ?? $diasRetencionDefault;
        $fechaBase = $bobina->fecha_reemplazo ?? $bobina->fecha_embarque;

        if ($fechaBase) {
            $fechaLimite = $fechaBase->copy()->addDays($diasRetencion);
            $diasRestantes = now()->diffInHours($fechaLimite, false) / 24; // Convertir horas a días
            $bobina->dias_restantes = max(0, round($diasRestantes)); // Redondear a entero
        } else {
            $bobina->dias_restantes = $diasRetencion;
        }

        return response()->json($bobina);
    }

    // Actualizar bobina
    public function update(Request $request, $id)
    {
        $bobina = Bobina::findOrFail($id);

        // Verificar permisos
        if (auth()->user()->role === 'embarcador' && $bobina->user_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $request->validate([
            'hu' => 'required|string|unique:bobinas,hu,' . $bobina->id,
            'cliente' => 'nullable|string',
            'foto' => 'sometimes|image|mimes:jpeg,png,jpg,gif|max:5120'
        ]);

        $autorizacionLider = filter_var($request->input('autorizacion_lider'), FILTER_VALIDATE_BOOLEAN);

        if ($request->hasFile('foto')) {
            if ($bobina->foto_path && Storage::disk('public')->exists($bobina->foto_path)) {
                Storage::disk('public')->delete($bobina->foto_path);
            }
            $imagePath = $this->storeImage($request);
            $bobina->foto_path = $imagePath;

            if ($autorizacionLider) {
                $bobina->reemplazado_por = auth()->id();
                $bobina->reemplazado_por_nombre = auth()->user()->username;
                $bobina->fecha_reemplazo = now();
            }
        }

        $bobina->hu = $request->hu;
        $bobina->cliente = $request->cliente;

        if ($autorizacionLider) {
            $lider = \App\Models\User::find($request->input('lider_id'));
            $bobina->estado_aprobacion = 'aprobado';
            $bobina->aprobado_por = $lider->id ?? null;
            $bobina->aprobado_por_nombre = $lider->username ?? 'Desconocido';
            $bobina->fecha_aprobacion = now();
        }

        $bobina->save();

        return response()->json($bobina);
    }

    // Eliminar bobina
    public function destroy($id)
    {
        $bobina = Bobina::findOrFail($id);

        if (auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        if ($bobina->foto_path && Storage::disk('public')->exists($bobina->foto_path)) {
            Storage::disk('public')->delete($bobina->foto_path);
        }

        $bobina->delete();

        return response()->json(['message' => 'Bobina eliminada']);
    }

    // Obtener clientes únicos
    public function getClientes()
    {
        $clientes = Bobina::distinct()->pluck('cliente')->filter();
        return response()->json($clientes);
    }

    // Verificar autorización líder
    public function verificarAutorizacionLider(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string'
        ]);

        $user = \App\Models\User::where('username', $request->username)
            ->where('role', 'lider')
            ->first();

        if (!$user) return response()->json(['error' => 'Usuario líder no encontrado'], 404);
        if (!\Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Contraseña incorrecta'], 401);
        }

        return response()->json([
            'autorizado' => true,
            'lider' => [
                'id' => $user->id,
                'username' => $user->username,
                'nombre' => $user->username
            ]
        ]);
    }

    // Función para almacenar imagen
    private function storeImage(Request $request)
    {
        $image = $request->file('foto');
        $hu = $request->hu;
        $cliente = $request->cliente ?: 'general';
        $folderPath = 'imagenes/' . $cliente . '/' . date('Y-m-d');
        $fileName = $hu . '.' . $image->getClientOriginalExtension();

        $manager = new ImageManager(new Driver());
        $img = $manager->read($image->getRealPath());
        $img->scale(width: 800);

        $fullPath = $folderPath . '/' . $fileName;
        Storage::disk('public')->put($fullPath, $img->encode());

        return $fullPath;
    }
}

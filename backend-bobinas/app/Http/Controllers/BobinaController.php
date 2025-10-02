<?php

//src/Http/Controllers/BobinaController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bobina;
use App\Models\Configuracion;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Carbon\Carbon;

class BobinaController extends Controller
{
    // Listado de bobinas con filtros y días restantes
    public function index(Request $request)
    {
        $query = Bobina::with(['usuario', 'aprobador', 'reemplazador']);

        // Filtros
        if ($request->filled('search')) {
            $exact = $request->input('exact', false);

            if (filter_var($exact, FILTER_VALIDATE_BOOLEAN)) {
                $query->where('hu', $request->search);
            } else {
                $query->where(function ($q) use ($request) {
                    $q->where('hu', 'like', '%' . $request->search . '%')
                        ->orWhere('cliente', 'like', '%' . $request->search . '%');
                });
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

        $bobinas = $query->orderBy('fecha_embarque', 'desc')->paginate(15);

        // Calcular días restantes para cada bobina
        $bobinas->getCollection()->transform(function ($bobina) {
            $bobina = $this->calcularDiasRestantes($bobina);
            return $bobina;
        });

        return response()->json($bobinas);
    }

    // Crear bobina
    public function store(Request $request)
    {
        \Log::info('Iniciando store method', ['hu' => $request->hu, 'user' => auth()->user()->username]);

        $request->validate([
            'hu' => 'required|string|size:9',
            'cliente' => 'nullable|string|max:255',
            'foto' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120'
        ]);

        try {
            // Verificar si ya existe el HU
            $existingBobina = Bobina::where('hu', $request->hu)->first();

            if ($existingBobina) {
                \Log::info('Bobina existente encontrada', ['hu' => $request->hu, 'existing_id' => $existingBobina->id]);

                if (!$request->has('lider_username') || !$request->has('lider_password')) {
                    return response()->json([
                        'message' => 'Esta bobina ya tiene una fotografía registrada. Se requiere autorización de líder.',
                        'exists' => true,
                        'bobina_existente' => $existingBobina
                    ], 409);
                }

                \Log::info('Verificando credenciales de líder', ['lider_username' => $request->lider_username]);

                $lider = \App\Models\User::where('username', $request->lider_username)
                    ->where('role', 'lider')
                    ->first();

                if (!$lider) {
                    \Log::warning('Líder no encontrado', ['username' => $request->lider_username]);
                    return response()->json(['error' => 'Usuario líder no encontrado'], 401);
                }

                if (!\Hash::check($request->lider_password, $lider->password)) {
                    \Log::warning('Contraseña de líder incorrecta', ['username' => $request->lider_username]);
                    return response()->json(['error' => 'Contraseña de líder incorrecta'], 401);
                }

                \Log::info('Líder autorizado', ['lider_id' => $lider->id]);

                // Eliminar foto anterior si existe
                if ($existingBobina->foto_path && Storage::disk('public')->exists($existingBobina->foto_path)) {
                    \Log::info('Eliminando foto anterior', ['foto_path' => $existingBobina->foto_path]);
                    Storage::disk('public')->delete($existingBobina->foto_path);
                }

                \Log::info('Almacenando nueva imagen');
                $imagePath = $this->storeImage($request);

                \Log::info('Actualizando bobina existente', [
                    'bobina_id' => $existingBobina->id,
                    'nueva_ruta' => $imagePath
                ]);

                // SOLO LAS COLUMNAS NECESARIAS
                $existingBobina->update([
                    'cliente' => $request->cliente,
                    'foto_path' => $imagePath,
                    'aprobado_por' => $lider->id,           // Para "Aprobado por: lider"
                    'reemplazado_por' => auth()->id(),      // Para "Reemplazado por: embarcador"
                    'fecha_aprobacion' => now(),
                    'fecha_reemplazo' => now(),
                    'estado_aprobacion' => 'aprobado'
                ]);

                $existingBobina->load(['usuario', 'aprobador', 'reemplazador']);
                $existingBobina = $this->calcularDiasRestantes($existingBobina);

                \Log::info('Bobina reemplazada exitosamente', ['bobina_id' => $existingBobina->id]);

                return response()->json([
                    'message' => 'Bobina reemplazada con autorización del líder',
                    'bobina' => $existingBobina
                ], 200);
            }

            // CREACIÓN NORMAL (cuando no existe la bobina)
            $imagePath = $this->storeImage($request);

            $bobina = Bobina::create([
                'hu' => $request->hu,
                'cliente' => $request->cliente,
                'foto_path' => $imagePath,
                'user_id' => auth()->id(),
                'fecha_embarque' => now(),
                'estado_aprobacion' => auth()->user()->role === 'admin' ? 'aprobado' : 'pendiente'
            ]);

            $bobina->load(['usuario', 'aprobador', 'reemplazador']);
            $bobina = $this->calcularDiasRestantes($bobina);

            return response()->json($bobina, 201);
        } catch (\Exception $e) {
            \Log::error('Error en store method: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'hu' => $request->hu,
                'user' => auth()->user()->username
            ]);
            return response()->json([
                'error' => 'Error interno del servidor: ' . $e->getMessage()
            ], 500);
        }
    }

    // Mostrar bobina
    public function show($id)
    {
        $bobina = Bobina::with(['usuario', 'aprobador', 'reemplazador'])->findOrFail($id);

        if (auth()->user()->role === 'embarcador' && $bobina->user_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $bobina = $this->calcularDiasRestantes($bobina);

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
            'hu' => 'required|string|size:9|unique:bobinas,hu,' . $bobina->id,
            'cliente' => 'nullable|string|max:255',
            'foto' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:5120'
        ]);

        $autorizacionLider = filter_var($request->input('autorizacion_lider', false), FILTER_VALIDATE_BOOLEAN);

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

        if ($autorizacionLider && $request->filled('lider_id')) {
            $lider = \App\Models\User::find($request->input('lider_id'));
            if ($lider && $lider->role === 'lider') {
                $bobina->estado_aprobacion = 'aprobado';
                $bobina->aprobado_por = $lider->id;
                $bobina->aprobado_por_nombre = $lider->username;
                $bobina->fecha_aprobacion = now();
            }
        }

        $bobina->save();
        $bobina->load(['usuario', 'aprobador', 'reemplazador']);
        $bobina = $this->calcularDiasRestantes($bobina);

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
        $clientes = Bobina::whereNotNull('cliente')
            ->where('cliente', '!=', '')
            ->distinct()
            ->pluck('cliente')
            ->values();

        return response()->json($clientes);
    }

    // Verificar autorización líder
    public function verificarAutorizacionLider(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string'
        ]);

        try {
            $user = \App\Models\User::where('username', $request->username)
                ->where('role', 'lider')
                ->first();

            if (!$user) {
                return response()->json(['error' => 'Usuario líder no encontrado'], 404);
            }

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
        } catch (\Exception $e) {
            \Log::error('Error en verificación de líder: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    // Función para almacenar imagen
    private function storeImage(Request $request)
    {
        $image = $request->file('foto');
        $hu = $request->hu;
        $cliente = $request->cliente ?: 'general';

        // Limpiar nombre del cliente para usar en el path
        $clienteFolder = preg_replace('/[^a-zA-Z0-9]/', '_', $cliente);
        $folderPath = 'imagenes/' . $clienteFolder . '/' . date('Y-m-d');
        $fileName = $hu . '_' . time() . '.' . $image->getClientOriginalExtension();

        $manager = new ImageManager(new Driver());
        $img = $manager->read($image->getRealPath());

        $img->scale(width: 800);

        $fullPath = $folderPath . '/' . $fileName;
        Storage::disk('public')->put($fullPath, $img->encode());

        return $fullPath;
    }

    // Función para calcular días restantes
    private function calcularDiasRestantes($bobina)
    {
        $diasRetencionDefault = 90;
        $configuraciones = Configuracion::all()->keyBy('cliente');
        $diasRetencion = $configuraciones[$bobina->cliente]->dias_retencion ?? $diasRetencionDefault;

        // Usar fecha_reemplazo si existe, sino fecha_embarque
        $fechaBase = $bobina->fecha_reemplazo ?? $bobina->fecha_embarque;

        if ($fechaBase) {
            $fechaLimite = Carbon::parse($fechaBase)->addDays($diasRetencion);
            $diasRestantes = now()->diffInDays($fechaLimite, false);
            $bobina->dias_restantes = max(0, $diasRestantes);
        } else {
            $bobina->dias_restantes = $diasRetencion;
        }

        return $bobina;
    }
}

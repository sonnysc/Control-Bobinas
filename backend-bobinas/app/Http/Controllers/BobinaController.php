<?php
// app/Http/Controllers/BobinaController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Bobina;
use App\Models\Configuracion;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BobinaController extends Controller
{
    // Archivo donde guardaremos los clientes ocultos (lista negra de sugerencias)
    private $hiddenClientsFile = 'hidden_clients.json';

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

        // Ordenamiento
        $order = 'desc';
        $orderBy = 'fecha_embarque';

        if ($request->filled('orden_dias')) {
            // Si hay filtro de días, el orden lo manejamos después o ajustamos aquí si es posible
            // Por ahora mantenemos el orden por fecha, el frontend puede reordenar visualmente
            // o implementamos lógica avanzada de ordenamiento aquí
        }

        $bobinas = $query->orderBy($orderBy, $order)->paginate(15);

        // Optimización: Cargar configuraciones una sola vez
        $configuraciones = Configuracion::all()->keyBy('cliente');

        // Calcular días restantes para cada bobina pasando las configuraciones
        $bobinas->getCollection()->transform(function ($bobina) use ($configuraciones) {
            return $this->calcularDiasRestantes($bobina, $configuraciones);
        });

        return response()->json($bobinas);
    }

    // Crear bobina
    public function store(Request $request)
    {
        Log::info('Iniciando store method', ['hu' => $request->hu, 'user' => auth()->user()->username]);

        $request->validate([
            'hu' => 'required|string|size:9',
            'cliente' => 'nullable|string|max:255',
            'foto' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120'
        ]);

        try {
            // ✅ Lógica: Si se usa un cliente, restaurarlo a las sugerencias si estaba oculto
            if ($request->filled('cliente')) {
                $this->restoreHiddenClient($request->cliente);
            }

            // Verificar si ya existe el HU
            $existingBobina = Bobina::where('hu', $request->hu)->first();

            if ($existingBobina) {
                // ... (Lógica de reemplazo existente) ...
                Log::info('Bobina existente encontrada', ['hu' => $request->hu, 'existing_id' => $existingBobina->id]);

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
                    return response()->json(['error' => 'Credenciales de líder incorrectas'], 401);
                }

                // Eliminar foto anterior ANTES de almacenar la nueva
                $fotoPathAnterior = $existingBobina->foto_path;
                $imagePath = $this->storeImage($request);

                if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                    if ($fotoPathAnterior && Storage::disk('public')->exists($fotoPathAnterior)) {
                        Storage::disk('public')->delete($fotoPathAnterior);
                        $this->eliminarCarpetasVaciasIndividual($fotoPathAnterior);
                    }
                } else {
                    return response()->json(['error' => 'Error al almacenar la nueva imagen'], 500);
                }

                // Actualizar la bobina existente
                $existingBobina->update([
                    'cliente' => trim($request->cliente), // ✅ Guardamos tal cual se ingresó
                    'foto_path' => $imagePath,
                    'aprobado_por' => $lider->id,
                    'reemplazado_por' => auth()->id(),
                    'fecha_aprobacion' => now(),
                    'fecha_reemplazo' => now(),
                ]);

                $existingBobina->load(['usuario', 'aprobador', 'reemplazador']);
                $existingBobina = $this->calcularDiasRestantes($existingBobina);

                return response()->json([
                    'message' => 'Bobina reemplazada con autorización del líder',
                    'bobina' => $existingBobina
                ], 200);
            }

            // CREACIÓN NORMAL (cuando no existe la bobina)
            $imagePath = $this->storeImage($request);

            $bobina = Bobina::create([
                'hu' => $request->hu,
                'cliente' => trim($request->cliente), // ✅ Guardamos tal cual se ingresó
                'foto_path' => $imagePath,
                'user_id' => auth()->id(),
                'fecha_embarque' => now(),
            ]);

            $bobina->load(['usuario', 'aprobador', 'reemplazador']);
            $bobina = $this->calcularDiasRestantes($bobina);

            return response()->json($bobina, 201);
        } catch (\Exception $e) {
            Log::error('Error en store method: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error interno del servidor: ' . $e->getMessage()
            ], 500);
        }
    }

    // Actualizar bobina
    public function update(Request $request, $id)
    {
        $bobina = Bobina::findOrFail($id);

        if (auth()->user()->role === 'embarcador' && $bobina->user_id !== auth()->id()) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $request->validate([
            'hu' => 'required|string|size:9|unique:bobinas,hu,' . $bobina->id,
            'cliente' => 'nullable|string|max:255',
            'foto' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:5120'
        ]);

        // ✅ Lógica: Restaurar cliente si se usa en update
        if ($request->filled('cliente')) {
            $this->restoreHiddenClient($request->cliente);
        }

        $autorizacionLider = filter_var($request->input('autorizacion_lider', false), FILTER_VALIDATE_BOOLEAN);

        if ($request->hasFile('foto')) {
            $nuevaImagePath = $this->storeImage($request);

            if ($nuevaImagePath && Storage::disk('public')->exists($nuevaImagePath)) {
                if ($bobina->foto_path && Storage::disk('public')->exists($bobina->foto_path)) {
                    Storage::disk('public')->delete($bobina->foto_path);
                    $this->eliminarCarpetasVaciasIndividual($bobina->foto_path);
                }
                $bobina->foto_path = $nuevaImagePath;

                if ($autorizacionLider) {
                    $bobina->reemplazado_por = auth()->id();
                    $bobina->fecha_reemplazo = now();
                }
            } else {
                return response()->json(['error' => 'Error al almacenar la nueva imagen'], 500);
            }
        }

        $bobina->hu = $request->hu;
        $bobina->cliente = trim($request->cliente); // ✅ Guardamos tal cual se ingresó

        if ($autorizacionLider && $request->filled('lider_id')) {
            $lider = \App\Models\User::find($request->input('lider_id'));
            if ($lider && $lider->role === 'lider') {
                $bobina->aprobado_por = $lider->id;
                $bobina->fecha_aprobacion = now();
            }
        }

        $bobina->save();
        $bobina->load(['usuario', 'aprobador', 'reemplazador']);
        $bobina = $this->calcularDiasRestantes($bobina);

        return response()->json($bobina);
    }

    // ✅ MÉTODO CORREGIDO: Para filtros - mostrar TODAS las variantes únicas
    public function getClientes(Request $request)
    {
        // Verificar si se solicitan clientes ocultos (para filtros)
        if ($request->has('include_hidden') && filter_var($request->input('include_hidden'), FILTER_VALIDATE_BOOLEAN)) {
            // ✅ PARA FILTROS: Mostrar TODAS las variantes de clientes (case-sensitive)
            $todosLosClientes = Bobina::whereNotNull('cliente')
                ->where('cliente', '!=', '')
                ->select('cliente')
                ->distinct() // Usar DISTINCT en SQL para obtener valores únicos
                ->orderBy('cliente', 'asc') // Ordenar alfabéticamente
                ->pluck('cliente');

            return response()->json($todosLosClientes);
        }

        // ✅ PARA SUGERENCIAS: Mantener la lógica original con prioridad a versiones recientes
        // 1. Obtener todos los nombres de clientes ordenados por ID descendente (más recientes primero)
        $todosLosClientes = Bobina::whereNotNull('cliente')
            ->where('cliente', '!=', '')
            ->orderBy('id', 'desc') // Prioridad al último registrado
            ->pluck('cliente');

        // 2. Filtrar únicos en PHP (case-insensitive) manteniendo el primero que encontramos (el más reciente)
        $clientesUnicos = [];
        foreach ($todosLosClientes as $cliente) {
            $clienteTrim = trim($cliente);
            $clienteLower = mb_strtolower($clienteTrim, 'UTF-8');

            // Si no hemos visto esta versión del nombre (en minúsculas), la guardamos
            // Como venimos ordenados por ID desc, guardamos la versión MÁS NUEVA
            if (!isset($clientesUnicos[$clienteLower])) {
                $clientesUnicos[$clienteLower] = $clienteTrim;
            }
        }

        $clientesDB = array_values($clientesUnicos);

        // 3. Obtener lista de clientes ocultos del archivo JSON
        $hiddenClients = $this->getHiddenClientsList();

        // 4. Filtrar: Quitar los ocultos de la lista
        // Usamos una comparación insensible a mayúsculas
        $hiddenClientsLower = array_map(function ($val) {
            return mb_strtolower(trim($val), 'UTF-8');
        }, $hiddenClients);

        $clientesFiltrados = array_filter($clientesDB, function ($cliente) use ($hiddenClientsLower) {
            return !in_array(mb_strtolower(trim($cliente), 'UTF-8'), $hiddenClientsLower);
        });

        sort($clientesFiltrados); // Ordenar alfabéticamente

        return response()->json(array_values($clientesFiltrados));
    }

    // ✅ MÉTODO ESPECÍFICO PARA FILTROS: Todas las variantes case-sensitive
    public function getClientesFiltros(Request $request)
    {
        // Para filtros, necesitamos TODAS las variantes exactas que existen
        $clientes = Bobina::whereNotNull('cliente')
            ->where('cliente', '!=', '')
            ->select('cliente')
            ->distinct() // DISTINCT en SQL para valores únicos exactos
            ->orderBy('cliente', 'asc') // Orden alfabético
            ->pluck('cliente');

        // Opcional: Añadir parámetros para paginación si hay muchos
        if ($request->has('limit')) {
            $clientes = $clientes->take($request->input('limit', 1000));
        }

        return response()->json($clientes);
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
            Log::error('Error en verificación de líder: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    // Renombrar cliente (Solo Admin)
    public function updateClientName(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $request->validate([
            'current_name' => 'required|string',
            'new_name' => 'required|string|min:1'
        ]);

        $currentName = $request->current_name;
        $newName = $request->new_name;

        try {
            DB::beginTransaction();

            $bobinasUpdated = Bobina::where('cliente', $currentName)
                ->update(['cliente' => $newName]);

            $configUpdated = Configuracion::where('cliente', $currentName)
                ->update(['cliente' => $newName]);

            DB::commit();

            return response()->json([
                'message' => 'Nombre de cliente actualizado correctamente',
                'bobinas_updated' => $bobinasUpdated,
                'config_updated' => $configUpdated
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al renombrar cliente: ' . $e->getMessage());
            return response()->json(['error' => 'Error al actualizar el nombre del cliente'], 500);
        }
    }

    // Eliminar cliente de SUGERENCIAS (Ocultar)
    public function deleteClient(Request $request)
    {
        if (!in_array(auth()->user()->role, ['admin', 'embarcador'])) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $request->validate([
            'client_name' => 'required|string'
        ]);

        $clientName = $request->client_name;

        try {
            $this->addHiddenClient($clientName);

            return response()->json([
                'message' => 'Cliente eliminado de las sugerencias correctamente',
                'status' => 'hidden'
            ]);
        } catch (\Exception $e) {
            Log::error('Error al ocultar cliente: ' . $e->getMessage());
            return response()->json(['error' => 'Error al eliminar el cliente de sugerencias'], 500);
        }
    }

    // Eliminar bobina
    public function destroy($id)
    {
        $bobina = Bobina::findOrFail($id);

        if (auth()->user()->role !== 'admin') {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        Log::info('Eliminando bobina', [
            'bobina_id' => $bobina->id,
            'hu' => $bobina->hu,
            'foto_path' => $bobina->foto_path
        ]);

        $fotoPath = $bobina->foto_path;

        if ($fotoPath && Storage::disk('public')->exists($fotoPath)) {
            Log::info('Eliminando archivo físico', ['ruta' => $fotoPath]);
            Storage::disk('public')->delete($fotoPath);
            $this->eliminarCarpetasVaciasIndividual($fotoPath);
        } else {
            Log::warning('Archivo físico no encontrado', ['ruta' => $fotoPath]);
        }

        $bobina->delete();

        Log::info('Bobina eliminada exitosamente', ['bobina_id' => $id]);

        return response()->json(['message' => 'Bobina eliminada']);
    }

    // Función para almacenar imagen
    private function storeImage(Request $request)
    {
        try {
            $image = $request->file('foto');
            $hu = $request->hu;
            $cliente = $request->cliente ?: 'general';

            $clienteFolder = preg_replace('/[^a-zA-Z0-9]/', '_', $cliente);
            $folderPath = 'imagenes/' . $clienteFolder . '/' . date('Y-m-d');
            $fileName = $hu . '_' . time() . '.' . $image->getClientOriginalExtension();

            $manager = new ImageManager(new Driver());
            $img = $manager->read($image->getRealPath());

            $img->scale(width: 800);

            $fullPath = $folderPath . '/' . $fileName;

            $stored = Storage::disk('public')->put($fullPath, $img->encode());

            if (!$stored) {
                Log::error('Error al almacenar imagen en disco', ['ruta' => $fullPath]);
                throw new \Exception('No se pudo almacenar la imagen en el servidor');
            }

            Log::info('Imagen almacenada exitosamente', ['ruta' => $fullPath]);
            return $fullPath;
        } catch (\Exception $e) {
            Log::error('Error en storeImage: ' . $e->getMessage());
            throw $e;
        }
    }

    private function calcularDiasRestantes($bobina, $configuraciones = null)
    {
        $diasRetencionDefault = 90;

        if ($configuraciones === null) {
            $configuraciones = Configuracion::all()->keyBy('cliente');
        }

        $config = $configuraciones->get($bobina->cliente);
        $diasRetencion = $config ? $config->dias_retencion : $diasRetencionDefault;

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

    private function eliminarCarpetasVaciasIndividual(string $filePath): void
    {
        try {
            $directorios = explode('/', dirname($filePath));
            $currentPath = '';

            foreach ($directorios as $dir) {
                $currentPath = $currentPath ? $currentPath . '/' . $dir : $dir;

                if ($currentPath !== 'imagenes' && $this->esCarpetaVacia($currentPath)) {
                    Storage::disk('public')->deleteDirectory($currentPath);
                    Log::info("Carpeta vacía eliminada individualmente: {$currentPath}");
                }
            }
        } catch (\Exception $e) {
            Log::error("Error al eliminar carpetas vacías individual: " . $e->getMessage());
        }
    }

    private function esCarpetaVacia(string $carpeta): bool
    {
        if (!Storage::disk('public')->exists($carpeta)) {
            return false;
        }

        $archivos = Storage::disk('public')->files($carpeta);
        $subcarpetas = Storage::disk('public')->directories($carpeta);

        return empty($archivos) && empty($subcarpetas);
    }

    // --- MÉTODOS PRIVADOS AUXILIARES PARA GESTIÓN DE CLIENTES OCULTOS ---

    private function getHiddenClientsList()
    {
        if (!Storage::disk('local')->exists($this->hiddenClientsFile)) {
            return [];
        }

        $content = Storage::disk('local')->get($this->hiddenClientsFile);
        return json_decode($content, true) ?? [];
    }

    private function addHiddenClient($name)
    {
        $hidden = $this->getHiddenClientsList();

        if (!in_array($name, $hidden)) {
            $hidden[] = $name;
            Storage::disk('local')->put($this->hiddenClientsFile, json_encode($hidden));
        }
    }

    // ✅ MÉTODO CORREGIDO: Solo restaura el cliente al JSON, NO actualiza la BD
    private function restoreHiddenClient($name)
    {
        $hidden = $this->getHiddenClientsList();
        $targetName = mb_strtolower(trim($name), 'UTF-8');
        $originalCount = count($hidden);

        // Filtramos eliminando cualquier coincidencia sin importar mayúsculas
        $newHidden = array_filter($hidden, function ($item) use ($targetName) {
            return mb_strtolower(trim($item), 'UTF-8') !== $targetName;
        });

        // Solo si hubo cambios (se eliminó de la lista negra)
        if (count($newHidden) !== $originalCount) {
            // Guardar JSON actualizado
            $newHidden = array_values($newHidden);
            Storage::disk('local')->put($this->hiddenClientsFile, json_encode($newHidden));
            Log::info("Cliente restaurado a sugerencias (JSON) automáticamente: $name");

            // ❌ SE MANTIENE ELIMINADA LA ACTUALIZACIÓN MASIVA DE HISTÓRICOS ❌
        }
    }
}

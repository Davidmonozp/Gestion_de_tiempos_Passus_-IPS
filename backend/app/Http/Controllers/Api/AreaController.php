<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Actividad;
use App\Models\Area;
use Illuminate\Http\Request;

class AreaController extends Controller
{
    public function verAreas()
    {
        try {

            $areas = Area::where('activa', 1)
                ->select('id', 'nombre', 'color')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $areas
            ], 200);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las áreas',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

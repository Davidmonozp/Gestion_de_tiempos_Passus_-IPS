<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Area;
use Illuminate\Support\Facades\DB;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        // Desactivamos llaves foráneas temporalmente para poder forzar los IDs
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Area::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $areas = [
            ['id' => 1, 'nombre' => 'Bienestar'],
            ['id' => 2, 'nombre' => 'Administrativa'],
            ['id' => 3, 'nombre' => 'Financiera'],
            ['id' => 4, 'nombre' => 'Automatización Y Desarrollo Tecnológico'],
            ['id' => 5, 'nombre' => 'Calidad Y Mejoramiento Continuo'],
            ['id' => 7, 'nombre' => 'Prestación De Servicio'],
            ['id' => 8, 'nombre' => 'Prestación De Servicio - Aseguramiento Misional'],
            ['id' => 10, 'nombre' => 'Gestión Del Riesgo - Operaciones Misionales'],
            ['id' => 12, 'nombre' => 'Gestión Del Riesgo - Atención Al Usuario'],
            ['id' => 13, 'nombre' => 'Gestión Del Riesgo - Agendamiento'],
            ['id' => 16, 'nombre' => 'Gestión Del Riesgo - Supervisores'],
            ['id' => 18, 'nombre' => 'Administrativa - Servicios Y Compras'],
            ['id' => 19, 'nombre' => 'Administrativa - Infraestructura'],
            ['id' => 20, 'nombre' => 'Administrativa - Oficios Varios'],
            ['id' => 21, 'nombre' => 'Financiera - Contabilidad'],
            ['id' => 24, 'nombre' => 'Prestación De Servicio - Analista De Modelo'],
            ['id' => 25, 'nombre' => 'Prestación De Servicio - Gestores'],
            ['id' => 26, 'nombre' => 'Prestación De Servicio - Enfermeria'],
            ['id' => 27, 'nombre' => 'Prestación De Servicio - Terapeutico'],
            ['id' => 28, 'nombre' => 'Prestación De Servicio - Apoyo Básico'],
            ['id' => 29, 'nombre' => 'Calidad Y Gestion Documental'],
        ];

        // Paleta de colores para que no todas sean azules
        $colores = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22'];

        foreach ($areas as $index => $data) {
            Area::create([
                'id'     => $data['id'],
                'nombre' => $data['nombre'],
                'color'  => $colores[$index % count($colores)], // Rota entre los colores
                'activa' => true,
            ]);
        }
    }
}
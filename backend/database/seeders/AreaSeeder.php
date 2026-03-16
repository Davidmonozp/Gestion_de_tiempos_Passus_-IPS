<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Area;
use Illuminate\Support\Facades\DB;

class AreaSeeder extends Seeder
{
    public function run(): void
    {
        // Desactivamos llaves foráneas para limpiar la tabla de forma segura
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Area::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Lista exacta de áreas según tu imagen de referencia
        $areas = [
            ['nombre' => 'ADMINISTRATIVA'],
            ['nombre' => 'ADMISIONES'],
            ['nombre' => 'AUTOMATIZACIÓN'],
            ['nombre' => 'BIENESTAR'],
            ['nombre' => 'CALIDAD'],
            ['nombre' => 'COMERCIAL'],
            ['nombre' => 'CONTABILIDAD'],
            ['nombre' => 'DIRECCION'],
            ['nombre' => 'FACTURACIÓN Y CARTERA'],
            ['nombre' => 'GESTIÓN HUMANA'],
            ['nombre' => 'INFRAESTRUCTURA'],
            ['nombre' => 'LOGISTICA'],
            ['nombre' => 'OPERACIONES'],
            ['nombre' => 'SERVICIOS DE SALUD'],
            ['nombre' => 'TESORERIA'],
        ];

        // Paleta de colores extendida para evitar repeticiones visuales en el calendario
        $colores = [
            '#3498db', // Azul
            '#2ecc71', // Verde
            '#e74c3c', // Rojo            
            '#f1c40f', // Amarillo
            '#9b59b6', // Morado
            '#1abc9c', // Turquesa
            '#e67e22', // Naranja
            '#34495e', // Gris oscuro
            '#16a085', // Verde esmeralda
            '#2980b9', // Azul belize
            '#8e44ad', // Amatista
            '#2c3e50', // Medianoche
            '#d35400', // Calabaza
            '#c0392b', // Granada
            '#7f8c8d'  // Asbesto
        ];

        foreach ($areas as $index => $data) {
            Area::create([
                'nombre' => $data['nombre'],
                'color'  => $colores[$index % count($colores)],
                'activa' => true,
            ]);
        }
    }
}
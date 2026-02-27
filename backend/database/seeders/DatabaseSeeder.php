<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Role::create([
            'name' => 'Administrador',
            'guard_name' => 'api'
        ]);

        Role::create([
            'name' => 'JefeInmediato',
            'guard_name' => 'api'
        ]);

        Role::create([
            'name' => 'Usuario',
            'guard_name' => 'api'
        ]);

        $this->call([
            AreaSeeder::class,
        ]);
    }
}

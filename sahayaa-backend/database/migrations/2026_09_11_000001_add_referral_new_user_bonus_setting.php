<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')->updateOrInsert(
            ['key' => 'referral_new_user_bonus'],
            [
                'value' => '10',
                'title' => 'Referral Signup Bonus (New User)',
                'description' => 'Credits given directly to new user when they register using a referral code',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('settings')->where('key', 'referral_new_user_bonus')->delete();
    }
};

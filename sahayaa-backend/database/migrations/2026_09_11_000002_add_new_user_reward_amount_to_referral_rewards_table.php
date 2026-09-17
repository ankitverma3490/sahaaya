<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('referral_rewards', function (Blueprint $table) {
            $table->decimal('new_user_reward_amount', 10, 2)->default(0)->after('reward_amount');
        });
    }

    public function down(): void
    {
        Schema::table('referral_rewards', function (Blueprint $table) {
            $table->dropColumn('new_user_reward_amount');
        });
    }
};

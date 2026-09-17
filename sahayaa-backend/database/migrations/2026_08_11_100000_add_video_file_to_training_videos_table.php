<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $hasVideoFile = Schema::hasColumn('training_videos', 'video_file');
        $hasVideoUrl = Schema::hasColumn('training_videos', 'video_url');

        if (!$hasVideoFile) {
            Schema::table('training_videos', function (Blueprint $table) {
                $table->string('video_file')->nullable()->after('subtitle');
            });
        }

        if ($hasVideoUrl) {
            DB::statement('ALTER TABLE training_videos MODIFY video_url VARCHAR(500) NULL');
        }
    }

    public function down(): void
    {
        Schema::table('training_videos', function (Blueprint $table) {
            $table->dropColumn('video_file');
        });
    }
};

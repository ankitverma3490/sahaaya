<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddWorkingHoursToUserWorkInfosTable extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('user_work_infos', 'working_hours')) {
            Schema::table('user_work_infos', function (Blueprint $table) {
                $table->string('working_hours')->nullable()->after('working_days');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('user_work_infos', 'working_hours')) {
            Schema::table('user_work_infos', function (Blueprint $table) {
                $table->dropColumn('working_hours');
            });
        }
    }
}

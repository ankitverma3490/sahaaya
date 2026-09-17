<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddEmergencyContactRelationToUserWorkInfosTable extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('user_work_infos', 'emergency_contact_relation')) {
            Schema::table('user_work_infos', function (Blueprint $table) {
                $table->string('emergency_contact_relation')->nullable()->after('emergency_contact_name');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('user_work_infos', 'emergency_contact_relation')) {
            Schema::table('user_work_infos', function (Blueprint $table) {
                $table->dropColumn('emergency_contact_relation');
            });
        }
    }
}

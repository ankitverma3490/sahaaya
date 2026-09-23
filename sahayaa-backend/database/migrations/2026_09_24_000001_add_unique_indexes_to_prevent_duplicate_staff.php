<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Prevents duplicate staff rows:
 * - users.aadhar_number unique (one human = one row)
 * - users.phone_number unique (one phone = one account)
 *
 * Existing duplicates are cleaned first:
 * - For duplicate Aadhaar groups keep the "best" row
 *   (prefer is_staff_added=1 with employment data, then lowest id)
 *   and soft-delete the rest (is_deleted=1) so history is preserved.
 * - Same strategy for duplicate phones.
 */
class AddUniqueIndexesToPreventDuplicateStaff extends Migration
{
    public function up()
    {
        // ── 1) Normalize Aadhaar (strip spaces/dashes) so unique index is meaningful ──
        DB::statement("UPDATE users SET aadhar_number = REPLACE(REPLACE(REPLACE(aadhar_number, ' ', ''), '-', ''), '.', '') WHERE aadhar_number IS NOT NULL AND aadhar_number != ''");

        // ── 2) Collapse duplicate Aadhaar rows ─────────────────────────────────────
        // Keep best row per aadhar: is_staff_added DESC, is_deleted ASC, id ASC
        DB::statement('
            UPDATE users u
            JOIN (
                SELECT aadhar_number,
                       SUBSTRING_INDEX(GROUP_CONCAT(
                           id ORDER BY is_staff_added DESC, is_deleted ASC, id ASC
                       ), \',\', 1) AS keep_id
                FROM users
                WHERE aadhar_number IS NOT NULL AND aadhar_number != \'\' AND aadhar_number != \'0\'
                GROUP BY aadhar_number
                HAVING COUNT(*) > 1
            ) d ON u.aadhar_number = d.aadhar_number
            SET u.is_deleted = 1,
                u.is_active = 0,
                u.status = \'inactive\'
            WHERE u.id != d.keep_id
        ');

        // For soft-deleted dupes that still hold the same aadhaar, free the column
        // so the unique index only sees one live holder. Keep aadhaar on keep_id row.
        DB::statement('
            UPDATE users u
            JOIN (
                SELECT aadhar_number,
                       SUBSTRING_INDEX(GROUP_CONCAT(
                           id ORDER BY is_staff_added DESC, is_deleted ASC, id ASC
                       ), \',\', 1) AS keep_id
                FROM users
                WHERE aadhar_number IS NOT NULL AND aadhar_number != \'\' AND aadhar_number != \'0\'
                GROUP BY aadhar_number
                HAVING COUNT(*) > 1
            ) d ON u.aadhar_number = d.aadhar_number
            SET u.aadhar_number = NULL
            WHERE u.id != d.keep_id
        ');

        // ── 3) Collapse duplicate phones (keep best row, soft-delete others) ───────
        DB::statement('
            UPDATE users u
            JOIN (
                SELECT phone_number,
                       SUBSTRING_INDEX(GROUP_CONCAT(
                           id ORDER BY is_staff_added DESC, is_deleted ASC, id ASC
                       ), \',\', 1) AS keep_id
                FROM users
                WHERE phone_number IS NOT NULL AND phone_number != \'\' AND phone_number != \'0\'
                GROUP BY phone_number
                HAVING COUNT(*) > 1
            ) d ON u.phone_number = d.phone_number
            SET u.is_deleted = 1,
                u.is_active = 0,
                u.status = \'inactive\'
            WHERE u.id != d.keep_id
        ');

        DB::statement('
            UPDATE users u
            JOIN (
                SELECT phone_number,
                       SUBSTRING_INDEX(GROUP_CONCAT(
                           id ORDER BY is_staff_added DESC, is_deleted ASC, id ASC
                       ), \',\', 1) AS keep_id
                FROM users
                WHERE phone_number IS NOT NULL AND phone_number != \'\' AND phone_number != \'0\'
                GROUP BY phone_number
                HAVING COUNT(*) > 1
            ) d ON u.phone_number = d.phone_number
            SET u.phone_number = NULL
            WHERE u.id != d.keep_id
        ');

        // ── 4) Add unique indexes (skip if already present) ───────────────────────
        $aadharIndexes = collect(DB::select("SHOW INDEX FROM users WHERE Key_name = 'users_aadhar_number_unique'"));
        if ($aadharIndexes->isEmpty()) {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('aadhar_number', 'users_aadhar_number_unique');
            });
        }

        $phoneIndexes = collect(DB::select("SHOW INDEX FROM users WHERE Key_name = 'users_phone_number_unique'"));
        if ($phoneIndexes->isEmpty()) {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('phone_number', 'users_phone_number_unique');
            });
        }
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $indexes = collect(DB::select("SHOW INDEX FROM users"))
                ->pluck('Key_name')
                ->unique()
                ->toArray();

            if (in_array('users_aadhar_number_unique', $indexes)) {
                $table->dropUnique('users_aadhar_number_unique');
            }
            if (in_array('users_phone_number_unique', $indexes)) {
                $table->dropUnique('users_phone_number_unique');
            }
        });
    }
}

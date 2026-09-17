<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add PF (Provident Fund) deduction + salary period columns.
     * Salary deductions should include only PF and IT (income tax);
     * salary slips are generated per the owner-selected closing date.
     */
    public function up()
    {
        if (!Schema::hasColumn('salaries', 'pf_deduction')) {
            Schema::table('salaries', function (Blueprint $table) {
                $table->decimal('pf_deduction', 10, 2)->nullable()->after('tax');
            });
        }

        if (!Schema::hasColumn('salaries', 'salary_period_start')) {
            Schema::table('salaries', function (Blueprint $table) {
                $table->date('salary_period_start')->nullable()->after('payment_date');
            });
        }

        if (!Schema::hasColumn('salaries', 'salary_period_end')) {
            Schema::table('salaries', function (Blueprint $table) {
                $table->date('salary_period_end')->nullable()->after('salary_period_start');
            });
        }

        if (!Schema::hasColumn('payments', 'pf_deduction')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->decimal('pf_deduction', 10, 2)->nullable()->after('tax_deduction');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('salaries', 'pf_deduction')) {
            Schema::table('salaries', function (Blueprint $table) {
                $table->dropColumn('pf_deduction');
            });
        }

        if (Schema::hasColumn('salaries', 'salary_period_start')) {
            Schema::table('salaries', function (Blueprint $table) {
                $table->dropColumn('salary_period_start');
            });
        }

        if (Schema::hasColumn('salaries', 'salary_period_end')) {
            Schema::table('salaries', function (Blueprint $table) {
                $table->dropColumn('salary_period_end');
            });
        }

        if (Schema::hasColumn('payments', 'pf_deduction')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropColumn('pf_deduction');
            });
        }
    }
};

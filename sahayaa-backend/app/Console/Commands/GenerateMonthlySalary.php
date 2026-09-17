<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Attendance;
use App\Models\Salary;
use App\Models\UserWorkInfo;
use Carbon\Carbon;

class GenerateMonthlySalary extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'salary:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate monthly salary (pending) for all staff based on their salary closing date';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // daily present (legacy auto-attendance)
        $users = User::where('user_role_id', '2')->get();
        foreach ($users as $user) {
            Attendance::updateOrCreate([
                'staff_id' => $user->id,
                'date' => Carbon::now()->format('Y-m-d'),
            ], [
                'staff_id' => $user->id,
                'date' => Carbon::now()->format('Y-m-d'),
                'status' => 'present',
                'check_in_time' => Carbon::today()->setTime(10, 0, 0),
                'late_minutes' => 0,
                'description' => "auto generated",
                'processed_by' => $user->added_by ?? $user->parent_user_id
            ]);
        }

        $this->info('Generating monthly salary...');

        $staffMembers = User::where('user_role_id', 2)
            ->where('status', 'active')
            ->get();

        $now = Carbon::now();
        $generated = 0;

        foreach ($staffMembers as $staff) {
            $workInfo = UserWorkInfo::where('user_id', $staff->id)->first();
            $salaryAmount = $workInfo && $workInfo->salary ? (float) $workInfo->salary : 0;

            $ownerId = $staff->added_by ?? $staff->parent_user_id ?? null;
            if (!$ownerId) {
                continue;
            }

            if ($salaryAmount <= 0) {
                continue;
            }

            $closingDate = $workInfo->salary_closing_date ?? null;

            // Compute salary period based on closing date (1-30) or month-end default (31 / null)
            if ($closingDate && (int)$closingDate >= 1 && (int)$closingDate <= 30) {
                $closingDay = (int)$closingDate;
                $thisMonthClosingDay = min($closingDay, $now->daysInMonth);
                if ($now->day > $thisMonthClosingDay) {
                    $nextMonth = $now->copy()->addMonthNoOverflow();
                    $nextClosingDay = min($closingDay, $nextMonth->daysInMonth);
                    $periodStart = $now->copy()->day($thisMonthClosingDay)->addDay();
                    $periodEnd = $nextMonth->copy()->day($nextClosingDay);
                } else {
                    $prevMonth = $now->copy()->subMonthNoOverflow();
                    $prevClosingDay = min($closingDay, $prevMonth->daysInMonth);
                    $periodStart = $prevMonth->copy()->day($prevClosingDay)->addDay();
                    $periodEnd = $now->copy()->day($thisMonthClosingDay);
                }
            } else {
                $periodStart = $now->copy()->startOfMonth();
                $periodEnd = $now->copy()->endOfMonth();
            }

            $startDate = $periodStart->format('Y-m-d');
            $endDate = $periodEnd->format('Y-m-d');

            // Skip if a salary record already exists for this period
            $exists = Salary::where('staff_id', $staff->id)
                ->whereDate('salary_period_end', $endDate)
                ->exists();

            if ($exists) {
                continue;
            }

            Salary::create([
                'staff_id' => $staff->id,
                'houseowner_id' => $ownerId,
                'basic_salary' => $salaryAmount,
                'performative_allowance' => 0,
                'over_time_allowance' => 0,
                'tax' => 0,
                'pf_deduction' => 0,
                'advance_payment' => 0,
                'net_salary' => $salaryAmount,
                'payment_mode' => 'Cash',
                'status' => 'pending',
                'payment_date' => $endDate,
                'salary_period_start' => $startDate,
                'salary_period_end' => $endDate,
            ]);

            $generated++;
        }

        $this->info("Monthly salary generated for {$generated} staff member(s).");
        return Command::SUCCESS;
    }
}

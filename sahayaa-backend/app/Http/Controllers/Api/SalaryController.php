<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use App\Models\JobApplication;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Models\Payment;
use App\Models\Transaction;
use Carbon\Carbon;
use App\Models\LeaveRequest;
use App\Models\Attendance;
use App\Models\UserWorkInfo;
use App\Models\SubscriptionUser;
use Illuminate\Support\Facades\DB;
use App\Models\Salary;
use App\Models\SalaryPayout;
use App\Models\BankAccount;
use App\Models\Job;
use App\Models\Notification;
use App\Models\KycVerification;
use App\Models\StaffAdvance;
use App\Services\Admin\RazorpayXService;
use Illuminate\Support\Str;

class SalaryController extends Controller
{
    private function getEffectiveSubscriptionAmount($subscriptionUser): float
    {
        $storedAmount = (float) ($subscriptionUser->amount ?? 0);
        if ($storedAmount > 0) {
            return $storedAmount;
        }

        $paymentMode = strtolower((string) ($subscriptionUser->payment_mode ?? ''));
        $paymentStatus = strtolower((string) ($subscriptionUser->payment_status ?? ''));
        $isPaidSubscription = in_array($paymentMode, ['razorpay']) || in_array($paymentStatus, ['paid', 'completed']);

        return $isPaidSubscription
            ? (float) ($subscriptionUser->subscription->price ?? 0)
            : 0.0;
    }

    /**
     * Get staff salary information
     */
    // public function getStaffSalary($user_id): JsonResponse
    // {
    //     try {
    //         $user = User::where('id', $user_id)
    //             ->where('user_role_id', 2)
    //             ->first();

    //         if (!$user) {
    //             return response()->json([
    //                 'status' => false,
    //                 'message' => 'Staff member not found'
    //             ], 404);
    //         }
    //         $acceptedApplication = JobApplication::where('user_id', $user_id)
    //             ->where('application_status', 'accepted')
    //             ->first();

    //         if (!$acceptedApplication) {
    //             return response()->json([
    //                 'status' => false,
    //                 'message' => 'User does not have any accepted job applications'
    //             ], 400);
    //         }
    //         $job = $acceptedApplication->job;
    //          $lastMonth = Carbon::now()->subMonth()->format('F Y');
    //     $lastMonthPayment = Payment::where('staff_id', $user_id)
    //         ->where('salary_period', 'like', '%' . $lastMonth . '%')
    //         ->orderBy('created_at', 'desc')
    //         ->first();
    //         $salaryData = [
    //             'staff_member' => $user,
    //             'salary_details' => [
    //                 'base_salary' => [
    //                     'monthly_salary' => $job->compensation ?? 2500.00,
    //                     'period' => date('F-Y'),
    //                 ],
    //                 'adjustments' => [
    //                     'performance_bonus' => 0.00,
    //                     'overtime_pay' => 0.00,
    //                     'tax_deduction' => 0.00,
    //                     'advance_payment' => 0.00
    //                 ],
    //                   'last_month_salary' => $lastMonthPayment ? [
    //             'payment_id' => $lastMonthPayment->payment_id,
    //             'base_salary' => (float) $lastMonthPayment->base_salary,
    //             'performance_bonus' => (float) $lastMonthPayment->performance_bonus,
    //             'overtime_pay' => (float) $lastMonthPayment->overtime_pay,
    //             'tax_deduction' => (float) $lastMonthPayment->tax_deduction,
    //             'advance_payment' => (float) $lastMonthPayment->advance_payment,
    //             'net_salary' => (float) $lastMonthPayment->net_salary,
    //             'payment_method' => $lastMonthPayment->payment_mode,
    //             'salary_period' => $lastMonthPayment->salary_period,
    //             'payment_status' => $lastMonthPayment->status,
    //             'paid_date' => $lastMonthPayment->updated_at->format('Y-m-d H:i:s')
    //         ] : null,

            
    //                 'net_salary' => $job->compensation ?? 0.00,
    //                 'payment_method' => 'Cash'
    //             ]
    //         ];
    //         $baseSalary = $salaryData['salary_details']['base_salary']['monthly_salary'];
    //         $adjustments = $salaryData['salary_details']['adjustments'];
    //         $netSalary = $baseSalary + $adjustments['performance_bonus'] + $adjustments['overtime_pay'] + 
    //                     $adjustments['tax_deduction'] + $adjustments['advance_payment'];
            
    //         $salaryData['salary_details']['net_salary'] = $netSalary;
    //         return response()->json([
    //             'status' => true,
    //             'message' => 'Staff salary data retrieved successfully',
    //             'data' => $salaryData
    //         ]);

    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'status' => false,
    //             'message' => 'Failed to retrieve salary data: ' . $e->getMessage()
    //         ], 500);
    //     }
    // }


    public function getStaffSalary($user_id): JsonResponse
    {
        try {
            $user = User::find($user_id);

            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            // Query accepted job application & work info
            $acceptedApplication = JobApplication::where('user_id', $user_id)
                ->where('application_status', 'accepted')
                ->first();

            // Prioritize salary from UserWorkInfo (set by house owner)
            $userWorkInfo = UserWorkInfo::where('user_id', $user_id)->first();
            
            if ($userWorkInfo && $userWorkInfo->salary && (float) $userWorkInfo->salary > 0) {
                // Use salary from UserWorkInfo as primary source of truth
                $baseSalary = (float) $userWorkInfo->salary;
                $jobCompensation = $baseSalary;
                $salarySource = 'staff_record';
            } elseif ($acceptedApplication && $acceptedApplication->job && (float) ($acceptedApplication->job->compensation ?? 0) > 0) {
                // Fallback to accepted job application
                $job = $acceptedApplication->job;
                $jobCompensation = (float) ($job->compensation ?? 0.00);
                $baseSalary = $jobCompensation;
                $salarySource = 'job_application';
            } else {
                $baseSalary = 0.00;
                $jobCompensation = 0.00;
                $salarySource = 'not_set';
            }

            // Get last month payment
            $lastMonth = Carbon::now()->subMonth()->format('F Y');
            $lastMonthPayment = Payment::where('staff_id', $user_id)
                ->where('salary_period', 'like', '%' . $lastMonth . '%')
                ->orderBy('created_at', 'desc')
                ->first();

            // Get pay frequency from UserWorkInfo if available
            $payFrequency = 'Monthly'; // Default
            if (isset($userWorkInfo) && $userWorkInfo->pay_frequency) {
                $payFrequency = $userWorkInfo->pay_frequency;
            } elseif ($acceptedApplication && $acceptedApplication->job) {
                $payFrequency = $acceptedApplication->job->pay_frequency ?? 'Monthly';
            }

            // Compute next salary payment date based on closing date (1-30 or month-end/31)
            $closingDateForPay = (isset($userWorkInfo) && $userWorkInfo->salary_closing_date) ? (int) $userWorkInfo->salary_closing_date : null;
            $nowForPay = Carbon::now();
            if ($closingDateForPay && $closingDateForPay >= 1 && $closingDateForPay <= 30) {
                $thisMonthClosingDay = min($closingDateForPay, $nowForPay->daysInMonth);
                if ($nowForPay->day > $thisMonthClosingDay) {
                    $nextMonth = $nowForPay->copy()->addMonthNoOverflow();
                    $nextClosingDay = min($closingDateForPay, $nextMonth->daysInMonth);
                    $periodStart = $nowForPay->copy()->day($thisMonthClosingDay)->addDay();
                    $periodEnd = $nextMonth->copy()->day($nextClosingDay);
                } else {
                    $prevMonth = $nowForPay->copy()->subMonthNoOverflow();
                    $prevClosingDay = min($closingDateForPay, $prevMonth->daysInMonth);
                    $periodStart = $prevMonth->copy()->day($prevClosingDay)->addDay();
                    $periodEnd = $nowForPay->copy()->day($thisMonthClosingDay);
                }
            } else {
                $periodStart = $nowForPay->copy()->startOfMonth();
                $periodEnd = $nowForPay->copy()->endOfMonth();
            }
            $nextPayDate = $periodEnd->copy()->format('d/m/Y');

            $salaryData = [
                'staff_member' => [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . $user->last_name) ?: ($user->name ?: 'Staff Member'),
                    'email' => $user->email,
                    'phone' => $user->phone_number,
                    'image' => $user->image,
                    'upi_id' => $user->upi_id,
                ],
                'salary_details' => [
                    'base_salary' => [
                        'monthly_salary' => $baseSalary,
                        'period' => date('F Y'),
                        'pay_frequency' => $payFrequency,
                        'source' => $salarySource ?? 'unknown'
                    ],
                    'adjustments' => [
                        'performance_bonus' => 0.00,
                        'overtime_pay' => 0.00,
                        'tax_deduction' => 0.00,
                        'pf_deduction' => 0.00,
                        'advance_payment' => 0.00
                    ],
                    'last_month_salary' => $lastMonthPayment ? [
                        'payment_id' => $lastMonthPayment->payment_id,
                        'base_salary' => (float) $lastMonthPayment->base_salary,
                        'performance_bonus' => (float) $lastMonthPayment->performance_bonus,
                        'overtime_pay' => (float) $lastMonthPayment->overtime_pay,
                        'tax_deduction' => (float) $lastMonthPayment->tax_deduction,
                        'pf_deduction' => (float) ($lastMonthPayment->pf_deduction ?? 0),
                        'advance_payment' => (float) $lastMonthPayment->advance_payment,
                        'net_salary' => (float) $lastMonthPayment->net_salary,
                        'payment_method' => $lastMonthPayment->payment_mode,
                        'salary_period' => $lastMonthPayment->salary_period,
                        'payment_status' => $lastMonthPayment->status,
                        'paid_date' => $lastMonthPayment->updated_at ? $lastMonthPayment->updated_at->format('Y-m-d H:i:s') : null,
                    ] : null,
                    'net_salary' => $baseSalary,
                    'payment_method' => 'Cash',
                    'next_pay_date' => $nextPayDate,
                    'salary_closing_date' => $closingDateForPay,
                    'salary_period_start' => $periodStart->format('Y-m-d'),
                    'salary_period_end' => $periodEnd->format('Y-m-d'),
                ]
            ];

            // Calculate net salary including adjustments
            $adjustments = $salaryData['salary_details']['adjustments'];
            $netSalary = max(
                0,
                $baseSalary
                + $adjustments['performance_bonus']
                + $adjustments['overtime_pay']
                - $adjustments['tax_deduction']
                - $adjustments['pf_deduction']
            );
            
            $salaryData['salary_details']['net_salary'] = $netSalary;

            return response()->json([
                'status' => true,
                'message' => 'Staff salary data retrieved successfully',
                'data' => $salaryData
            ]);

        } catch (\Exception $e) {
            \Log::error('getStaffSalary Error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve salary data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update staff salary information / process salary payment
     */
    public function updateStaffSalary(Request $request, $user_id): JsonResponse
    {
        try {
            $user = User::find($user_id);
            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            $employerId = Auth::guard('api')->id();
            $currentPeriod = date('F Y');

            // Save-only request: compute/return salary breakdown WITHOUT creating
            // a Payment row or firing a "Salary Paid" notification.
            $isSaveOnly = $request->boolean('save_only')
                || $request->input('status') === 'draft'
                || $request->input('action') === 'save';

            $validator = Validator::make($request->all(), [
                'base_salary' => 'nullable|numeric|min:0',
                'basic_salary' => 'nullable|numeric|min:0',
                'performance_bonus' => 'nullable|numeric|min:0',
                'performative_allowance' => 'nullable|numeric|min:0',
                'overtime_pay' => 'nullable|numeric|min:0',
                'over_time_allowance' => 'nullable|numeric|min:0',
                'pf_deduction' => 'nullable|numeric|min:0',
                'advance_payment' => 'nullable|numeric',
                'payment_method' => 'nullable|string',
                'payment_mode' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $baseSalary = (float) ($request->base_salary ?? $request->basic_salary ?? 0);
            $performanceBonus = (float) ($request->performance_bonus ?? $request->performative_allowance ?? 0);
            $overtimePay = (float) ($request->overtime_pay ?? $request->over_time_allowance ?? 0);
            $taxDeduction = abs((float) ($request->tax_deduction ?? $request->tax ?? 0));
            $pfDeduction = abs((float) ($request->pf_deduction ?? $request->pf ?? 0));
            $paymentMode = $request->payment_method ?? $request->payment_mode ?? 'Cash';

            // Base + Bonus + Overtime - IT - PF
            $netSalary = max(0, $baseSalary + $performanceBonus + $overtimePay - $taxDeduction - $pfDeduction);

            // Agreed monthly salary (source of truth) — never pay more than this in a period.
            $workInfo = \App\Models\UserWorkInfo::where('user_id', $user_id)->first();
            $agreedMonthly = 0.0;
            if ($workInfo && (float) ($workInfo->salary ?? 0) > 0) {
                $agreedMonthly = (float) $workInfo->salary;
            } elseif ((float) ($user->salary ?? 0) > 0) {
                $agreedMonthly = (float) $user->salary;
            } else {
                $acceptedApp = \App\Models\JobApplication::where('user_id', $user_id)
                    ->where('application_status', 'accepted')
                    ->with('job')
                    ->first();
                if ($acceptedApp && $acceptedApp->job && (float) ($acceptedApp->job->compensation ?? 0) > 0) {
                    $agreedMonthly = (float) $acceptedApp->job->compensation;
                }
            }

            if (!$isSaveOnly) {
                DB::beginTransaction();
                try {
                    // Lock the staff row so two concurrent "Pay" taps serialize here.
                    User::where('id', $user_id)->lockForUpdate()->first();

                    // Double-click protection (10s) — keep for instant double-taps.
                    $recentDup = Payment::where('staff_id', $user_id)
                        ->where('user_id', $employerId)
                        ->where('salary_period', $currentPeriod)
                        ->where('created_at', '>=', now()->subSeconds(10))
                        ->exists();
                    if ($recentDup) {
                        DB::rollBack();
                        return response()->json([
                            'status' => false,
                            'message' => 'Payment is already being processed. Please wait a moment.'
                        ], 400);
                    }

                    // Full-period duplicate / overpayment guard (THE real fix).
                    $alreadyPaid = (float) Payment::where('staff_id', $user_id)
                        ->where('user_id', $employerId)
                        ->where('salary_period', $currentPeriod)
                        ->whereIn('status', ['paid', 'completed'])
                        ->lockForUpdate()
                        ->sum('net_salary');

                    if ($agreedMonthly > 0) {
                        $remaining = round($agreedMonthly - $alreadyPaid, 2);
                        if ($remaining <= 0) {
                            DB::rollBack();
                            return response()->json([
                                'status' => false,
                                'message' => 'Salary for ' . $currentPeriod . ' is already fully paid (₹' . number_format($agreedMonthly, 2) . '). No further payment allowed.',
                                'error_code' => 'SALARY_ALREADY_PAID',
                                'already_paid' => $alreadyPaid,
                                'agreed_salary' => $agreedMonthly,
                                'remaining' => 0,
                            ], 422);
                        }
                        if ($netSalary > $remaining + 0.009) {
                            DB::rollBack();
                            return response()->json([
                                'status' => false,
                                'message' => 'Payment of ₹' . number_format($netSalary, 2) . ' exceeds remaining salary for ' . $currentPeriod . ' (₹' . number_format($remaining, 2) . ' left of ₹' . number_format($agreedMonthly, 2) . ').',
                                'error_code' => 'SALARY_EXCEEDS_REMAINING',
                                'already_paid' => $alreadyPaid,
                                'agreed_salary' => $agreedMonthly,
                                'remaining' => $remaining,
                            ], 422);
                        }
                    } elseif ($alreadyPaid > 0 && $netSalary > 0) {
                        // No agreed salary configured — still block a second paid row
                        // for the same period so 5–6 duplicate taps can never happen.
                        DB::rollBack();
                        return response()->json([
                            'status' => false,
                            'message' => 'A salary payment for ' . $currentPeriod . ' already exists. Set the staff agreed salary to allow partial/top-up payments.',
                            'error_code' => 'SALARY_ALREADY_PAID',
                            'already_paid' => $alreadyPaid,
                            'remaining' => 0,
                        ], 422);
                    }

                    $paymentId = 'PAY_' . strtoupper(uniqid());
                    $orderId = 'SAL_' . strtoupper(uniqid());
                    $transactionId = 'TXN_' . strtoupper(uniqid());

                    $status = $request->status;
                    if (!$status) {
                        $status = (strtolower($paymentMode) === 'cash') ? 'paid' : 'pending';
                    }

                    $payment = Payment::create([
                        'user_id' => $employerId,
                        'staff_id' => $user_id,
                        'amount' => $netSalary,
                        'payment_id' => $paymentId,
                        'order_id' => $orderId,
                        'status' => $status,
                        'payment_mode' => $paymentMode,
                        'base_salary' => $baseSalary,
                        'performance_bonus' => $performanceBonus,
                        'overtime_pay' => $overtimePay,
                        'tax_deduction' => $taxDeduction,
                        'pf_deduction' => $pfDeduction,
                        'advance_payment' => 0,
                        'net_salary' => $netSalary,
                        'salary_period' => $currentPeriod,
                    ]);

                    DB::commit();
                } catch (\Throwable $e) {
                    DB::rollBack();
                    throw $e;
                }

                // Notify staff member about salary payment only if successful
                if ($status === 'paid' || $status === 'completed') {
                    try {
                        $employerObj = Auth::guard('api')->user();
                        $employerName = $employerObj ? (trim(($employerObj->first_name ?? '') . ' ' . ($employerObj->last_name ?? '')) ?: ($employerObj->name ?? 'Employer')) : 'Employer';
                        \App\Services\NotificationService::salaryPaid(
                            $user_id,
                            number_format($netSalary, 2),
                            $employerName
                        );
                    } catch (\Exception $e) {
                        \Log::error('Salary notification failed: ' . $e->getMessage());
                    }
                }

                // Create Transaction and Salary records
                try {
                    Transaction::create([
                        'user_id' => $user_id,
                        'transaction_id' => $transactionId,
                        'type' => 'salary',
                        'order_id' => $orderId,
                        'order_number' => $orderId,
                        'reference_id' => $paymentId,
                        'amount' => $netSalary,
                        'currency' => 'INR',
                        'payment_mode' => $paymentMode,
                        'payment_status' => $status,
                        'created_by' => $employerId,
                        'payment_response' => json_encode([
                            'base_salary' => $baseSalary,
                            'performance_bonus' => $performanceBonus,
                            'overtime_pay' => $overtimePay,
                            'tax_deduction' => $taxDeduction,
                            'pf_deduction' => $pfDeduction,
                            'net_salary' => $netSalary,
                            'period' => date('F Y')
                        ]),
                        'for_entry' => 'salary_payment'
                    ]);

                    \App\Models\Salary::create([
                        'staff_id' => $user_id,
                        'houseowner_id' => $employerId,
                        'basic_salary' => $baseSalary,
                        'performative_allowance' => $performanceBonus,
                        'over_time_allowance' => $overtimePay,
                        'tax' => $taxDeduction,
                        'pf_deduction' => $pfDeduction,
                        'advance_payment' => 0,
                        'net_salary' => $netSalary,
                        'payment_mode' => $paymentMode,
                        'status' => $status,
                        'payment_date' => now()->toDateString(),
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Failed to create Transaction/Salary record: ' . $e->getMessage());
                }
            } else {
                // Save-only: keep payment IDs synthetic for the response shape.
                $paymentId = 'SAVE_' . strtoupper(uniqid());
                $orderId = 'SALSAVE_' . strtoupper(uniqid());
                $transactionId = 'TXNSAVE_' . strtoupper(uniqid());
                $status = 'draft';
            }

            $salaryData = [
                'staff_member' => [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . $user->last_name) ?: ($user->name ?: 'Staff Member'),
                    'email' => $user->email,
                    'phone' => $user->phone_number,
                    'image' => $user->image,
                ],
                'salary_details' => [
                    'base_salary' => [
                        'monthly_salary' => (float) $baseSalary,
                        'period' => date('F Y')
                    ],
                    'adjustments' => [
                        'performance_bonus' => (float) $performanceBonus,
                        'overtime_pay' => (float) $overtimePay,
                        'tax_deduction' => (float) $taxDeduction,
                        'pf_deduction' => (float) $pfDeduction,
                        'advance_payment' => 0.00
                    ],
                    'net_salary' => (float) $netSalary,
                    'payment_method' => $paymentMode
                ],
                'payment_info' => [
                    'payment_id' => $paymentId,
                    'order_id' => $orderId,
                    'transaction_id' => $transactionId,
                    'status' => $status
                ],
                // Backward compatibility for Salary.js
                'basic_salary' => (float) $baseSalary,
                'performative_allowance' => (float) $performanceBonus,
                'over_time_allowance' => (float) $overtimePay,
                'tax' => (float) $taxDeduction,
                'pf_deduction' => (float) $pfDeduction,
                'advance_payment' => 0,
                'net_salary' => (float) $netSalary,
                'agreed_salary' => (float) $agreedMonthly,
            ];

            return response()->json([
                'status' => true,
                'message' => $isSaveOnly
                    ? 'Salary details saved successfully'
                    : 'Salary updated and payment processed successfully',
                'data' => $salaryData
            ]);

        } catch (\Exception $e) {
            \Log::error('updateStaffSalary Error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to update salary: ' . $e->getMessage()
            ], 500);
        }
    }

public function getEarningsSummary(Request $request, $job_id = null)
{
    try {
        $input = $request->all();

        // Populate job_id from route parameter if not in query parameters
        if ($job_id !== null && !isset($input['job_id'])) {
            $input['job_id'] = $job_id;
        }

        // Sanitize job_id to handle React Native state uninitialized values (like 'null', 'undefined', empty, or 0)
        if (isset($input['job_id']) && ($input['job_id'] === 'null' || $input['job_id'] === 'undefined' || $input['job_id'] === '' || $input['job_id'] == 0)) {
            unset($input['job_id']);
        }

        // Sanitize month to handle empty/uninitialized strings
        if (isset($input['month']) && ($input['month'] === 'null' || $input['month'] === 'undefined' || $input['month'] === '')) {
            unset($input['month']);
        }

        $validator = Validator::make($input, [
            'job_id' => 'sometimes|exists:jobs,id',
            'month' => 'sometimes|date_format:Y-m'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $user = Auth::guard('api')->user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $jobId = $input['job_id'] ?? null;
        $month = $input['month'] ?? date('Y-m');
        $monthName = date('F Y', strtotime($month));
        // Get approved job applications
        $applications = JobApplication::where('user_id', $user->id)
            ->where('application_status', 'accepted')
            ->with(['job.creator', 'user.addedByUser', 'user.userWorkInfo'])
            ->when($jobId, function($query) use ($jobId) {
                return $query->where('job_id', $jobId);
            })
            ->get();

        if ($applications->isEmpty()) {
            // Reload user with relations if needed
            $user->load(['addedByUser', 'userWorkInfo']);
            
            // Check if user was directly added by someone
            if ($user->addedByUser || $user->added_by) {
                $employer = $user->addedByUser ?: User::find($user->added_by);
                
                if (!$employer) {
                    // Employer not found — return graceful empty response
                    return response()->json([
                        "status" => true,
                        "message" => "No earnings data yet",
                        "data" => []
                    ]);
                }
                
                // Create a "virtual" application object for consistent processing
                $virtualApplication = new \stdClass();
                $virtualApplication->id = 0;
                $virtualApplication->updated_at = $user->created_at;
                
                // Create a virtual job object
                $virtualJob = new \stdClass();
                $virtualJob->id = null;
                $virtualJob->title = ($user->userWorkInfo && $user->userWorkInfo->primary_role) ? $user->userWorkInfo->primary_role : "Staff Member";
                $virtualJob->compensation = ($user->userWorkInfo && $user->userWorkInfo->salary) ? (float) $user->userWorkInfo->salary : 0;
                $virtualJob->city = $employer->location ?? "";
                $virtualJob->state = "";
                $virtualJob->street_address = $employer->location ?? "";
                $virtualJob->commitment_type = "";
                $virtualJob->compensation_type = "";
                $virtualJob->creator = $employer;
                
                // Create a virtual employer object for consistent processing
                $virtualEmployer = new \stdClass();
                $virtualEmployer->id = $employer->id ?? 0;
                $virtualEmployer->first_name = $employer->first_name ?? '';
                $virtualEmployer->last_name = $employer->last_name ?? '';
                $virtualEmployer->name = $employer->name ?? '';
                $virtualEmployer->location = $employer->location ?? '';
                
                $virtualApplication->job = $virtualJob;
                $virtualApplication->job_id = null;
                $applications = collect([$virtualApplication]);
            } else {
                // Staff has no employer and no accepted job — return empty data instead of error
                return response()->json([
                    "status" => true,
                    "message" => "No earnings data yet",
                    "data" => []
                ]);
            }
        }
        
        $response = [];
        
        foreach ($applications as $application) {
            $job = $application->job ? (array)$application->job : [];
            $employer = $application->job && isset($application->job->creator) 
                ? (array)$application->job->creator 
                : [];

            // Get salary payments for this user and job
            $paymentsQuery = Payment::where('staff_id', $user->id);

            // Get current month payments
            $currentMonthPayments = (clone $paymentsQuery)
                ->where('status', 'paid')
                ->where(function($q) use ($monthName) {
                    $q->where('salary_period', 'like', '%' . $monthName . '%')
                      ->orWhere('salary_period', 'like', '%' . str_replace(' ', '-', $monthName) . '%');
                })
                ->get();
                
            $currentMonthSalaries = Salary::where('staff_id', $user->id)
                ->whereMonth('payment_date', date('m'))
                ->whereYear('payment_date', date('Y'))
                ->where('status', 'paid')
                ->get();

            // Filter out duplicate payments that exist in the salaries table
            $filteredCurrentMonthPayments = $currentMonthPayments->filter(function($payment) use ($currentMonthSalaries) {
                foreach ($currentMonthSalaries as $salary) {
                    $timeDiff = abs(strtotime($payment->created_at) - strtotime($salary->created_at));
                    if ($timeDiff < 60 && abs($payment->net_salary - $salary->net_salary) < 0.01) {
                        return false;
                    }
                }
                return true;
            });

            // Calculate totals for current month using the deduplicated list
            $totalBaseSalary = $filteredCurrentMonthPayments->sum('base_salary') + $currentMonthSalaries->sum('basic_salary');
            $totalPerformanceBonus = $filteredCurrentMonthPayments->sum('performance_bonus') + $currentMonthSalaries->sum('performative_allowance');
            $totalOvertimePay = $filteredCurrentMonthPayments->sum('overtime_pay') + $currentMonthSalaries->sum('over_time_allowance');
            $totalTaxDeduction = $filteredCurrentMonthPayments->sum('tax_deduction') + $currentMonthSalaries->sum('tax');
            $totalPfDeduction = $filteredCurrentMonthPayments->sum('pf_deduction') + $currentMonthSalaries->sum('pf_deduction');
            $totalAdvancePayment = $filteredCurrentMonthPayments->sum('advance_payment') + $currentMonthSalaries->sum('advance_payment');
            $totalNetSalary =
                $filteredCurrentMonthPayments->sum(fn($payment) => max(0, (float) $payment->net_salary)) +
                $currentMonthSalaries->sum(fn($salary) => max(0, (float) $salary->net_salary));

            // If no records for current month, use prioritized base salary
            if ($filteredCurrentMonthPayments->isEmpty() && $currentMonthSalaries->isEmpty()) {
                $userWorkInfo = UserWorkInfo::where('user_id', $user->id)->first();
                if ($userWorkInfo && $userWorkInfo->salary) {
                    $totalBaseSalary = (float) $userWorkInfo->salary;
                } elseif (isset($job['compensation'])) {
                    $totalBaseSalary = (float) $job['compensation'];
                } elseif (is_object($application->job) && isset($application->job->compensation)) {
                     $totalBaseSalary = (float) $application->job->compensation;
                } else {
                    $totalBaseSalary = 0;
                }
                $totalNetSalary = $totalBaseSalary;
            }

            // Get payment history (last 3 months)
            $salaryHistory = Salary::where('staff_id', $user->id)
                ->orderBy('payment_date', 'desc')
                ->limit(3)
                ->get()
                ->map(function($s) {
                    return [
                        'id' => $s->id,
                        'month' => Carbon::parse($s->payment_date)->format('F Y'),
                        'date' => $s->created_at->toDateTimeString(),
                        'paid_on' => Carbon::parse($s->payment_date)->format('d/m/Y'),
                        'amount' => max(0, (float) $s->net_salary),
                        'status' => $s->status,
                        'type' => (float)($s->advance_payment ?? 0) > 0 ? 'advance' : 'salary',
                        'payment_mode' => $s->payment_mode,
                        'base_salary' => $s->basic_salary,
                        'performance_bonus' => $s->performative_allowance,
                        'overtime_pay' => $s->over_time_allowance,
                        'tax_deduction' => $s->tax,
                        'pf_deduction' => (float)($s->pf_deduction ?? 0),
                        'advance_payment' => $s->advance_payment,
                        'payment_id' => 'SAL-' . $s->id,
                    ];
                });

            $paymentHistory = (clone $paymentsQuery)
                // ->where('status', 'completed')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get()
                ->map(function($payment) {
                    return [
                        'id' => $payment->id,
                        'month' => $payment->salary_period,
                        'date' => $payment->created_at->toDateTimeString(),
                        'paid_on' => $payment->updated_at->format('d/m/Y'),
                        'amount' => max(0, (float) $payment->net_salary),
                        'status' => $payment->status,
                        'type' => (float)($payment->advance_payment ?? 0) > 0 ? 'advance' : 'salary',
                        'payment_mode' => $payment->payment_mode,
                        'base_salary' => $payment->base_salary,
                        'performance_bonus' => $payment->performance_bonus,
                        'overtime_pay' => $payment->overtime_pay,
                        'tax_deduction' => $payment->tax_deduction,
                        'pf_deduction' => (float)($payment->pf_deduction ?? 0),
                        'advance_payment' => $payment->advance_payment,
                        'payment_id' => $payment->payment_id,
                        'order_id' => $payment->order_id
                    ];
                });

            // Deduplicate paymentHistory against salaryHistory
            $filteredPaymentHistory = $paymentHistory->filter(function($payment) use ($salaryHistory) {
                foreach ($salaryHistory as $salary) {
                    $timeDiff = abs(strtotime($payment['date']) - strtotime($salary['date']));
                    if ($timeDiff < 60 && abs($payment['amount'] - $salary['amount']) < 0.01) {
                        return false;
                    }
                }
                return true;
            });

            // Merge and sort combined history
            $combinedHistory = $salaryHistory->concat($filteredPaymentHistory)
                ->sortByDesc('date')
                ->values()
                ->take(3);
            // Get salary closing date from user work info
            $userWorkInfoForClosing = UserWorkInfo::where('user_id', $user->id)->first();
            $closingDate = $userWorkInfoForClosing->salary_closing_date ?? null;

            // Calculate salary period and next pay date based on closing date (1-30 or month-end/31)
            $now = Carbon::now();
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
                $startDate = $periodStart->format('Y-m-d');
                $endDate = $periodEnd->format('Y-m-d');
                $nextPayDate = $periodEnd->copy()->format('d/m/Y');
            } else {
                // Default or 31: calendar month / end of month
                $startDate = $now->copy()->startOfMonth()->format('Y-m-d');
                $endDate = $now->copy()->endOfMonth()->format('Y-m-d');
                $nextPayDate = $now->copy()->endOfMonth()->format('d/m/Y');
            }

            // TC-017: Default to staff's appointment/joining date if later
            $joiningDate = $userWorkInfoForClosing->created_at ?? ($user->created_at ?? null);
            if ($joiningDate && Carbon::parse($joiningDate)->startOfDay()->gt(Carbon::parse($startDate))) {
                $startDate = Carbon::parse($joiningDate)->format('Y-m-d');
            }

            $daysInPeriod = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1;
            
            $attendanceRecords = Attendance::where('staff_id', $user->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->get();

            $presentDays = $attendanceRecords->where('status', 'present')->count();
            $lateArrivals = $attendanceRecords->where('status', 'late')->count();
            $absentDays = $attendanceRecords->where('status', 'absent')->count();
            
            // Calculate total working days in the salary period (excluding weekends)
            $totalWorkingDays = $this->getWorkingDays($startDate, $endDate);
            
            // Calculate absent days from total working days
            $actualAbsentDays = $totalWorkingDays - ($presentDays + $lateArrivals);

            $acceptedDate = $application->updated_at ?? now();

            $earningsSummary = [
                "employer" => $application->job && isset($application->job->creator) 
                    ? (trim(($application->job->creator->first_name ?? '') . ' ' . ($application->job->creator->last_name ?? '')) ?: ($application->job->creator->name ?? "Your Employer"))
                    : (trim(($user->addedByUser?->first_name ?? '') . ' ' . ($user->addedByUser?->last_name ?? '')) ?: ($user->addedByUser?->name ?? ($employer['name'] ?? "Your Employer"))),
                "job_id" => $job['id'] ?? null,
                "role" => $job['title'] ?? "Job Role",

                "total_payable_amount" => $totalNetSalary,
                "payment_date" => $nextPayDate,

                "earnings_breakdown" => [
                    "base_salary" => [
                        "amount" => $totalBaseSalary,
                        "included" => $totalBaseSalary > 0
                    ],
                    "performance_bonus" => [
                        "amount" => $totalPerformanceBonus,
                        "included" => $totalPerformanceBonus > 0
                    ],
                    "overtime_pay" => [
                        "amount" => $totalOvertimePay,
                        "included" => $totalOvertimePay > 0
                    ]
                ],

                "deductions" => [
                    "provident_fund" => [
                        "amount" => abs($totalPfDeduction),
                        "included" => $totalPfDeduction != 0
                    ],
                    "income_tax" => [
                        "amount" => abs($totalTaxDeduction),
                        "included" => $totalTaxDeduction != 0
                    ],
                    "advance_repayment" => [
                        "amount" => 0,
                        "included" => false
                    ]
                ],

                "payment_status" => $filteredCurrentMonthPayments->isEmpty() && $currentMonthSalaries->isEmpty() ? 'pending' : 'paid',

                "payment_history" => $combinedHistory,

                "salary_summary" => [
                    "current_monthly_salary" => (float)(($user->userWorkInfo && $user->userWorkInfo->salary) ? $user->userWorkInfo->salary : ($job['compensation'] ?? (is_object($application->job) ? ($application->job->compensation ?? 0) : 0))),
                    "next_pay_date" => $nextPayDate,
                ],

                "attendance_summary" => [
                    "present_days" => $presentDays,
                    "late_arrivals" => $lateArrivals,
                    "absent_days" => $actualAbsentDays > 0 ? $actualAbsentDays : $absentDays,
                    "total_working_days" => $totalWorkingDays,
                    "days_in_period" => $daysInPeriod,
                    "salary_closing_date" => $closingDate,
                    "salary_period_start" => $startDate,
                    "salary_period_end" => $endDate,
                    "attendance_percentage" => $totalWorkingDays > 0 ? 
                        round((($presentDays + $lateArrivals) / $totalWorkingDays) * 100, 2) : 0
                ],

                "leave_balance" => [
                    "annual" => 15,
                    "sick" => 7,
                    "casual" => 3
                ],

                "job_details" => [
                    "job_id" => $job['id'] ?? null,
                    "application_id" => $application->id,
                    "application_status" => "accepted",
                    "city" => $job['city'] ?? "",
                    "state" => $job['state'] ?? "",
                    "street_address" => $job['street_address'] ?? "",
                    "commitment_type" => $job['commitment_type'] ?? "",
                    "compensation_type" => $job['compensation_type'] ?? "",
                ]
            ];

            $response[] = $earningsSummary;
        }


        return response()->json([
            "status" => true,
            "message" => "Earnings summary fetched successfully",
            "data" => $response
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'status' => false,
            'message' => 'Failed to fetch earnings summary: ' . $e->getMessage()
        ], 500);
    }
}

private function getWorkingDays($startDate, $endDate)
{
    $start = Carbon::parse($startDate);
    $end = Carbon::parse($endDate);
    
    $workingDays = 0;
    
    while ($start->lte($end)) {
        if ($start->isWeekday()) {
            $workingDays++;
        }
        $start->addDay();
    }
    
    return $workingDays;
}

    /**
     * Get all staff members (for dropdown selection)
     */
    public function getStaffMembers(): JsonResponse
    {
        try {
            $staffMembers = User::where('user_role_id', 2)
                ->whereHas('jobApplications', function($query) {
                    $query->where('application_status', 'accepted');
                })
                ->select('id', 'first_name', 'last_name', 'email', 'phone_number')
                ->get()
                ->map(function($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->first_name . ' ' . $user->last_name,
                        'email' => $user->email,
                        'phone' => $user->phone_number
                    ];
                });

            return response()->json([
                'status' => true,
                'message' => 'Staff members retrieved successfully',
                'data' => $staffMembers
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve staff members: ' . $e->getMessage()
            ], 500);
        }
    }


        public function getRecentPayments(Request $request): JsonResponse
    {         $user = Auth::guard('api')->user();
        try {

            $validator = Validator::make($request->all(), [
                'limit' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1',
                'status' => 'nullable|in:success,failed,pending',
                'payment_mode' => 'nullable|string',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'staff_id' => 'nullable|exists:users,id',
                'user_id' => 'nullable|exists:users,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $limit = $request->limit ?? 20;
            $page = $request->page ?? 1;
            $offset = ($page - 1) * $limit;

            // 1. Get salary payments (for employer or staff)
            $paymentsQuery = Payment::with(['user', 'staff'])->where(function($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('staff_id', $user->id);
            });
            
            if ($request->filled('staff_id')) {
                $paymentsQuery->where('staff_id', $request->staff_id);
            }
            if ($request->filled('date_from')) {
                $paymentsQuery->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $paymentsQuery->whereDate('created_at', '<=', $request->date_to);
            }

            $payments = $paymentsQuery->orderBy('created_at', 'desc')->get();

            // 2. Get staff advances (for employer or staff)
            $advancesQuery = \App\Models\StaffAdvance::with(['staff', 'employer'])->where(function($q) use ($user) {
                $q->where('employer_id', $user->id)->orWhere('staff_id', $user->id);
            });
            
            if ($request->filled('staff_id')) {
                $advancesQuery->where('staff_id', $request->staff_id);
            }
            if ($request->filled('date_from')) {
                $advancesQuery->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $advancesQuery->whereDate('created_at', '<=', $request->date_to);
            }

            $advances = $advancesQuery->orderBy('created_at', 'desc')->get();

            // 3. Unify results
            $unifiedData = collect();

            foreach ($payments as $payment) {
                $createdIso = $payment->created_at ? $payment->created_at->toISOString() : now()->toISOString();
                $unifiedData->push([
                    'id' => $payment->id,
                    'payment_id' => $payment->payment_id || `PAY-${payment->id}`,
                    'type' => 'salary',
                    'staff_id' => $payment->staff_id,
                    'amount' => (float) $payment->net_salary,
                    'net_salary' => (float) $payment->net_salary,
                    'payment_mode' => $payment->payment_mode,
                    'status' => $payment->status || 'Paid',
                    'date' => $createdIso,
                    'created_at' => $createdIso,
                    'salary_period' => $payment->salary_period,
                    'staff_name' => $payment->staff 
                        ? (trim($payment->staff->first_name . ' ' . $payment->staff->last_name) ?: ($payment->staff->name ?: 'Staff Member'))
                        : 'Unknown',
                    'staff_member' => $payment->staff ? [
                        'id' => $payment->staff_id,
                        'name' => trim($payment->staff->first_name . ' ' . $payment->staff->last_name) ?: ($payment->staff->name ?: 'Staff Member'),
                    ] : null,
                ]);
            }

            foreach ($advances as $advance) {
                $mode = 'cash';
                if (stripos($advance->remarks, 'UPI') !== false) $mode = 'upi';
                else if (stripos($advance->remarks, 'Bank') !== false) $mode = 'bank_transfer';

                $createdIso = $advance->created_at ? $advance->created_at->toISOString() : ($advance->given_date ? Carbon::parse($advance->given_date)->toISOString() : now()->toISOString());

                $unifiedData->push([
                    'id' => $advance->id,
                    'payment_id' => 'ADV-' . $advance->id,
                    'type' => 'advance',
                    'is_advance' => true,
                    'amount' => (float) $advance->amount,
                    'net_salary' => (float) $advance->amount,
                    'payment_mode' => $mode,
                    'status' => 'Advance',
                    'date' => $createdIso,
                    'created_at' => $createdIso,
                    'deduction_method' => $advance->deduction_type === 'full' ? 'one_time' : 'monthly',
                    'staff_name' => $advance->staff 
                        ? (trim($advance->staff->first_name . ' ' . $advance->staff->last_name) ?: ($advance->staff->name ?: 'Staff Member'))
                        : 'Unknown',
                    'employer_name' => $advance->employer 
                        ? (trim($advance->employer->first_name . ' ' . $advance->employer->last_name) ?: ($advance->employer->name ?: 'Employer'))
                        : 'Employer',
                    'remarks' => $advance->remarks,
                ]);
            }

            // Sort by date desc
            $sortedData = $unifiedData->sortByDesc('created_at')->values();

            return response()->json([
                'status' => true,
                'message' => 'Unified history retrieved successfully',
                'data' => $sortedData
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to retrieve payments: ' . $e->getMessage());
            \Log::error('File: ' . $e->getFile() . ' Line: ' . $e->getLine());
            
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve payments. Please try again later.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }


    public function getTodayActiveStaff(Request $request): JsonResponse
{
    try {
        // Validation for optional parameters
        $validator = Validator::make($request->all(), [
            'limit' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
            'search' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $limit = $request->limit ?? 20;
        $page = $request->page ?? 1;
        $offset = ($page - 1) * $limit;
        $today = Carbon::today();

        // Get current authenticated user (the one who added the staff)
        $authUser = Auth::guard('api')->user();
        if (!$authUser) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Build query for staff members
        $staffQuery = User::where('user_role_id', 2)
            ->where('added_by', $authUser->id)
            ->where('is_staff_added', 1)
            ->where('is_active', 1)
            ->where('is_deleted', 0)
            ->with(['lastExp', 'userWorkInfo']);

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $staffQuery->where(function($query) use ($search) {
                $query->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        // Get total count for pagination
        $total = $staffQuery->count();

        // Get paginated results
        $staffMembers = $staffQuery->orderBy('first_name', 'asc')
            ->offset($offset)
            ->limit($limit)
            ->get();

        // Get all staff IDs for batch queries
        $staffIds = $staffMembers->pluck('id')->toArray();

        // Get approved leave requests for today in one query
        $todayLeaves = LeaveRequest::whereIn('user_id', $staffIds)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->get()
            ->keyBy('user_id');

        // Get today's attendance records for all staff in one query
        $todayAttendance = Attendance::whereIn('staff_id', $staffIds)
            ->whereDate('date', $today)
            ->get()
            ->keyBy('staff_id');
        $activeStaffData = $staffMembers->map(function($staff) use ($todayLeaves, $todayAttendance, $today) {
            $hasApprovedLeave = $todayLeaves->has($staff->id);
            $hasAttendance = $todayAttendance->has($staff->id);
            
            // Get leave details if exists
            $leaveDetails = null;
            if ($hasApprovedLeave) {
                $leave = $todayLeaves->get($staff->id);
                $leaveDetails = [
                    'leave_id' => $leave->id,
                    'leave_type' => $leave->leaveType ? $leave->leaveType->name : null,
                    'start_date' => $leave->start_date,
                    'end_date' => $leave->end_date,
                    'reason' => $leave->reason,
                    'supporting_document_url' => $leave->supporting_document_url
                ];
            }

            // Get attendance details if exists
            $attendanceDetails = null;
            if ($hasAttendance) {
                $attendance = $todayAttendance->get($staff->id);
                $attendanceDetails = [
                    'attendance_id' => $attendance->id,
                    'staff_id' => $attendance->staff_id,
                    'status' => $attendance->status,
                    'check_in_time' => $attendance->check_in_time,
                    'late_minutes' => $attendance->late_minutes,
                    'description' => $attendance->description,
                    'date' => $attendance->date,
                    'processed_by' => $attendance->processed_by
                ];
            }

            return [
                'staff' => $staff,
                'name' => $staff->first_name . ' ' . $staff->last_name,
                'first_name' => $staff->first_name,
                'last_name' => $staff->last_name,
                'email' => $staff->email,
                'phone_number' => $staff->phone_number,
                'image' => $staff->image,
                'is_active_today' => !$hasApprovedLeave,
                'status' => !$hasApprovedLeave ? 'active' : 'on_leave',
                'is_attendance' => $hasAttendance,
                'attendance_status' => $hasAttendance ? $todayAttendance->get($staff->id)->status : (!$hasApprovedLeave ? 'present' : 'absent'),
                'last_work_experience' => $staff->lastExp,
                'work_info' => $staff->userWorkInfo,
                'leave_details' => $leaveDetails,
                'attendance_details' => $attendanceDetails,
                'created_at' => $staff->created_at->format('Y-m-d H:i:s')
            ];
        });

        // Separate active and on-leave staff
        $activeStaff = $activeStaffData->where('is_active_today', true)->values();
        $onLeaveStaff = $activeStaffData->where('is_active_today', false)->values();

        // Calculate attendance stats for active staff
        $attendanceStats = [
            'present' => $activeStaff->where('attendance_status', 'present')->count(),
            'absent' => $activeStaff->where('attendance_status', 'absent')->count(),
            'late' => $activeStaff->where('attendance_status', 'late')->count(),
            'not_marked' => $activeStaff->where('is_attendance', false)->count()
        ];

        $pagination = [
            'current_page' => (int) $page,
            'per_page' => (int) $limit,
            'total' => $total,
            'last_page' => ceil($total / $limit),
            'from' => $offset + 1,
            'to' => $offset + $staffMembers->count()
        ];

        $stats = [
            'total_staff' => $total,
            'active_today' => $activeStaff->count(),
            'on_leave_today' => $onLeaveStaff->count(),
            'date' => $today->format('Y-m-d'),
            'attendance_summary' => $attendanceStats
        ];

        return response()->json([
            'status' => true,
            'message' => 'Today\'s active staff list retrieved successfully',
            'data' => [
                'stats' => $stats,
                'active_staff' => $activeStaff,
                'on_leave_staff' => $onLeaveStaff
            ],
            'pagination' => $pagination
        ]);

    } catch (\Exception $e) {
        \Log::error('Failed to retrieve today\'s active staff: ' . $e->getMessage());
        
        return response()->json([
            'status' => false,
            'message' => 'Failed to retrieve staff list. Please try again later.',
            'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
        ], 500);
    }
}


/**
 * Get staff dashboard summary
 */
    public function getStaffDashboard(Request $request): JsonResponse
    {
        try {
            $user = Auth::guard('api')->user();
            
            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }

            // Get current date information
            $currentDate = Carbon::now();
            $today = $currentDate->format('Y-m-d');
            $currentMonth = $currentDate->format('Y-m');
            $lastMonth = $currentDate->copy()->subMonth()->format('Y-m');
            
            // Get staff information
            $staffInfo = [
                'name' => $user->first_name . ' ' . $user->last_name,
                'greeting' => 'Ready for a productive day!',
                'date' => Carbon::now()->format('l, F j, Y')
            ];

            // Attendance Summary (Last 30 Days)
            $thirtyDaysAgo = Carbon::now()->subDays(30)->format('Y-m-d');
            
            $attendanceRecords = Attendance::where('staff_id', $user->id)
                ->whereBetween('date', [$thirtyDaysAgo, $today])
                ->get();

            $presentDays = $attendanceRecords->where('status', 'present')->count();
            $lateDays = $attendanceRecords->where('status', 'late')->count();
            $absentDays = $attendanceRecords->where('status', 'absent')->count();
            
            $totalWorkingDays = $presentDays + $lateDays + $absentDays;
            $leaveDays = $absentDays; // Assuming absent days are leave days

            $attendanceSummary = [
                'last_30_days' => [
                    'days_present' => $presentDays + $lateDays, // Both present and late count as present
                    'total_days' => 30,
                    'leaves_taken' => $leaveDays,
                    'attendance_percentage' => $totalWorkingDays > 0 ? 
                        round((($presentDays + $lateDays) / 30) * 100, 2) : 0
                ]
            ];

            // Earnings Summary (Current Month)
            $monthStart = date('Y-m-01');
            $monthEnd = date('Y-m-t');
            
            $currentMonthPayments = Payment::where('staff_id', $user->id)
                ->where('status', 'paid')
                ->where('salary_period', 'like', '%' . date('F Y') . '%')
                ->get();
                
            $currentMonthSalaries = Salary::where('staff_id', $user->id)
                ->whereMonth('payment_date', date('m'))
                ->whereYear('payment_date', date('Y'))
                ->where('status', 'paid')
                ->get();

            // Filter out duplicate payments that exist in the salaries table
            $filteredCurrentMonthPayments = $currentMonthPayments->filter(function($payment) use ($currentMonthSalaries) {
                foreach ($currentMonthSalaries as $salary) {
                    $timeDiff = abs(strtotime($payment->created_at) - strtotime($salary->created_at));
                    if ($timeDiff < 60 && abs($payment->net_salary - $salary->net_salary) < 0.01) {
                        return false;
                    }
                }
                return true;
            });

            $totalEarnings =
                $filteredCurrentMonthPayments->sum(fn($payment) => max(0, (float) $payment->net_salary)) +
                $currentMonthSalaries->sum(fn($salary) => max(0, (float) $salary->net_salary));
            
            // If no payments/salaries found for current month, earnings are 0
            // (base salary is potential earnings, not actual earnings)

            $earningsSummary = [
                'total_earnings' => (float) $totalEarnings,
                'currency' => 'INR',
                'period' => 'this month',
                'trend' => 'up' // You can calculate this by comparing with previous month
            ];

            // Leave Requests (Last Month)
            $lastMonthStart = Carbon::now()->subMonth()->startOfMonth()->format('Y-m-d');
            $lastMonthEnd = Carbon::now()->subMonth()->endOfMonth()->format('Y-m-d');
            
            $leaveRequestsLastMonth = LeaveRequest::where('user_id', $user->id)
                ->whereBetween('start_date', [$lastMonthStart, $lastMonthEnd])
                ->get();

            $leaveSummary = [
                'last_month' => [
                    'total_requests' => $leaveRequestsLastMonth->count(),
                    'approved_requests' => $leaveRequestsLastMonth->where('status', 'approved')->count(),
                    'pending_requests' => $leaveRequestsLastMonth->where('status', 'pending')->count(),
                    'rejected_requests' => $leaveRequestsLastMonth->where('status', 'rejected')->count()
                ]
            ];

            // New Job Matches
            $newJobMatches = JobApplication::where('user_id', $user->id)
                ->where('application_status', 'pending')
                ->with('job')
                ->limit(3)
                ->get()
                ->map(function($application) {
                    return [
                        'job_id' => $application->job_id,
                        'title' => $application->job->title ?? 'Job Title',
                        'employer' => $application->job->creator->name ?? 'Employer',
                        'compensation' => $application->job->compensation ?? 0,
                        'location' => ($application->job->city ?? '') . ', ' . ($application->job->state ?? ''),
                        'applied_date' => $application->created_at->format('M j, Y')
                    ];
                });

            // Today's Attendance Status
            $todayAttendance = Attendance::where('staff_id', $user->id)
                ->whereDate('date', $today)
                ->first();

            $todayStatus = [
                'has_attendance' => !is_null($todayAttendance),
                'status' => $todayAttendance ? $todayAttendance->status : 'not_marked',
                'check_in_time' => $todayAttendance ? $todayAttendance->check_in_time : null,
                'late_minutes' => $todayAttendance ? $todayAttendance->late_minutes : 0
            ];

            // Upcoming Leaves
            $upcomingLeaves = LeaveRequest::where('user_id', $user->id)
                ->where('status', 'approved')
                ->whereDate('start_date', '>=', $today)
                ->orderBy('start_date', 'asc')
                ->limit(2)
                ->get()
                ->map(function($leave) {
                    return [
                        'leave_id' => $leave->id,
                        'leave_type' => $leave->leaveType->name ?? 'Leave',
                        'start_date' => $leave->start_date,
                        'end_date' => $leave->end_date,
                        'reason' => $leave->reason,
                        'duration_days' => Carbon::parse($leave->start_date)->diffInDays($leave->end_date) + 1
                    ];
                });

            // Recent Payments
            $recentPayments = Payment::where('staff_id', $user->id)
                // ->where('status', 'completed')
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get()
                ->map(function($payment) {
                    return [
                        'payment_id' => $payment->id,
                        'amount' => max(0, (float) $payment->net_salary),
                        'period' => $payment->salary_period,
                        'payment_date' => $payment->updated_at->format('M j, Y'),
                        'payment_method' => $payment->payment_mode,
                        'status' => $payment->status
                    ];
                });

            // Compile dashboard data
            $dashboardData = [
                'staff_info' => $staffInfo,
                'attendance_summary' => $attendanceSummary,
                'earnings_summary' => $earningsSummary,
                'leave_summary' => $leaveSummary,
                'job_matches' => [
                    'count' => $newJobMatches->count(),
                    'jobs' => $newJobMatches
                ],
                'today_status' => $todayStatus,
                'upcoming_leaves' => $upcomingLeaves,
                'recent_payments' => $recentPayments,
                'quick_actions' => [
                    'apply_leave' => true,
                    'view_jobs' => true,
                    'view_attendance' => true,
                    'view_earnings' => true
                ]
            ];

            return response()->json([
                'status' => true,
                'message' => 'Staff dashboard data retrieved successfully',
                'data' => $dashboardData
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to retrieve staff dashboard: ' . $e->getMessage());
            
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve dashboard data. Please try again later.',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    
    }


    public function advanceWithdraw(Request $request)
    {
        try {
            // ✅ Validation
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'amount' => 'required|numeric|min:0',
                'should_deduct' => 'nullable|boolean',
                'deduction_method' => 'nullable|string|in:monthly,one_time,installments',
                'num_installments' => 'nullable|integer|min:1|max:24',
                'monthly_deduction' => 'nullable|numeric|min:0',
                'payment_mode' => 'nullable|string|in:cash,upi,bank_transfer'
            ]);

            // ✅ Find user
            $user = User::find($request->user_id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $shouldDeduct = $request->input('should_deduct', true);
            $deductionMethod = $request->input('deduction_method', 'monthly');
            $paymentMode = $request->input('payment_mode', 'cash');
            $status = $request->input('status');
            
            if (!$status) {
                $status = (strtolower($paymentMode) === 'cash') ? 'paid' : 'pending';
            }
            
            $employerId = Auth::guard('api')->id();

            // ✅ Only update advance_withdraw_amount if deduction is enabled
            if ($shouldDeduct) {
                $user->advance_withdraw_amount += $request->amount;
            }

            // mark added by user
            $user->advance_withdraw_added_by = $employerId;
            $user->save();

            // ✅ Map frontend deduction types to backend enum values
            $mappedDeductionType = 'manual';
            if ($deductionMethod === 'one_time') {
                $mappedDeductionType = 'full';
            } elseif ($deductionMethod === 'installments' || $deductionMethod === 'monthly') {
                $mappedDeductionType = 'installment';
            }

            // ✅ Also create StaffAdvance record so staff can see it in My Advances
            $advanceId = null;
            try {
                $numInstallments = $request->input('num_installments');
                $monthlyDeduction = $request->input('monthly_deduction');

                // Calculate installment_amount: monthly deduction amount if installments, else full amount
                if ($deductionMethod === 'installments' && $numInstallments && $numInstallments > 0) {
                    $installmentAmount = $monthlyDeduction ?: ceil($request->amount / $numInstallments);
                } else {
                    $installmentAmount = $request->amount;
                }

                $advanceRecord = \App\Models\StaffAdvance::create([
                    'staff_id'           => $user->id,
                    'employer_id'        => $employerId,
                    'amount'             => $request->amount,
                    'remaining_balance'  => $shouldDeduct ? $request->amount : 0,
                    'deduction_type'     => $mappedDeductionType,
                    'installment_amount' => $installmentAmount,
                    'num_installments'   => ($deductionMethod === 'installments' && $numInstallments) ? $numInstallments : null,
                    'given_date'         => now()->toDateString(),
                    'status'             => $status === 'paid' ? ($shouldDeduct ? 'active' : 'closed') : 'pending',
                    'remarks'            => 'Paid via ' . strtoupper($paymentMode),
                ]);
                $advanceId = $advanceRecord->id;
            } catch (\Exception $e) {
                \Log::warning('StaffAdvance record creation failed: ' . $e->getMessage());
                // non-fatal — advance_withdraw_amount already updated
            }

            // ✅ Create notification for staff with employer name (in-app + FCM push only)
            try {
                $employerObj = Auth::guard('api')->user();
                $employerName = $employerObj ? (trim($employerObj->first_name . ' ' . $employerObj->last_name) ?: ($employerObj->name ?: 'Your employer')) : 'Your employer';
                \App\Services\NotificationService::send(
                    $user->id,
                    'Advance Payment Received',
                    "You have received an advance of ₹" . number_format($request->amount, 2) . " from {$employerName}" . ($shouldDeduct ? ". This will be deducted from your salary ($deductionMethod)." : "."),
                    'advance_payment',
                    ['skip_whatsapp' => true, 'skip_sms' => true]
                );
            } catch (\Exception $e) {
                \Log::warning('Advance notification failed: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => $shouldDeduct 
                    ? "Advance payment processed via " . strtoupper($paymentMode) . ". Amount will be deducted from salary ($deductionMethod)."
                    : "Advance payment processed via " . strtoupper($paymentMode) . " without salary deduction.",
                'data' => [
                    'user_id' => $user->id,
                    'advance_withdraw_amount' => $user->advance_withdraw_amount,
                    'should_deduct' => $shouldDeduct,
                    'deduction_method' => $deductionMethod,
                    'num_installments' => ($deductionMethod === 'installments' && $numInstallments) ? $numInstallments : null,
                    'installment_amount' => ($deductionMethod === 'installments' && $numInstallments) ? ($monthlyDeduction ?: ceil($request->amount / $numInstallments)) : null,
                    'payment_mode' => $paymentMode,
                    'advance_id' => $advanceId ?? null,
                    'amount' => (float) $request->amount,
                    'given_date' => now()->toDateString(),
                    'staff_name' => trim($user->first_name . ' ' . $user->last_name) ?: ($user->name ?: 'Staff'),
                    'employer_name' => trim(Auth::guard('api')->user()->first_name . ' ' . Auth::guard('api')->user()->last_name) ?: (Auth::guard('api')->user()->name ?: 'Employer'),
                    'receipt_id' => 'ADV_' . strtoupper(uniqid()),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }


    public function getAdminDashboard(Request $request)
    {
        // try {
            $user = Auth::guard('api')->user();
            
            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }
 
            $thirtyDaysAgo = Carbon::now()->subDays(30)->format('Y-m-d');
            $sevenDaysAgo = Carbon::now()->subDays(7)->format('Y-m-d');
            $currentDate = Carbon::now();
            $today = $currentDate->format('Y-m-d');
            
            $staffCount = User::where('user_role_id', 2)->where('is_deleted', 0)->count();
            $employerCount = User::where('user_role_id', 3)->where('is_deleted', 0)->count();
            
            $staffMonthCount = User::where('user_role_id', 2)->whereBetween('created_at', [$thirtyDaysAgo, $today])->count();
            $employerMonthCount = User::where('user_role_id', 3)->whereBetween('created_at', [$thirtyDaysAgo, $today])->count();
            // Compile dashboard data

            $recentSubscriptions = SubscriptionUser::with('subscription')
                ->whereBetween('created_at', [$thirtyDaysAgo, $today])
                ->get();
            $allSubscriptions = SubscriptionUser::with('subscription')->get();
            $activeMemberships = SubscriptionUser::where('status', 'active')
                ->where(function ($query) {
                    $query->whereNull('end_date')
                        ->orWhere('end_date', '>=', now());
                })
                ->count();
            $pendingVerifications = KycVerification::where(function ($query) {
                $query->whereNull('status')
                    ->orWhere('status', 'pending');
            })->count();

            $subscriptionUsers = $recentSubscriptions->count();
            $subscriptionRevenue = $recentSubscriptions->sum(fn($sub) => $this->getEffectiveSubscriptionAmount($sub));
            $totalSubscriptionRevenue = $allSubscriptions->sum(fn($sub) => $this->getEffectiveSubscriptionAmount($sub));
            
            $newUserWeekCount = User::whereBetween('created_at', [$sevenDaysAgo, $today])->count();
            $newUserMonthCount = User::whereBetween('created_at', [$thirtyDaysAgo, $today])->count();

            $startDate = Carbon::now()->subMonths(11)->startOfMonth();
            $endDate = Carbon::now()->endOfMonth();

            $userMonthGrowth = User::select(
                    DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                    DB::raw('COUNT(*) as total')
                )
                ->whereBetween('created_at', [$startDate, $endDate])
                ->groupBy('month')
                ->orderBy('month', 'ASC')
                ->get()
                ->keyBy('month');

            $startDate = Carbon::now()->subDays(29)->startOfDay();
            $endDate = Carbon::now()->endOfDay();

            $dailySignups = User::select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(*) as total')
                )
                ->whereBetween('created_at', [$startDate, $endDate])
                ->groupBy('date')
                ->orderBy('date', 'ASC')
                ->get()
                ->keyBy('date'); 
                
            // reveue growth
            $startDate = Carbon::now()->subMonths(11)->startOfMonth();
            $endDate = Carbon::now()->endOfMonth();
            $revenueMonthGrowth = SubscriptionUser::with('subscription')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get()
                ->groupBy(function ($subscriptionUser) {
                    return Carbon::parse($subscriptionUser->created_at)->format('Y-m');
                })
                ->map(function ($monthSubscriptions) {
                    return [
                        'total_revenue' => $monthSubscriptions->sum(fn($sub) => $this->getEffectiveSubscriptionAmount($sub)),
                    ];
                });
            $freeUser = $allSubscriptions->filter(fn($sub) => $this->getEffectiveSubscriptionAmount($sub) <= 0)->count();
            $paidUser = $allSubscriptions->filter(fn($sub) => $this->getEffectiveSubscriptionAmount($sub) > 0)->count();
                
            $jobToday = Job::whereDate('created_at', Carbon::today())->count();
           
            $jobTotal = Job::count();
             
            $jobApplicationsToday = JobApplication::whereDate('created_at', Carbon::today())->count();
            $jobApplicationsTotal = JobApplication::count();

            // Compile dashboard data

            $totalSalaryProcessed = Salary::where('status', 'paid')->sum('net_salary');
            $salaryPaymentsDone = Salary::where('status', 'paid')->count();
            $pendingPayments = DB::table('salaries')->where('status', 'pending')->count();
            
            $dashboardData = [
                'overall_stats' => [
                    'total_staff' => $staffCount,
                    'total_employers' => $employerCount,
                    'staff_this_month' => $staffMonthCount,
                    'employers_this_month' => $employerMonthCount,
                    'new_subscriptions_this_month' => $subscriptionUsers,
                    'active_memberships' => $activeMemberships,
                    'pending_verifications' => $pendingVerifications,
                    'subscription_revenue_this_month' => (float) $subscriptionRevenue,
                    'total_subscription_revenue' => (float) $totalSubscriptionRevenue,
                    'new_users_last_week' => $newUserWeekCount,
                    'new_users_last_month' => $newUserMonthCount,
                    // You can add more overall stats here
                ],
                'user_month_growth' => $userMonthGrowth,
                'daily_signups' => $dailySignups,
                'revenue_month_growth' => $revenueMonthGrowth,
                'subscription_breakdown' => [
                    'free_users' => $freeUser,
                    'paid_users' => $paidUser
                ],
                'job_stats' => [
                    'jobs_posted_today' => $jobToday,
                    'total_jobs' => $jobTotal,
                    'job_applications_today' => $jobApplicationsToday,
                    'total_job_applications' => $jobApplicationsTotal
                ],
                'salary_stats' => [
                    'total_salary_processed' => (float) $totalSalaryProcessed,
                    'salary_payments_done' => $salaryPaymentsDone,
                    'pending_payments' => $pendingPayments,
                ]
            ];

            return response()->json([
                'status' => true,
                'message' => 'Staff dashboard data retrieved successfully',
                'data' => $dashboardData
            ]);

        // } catch (\Exception $e) {
        //     \Log::error('Failed to retrieve staff dashboard: ' . $e->getMessage());
            
        //     return response()->json([
        //         'status' => false,
        //         'message' => 'Failed to retrieve dashboard data. Please try again later.',
        //         'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
        //     ], 500);
        // }
    
    }

    /**
     * Owner-side: Initiate RazorpayX payout for a paid salary
     */
    public function sendToBank(Request $request, $id, RazorpayXService $razorpayXService)
    {
        $request->validate([
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'mode' => 'nullable|string|in:bank_transfer,neft,imps,rtgs,upi',
            'narration' => 'nullable|string|max:255',
        ]);

        if (!$razorpayXService->isConfigured()) {
            return response()->json([
                'status' => false,
                'message' => 'RazorpayX credentials are not configured yet.',
            ], 422);
        }

        $userId = Auth::guard('api')->user()->id;
        $salary = Salary::with(['staff.bankAccounts', 'houseowner'])->findOrFail($id);

        if ($salary->houseowner_id != $userId) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        if (strtolower((string) $salary->status) !== 'paid') {
            return response()->json([
                'status' => false,
                'message' => 'Salary must be marked as paid before sending to bank.',
            ], 422);
        }

        if ((float) $salary->net_salary <= 0) {
            return response()->json([
                'status' => false,
                'message' => 'Salary amount must be greater than zero.',
            ], 422);
        }

        $ACTIVE_STATUSES = ['initiated', 'queued', 'pending', 'processing', 'processed', 'sent'];
        $payout = null;

        try {
            $payout = DB::transaction(function () use ($request, $salary, $userId, $ACTIVE_STATUSES) {
                $lockedSalary = Salary::whereKey($salary->id)->lockForUpdate()->firstOrFail();

                $hasActive = SalaryPayout::where('salary_id', $lockedSalary->id)
                    ->whereIn('status', $ACTIVE_STATUSES)
                    ->exists();

                if ($hasActive) {
                    throw new \RuntimeException('A payout is already in progress or completed for this salary.');
                }

                $selectedBankAccount = null;
                if ($request->filled('bank_account_id')) {
                    $selectedBankAccount = BankAccount::where('id', $request->bank_account_id)
                        ->where('user_id', $lockedSalary->staff_id)
                        ->first();
                }

                if (!$selectedBankAccount) {
                    $selectedBankAccount = $lockedSalary->staff?->bankAccounts?->firstWhere('is_set', 1)
                        ?? $lockedSalary->staff?->bankAccounts?->sortByDesc('id')->first();
                }

                if (!$selectedBankAccount) {
                    throw new \RuntimeException('No bank account found for this staff. Please ask staff to add a bank account first.');
                }

                return SalaryPayout::create([
                    'salary_id' => $lockedSalary->id,
                    'staff_id' => $lockedSalary->staff_id,
                    'houseowner_id' => $lockedSalary->houseowner_id,
                    'bank_account_id' => $selectedBankAccount->id,
                    'requested_by' => $userId,
                    'amount' => $lockedSalary->net_salary,
                    'currency' => 'INR',
                    'mode' => strtolower((string) $request->input('mode', 'bank_transfer')),
                    'purpose' => 'salary',
                    'status' => 'initiated',
                    'idempotency_key' => (string) Str::uuid(),
                    'narration' => $request->input('narration', 'Salary payout'),
                    'queue_if_low_balance' => true,
                    'requested_at' => now(),
                ]);
            });
        } catch (\Throwable $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        $payout->load(['bankAccount.user', 'salary.staff.bankAccounts', 'salary.houseowner']);
        $salary = $payout->salary;
        $bankAccount = $payout->bankAccount;

        if ($bankAccount && !$bankAccount->relationLoaded('user')) {
            $bankAccount->setRelation('user', $salary->staff);
        }

        $previousPayout = SalaryPayout::where('salary_id', $salary->id)
            ->where('id', '!=', $payout->id)
            ->latest()
            ->first();

        $contactId = null;
        $fundAccountId = null;
        $payoutResult = null;

        try {
            if ($previousPayout?->contact_id && $previousPayout->staff_id === $salary->staff_id) {
                $contactId = $previousPayout->contact_id;
            } else {
                $contactResult = $razorpayXService->createContact($salary->staff);
                if (!$contactResult['status']) {
                    throw new \RuntimeException($contactResult['message'] ?? 'Failed to create contact.');
                }
                $contactId = $contactResult['data']['id'] ?? null;
            }

            if (!$contactId) {
                throw new \RuntimeException('RazorpayX contact id was not returned.');
            }

            if ($previousPayout?->fund_account_id && $previousPayout->bank_account_id === $bankAccount->id) {
                $fundAccountId = $previousPayout->fund_account_id;
            } else {
                $fundAccountResult = $razorpayXService->createFundAccount($bankAccount, $contactId);
                if (!$fundAccountResult['status']) {
                    throw new \RuntimeException($fundAccountResult['message'] ?? 'Failed to create fund account.');
                }
                $fundAccountId = $fundAccountResult['data']['id'] ?? null;
            }

            if (!$fundAccountId) {
                throw new \RuntimeException('RazorpayX fund account id was not returned.');
            }

            $idempotencyKey = 'salary-' . $salary->id . '-payout-' . $payout->id;
            $referenceId = 'salary_' . $salary->id . '_payout_' . $payout->id;

            $payoutResult = $razorpayXService->createPayout(
                $salary,
                $bankAccount,
                $fundAccountId,
                $idempotencyKey,
                [
                    'reference_id' => $referenceId,
                    'mode' => strtolower((string) $request->input('mode', 'bank_transfer')),
                    'purpose' => 'salary',
                    'narration' => $request->input('narration', 'Salary payout'),
                    'queue_if_low_balance' => true,
                ]
            );

            if (!$payoutResult['status']) {
                throw new \RuntimeException($payoutResult['message'] ?? 'Failed to create payout.');
            }

            $payload = $payoutResult['data'] ?? [];
            $payout->update([
                'contact_id' => $contactId,
                'fund_account_id' => $fundAccountId,
                'payout_id' => $payload['id'] ?? null,
                'reference_id' => $payload['reference_id'] ?? $referenceId,
                'status' => $payload['status'] ?? 'queued',
                'request_payload' => $payoutResult['request'] ?? null,
                'response_payload' => $payload,
                'processed_at' => in_array(($payload['status'] ?? ''), ['processed', 'queued', 'pending', 'processing'], true) ? now() : null,
                'utr' => $payload['utr'] ?? null,
                'error_message' => null,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Payout initiated successfully. Funds will be transferred shortly.',
                'data' => [
                    'payout' => $payout->fresh(['bankAccount']),
                    'status' => $payload['status'] ?? 'queued',
                ],
            ], 200);
        } catch (\Throwable $e) {
            $failedPayload = is_array($payoutResult) ? $payoutResult : [];
            $payout->update([
                'contact_id' => $contactId ?? null,
                'fund_account_id' => $fundAccountId ?? null,
                'payout_id' => $failedPayload['data']['id'] ?? null,
                'reference_id' => $failedPayload['data']['reference_id'] ?? $payout->reference_id,
                'status' => 'failed',
                'request_payload' => $failedPayload['request'] ?? $payout->request_payload,
                'response_payload' => $failedPayload['response'] ?? $payout->response_payload,
                'error_message' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Owner-side: Get payout history for a salary
     */
    public function payoutHistory($id)
    {
        $userId = Auth::guard('api')->user()->id;
        $salary = Salary::with([
            'staff.bankAccounts',
            'houseowner',
            'payouts' => function ($payoutQuery) {
                $payoutQuery->with('bankAccount')->latest();
            },
        ])->findOrFail($id);

        if ($salary->houseowner_id != $userId) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        return response()->json([
            'status' => true,
            'message' => 'Payout history retrieved successfully',
            'data' => $salary,
        ]);
    }

    /**
     * Get monthly salary slip for a salary record.
     * Slip shows Earnings (base/bonus/overtime) and Deductions (PF + IT only).
     */
    public function getSalarySlip($id)
    {
        try {
            $salary = Salary::with(['staff', 'houseowner'])->find($id);

            if (!$salary) {
                return response()->json([
                    'status' => false,
                    'message' => 'Salary slip not found',
                ], 404);
            }

            $staff = $salary->staff;
            $owner = $salary->houseowner;

            $periodStart = $salary->salary_period_start ? Carbon::parse($salary->salary_period_start)->format('d/m/Y') : null;
            $periodEnd = $salary->salary_period_end ? Carbon::parse($salary->salary_period_end)->format('d/m/Y') : null;

            $slip = [
                'slip_id' => 'SLP-' . str_pad($salary->id, 6, '0', STR_PAD_LEFT),
                'salary_id' => $salary->id,
                'period' => $salary->salary_period_start
                    ? Carbon::parse($salary->salary_period_start)->format('F Y')
                    : (Carbon::parse($salary->payment_date)->format('F Y')),
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'payment_date' => Carbon::parse($salary->payment_date)->format('d/m/Y'),
                'status' => $salary->status,
                'payment_mode' => $salary->payment_mode,
                'staff' => [
                    'id' => $staff->id ?? null,
                    'name' => $staff ? (trim(($staff->first_name ?? '') . ' ' . ($staff->last_name ?? '')) ?: ($staff->name ?? 'Staff Member')) : 'Staff Member',
                    'phone' => $staff->phone_number ?? null,
                    'upi_id' => $staff->upi_id ?? null,
                ],
                'employer' => [
                    'id' => $owner->id ?? null,
                    'name' => $owner ? (trim(($owner->first_name ?? '') . ' ' . ($owner->last_name ?? '')) ?: ($owner->name ?? 'Employer')) : 'Employer',
                ],
                'earnings' => [
                    'basic_salary' => (float) $salary->basic_salary,
                    'performance_bonus' => (float) ($salary->performative_allowance ?? 0),
                    'overtime_pay' => (float) ($salary->over_time_allowance ?? 0),
                    'total_earnings' => (float) $salary->basic_salary + (float) ($salary->performative_allowance ?? 0) + (float) ($salary->over_time_allowance ?? 0),
                ],
                'deductions' => [
                    'income_tax' => (float) ($salary->tax ?? 0),
                    'provident_fund' => (float) ($salary->pf_deduction ?? 0),
                    'total_deductions' => (float) ($salary->tax ?? 0) + (float) ($salary->pf_deduction ?? 0),
                ],
                'net_salary' => (float) $salary->net_salary,
                'currency' => 'INR',
            ];

            return response()->json([
                'status' => true,
                'message' => 'Salary slip retrieved successfully',
                'data' => $slip,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Failed to retrieve salary slip: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get complete payment and salary history for authenticated staff.
     */
    public function getStaffPaymentHistory(Request $request)
    {
        try {
            $user = Auth::guard('api')->user();
            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            // 1. Get all salaries for this staff
            $salaries = Salary::where('staff_id', $user->id)
                ->with(['houseowner'])
                ->orderBy('payment_date', 'desc')
                ->get();

            // 2. Get all payments for this staff
            $payments = Payment::where('staff_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            // 3. Get all advances for this staff
            $advances = StaffAdvance::where('staff_id', $user->id)
                ->with(['employer'])
                ->orderBy('given_date', 'desc')
                ->get();

            $allRecords = [];
            $staffName = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: ($user->name ?? 'Staff Member');

            // Map Salaries
            foreach ($salaries as $s) {
                $employerName = $s->houseowner
                    ? (trim(($s->houseowner->first_name ?? '') . ' ' . ($s->houseowner->last_name ?? '')) ?: ($s->houseowner->name ?? 'Employer'))
                    : 'Employer';
                $payDate = $s->payment_date ? Carbon::parse($s->payment_date)->format('Y-m-d') : ($s->created_at ? $s->created_at->format('Y-m-d') : date('Y-m-d'));
                $month = $s->salary_period_start ? Carbon::parse($s->salary_period_start)->format('F Y') : Carbon::parse($payDate)->format('F Y');
                $amount = max(0, (float)$s->net_salary);

                $allRecords[] = [
                    'id' => 'sal_' . $s->id,
                    'amount' => $amount,
                    'status' => ucfirst($s->status ?: 'Paid'),
                    'type' => 'salary',
                    'month' => $month,
                    'date' => $payDate,
                    'paid_by' => $employerName,
                    'payment_mode' => $s->payment_mode ?: 'Cash',
                    'raw' => [
                        'id' => $s->id,
                        'payment_id' => 'SAL-' . $s->id,
                        'amount' => $amount,
                        'net_salary' => $amount,
                        'basic_salary' => (float)$s->basic_salary,
                        'base_salary' => (float)$s->basic_salary,
                        'monthly_salary' => (float)$s->basic_salary,
                        'performance_bonus' => (float)($s->performative_allowance ?? 0),
                        'overtime_pay' => (float)($s->over_time_allowance ?? 0),
                        'tax_deduction' => (float)($s->tax ?? 0),
                        'pf_deduction' => (float)($s->pf_deduction ?? 0),
                        'advance_payment' => (float)($s->advance_payment ?? 0),
                        'status' => ucfirst($s->status ?: 'Paid'),
                        'staff_name' => $staffName,
                        'employer_name' => $employerName,
                        'salary_period' => $month,
                        'payment_mode' => $s->payment_mode ?: 'Cash',
                        'created_at' => $payDate,
                        'salary_breakdown' => [
                            'base_salary' => (float)$s->basic_salary,
                            'performance_bonus' => (float)($s->performative_allowance ?? 0),
                            'overtime_pay' => (float)($s->over_time_allowance ?? 0),
                            'tax_deduction' => (float)($s->tax ?? 0),
                            'pf_deduction' => (float)($s->pf_deduction ?? 0),
                            'advance_payment' => (float)($s->advance_payment ?? 0),
                        ],
                    ]
                ];
            }

            // Map Payments
            foreach ($payments as $p) {
                $payDate = $p->created_at ? $p->created_at->format('Y-m-d') : date('Y-m-d');
                $month = $p->salary_period ?: Carbon::parse($payDate)->format('F Y');
                $amount = max(0, (float)$p->net_salary ?: (float)$p->amount);

                $allRecords[] = [
                    'id' => 'pay_' . $p->id,
                    'amount' => $amount,
                    'status' => ucfirst($p->status ?: 'Paid'),
                    'type' => (float)($p->advance_payment ?? 0) > 0 ? 'advance' : 'salary',
                    'month' => $month,
                    'date' => $payDate,
                    'paid_by' => $p->full_name ?: 'Employer',
                    'payment_mode' => $p->payment_mode ?: 'Cash',
                    'raw' => [
                        'id' => $p->id,
                        'payment_id' => $p->payment_id ?: ('PAY-' . $p->id),
                        'amount' => $amount,
                        'net_salary' => $amount,
                        'basic_salary' => (float)($p->base_salary ?? 0),
                        'base_salary' => (float)($p->base_salary ?? 0),
                        'monthly_salary' => (float)($p->base_salary ?? 0),
                        'performance_bonus' => (float)($p->performance_bonus ?? 0),
                        'overtime_pay' => (float)($p->overtime_pay ?? 0),
                        'tax_deduction' => (float)($p->tax_deduction ?? 0),
                        'advance_payment' => (float)($p->advance_payment ?? 0),
                        'status' => ucfirst($p->status ?: 'Paid'),
                        'staff_name' => $staffName,
                        'employer_name' => $p->full_name ?: 'Employer',
                        'salary_period' => $month,
                        'payment_mode' => $p->payment_mode ?: 'Cash',
                        'created_at' => $payDate,
                        'salary_breakdown' => [
                            'base_salary' => (float)($p->base_salary ?? 0),
                            'performance_bonus' => (float)($p->performance_bonus ?? 0),
                            'overtime_pay' => (float)($p->overtime_pay ?? 0),
                            'tax_deduction' => (float)($p->tax_deduction ?? 0),
                            'advance_payment' => (float)($p->advance_payment ?? 0),
                        ],
                    ]
                ];
            }

            // Map Advances
            foreach ($advances as $adv) {
                $advEmployer = $adv->employer
                    ? (trim(($adv->employer->first_name ?? '') . ' ' . ($adv->employer->last_name ?? '')) ?: ($adv->employer->name ?? 'Employer'))
                    : 'Employer';
                $advDate = $adv->given_date ? Carbon::parse($adv->given_date)->format('Y-m-d') : ($adv->created_at ? $adv->created_at->format('Y-m-d') : date('Y-m-d'));
                $advAmount = max(0, (float)$adv->amount);

                $allRecords[] = [
                    'id' => 'adv_' . $adv->id,
                    'amount' => $advAmount,
                    'status' => $adv->status === 'active' ? 'Active' : 'Cleared',
                    'type' => 'advance',
                    'month' => Carbon::parse($advDate)->format('F Y'),
                    'date' => $advDate,
                    'paid_by' => $advEmployer,
                    'payment_mode' => 'Cash / Transfer',
                    'raw' => [
                        'id' => $adv->id,
                        'payment_id' => 'ADV-' . $adv->id,
                        'amount' => $advAmount,
                        'net_salary' => $advAmount,
                        'advance_payment' => $advAmount,
                        'status' => $adv->status === 'active' ? 'Active' : 'Cleared',
                        'staff_name' => $staffName,
                        'employer_name' => $advEmployer,
                        'salary_period' => Carbon::parse($advDate)->format('F Y'),
                        'payment_mode' => 'Cash / Transfer',
                        'created_at' => $advDate,
                        'salary_breakdown' => [
                            'advance_payment' => $advAmount,
                        ],
                    ]
                ];
            }

            // Sort allRecords by date descending
            usort($allRecords, function ($a, $b) {
                return strcmp($b['date'], $a['date']);
            });

            // Deduplicate by date + amount + type to avoid showing identical payments twice
            $unique = [];
            $seen = [];
            foreach ($allRecords as $item) {
                $key = $item['date'] . '_' . $item['amount'] . '_' . $item['type'];
                if (!isset($seen[$key])) {
                    $seen[$key] = true;
                    $unique[] = $item;
                }
            }

            return response()->json([
                'status' => true,
                'message' => 'Staff payment history retrieved successfully',
                'data' => $unique
            ]);

        } catch (\Exception $e) {
            \Log::error('getStaffPaymentHistory Error: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Failed to fetch payment history: ' . $e->getMessage()
            ], 500);
        }
    }
}


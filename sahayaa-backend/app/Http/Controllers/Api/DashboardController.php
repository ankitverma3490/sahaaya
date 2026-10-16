<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;
use App\Models\Job;
use App\Models\JobApplication;
use App\Models\Attendance; 
use App\Models\SubscriptionUser; 
use App\Models\KycVerification;
use Carbon\Carbon; 
use Illuminate\Support\Facades\Validator;
use App\Models\Salary;
use Illuminate\Support\Facades\DB;


class DashboardController extends Controller
{
    private function getPaidSubscriptionEntries($startDate, $endDate)
    {
        return SubscriptionUser::with('subscription')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('payment_status', ['paid', 'completed'])
            ->get();
    }

    private function resolveSubscriptionRevenue($subscriptionUser)
    {
        $storedAmount = (float) ($subscriptionUser->amount ?? 0);
        if ($storedAmount > 0) {
            return $storedAmount;
        }

        return (float) ($subscriptionUser->subscription?->price ?? 0);
    }

    private function resolveRoleIds()
    {
        $staffRole = Role::where('slug', 'staff')->first();
        $houseOwnerRole = Role::where('slug', 'householder')->first();

        return [
            'staff_role_id' => $staffRole?->id ?? 2,
            'house_owner_role_id' => $houseOwnerRole?->id ?? 3,
        ];
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $roleIds = $this->resolveRoleIds();
        $staffDataCount = $roleIds['staff_role_id']
            ? User::where('user_role_id', $roleIds['staff_role_id'])->where('is_deleted', 0)->count()
            : 0;
        $houseOwnerDataCount = $roleIds['house_owner_role_id']
            ? User::where('user_role_id', $roleIds['house_owner_role_id'])->where('is_deleted', 0)->count()
            : 0;
        $openJobCount = Job::whereIn('status', ['open', 'active'])->count();
        $presentAttendanceCount = Attendance::where('date', Carbon::today())->where('status', 'present')->count();
        $absentAttendanceCount = Attendance::where('date', Carbon::today())->where('status', 'absent')->count();
        
        $leaveCount = Attendance::where('date', Carbon::today())->where('status', 'leave')->count();
        $totalAttendance = $presentAttendanceCount + $absentAttendanceCount + $leaveCount;
        $attendanceRate = $totalAttendance > 0  ? round(($presentAttendanceCount / $totalAttendance) * 100, 2) : 0;
        
        $data = [
            'staff_count' => $staffDataCount,
            'job_count' => $openJobCount,
            'house_owner_count' => $houseOwnerDataCount,
            'present_attendance_count' => $presentAttendanceCount,
            'absent_attendance_count' => $absentAttendanceCount,
            'leave' => $leaveCount,
            'overall_attendance_rate' => $attendanceRate
        ];
        return response()->json([
            'status' => 'success',
            'data' => $data,
            'message' => 'Dashboard data retrieved successfully'
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }

    public function report(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:monthly,yearly',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $type = $request->type;
        $roleIds = $this->resolveRoleIds();

        // 1. Total platform metrics (shown in top summary cards)
        $staffDataCount = $roleIds['staff_role_id']
            ? User::where('user_role_id', $roleIds['staff_role_id'])->where('is_deleted', 0)->count()
            : 0;
        
        $houseOwnerDataCount = $roleIds['house_owner_role_id']
            ? User::where('user_role_id', $roleIds['house_owner_role_id'])->where('is_deleted', 0)->count()
            : 0;

        $openJobCount = Job::count();

        // Total active/paid subscription revenue
        $allPaidSubscriptions = SubscriptionUser::with('subscription')
            ->whereIn('payment_status', ['paid', 'completed'])
            ->get();
        $memberSubscriptionRevenue = (float) $allPaidSubscriptions->sum(function ($subscriptionUser) {
            return $this->resolveSubscriptionRevenue($subscriptionUser);
        });

        $memberSalarySum = (float) Salary::where('status', 'paid')->sum('net_salary');
        
        $presentAttendanceCount = Attendance::where('status', 'present')->count();
        $absentAttendanceCount = Attendance::where('status', 'absent')->count();
        $leaveCount = Attendance::where('status', 'leave')->count();
        $totalAttendance = $presentAttendanceCount + $absentAttendanceCount + $leaveCount;
        $attendanceRate = $totalAttendance > 0 ? round(($presentAttendanceCount / $totalAttendance) * 100, 2) : 0;
        
        // 2. Job Status Overview
        $jobStatusOverview = Job::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        // 3. Application Status Overview
        $applicationStatusOverview = JobApplication::select('application_status', DB::raw('COUNT(*) as total'))
            ->groupBy('application_status')
            ->pluck('total', 'application_status');

        // 4. Top Job Postings
        $topJobPostings = Job::withCount('applications')
            ->orderByDesc('applications_count')
            ->limit(5)
            ->get(['id', 'title', 'city', 'status'])
            ->map(function ($job) {
                return [
                    'id' => $job->id,
                    'title' => $job->title,
                    'city' => $job->city ?? 'N/A',
                    'status' => $job->status,
                    'applications_count' => (int) $job->applications_count,
                ];
            })
            ->values();

        $acceptedApplications = (int) ($applicationStatusOverview['accepted'] ?? $applicationStatusOverview['hired'] ?? 0);
        $reviewedApplications = (int) ($applicationStatusOverview['reviewed'] ?? 0);
        $pendingApplications = (int) ($applicationStatusOverview['pending'] ?? 0);
        $rejectedApplications = (int) ($applicationStatusOverview['rejected'] ?? 0);
        $totalApplications = $acceptedApplications + $reviewedApplications + $pendingApplications + $rejectedApplications;

        // 5. Revenue Overview Chart
        $revenueOverview = [];
        if ($type == 'monthly') {
            // Month-by-month revenue for the current year (Jan to Dec)
            $startOfYear = Carbon::now()->startOfYear();
            $endOfYear = Carbon::now()->endOfYear();
            $yearSubs = SubscriptionUser::with('subscription')
                ->whereBetween('created_at', [$startOfYear, $endOfYear])
                ->whereIn('payment_status', ['paid', 'completed'])
                ->get()
                ->groupBy(function ($sub) {
                    return (int) Carbon::parse($sub->created_at)->format('n');
                });

            for ($m = 1; $m <= 12; $m++) {
                $monthSubs = $yearSubs->get($m, collect());
                $monthTotal = (float) $monthSubs->sum(function ($sub) {
                    return $this->resolveSubscriptionRevenue($sub);
                });
                $revenueOverview[] = [
                    'label' => Carbon::create()->month($m)->format('M'),
                    'revenue' => $monthTotal,
                    'amount' => $monthTotal,
                ];
            }
        } else {
            // Yearly revenue for past 5 years
            $currentYear = Carbon::now()->year;
            $startYear = $currentYear - 4;
            $startDate = Carbon::create($startYear, 1, 1)->startOfDay();
            $endDate = Carbon::now()->endOfYear();

            $yearlySubs = SubscriptionUser::with('subscription')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->whereIn('payment_status', ['paid', 'completed'])
                ->get()
                ->groupBy(function ($sub) {
                    return Carbon::parse($sub->created_at)->format('Y');
                });

            for ($y = $startYear; $y <= $currentYear; $y++) {
                $ySubs = $yearlySubs->get((string) $y, collect());
                $yearTotal = (float) $ySubs->sum(function ($sub) {
                    return $this->resolveSubscriptionRevenue($sub);
                });
                $revenueOverview[] = [
                    'label' => (string) $y,
                    'revenue' => $yearTotal,
                    'amount' => $yearTotal,
                ];
            }
        }
            
        $data = [
            'staff_count' => $staffDataCount,
            'job_count' => $openJobCount,
            'house_owner_count' => $houseOwnerDataCount,
            'present_attendance_count' => $presentAttendanceCount,
            'absent_attendance_count' => $absentAttendanceCount,
            'leave' => $leaveCount,
            'overall_attendance_rate' => $attendanceRate,
            'member_subscription_revenue' => $memberSubscriptionRevenue,
            'member_salary_paid' => $memberSalarySum,
            'job_status_overview' => [
                'open' => (int) ($jobStatusOverview['open'] ?? 0),
                'pending' => (int) ($jobStatusOverview['pending'] ?? 0),
                'closed' => (int) ($jobStatusOverview['closed'] ?? 0),
                'paused' => (int) ($jobStatusOverview['paused'] ?? 0),
            ],
            'hiring_report' => [
                'total_applications' => $totalApplications,
                'pending' => $pendingApplications,
                'reviewed' => $reviewedApplications,
                'accepted' => $acceptedApplications,
                'rejected' => $rejectedApplications,
                'conversion_rate' => $totalApplications > 0
                    ? round(($acceptedApplications / $totalApplications) * 100, 2)
                    : 0,
            ],
            'top_job_postings' => $topJobPostings,
            'chartdata' => [
                'revenue_overview' => $revenueOverview
            ]
        ];

        return response()->json([
            'status' => 'success',
            'data' => $data,
            'message' => 'Report data retrieved successfully'
        ]);
    }
}

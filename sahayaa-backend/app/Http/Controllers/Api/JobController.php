<?php

namespace App\Http\Controllers\Api;

use App\Models\Job;
use App\Models\JobApplication;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use App\Models\Notification;
use Carbon\Carbon;
use App\Models\QuitJob;
use App\Models\Salary;
use App\Models\User;
use App\Models\SubscriptionUser;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;


class JobController extends Controller
{
private function parseCoordinate($value): ?float
{
    if ($value === null || $value === '') {
        return null;
    }

    if (!is_numeric($value)) {
        return null;
    }

    return (float) $value;
}

private function getUserCoordinates($user): ?array
{
    if (!$user) {
        return null;
    }

    $addresses = $user->relationLoaded('addresses')
        ? $user->addresses
        : $user->addresses()->get();

    $primaryAddress = collect($addresses)->firstWhere('is_primary', true)
        ?? collect($addresses)->first();

    $latitude = $this->parseCoordinate($primaryAddress?->latitude ?? $user->lat ?? null);
    $longitude = $this->parseCoordinate($primaryAddress?->longitude ?? $user->long ?? null);

    if ($latitude === null || $longitude === null) {
        return null;
    }

    return [
        'lat' => $latitude,
        'long' => $longitude,
    ];
}

private function calculateDistanceKm(float $startLat, float $startLong, float $endLat, float $endLong): float
{
    $earthRadius = 6371;

    $latDelta = deg2rad($endLat - $startLat);
    $longDelta = deg2rad($endLong - $startLong);

    $a = sin($latDelta / 2) ** 2
        + cos(deg2rad($startLat)) * cos(deg2rad($endLat))
        * sin($longDelta / 2) ** 2;

    return 2 * $earthRadius * asin(min(1, sqrt($a)));
}

    private function applyJobProximity($collection, ?array $origin, ?float $radiusKm = null)
    {
        if (!$origin || !isset($origin['lat'], $origin['long'])) {
            return $collection;
        }

        $ranked = collect($collection)->map(function ($job) use ($origin, $radiusKm) {
            $latitude = $this->parseCoordinate($job->latitude ?? null);
            $longitude = $this->parseCoordinate($job->longitude ?? null);

            if ($latitude === null || $longitude === null) {
                if ($radiusKm !== null) {
                    return null;
                }

                $job->setAttribute('_distance_km', null);
                return $job;
            }

            $distance = $this->calculateDistanceKm(
                (float) $origin['lat'],
                (float) $origin['long'],
                $latitude,
                $longitude
            );

            if ($radiusKm !== null && $distance > $radiusKm) {
                return null;
            }

            $job->setAttribute('_distance_km', round($distance, 2));
            return $job;
        })->filter()->sortBy(function ($job) {
        return $job->_distance_km ?? PHP_FLOAT_MAX;
    })->values();

    return $ranked;
}

private function normalizeJobLocationInput(Request $request): void
{
    $request->merge([
        'latitude' => $request->input('latitude', $request->input('lat')),
        'longitude' => $request->input('longitude', $request->input('long')),
    ]);
}

public function index(Request $request): JsonResponse
{
    $user = Auth::guard('api')->user();
    
    $jobs = Job::select('jobs.*')->withCount('applications', 'users')
              ->when($request->filled('status'), function ($query) use ($request) {
                  $query->where('status', $request->status);
              }, function ($query) {
                  $query->where('status', 'open');
              })
              ->when($user, function ($query) use ($user, $request) {
                  // Add select for is_applied
                  $query->addSelect([
                      'is_applied' => JobApplication::selectRaw('COUNT(*)')
                          ->whereColumn('job_id', 'jobs.id')
                          ->where('user_id', $user->id)
                  ]);

                  // Automatically filter by role and location if user is staff (role 2)
                  // and no specific filters are provided in request
                  if ($user->user_role_id == 2 && !$request->filled('role') && !$request->filled('city')) {
                      // Get staff roles and cities
                      $workInfo = $user->userWorkInfo;
                      $primaryAddress = $user->addresses()->first();
                      
                      $staffRole = $workInfo ? $workInfo->primary_role : null;
                      $prefLoc = $workInfo ? $workInfo->preferred_work_location : null;

                      // Parse all roles into array
                      $rolesArray = [];
                      if (is_array($staffRole)) {
                          $rolesArray = $staffRole;
                      } elseif (is_string($staffRole) && !empty($staffRole)) {
                          $cleanStr = str_replace(['[', ']', '"', "'"], '', $staffRole);
                          $rolesArray = array_map('trim', explode(',', $cleanStr));
                      }

                      if (!empty($rolesArray)) {
                          $query->where(function($q) use ($rolesArray) {
                              foreach ($rolesArray as $r) {
                                  if (!empty($r)) {
                                      $q->orWhere('title', 'LIKE', '%' . $r . '%')
                                        ->orWhere('description', 'LIKE', '%' . $r . '%');
                                  }
                              }
                          });
                      }

                      // Parse all preferred cities + all addresses cities into array
                      $citiesArray = [];
                      $allAddresses = $user->addresses()->get();
                      foreach ($allAddresses as $addr) {
                          if ($addr->city) {
                              $citiesArray[] = trim($addr->city);
                          }
                      }
                      if ($prefLoc) {
                          if (is_array($prefLoc)) {
                              foreach ($prefLoc as $c) $citiesArray[] = trim($c);
                          } elseif (is_string($prefLoc)) {
                              $cleanLoc = str_replace(['[', ']', '"', "'"], '', $prefLoc);
                              foreach (explode(',', $cleanLoc) as $c) {
                                  if (trim($c)) $citiesArray[] = trim($c);
                              }
                          }
                      }
                      
                      $isStaffAllIndia = false;
                      $citiesArray = array_unique(array_filter($citiesArray));
                      foreach ($citiesArray as $c) {
                          if (stripos($c, 'All India') !== false || stripos($c, 'Anywhere') !== false) {
                              $isStaffAllIndia = true;
                              break;
                          }
                      }

                      if (!$isStaffAllIndia && !empty($citiesArray)) {
                          $query->where(function($q) use ($citiesArray) {
                              foreach ($citiesArray as $cityItem) {
                                  $q->orWhere('city', 'LIKE', '%' . $cityItem . '%')
                                    ->orWhere('state', 'LIKE', '%' . $cityItem . '%');
                              }
                              // Always include All India / nationwide jobs
                              $q->orWhere('city', 'LIKE', '%All%')
                                ->orWhere('city', 'LIKE', '%India%')
                                ->orWhere('state', 'LIKE', '%All%')
                                ->orWhere('state', 'LIKE', '%India%');
                          });
                      }
                  }
              })
              ->when($request->filled('role'), function ($query) use ($request) {
                  $query->where(function($q) use ($request) {
                      $q->where('title', 'LIKE', '%' . $request->role . '%')
                        ->orWhere('description', 'LIKE', '%' . $request->role . '%');
                  });
              })
              ->when($request->filled('city') && strtolower(trim($request->city)) !== 'all', function ($query) use ($request) {
                  $cityVal = $request->city;
                  $query->where(function($q) use ($cityVal) {
                      $q->where('city', 'LIKE', '%' . $cityVal . '%')
                        ->orWhere('city', 'LIKE', '%All%')
                        ->orWhere('city', 'LIKE', '%India%')
                        ->orWhere('state', 'LIKE', '%All%')
                        ->orWhere('state', 'LIKE', '%India%');
                  });
              })
              ->when($request->filled('state') && strtolower(trim($request->state)) !== 'all india' && strtolower(trim($request->state)) !== 'all', function ($query) use ($request) {
                  $stateVal = $request->state;
                  $query->where(function($q) use ($stateVal) {
                      $q->where('state', 'LIKE', '%' . $stateVal . '%')
                        ->orWhere('city', 'LIKE', '%All%')
                        ->orWhere('city', 'LIKE', '%India%')
                        ->orWhere('state', 'LIKE', '%All%')
                        ->orWhere('state', 'LIKE', '%India%');
                  });
              })
              ->orderBy('created_at', 'desc')
              ->get();

    $userOrigin = $this->getUserCoordinates($user);
    $jobs = $this->applyJobProximity($jobs, $userOrigin);
    
    if (!$user) {
        $jobs->each(function ($job) {
            $job->is_applied = 0;
        });
    } else {
        $jobs->each(function ($job) {
            $job->is_applied = $job->is_applied > 0 ? 1 : 0;
        });
    }

    return response()->json([
        'status' => 'success',
        'data' => $jobs,
        'message' => 'Jobs retrieved successfully'
    ]);
}

    /**
     * Retrieve a list of jobs that the authenticated user has created.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function authBaseList(Request $request): JsonResponse
    {
        $perPage = min($request->get('per_page', 10), 50);

        $userId = Auth::guard('api')->id() ?? Auth::id();
        $query = Job::withCount('applications', 'users')
            ->where('created_by', $userId);

        // 🔍 Filter by Job Title
        if ($request->filled('title')) {
            $query->where('title', 'LIKE', '%' . $request->title . '%');
        }

        // 📍 Filter by city
        if ($request->filled('city')) {
            $query->where('city', 'LIKE', '%' . $request->city . '%');
        }

        $jobs = $query
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // Calculate actual hires count for this houseowner
        $user = Auth::guard('api')->user() ?? Auth::user();
        $totalStaffCount = $user ? \App\Models\User::where('added_by', $user->id)
            ->where('is_deleted', 0)
            ->count() : 0;

        $jobs->getCollection()->transform(function ($job) use ($user, $totalStaffCount) {
            $acceptedAppsCount = \App\Models\JobApplication::where('job_id', $job->id)
                ->whereIn('application_status', ['accepted', 'hired', 'approved'])
                ->count();
            
            $jobStaffCount = \App\Models\User::where('added_by', $user->id)
                ->where('job_id', $job->id)
                ->where('is_deleted', 0)
                ->count();

            $hiresCount = max($job->users_count ?? 0, $acceptedAppsCount, $jobStaffCount);
            if ($hiresCount === 0 && $totalStaffCount > 0) {
                $hiresCount = $totalStaffCount;
            }
            
            $job->hires_count = $hiresCount;
            $job->users_count = $hiresCount;

            $requiredOpenings = (int) ($job->openings ?: 1);
            if ($job->status === 'open' && ($acceptedAppsCount >= $requiredOpenings || $jobStaffCount >= $requiredOpenings)) {
                $job->status = 'closed';
                Job::where('id', $job->id)->update(['status' => 'closed']);
            }
            return $job;
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'Jobs retrieved successfully',
            'data'    => $jobs,
        ]);
    }

    /**
     * Get jobs created by the currently authenticated user (House Owner).
     */
    public function myJobs(Request $request): JsonResponse
    {
        $user = Auth::guard('api')->user() ?: Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $ownerId = method_exists($user, 'getEffectiveOwnerId') ? $user->getEffectiveOwnerId() : ($user->added_by ?: $user->id);
        $perPage = min($request->get('per_page', 20), 100);

        $jobs = Job::where(function($q) use ($user, $ownerId) {
                $q->where('created_by', $ownerId)->orWhere('created_by', $user->id);
            })
            ->where('status', '!=', 'deleted')
            ->withCount('applications', 'users')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $totalStaffCount = \App\Models\User::whereIn('added_by', array_unique([$ownerId, $user->id]))
            ->where('is_deleted', 0)
            ->count();

        $jobs->getCollection()->transform(function ($job) use ($user, $ownerId, $totalStaffCount) {
            $acceptedAppsCount = \App\Models\JobApplication::where('job_id', $job->id)
                ->whereIn('application_status', ['accepted', 'hired', 'approved'])
                ->count();
            
            $jobStaffCount = \App\Models\User::whereIn('added_by', array_unique([$ownerId, $user->id]))
                ->where('job_id', $job->id)
                ->where('is_deleted', 0)
                ->count();

            $hiresCount = max($job->users_count ?? 0, $acceptedAppsCount, $jobStaffCount);
            if ($hiresCount === 0 && $totalStaffCount > 0) {
                $hiresCount = $totalStaffCount;
            }

            $job->hires_count = $hiresCount;
            $job->users_count = $hiresCount;

            $requiredOpenings = (int) ($job->openings ?: 1);
            if ($job->status === 'open' && ($acceptedAppsCount >= $requiredOpenings || $jobStaffCount >= $requiredOpenings)) {
                $job->status = 'closed';
                Job::where('id', $job->id)->update(['status' => 'closed']);
            }
            return $job;
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'User jobs retrieved successfully',
            'data'    => $jobs,
        ]);
    }

    /**
     * Delete a job created by the currently authenticated user.
     */
    public function deleteMyJob(Request $request, $id): JsonResponse
    {
        $user = Auth::guard('api')->user() ?: Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        $job = Job::where('id', $id)
            ->where('created_by', $user->id)
            ->first();

        if (!$job) {
            return response()->json([
                'error' => 'Job not found or permission denied.'
            ], 404);
        }

        DB::beginTransaction();
        try {
            // Clean up related data before deleting the job
            \App\Models\JobApplication::where('job_id', $job->id)->delete();
            $job->delete();
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Failed to delete job.'
            ], 500);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Job deleted successfully'
        ]);
    }

    public function store(Request $request): JsonResponse
    {   
        DB::beginTransaction();
        try {
            $authUser = Auth::guard('api')->user() ?: Auth::user();
            $userId = method_exists($authUser, 'getEffectiveOwnerId') ? $authUser->getEffectiveOwnerId() : ($authUser->added_by ?: $authUser->id);
            $this->normalizeJobLocationInput($request);

            $subscription = SubscriptionUser::where(function($q) use ($userId, $authUser) {
                    $q->where('user_id', $userId)->orWhere('user_id', $authUser->id);
                })
                ->where('status', 'active')
                ->whereNull('deleted_at')
                ->where('end_date', '>', now())
                ->latest()
                ->lockForUpdate()
                ->first();
            $plan = null;
            if ($subscription) {
                $plan = Subscription::find($subscription->subscription_id);
            }

            // Fallback: If user has no active subscription record in DB, look up the Free plan set in Admin Panel
            if (!$plan) {
                $userObj = Auth::user();
                $plan = Subscription::where(function($q) use ($userObj) {
                        if ($userObj && $userObj->user_role_id) {
                            $q->where('role_id', $userObj->user_role_id)
                              ->orWhere('role_id', 3)
                              ->orWhereNull('role_id');
                        } else {
                            $q->where('role_id', 3)->orWhereNull('role_id');
                        }
                    })
                    ->where(function($q) {
                        $q->where('price', 0)
                          ->orWhere('subscription_name', 'LIKE', '%free%');
                    })
                    ->latest()
                    ->first();

                if (!$plan) {
                    $plan = Subscription::where('price', 0)->first();
                }
            }

            if (!$plan) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'error_code' => 'UPGRADE_REQUIRED',
                    'message' => 'Please upgrade to Premium Plan to post jobs.'
                ]);
            }

            $actualPostedJobs = Job::where('created_by', $userId)
                ->when($subscription && $subscription->start_date, function ($query) use ($subscription) {
                    $query->where('created_at', '>=', $subscription->start_date);
                })
                ->when($subscription && $subscription->end_date, function ($query) use ($subscription) {
                    $query->where('created_at', '<=', $subscription->end_date);
                })
                ->count();

            $allowed_limit = (float)($plan->job_limit ?? 3) + (float)($subscription?->extra_jobs ?? 0);
            if ($actualPostedJobs >= $allowed_limit) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'error_code' => 'LIMIT_EXCEEDED',
                    'extra_job_price' => $plan->extra_job_price ?? 500,
                    'message' => 'Monthly Job limit exceeded.'
                ]);
            }

            $isAllIndia = strtolower(trim($request->input('city'))) === 'all';

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'compensation' => 'nullable|numeric',
                'expected_compensation' => 'nullable|numeric',
                'compensation_type' => 'required|in:monthly,hourly,yearly',
                'street_address' => $isAllIndia ? 'nullable|string' : 'required|string',
                'city' => 'required|string',
                'state' => 'required|string',
                'zip_code' => $isAllIndia ? 'nullable|string' : 'required|string',
                'area_locality' => 'nullable|string|max:255',
                'google_location' => 'nullable|string',
                'latitude' => 'nullable|numeric',
                'longitude' => 'nullable|numeric',
                'commitment_type' => 'required|in:full-time,part-time,flexible',
                'stay_type' => 'nullable|string|max:255',
                'preferred_hours' => 'nullable|string',
                'preferred_days' => 'nullable|string',
                'childcare_experience' => 'boolean',
                'cooking_required' => 'boolean',
                'driving_license_required' => 'boolean',
                'first_aid_certified' => 'boolean',
                'pet_care_required' => 'boolean',
                'additional_requirements' => 'nullable|string',
                'required_skills' => 'nullable|string',
                'openings' => 'nullable|integer|min:1',
                'status' => 'nullable|in:pending,open,closed'
            ]);

            if ($validator->fails()) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            $job = Job::create(array_merge($validator->validated(), [
                'created_by' => $userId,
                'status' => $request->input('status', 'pending')
            ]));

            DB::commit();

            return response()->json([
                'status' => 'success',
                'data' => $job,
                'message' => 'Job created successfully'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Job store failed: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create job. Please try again.'
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        $job = Job::with([
            'creator.addresses',
            'creator.householdInformation',
            'applications.user'
        ])->find($id);

        if (!$job) {
            return response()->json([
                'status' => 'error',
                'message' => 'Job not found'
            ], 404);
        }

        $primaryAddress = optional($job->creator)->addresses
            ?->firstWhere('is_primary', 1) ?? optional($job->creator)->addresses?->first();
        $household = optional($job->creator)->householdInformation;

        $job->setAttribute('owner_summary', [
            'name' => optional($job->creator)->name ?: trim((optional($job->creator)->first_name ?? '') . ' ' . (optional($job->creator)->last_name ?? '')),
            'residence_type' => $household?->residence_type,
            'number_of_rooms' => $household?->number_of_rooms,
            'city' => $primaryAddress?->city,
            'state' => $primaryAddress?->state,
            'locality' => $primaryAddress?->locality,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $job,
            'message' => 'Job retrieved successfully'
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {

        $job = Job::where('id', $id)->where('created_by', Auth::guard('api')->id())->first();

        if (!$job) {
            return response()->json([
                'status' => 'error',
                'message' => 'Job not found'
            ], 404);

        }

        $this->normalizeJobLocationInput($request);

        $isAllIndia = strtolower(trim($request->input('city'))) === 'all';

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'compensation' => 'nullable|numeric',
            'expected_compensation' => 'nullable|numeric',
            'compensation_type' => 'sometimes|required|in:monthly,hourly,yearly',
            'street_address' => $isAllIndia ? 'nullable|string' : 'sometimes|required|string',
            'city' => 'sometimes|required|string',
            'state' => 'sometimes|required|string',
            'zip_code' => $isAllIndia ? 'nullable|string' : 'sometimes|required|string',
            'area_locality' => $isAllIndia ? 'nullable|string|max:255' : 'sometimes|required|string|max:255',
            'google_location' => $isAllIndia ? 'nullable|string' : 'sometimes|required|string',
            'latitude' => $isAllIndia ? 'nullable|numeric' : 'sometimes|required|numeric',
            'longitude' => $isAllIndia ? 'nullable|numeric' : 'sometimes|required|numeric',
            'commitment_type' => 'sometimes|required|in:full-time,part-time,flexible',
            'stay_type' => 'nullable|string|max:255',
            'preferred_hours' => 'nullable|string',
            'preferred_days' => 'nullable|string',
            'status' => 'sometimes|required|in:pending,open,closed',
            'childcare_experience' => 'boolean',
            'cooking_required' => 'boolean',
            'driving_license_required' => 'boolean',
            'first_aid_certified' => 'boolean',
            'pet_care_required' => 'boolean',
            'additional_requirements' => 'nullable|string',
            'required_skills' => 'nullable|string',
            'openings' => 'nullable|integer|min:1'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();
        if (isset($validated['status']) && $validated['status'] === 'open') {
            $acceptedCount = JobApplication::where('job_id', $job->id)
                ->whereIn('application_status', ['accepted', 'hired', 'approved'])
                ->count();
            $newOpenings = isset($validated['openings']) ? (int)$validated['openings'] : (int)($job->openings ?: 1);
            if ($acceptedCount >= $newOpenings) {
                $validated['status'] = 'closed';
            }
        }

        $job->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => $job,
            'message' => 'Job updated successfully'
        ]);
    }

    /**
     * Delete a job
     *
     * @param int $id The ID of the job to delete
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        // Check if the job exists and belongs to the authenticated user
        $job = Job::where('id', $id)->where('created_by', Auth::guard('api')->id())->first();
        if (!$job) {
            return response()->json([
                'status' => 'error',
                'message' => 'Job not found'
            ], 404);
        }

        // Delete the job
        $job->delete();

        // Return a success response
        return response()->json([
            'status' => 'success',
            'message' => 'Job deleted successfully'
        ]);
    }

    /**
     * Update the status of a job
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        // Validate the request body
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,open,closed,paused'
        ]);

        // If validation fails, return a 422 response with errors
        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find the job by ID and verify ownership
        $job = Job::where('id', $id)->where('created_by', Auth::guard('api')->id())->first();

        // If the job is not found, return a 404 response
        if (!$job) {
            return response()->json([
                'status' => 'error',
                'message' => 'Job not found'
            ], 404);
        }

        // Update the job status
        $job->update(['status' => $request->status]);

        // Return a successful response with the updated job
        return response()->json([
            'status' => 'success',
            'data' => $job,
            'message' => 'Job status updated successfully'
        ]);
    }

    public function joblist(Request $request)
    {
        $user = Auth::guard('api')->user() ?: Auth::user();
        $userId = $user?->id;

        $query = Job::withCount('users');

        if ($userId) {
            $query->addSelect([
                'is_applied' => JobApplication::selectRaw('COUNT(*)')
                    ->whereColumn('job_id', 'jobs.id')
                    ->where('user_id', $userId),
            ]);
        }

        $jobs = $query->orderBy('created_at', 'desc')->paginate(10);
        
        if (!$userId) {
            $jobs->getCollection()->transform(function ($job) {
                $job->is_applied = 0;
                return $job;
            });
        } else {
            $jobs->getCollection()->transform(function ($job) {
                $job->is_applied = !empty($job->is_applied) && $job->is_applied > 0 ? 1 : 0;
                return $job;
            });
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Jobs retrieved successfully',
            'data' => $jobs
        ]);
    }
    

}

<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Job;

class User extends Authenticatable
{
    use Notifiable, HasApiTokens, HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_role_id',
        'auto_attendence',
        'first_name',
        'last_name',
        'name',
        'email',
        'phone_number_prefix',
        'phone_number_country_code',
        'phone_number',
        'password',
        'gender',
        'is_active',
        'is_available',
        'is_job_seeking',
        'added_by',
        'relation',
        'prev_owner_name',
        'prev_owner_phone',
        'step',
        'is_deleted',
        'is_admin_panel_user',
        'admin_parent_id',
        'admin_permissions',
        'dob',
        'image',
        'social_type',
        'email_verification_code',
        'email_verified_at',
        'social_id',
        'forgot_password_validate_string',
        'verification_code',
        'verification_code_sent_time',
        'is_verified',
        'verified_by_admin',
        'language',
        'push_notification',
        'documents_front',
        'documents_back',
        'reset_otp',
        'reset_otp_expires_at',
        'wallet',
        'current_street',
        'current_city',
        'current_state', 
        'current_pincode',
        'permanent_street',
        'permanent_city',
        'permanent_state',
        'permanent_pincode',
        'date_of_birth',
        'occupation',
        'about_me',
        'aadhar__verify_at',
        'aadhar__verify',
        'aadhar__verify_otp',
        'aadhar_number_otp_expire_at',
        'aadhar_number',
        'deleted_at',
        'deleted_by',
        'service_category',
        'location_area_served',
        'business_name',
        'country_code',
        'location',
        'lat',
        'long',
        'verification_certificate',
        'aadhar_front',
        'aadhar_back',
        'working_days',
        'daily_start_time',
        'daily_end_time',
        'business_description',
        'years_of_experience',
        'area_locality',
        'google_location',
        'business_website',
        'gstin_number',
        'photo_verification',
        'business_proof',
        'adhaar_card_verification',
        'pan_card',
        'url_image',
        'is_staff_added',
        'status',
        'parent_user_id',
        'upi_id',
        'referral_code',
        'referred_by',
        'referral_earnings',
        'wallet_balance',
        'referral_code_expires_at',
        'employer_aadhar_front',
        'employer_aadhar_back',
        'employer_police_verification',
        'employer_other_doc',
        'fir_document',
        'job_apply_count',
        'job_apply_extra_limit',
        'job_id'
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
        'email_verification_code',
        'verification_code',
        'reset_otp',
        'aadhar__verify_otp',
        'forgot_password_validate_string',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'verification_code_sent_time' => 'datetime',
        'reset_otp_expires_at' => 'datetime',
        'aadhar_number_otp_expire_at' => 'datetime',
        'aadhar__verify_at' => 'datetime',
        'deleted_at' => 'datetime',
        'is_active' => 'boolean',
        'is_deleted' => 'boolean',
        'is_admin_panel_user' => 'boolean',
        'is_verified' => 'boolean',
        'verified_by_admin' => 'boolean',
        'push_notification' => 'boolean',
        'aadhar__verify' => 'boolean',
        'wallet' => 'decimal:2',
        'working_days' => 'array',
        'languages_spoken' => 'array',
        'skills' => 'array',
        'auto_attendence' => 'boolean',
        'is_available' => 'boolean',
        'is_job_seeking' => 'boolean',
        'referral_code_expires_at' => 'datetime',
        'admin_permissions' => 'array',
    ];


    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function subscriptionUsers()
    {
        return $this->hasMany(\App\Models\SubscriptionUser::class, 'user_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors & Mutators
    |--------------------------------------------------------------------------
    */

    public function getImageAttribute($value)
    {
        if ($value) {
            // Check if it's already a full URL
            if (filter_var($value, FILTER_VALIDATE_URL)) {
                return $value;
            }
            return env('APP_URL') . '/public/' . $value;
        }
        return null;
    }

    public function getDocumentsFrontAttribute($value)
    {
        return $this->getFileUrl($value, 'documents_front');
    }

    public function getDocumentsBackAttribute($value)
    {
        return $this->getFileUrl($value, 'documents_back');
    }

    public function getVerificationCertificateAttribute($value)
    {
        return $this->getFileUrl($value, 'verification_certificate');
    }

    public function getAadharFrontAttribute($value)
    {
        return $this->getFileUrl($value, 'aadhar_front');
    }

    public function getAadharBackAttribute($value)
    {
        return $this->getFileUrl($value, 'aadhar_back');
    }

    public function getPhotoVerificationAttribute($value)
    {
        return $this->getFileUrl($value, 'photo_verification');
    }

    public function getBusinessProofAttribute($value)
    {
        return $this->getFileUrl($value, 'business_proof');
    }

    public function getAdhaarCardVerificationAttribute($value)
    {
        return $this->getFileUrl($value, 'adhaar_card_verification');
    }

    public function getPanCardAttribute($value)
    {
        return $this->getFileUrl($value, 'pan_card');
    }

    public function getUrlImageAttribute($value)
    {
        if ($value) {
            if (filter_var($value, FILTER_VALIDATE_URL)) {
                return $value;
            }
            return env('APP_URL') . '/public/' . $value;
        }
        return null;
    }

    public function getEmployerAadharFrontAttribute($value)
    {
        return $this->getFileUrl($value);
    }

    public function getEmployerAadharBackAttribute($value)
    {
        return $this->getFileUrl($value);
    }

    public function getEmployerPoliceVerificationAttribute($value)
    {
        return $this->getFileUrl($value);
    }

    public function getEmployerOtherDocAttribute($value)
    {
        return $this->getFileUrl($value);
    }

    public function getFirDocumentAttribute($value)
    {
        return $this->getFileUrl($value);
    }

    /**
     * Helper method to generate file URLs
     */
    private function getFileUrl($value, $type = null)
    {
        if (!$value) {
            return null;
        }

        // If it's already a full URL, return as is
        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        // Check if file exists in storage
        if (Storage::disk('public')->exists($value)) {
            return Storage::disk('public')->url($value);
        }

        // Check if file exists in public path
        if (file_exists(public_path($value))) {
            return env('APP_URL') . '/public/' . $value;
        }

        return null;
    }

    /**
     * Get masked Aadhar number for display
     */
    public function getMaskedAadharNumberAttribute()
    {
        if (!$this->aadhar_number) {
            return null;
        }

        if (strlen($this->aadhar_number) === 12) {
            return substr($this->aadhar_number, 0, 4) . 'XXXX' . substr($this->aadhar_number, -4);
        }

        return $this->aadhar_number;
    }

    /**
     * Get user display name — falls back to first_name + last_name if name is empty or a placeholder
     */
    public function getNameAttribute()
    {
        $raw = $this->attributes['name'] ?? null;
        $name = trim((string) $raw);
        $invalidNames = ['', 'User', 'Staff Member', 'Admin', 'Unknown'];
        if ($name !== '' && !in_array($name, $invalidNames)) {
            return $name;
        }
        $first = trim((string) ($this->attributes['first_name'] ?? ''));
        $last  = trim((string) ($this->attributes['last_name'] ?? ''));
        $composed = trim($first . ' ' . $last);
        return $composed !== '' ? $composed : ($name !== '' ? $name : null);
    }

    /**
     * Check if user is vendor
     */
    public function getIsVendorAttribute()
    {
        return $this->user_role_id == 1;
    }

    public function addedByUser()
    {
        return $this->belongsTo(User::class, 'added_by');
    }

    /**
     * Get the effective owner ID for household operations.
     * If this user is a Family Member (role_id 1 with added_by set), return added_by (Primary Owner).
     * Otherwise return this user's own ID.
     */
    public function getEffectiveOwnerId()
    {
        if (($this->user_role_id == 1 || $this->user_role_id == '1') && !empty($this->added_by)) {
            return (int) $this->added_by;
        }
        return (int) $this->id;
    }

    public function assignedJob()
    {
        return $this->belongsTo(Job::class, 'job_id');
    }

    public function parentUserId()
    {
        return $this->belongsTo(User::class, 'parent_user_id');
    }

    /**
     * Check if user is customer
     */
    public function getIsCustomerAttribute()
    {
        return $this->user_role_id == 2;
    }

    /**
     * Check if user is admin
     */
    public function getIsAdminAttribute()
    {
        return $this->user_role_id == 3; // Assuming 3 is admin role
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function addresses()
    {
        return $this->hasMany(UserAddress::class);
    }

     public function lastExp()
    {
        return $this->hasOne(LastWorkExperience::class);
    }

    public function petDetails()
    {
        return $this->hasMany(UserPetDetail::class);
    }

    public function householdInformation()
    {
        return $this->hasOne(UserHouseholdInformation::class);
    }

    public function kycInformation()
    {
        return $this->hasOne(KycVerification::class, 'user_id');
    }

    public function userWorkInfo()
    {
        return $this->hasOne(UserWorkInfo::class, 'user_id');
    }

    public function reviewsReceived()
    {
        return $this->hasMany(Review::class, 'received_by_id')
            ->where('received_by_type', 'user');
    }

    public function portfolioImages()
    {
        return $this->hasMany(PortfolioImage::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class, 'vendor_id'); // Assuming vendor_id foreign key
    }

    public function subServices()
    {
        return $this->hasMany(SubService::class, 'vendor_id'); // Assuming vendor_id foreign key
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'service_category', 'id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function policyAcceptances()
    {
        return $this->hasMany(UserPolicyAcceptance::class);
    }

    public function hasAcceptedPolicy(string $type, string $version): bool
    {
        return $this->policyAcceptances()
            ->where('policy_type', $type)
            ->where('policy_version', $version)
            ->exists();
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'vendor_id');
    }

    public function bookingsAsVendor()
    {
        return $this->hasMany(Booking::class, 'vendor_id');
    }

    public function bookingsAsCustomer()
    {
        return $this->hasMany(Booking::class, 'customer_id');
    }

    public function customerBookings()
    {
        return $this->hasMany(Booking::class, 'customer_id');
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope for active users
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', 1)->where('is_deleted', 0);
    }

    /**
     * Scope for vendors
     */
    public function scopeVendors($query)
    {
        return $query->where('user_role_id', 1);
    }

    /**
     * Scope for customers
     */
    public function scopeCustomers($query)
    {
        return $query->where('user_role_id', 2);
    }

    /**
     * Scope for deleted users
     */
    public function scopeDeleted($query)
    {
        return $query->where('is_deleted', 1);
    }

    /**
     * Scope for verified users
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', 1);
    }

    /*
    |--------------------------------------------------------------------------
    | Business Logic Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Check if user profile is complete
     */
    public function isProfileComplete()
    {
        return $this->step >= 4; // Adjust based on your step logic
    }

    /**
     * Check if Aadhar is verified
     */
    public function isAadharVerified()
    {
        return $this->aadhar_verify && !empty($this->aadhar_verify_at);
    }

    /**
     * Soft delete user
     */
    public function softDelete($deletedBy = null)
    {
        $this->update([
            'is_deleted' => 1,
            'deleted_at' => now(),
            'deleted_by' => $deletedBy
        ]);

        // Revoke all tokens
        $this->tokens()->delete();

        return $this;
    }

    /**
     * Restore soft deleted user
     */
    public function restore()
    {
        $this->update([
            'is_deleted' => 0,
            'deleted_at' => null,
            'deleted_by' => null
        ]);

        return $this;
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'id', 'user_role_id');
    }

    public function lastsalary()
    {
        return $this->hasOne(Salary::class, 'staff_id', 'id')
                ->latestOfMany('payment_date');
    }


    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class, 'created_by', 'id');
    }

    public function attendance_details()
    {
        return $this->hasMany(Attendance::class, 'staff_id');
    }

    public function bankAccounts()
    {
        return $this->hasMany(BankAccount::class, 'user_id', 'id');
    }

    /**
     * Completely clean up all related data before soft-deleting a user.
    public function bankAccounts()
    {
        return $this->hasMany(BankAccount::class, 'user_id', 'id');
    }

    /**
     * Completely clean up all related data before soft-deleting a user.
     * Must be called inside a DB::transaction.
     */
    public function deleteAllUserData(): void
    {
        $userId = $this->id;
        // Nullify FK references from other tables pointing to this user
        // (do these FIRST to avoid FK constraint violations)
        $nullifyTargets = [
            ['jobs', 'created_by'],
            ['jobs', 'user_id'],
            ['terminations', 'approved_by'],
            ['salary_payouts', 'requested_by'],
            ['transactions', 'created_by'],
            ['users', 'added_by'],
            ['users', 'parent_user_id'],
        ];

        foreach ($nullifyTargets as [$tbl, $col]) {
            try {
                DB::table($tbl)->where($col, $userId)->update([$col => null]);
            } catch (\Throwable $e) {
                \Log::warning("Failed to nullify {$tbl}.{$col} for user {$userId}: " . $e->getMessage());
            }
        }

        // Now delete all related records (children before parents)
        $tableColumns = [
            ['personal_access_tokens', 'tokenable_id'],
            ['notifications', 'user_id'],
            ['user_device_tokens', 'user_id'],
            ['userdevicetokens', 'user_id'],
            ['user_addresses', 'user_id'],
            ['user_pet_details', 'user_id'],
            ['user_household_informations', 'user_id'],
            ['user_work_infos', 'user_id'],
            ['kyc_verifications', 'user_id'],
            ['last_work_experiences', 'user_id'],
            ['bank_accounts', 'user_id'],
            ['user_policy_acceptances', 'user_id'],
            ['legal_consents', 'user_id'],
            ['user_other_images', 'user_id'],
            ['user_social_links', 'user_id'],
            ['wishlists', 'user_id'],
            ['subscription_users', 'user_id'],
            ['reviews', 'reviewer_id'],
            ['reviews', 'user_id'],
            ['wallet', 'user_id'],
            ['attendance', 'staff_id'],
            ['attendance', 'houseowner_id'],
            ['salaries', 'staff_id'],
            ['salaries', 'houseowner_id'],
            ['salary_payouts', 'staff_id'],
            ['salary_payouts', 'houseowner_id'],
            ['advance_transactions', 'staff_id'],
            ['advance_transactions', 'employer_id'],
            ['staff_advances', 'staff_id'],
            ['staff_advances', 'employer_id'],
            ['staff_advances', 'houseowner_id'],
            ['job_applications', 'user_id'],
            ['job_applications', 'houseowner_id'],
            ['jobs', 'created_by'],
            ['jobs', 'user_id'],
            ['leave_requests', 'user_id'],
            ['leave_requests', 'created_by'],
            ['quit_jobs', 'user_id'],
            ['quit_jobs', 'houseowner_id'],
            ['terminations', 'user_id'],
            ['terminations', 'houseowner_id'],
            ['job_apply_limits', 'user_id'],
            ['transactions', 'user_id'],
            ['payments', 'user_id'],
            ['ticket_comments', 'user_id'],
            ['tickets', 'user_id'],
            ['mail_shortcuts', 'user_id'],
            ['carts', 'user_id'],
            ['services', 'user_id'],
            ['sub_services', 'user_id'],
            ['bookings', 'customer_id'],
            ['bookings', 'vendor_id'],
            ['analytics', 'user_id'],
            ['banner', 'user_id'],
            ['referral_redemptions', 'referrer_id'],
            ['referral_redemptions', 'referred_id'],
            ['referrals', 'referrer_id'],
            ['referrals', 'referred_id'],
            ['zoho_tokens', 'user_id'],
            ['user_permission_actions', 'user_id'],
            ['user_permissions', 'user_id'],
        ];

        foreach ($tableColumns as [$table, $column]) {
            try {
                DB::table($table)->where($column, $userId)->delete();
            } catch (\Throwable $e) {
                \Log::warning("Failed to clean table {$table}.{$column} for user {$userId}: " . $e->getMessage());
            }
        }

        // Nullify jobs created by this user (owner's jobs should show as no longer owned, not deleted)
        DB::table('jobs')->where('created_by', $userId)->update(['created_by' => null]);
    }
}

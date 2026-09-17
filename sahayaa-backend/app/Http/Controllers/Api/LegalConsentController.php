<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegalConsent;
use App\Models\User;
use Illuminate\Http\Request;

class LegalConsentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:privacy_policy,disclaimer,terms_and_conditions',
            'consent_data' => 'nullable|array',
            'phone_number' => 'nullable|string|max:20',
        ]);

        $consent = LegalConsent::create([
            'user_id' => $request->user()?->id,
            'phone_number' => $request->phone_number,
            'type' => $request->type,
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'consent_data' => $request->consent_data,
            'accepted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Consent recorded successfully.',
            'data' => $consent,
        ]);
    }

    public function storeBulk(Request $request)
    {
        $request->validate([
            'consents' => 'required|array',
            'consents.*.type' => 'required|in:privacy_policy,disclaimer,terms_and_conditions',
            'consents.*.consent_data' => 'nullable|array',
            'phone_number' => 'nullable|string|max:20',
        ]);

        $records = [];
        foreach ($request->consents as $item) {
            $records[] = LegalConsent::create([
                'user_id' => $request->user()?->id,
                'phone_number' => $request->phone_number,
                'type' => $item['type'],
                'ip_address' => $request->ip(),
                'user_agent' => $request->header('User-Agent'),
                'consent_data' => $item['consent_data'] ?? null,
                'accepted_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'All consents recorded successfully.',
            'data' => $records,
        ]);
    }

    public function adminIndex(Request $request)
    {
        $query = LegalConsent::with('user:id,name,first_name,last_name,phone_number,email');

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->date_from) {
            $query->whereDate('accepted_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('accepted_at', '<=', $request->date_to);
        }

        $consents = $query->latest('accepted_at')->paginate($request->per_page ?? 50);

        // Normalize phone numbers (last 10 digits) to resolve users
        $phone10Map = [];
        $rawPhones = $consents->getCollection()
            ->pluck('phone_number')
            ->filter()
            ->unique();

        foreach ($rawPhones as $p) {
            $digits = preg_replace('/[^0-9]/', '', (string)$p);
            $last10 = substr($digits, -10);
            if (strlen($last10) === 10) {
                $phone10Map[$last10] = $p;
            }
        }

        if (!empty($phone10Map)) {
            $all10 = array_keys($phone10Map);
            $users = User::where(function ($q) use ($all10) {
                foreach ($all10 as $p10) {
                    $q->orWhere('phone_number', 'like', '%' . $p10);
                }
            })->get(['id', 'name', 'first_name', 'last_name', 'phone_number', 'email']);

            $resolvedUserMap = [];
            foreach ($users as $u) {
                $uDigits = preg_replace('/[^0-9]/', '', (string)($u->phone_number ?? ''));
                $u10 = substr($uDigits, -10);
                if (isset($phone10Map[$u10])) {
                    $rawP = $phone10Map[$u10];
                    $displayName = trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
                    if (empty($displayName) || $displayName === 'User') {
                        $displayName = (!empty($u->name) && $u->name !== 'User') ? $u->name : "User #{$u->id}";
                    }
                    $u->name = $displayName;
                    $resolvedUserMap[$rawP] = $u;
                }
            }

            $consents->getCollection()->transform(function ($consent) use ($resolvedUserMap) {
                if (is_null($consent->user) && !empty($consent->phone_number) && isset($resolvedUserMap[$consent->phone_number])) {
                    $consent->setRelation('user', $resolvedUserMap[$consent->phone_number]);
                } elseif ($consent->user) {
                    $u = $consent->user;
                    $displayName = trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? ''));
                    if (empty($displayName) || $displayName === 'User') {
                        $displayName = (!empty($u->name) && $u->name !== 'User') ? $u->name : "User #{$u->id}";
                    }
                    $u->name = $displayName;
                }
                return $consent;
            });
        }

        return response()->json([
            'success' => true,
            'data' => $consents,
        ]);
    }
}

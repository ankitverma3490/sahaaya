<?php

namespace App\Services\Admin;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class AadhaarVerificationService
{
    protected $provider;

    // Sandbox.co.in credentials
    protected $sandboxBaseUrl;
    protected $sandboxApiKey;
    protected $sandboxApiSecret;
    protected $sandboxApiVersion;

    // DigiVerification credentials
    protected $digiBaseUrl;
    protected $digiPartnerCode;
    protected $digiTokenKey;
    protected $digiJwtToken;

    public function __construct()
    {
        $this->provider = config('services.aadhaar.provider', env('AADHAAR_PROVIDER', 'sandbox'));

        // Sandbox settings
        $this->sandboxBaseUrl = config('services.aadhaar.sandbox.base_url', env('SANDBOX_BASE_URL', 'https://api.sandbox.co.in'));
        $this->sandboxApiKey = config('services.aadhaar.sandbox.api_key', env('SANDBOX_API_KEY', 'key_live_c073be67661d4a3d8de6d5db0fc848e1'));
        $this->sandboxApiSecret = config('services.aadhaar.sandbox.api_secret', env('SANDBOX_API_SECRET', 'secret_live_1b663a10cf0f4c64b117c28128003f38'));
        $this->sandboxApiVersion = config('services.aadhaar.sandbox.api_version', env('SANDBOX_API_VERSION', '1.0.0'));

        // DigiVerification settings
        $this->digiBaseUrl = config('services.aadhaar.digiverification.base_url', env('AADHAAR_API_BASE_URL', 'https://api.digiverification.com'));
        $this->digiPartnerCode = config('services.aadhaar.digiverification.partner_code', env('AADHAAR_PARTNER_CODE', 'ESP00120'));
        $this->digiTokenKey = config('services.aadhaar.digiverification.token_key', env('AADHAAR_TOKEN_KEY', '62eedbdf05b47a026ef0fe708d387ae352294c26'));
        $this->digiJwtToken = $this->generateDigiJwtToken();
    }

    /**
     * Generate JWT Token for DigiVerification API authentication
     */
    protected function generateDigiJwtToken()
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'partnerId' => $this->digiPartnerCode,
            'timestamp' => time()
        ]);
        
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->digiTokenKey, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Get or generate Sandbox access token
     */
    protected function getSandboxAccessToken()
    {
        $cacheKey = 'sandbox_aadhaar_access_token_' . md5($this->sandboxApiKey);
        $cachedToken = Cache::get($cacheKey);
        if ($cachedToken) {
            return $cachedToken;
        }

        try {
            Log::info('Authenticating with Sandbox.co.in', [
                'base_url' => $this->sandboxBaseUrl,
                'api_key' => substr($this->sandboxApiKey, 0, 10) . '...'
            ]);

            $response = Http::timeout(15)
                ->withHeaders([
                    'x-api-key' => $this->sandboxApiKey,
                    'x-api-secret' => $this->sandboxApiSecret,
                    'x-api-version' => $this->sandboxApiVersion,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post("{$this->sandboxBaseUrl}/authenticate");

            $data = $response->json();

            if ($response->successful() && !empty($data['data']['access_token'])) {
                $token = $data['data']['access_token'];
                Cache::put($cacheKey, $token, now()->addHours(20));
                return $token;
            }

            Log::error('Sandbox authentication failed', [
                'status' => $response->status(),
                'response' => $data
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Sandbox authentication exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Send OTP to Aadhaar number
     */
    public function sendOtp($aadhaarNumber)
    {
        if ($this->provider === 'sandbox') {
            return $this->sendOtpSandbox($aadhaarNumber);
        }

        return $this->sendOtpDigi($aadhaarNumber);
    }

    /**
     * Send OTP via Sandbox.co.in
     */
    protected function sendOtpSandbox($aadhaarNumber)
    {
        $maxRetries = 2;
        $attempt = 0;

        while ($attempt < $maxRetries) {
            $attempt++;
            try {
                $token = $this->getSandboxAccessToken();
                if (!$token) {
                    Log::warning('Sandbox token unavailable, falling back to DigiVerification');
                    return $this->sendOtpDigi($aadhaarNumber);
                }

                Log::info("Sandbox Aadhaar OTP Request (Attempt $attempt)", ['aadhaar' => substr($aadhaarNumber, 0, 4) . 'XXXX' . substr($aadhaarNumber, -4)]);

                $response = Http::timeout(15)
                    ->withHeaders([
                        'x-api-key' => $this->sandboxApiKey,
                        'authorization' => $token,
                        'x-api-version' => $this->sandboxApiVersion,
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                    ])
                    ->post("{$this->sandboxBaseUrl}/kyc/aadhaar/okyc/otp", [
                        '@entity' => 'in.co.sandbox.kyc.aadhaar.okyc.otp.request',
                        'aadhaar_number' => (string) $aadhaarNumber,
                        'consent' => 'Y',
                        'reason' => 'For KYC verification'
                    ]);

                $data = $response->json();
                Log::info("Sandbox Aadhaar OTP Response (Attempt $attempt)", [
                    'status' => $response->status(),
                    'response' => $data
                ]);

                if ($response->status() === 401) {
                    Cache::forget('sandbox_aadhaar_access_token_' . md5($this->sandboxApiKey));
                    continue;
                }

                $refId = $data['data']['reference_id'] ?? $data['reference_id'] ?? null;
                if ($response->successful() && $refId) {
                    return [
                        'success' => true,
                        'message' => $data['data']['message'] ?? $data['message'] ?? 'OTP sent successfully',
                        'reference_id' => (string) $refId,
                        'provider' => 'sandbox',
                        'data' => $data
                    ];
                }

                $errorMsg = $data['message'] ?? $data['data']['message'] ?? 'Failed to send OTP';
                return [
                    'success' => false,
                    'message' => $errorMsg,
                    'error' => $data['error'] ?? $errorMsg,
                    'data' => $data
                ];
            } catch (\Exception $e) {
                Log::error("Sandbox OTP Exception (Attempt $attempt)", ['error' => $e->getMessage()]);
                if ($attempt >= $maxRetries) {
                    return $this->sendOtpDigi($aadhaarNumber);
                }
            }
        }

        return $this->sendOtpDigi($aadhaarNumber);
    }

    /**
     * Send OTP via DigiVerification (legacy / fallback)
     */
    protected function sendOtpDigi($aadhaarNumber)
    {
        $maxRetries = 3;
        $attempt = 0;

        while ($attempt < $maxRetries) {
            $attempt++;
            try {
                Log::info("Digi Aadhaar OTP Request (Attempt $attempt)", ['aadhaar' => $aadhaarNumber]);

                $response = Http::timeout(15)
                    ->withHeaders([
                        'jwt-token' => $this->digiJwtToken,
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                    ])->post("{$this->digiBaseUrl}/api/v5/aadhaar/send-otp", [
                        'aadhaar_number' => $aadhaarNumber
                    ]);

                $data = $response->json();
                Log::info("Digi Aadhaar OTP Response (Attempt $attempt)", [
                    'status' => $response->status(),
                    'response' => $data
                ]);

                if ($response->successful() && isset($data['reference_id'])) {
                    return [
                        'success' => true,
                        'message' => $data['message'] ?? 'OTP sent successfully',
                        'reference_id' => $data['reference_id'],
                        'provider' => 'digiverification',
                        'data' => $data
                    ];
                }

                $errorMsg = $data['message'] ?? $data['error'] ?? 'Failed to send OTP';
                $isTempUnavailable = stripos($errorMsg, 'temporarily unavailable') !== false
                    || stripos($errorMsg, 'authorised source') !== false
                    || stripos($errorMsg, 'try after some time') !== false
                    || stripos($errorMsg, '30 sec') !== false;

                if ($isTempUnavailable && $attempt < $maxRetries) {
                    sleep(2);
                    continue;
                }

                return [
                    'success' => false,
                    'message' => $isTempUnavailable
                        ? 'Aadhaar service is temporarily busy. Please try again in a moment.'
                        : $errorMsg,
                    'error' => $data['error'] ?? 'Unknown error',
                    'data' => $data
                ];

            } catch (\Exception $e) {
                Log::error("Digi Aadhaar OTP Error (Attempt $attempt)", ['error' => $e->getMessage()]);
                if ($attempt < $maxRetries) {
                    sleep(2);
                    continue;
                }
                return [
                    'success' => false,
                    'message' => 'Aadhaar service is temporarily busy. Please try again in a moment.',
                    'error' => $e->getMessage()
                ];
            }
        }
    }

    /**
     * Verify OTP and get Aadhaar details
     */
    public function verifyOtp($otp, $referenceId)
    {
        if ($this->provider === 'sandbox') {
            return $this->verifyOtpSandbox($otp, $referenceId);
        }

        return $this->verifyOtpDigi($otp, $referenceId);
    }

    /**
     * Verify OTP via Sandbox.co.in
     */
    protected function verifyOtpSandbox($otp, $referenceId)
    {
        try {
            $token = $this->getSandboxAccessToken();
            if (!$token) {
                Log::warning('Sandbox token unavailable for verify, trying Digi');
                return $this->verifyOtpDigi($otp, $referenceId);
            }

            Log::info("Sandbox Aadhaar Verify Request", [
                'otp' => $otp,
                'reference_id' => $referenceId
            ]);

            $response = Http::timeout(15)
                ->withHeaders([
                    'x-api-key' => $this->sandboxApiKey,
                    'authorization' => $token,
                    'x-api-version' => $this->sandboxApiVersion,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post("{$this->sandboxBaseUrl}/kyc/aadhaar/okyc/otp/verify", [
                    '@entity' => 'in.co.sandbox.kyc.aadhaar.okyc.otp.verify.request',
                    'reference_id' => (string) $referenceId,
                    'otp' => (string) $otp,
                    'consent' => 'Y'
                ]);

            $data = $response->json();
            Log::info("Sandbox Aadhaar Verify Response", [
                'status' => $response->status(),
                'response' => $data
            ]);

            if ($response->successful() && !empty($data['data'])) {
                $payload = $data['data'];

                // Format address if structured
                $address = $payload['address'] ?? null;
                if (is_array($address)) {
                    $addressParts = array_filter([
                        $address['house'] ?? '',
                        $address['street'] ?? '',
                        $address['landmark'] ?? '',
                        $address['vtc'] ?? $address['loc'] ?? '',
                        $address['district'] ?? '',
                        $address['state'] ?? '',
                        $address['pincode'] ?? ''
                    ]);
                    $address = implode(', ', $addressParts);
                }

                $gender = $payload['gender'] ?? null;
                if ($gender === 'M' || $gender === 'm') $gender = 'Male';
                elseif ($gender === 'F' || $gender === 'f') $gender = 'Female';

                return [
                    'success' => true,
                    'message' => $data['message'] ?? 'Aadhaar verified successfully',
                    'aadhaar_data' => [
                        'name' => $payload['name'] ?? $payload['full_name'] ?? null,
                        'dob' => $payload['dob'] ?? null,
                        'gender' => $gender,
                        'address' => $address,
                        'photo' => $payload['profile_image'] ?? $payload['photo'] ?? null,
                        'aadhaar_number' => $payload['masked_aadhaar_number'] ?? $payload['aadhaar_number'] ?? null,
                        'mobile_number' => $payload['mobile_number'] ?? $payload['phone_number'] ?? null,
                    ],
                    'raw_data' => $data
                ];
            }

            $errorMsg = $data['message'] ?? $data['data']['message'] ?? 'Failed to verify OTP';
            return [
                'success' => false,
                'message' => $errorMsg,
                'error' => $data['error'] ?? $errorMsg,
                'data' => $data
            ];
        } catch (\Exception $e) {
            Log::error("Sandbox Verify Exception", ['error' => $e->getMessage()]);
            return $this->verifyOtpDigi($otp, $referenceId);
        }
    }

    /**
     * Verify OTP via DigiVerification (legacy / fallback)
     */
    protected function verifyOtpDigi($otp, $referenceId)
    {
        $maxRetries = 3;
        $attempt = 0;

        while ($attempt < $maxRetries) {
            $attempt++;
            try {
                Log::info("Digi Aadhaar Verify Request (Attempt $attempt)", [
                    'otp' => $otp,
                    'reference_id' => $referenceId
                ]);

                $response = Http::timeout(15)
                    ->withHeaders([
                        'jwt-token' => $this->digiJwtToken,
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                    ])->post("{$this->digiBaseUrl}/api/v5/aadhaar/verify-otp", [
                        'otp' => $otp,
                        'reference_id' => $referenceId
                    ]);

                $data = $response->json();
                
                Log::info("Digi Aadhaar Verify Response (Attempt $attempt)", [
                    'status' => $response->status(),
                    'response' => $data
                ]);

                $isStatusExplicitlyFalse = isset($data['status']) && ($data['status'] === false || $data['status'] === 'false' || $data['status'] === 0 || $data['status'] === '0');
                $isSuccessExplicitlyFalse = isset($data['success']) && ($data['success'] === false || $data['success'] === 'false' || $data['success'] === 0 || $data['success'] === '0');

                $isApiSuccess = $response->successful() 
                    && !$isStatusExplicitlyFalse
                    && !$isSuccessExplicitlyFalse
                    && !empty($data['data']) 
                    && (isset($data['status_code']) ? in_array($data['status_code'], [200, '200'], true) : true)
                    && (!empty($data['data']['full_name']) || !empty($data['data']['name']) || !empty($data['data']['aadhaar_number']) || !empty($data['data']['dob']) || !empty($data['data']['address']) || !empty($data['data']['photo']) || (isset($data['status']) && in_array($data['status'], [true, 'true', 1, '1', 200, 'success'], true)));

                if ($isApiSuccess) {
                    return [
                        'success' => true,
                        'message' => $data['message'] ?? 'Aadhaar verified successfully',
                        'aadhaar_data' => [
                            'name' => $data['data']['full_name'] ?? $data['data']['name'] ?? null,
                            'dob' => $data['data']['dob'] ?? null,
                            'gender' => $data['data']['gender'] ?? null,
                            'address' => $data['data']['address'] ?? null,
                            'photo' => $data['data']['photo'] ?? null,
                            'aadhaar_number' => $data['data']['aadhaar_number'] ?? null,
                            'mobile_number' => $data['data']['mobile_number'] 
                                ?? $data['data']['phone_number'] 
                                ?? $data['data']['phone'] 
                                ?? $data['data']['mobile'] 
                                ?? $data['data']['contact_number'] 
                                ?? $data['data']['user_phone'] 
                                ?? $data['mobile_number'] 
                                ?? $data['phone_number'] 
                                ?? $data['phone'] 
                                ?? null,
                        ],
                        'raw_data' => $data
                    ];
                }

                $errorMsg = $data['message'] ?? $data['error'] ?? 'Failed to verify OTP';
                $isTempUnavailable = stripos($errorMsg, 'temporarily unavailable') !== false
                    || stripos($errorMsg, 'authorised source') !== false
                    || stripos($errorMsg, 'try after some time') !== false
                    || stripos($errorMsg, '30 sec') !== false;

                if ($isTempUnavailable && $attempt < $maxRetries) {
                    sleep(2);
                    continue;
                }

                return [
                    'success' => false,
                    'message' => $isTempUnavailable
                        ? 'Aadhaar service is temporarily busy. Please try again in a moment.'
                        : $errorMsg,
                    'error' => $data['error'] ?? $errorMsg,
                    'data' => $data
                ];

            } catch (\Exception $e) {
                Log::error("Digi Aadhaar Verify Error (Attempt $attempt)", [
                    'error' => $e->getMessage()
                ]);

                if ($attempt < $maxRetries) {
                    sleep(2);
                    continue;
                }

                return [
                    'success' => false,
                    'message' => 'Failed to verify OTP',
                    'error' => $e->getMessage()
                ];
            }
        }
    }
}

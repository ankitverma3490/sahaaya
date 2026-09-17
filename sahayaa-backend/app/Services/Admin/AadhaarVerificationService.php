<?php

namespace App\Services\Admin;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AadhaarVerificationService
{
    protected $baseUrl;
    protected $partnerCode;
    protected $tokenKey;
    protected $jwtToken;

    public function __construct()
    {
        $this->baseUrl = config('services.aadhaar.base_url', 'https://api.digiverification.com');
        $this->partnerCode = config('services.aadhaar.partner_code', 'ESP00120');
        $this->tokenKey = config('services.aadhaar.token_key', '62eedbdf05b47a026ef0fe708d387ae352294c26');
        $this->jwtToken = $this->generateJwtToken();
    }

    /**
     * Generate JWT Token for API authentication
     */
    protected function generateJwtToken()
    {
        // Generate JWT token with correct partner code ESP00120
        // Format: header.payload.signature
        
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'partnerId' => $this->partnerCode, // ESP00120
            'timestamp' => time()
        ]);
        
        // Base64 URL encode
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        // Create signature
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->tokenKey, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
        
        Log::info('Generated JWT Token', [
            'partner_code' => $this->partnerCode,
            'token' => $jwt
        ]);
        
        return $jwt;
    }

    /**
     * Send OTP to Aadhaar number
     * 
     * @param string $aadhaarNumber 12-digit Aadhaar number
     * @return array Response with status, message, and reference_id
     */
    public function sendOtp($aadhaarNumber)
    {
        $maxRetries = 3;
        $attempt = 0;

        while ($attempt < $maxRetries) {
            $attempt++;
            try {
                Log::info("Aadhaar OTP Request (Attempt $attempt)", ['aadhaar' => $aadhaarNumber]);

                $response = Http::timeout(15)
                    ->withHeaders([
                        'jwt-token' => $this->jwtToken,
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                    ])->post("{$this->baseUrl}/api/v5/aadhaar/send-otp", [
                        'aadhaar_number' => $aadhaarNumber
                    ]);

                $data = $response->json();
                
                Log::info("Aadhaar OTP Response (Attempt $attempt)", [
                    'status' => $response->status(),
                    'response' => $data
                ]);

                if ($response->successful() && isset($data['reference_id'])) {
                    return [
                        'success' => true,
                        'message' => $data['message'] ?? 'OTP sent successfully',
                        'reference_id' => $data['reference_id'],
                        'data' => $data
                    ];
                }

                $errorMsg = $data['message'] ?? $data['error'] ?? 'Failed to send OTP';
                $isTempUnavailable = stripos($errorMsg, 'temporarily unavailable') !== false
                    || stripos($errorMsg, 'authorised source') !== false
                    || stripos($errorMsg, 'try after some time') !== false
                    || stripos($errorMsg, '30 sec') !== false;

                if ($isTempUnavailable && $attempt < $maxRetries) {
                    sleep(2); // Wait 2 seconds before retrying
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
                Log::error("Aadhaar OTP Error (Attempt $attempt)", [
                    'error' => $e->getMessage()
                ]);

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
     * 
     * @param string $otp 6-digit OTP
     * @param string $referenceId Reference ID from send-otp API
     * @return array Response with verification status and Aadhaar details
     */
    public function verifyOtp($otp, $referenceId)
    {
        $maxRetries = 3;
        $attempt = 0;

        while ($attempt < $maxRetries) {
            $attempt++;
            try {
                Log::info("Aadhaar Verify Request (Attempt $attempt)", [
                    'otp' => $otp,
                    'reference_id' => $referenceId
                ]);

                $response = Http::timeout(15)
                    ->withHeaders([
                        'jwt-token' => $this->jwtToken,
                        'Accept' => 'application/json',
                        'Content-Type' => 'application/json',
                    ])->post("{$this->baseUrl}/api/v5/aadhaar/verify-otp", [
                        'otp' => $otp,
                        'reference_id' => $referenceId
                    ]);

                $data = $response->json();
                
                Log::info("Aadhaar Verify Response (Attempt $attempt)", [
                    'status' => $response->status(),
                    'response' => $data
                ]);

                $isApiSuccess = $response->successful() 
                    && !empty($data['data']) 
                    && (isset($data['status']) ? ($data['status'] === true || $data['status'] === 200 || $data['status'] === 'success' || $data['status'] === '1') : true)
                    && (isset($data['status_code']) ? $data['status_code'] === 200 : true);

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
                    sleep(2); // Wait 2 seconds before retrying
                    continue;
                }

                return [
                    'success' => false,
                    'message' => $isTempUnavailable
                        ? 'Aadhaar service is temporarily busy. Please try again in a moment.'
                        : $errorMsg,
                    'error' => $data['error'] ?? 'Invalid OTP or reference ID',
                    'data' => $data
                ];

            } catch (\Exception $e) {
                Log::error("Aadhaar Verify Error (Attempt $attempt)", [
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

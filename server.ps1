# Lightweight PowerShell Local HTTP & REST Server for Aavin Sangam
$port = 8080
$path = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

$ALLOWED_FACILITIES = @('MAIN_DAIRY', 'FEEDER_BALANCING_DAIRY', 'DAIRY_PLANT', 'PROCESSING_UNIT', 'SPECIALISED_DAIRY_PLANT')

# In-memory OTP storage for demo/session validation
$Global:OTP_STORE = @{}
$Global:VERIFIED_TOKENS = @{}

function Get-HaversineKm([double]$lat1, [double]$lon1, [double]$lat2, [double]$lon2) {
    try {
        $r = 6371.0
        $p1 = $lat1 * [Math]::PI / 180.0
        $p2 = $lat2 * [Math]::PI / 180.0
        $dLat = ($lat2 - $lat1) * [Math]::PI / 180.0
        $dLon = ($lon2 - $lon1) * [Math]::PI / 180.0
        $a = [Math]::Sin($dLat / 2.0) * [Math]::Sin($dLat / 2.0) +
             [Math]::Cos($p1) * [Math]::Cos($p2) *
             [Math]::Sin($dLon / 2.0) * [Math]::Sin($dLon / 2.0)
        $c = 2.0 * [Math]::Atan2([Math]::Sqrt($a), [Math]::Sqrt(1.0 - $a))
        return [Math]::Round($r * $c, 2)
    } catch {
        return 9999.0
    }
}

function Send-JsonResponse($response, $statusCode, $data) {
    try {
        $response.StatusCode = $statusCode
        $response.ContentType = "application/json; charset=utf-8"
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        $jsonString = $data | ConvertTo-Json -Depth 10
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonString)
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        $response.OutputStream.Flush()
        $response.Close()
    } catch {}
}

function Get-RequestBodyJson($request) {
    try {
        if ($request.HasEntityBody) {
            $enc = if ($request.ContentEncoding) { $request.ContentEncoding } else { [System.Text.Encoding]::UTF8 }
            $reader = New-Object System.IO.StreamReader($request.InputStream, $enc)
            $bodyText = $reader.ReadToEnd()
            $reader.Close()
            if (-not [string]::IsNullOrWhiteSpace($bodyText)) {
                return $bodyText | ConvertFrom-Json
            }
        }
    } catch {
        Write-Host "Get-RequestBodyJson error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    return $null
}

function Get-MaskedEmail([string]$em) {
    if ([string]::IsNullOrWhiteSpace($em)) { return "***" }
    $parts = $em.Trim().ToLower().Split('@')
    if ($parts.Length -ne 2) { return "***" }
    $local = $parts[0]
    $domain = $parts[1]
    if ($local.Length -le 2) {
        return "$($local.Substring(0, 1))***@$domain"
    }
    return "$($local.Substring(0, 1))***$($local.Substring($local.Length - 1, 1))@$domain"
}

function Send-BrevoSmtpMail($hostName, $port, $user, $pass, $fromEmail, $fromName, $toEmail, $subject, $htmlBody) {
    try {
        $smtp = New-Object System.Net.Mail.SmtpClient($hostName, [int]$port)
        $smtp.EnableSsl = $true
        $smtp.DeliveryMethod = [System.Net.Mail.SmtpDeliveryMethod]::Network
        $smtp.UseDefaultCredentials = $false
        $smtp.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
        $smtp.Timeout = 12000

        $mail = New-Object System.Net.Mail.MailMessage
        $mail.From = New-Object System.Net.Mail.MailAddress($fromEmail, $fromName)
        $mail.To.Add($toEmail)
        $mail.Subject = $subject
        $mail.Body = $htmlBody
        $mail.IsBodyHtml = $true

        $smtp.Send($mail)
        $smtp.Dispose()
        $mail.Dispose()
        return @{ Success = $true; Provider = "Brevo SMTP" }
    } catch {
        return @{ Success = $false; Provider = "Brevo SMTP"; Error = $_.Exception.Message }
    }
}

function Send-BrevoRestApiMail($apiKey, $fromEmail, $fromName, $toEmail, $subject, $htmlBody) {
    try {
        $headers = @{
            "api-key" = $apiKey
            "Content-Type" = "application/json"
            "Accept" = "application/json"
        }
        $body = @{
            sender = @{ name = $fromName; email = $fromEmail }
            to = @( @{ email = $toEmail } )
            subject = $subject
            htmlContent = $htmlBody
        } | ConvertTo-Json -Depth 5

        $res = Invoke-RestMethod -Uri "https://api.brevo.com/v3/smtp/email" -Method Post -Headers $headers -Body $body -TimeoutSec 10 -ErrorAction Stop
        return @{ Success = $true; Provider = "Brevo API"; MessageId = $res.messageId }
    } catch {
        return @{ Success = $false; Provider = "Brevo API"; Error = $_.Exception.Message }
    }
}

try {
    $listener.Start()
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  Aavin Sangam Server & REST API Running at:" -ForegroundColor Green
    Write-Host "  http://localhost:$port/" -ForegroundColor Yellow
    Write-Host "  REST API: http://localhost:$port/api/dairies" -ForegroundColor Magenta
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server.`n"

    while ($listener.IsListening) {
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $method = $request.HttpMethod
            $urlPath = $request.Url.LocalPath.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($urlPath)) {
                $urlPath = "index.html"
            }
            $urlPath = [System.Uri]::UnescapeDataString($urlPath)

            # CORS Preflight
            if ($method -eq "OPTIONS") {
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
                $response.StatusCode = 204
                $response.Close()
                continue
            }

            # -------------------------------------------------------------
            # REST API: /api/auth/send-otp (Resend Email & Mobile OTP Engine)
            # -------------------------------------------------------------
            if ($urlPath -eq "api/auth/send-otp" -and $method -eq "POST") {
                $requestId = [System.Guid]::NewGuid().ToString()
                $body = Get-RequestBodyJson $request
                $email = if ($body.email) { $body.email.Trim().ToLower() } else { '' }
                $phone = if ($body.phone) { ($body.phone -replace '\D', '').Trim() } else { '' }
                $targetKey = if (-not [string]::IsNullOrWhiteSpace($email)) { $email } else { $phone }

                if ([string]::IsNullOrWhiteSpace($targetKey)) {
                    Send-JsonResponse $response 400 @{
                        success = $false
                        error = "MISSING_IDENTIFIER"
                        message = "Please provide an email address or mobile number."
                        requestId = $requestId
                    }
                    continue
                }

                if (-not [string]::IsNullOrWhiteSpace($email) -and -not ($email -match "^[^\s@]+@[^\s@]+\.[^\s@]+$")) {
                    Send-JsonResponse $response 400 @{
                        success = $false
                        error = "INVALID_EMAIL"
                        message = "Please enter a valid email address."
                        requestId = $requestId
                    }
                    continue
                }

                if ([string]::IsNullOrWhiteSpace($email) -and ($phone.Length -ne 10)) {
                    Send-JsonResponse $response 400 @{
                        success = $false
                        error = "INVALID_PHONE"
                        message = "Please enter a valid 10-digit mobile number."
                        requestId = $requestId
                    }
                    continue
                }

                $COOLDOWN_SECONDS = 60
                if ($Global:OTP_STORE.ContainsKey($targetKey)) {
                    $existing = $Global:OTP_STORE[$targetKey]
                    $secPassed = ([DateTime]::UtcNow - $existing.createdAt).TotalSeconds
                    if ($secPassed -lt $COOLDOWN_SECONDS) {
                        $waitLeft = [Math]::Ceiling($COOLDOWN_SECONDS - $secPassed)
                        Send-JsonResponse $response 429 @{
                            success = $false
                            error = "RATE_LIMITED"
                            message = "Please wait $waitLeft seconds before requesting another code."
                            cooldownSeconds = $waitLeft
                            requestId = $requestId
                        }
                        continue
                    }
                }

                $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
                $bytes = New-Object byte[] 4
                $rng.GetBytes($bytes)
                $num = [Math]::Abs([System.BitConverter]::ToInt32($bytes, 0))
                $otpCode = (100000 + ($num % 900000)).ToString()

                # Store secure SHA-256 hashed OTP
                $sha = [System.Security.Cryptography.SHA256]::Create()
                $otpHashBytes = $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($otpCode))
                $hashedOtp = [System.BitConverter]::ToString($otpHashBytes).Replace("-", "").ToLower()

                # Email Delivery Integration (Brevo SMTP & REST API)
                if (-not [string]::IsNullOrWhiteSpace($email)) {
                    $brevoHost = if ($env:BREVO_SMTP_HOST) { $env:BREVO_SMTP_HOST } else { "smtp-relay.brevo.com" }
                    $brevoPort = if ($env:BREVO_SMTP_PORT) { [int]$env:BREVO_SMTP_PORT } else { 587 }
                    $brevoUser = $env:BREVO_SMTP_USER
                    $brevoPassword = $env:BREVO_SMTP_PASSWORD
                    $brevoFromEmail = if ($env:BREVO_FROM_EMAIL) { $env:BREVO_FROM_EMAIL } else { "noreply@aavin.com" }
                    $brevoFromName = if ($env:BREVO_FROM_NAME) { $env:BREVO_FROM_NAME } else { "AAVIN Main Dairy Management" }
                    $brevoApiKey = $env:BREVO_API_KEY

                    $envFile = Join-Path $path ".env"
                    if (Test-Path $envFile) {
                        Get-Content $envFile | ForEach-Object {
                            $line = $_.Trim()
                            if ($line -match "^BREVO_SMTP_HOST\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($env:BREVO_SMTP_HOST)) {
                                $brevoHost = $matches[1].Trim('"' + "'")
                            }
                            if ($line -match "^BREVO_SMTP_PORT\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($env:BREVO_SMTP_PORT)) {
                                $brevoPort = [int]$matches[1].Trim('"' + "'")
                            }
                            if ($line -match "^BREVO_SMTP_USER\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($brevoUser)) {
                                $brevoUser = $matches[1].Trim('"' + "'")
                            }
                            if ($line -match "^BREVO_SMTP_PASSWORD\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($brevoPassword)) {
                                $brevoPassword = $matches[1].Trim('"' + "'")
                            }
                            if ($line -match "^BREVO_FROM_EMAIL\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($env:BREVO_FROM_EMAIL)) {
                                $brevoFromEmail = $matches[1].Trim('"' + "'")
                            }
                            if ($line -match "^BREVO_FROM_NAME\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($env:BREVO_FROM_NAME)) {
                                $brevoFromName = $matches[1].Trim('"' + "'")
                            }
                            if ($line -match "^BREVO_API_KEY\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($brevoApiKey)) {
                                $brevoApiKey = $matches[1].Trim('"' + "'")
                            }
                        }
                    }

                    $masked = Get-MaskedEmail $email
                    $ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
                    $emailSubject = "Aavin Sangam - Email Verification Code ($otpCode)"
                    $emailHtml = "<div style='font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc;'><div style='max-width: 500px; margin: 0 auto; background: white; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'><div style='text-align: center; margin-bottom: 20px;'><h2 style='color: #07355e; margin: 0;'>ஆவின் சங்கம் • Aavin Sangam</h2><p style='color: #64748b; font-size: 13px; margin-top: 4px;'>Digital Cooperative Federation • Tamil Nadu</p></div><p style='font-size: 14px; color: #334155;'>Hello,</p><p style='font-size: 14px; color: #334155; line-height: 1.5;'>Your 6-digit verification code for Aavin Member Registration is:</p><div style='font-size: 32px; font-weight: 800; color: #0b4f8a; letter-spacing: 6px; padding: 16px; background: #e0f2fe; text-align: center; border-radius: 8px; margin: 20px 0;'>$otpCode</div><p style='color: #64748b; font-size: 12.5px; line-height: 1.4;'>This code expires in 10 minutes. For your security, do not share this code with anyone.</p><hr style='border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;' /><p style='color: #94a3b8; font-size: 11px; text-align: center; margin: 0;'>Government of Tamil Nadu • Dairy Development Department</p></div></div>"

                    $emailDispatched = $false
                    $deliveryProvider = "Brevo SMTP"
                    $deliveryError = ""

                    # 1. ATTEMPT BREVO SMTP VIA .NET SMTPCLIENT
                    if (-not [string]::IsNullOrWhiteSpace($brevoUser) -and -not [string]::IsNullOrWhiteSpace($brevoPassword)) {
                        $smtpRes = Send-BrevoSmtpMail $brevoHost $brevoPort $brevoUser $brevoPassword $brevoFromEmail $brevoFromName $email $emailSubject $emailHtml
                        if ($smtpRes.Success) {
                            $emailDispatched = $true
                            $deliveryProvider = "Brevo SMTP"
                        } else {
                            $deliveryError = $smtpRes.Error
                            # Retry once if transient network failure
                            Start-Sleep -Milliseconds 400
                            $retryRes = Send-BrevoSmtpMail $brevoHost $brevoPort $brevoUser $brevoPassword $brevoFromEmail $brevoFromName $email $emailSubject $emailHtml
                            if ($retryRes.Success) {
                                $emailDispatched = $true
                                $deliveryProvider = "Brevo SMTP (Retry)"
                            } else {
                                $deliveryError = $retryRes.Error
                            }
                        }
                    }

                    # 2. ATTEMPT BREVO REST API IF SMTP FAILED AND API KEY EXISTS
                    if (-not $emailDispatched -and (-not [string]::IsNullOrWhiteSpace($brevoApiKey) -or ($brevoPassword -and ($brevoPassword.StartsWith("xsmtpsib-") -or $brevoPassword.StartsWith("xkeysib-"))))) {
                        $apiKeyToUse = if ($brevoApiKey) { $brevoApiKey } else { $brevoPassword }
                        $apiRes = Send-BrevoRestApiMail $apiKeyToUse $brevoFromEmail $brevoFromName $email $emailSubject $emailHtml
                        if ($apiRes.Success) {
                            $emailDispatched = $true
                            $deliveryProvider = "Brevo API"
                        } else {
                            $deliveryError = $apiRes.Error
                        }
                    }

                    if ($emailDispatched) {
                        Write-Host "[AAVIN AUTH] [$ts] [$requestId] Provider: $deliveryProvider | To: $masked | Status: ACCEPTED | Msg: Verification email dispatched" -ForegroundColor Green
                        
                        # Store in OTP Cache only on successful delivery
                        $Global:OTP_STORE[$targetKey] = @{
                            hashedOtp = $hashedOtp
                            createdAt = [DateTime]::UtcNow
                            expiresAt = [DateTime]::UtcNow.AddMinutes(10)
                            attempts = 0
                            verified = $false
                        }

                        Send-JsonResponse $response 200 @{
                            success = $true
                            email = $email
                            message = "Verification email sent. Please check your inbox and spam folder."
                            cooldownSeconds = $COOLDOWN_SECONDS
                            requestId = $requestId
                        }
                        continue
                    } else {
                        Write-Host "[AAVIN AUTH] [$ts] [$requestId] Provider: Brevo | To: $masked | Status: REJECTED | Error: $deliveryError" -ForegroundColor Red
                        
                        # Do NOT store OTP and do NOT report false success
                        if ($Global:OTP_STORE.ContainsKey($targetKey)) {
                            $Global:OTP_STORE.Remove($targetKey)
                        }

                        Send-JsonResponse $response 502 @{
                            success = $false
                            error = "EMAIL_DELIVERY_FAILED"
                            message = "We couldn't send the verification email right now. Please try again."
                            requestId = $requestId
                        }
                        continue
                    }
                } else {
                    # Mobile SMS OTP
                    $Global:OTP_STORE[$targetKey] = @{
                        hashedOtp = $hashedOtp
                        createdAt = [DateTime]::UtcNow
                        expiresAt = [DateTime]::UtcNow.AddMinutes(10)
                        attempts = 0
                        verified = $false
                    }

                    $ts = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
                    Write-Host "[AAVIN AUTH] [$ts] [$requestId] Provider: SMS | Mobile: +91 $phone | Status: ACCEPTED" -ForegroundColor Green

                    Send-JsonResponse $response 200 @{
                        success = $true
                        phone = $phone
                        message = "Verification OTP sent successfully to +91 $phone"
                        cooldownSeconds = $COOLDOWN_SECONDS
                        requestId = $requestId
                    }
                    continue
                }
            }

            # -------------------------------------------------------------
            # REST API: /api/auth/verify-otp (Email & Mobile OTP Engine)
            # -------------------------------------------------------------
            if ($urlPath -eq "api/auth/verify-otp" -and $method -eq "POST") {
                $body = Get-RequestBodyJson $request
                $email = if ($body.email) { $body.email.Trim().ToLower() } else { '' }
                $phone = if ($body.phone) { ($body.phone -replace '\D', '').Trim() } else { '' }
                $code = if ($body.otp) { ($body.otp -replace '\D', '').Trim() } else { '' }
                $targetKey = if (-not [string]::IsNullOrWhiteSpace($email)) { $email } else { $phone }

                if ([string]::IsNullOrWhiteSpace($targetKey)) {
                    Send-JsonResponse $response 400 @{ success = $false; error = "MISSING_IDENTIFIER"; message = "Invalid email or mobile format." }
                    continue
                }

                if ([string]::IsNullOrWhiteSpace($code) -or $code.Length -ne 6) {
                    Send-JsonResponse $response 400 @{ success = $false; error = "INVALID_CODE"; message = "Please enter the complete 6-digit verification code." }
                    continue
                }

                if (-not $Global:OTP_STORE.ContainsKey($targetKey)) {
                    Send-JsonResponse $response 400 @{ success = $false; error = "NO_OTP_SENT"; message = "No active OTP request found for this account. Please click Resend Code." }
                    continue
                }

                $entry = $Global:OTP_STORE[$targetKey]

                if ([DateTime]::UtcNow -gt $entry.expiresAt) {
                    $Global:OTP_STORE.Remove($targetKey)
                    Send-JsonResponse $response 400 @{ success = $false; error = "EXPIRED_OTP"; message = "Verification code has expired. Please request a new code." }
                    continue
                }

                if ($entry.attempts -ge 5) {
                    $Global:OTP_STORE.Remove($targetKey)
                    Send-JsonResponse $response 400 @{ success = $false; error = "MAX_ATTEMPTS"; message = "Too many incorrect attempts. Please request a fresh code." }
                    continue
                }

                # Verify SHA-256 hash of entered code
                $sha = [System.Security.Cryptography.SHA256]::Create()
                $inputHashBytes = $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($code))
                $hashedInput = [System.BitConverter]::ToString($inputHashBytes).Replace("-", "").ToLower()

                if ($entry.hashedOtp -ne $hashedInput) {
                    $entry.attempts++
                    $remaining = 5 - $entry.attempts
                    Send-JsonResponse $response 400 @{
                        success = $false
                        error = "WRONG_OTP"
                        message = "Incorrect verification code. $remaining attempt(s) remaining."
                    }
                    continue
                }

                $verificationToken = [System.Guid]::NewGuid().ToString("N")
                $Global:OTP_STORE.Remove($targetKey)
                $Global:VERIFIED_TOKENS[$verificationToken] = @{
                    email = $email
                    phone = $phone
                    createdAt = [DateTime]::UtcNow
                    expiresAt = [DateTime]::UtcNow.AddMinutes(15)
                }

                Write-Host "[AAVIN OTP GATEWAY] Account $targetKey successfully verified." -ForegroundColor Cyan

                Send-JsonResponse $response 200 @{
                    success = $true
                    email = $email
                    phone = $phone
                    verified = $true
                    verificationToken = $verificationToken
                    message = "Account verified successfully."
                }
                continue
            }

            # -------------------------------------------------------------
            # REST API: /api/auth/register-member (Secure Server-Side Registration Gateway)
            # -------------------------------------------------------------
            if ($urlPath -eq "api/auth/register-member" -and $method -eq "POST") {
                $body = Get-RequestBodyJson $request
                $email = if ($body.email) { $body.email.Trim().ToLower() } else { '' }
                $rawPassword = if ($body.password) { [string]$body.password } else { '' }
                $token = if ($body.otpVerificationToken) { $body.otpVerificationToken.Trim() } elseif ($body.verificationToken) { $body.verificationToken.Trim() } else { '' }
                $fullName = if ($body.full_name) { $body.full_name.Trim() } elseif ($body.fullName_en) { $body.fullName_en.Trim() } elseif ($body.fullName) { $body.fullName.Trim() } else { '' }
                $fullNameTa = if ($body.full_name_ta) { $body.full_name_ta.Trim() } elseif ($body.fullName_ta) { $body.fullName_ta.Trim() } else { $fullName }
                $phone = if ($body.phone) { ($body.phone -replace '\D', '').Trim() } else { '' }
                $districtCode = if ($body.district_code) { $body.district_code.Trim().ToUpper() } elseif ($body.districtCode) { $body.districtCode.Trim().ToUpper() } else { 'MDU' }
                $districtName = if ($body.district_name) { $body.district_name.Trim() } elseif ($body.districtName_en) { $body.districtName_en.Trim() } else { 'Madurai District' }
                $sangamId = if ($body.sangam_id) { $body.sangam_id.Trim() } elseif ($body.sangamId) { $body.sangamId.Trim() } else { 'sgm-mdu' }
                $sangamName = if ($body.sangam_name) { $body.sangam_name.Trim() } elseif ($body.sangamName_en) { $body.sangamName_en.Trim() } else { 'Aavin Madurai Thozhilar Sangam' }
                $occupation = if ($body.occupation) { $body.occupation.Trim() } else { 'Farmer' }
                $sangamRole = if ($body.sangam_role) { $body.sangam_role.Trim() } elseif ($body.sangamRole) { $body.sangamRole.Trim() } else { 'Member' }
                $avatarUrl = if ($body.profile_photo) { $body.profile_photo.Trim() } elseif ($body.avatarUrl) { $body.avatarUrl.Trim() } else { 'assets/logo.jpg' }

                # 1. Validation
                if ([string]::IsNullOrWhiteSpace($email) -or -not ($email -match "^[^\s@]+@[^\s@]+\.[^\s@]+$")) {
                    Send-JsonResponse $response 400 @{ success = $false; error = "INVALID_EMAIL"; message = "Please provide a valid email address." }
                    continue
                }
                if ([string]::IsNullOrWhiteSpace($rawPassword) -or $rawPassword.Length -lt 6) {
                    Send-JsonResponse $response 400 @{ success = $false; error = "INVALID_PASSWORD"; message = "Password must be at least 6 characters long." }
                    continue
                }
                if ([string]::IsNullOrWhiteSpace($fullName)) {
                    Send-JsonResponse $response 400 @{ success = $false; error = "MISSING_NAME"; message = "Full name in English is required." }
                    continue
                }
                if ([string]::IsNullOrWhiteSpace($phone) -or $phone.Length -ne 10) {
                    Send-JsonResponse $response 400 @{ success = $false; error = "INVALID_PHONE"; message = "Please provide a valid 10-digit mobile number." }
                    continue
                }

                # 2. Token Security Validation
                if ([string]::IsNullOrWhiteSpace($token) -or -not $Global:VERIFIED_TOKENS.ContainsKey($token)) {
                    Send-JsonResponse $response 403 @{
                        success = $false
                        error = "INVALID_OR_EXPIRED_TOKEN"
                        message = "Email verification token is missing or expired. Please complete Email OTP verification first."
                    }
                    continue
                }

                $tokRecord = $Global:VERIFIED_TOKENS[$token]
                if ($tokRecord.email -ne $email -or [DateTime]::UtcNow -gt $tokRecord.expiresAt) {
                    $Global:VERIFIED_TOKENS.Remove($token)
                    Send-JsonResponse $response 403 @{
                        success = $false
                        error = "TOKEN_MISMATCH_OR_EXPIRED"
                        message = "Email verification token is invalid or has expired. Please verify your email again."
                    }
                    continue
                }

                # Immediately consume token
                $Global:VERIFIED_TOKENS.Remove($token)

                # 3. Environment Config
                $envFile = Join-Path $path ".env"
                $supUrl = "https://wmspmyhwsdefvvhwigav.supabase.co"
                $supKey = "sb_publishable_IKBhtnA1pyeEKD_sVUQ0ug_0q2Aso5t"
                $supServiceKey = ""
                if (Test-Path $envFile) {
                    Get-Content $envFile | ForEach-Object {
                        $line = $_.Trim()
                        if ($line -match "^VITE_SUPABASE_URL\s*=\s*(.+)$") { $supUrl = $matches[1].Trim('"' + "'") }
                        elseif ($line -match "^SUPABASE_URL\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($supUrl)) { $supUrl = $matches[1].Trim('"' + "'") }
                        elseif ($line -match "^VITE_SUPABASE_ANON_KEY\s*=\s*(.+)$") { $supKey = $matches[1].Trim('"' + "'") }
                        elseif ($line -match "^SUPABASE_ANON_KEY\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($supKey)) { $supKey = $matches[1].Trim('"' + "'") }
                        elseif ($line -match "^SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)$") { $supServiceKey = $matches[1].Trim('"' + "'") }
                        elseif ($line -match "^SERVICE_ROLE_KEY\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($supServiceKey)) { $supServiceKey = $matches[1].Trim('"' + "'") }
                    }
                }
                $supUrl = $supUrl.Trim().TrimEnd('/')
                if ($supUrl.EndsWith("/rest/v1")) { $supUrl = $supUrl.Substring(0, $supUrl.Length - 8).TrimEnd('/') }

                # 4. Duplicate Check
                try {
                    $chkUri = "$supUrl/rest/v1/profiles?email=eq.$([System.Uri]::EscapeDataString($email))&select=id,email&limit=1"
                    $chkHeaders = @{ "apikey" = $supKey; "Authorization" = "Bearer $supKey" }
                    $chkRes = Invoke-RestMethod -Uri $chkUri -Method GET -Headers $chkHeaders -TimeoutSec 5 -ErrorAction SilentlyContinue
                    if ($chkRes -and $chkRes.Count -gt 0) {
                        Send-JsonResponse $response 409 @{
                            success = $false
                            error = "USER_ALREADY_EXISTS"
                            message = "An account with this email address is already registered. Please log in."
                        }
                        continue
                    }
                } catch {}

                # 5. Create Supabase Auth User
                $createdUid = $null
                $creationError = $null

                if (-not [string]::IsNullOrWhiteSpace($supServiceKey)) {
                    # Admin creation with email_confirm: true (GoTrue sends 0 emails)
                    try {
                        $adminReqUri = "$supUrl/auth/v1/admin/users"
                        $adminHeaders = @{
                            "apikey" = $supServiceKey
                            "Authorization" = "Bearer $supServiceKey"
                            "Content-Type" = "application/json"
                        }
                        $adminPayload = @{
                            email = $email
                            password = $rawPassword
                            email_confirm = $true
                            user_metadata = @{
                                full_name = $fullName
                                full_name_ta = $fullNameTa
                                phone = $phone
                                district_code = $districtCode
                                district_name = $districtName
                                sangam_id = $sangamId
                                sangam_name = $sangamName
                                sangam_role = $sangamRole
                                occupation = $occupation
                                avatar_url = $avatarUrl
                                role = "user"
                            }
                        } | ConvertTo-Json -Depth 5
                        $adminRes = Invoke-RestMethod -Uri $adminReqUri -Method POST -Headers $adminHeaders -Body $adminPayload -TimeoutSec 10 -ErrorAction Stop
                        $createdUid = if ($adminRes.id) { $adminRes.id } elseif ($adminRes.user) { $adminRes.user.id } else { $null }
                    } catch {
                        $creationError = $_.Exception.Message
                        $statusCode = 400
                        if ($_.Exception.Response) {
                            try {
                                $statusCode = [int]$_.Exception.Response.StatusCode
                                $stream = $_.Exception.Response.GetResponseStream()
                                if ($stream) {
                                    $reader = New-Object System.IO.StreamReader($stream)
                                    $rawErr = $reader.ReadToEnd()
                                    $errObj = $rawErr | ConvertFrom-Json
                                    if ($errObj.msg) { $creationError = $errObj.msg }
                                    elseif ($errObj.message) { $creationError = $errObj.message }
                                    elseif ($errObj.error_description) { $creationError = $errObj.error_description }
                                }
                            } catch {}
                        }
                    }
                } else {
                    # Standard SignUp
                    try {
                        $signupUri = "$supUrl/auth/v1/signup"
                        $signupHeaders = @{
                            "apikey" = $supKey
                            "Content-Type" = "application/json"
                        }
                        $signupPayload = @{
                            email = $email
                            password = $rawPassword
                            data = @{
                                full_name = $fullName
                                full_name_ta = $fullNameTa
                                phone = $phone
                                district_code = $districtCode
                                district_name = $districtName
                                sangam_role = $sangamRole
                                occupation = $occupation
                                avatar_url = $avatarUrl
                                role = "user"
                            }
                        } | ConvertTo-Json -Depth 5
                        $signupRes = Invoke-RestMethod -Uri $signupUri -Method POST -Headers $signupHeaders -Body $signupPayload -TimeoutSec 10 -ErrorAction Stop
                        $createdUid = if ($signupRes.id) { $signupRes.id } elseif ($signupRes.user) { $signupRes.user.id } else { $null }
                    } catch {
                        $creationError = $_.Exception.Message
                        $statusCode = 400
                        if ($_.Exception.Response) {
                            try {
                                $statusCode = [int]$_.Exception.Response.StatusCode
                                $stream = $_.Exception.Response.GetResponseStream()
                                if ($stream) {
                                    $reader = New-Object System.IO.StreamReader($stream)
                                    $rawErr = $reader.ReadToEnd()
                                    $errObj = $rawErr | ConvertFrom-Json
                                    if ($errObj.msg) { $creationError = $errObj.msg }
                                    elseif ($errObj.message) { $creationError = $errObj.message }
                                    elseif ($errObj.error_description) { $creationError = $errObj.error_description }
                                }
                            } catch {}
                        }
                    }
                }

                if ([string]::IsNullOrWhiteSpace($createdUid)) {
                    $isRateLimit = ($statusCode -eq 429) -or ($creationError -match "429") -or ($creationError -match "Too Many Requests") -or ($creationError -match "rate limit") -or ($creationError -match "security purposes")
                    $isAlreadyExists = ($statusCode -eq 422) -or ($creationError -match "already registered") -or ($creationError -match "already exists") -or ($creationError -match "User already registered")

                    if ($isRateLimit) {
                        Write-Host "[AAVIN REGISTRATION] [429 DETECTED] Supabase Auth Rate Limit for: $email" -ForegroundColor Yellow
                        Send-JsonResponse $response 429 @{
                            success = $false
                            error = "RATE_LIMITED"
                            message = "Registration rate limit reached. Please wait a moment before trying again."
                            retryAfter = 60
                        }
                        continue
                    }

                    if ($isAlreadyExists) {
                        Send-JsonResponse $response 409 @{
                            success = $false
                            error = "USER_ALREADY_EXISTS"
                            message = "An account with this email address is already registered. Please log in."
                        }
                        continue
                    }

                    Send-JsonResponse $response 400 @{
                        success = $false
                        error = "AUTH_CREATION_FAILED"
                        message = if ($creationError) { $creationError } else { "Failed to create authentication user in Supabase." }
                    }
                    continue
                }

                $memberId = "TN-$districtCode-2026-$($createdUid.Substring(0, 4))"

                Write-Host "[AAVIN REGISTRATION GATEWAY] Real Member Registered: $email (UID: $createdUid, ID: $memberId)" -ForegroundColor Green

                Send-JsonResponse $response 200 @{
                    success = $true
                    userId = $createdUid
                    email = $email
                    memberId = $memberId
                    message = "Account registered successfully! Proceeding to authenticated login..."
                }
                continue
            }

            # -------------------------------------------------------------
            # REST API: /api/auth/resolve-phone (Resolve Mobile to Email for Member Login)
            # -------------------------------------------------------------
            if ($urlPath -eq "api/auth/resolve-phone" -and $method -eq "POST") {
                $body = Get-RequestBodyJson $request
                $phone = if ($body.phone) { ($body.phone -replace '\D', '').Trim() } else { '' }

                if ([string]::IsNullOrWhiteSpace($phone) -or $phone.Length -ne 10) {
                    Send-JsonResponse $response 400 @{ success = $false; error = "INVALID_PHONE"; message = "Please enter a valid 10-digit mobile number." }
                    continue
                }

                $envFile = Join-Path $path ".env"
                $supUrl = "https://wmspmyhwsdefvvhwigav.supabase.co"
                $supKey = "sb_publishable_IKBhtnA1pyeEKD_sVUQ0ug_0q2Aso5t"
                if (Test-Path $envFile) {
                    Get-Content $envFile | ForEach-Object {
                        $line = $_.Trim()
                        if ($line -match "^VITE_SUPABASE_URL\s*=\s*(.+)$") {
                            $supUrl = $matches[1].Trim('"' + "'")
                        } elseif ($line -match "^SUPABASE_URL\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($supUrl)) {
                            $supUrl = $matches[1].Trim('"' + "'")
                        } elseif ($line -match "^VITE_SUPABASE_ANON_KEY\s*=\s*(.+)$") {
                            $supKey = $matches[1].Trim('"' + "'")
                        } elseif ($line -match "^SUPABASE_ANON_KEY\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($supKey)) {
                            $supKey = $matches[1].Trim('"' + "'")
                        }
                    }
                }
                $supUrl = $supUrl.Trim().TrimEnd('/')
                if ($supUrl.EndsWith("/rest/v1")) {
                    $supUrl = $supUrl.Substring(0, $supUrl.Length - 8).TrimEnd('/')
                }

                $resolvedEmail = $null

                # Strategy 1: Query Supabase Security Definer RPC
                try {
                    $rpcUri = "$supUrl/rest/v1/rpc/get_email_by_phone"
                    $headers = @{
                        "apikey" = $supKey
                        "Authorization" = "Bearer $supKey"
                        "Content-Type" = "application/json"
                    }
                    $rpcBody = @{ lookup_phone = $phone } | ConvertTo-Json
                    $res = Invoke-RestMethod -Uri $rpcUri -Method POST -Headers $headers -Body $rpcBody -TimeoutSec 6 -ErrorAction Stop
                    if ($res -and ($res -is [string]) -and $res -ne "null" -and ($res -match "^[^\s@]+@[^\s@]+\.[^\s@]+$")) {
                        $resolvedEmail = $res.ToString().Trim().ToLower()
                    }
                } catch {}

                # Strategy 2: Direct REST profiles table lookup by phone
                if ([string]::IsNullOrWhiteSpace($resolvedEmail)) {
                    try {
                        $queryHeaders = @{
                            "apikey" = $supKey
                            "Authorization" = "Bearer $supKey"
                        }
                        $phoneFormats = @($phone, "+91$phone", "+91 $phone")
                        foreach ($pf in $phoneFormats) {
                            $encoded = [System.Uri]::EscapeDataString($pf)
                            $pUri = "$supUrl/rest/v1/profiles?phone=eq.$encoded&select=email&limit=1"
                            $pRes = Invoke-RestMethod -Uri $pUri -Method GET -Headers $queryHeaders -TimeoutSec 6 -ErrorAction SilentlyContinue
                            if ($pRes -and $pRes.Count -gt 0 -and $pRes[0].email) {
                                $candidate = $pRes[0].email.ToString().Trim().ToLower()
                                if ($candidate -match "^[^\s@]+@[^\s@]+\.[^\s@]+$") {
                                    $resolvedEmail = $candidate
                                    break
                                }
                            }
                        }
                    } catch {}
                }

                if (-not [string]::IsNullOrWhiteSpace($resolvedEmail) -and $resolvedEmail -ne "null" -and ($resolvedEmail -match "^[^\s@]+@[^\s@]+\.[^\s@]+$")) {
                    Write-Host "[AAVIN PHONE RESOLVER] Resolved Mobile +91 $phone -> $resolvedEmail" -ForegroundColor Cyan
                    Send-JsonResponse $response 200 @{
                        success = $true
                        phone = $phone
                        email = $resolvedEmail
                    }
                } else {
                    Write-Host "[AAVIN PHONE RESOLVER] No account found for mobile: +91 $phone" -ForegroundColor Yellow
                    Send-JsonResponse $response 404 @{
                        success = $false
                        error = "NOT_FOUND"
                        message = "No registered account found for mobile number +91 $phone."
                    }
                }
                continue
            }

            # -------------------------------------------------------------
            # REST API: Public Environment Variables Config (/api/config and /api/config.js)
            # -------------------------------------------------------------
            if (($urlPath -eq "api/config" -or $urlPath -eq "api/config.js") -and $method -eq "GET") {
                $envFile = Join-Path $path ".env"
                $supUrl = "https://wmspmyhwsdefvvhwigav.supabase.co"
                $supKey = "sb_publishable_IKBhtnA1pyeEKD_sVUQ0ug_0q2Aso5t"
                if (Test-Path $envFile) {
                    Get-Content $envFile | ForEach-Object {
                        $line = $_.Trim()
                        if ($line -match "^VITE_SUPABASE_URL\s*=\s*(.+)$") {
                            $supUrl = $matches[1].Trim('"' + "'")
                        } elseif ($line -match "^SUPABASE_URL\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($supUrl)) {
                            $supUrl = $matches[1].Trim('"' + "'")
                        } elseif ($line -match "^VITE_SUPABASE_ANON_KEY\s*=\s*(.+)$") {
                            $supKey = $matches[1].Trim('"' + "'")
                        } elseif ($line -match "^SUPABASE_ANON_KEY\s*=\s*(.+)$" -and [string]::IsNullOrWhiteSpace($supKey)) {
                            $supKey = $matches[1].Trim('"' + "'")
                        }
                    }
                }

                # Strip trailing /rest/v1 if present
                $supUrl = $supUrl.Trim().TrimEnd('/')
                if ($supUrl.EndsWith("/rest/v1")) {
                    $supUrl = $supUrl.Substring(0, $supUrl.Length - 8).TrimEnd('/')
                }

                if ($urlPath -eq "api/config.js") {
                    $jsCode = "window.__ENV__ = Object.assign(window.__ENV__ || {}, { VITE_SUPABASE_URL: '$supUrl', VITE_SUPABASE_ANON_KEY: '$supKey' }); window.VITE_SUPABASE_URL = '$supUrl'; window.VITE_SUPABASE_ANON_KEY = '$supKey';"
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsCode)
                    $response.StatusCode = 200
                    $response.ContentType = "application/javascript; charset=utf-8"
                    $response.AddHeader("Access-Control-Allow-Origin", "*")
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.OutputStream.Flush()
                    $response.Close()
                    continue
                } else {
                    Send-JsonResponse $response 200 @{
                        VITE_SUPABASE_URL = $supUrl
                        VITE_SUPABASE_ANON_KEY = $supKey
                    }
                    continue
                }
            }

            # -------------------------------------------------------------
            # REST API: /api/dairies
            # -------------------------------------------------------------
            if ($urlPath -eq "api/dairies" -or $urlPath.StartsWith("api/dairies/")) {
                $dataPath = Join-Path $path "data\dairies.json"
                $dairies = @()
                if (Test-Path $dataPath) {
                    $raw = Get-Content $dataPath -Raw -Encoding UTF8
                    if (-not [string]::IsNullOrWhiteSpace($raw)) {
                        $dairies = $raw | ConvertFrom-Json
                    }
                }

                # GET /api/dairies/nearest?lat=...&lng=...
                if ($urlPath -eq "api/dairies/nearest" -and $method -eq "GET") {
                    $userLat = $request.QueryString["lat"]
                    $userLng = $request.QueryString["lng"]

                    if ([string]::IsNullOrWhiteSpace($userLat) -or [string]::IsNullOrWhiteSpace($userLng)) {
                        Send-JsonResponse $response 400 @{ error = "MISSING_COORDINATES"; message = "lat and lng query parameters are required" }
                    } else {
                        $uLat = [double]$userLat
                        $uLng = [double]$userLng
                        $list = @()
                        foreach ($d in $dairies) {
                            $dist = Get-HaversineKm $uLat $uLng ([double]$d.latitude) ([double]$d.longitude)
                            $obj = [PSCustomObject]@{
                                id = $d.id
                                name = $d.name
                                official_name = $d.official_name
                                district = $d.district
                                city = $d.city
                                address = $d.address
                                pincode = $d.pincode
                                latitude = $d.latitude
                                longitude = $d.longitude
                                facility_type = $d.facility_type
                                union_name = $d.union_name
                                phone = $d.phone
                                email = $d.email
                                website = $d.website
                                source_name = $d.source_name
                                source_url = $d.source_url
                                verification_status = $d.verification_status
                                distance_km = $dist
                            }
                            $list += $obj
                        }
                        $sorted = $list | Sort-Object distance_km
                        Send-JsonResponse $response 200 $sorted
                    }
                    continue
                }

                # GET /api/dairies/search?q=...&district=...&type=...
                if ($urlPath -eq "api/dairies/search" -and $method -eq "GET") {
                    $q = $request.QueryString["q"]
                    $district = $request.QueryString["district"]
                    $type = $request.QueryString["type"]

                    $filtered = @($dairies)

                    if (-not [string]::IsNullOrWhiteSpace($district) -and $district -ne "ALL") {
                        $filtered = @($filtered | Where-Object { $_.district -eq $district })
                    }

                    if (-not [string]::IsNullOrWhiteSpace($type) -and $type -ne "ALL") {
                        $filtered = @($filtered | Where-Object { $_.facility_type -eq $type })
                    }

                    if (-not [string]::IsNullOrWhiteSpace($q)) {
                        $queryLower = $q.ToLower()
                        $filtered = @($filtered | Where-Object {
                            ($_.name -and $_.name.ToLower().Contains($queryLower)) -or
                            ($_.official_name -and $_.official_name.ToLower().Contains($queryLower)) -or
                            ($_.district -and $_.district.ToLower().Contains($queryLower)) -or
                            ($_.city -and $_.city.ToLower().Contains($queryLower)) -or
                            ($_.union_name -and $_.union_name.ToLower().Contains($queryLower))
                        })
                    }

                    Send-JsonResponse $response 200 $filtered
                    continue
                }

                # GET /api/dairies or GET /api/dairies?district=...
                if ($urlPath -eq "api/dairies" -and $method -eq "GET") {
                    $district = $request.QueryString["district"]
                    $filtered = @($dairies)
                    if (-not [string]::IsNullOrWhiteSpace($district) -and $district -ne "ALL") {
                        $filtered = @($filtered | Where-Object { $_.district -eq $district })
                    }
                    Send-JsonResponse $response 200 $filtered
                    continue
                }

                # GET /api/config or GET /api/config.js
                if ($urlPath -eq "api/config" -or $urlPath -eq "api/config.js") {
                    $supUrl = if ($env:VITE_SUPABASE_URL) { $env:VITE_SUPABASE_URL } else { "https://wmspmyhwsdefvvhwigav.supabase.co" }
                    $supKey = if ($env:VITE_SUPABASE_ANON_KEY) { $env:VITE_SUPABASE_ANON_KEY } else { "sb_publishable_IKBhtnA1pyeEKD_sVUQ0ug_0q2Aso5t" }
                    if ($urlPath -eq "api/config.js") {
                        $js = "window.__ENV__ = Object.assign(window.__ENV__ || {}, { VITE_SUPABASE_URL: '$supUrl', VITE_SUPABASE_ANON_KEY: '$supKey' }); window.VITE_SUPABASE_URL = '$supUrl'; window.VITE_SUPABASE_ANON_KEY = '$supKey';"
                        $response.StatusCode = 200
                        $response.ContentType = "application/javascript; charset=utf-8"
                        $bytes = [System.Text.Encoding]::UTF8.GetBytes($js)
                        $response.ContentLength64 = $bytes.Length
                        $response.OutputStream.Write($bytes, 0, $bytes.Length)
                        $response.OutputStream.Flush()
                        $response.Close()
                        continue
                    } else {
                        Send-JsonResponse $response 200 @{
                            VITE_SUPABASE_URL = $supUrl
                            VITE_SUPABASE_ANON_KEY = $supKey
                        }
                        continue
                    }
                }
            }

            # -------------------------------------------------------------
            # Static File Serving
            # -------------------------------------------------------------
            $filePath = Join-Path $path $urlPath

            if (Test-Path $filePath -PathType Leaf) {
                $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = switch ($extension) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".json" { "application/json; charset=utf-8" }
                    ".png"  { "image/png" }
                    ".jpg"  { "image/jpeg" }
                    ".jpeg" { "image/jpeg" }
                    ".svg"  { "image/svg+xml" }
                    ".mp4"  { "video/mp4" }
                    ".webm" { "video/webm" }
                    ".sql"  { "text/plain; charset=utf-8" }
                    default { "application/octet-stream" }
                }

                $response.ContentType = $contentType
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
                $response.AddHeader("Pragma", "no-cache")
                $response.AddHeader("Expires", "0")
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.OutputStream.Flush()
            } else {
                $response.StatusCode = 404
                $errorBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
            }

            $response.Close()
        } catch {
            Write-Host "Request handler error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "Server stopped or port error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
}

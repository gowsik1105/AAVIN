# Lightweight PowerShell Local HTTP & REST Server for Aavin Sangam
$port = 8080
$path = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

$ALLOWED_FACILITIES = @('MAIN_DAIRY', 'FEEDER_BALANCING_DAIRY', 'DAIRY_PLANT', 'PROCESSING_UNIT', 'SPECIALISED_DAIRY_PLANT')

# In-memory OTP storage for demo/session validation
$Global:OTP_STORE = @{}

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
            # REST API: Authentication (Phone Number + OTP)
            # -------------------------------------------------------------
            if ($urlPath -eq "api/auth/send-otp" -and $method -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
                $reqObj = $body | ConvertFrom-Json
                $phone = "$($reqObj.phone)".Trim()

                if ([string]::IsNullOrWhiteSpace($phone) -or $phone.Length -lt 10) {
                    Send-JsonResponse $response 400 @{ success = $false; error = "INVALID_PHONE"; message = "Please enter a valid 10-digit mobile number." }
                } else {
                    $otp = "123456"
                    $Global:OTP_STORE[$phone] = @{
                        otp = $otp
                        expiresAt = (Get-Date).AddMinutes(5)
                    }
                    Send-JsonResponse $response 200 @{
                        success = $true
                        message = "OTP sent successfully to +91 $phone"
                        debugOtp = "123456"
                        expiresInSeconds = 300
                    }
                }
                continue
            }

            if ($urlPath -eq "api/auth/verify-otp" -and $method -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
                $reqObj = $body | ConvertFrom-Json
                $phone = "$($reqObj.phone)".Trim()
                $otp = "$($reqObj.otp)".Trim()

                if ($otp -eq "123456" -or ($Global:OTP_STORE.ContainsKey($phone) -and $Global:OTP_STORE[$phone].otp -eq $otp)) {
                    $token = "aavin_jwt_" + [System.Guid]::NewGuid().ToString("N")
                    $isNewUser = ($phone -ne "9842176540" -and $phone -ne "98421 76540")
                    Send-JsonResponse $response 200 @{
                        success = $true
                        token = $token
                        phone = $phone
                        isNewUser = $isNewUser
                        message = "Phone number verified successfully"
                    }
                } else {
                    Send-JsonResponse $response 400 @{
                        success = $false
                        error = "INVALID_OTP"
                        message = "The OTP entered is incorrect or expired. Please try again."
                    }
                }
                continue
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

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { scanQrAttendance } from "@/src/app/actions/attendance";
import { formatTime } from "@/src/lib/date";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { toast } from "sonner";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ScanLine,
  UserCheck,
} from "lucide-react";

interface ScanResult {
  success: boolean;
  message: string;
  studentName?: string;
  studentId?: string;
  alreadyPresent?: boolean;
  timestamp: Date;
}

interface Section {
  id: string;
  name: string;
  _count?: { students: number };
}

export default function QrScanner({ sections }: { sections: Section[] }) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    sections.length > 0 ? sections[0].id : ""
  );
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string>("");
  const cooldownRef = useRef<boolean>(false);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    // Prevent duplicate scans within 3 seconds
    if (cooldownRef.current || decodedText === lastScannedRef.current) return;
    if (!selectedSectionId) {
      toast.error("Please select a section first.");
      return;
    }

    cooldownRef.current = true;
    lastScannedRef.current = decodedText;
    setIsProcessing(true);

    try {
      const result = await scanQrAttendance(decodedText, selectedSectionId);

      const scanResult: ScanResult = {
        ...result,
        timestamp: new Date(),
      };
      setScanHistory((prev) => [scanResult, ...prev]);

      if (result.success) {
        toast.success(result.message);
      } else if (result.alreadyPresent) {
        toast.info(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to process scan. Please try again.");
    } finally {
      setIsProcessing(false);
      // Reset cooldown after 3 seconds to allow re-scanning
      setTimeout(() => {
        cooldownRef.current = false;
        lastScannedRef.current = "";
      }, 3000);
    }
  }, [selectedSectionId]);

  const startScanning = useCallback(async () => {
    setCameraError(null);

    // Check for secure context (Camera requires HTTPS or localhost)
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setCameraError(
        "Camera access requires a secure connection (HTTPS or localhost). If you are accessing this via an IP address, please use localhost instead."
      );
      return;
    }

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        handleScanSuccess,
        () => {} // ignore scan failures (no QR in frame)
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      const errorMessage = err?.message || String(err);
      
      if (errorMessage.includes("Permission") || errorMessage.includes("NotAllowedError")) {
        setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (errorMessage.includes("supported") || errorMessage.includes("MediaDevices")) {
        setCameraError("Camera streaming is not supported on this connection. Please use HTTPS or localhost.");
      } else {
        setCameraError("Could not access camera. Make sure no other app is using it or that you are using a secure connection.");
      }
    }
  }, [handleScanSuccess]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Scanner Card */}
      <Card className="border-none shadow-xl shadow-border/5 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-primary" />
                QR Scanner
              </CardTitle>
              <CardDescription>
                Point your camera at a student&apos;s QR code to mark attendance
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {sections.length > 0 && (
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  disabled={isScanning}
                  className="flex h-10 w-full sm:w-[200px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} {sec._count ? `(${sec._count.students})` : ""}
                    </option>
                  ))}
                </select>
              )}
              <Button
                onClick={isScanning ? stopScanning : startScanning}
                variant={isScanning ? "destructive" : "default"}
                className="gap-2"
                disabled={!selectedSectionId}
              >
                {isScanning ? (
                  <>
                    <CameraOff className="w-4 h-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Start Scanner
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Camera viewport */}
          <div className="relative rounded-xl overflow-hidden bg-neutral-900 aspect-square max-w-md mx-auto">
            <div id="qr-reader" className="w-full h-full" />

            {!isScanning && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 gap-3">
                <div className="p-4 rounded-full bg-neutral-800">
                  <Camera className="w-10 h-10" />
                </div>
                <p className="text-sm font-medium">Camera is off</p>
                <p className="text-xs text-muted-foreground">
                  Click &quot;Start Scanner&quot; to begin
                </p>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 gap-3 p-6 text-center">
                <div className="p-4 rounded-full bg-red-900/30">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <p className="text-sm font-medium">{cameraError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-red-700 text-red-400 hover:bg-red-900/30"
                  onClick={startScanning}
                >
                  Try Again
                </Button>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <div className="bg-card rounded-2xl p-6 flex flex-col items-center gap-3 shadow-xl border border-border">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm font-semibold text-foreground">
                    Processing scan...
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scan History */}
      <Card className="border-none shadow-xl shadow-border/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-muted-foreground" />
            Scan History
          </CardTitle>
          <CardDescription>
            Students scanned during this session ({scanHistory.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scanHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic">
              No scans yet. Start the scanner and point at a student&apos;s QR code.
            </div>
          ) : (
            <div className="space-y-3">
              {scanHistory.map((scan, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      scan.success
                        ? "bg-green-500/5 border-green-500/20"
                        : scan.alreadyPresent
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-red-500/5 border-red-500/20"
                    }`}
                  >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        scan.success
                          ? "bg-green-500/10 text-green-500"
                          : scan.alreadyPresent
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {scan.success ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : scan.alreadyPresent ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {scan.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {formatTime(scan.timestamp)}
                      </p>
                    </div>
                  </div>
                  {scan.success && (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      Present
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

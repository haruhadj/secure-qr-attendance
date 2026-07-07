/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  canvasToPngBlob,
  downloadBlob,
  renderCardCanvas,
  sanitizeFilename,
  type QrCardInfo,
} from "@/src/components/qr-card";

interface Props extends QrCardInfo {
  qrToken: string;
  /** "button" = labelled outline button; "icon" = compact ghost icon (in modals). */
  variant?: "button" | "icon";
  className?: string;
}

/**
 * Downloads a single student's QR as a printable ID-card PNG. Renders a hidden
 * QRCodeCanvas so we can composite the real <canvas> onto the card.
 */
export function QrDownloadButton({
  qrToken,
  studentName,
  studentId,
  section,
  yearLevel,
  variant = "button",
  className,
}: Props) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    const qrCanvas = qrRef.current;
    if (!qrCanvas) return;
    setLoading(true);
    try {
      const info: QrCardInfo = { studentName, studentId, section, yearLevel };
      const cardCanvas = renderCardCanvas(qrCanvas, info);
      const blob = await canvasToPngBlob(cardCanvas);
      const name = sanitizeFilename(studentName);
      downloadBlob(blob, `${studentId}_${name}_QR.png`);
      toast.success("QR card downloaded.");
    } catch {
      toast.error("Failed to generate QR image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hidden high-res QR source for compositing */}
      <div className="sr-only" aria-hidden="true">
        <QRCodeCanvas ref={qrRef} value={qrToken} size={512} level="H" marginSize={0} />
      </div>

      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          disabled={loading}
          title="Download QR card"
          className={className ?? "h-8 w-8 text-muted-foreground hover:text-primary"}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={handleDownload}
          disabled={loading}
          className={className ?? "h-9 gap-2"}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {loading ? "Generating..." : "Download QR"}
        </Button>
      )}
    </>
  );
}

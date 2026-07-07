/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import {
  CARD_H,
  CARD_W,
  canvasToPngBlob,
  downloadBlob,
  drawQrCard,
  renderCardCanvas,
  sanitizeFilename,
  type QrCardInfo,
} from "@/src/components/qr-card";

export interface BulkQrStudent extends QrCardInfo {
  id: string;
  qrToken: string;
}

interface Props {
  students: BulkQrStudent[];
  format: "sheet" | "zip";
  /** Called once generation finishes (success or failure) so the parent can close/clear. */
  onDone: () => void;
}

const SHEET_COLS = 3;
const SHEET_GAP = 24;
const SHEET_MARGIN = 32;
const SHEET_SCALE = 2;

/**
 * Renders a hidden QRCodeCanvas per selected student, waits for them to paint,
 * then composites either one printable sheet PNG or a ZIP of per-student PNGs.
 * Mount this only while a bulk download is in flight.
 */
export function BulkQrDownload({ students, format, onDone }: Props) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Wait two frames so every hidden QRCodeCanvas has painted.
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        void generate();
      });
    });

    async function generate() {
      try {
        const canvases = canvasRefs.current;
        const ready = students
          .map((s, i) => ({ s, canvas: canvases[i] }))
          .filter((x): x is { s: BulkQrStudent; canvas: HTMLCanvasElement } => !!x.canvas);

        if (ready.length === 0) throw new Error("No QR codes rendered");

        if (format === "sheet") {
          await generateSheet(ready);
          toast.success(`Downloaded a printable sheet of ${ready.length} QR card(s).`);
        } else {
          await generateZip(ready);
          toast.success(`Downloaded a ZIP of ${ready.length} QR card(s).`);
        }
      } catch {
        toast.error("Failed to generate QR download. Please try again.");
      } finally {
        onDone();
      }
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="sr-only" aria-hidden="true">
      {students.map((s, i) => (
        <QRCodeCanvas
          key={s.id}
          ref={(el) => {
            canvasRefs.current[i] = el;
          }}
          value={s.qrToken}
          size={512}
          level="H"
          marginSize={0}
        />
      ))}
    </div>
  );
}

async function generateSheet(
  items: { s: BulkQrStudent; canvas: HTMLCanvasElement }[],
) {
  const cols = Math.min(SHEET_COLS, items.length);
  const rows = Math.ceil(items.length / cols);

  const widthLogical = SHEET_MARGIN * 2 + cols * CARD_W + (cols - 1) * SHEET_GAP;
  const heightLogical = SHEET_MARGIN * 2 + rows * CARD_H + (rows - 1) * SHEET_GAP;

  const canvas = document.createElement("canvas");
  canvas.width = widthLogical * SHEET_SCALE;
  canvas.height = heightLogical * SHEET_SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SHEET_SCALE, SHEET_SCALE);

  // Page background
  ctx.fillStyle = "#f1f5f9"; // slate-100
  ctx.fillRect(0, 0, widthLogical, heightLogical);

  items.forEach(({ s, canvas: qr }, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = SHEET_MARGIN + col * (CARD_W + SHEET_GAP);
    const y = SHEET_MARGIN + row * (CARD_H + SHEET_GAP);
    drawQrCard(ctx, x, y, qr, s);
  });

  const blob = await canvasToPngBlob(canvas);
  downloadBlob(blob, "student_qr_cards.png");
}

async function generateZip(
  items: { s: BulkQrStudent; canvas: HTMLCanvasElement }[],
) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const { s, canvas: qr } of items) {
    const cardCanvas = renderCardCanvas(qr, s);
    const blob = await canvasToPngBlob(cardCanvas);
    let base = `${s.studentId}_${sanitizeFilename(s.studentName)}`;
    let name = `${base}.png`;
    let n = 2;
    while (usedNames.has(name)) name = `${base}_${n++}.png`;
    usedNames.add(name);
    zip.file(name, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, "student_qr_cards.zip");
}

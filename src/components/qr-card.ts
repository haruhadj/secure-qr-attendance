/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared canvas drawing for printable student QR "ID cards".
 *
 * Kept framework-agnostic (plain canvas 2D, no React) so the single-download
 * button, the bulk printable sheet, and the bulk ZIP can all composite the same
 * card from a QR <canvas> rendered by `qrcode.react`'s QRCodeCanvas.
 */

export const HEADER_TITLE = "Our Lady of Assumption College Inc.";
const SUBTITLE = "STUDENT ATTENDANCE QR";

// Logical card dimensions (drawn at DPR scale by the caller for print quality).
export const CARD_W = 340;
export const CARD_H = 440;

const HEADER_H = 74;
const QR_SIZE = 208;
const PAD = 16;

const COLOR_PRIMARY = "#4f46e5"; // indigo-600
const COLOR_CARD = "#ffffff";
const COLOR_BORDER = "#e2e8f0"; // slate-200
const COLOR_TEXT = "#0f172a"; // slate-900
const COLOR_MUTED = "#64748b"; // slate-500

export interface QrCardInfo {
  studentName: string;
  studentId: string;
  section?: string | null;
  yearLevel?: string | null;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Shrink the font size until `text` fits within `maxWidth`, then draw it
 * centered at (cx, y). Returns nothing; used for the (potentially long) header
 * title and the student name.
 */
function fillCenteredFit(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  startPx: number,
  weight: string,
  color: string,
) {
  let px = startPx;
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  do {
    ctx.font = `${weight} ${px}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth || px <= 9) break;
    px -= 1;
  } while (px > 9);
  ctx.fillText(text, cx, y);
}

/**
 * Draw one QR ID card with its top-left corner at (x, y), using the fixed
 * CARD_W x CARD_H logical footprint. `qrCanvas` is a rendered QR <canvas>.
 */
export function drawQrCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  qrCanvas: HTMLCanvasElement,
  info: QrCardInfo,
) {
  const cx = x + CARD_W / 2;

  // Card background + border
  ctx.save();
  roundRect(ctx, x, y, CARD_W, CARD_H, 18);
  ctx.fillStyle = COLOR_CARD;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = COLOR_BORDER;
  ctx.stroke();

  // Header band (clip to keep rounded top corners)
  ctx.save();
  roundRect(ctx, x, y, CARD_W, CARD_H, 18);
  ctx.clip();
  ctx.fillStyle = COLOR_PRIMARY;
  ctx.fillRect(x, y, CARD_W, HEADER_H);
  ctx.restore();

  fillCenteredFit(
    ctx,
    HEADER_TITLE,
    cx,
    y + 30,
    CARD_W - PAD * 2,
    15,
    "600",
    "#ffffff",
  );
  ctx.font = "700 10px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.textAlign = "center";
  // letter-spaced subtitle
  const spaced = SUBTITLE.split("").join(" ");
  ctx.fillText(spaced, cx, y + 52);

  // QR code with a white quiet-zone frame
  const qrX = cx - QR_SIZE / 2;
  const qrY = y + HEADER_H + 20;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, qrX - 10, qrY - 10, QR_SIZE + 20, QR_SIZE + 20, 12);
  ctx.fill();
  ctx.strokeStyle = COLOR_BORDER;
  ctx.stroke();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrCanvas, qrX, qrY, QR_SIZE, QR_SIZE);
  ctx.imageSmoothingEnabled = true;

  // Student details
  const textTop = qrY + QR_SIZE + 34;
  fillCenteredFit(
    ctx,
    info.studentName || "—",
    cx,
    textTop,
    CARD_W - PAD * 2,
    19,
    "700",
    COLOR_TEXT,
  );

  ctx.textAlign = "center";
  ctx.font = "500 13px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = COLOR_MUTED;
  ctx.fillText(`ID: ${info.studentId}`, cx, textTop + 24);

  const meta = [info.section, info.yearLevel]
    .map((v) => (v ?? "").trim())
    .filter(Boolean)
    .join("  ·  ");
  if (meta) {
    ctx.font = "600 13px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = COLOR_TEXT;
    ctx.fillText(meta, cx, textTop + 46);
  }

  ctx.restore();
}

/** Trigger a client-side download of a Blob (mirrors ExportCsvButton pattern). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Filesystem-safe token from a display string. */
export function sanitizeFilename(s: string): string {
  return (s || "student").replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "");
}

/**
 * Render a single card onto a fresh canvas at the given device-pixel `scale`
 * and return it. Shared by the single-download button and the ZIP path.
 */
export function renderCardCanvas(
  qrCanvas: HTMLCanvasElement,
  info: QrCardInfo,
  scale = 3,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W * scale;
  canvas.height = CARD_H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  drawQrCard(ctx, 0, 0, qrCanvas, info);
  return canvas;
}

/** Promisified canvas.toBlob (PNG). */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create image"));
    }, "image/png");
  });
}

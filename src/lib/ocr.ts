// On-device OCR for Korean medicine packages. The photo never leaves the browser;
// tesseract.js downloads its engine and Korean/English models once on first use.
import type { Worker } from "tesseract.js";

let worker: Promise<Worker> | null = null;
let report: (progress: number) => void = () => {};

function getWorker() {
  worker ??= import("tesseract.js").then(({ createWorker }) =>
    createWorker(["kor", "eng"], 1, {
      logger: (m) => {
        if (m.status === "recognizing text") report(Math.round(m.progress * 100));
      },
    }),
  );
  worker.catch(() => (worker = null));
  return worker;
}

/** Downscale and convert to high-contrast grayscale; phone photos are large and colourful. */
async function prepare(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.filter = "grayscale(1) contrast(1.35)";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("canvas"))), "image/png"),
  );
}

export async function readText(file: Blob, onProgress: (p: number) => void): Promise<string> {
  report = onProgress;
  onProgress(0);
  const [w, image] = await Promise.all([getWorker(), prepare(file).catch(() => file)]);
  const result = await w.recognize(image);
  return result.data.text.trim();
}

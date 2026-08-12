"use client";

export type SmartCropResult = {
  file: File;
  detected: boolean;
  label: string | null;
};

type BBox = { x: number; y: number; width: number; height: number };

const PET_CLASSES = new Set(["dog", "cat"]);
const TARGET_RATIO = 4 / 3; // ancho / alto — igual que la card del feed
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.86;

let modelPromise: Promise<import("@tensorflow-models/coco-ssd").ObjectDetection> | null =
  null;

async function getModel() {
  if (!modelPromise) {
    modelPromise = (async () => {
      await import("@tensorflow/tfjs");
      const cocoSsd = await import("@tensorflow-models/coco-ssd");
      return cocoSsd.load({ base: "lite_mobilenet_v2" });
    })();
  }
  return modelPromise;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Expande el bbox del animal y lo ajusta a 4:3 sin salirse de la imagen. */
function cropRectForPet(
  box: BBox,
  imgW: number,
  imgH: number,
): BBox {
  const padX = box.width * 0.35;
  const padY = box.height * 0.45; // un poco más arriba/abajo por hocico y orejas
  let x = box.x - padX;
  let y = box.y - padY * 1.1; // prioriza un poco más arriba (orejas)
  let w = box.width + padX * 2;
  let h = box.height + padY * 2.1;

  const cx = x + w / 2;
  const cy = y + h / 2;
  const currentRatio = w / h;

  if (currentRatio > TARGET_RATIO) {
    // demasiado ancho → subir altura
    h = w / TARGET_RATIO;
  } else {
    // demasiado alto → subir ancho
    w = h * TARGET_RATIO;
  }

  // Si el crop es más grande que la imagen, reducir al máximo posible en 4:3
  if (w > imgW) {
    w = imgW;
    h = w / TARGET_RATIO;
  }
  if (h > imgH) {
    h = imgH;
    w = h * TARGET_RATIO;
  }

  x = cx - w / 2;
  y = cy - h / 2;
  x = clamp(x, 0, imgW - w);
  y = clamp(y, 0, imgH - h);

  return { x, y, width: w, height: h };
}

/** Recorte centrado 4:3 si no hay detección. */
function centerCropRect(imgW: number, imgH: number): BBox {
  const imgRatio = imgW / imgH;
  if (Math.abs(imgRatio - TARGET_RATIO) < 0.05) {
    return { x: 0, y: 0, width: imgW, height: imgH };
  }
  if (imgRatio > TARGET_RATIO) {
    const h = imgH;
    const w = h * TARGET_RATIO;
    return { x: (imgW - w) / 2, y: 0, width: w, height: h };
  }
  const w = imgW;
  const h = w / TARGET_RATIO;
  return { x: 0, y: (imgH - h) / 2, width: w, height: h };
}

function drawCrop(img: HTMLImageElement, rect: BBox): HTMLCanvasElement {
  let outW = Math.round(rect.width);
  let outH = Math.round(rect.height);
  const maxSide = Math.max(outW, outH);
  if (maxSide > MAX_EDGE) {
    const scale = MAX_EDGE / maxSide;
    outW = Math.round(outW * scale);
    outH = Math.round(outH * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, outW);
  canvas.height = Math.max(1, outH);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  ctx.drawImage(
    img,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}

function canvasToFile(canvas: HTMLCanvasElement, baseName: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo generar la foto"));
          return;
        }
        const name = baseName.replace(/\.[^.]+$/, "") || "peludo";
        resolve(new File([blob], `${name}-encuadre.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/**
 * Detecta perro/gato y recorta a 4:3 centrado en el animal.
 * Si no detecta, hace un recorte centrado suave. Si falla del todo, devuelve el original.
 */
export async function smartCropPetPhoto(file: File): Promise<SmartCropResult> {
  try {
    const img = await loadImage(file);
    if (!img.naturalWidth || !img.naturalHeight) {
      return { file, detected: false, label: null };
    }

    let detected = false;
    let label: string | null = null;
    let rect = centerCropRect(img.naturalWidth, img.naturalHeight);

    try {
      const model = await getModel();
      const predictions = await model.detect(img, 12, 0.35);
      const pets = predictions
        .filter((p) => PET_CLASSES.has(p.class))
        .sort((a, b) => b.score - a.score);

      if (pets[0]) {
        const [x, y, width, height] = pets[0].bbox;
        rect = cropRectForPet(
          { x, y, width, height },
          img.naturalWidth,
          img.naturalHeight,
        );
        detected = true;
        label = pets[0].class === "dog" ? "perro" : "gato";
      }
    } catch (err) {
      console.warn("Detección de mascota no disponible:", err);
    }

    const canvas = drawCrop(img, rect);
    const cropped = await canvasToFile(canvas, file.name);
    return { file: cropped, detected, label };
  } catch (err) {
    console.warn("smartCrop fallback:", err);
    return { file, detected: false, label: null };
  }
}

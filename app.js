"use strict";

const W = 600;
const H = 200;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", {
  alpha: false
});

const imageInput = document.getElementById("imageInput");
const titleInput = document.getElementById("titleInput");
const subInput = document.getElementById("subInput");
const ctaInput = document.getElementById("ctaInput");
const urlInput = document.getElementById("urlInput");

const openingColorInput = document.getElementById("openingColorInput");
const revealColorInput = document.getElementById("revealColorInput");
const gradientStartInput = document.getElementById("gradientStartInput");
const gradientEndInput = document.getElementById("gradientEndInput");
const gradientAngleInput = document.getElementById("gradientAngleInput");

const photoInput = document.getElementById("photoInput");
const revealOpacityInput = document.getElementById("revealOpacityInput");
const transparentInput = document.getElementById("transparentInput");
const speedInput = document.getElementById("speedInput");

const photoValue = document.getElementById("photoValue");
const revealOpacityValue = document.getElementById("revealOpacityValue");
const speedValue = document.getElementById("speedValue");
const gradientAngleValue = document.getElementById("gradientAngleValue");

const pngBtn = document.getElementById("pngBtn");
const gifBtn = document.getElementById("gifBtn");
const status = document.getElementById("status");

let backgroundImage = null;
let previewStart = performance.now();
let objectUrl = null;
let workerLoaderUrl = null;

const GIF_LIBRARY_URL =
  "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js";

const GIF_WORKER_URL =
  "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js";


function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function hexToRgb(hex) {
  const clean = String(hex || "#000000").replace("#", "");
  const value = parseInt(clean, 16);

  if (!Number.isFinite(value)) {
    return {
      r: 0,
      g: 0,
      b: 0
    };
  }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}


function rgba(hex, alpha) {
  const color = hexToRgb(hex);
  const a = clamp(Number(alpha) || 0, 0, 1);

  return `rgba(${color.r}, ${color.g}, ${color.b}, ${a})`;
}


function getSettings() {
  return {
    title:
      titleInput.value.trim() ||
      "OF AMBITION AND GRIND",

    sub:
      subInput.value.trim(),

    cta:
      ctaInput.value.trim(),

    openingColor:
      openingColorInput.value,

    revealColor:
      revealColorInput.value,

    gradientStart:
      gradientStartInput
        ? gradientStartInput.value
        : "#ffffff",

    gradientEnd:
      gradientEndInput
        ? gradientEndInput.value
        : "#777777",

    gradientAngle:
      gradientAngleInput
        ? Number(gradientAngleInput.value)
        : 90,

    photoVisibility:
      Number(photoInput.value) / 100,

    revealOpacity:
      Number(revealOpacityInput.value) / 100,

    transparent:
      transparentInput.checked,

    speed:
      Number(speedInput.value) / 100
  };
}


function updateOutputs() {
  photoValue.textContent =
    `${photoInput.value}%`;

  revealOpacityValue.textContent =
    `${revealOpacityInput.value}%`;

  speedValue.textContent =
    `${speedInput.value}%`;

  if (gradientAngleValue && gradientAngleInput) {
    gradientAngleValue.textContent =
      `${gradientAngleInput.value}°`;
  }
}


function drawCoverImage(image) {
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, W, H);

  if (
    !image ||
    !image.complete ||
    !image.naturalWidth
  ) {
    return false;
  }

  const scale = Math.max(
    W / image.naturalWidth,
    H / image.naturalHeight
  );

  const drawWidth =
    image.naturalWidth * scale;

  const drawHeight =
    image.naturalHeight * scale;

  const x =
    (W - drawWidth) / 2;

  const y =
    (H - drawHeight) / 2;

  ctx.drawImage(
    image,
    x,
    y,
    drawWidth,
    drawHeight
  );

  return true;
}


function createRevealGradient(settings) {
  const angle =
    (settings.gradientAngle * Math.PI) / 180;

  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  const length =
    Math.abs(W * dx) +
    Math.abs(H * dy);

  const startX =
    W / 2 - (dx * length) / 2;

  const startY =
    H / 2 - (dy * length) / 2;

  const endX =
    W / 2 + (dx * length) / 2;

  const endY =
    H / 2 + (dy * length) / 2;

  const gradient =
    ctx.createLinearGradient(
      startX,
      startY,
      endX,
      endY
    );

  gradient.addColorStop(
    0,
    rgba(
      settings.gradientStart,
      settings.revealOpacity
    )
  );

  gradient.addColorStop(
    1,
    rgba(
      settings.gradientEnd,
      settings.revealOpacity
    )
  );

  return gradient;
}


/*
 * Downward-pointing semicircle.
 *
 * The flat diameter is at the top.
 * The curved edge points downward.
 *
 * There are NO rays.
 */
function drawDownwardSemicircle(
  progress,
  settings
) {
  if (settings.transparent) {
    return;
  }

  const p =
    clamp(progress, 0, 1);

  if (p <= 0) {
    return;
  }

  const radius = 390;
  const centerX = W / 2;

  const startY =
    -radius - 35;

  const endY =
    H + radius * 0.65;

  const centerY =
    startY +
    (endY - startY) * p;

  ctx.save();

  /*
   * Use the gradient if available.
   * Otherwise use the normal reveal colour.
   */
  if (
    gradientStartInput &&
    gradientEndInput
  ) {
    ctx.fillStyle =
      createRevealGradient(settings);
  } else {
    ctx.fillStyle =
      rgba(
        settings.revealColor,
        settings.revealOpacity
      );
  }

  ctx.beginPath();

  /*
   * Right end of the flat top.
   */
  ctx.moveTo(
    centerX + radius,
    centerY
  );

  /*
   * Lower half of the circle.
   */
  ctx.arc(
    centerX,
    centerY,
    radius,
    0,
    Math.PI,
    false
  );

  /*
   * Close the flat diameter.
   */
  ctx.lineTo(
    centerX + radius,
    centerY
  );

  ctx.closePath();
  ctx.fill();

  ctx.restore();
}


function drawOpeningOverlay(settings) {
  const opacity =
    1 - settings.photoVisibility;

  if (opacity <= 0) {
    return;
  }

  ctx.save();

  ctx.fillStyle =
    rgba(
      settings.openingColor,
      opacity
    );

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.restore();
}


function drawText(progress, settings) {
  const p =
    clamp(progress, 0, 1);

  const whiteAlpha =
    1 - p;

  const darkAlpha =
    p;

  ctx.save();

  ctx.textBaseline =
    "middle";

  if (settings.title) {
    ctx.font =
      'bold 27px Georgia, "Times New Roman", serif';

    ctx.fillStyle =
      rgba("#ffffff", whiteAlpha);

    ctx.fillText(
      settings.title,
      30,
      65
    );

    ctx.fillStyle =
      rgba("#111111", darkAlpha);

    ctx.fillText(
      settings.title,
      30,
      65
    );
  }

  if (settings.sub) {
    ctx.font =
      "15px Arial, Helvetica, sans-serif";

    ctx.fillStyle =
      rgba("#ffffff", whiteAlpha);

    ctx.fillText(
      settings.sub,
      31,
      94
    );

    ctx.fillStyle =
      rgba("#111111", darkAlpha);

    ctx.fillText(
      settings.sub,
      31,
      94
    );
  }

  if (settings.cta) {
    ctx.font =
      "bold 11px Arial, Helvetica, sans-serif";

    ctx.fillStyle =
      rgba("#ffffff", whiteAlpha);

    ctx.fillText(
      settings.cta,
      31,
      127
    );

    ctx.fillStyle =
      rgba("#111111", darkAlpha);

    ctx.fillText(
      settings.cta,
      31,
      127
    );
  }

  ctx.restore();
}


function renderFrame(progress) {
  const settings =
    getSettings();

  ctx.clearRect(
    0,
    0,
    W,
    H
  );

  drawCoverImage(
    backgroundImage
  );

  drawOpeningOverlay(
    settings
  );

  drawDownwardSemicircle(
    progress,
    settings
  );

  drawText(
    progress,
    settings
  );
}


function animationProgress(
  elapsedMs,
  speed
) {
  const safeSpeed =
    clamp(
      speed,
      0.4,
      1.4
    );

  const cycleMs =
    3600 / safeSpeed;

  const t =
    (elapsedMs % cycleMs) /
    cycleMs;

  if (t < 0.30) {
    return 0;
  }

  if (t < 0.70) {
    const q =
      (t - 0.30) / 0.40;

    return (
      q * q * (3 - 2 * q)
    );
  }

  return 1;
}


function animatePreview(now) {
  const settings =
    getSettings();

  const progress =
    animationProgress(
      now - previewStart,
      settings.speed
    );

  renderFrame(progress);

  requestAnimationFrame(
    animatePreview
  );
}


function restartPreview() {
  previewStart =
    performance.now();
}


function setStatus(message) {
  status.textContent =
    message;
}


function loadImageFromSource(
  src,
  onSuccess,
  onFailure
) {
  const image =
    new Image();

  image.onload = () => {
    backgroundImage =
      image;

    onSuccess(image);
  };

  image.onerror = () => {
    backgroundImage =
      null;

    onFailure();
  };

  image.src =
    src;
}


/*
 * Load the user's background image.
 */
imageInput.addEventListener(
  "change",
  () => {
    const file =
      imageInput.files &&
      imageInput.files[0];

    if (!file) {
      return;
    }

    if (objectUrl) {
      URL.revokeObjectURL(
        objectUrl
      );

      objectUrl =
        null;
    }

    objectUrl =
      URL.createObjectURL(
        file
      );

    loadImageFromSource(
      objectUrl,

      () => {
        setStatus(
          "Background image loaded."
        );

        restartPreview();
      },

      () => {
        setStatus(
          "Could not load that image."
        );
      }
    );
  }
);


/*
 * Control listeners.
 */
[
  titleInput,
  subInput,
  ctaInput,
  urlInput,
  openingColorInput,
  revealColorInput,
  gradientStartInput,
  gradientEndInput,
  gradientAngleInput,
  photoInput,
  revealOpacityInput,
  transparentInput,
  speedInput
]
  .filter(Boolean)
  .forEach((element) => {
    element.addEventListener(
      "input",
      () => {
        updateOutputs();
        restartPreview();
      }
    );

    element.addEventListener(
      "change",
      () => {
        updateOutputs();
        restartPreview();
      }
    );
  });


/*
 * PNG download.
 */
pngBtn.addEventListener(
  "click",
  () => {
    if (!backgroundImage) {
      setStatus(
        "No background image is loaded."
      );

      return;
    }

    renderFrame(1);

    const link =
      document.createElement("a");

    link.download =
      "of-ambition-and-grind-banner.png";

    link.href =
      canvas.toDataURL(
        "image/png"
      );

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    setStatus(
      "PNG saved."
    );

    restartPreview();
  }
);


/*
 * Create a SAME-ORIGIN blob worker.
 *
 * This is the important fix.
 *
 * gif.js normally tries to create a Worker from
 * gif.worker.js. Browsers can reject a direct
 * cross-origin Worker URL.
 *
 * Instead, we create a tiny local blob worker
 * which imports the official gif.worker.js from
 * jsDelivr.
 *
 * No local gif.worker.js file is required.
 */
function createWorkerLoader() {
  if (workerLoaderUrl) {
    return workerLoaderUrl;
  }

  const workerCode =
    `
      importScripts(
        "${GIF_WORKER_URL}"
      );
    `;

  const workerBlob =
    new Blob(
      [workerCode],
      {
        type:
          "application/javascript"
      }
    );

  workerLoaderUrl =
    URL.createObjectURL(
      workerBlob
    );

  return workerLoaderUrl;
}


/*
 * Load gif.js if it isn't already loaded.
 */
function loadGifLibrary() {
  return new Promise(
    (resolve, reject) => {
      if (
        typeof window.GIF ===
        "function"
      ) {
        resolve();
        return;
      }

      const existing =
        document.querySelector(
          'script[data-gif-js="true"]'
        );

      if (existing) {
        existing.addEventListener(
          "load",
          () => {
            if (
              typeof window.GIF ===
              "function"
            ) {
              resolve();
            } else {
              reject(
                new Error(
                  "gif.js did not initialise."
                )
              );
            }
          },
          {
            once: true
          }
        );

        existing.addEventListener(
          "error",
          () => {
            reject(
              new Error(
                "gif.js failed to load."
              )
            );
          },
          {
            once: true
          }
        );

        return;
      }

      const script =
        document.createElement(
          "script"
        );

      script.src =
        GIF_LIBRARY_URL;

      script.async =
        true;

      script.dataset.gifJs =
        "true";

      script.onload = () => {
        if (
          typeof window.GIF ===
          "function"
        ) {
          resolve();
        } else {
          reject(
            new Error(
              "gif.js did not initialise."
            )
          );
        }
      };

      script.onerror = () => {
        reject(
          new Error(
            "Could not load gif.js."
          )
        );
      };

      document.head.appendChild(
        script
      );
    }
  );
}


/*
 * Generate GIF.
 */
gifBtn.addEventListener(
  "click",
  async () => {
    if (!backgroundImage) {
      setStatus(
        "No background image is loaded."
      );

      return;
    }

    gifBtn.disabled =
      true;

    pngBtn.disabled =
      true;

    setStatus(
      "Loading GIF engine…"
    );

    try {
      await loadGifLibrary();

      const workerScript =
        createWorkerLoader();

      const gif =
        new window.GIF({
          workers: 2,
          quality: 8,
          width: W,
          height: H,
          workerScript
        });

      const frameCount =
        60;

      const delay =
        60;

      setStatus(
        "Preparing GIF…"
      );

      /*
       * Build every frame.
       */
      for (
        let i = 0;
        i < frameCount;
        i += 1
      ) {
        const t =
          i /
          (frameCount - 1);

        let progress;

        if (t < 0.30) {
          progress = 0;
        } else if (t < 0.70) {
          const q =
            (t - 0.30) /
            0.40;

          progress =
            q *
            q *
            (3 - 2 * q);
        } else {
          progress = 1;
        }

        renderFrame(
          progress
        );

        gif.addFrame(
          canvas,
          {
            copy: true,
            delay
          }
        );
      }

      gif.on(
        "progress",
        (progress) => {
          setStatus(
            `Generating GIF… ${Math.round(
              progress * 100
            )}%`
          );
        }
      );

      gif.on(
        "finished",
        (blob) => {
          const downloadUrl =
            URL.createObjectURL(
              blob
            );

          const link =
            document.createElement(
              "a"
            );

          link.download =
            "of-ambition-and-grind-banner.gif";

          link.href =
            downloadUrl;

          document.body.appendChild(
            link
          );

          link.click();
          link.remove();

          window.setTimeout(
            () => {
              URL.revokeObjectURL(
                downloadUrl
              );
            },
            10000
          );

          setStatus(
            "GIF saved."
          );

          gifBtn.disabled =
            false;

          pngBtn.disabled =
            false;

          restartPreview();
        }
      );

      gif.on(
        "abort",
        () => {
          setStatus(
            "GIF generation cancelled."
          );

          gifBtn.disabled =
            false;

          pngBtn.disabled =
            false;

          restartPreview();
        }
      );

      gif.render();

    } catch (error) {
      console.error(
        "GIF ERROR:",
        error
      );

      setStatus(
        "GIF generation failed. Check the browser console."
      );

      gifBtn.disabled =
        false;

      pngBtn.disabled =
        false;

      restartPreview();
    }
  }
);


/*
 * Initial state.
 */
updateOutputs();


/*
 * Load the repository background image.
 */
loadImageFromSource(
  "./assets/book-background.png",

  () => {
    setStatus(
      "Ready — original book image loaded."
    );

    restartPreview();
  },

  () => {
    setStatus(
      "Background image not found. Check assets/book-background.png."
    );

    restartPreview();
  }
);


restartPreview();

requestAnimationFrame(
  animatePreview
);

"use strict";

const W = 600;
const H = 200;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const imageInput = document.getElementById("imageInput");
const titleInput = document.getElementById("titleInput");
const subInput = document.getElementById("subInput");
const ctaInput = document.getElementById("ctaInput");
const urlInput = document.getElementById("urlInput");

const openingColorInput = document.getElementById("openingColorInput");
const revealColorInput = document.getElementById("revealColorInput");

const photoInput = document.getElementById("photoInput");
const sharpnessInput = document.getElementById("sharpnessInput");
const spreadInput = document.getElementById("spreadInput");
const speedInput = document.getElementById("speedInput");

const photoValue = document.getElementById("photoValue");
const sharpnessValue = document.getElementById("sharpnessValue");
const spreadValue = document.getElementById("spreadValue");
const speedValue = document.getElementById("speedValue");

const pngBtn = document.getElementById("pngBtn");
const gifBtn = document.getElementById("gifBtn");
const status = document.getElementById("status");

let backgroundImage = null;
let previewStart = performance.now();
let previewRAF = null;
let objectUrl = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex) {
  const clean = String(hex || "#000000").replace("#", "");

  const value = parseInt(clean, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function rgba(hex, alpha) {
  const rgb = hexToRgb(hex);

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getSettings() {
  return {
    title: titleInput.value.trim() || "OF AMBITION AND GRIND",
    sub: subInput.value.trim(),
    cta: ctaInput.value.trim(),
    purchaseUrl: urlInput.value.trim(),

    openingColor: openingColorInput.value,
    revealColor: revealColorInput.value,

    photoVisibility: Number(photoInput.value) / 100,
    sharpness: Number(sharpnessInput.value) / 100,
    spread: Number(spreadInput.value) / 100,
    speed: Number(speedInput.value) / 100
  };
}

function updateOutputs() {
  photoValue.textContent = `${photoInput.value}%`;
  sharpnessValue.textContent = `${sharpnessInput.value}%`;
  spreadValue.textContent = `${spreadInput.value}%`;
  speedValue.textContent = `${speedInput.value}%`;
}

function restartPreview() {
  previewStart = performance.now();
}

function drawCoverImage(image, alpha = 1) {
  if (!image || !image.complete || !image.naturalWidth) {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, W, H);
    return;
  }

  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;

  const scale = Math.max(
    W / imageWidth,
    H / imageHeight
  );

  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;

  const drawX = (W - drawWidth) / 2;
  const drawY = (H - drawHeight) / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(
    image,
    drawX,
    drawY,
    drawWidth,
    drawHeight
  );
  ctx.restore();
}

/*
  Reveal shape.

  The animation remains a bottom-centre reveal.
  The geometry is kept inside the canvas so it cannot disappear
  because of a canvas-wide transform.
*/
function drawReveal(progress, settings) {
  const p = clamp(progress, 0, 1);

  if (p <= 0) {
    return;
  }

  const originX = W * 0.50;
  const originY = H + 12;

  const spread = settings.spread;

  const maximumWidth =
    W * (0.70 + spread * 0.95);

  const maximumHeight = H * 1.18;

  const width =
    maximumWidth * Math.pow(p, 0.72);

  const height =
    maximumHeight * Math.pow(p, 0.70);

  /*
    This is the asymmetric contour.

    The upper edge deliberately has different left and right
    curves so that a vertical flip is visually distinguishable.
  */

  const left = originX - width / 2;
  const right = originX + width / 2;
  const top = originY - height;

  ctx.save();

  ctx.fillStyle = rgba(
    settings.revealColor,
    0.94
  );

  ctx.beginPath();

  ctx.moveTo(originX, originY);

  ctx.bezierCurveTo(
    originX - width * 0.08,
    originY - height * 0.30,
    left + width * 0.08,
    top + height * 0.17,
    left,
    top + height * 0.04
  );

  ctx.bezierCurveTo(
    left + width * 0.15,
    top - height * 0.015,
    left + width * 0.35,
    top + height * 0.04,
    left + width * 0.48,
    top
  );

  ctx.bezierCurveTo(
    left + width * 0.64,
    top + height * 0.055,
    right - width * 0.16,
    top + height * 0.14,
    right,
    top + height * 0.10
  );

  ctx.bezierCurveTo(
    right - width * 0.04,
    originY - height * 0.34,
    originX + width * 0.08,
    originY - height * 0.18,
    originX,
    originY
  );

  ctx.closePath();
  ctx.fill();

  /*
    Soft edge.
  */
  if (settings.sharpness < 0.95) {
    const softAlpha =
      (1 - settings.sharpness) * 0.22;

    ctx.fillStyle = rgba(
      settings.revealColor,
      softAlpha
    );

    ctx.beginPath();

    ctx.moveTo(originX, originY);

    ctx.bezierCurveTo(
      originX - width * 0.16,
      originY - height * 0.35,
      left - width * 0.025,
      top + height * 0.12,
      left - width * 0.025,
      top
    );

    ctx.bezierCurveTo(
      left + width * 0.20,
      top - height * 0.035,
      right + width * 0.015,
      top + height * 0.08,
      right + width * 0.015,
      top + height * 0.11
    );

    ctx.bezierCurveTo(
      right,
      originY - height * 0.25,
      originX + width * 0.15,
      originY - height * 0.12,
      originX,
      originY
    );

    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawFinalOverlay(settings) {
  const photoVisibility = settings.photoVisibility;

  const overlayOpacity =
    clamp(1 - photoVisibility, 0, 1);

  if (overlayOpacity <= 0) {
    return;
  }

  ctx.save();

  ctx.fillStyle = rgba(
    settings.revealColor,
    overlayOpacity
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
  const p = clamp(progress, 0, 1);

  const titleY = 65;
  const subY = 94;
  const ctaY = 127;

  ctx.save();

  ctx.textBaseline = "middle";

  /*
    Opening text.
  */
  ctx.fillStyle = rgba(
    "#ffffff",
    1 - p
  );

  ctx.font =
    'bold 27px Georgia, "Times New Roman", serif';

  ctx.fillText(
    settings.title,
    30,
    titleY
  );

  if (settings.sub) {
    ctx.font =
      '15px Arial, Helvetica, sans-serif';

    ctx.fillText(
      settings.sub,
      31,
      subY
    );
  }

  if (settings.cta) {
    ctx.font =
      'bold 11px Arial, Helvetica, sans-serif';

    ctx.fillText(
      settings.cta,
      31,
      ctaY
    );
  }

  /*
    Final text.
  */
  ctx.fillStyle = rgba(
    "#111111",
    p
  );

  ctx.font =
    'bold 27px Georgia, "Times New Roman", serif';

  ctx.fillText(
    settings.title,
    30,
    titleY
  );

  if (settings.sub) {
    ctx.font =
      '15px Arial, Helvetica, sans-serif';

    ctx.fillText(
      settings.sub,
      31,
      subY
    );
  }

  if (settings.cta) {
    ctx.font =
      'bold 11px Arial, Helvetica, sans-serif';

    ctx.fillText(
      settings.cta,
      31,
      ctaY
    );
  }

  ctx.restore();
}

function renderFrame(progress) {
  const settings = getSettings();

  ctx.clearRect(
    0,
    0,
    W,
    H
  );

  /*
    1. Photograph.
  */
  drawCoverImage(
    backgroundImage,
    1
  );

  /*
    2. Opening dark overlay.
  */
  const openingOpacity =
    1 - settings.photoVisibility;

  if (openingOpacity > 0) {
    ctx.save();

    ctx.fillStyle = rgba(
      settings.openingColor,
      openingOpacity
    );

    ctx.fillRect(
      0,
      0,
      W,
      H
    );

    ctx.restore();
  }

  /*
    3. Animated reveal.
  */
  drawReveal(
    progress,
    settings
  );

  /*
    4. Final state.
  */
  if (progress >= 1) {
    drawFinalOverlay(settings);
  }

  /*
    5. Text.
  */
  drawText(
    progress,
    settings
  );
}

function animationProgress(elapsed, speed) {
  const safeSpeed =
    clamp(speed, 0.4, 1.4);

  const cycle =
    3600 / safeSpeed;

  const t =
    (elapsed % cycle) / cycle;

  /*
    Opening hold.
  */
  if (t < 0.30) {
    return 0;
  }

  /*
    Reveal.
  */
  if (t < 0.70) {
    const q =
      (t - 0.30) / 0.40;

    return q * q * (3 - 2 * q);
  }

  /*
    Final hold.
  */
  return 1;
}

function animatePreview(now) {
  const settings = getSettings();

  const elapsed =
    now - previewStart;

  const progress =
    animationProgress(
      elapsed,
      settings.speed
    );

  renderFrame(progress);

  previewRAF =
    requestAnimationFrame(
      animatePreview
    );
}

function loadImageFromFile(file) {
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    status.textContent =
      "Please choose an image file.";

    return;
  }

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }

  objectUrl =
    URL.createObjectURL(file);

  const img =
    new Image();

  img.onload = () => {
    backgroundImage = img;

    status.textContent =
      "Background image loaded.";

    restartPreview();
  };

  img.onerror = () => {
    status.textContent =
      "Could not load that image.";

    backgroundImage = null;
  };

  img.src = objectUrl;
}

imageInput.addEventListener(
  "change",
  () => {
    const file =
      imageInput.files &&
      imageInput.files[0];

    loadImageFromFile(file);
  }
);

[
  titleInput,
  subInput,
  ctaInput,
  urlInput,
  openingColorInput,
  revealColorInput,
  photoInput,
  sharpnessInput,
  spreadInput,
  speedInput
].forEach((element) => {
  element.addEventListener(
    "input",
    () => {
      updateOutputs();
      restartPreview();
    }
  );
});

pngBtn.addEventListener(
  "click",
  () => {
    renderFrame(1);

    const link =
      document.createElement("a");

    link.download =
      "of-ambition-and-grind-banner.png";

    link.href =
      canvas.toDataURL("image/png");

    document.body.appendChild(link);
    link.click();
    link.remove();

    status.textContent =
      "PNG created.";
  }
);

gifBtn.addEventListener(
  "click",
  () => {
    if (!window.GIF) {
      status.textContent =
        "GIF library did not load. Check your internet connection and refresh the page.";

      return;
    }

    gifBtn.disabled = true;
    pngBtn.disabled = true;

    status.textContent =
      "Generating GIF…";

    const frameCount = 54;
    const delay = 55;

    const gif =
      new GIF({
        workers: 2,
        quality: 8,
        width: W,
        height: H,

        /*
          Keep the worker on the CDN used by gif.js.
        */
        workerScript:
          "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js"
      });

    for (
      let i = 0;
      i < frameCount;
      i++
    ) {
      const t =
        i / (frameCount - 1);

      let progress;

      if (t < 0.28) {
        progress = 0;
      } else if (t < 0.72) {
        const q =
          (t - 0.28) / 0.44;

        progress =
          q * q * (3 - 2 * q);
      } else {
        progress = 1;
      }

      renderFrame(progress);

      gif.addFrame(
        ctx,
        {
          copy: true,
          delay
        }
      );
    }

    gif.on(
      "progress",
      (value) => {
        status.textContent =
          `Generating GIF… ${Math.round(value * 100)}%`;
      }
    );

    gif.on(
      "finished",
      (blob) => {
        const url =
          URL.createObjectURL(blob);

        const link =
          document.createElement("a");

        link.download =
          "of-ambition-and-grind-banner.gif";

        link.href = url;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(
          () => URL.revokeObjectURL(url),
          5000
        );

        status.textContent =
          "GIF created.";

        gifBtn.disabled = false;
        pngBtn.disabled = false;

        restartPreview();
      }
    );

    gif.on(
      "abort",
      () => {
        status.textContent =
          "GIF generation cancelled.";

        gifBtn.disabled = false;
        pngBtn.disabled = false;

        restartPreview();
      }
    );

    try {
      gif.render();
    } catch (error) {
      console.error(error);

      status.textContent =
        "GIF generation failed. Refresh the page and try again.";

      gifBtn.disabled = false;
      pngBtn.disabled = false;

      restartPreview();
    }
  }
);

function loadDefaultBackground() {
  const img =
    new Image();

  img.onload = () => {
    backgroundImage = img;

    status.textContent =
      "Ready — original book image loaded.";

    restartPreview();
  };

  img.onerror = () => {
    backgroundImage = null;

    status.textContent =
      "Ready — choose a background image.";

    restartPreview();
  };

  /*
    IMPORTANT:
    This is relative to the GitHub Pages project root.
  */
  img.src =
    "./assets/book-background.png";
}

updateOutputs();

loadDefaultBackground();

restartPreview();

if (previewRAF) {
  cancelAnimationFrame(previewRAF);
}

previewRAF =
  requestAnimationFrame(
    animatePreview
  );

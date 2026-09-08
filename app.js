"use strict";

const W = 600;
const H = 200;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: false });

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
    return { r: 0, g: 0, b: 0 };
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
    title: titleInput.value.trim() || "OF AMBITION AND GRIND",
    sub: subInput.value.trim(),
    cta: ctaInput.value.trim(),

    openingColor: openingColorInput.value,
    revealColor: revealColorInput.value,

    gradientStart: gradientStartInput
      ? gradientStartInput.value
      : "#ffffff",

    gradientEnd: gradientEndInput
      ? gradientEndInput.value
      : "#777777",

    gradientAngle: gradientAngleInput
      ? Number(gradientAngleInput.value)
      : 90,

    photoVisibility: Number(photoInput.value) / 100,
    revealOpacity: Number(revealOpacityInput.value) / 100,
    transparent: transparentInput.checked,

    speed: Number(speedInput.value) / 100
  };
}

function updateOutputs() {
  photoValue.textContent = `${photoInput.value}%`;
  revealOpacityValue.textContent = `${revealOpacityInput.value}%`;
  speedValue.textContent = `${speedInput.value}%`;

  if (gradientAngleValue && gradientAngleInput) {
    gradientAngleValue.textContent =
      `${gradientAngleInput.value}°`;
  }
}

function drawCoverImage(image) {
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, W, H);

  if (!image || !image.complete || !image.naturalWidth) {
    return false;
  }

  const scale = Math.max(
    W / image.naturalWidth,
    H / image.naturalHeight
  );

  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;

  const x = (W - drawWidth) / 2;
  const y = (H - drawHeight) / 2;

  ctx.drawImage(
    image,
    x,
    y,
    drawWidth,
    drawHeight
  );

  return true;
}

/*
 * Draw the downward-pointing semicircle overlay.
 */
function drawDownwardSemicircle(progress, settings) {
  if (settings.transparent) {
    return;
  }

  const p = clamp(progress, 0, 1);

  if (p <= 0) {
    return;
  }

  const radius = 390;
  const centerX = W / 2;

  const startY = -radius - 35;
  const endY = H + radius * 0.65;

  const centerY =
    startY + (endY - startY) * p;

  ctx.save();

  const angle =
    (settings.gradientAngle * Math.PI) / 180;

  const gradientLength = radius * 2;

  const x1 =
    centerX -
    Math.cos(angle) * gradientLength;

  const y1 =
    centerY -
    Math.sin(angle) * gradientLength;

  const x2 =
    centerX +
    Math.cos(angle) * gradientLength;

  const y2 =
    centerY +
    Math.sin(angle) * gradientLength;

  const gradient =
    ctx.createLinearGradient(
      x1,
      y1,
      x2,
      y2
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

  ctx.fillStyle = gradient;

  ctx.beginPath();

  ctx.moveTo(
    centerX + radius,
    centerY
  );

  ctx.arc(
    centerX,
    centerY,
    radius,
    0,
    Math.PI,
    false
  );

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

  ctx.fillStyle = rgba(
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


/*
 * TEXT ANIMATION
 *
 * 0.00 - 0.55
 * Reveal animation.
 *
 * 0.55 - 0.70
 * Title types letter by letter.
 *
 * 0.70 - 0.78
 * Pause.
 *
 * 0.78 - 0.86
 * Supporting text appears.
 *
 * 0.86 - 0.91
 * Pause.
 *
 * 0.91 - 0.97
 * AVAILABLE NOW appears.
 *
 * 0.97 - 1.00
 * Final hold.
 */
function drawText(progress, settings) {
  const p = clamp(progress, 0, 1);

  ctx.save();

  ctx.textBaseline = "middle";

  /*
   * TITLE
   *
   * 24px — smaller than before, but still prominent.
   */
  if (settings.title) {
    const titleStart = 0.55;
    const titleEnd = 0.70;

    let titleProgress = 0;

    if (p >= titleEnd) {
      titleProgress = 1;
    } else if (p > titleStart) {
      titleProgress =
        (p - titleStart) /
        (titleEnd - titleStart);
    }

    const titleLength =
      settings.title.length;

    const charactersToShow =
      Math.floor(
        titleProgress * titleLength
      );

    const visibleTitle =
      settings.title.substring(
        0,
        charactersToShow
      );

    ctx.font =
      'bold 24px Georgia, "Times New Roman", serif';

    /*
     * Keep the title in a controlled area
     * so it doesn't cover the whole book image.
     */
    ctx.fillStyle =
      rgba("#ffffff", 1);

    ctx.fillText(
      visibleTitle,
      30,
      65
    );

    /*
     * Typewriter cursor while title is typing.
     */
    if (
      p > titleStart &&
      p < titleEnd
    ) {
      const measuredWidth =
        ctx.measureText(visibleTitle).width;

      const cursorX =
        30 + measuredWidth + 2;

      ctx.fillRect(
        cursorX,
        52,
        2,
        25
      );
    }
  }


  /*
   * SUPPORTING TEXT
   *
   * Does not appear until the title
   * has finished and paused.
   */
  if (settings.sub) {
    const subStart = 0.78;
    const subEnd = 0.86;

    let subProgress = 0;

    if (p >= subEnd) {
      subProgress = 1;
    } else if (p > subStart) {
      subProgress =
        (p - subStart) /
        (subEnd - subStart);
    }

    ctx.font =
      '15px Arial, Helvetica, sans-serif';

    ctx.fillStyle =
      rgba(
        "#ffffff",
        subProgress
      );

    ctx.fillText(
      settings.sub,
      31,
      96
    );
  }


  /*
   * AVAILABLE NOW
   *
   * Appears last.
   */
  if (settings.cta) {
    const ctaStart = 0.91;
    const ctaEnd = 0.97;

    let ctaProgress = 0;

    if (p >= ctaEnd) {
      ctaProgress = 1;
    } else if (p > ctaStart) {
      ctaProgress =
        (p - ctaStart) /
        (ctaEnd - ctaStart);
    }

    ctx.font =
      'bold 11px Arial, Helvetica, sans-serif';

    ctx.fillStyle =
      rgba(
        "#ffffff",
        ctaProgress
      );

    ctx.fillText(
      settings.cta,
      31,
      127
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
    clamp(speed, 0.4, 1.4);

  const cycleMs =
    5000 / safeSpeed;

  const t =
    (elapsedMs % cycleMs) /
    cycleMs;

  /*
   * 30% opening hold.
   */
  if (t < 0.30) {
    return 0;
  }

  /*
   * 25% semicircle movement.
   */
  if (t < 0.55) {
    const q =
      (t - 0.30) /
      0.25;

    return q * q * (3 - 2 * q);
  }

  /*
   * Final state.
   *
   * Text animation happens here.
   */
  return 1;
}


function getAnimationProgressForGif(
  frameIndex,
  frameCount
) {
  const t =
    frameIndex /
    (frameCount - 1);

  if (t < 0.30) {
    return 0;
  }

  if (t < 0.55) {
    const q =
      (t - 0.30) /
      0.25;

    return q * q * (3 - 2 * q);
  }

  return 1;
}


function animatePreview(now) {
  const settings =
    getSettings();

  const revealProgress =
    animationProgress(
      now - previewStart,
      settings.speed
    );

  /*
   * Text timing needs its own clock.
   *
   * This makes the title type after
   * the semicircle has finished moving.
   */
  const safeSpeed =
    clamp(settings.speed, 0.4, 1.4);

  const cycleMs =
    5000 / safeSpeed;

  const cyclePosition =
    ((now - previewStart) %
      cycleMs) /
    cycleMs;

  let textProgress = 0;

  if (cyclePosition >= 0.55) {
    textProgress =
      (cyclePosition - 0.55) /
      0.45;
  }

  renderFrameWithTextProgress(
    revealProgress,
    textProgress,
    settings
  );

  requestAnimationFrame(
    animatePreview
  );
}


function renderFrameWithTextProgress(
  revealProgress,
  textProgress,
  settings
) {
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
    revealProgress,
    settings
  );

  drawText(
    textProgress,
    settings
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

  image.src = src;
}


/*
 * User-selected background image.
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

      objectUrl = null;
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
 * Controls.
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
].forEach(
  (element) => {
    if (!element) {
      return;
    }

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
  }
);


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

    const settings =
      getSettings();

    renderFrameWithTextProgress(
      1,
      1,
      settings
    );

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
 * Load GIF.js dynamically.
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

      const script =
        document.createElement(
          "script"
        );

      script.src =
        GIF_LIBRARY_URL;

      script.onload = () => {
        if (
          typeof window.GIF ===
          "function"
        ) {
          resolve();
        } else {
          reject(
            new Error(
              "GIF library loaded but GIF is unavailable."
            )
          );
        }
      };

      script.onerror = () => {
        reject(
          new Error(
            "Could not load GIF.js."
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
 * Create a same-origin Blob worker.
 *
 * This avoids directly assigning the
 * cross-origin CDN worker URL.
 */
function createWorkerLoader() {
  const workerCode = `
    importScripts("${GIF_WORKER_URL}");
  `;

  const blob =
    new Blob(
      [workerCode],
      {
        type:
          "application/javascript"
      }
    );

  return URL.createObjectURL(
    blob
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

    gifBtn.disabled = true;
    pngBtn.disabled = true;

    setStatus(
      "Loading GIF generator…"
    );

    try {

      await loadGifLibrary();

      const workerScript =
        createWorkerLoader();

      const frameCount = 80;
      const delay = 60;

      const gif =
        new window.GIF({
          workers: 2,
          quality: 8,
          width: W,
          height: H,
          workerScript
        });

      const settings =
        getSettings();

      /*
       * The GIF gets the same sequence
       * as the preview.
       */
      for (
        let i = 0;
        i < frameCount;
        i += 1
      ) {

        const revealProgress =
          getAnimationProgressForGif(
            i,
            frameCount
          );

        /*
         * Text begins after the reveal
         * finishes.
         */
        const t =
          i /
          (frameCount - 1);

        let textProgress = 0;

        if (t >= 0.55) {
          textProgress =
            (t - 0.55) /
            0.45;
        }

        renderFrameWithTextProgress(
          revealProgress,
          textProgress,
          settings
        );

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
              URL.revokeObjectURL(
                workerScript
              );
            },
            10000
          );

          setStatus(
            "GIF saved."
          );

          gifBtn.disabled = false;
          pngBtn.disabled = false;

          restartPreview();
        }
      );

      gif.on(
        "abort",
        () => {

          URL.revokeObjectURL(
            workerScript
          );

          setStatus(
            "GIF generation cancelled."
          );

          gifBtn.disabled = false;
          pngBtn.disabled = false;

          restartPreview();
        }
      );

      gif.render();

    } catch (error) {

      console.error(
        "GIF generation error:",
        error
      );

      setStatus(
        "GIF generation failed. Refresh the page and try again."
      );

      gifBtn.disabled = false;
      pngBtn.disabled = false;

      restartPreview();
    }
  }
);


/*
 * Initial values.
 */
updateOutputs();


/*
 * Load the default book image.
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

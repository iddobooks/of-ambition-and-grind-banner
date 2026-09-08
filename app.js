"use strict";

/*
  Of Ambition and Grind
  Email Signature Banner Generator

  Canvas:
  600 × 200 px

  GIF export:
  Uses gif.js, but converts the worker script into a
  same-origin Blob URL first. This avoids the GitHub Pages
  cross-origin Worker SecurityError.
*/

const W = 600;
const H = 200;

const canvas = document.getElementById("canvas");

const ctx = canvas.getContext("2d", {
  alpha: false,
  willReadFrequently: true
});


// ---------------------------------------------------------
// UI ELEMENTS
// ---------------------------------------------------------

const imageInput = document.getElementById("imageInput");

const titleInput = document.getElementById("titleInput");
const subInput = document.getElementById("subInput");
const ctaInput = document.getElementById("ctaInput");
const urlInput = document.getElementById("urlInput");

const openingColorInput =
  document.getElementById("openingColorInput");

const photoInput =
  document.getElementById("photoInput");

const photoValue =
  document.getElementById("photoValue");

const gradientStartInput =
  document.getElementById("gradientStartInput");

const gradientEndInput =
  document.getElementById("gradientEndInput");

const gradientAngleInput =
  document.getElementById("gradientAngleInput");

const gradientAngleValue =
  document.getElementById("gradientAngleValue");

const revealOpacityInput =
  document.getElementById("revealOpacityInput");

const revealOpacityValue =
  document.getElementById("revealOpacityValue");

const transparentInput =
  document.getElementById("transparentInput");

const speedInput =
  document.getElementById("speedInput");

const speedValue =
  document.getElementById("speedValue");

const pngBtn =
  document.getElementById("pngBtn");

const gifBtn =
  document.getElementById("gifBtn");

const status =
  document.getElementById("status");


// ---------------------------------------------------------
// IMAGES
// ---------------------------------------------------------

const defaultImage = new Image();
const uploadedImage = new Image();

let activeImage = null;

defaultImage.onload = () => {
  activeImage = defaultImage;

  status.textContent =
    "Background image loaded.";

  renderFrame(1);
};

defaultImage.onerror = () => {
  activeImage = null;

  status.textContent =
    "Default background not found. Upload a background image or add assets/book-background.png.";

  renderFrame(1);
};

defaultImage.src = "./assets/book-background.png";


// ---------------------------------------------------------
// SETTINGS
// ---------------------------------------------------------

function getSettings() {
  return {
    title:
      titleInput.value.trim() ||
      "OF AMBITION AND GRIND",

    sub:
      subInput.value.trim() ||
      "A NEW BOOK",

    cta:
      ctaInput.value.trim() ||
      "AVAILABLE NOW",

    url:
      urlInput.value.trim(),

    openingColor:
      openingColorInput.value,

    photoVisibility:
      Number(photoInput.value) / 100,

    gradientStart:
      gradientStartInput.value,

    gradientEnd:
      gradientEndInput.value,

    gradientAngle:
      Number(gradientAngleInput.value),

    revealOpacity:
      Number(revealOpacityInput.value) / 100,

    transparent:
      transparentInput.checked,

    speed:
      Number(speedInput.value)
  };
}


// ---------------------------------------------------------
// COLOUR HELPERS
// ---------------------------------------------------------

function hexToRgba(hex, alpha) {
  let clean = hex.replace("#", "");

  if (clean.length === 3) {
    clean =
      clean[0] + clean[0] +
      clean[1] + clean[1] +
      clean[2] + clean[2];
  }

  const r =
    parseInt(clean.substring(0, 2), 16);

  const g =
    parseInt(clean.substring(2, 4), 16);

  const b =
    parseInt(clean.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


// ---------------------------------------------------------
// BACKGROUND IMAGE
// ---------------------------------------------------------

function drawBackground(settings) {

  ctx.fillStyle = settings.openingColor;
  ctx.fillRect(0, 0, W, H);

  if (!activeImage || !activeImage.complete) {
    return;
  }

  const imageAspect =
    activeImage.naturalWidth /
    activeImage.naturalHeight;

  const canvasAspect =
    W / H;

  let drawWidth;
  let drawHeight;
  let drawX;
  let drawY;

  if (imageAspect > canvasAspect) {

    drawHeight = H;
    drawWidth =
      H * imageAspect;

    drawX =
      (W - drawWidth) / 2;

    drawY = 0;

  } else {

    drawWidth = W;

    drawHeight =
      W / imageAspect;

    drawX = 0;

    drawY =
      (H - drawHeight) / 2;
  }

  ctx.save();

  ctx.globalAlpha =
    settings.photoVisibility;

  ctx.drawImage(
    activeImage,
    drawX,
    drawY,
    drawWidth,
    drawHeight
  );

  ctx.restore();
}


// ---------------------------------------------------------
// OPENING OVERLAY
// ---------------------------------------------------------

function drawOpeningOverlay(settings) {

  const alpha =
    1 - settings.photoVisibility;

  if (alpha <= 0) {
    return;
  }

  ctx.save();

  ctx.globalAlpha = alpha;

  ctx.fillStyle =
    settings.openingColor;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.restore();
}


// ---------------------------------------------------------
// GRADIENT
// ---------------------------------------------------------

function createGradient(settings) {

  const angle =
    settings.gradientAngle *
    Math.PI /
    180;

  const dx =
    Math.cos(angle);

  const dy =
    Math.sin(angle);

  const cx = W / 2;
  const cy = H / 2;

  const length =
    Math.abs(W * dx) +
    Math.abs(H * dy);

  const x1 =
    cx - dx * length / 2;

  const y1 =
    cy - dy * length / 2;

  const x2 =
    cx + dx * length / 2;

  const y2 =
    cy + dy * length / 2;

  const gradient =
    ctx.createLinearGradient(
      x1,
      y1,
      x2,
      y2
    );

  gradient.addColorStop(
    0,
    settings.gradientStart
  );

  gradient.addColorStop(
    1,
    settings.gradientEnd
  );

  return gradient;
}


// ---------------------------------------------------------
// DOWNWARD SEMICIRCLE REVEAL
// ---------------------------------------------------------

function drawRevealSemicircle(
  progress,
  settings
) {

  if (settings.transparent) {
    return;
  }

  if (settings.revealOpacity <= 0) {
    return;
  }

  const p =
    Math.max(
      0,
      Math.min(1, progress)
    );

  const radius =
    W * 0.72;

  const centerX =
    W / 2;

  /*
    The shape is deliberately a downward-facing
    semicircle.

    It moves downward as the reveal progresses.
  */

  const startY =
    -radius * 0.95;

  const endY =
    H + radius * 0.20;

  const centerY =
    startY +
    (endY - startY) * p;

  ctx.save();

  ctx.globalAlpha =
    settings.revealOpacity;

  ctx.fillStyle =
    createGradient(settings);

  ctx.beginPath();

  ctx.moveTo(
    centerX - radius,
    centerY
  );

  ctx.arc(
    centerX,
    centerY,
    radius,
    Math.PI,
    0,
    false
  );

  ctx.closePath();

  ctx.fill();

  ctx.restore();
}


// ---------------------------------------------------------
// TEXT
// ---------------------------------------------------------

function drawText(
  progress,
  settings
) {

  /*
    Text remains visible throughout.
    It crossfades from white to dark as the
    gradient reveal passes through.
  */

  const darkAmount =
    Math.max(
      0,
      Math.min(1, progress)
    );

  const r =
    Math.round(255 * (1 - darkAmount));

  const g =
    Math.round(255 * (1 - darkAmount));

  const b =
    Math.round(255 * (1 - darkAmount));

  const textColor =
    `rgb(${r}, ${g}, ${b})`;

  ctx.save();

  ctx.fillStyle = textColor;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  /*
    Main title
  */

  ctx.font =
    "700 31px Arial, Helvetica, sans-serif";

  ctx.fillText(
    settings.title,
    38,
    72
  );

  /*
    Supporting text
  */

  ctx.font =
    "500 14px Arial, Helvetica, sans-serif";

  ctx.fillText(
    settings.sub,
    40,
    108
  );

  /*
    CTA
  */

  ctx.font =
    "700 15px Arial, Helvetica, sans-serif";

  ctx.fillText(
    settings.cta,
    40,
    145
  );

  /*
    Optional URL
  */

  if (settings.url) {

    ctx.font =
      "400 11px Arial, Helvetica, sans-serif";

    ctx.fillText(
      settings.url,
      40,
      170
    );
  }

  ctx.restore();
}


// ---------------------------------------------------------
// FRAME RENDERING
// ---------------------------------------------------------

function renderFrame(progress) {

  const settings =
    getSettings();

  ctx.clearRect(
    0,
    0,
    W,
    H
  );

  drawBackground(settings);

  drawOpeningOverlay(settings);

  drawRevealSemicircle(
    progress,
    settings
  );

  drawText(
    progress,
    settings
  );
}


// ---------------------------------------------------------
// ANIMATION
// ---------------------------------------------------------

let animationId = null;
let animationStart = null;

function getAnimationDuration() {

  /*
    Higher speed value = faster animation.
  */

  const speed =
    Number(speedInput.value);

  const baseDuration = 3000;

  return Math.max(
    1600,
    baseDuration *
      (100 / speed)
  );
}


function getProgressFromTime(elapsed) {

  const duration =
    getAnimationDuration();

  const t =
    Math.max(
      0,
      Math.min(
        1,
        elapsed / duration
      )
    );

  /*
    30% opening hold
    40% reveal
    30% final hold
  */

  if (t < 0.30) {
    return 0;
  }

  if (t < 0.70) {

    const q =
      (t - 0.30) / 0.40;

    /*
      Smoothstep
    */

    return (
      q * q *
      (3 - 2 * q)
    );
  }

  return 1;
}


function animate(timestamp) {

  if (!animationStart) {
    animationStart =
      timestamp;
  }

  const elapsed =
    timestamp -
    animationStart;

  const progress =
    getProgressFromTime(elapsed);

  renderFrame(progress);

  if (elapsed <
      getAnimationDuration()) {

    animationId =
      requestAnimationFrame(
        animate
      );

  } else {

    animationId = null;
    animationStart = null;

    renderFrame(1);
  }
}


function restartPreview() {

  if (animationId !== null) {

    cancelAnimationFrame(
      animationId
    );

    animationId = null;
  }

  animationStart = null;

  animationId =
    requestAnimationFrame(
      animate
    );
}


// ---------------------------------------------------------
// LIVE CONTROLS
// ---------------------------------------------------------

function updateControlDisplays() {

  photoValue.textContent =
    `${photoInput.value}%`;

  revealOpacityValue.textContent =
    `${revealOpacityInput.value}%`;

  gradientAngleValue.textContent =
    `${gradientAngleInput.value}°`;

  speedValue.textContent =
    `${speedInput.value}%`;
}


const liveControls = [

  titleInput,
  subInput,
  ctaInput,
  urlInput,

  openingColorInput,

  photoInput,

  gradientStartInput,
  gradientEndInput,
  gradientAngleInput,

  revealOpacityInput,

  transparentInput,

  speedInput
];


liveControls.forEach(
  control => {

    control.addEventListener(
      "input",
      () => {

        updateControlDisplays();

        renderFrame(1);
      }
    );

    control.addEventListener(
      "change",
      () => {

        updateControlDisplays();

        renderFrame(1);
      }
    );
  }
);


// ---------------------------------------------------------
// IMAGE UPLOAD
// ---------------------------------------------------------

imageInput.addEventListener(
  "change",
  event => {

    const file =
      event.target.files &&
      event.target.files[0];

    if (!file) {
      return;
    }

    const objectUrl =
      URL.createObjectURL(file);

    uploadedImage.onload = () => {

      activeImage =
        uploadedImage;

      status.textContent =
        "Custom background loaded.";

      renderFrame(1);

      URL.revokeObjectURL(
        objectUrl
      );
    };

    uploadedImage.onerror = () => {

      status.textContent =
        "Could not load that image.";

      URL.revokeObjectURL(
        objectUrl
      );
    };

    uploadedImage.src =
      objectUrl;
  }
);


// ---------------------------------------------------------
// PNG DOWNLOAD
// ---------------------------------------------------------

pngBtn.addEventListener(
  "click",
  () => {

    renderFrame(1);

    const link =
      document.createElement("a");

    link.download =
      "of-ambition-and-grind-banner.png";

    link.href =
      canvas.toDataURL(
        "image/png"
      );

    link.click();
  }
);


// ---------------------------------------------------------
// GIF WORKER
// ---------------------------------------------------------

const GIF_WORKER_SOURCE =
  "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js";


let workerBlobUrl = null;


async function getLocalWorkerUrl() {

  /*
    gif.js normally tries:

      new Worker("https://...")

    GitHub Pages blocks that because it is a
    cross-origin Worker.

    We fetch the worker source and turn it into
    a Blob URL. The resulting Worker is same-origin
    from the browser's perspective.
  */

  if (workerBlobUrl) {
    return workerBlobUrl;
  }

  const response =
    await fetch(
      GIF_WORKER_SOURCE,
      {
        mode: "cors",
        cache: "force-cache"
      }
    );

  if (!response.ok) {

    throw new Error(
      `Could not load GIF worker (${response.status}).`
    );
  }

  const source =
    await response.text();

  const blob =
    new Blob(
      [source],
      {
        type:
          "application/javascript"
      }
    );

  workerBlobUrl =
    URL.createObjectURL(
      blob
    );

  return workerBlobUrl;
}


// ---------------------------------------------------------
// GIF GENERATION
// ---------------------------------------------------------

gifBtn.addEventListener(
  "click",
  async () => {

    if (!window.GIF) {

      status.textContent =
        "GIF library did not load. Check your internet connection.";

      return;
    }

    gifBtn.disabled = true;
    pngBtn.disabled = true;

    status.textContent =
      "Preparing GIF encoder…";

    try {

      const workerUrl =
        await getLocalWorkerUrl();

      const gif =
        new window.GIF({

          workers: 2,

          quality: 8,

          width: W,

          height: H,

          workerScript:
            workerUrl
        });


      /*
        54 frames gives a smooth but reasonably
        sized email GIF.
      */

      const frameCount = 54;

      const frameDelay = 60;


      for (
        let i = 0;
        i < frameCount;
        i++
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
            q * q *
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
            delay: frameDelay
          }
        );
      }


      gif.on(
        "progress",
        progress => {

          status.textContent =
            `Generating GIF… ${Math.round(
              progress * 100
            )}%`;
        }
      );


      gif.on(
        "finished",
        blob => {

          const objectUrl =
            URL.createObjectURL(
              blob
            );

          const link =
            document.createElement("a");

          link.download =
            "of-ambition-and-grind-banner.gif";

          link.href =
            objectUrl;

          document.body.appendChild(
            link
          );

          link.click();

          link.remove();


          setTimeout(
            () => {

              URL.revokeObjectURL(
                objectUrl
              );

            },
            5000
          );


          status.textContent =
            "GIF created and downloaded.";

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


      gif.on(
        "error",
        error => {

          console.error(
            "GIF encoder error:",
            error
          );

          status.textContent =
            "GIF generation failed.";

          gifBtn.disabled = false;
          pngBtn.disabled = false;

          restartPreview();
        }
      );


      status.textContent =
        "Encoding GIF…";


      gif.render();

    } catch (error) {

      console.error(
        "GIF generation error:",
        error
      );

      status.textContent =
        "GIF generation failed: " +
        error.message;

      gifBtn.disabled = false;
      pngBtn.disabled = false;

      restartPreview();
    }
  }
);


// ---------------------------------------------------------
// INITIALISE
// ---------------------------------------------------------

updateControlDisplays();

renderFrame(1);

restartPreview();

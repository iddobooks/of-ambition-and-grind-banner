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
const revealOpacityInput = document.getElementById("revealOpacityInput");
const transparentInput = document.getElementById("transparentInput");
const speedInput = document.getElementById("speedInput");

const photoValue = document.getElementById("photoValue");
const revealOpacityValue = document.getElementById("revealOpacityValue");
const speedValue = document.getElementById("speedValue");

const pngBtn = document.getElementById("pngBtn");
const gifBtn = document.getElementById("gifBtn");
const status = document.getElementById("status");

let backgroundImage = null;
let previewStart = performance.now();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);

  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255
  };
}

function rgba(hex, alpha) {
  const c = hexToRgb(hex);
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}

function getSettings() {
  return {
    title: titleInput.value.trim() || "OF AMBITION AND GRIND",
    sub: subInput.value.trim(),
    cta: ctaInput.value.trim(),
    openingColor: openingColorInput.value,
    revealColor: revealColorInput.value,
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
}

function drawCoverImage(image, alpha = 1) {
  if (!image) {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, W, H);
    return;
  }

  const scale = Math.max(
    W / image.width,
    H / image.height
  );

  const dw = image.width * scale;
  const dh = image.height * scale;

  const dx = (W - dw) / 2;
  const dy = (H - dh) / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.restore();
}


/*
  ============================================================
  DOWNWARD-POINTING SEMICIRCLE REVEAL
  ============================================================

  This is ONE shape.

  It is NOT:
  - rays
  - triangles
  - a fan
  - a radial burst
  - a rotating shape

  The shape has:

       FLAT TOP
  -------------------
       \           /
        \         /
         \       /
          \_____/
             ↓

  The curved edge points downward.

  The animation moves this same shape through the banner.
*/
function drawDownwardSemicircle(progress, settings) {
  const p = clamp(progress, 0, 1);

  if (p <= 0 || settings.transparent) {
    return;
  }

  /*
    Radius controls the width of the semicircle.

    The radius is deliberately larger than half the banner width
    so the semicircle extends beyond the left and right edges.
  */
  const radius = W * 0.66;

  const centerX = W / 2;

  /*
    Start above the banner and move downward.
  */
  const startY = -radius * 1.05;
  const endY = H + radius * 0.18;

  const centerY =
    startY + (endY - startY) * p;

  ctx.save();

  ctx.fillStyle = rgba(
    settings.revealColor,
    settings.revealOpacity
  );

  /*
    TRUE DOWNWARD-FACING SEMICIRCLE.

    The diameter is the horizontal line at centerY.
    The arc travels from the left side downward and around
    to the right side.
  */
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

  ctx.lineTo(
    centerX - radius,
    centerY
  );

  ctx.closePath();

  ctx.fill();

  ctx.restore();
}


/*
  Final reveal state.
*/
function drawFinalReveal(settings) {
  if (settings.transparent) {
    return;
  }

  const finalOpacity =
    (1 - settings.photoVisibility) *
    settings.revealOpacity;

  if (finalOpacity <= 0) {
    return;
  }

  ctx.save();

  ctx.fillStyle = rgba(
    settings.revealColor,
    finalOpacity
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
  Banner text.
*/
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


/*
  Render one animation frame.
*/
function renderFrame(progress) {
  const settings = getSettings();

  ctx.clearRect(
    0,
    0,
    W,
    H
  );

  /*
    Base photograph.
  */
  drawCoverImage(
    backgroundImage,
    1
  );

  /*
    Initial dark overlay.
  */
  const openingOpacity =
    1 - settings.photoVisibility;

  if (
    progress < 1 &&
    openingOpacity > 0
  ) {
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
  }

  /*
    SINGLE DOWNWARD SEMICIRCLE.
  */
  drawDownwardSemicircle(
    progress,
    settings
  );

  /*
    Final state.
  */
  if (progress >= 1) {
    drawFinalReveal(settings);
  }

  /*
    Text.
  */
  drawText(
    progress,
    settings
  );
}


/*
  Animation timing.
*/
function animationProgress(timeMs, speed) {
  const cycle =
    3600 /
    clamp(
      speed,
      0.4,
      1.4
    );

  const t =
    (timeMs % cycle) /
    cycle;

  /*
    30% opening hold
    38% reveal
    32% final state
  */
  if (t < 0.30) {
    return 0;
  }

  if (t < 0.68) {
    const q =
      (t - 0.30) /
      0.38;

    /*
      Smooth ease-in/ease-out.
    */
    return (
      q * q *
      (3 - 2 * q)
    );
  }

  return 1;
}


/*
  Continuous preview.
*/
function animatePreview(now) {
  const settings = getSettings();

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


/*
  Restart animation.
*/
function restartPreview() {
  previewStart =
    performance.now();
}


/*
  Background image upload.
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

    const url =
      URL.createObjectURL(file);

    const img =
      new Image();

    img.onload = () => {
      backgroundImage = img;

      URL.revokeObjectURL(url);

      status.textContent =
        "Background image loaded.";

      restartPreview();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);

      status.textContent =
        "Could not load that image.";
    };

    img.src = url;
  }
);


/*
  Controls.
*/
[
  titleInput,
  subInput,
  ctaInput,
  urlInput,
  openingColorInput,
  revealColorInput,
  photoInput,
  revealOpacityInput,
  transparentInput,
  speedInput
].forEach(
  (el) => {

    el.addEventListener(
      "input",
      () => {
        updateOutputs();
        restartPreview();
      }
    );

    el.addEventListener(
      "change",
      () => {
        updateOutputs();
        restartPreview();
      }
    );

  }
);


/*
  PNG export.
*/
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

    status.textContent =
      "PNG created.";
  }
);


/*
  GIF export.
*/
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
      "Generating GIF…";

    const frameCount = 54;
    const delay = 55;

    const gif =
      new GIF({
        workers: 2,
        quality: 8,
        width: W,
        height: H,

        workerScript:
          "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js"
      });

    for (
      let i = 0;
      i < frameCount;
      i++
    ) {

      const t =
        i /
        (frameCount - 1);

      let progress;

      /*
        GIF timing:
        28% opening
        44% reveal
        28% final
      */
      if (t < 0.28) {

        progress = 0;

      } else if (t < 0.72) {

        const q =
          (t - 0.28) /
          0.44;

        progress =
          q * q *
          (3 - 2 * q);

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
      (p) => {

        status.textContent =
          `Generating GIF… ${Math.round(p * 100)}%`;
      }
    );

    gif.on(
      "finished",
      (blob) => {

        const link =
          document.createElement("a");

        link.download =
          "of-ambition-and-grind-banner.gif";

        link.href =
          URL.createObjectURL(blob);

        link.click();

        setTimeout(
          () => {
            URL.revokeObjectURL(
              link.href
            );
          },
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
        "GIF generation failed. Check the browser console for details.";

      gifBtn.disabled = false;
      pngBtn.disabled = false;

      restartPreview();
    }
  }
);


/*
  Initialize controls.
*/
updateOutputs();


/*
  Load the ORIGINAL book image automatically.

  The file must exist at:

      assets/book-background.png
*/
const defaultImage =
  new Image();

defaultImage.onload = () => {

  backgroundImage =
    defaultImage;

  status.textContent =
    "Ready — original book image loaded.";

  restartPreview();
};

defaultImage.onerror = () => {

  status.textContent =
    "Ready — choose a background image.";

  restartPreview();
};

defaultImage.src =
  "./assets/book-background.png";


/*
  Start preview.
*/
restartPreview();

requestAnimationFrame(
  animatePreview
);

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
let objectUrl = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex) {
  const clean = String(hex || "#000000").replace("#", "");

  if (clean.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }

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
    title:
      titleInput.value.trim() ||
      "OF AMBITION AND GRIND",

    sub:
      subInput.value.trim(),

    cta:
      ctaInput.value.trim(),

    openingColor:
      openingColorInput.value || "#000000",

    revealColor:
      revealColorInput.value || "#ffffff",

    photoVisibility:
      Number(photoInput.value || 24) / 100,

    revealOpacity:
      Number(revealOpacityInput.value || 100) / 100,

    transparent:
      transparentInput.checked,

    speed:
      Number(speedInput.value || 80) / 100
  };
}

function updateOutputs() {
  if (photoValue) {
    photoValue.textContent =
      `${photoInput.value}%`;
  }

  if (revealOpacityValue) {
    revealOpacityValue.textContent =
      `${revealOpacityInput.value}%`;
  }

  if (speedValue) {
    speedValue.textContent =
      `${speedInput.value}%`;
  }
}

/* ---------------------------------------------------------
   DRAW BACKGROUND
--------------------------------------------------------- */

function drawBackground(settings) {
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, W, H);

  if (!backgroundImage) {
    return;
  }

  const scale = Math.max(
    W / backgroundImage.width,
    H / backgroundImage.height
  );

  const width =
    backgroundImage.width * scale;

  const height =
    backgroundImage.height * scale;

  const x =
    (W - width) / 2;

  const y =
    (H - height) / 2;

  ctx.save();

  ctx.globalAlpha =
    settings.photoVisibility;

  ctx.drawImage(
    backgroundImage,
    x,
    y,
    width,
    height
  );

  ctx.restore();
}

/* ---------------------------------------------------------
   OPENING OVERLAY
--------------------------------------------------------- */

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

/* ---------------------------------------------------------
   DOWNWARD-POINTING SEMICIRCLE

   This is ONE clean shape.

                 FLAT EDGE
       -------------------------
        \                     /
         \                   /
          \                 /
           \_______________/
                  ↓

   The curved side points downward.

--------------------------------------------------------- */

function drawRevealSemicircle(
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

  /*
    Make the semicircle wider than
    the banner so its edges remain
    outside the canvas.
  */
  const radius =
    W * 0.72;

  const centerX =
    W / 2;

  /*
    Move the complete shape vertically.

    At progress 0:
      the semicircle is above the banner.

    At progress 1:
      it has moved below the banner.
  */
  const startY =
    -radius * 0.95;

  const endY =
    H + radius * 0.20;

  const centerY =
    startY +
    (endY - startY) * p;

  ctx.save();

  ctx.fillStyle =
    rgba(
      settings.revealColor,
      settings.revealOpacity
    );

  /*
    IMPORTANT:

    arc from PI → 0 gives the LOWER
    half of the circle in canvas
    coordinates.

    Therefore the curved portion
    points DOWN.
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

  ctx.closePath();

  ctx.fill();

  ctx.restore();
}

/* ---------------------------------------------------------
   TEXT
--------------------------------------------------------- */

function drawText(progress, settings) {
  const p =
    clamp(progress, 0, 1);

  /*
    Text changes from white to dark
    as the reveal progresses.
  */
  const whiteAlpha =
    1 - p;

  const darkAlpha =
    p;

  ctx.save();

  ctx.textBaseline =
    "middle";

  /*
    WHITE TEXT
  */
  ctx.fillStyle =
    `rgba(255,255,255,${whiteAlpha})`;

  ctx.font =
    'bold 27px Georgia, "Times New Roman", serif';

  ctx.fillText(
    settings.title,
    30,
    65
  );

  if (settings.sub) {
    ctx.font =
      '15px Arial, Helvetica, sans-serif';

    ctx.fillText(
      settings.sub,
      31,
      94
    );
  }

  if (settings.cta) {
    ctx.font =
      'bold 11px Arial, Helvetica, sans-serif';

    ctx.fillText(
      settings.cta,
      31,
      127
    );
  }

  /*
    DARK TEXT
  */
  ctx.fillStyle =
    `rgba(17,17,17,${darkAlpha})`;

  ctx.font =
    'bold 27px Georgia, "Times New Roman", serif';

  ctx.fillText(
    settings.title,
    30,
    65
  );

  if (settings.sub) {
    ctx.font =
      '15px Arial, Helvetica, sans-serif';

    ctx.fillText(
      settings.sub,
      31,
      94
    );
  }

  if (settings.cta) {
    ctx.font =
      'bold 11px Arial, Helvetica, sans-serif';

    ctx.fillText(
      settings.cta,
      31,
      127
    );
  }

  ctx.restore();
}

/* ---------------------------------------------------------
   RENDER ONE FRAME
--------------------------------------------------------- */

function renderFrame(progress) {
  const settings =
    getSettings();

  ctx.clearRect(
    0,
    0,
    W,
    H
  );

  /*
    Photograph.
  */
  drawBackground(
    settings
  );

  /*
    Opening dark overlay.
  */
  drawOpeningOverlay(
    settings
  );

  /*
    Downward semicircle.
  */
  drawRevealSemicircle(
    progress,
    settings
  );

  /*
    Text.
  */
  drawText(
    progress,
    settings
  );
}

/* ---------------------------------------------------------
   ANIMATION TIMING
--------------------------------------------------------- */

function getAnimationProgress(
  elapsed,
  speed
) {
  const duration =
    3600 /
    clamp(
      speed,
      0.4,
      1.4
    );

  const t =
    (elapsed % duration) /
    duration;

  /*
    30%:
      opening

    40%:
      semicircle reveal

    30%:
      final state
  */

  if (t < 0.30) {
    return 0;
  }

  if (t < 0.70) {
    const reveal =
      (t - 0.30) / 0.40;

    /*
      Smooth movement.
    */
    return (
      reveal *
      reveal *
      (3 - 2 * reveal)
    );
  }

  return 1;
}

/* ---------------------------------------------------------
   PREVIEW
--------------------------------------------------------- */

function animate(now) {
  const settings =
    getSettings();

  const elapsed =
    now - previewStart;

  const progress =
    getAnimationProgress(
      elapsed,
      settings.speed
    );

  renderFrame(
    progress
  );

  requestAnimationFrame(
    animate
  );
}

function restartPreview() {
  previewStart =
    performance.now();
}

/* ---------------------------------------------------------
   IMAGE UPLOAD
--------------------------------------------------------- */

imageInput.addEventListener(
  "change",
  function () {
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

    const img =
      new Image();

    img.onload =
      function () {
        backgroundImage =
          img;

        status.textContent =
          "Background image loaded.";

        restartPreview();
      };

    img.onerror =
      function () {
        status.textContent =
          "Unable to load the selected image.";
      };

    img.src =
      objectUrl;
  }
);

/* ---------------------------------------------------------
   CONTROLS
--------------------------------------------------------- */

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
  function (element) {
    if (!element) {
      return;
    }

    element.addEventListener(
      "input",
      function () {
        updateOutputs();
        restartPreview();
      }
    );

    element.addEventListener(
      "change",
      function () {
        updateOutputs();
        restartPreview();
      }
    );
  }
);

/* ---------------------------------------------------------
   PNG DOWNLOAD
--------------------------------------------------------- */

pngBtn.addEventListener(
  "click",
  function () {
    renderFrame(1);

    canvas.toBlob(
      function (blob) {
        if (!blob) {
          status.textContent =
            "PNG creation failed.";

          return;
        }

        const link =
          document.createElement("a");

        const downloadUrl =
          URL.createObjectURL(
            blob
          );

        link.href =
          downloadUrl;

        link.download =
          "of-ambition-and-grind-banner.png";

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        setTimeout(
          function () {
            URL.revokeObjectURL(
              downloadUrl
            );
          },
          1000
        );

        status.textContent =
          "PNG created.";
      },
      "image/png"
    );
  }
);

/* ---------------------------------------------------------
   GIF DOWNLOAD
--------------------------------------------------------- */

gifBtn.addEventListener(
  "click",
  function () {
    if (
      typeof window.GIF !==
      "function"
    ) {
      status.textContent =
        "GIF library has not loaded yet. Refresh the page and try again.";

      return;
    }

    gifBtn.disabled = true;
    pngBtn.disabled = true;

    status.textContent =
      "Preparing GIF…";

    const settings =
      getSettings();

    const frameCount =
      54;

    const frameDelay =
      60;

    const gif =
      new GIF({
        workers: 2,
        quality: 8,
        width: W,
        height: H,

        /*
          gif.js worker loaded from CDN.
        */
        workerScript:
          "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js"
      });

    /*
      Generate every frame.
    */
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
          delay: frameDelay
        }
      );
    }

    gif.on(
      "progress",
      function (value) {
        status.textContent =
          `Generating GIF… ${Math.round(value * 100)}%`;
      }
    );

    gif.on(
      "finished",
      function (blob) {
        const downloadUrl =
          URL.createObjectURL(
            blob
          );

        const link =
          document.createElement("a");

        link.href =
          downloadUrl;

        link.download =
          "of-ambition-and-grind-banner.gif";

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        setTimeout(
          function () {
            URL.revokeObjectURL(
              downloadUrl
            );
          },
          10000
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
      function () {
        status.textContent =
          "GIF generation was cancelled.";

        gifBtn.disabled = false;
        pngBtn.disabled = false;
      }
    );

    try {
      gif.render();
    } catch (error) {
      console.error(
        "GIF generation error:",
        error
      );

      status.textContent =
        "GIF generation failed. Check the browser console.";

      gifBtn.disabled = false;
      pngBtn.disabled = false;
    }
  }
);

/* ---------------------------------------------------------
   LOAD DEFAULT BOOK IMAGE
--------------------------------------------------------- */

const defaultImage =
  new Image();

defaultImage.onload =
  function () {
    backgroundImage =
      defaultImage;

    status.textContent =
      "Ready — original book image loaded.";

    restartPreview();
  };

defaultImage.onerror =
  function () {
    backgroundImage = null;

    status.textContent =
      "Ready — choose a background image.";

    restartPreview();
  };

/*
  IMPORTANT:
  This path is relative to index.html.
*/
defaultImage.src =
  "./assets/book-background.png";

/* ---------------------------------------------------------
   INITIALIZE
--------------------------------------------------------- */

updateOutputs();

restartPreview();

requestAnimationFrame(
  animate
);

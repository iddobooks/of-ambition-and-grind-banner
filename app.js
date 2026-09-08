const W = 600;
const H = 200;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", {
  alpha: false,
  willReadFrequently: true
});

const imageInput = document.getElementById("imageInput");

const titleInput = document.getElementById("titleInput");
const subInput = document.getElementById("subInput");
const ctaInput = document.getElementById("ctaInput");
const urlInput = document.getElementById("urlInput");

const openingColorInput = document.getElementById("openingColorInput");
const revealColorInput = document.getElementById("revealColorInput");

const gradientStartInput =
  document.getElementById("gradientStartInput");

const gradientEndInput =
  document.getElementById("gradientEndInput");

const gradientAngleInput =
  document.getElementById("gradientAngleInput");

const photoInput =
  document.getElementById("photoInput");

const revealOpacityInput =
  document.getElementById("revealOpacityInput");

const transparentInput =
  document.getElementById("transparentInput");

const speedInput =
  document.getElementById("speedInput");

const photoValue =
  document.getElementById("photoValue");

const revealOpacityValue =
  document.getElementById("revealOpacityValue");

const gradientAngleValue =
  document.getElementById("gradientAngleValue");

const speedValue =
  document.getElementById("speedValue");

const pngBtn =
  document.getElementById("pngBtn");

const gifBtn =
  document.getElementById("gifBtn");

const status =
  document.getElementById("status");

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
      gradientStartInput.value,

    gradientEnd:
      gradientEndInput.value,

    gradientAngle:
      Number(gradientAngleInput.value),

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

  gradientAngleValue.textContent =
    `${gradientAngleInput.value}°`;

  speedValue.textContent =
    `${speedInput.value}%`;
}


function drawCoverImage(image, alpha = 1) {
  if (!image) {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, W, H);
    return;
  }

  const scale =
    Math.max(
      W / image.width,
      H / image.height
    );

  const dw = image.width * scale;
  const dh = image.height * scale;

  const dx = (W - dw) / 2;
  const dy = (H - dh) / 2;

  ctx.save();

  ctx.globalAlpha = alpha;

  ctx.drawImage(
    image,
    dx,
    dy,
    dw,
    dh
  );

  ctx.restore();
}


/*
  Creates the configurable gradient used
  by the reveal semicircle.
*/
function createRevealGradient(settings, x, y) {
  const angle =
    settings.gradientAngle *
    Math.PI /
    180;

  const length = Math.sqrt(
    W * W +
    H * H
  );

  const dx =
    Math.cos(angle) *
    length;

  const dy =
    Math.sin(angle) *
    length;

  const gradient =
    ctx.createLinearGradient(
      x - dx / 2,
      y - dy / 2,
      x + dx / 2,
      y + dy / 2
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
  THE REVEAL SHAPE

  One single downward-facing semicircle.

  Flat edge = top
  Curved edge = downward

  The shape itself does not rotate.
  It simply moves downward during
  the animation.
*/
function drawDownwardSemicircle(
  progress,
  settings
) {
  const p =
    clamp(progress, 0, 1);

  if (
    p <= 0 ||
    settings.transparent
  ) {
    return;
  }

  const radius = W * 0.66;
  const centerX = W / 2;

  const startY =
    -radius * 1.05;

  const endY =
    H + radius * 0.18;

  const centerY =
    startY +
    (endY - startY) * p;

  ctx.save();

  ctx.globalAlpha = 1;

  ctx.fillStyle =
    createRevealGradient(
      settings,
      centerX,
      centerY
    );

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

  const gradient =
    createRevealGradient(
      settings,
      W / 2,
      H / 2
    );

  ctx.globalAlpha =
    finalOpacity;

  ctx.fillStyle = gradient;

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

  const titleY = 65;
  const subY = 94;
  const ctaY = 127;

  ctx.save();

  ctx.textBaseline =
    "middle";


  /* WHITE VERSION */

  ctx.fillStyle =
    rgba("#ffffff", 1 - p);

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


  /* DARK VERSION */

  ctx.fillStyle =
    rgba("#111111", p);

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
  const settings =
    getSettings();

  ctx.clearRect(
    0,
    0,
    W,
    H
  );


  /* BASE PHOTO */

  drawCoverImage(
    backgroundImage,
    1
  );


  /* OPENING OVERLAY */

  const openingOpacity =
    1 -
    settings.photoVisibility;

  if (
    progress < 1 &&
    openingOpacity > 0
  ) {
    ctx.fillStyle =
      rgba(
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


  /* REVEAL */

  drawDownwardSemicircle(
    progress,
    settings
  );


  /* FINAL */

  if (progress >= 1) {
    drawFinalReveal(
      settings
    );
  }


  /* TEXT */

  drawText(
    progress,
    settings
  );
}


function animationProgress(
  timeMs,
  speed
) {
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


  if (t < 0.30) {
    return 0;
  }


  if (t < 0.68) {
    const q =
      (t - 0.30) /
      0.38;

    return (
      q *
      q *
      (3 - 2 * q)
    );
  }


  return 1;
}


function animatePreview(now) {
  const settings =
    getSettings();

  renderFrame(
    animationProgress(
      now - previewStart,
      settings.speed
    )
  );

  requestAnimationFrame(
    animatePreview
  );
}


function restartPreview() {
  previewStart =
    performance.now();
}


/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

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
      backgroundImage =
        img;

      URL.revokeObjectURL(
        url
      );

      status.textContent =
        "Background image loaded.";

      restartPreview();
    };

    img.onerror = () => {
      URL.revokeObjectURL(
        url
      );

      status.textContent =
        "Could not load that image.";
    };

    img.src = url;
  }
);


/* =========================================================
   LIVE CONTROLS
   ========================================================= */

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
].forEach(el => {

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

});


/* =========================================================
   PNG
   ========================================================= */

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

    restartPreview();
  }
);


/* =========================================================
   GIF
   ========================================================= */

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
      new window.GIF({
        workers: 2,

        quality: 8,

        width: W,

        height: H,

        /*
          IMPORTANT:
          The worker is now local.
        */
        workerScript:
          "./gif.worker.js"
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


      if (t < 0.28) {

        progress = 0;

      } else if (t < 0.72) {

        const q =
          (t - 0.28) /
          0.44;

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
      p => {
        status.textContent =
          `Generating GIF… ${Math.round(p * 100)}%`;
      }
    );


    gif.on(
      "finished",
      blob => {

        const url =
          URL.createObjectURL(
            blob
          );

        const link =
          document.createElement("a");

        link.download =
          "of-ambition-and-grind-banner.gif";

        link.href = url;

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();


        setTimeout(
          () => {
            URL.revokeObjectURL(
              url
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
          "GIF worker error:",
          error
        );

        status.textContent =
          "GIF generation failed. Check the browser console.";

        gifBtn.disabled = false;
        pngBtn.disabled = false;

        restartPreview();
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

      restartPreview();
    }

  }
);


/* =========================================================
   INITIALISE
   ========================================================= */

updateOutputs();


const defaultImage =
  new Image();

defaultImage.onload =
  () => {

    backgroundImage =
      defaultImage;

    status.textContent =
      "Ready — original book image loaded.";

    restartPreview();
  };


defaultImage.onerror =
  () => {

    status.textContent =
      "Ready — choose a background image.";

    restartPreview();
  };


defaultImage.src =
  "./assets/book-background.png";


restartPreview();

requestAnimationFrame(
  animatePreview
);

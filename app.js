const W = 600;
const H = 200;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const imageInput = document.getElementById("imageInput");

const titleInput = document.getElementById("titleInput");
const subInput = document.getElementById("subInput");
const ctaInput = document.getElementById("ctaInput");
const urlInput = document.getElementById("urlInput");

const overlayInput = document.getElementById("overlayInput");
const overlayValue = document.getElementById("overlayValue");

const speedInput = document.getElementById("speedInput");
const speedValue = document.getElementById("speedValue");

const statusEl = document.getElementById("status");

let source = new Image();
let sourceReady = false;

const animationStart = performance.now();


/* =========================================================
   DEFAULT IMAGE
========================================================= */

source.onload = () => {
  sourceReady = true;
  draw(0);
};

source.onerror = () => {
  statusEl.textContent =
    "Could not load assets/book-background.png";
};

source.src = "assets/book-background.png";


/* =========================================================
   IMAGE UPLOAD
========================================================= */

imageInput.addEventListener("change", event => {

  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {

    const uploadedImage = new Image();

    uploadedImage.onload = () => {

      source = uploadedImage;
      sourceReady = true;

      statusEl.textContent =
        "Background image loaded.";

      draw(
        (performance.now() - animationStart) / 1000
      );
    };

    uploadedImage.onerror = () => {

      statusEl.textContent =
        "Could not load that image.";

    };

    uploadedImage.src = reader.result;
  };

  reader.readAsDataURL(file);
});


/* =========================================================
   TEXT CONTROLS
========================================================= */

[
  titleInput,
  subInput,
  ctaInput,
  urlInput
].forEach(input => {

  input.addEventListener("input", () => {

    draw(
      (performance.now() - animationStart) / 1000
    );

  });

});


/* =========================================================
   OVERLAY TRANSPARENCY CONTROL
========================================================= */

overlayInput.addEventListener("input", () => {

  updateOverlayLabel();

  draw(
    (performance.now() - animationStart) / 1000
  );

});


function updateOverlayLabel() {

  const value =
    Number(overlayInput.value);

  if (overlayValue) {

    overlayValue.textContent =
      `${value}%`;

  }
}


/* =========================================================
   SPEED CONTROL
========================================================= */

speedInput.addEventListener("input", () => {

  updateSpeedLabel();

});


function updateSpeedLabel() {

  const value =
    Number(speedInput.value);

  let label = "Normal";

  if (value < 65) {
    label = "Fast";
  }

  if (value > 105) {
    label = "Slow";
  }

  if (speedValue) {
    speedValue.textContent = label;
  }
}


updateOverlayLabel();
updateSpeedLabel();


/* =========================================================
   DRAW COVER IMAGE
========================================================= */

function drawCoverImage(image) {

  const imageRatio =
    image.width / image.height;

  const canvasRatio =
    W / H;

  let drawWidth;
  let drawHeight;

  if (imageRatio > canvasRatio) {

    drawHeight = H;
    drawWidth = H * imageRatio;

  } else {

    drawWidth = W;
    drawHeight = W / imageRatio;

  }

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
}


/* =========================================================
   TITLE SIZE
========================================================= */

function getTitleSize(text) {

  let size = 34;

  while (size > 20) {

    ctx.font =
      `700 ${size}px Georgia, "Times New Roman", serif`;

    if (
      ctx.measureText(text).width <= 350
    ) {

      return size;

    }

    size--;
  }

  return size;
}


/* =========================================================
   DRAW TEXT
========================================================= */

function drawText(color) {

  const title =
    titleInput.value
      .trim()
      .toUpperCase();

  const sub =
    subInput.value
      .trim()
      .toUpperCase();

  const cta =
    ctaInput.value
      .trim()
      .toUpperCase();


  /*
     TITLE
  */

  const titleSize =
    getTitleSize(title);

  ctx.font =
    `700 ${titleSize}px Georgia, "Times New Roman", serif`;

  ctx.fillStyle = color;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.fillText(
    title,
    30,
    73
  );


  /*
     SUPPORTING TEXT
  */

  ctx.font =
    "600 10px Arial, Helvetica, sans-serif";

  ctx.fillStyle = color;

  ctx.fillText(
    sub,
    32,
    116
  );


  /*
     CTA
  */

  ctx.font =
    "700 11px Arial, Helvetica, sans-serif";

  ctx.fillText(
    cta,
    32,
    155
  );


  /*
     ARROW
  */

  const ctaWidth =
    ctx.measureText(cta).width;

  ctx.font =
    "700 15px Arial, Helvetica, sans-serif";

  ctx.fillText(
    "→",
    42 + ctaWidth,
    155
  );


  /*
     DIVIDER
  */

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(
    32,
    174
  );

  ctx.lineTo(
    32 + Math.min(
      185,
      ctaWidth + 45
    ),
    174
  );

  ctx.stroke();
}


/* =========================================================
   TRANSPARENCY
=========================================================

   THIS IS THE IMPORTANT PART.

   The slider represents actual transparency.

   0%   = completely opaque
   30%  = 30% transparent
   50%  = half transparent
   70%  = mostly transparent
   100% = invisible overlay

========================================================= */

function getTransparency() {

  return Number(
    overlayInput.value
  ) / 100;
}


function getOverlayOpacity() {

  const transparency =
    getTransparency();

  return 1 - transparency;
}


/* =========================================================
   DARK STATE
========================================================= */

function drawDarkState() {

  const overlayOpacity =
    getOverlayOpacity();


  /*
     Maximum black overlay is 90%.

     The photograph is ALWAYS underneath.

     Therefore even at 0% transparency,
     there is still a tiny amount of
     photograph visible.
  */

  const blackOpacity =
    0.90 * overlayOpacity;


  ctx.fillStyle =
    `rgba(
      0,
      0,
      0,
      ${blackOpacity}
    )`;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /*
     WHITE TEXT
  */

  drawText(
    "rgba(255,255,255,0.96)"
  );
}


/* =========================================================
   LIGHT STATE
========================================================= */

function drawLightState() {

  const overlayOpacity =
    getOverlayOpacity();


  /*
     White overlay.

     At 0% transparency:
       82% white

     At 50% transparency:
       41% white

     At 70% transparency:
       25% white

     At 100%:
       0% white
  */

  const whiteOpacity =
    0.82 * overlayOpacity;


  ctx.fillStyle =
    `rgba(
      255,
      255,
      255,
      ${whiteOpacity}
    )`;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /*
     BLACK TEXT
  */

  drawText(
    "rgba(15,15,15,0.96)"
  );
}


/* =========================================================
   MAIN ANIMATION
========================================================= */

function draw(t) {

  ctx.clearRect(
    0,
    0,
    W,
    H
  );


  if (!sourceReady) {
    return;
  }


  /*
     -------------------------------------
     ORIGINAL PHOTOGRAPH
     -------------------------------------

     Nothing is painted over it yet.
  */

  drawCoverImage(source);


  /*
     -------------------------------------
     THREE SECOND LOOP
     -------------------------------------
  */

  const duration = 3.0;

  const time =
    ((t % duration) + duration) % duration;


  /*
     -------------------------------------
     DARK STATE
     -------------------------------------
  */

  const transitionStart = 1.20;


  if (time < transitionStart) {

    drawDarkState();

    return;
  }


  /*
     -------------------------------------
     UPWARD TRANSITION
     -------------------------------------
  */

  const transitionDuration = 0.90;


  let progress =
    (time - transitionStart) /
    transitionDuration;


  progress =
    Math.max(
      0,
      Math.min(
        1,
        progress
      )
    );


  /*
     Fast beginning.
     Smooth finish.
  */

  const eased =
    1 -
    Math.pow(
      1 - progress,
      3
    );


  const overlayOpacity =
    getOverlayOpacity();


  /*
     -------------------------------------
     DARK BASE
     -------------------------------------

     We start from the same dark state.
  */

  ctx.fillStyle =
    `rgba(
      0,
      0,
      0,
      ${0.90 * overlayOpacity}
    )`;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /*
     -------------------------------------
     UPWARD LIGHT POSITION
     -------------------------------------

     Starts below the banner.

     Shoots vertically upward.

     Ends above the banner.
  */

  const startY =
    H + 45;

  const endY =
    -45;


  const lightY =
    startY +
    (endY - startY) * eased;


  /*
     -------------------------------------
     LIGHT WIDTH
     -------------------------------------

     Narrow at the bottom.

     Very wide by the time it
     reaches the top.
  */

  const startWidth =
    24;

  const endWidth =
    330;


  const lightWidth =
    startWidth +
    (endWidth - startWidth) *
    eased;


  /*
     -------------------------------------
     LIGHT CENTER
     -------------------------------------

     The light rises from roughly
     the middle of the composition.
  */

  const centerX =
    285;


  /*
     -------------------------------------
     SOFT LIGHT CORE
     -------------------------------------
  */

  const lightGradient =
    ctx.createRadialGradient(
      centerX,
      lightY,
      0,
      centerX,
      lightY,
      lightWidth
    );


  /*
     Center
  */

  lightGradient.addColorStop(
    0,
    `rgba(
      255,
      255,
      255,
      ${0.78 * overlayOpacity}
    )`
  );


  /*
     Inner edge
  */

  lightGradient.addColorStop(
    0.22,
    `rgba(
      255,
      255,
      255,
      ${0.62 * overlayOpacity}
    )`
  );


  /*
     Middle
  */

  lightGradient.addColorStop(
    0.48,
    `rgba(
      255,
      255,
      255,
      ${0.40 * overlayOpacity}
    )`
  );


  /*
     Outer feather
  */

  lightGradient.addColorStop(
    0.72,
    `rgba(
      255,
      255,
      255,
      ${0.18 * overlayOpacity}
    )`
  );


  /*
     Completely transparent edge
  */

  lightGradient.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );


  ctx.fillStyle =
    lightGradient;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /*
     -------------------------------------
     BROAD WHITE TRAIL
     -------------------------------------

     The light leaves a translucent
     white field behind it.

     This is what creates the feeling
     that darkness is being lifted.
  */

  const revealTop =
    lightY -
    lightWidth * 0.45;


  const revealGradient =
    ctx.createLinearGradient(
      0,
      revealTop,
      0,
      H
    );


  revealGradient.addColorStop(
    0,
    "rgba(255,255,255,0)"
  );


  revealGradient.addColorStop(
    0.12,
    `rgba(
      255,
      255,
      255,
      ${0.12 * eased * overlayOpacity}
    )`
  );


  revealGradient.addColorStop(
    0.30,
    `rgba(
      255,
      255,
      255,
      ${0.25 * eased * overlayOpacity}
    )`
  );


  revealGradient.addColorStop(
    0.55,
    `rgba(
      255,
      255,
      255,
      ${0.43 * eased * overlayOpacity}
    )`
  );


  revealGradient.addColorStop(
    1,
    `rgba(
      255,
      255,
      255,
      ${0.62 * eased * overlayOpacity}
    )`
  );


  ctx.fillStyle =
    revealGradient;


  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /*
     -------------------------------------
     TEXT TRANSITION
     -------------------------------------

     WHITE → BLACK
  */

  const textValue =
    Math.round(
      255 -
      240 * eased
    );


  drawText(
    `rgba(
      ${textValue},
      ${textValue},
      ${textValue},
      0.96
    )`
  );


  /*
     -------------------------------------
     FINAL STATE
     -------------------------------------
  */

  if (progress >= 1) {

    drawLightState();

  }
}


/* =========================================================
   LIVE ANIMATION
========================================================= */

function animationLoop(now) {

  const elapsed =
    (now - animationStart) /
    1000;


  draw(elapsed);


  requestAnimationFrame(
    animationLoop
  );
}


requestAnimationFrame(
  animationLoop
);


/* =========================================================
   PNG DOWNLOAD
========================================================= */

document
  .getElementById("pngBtn")
  .addEventListener("click", () => {

    draw(
      (performance.now() - animationStart) /
      1000
    );


    const link =
      document.createElement("a");


    link.download =
      "of-ambition-and-grind-banner.png";


    link.href =
      canvas.toDataURL(
        "image/png"
      );


    link.click();

  });


/* =========================================================
   GIF GENERATION
========================================================= */

document
  .getElementById("gifBtn")
  .addEventListener("click", () => {

    if (!sourceReady) {

      statusEl.textContent =
        "Please load a background image first.";

      return;
    }


    statusEl.textContent =
      "Preparing GIF…";


    /*
       45 frames gives us a smooth
       upward transition.
    */

    const totalFrames =
      45;


    /*
       User-controlled frame delay.
    */

    const frameDelay =
      Number(speedInput.value);


    const gif =
      new GIF({

        workers: 2,

        quality: 8,

        width: W,

        height: H,

        workerScript:
          "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js"

      });


    /*
       Generate every frame.
    */

    for (
      let frame = 0;
      frame < totalFrames;
      frame++
    ) {

      const frameTime =
        (frame / totalFrames) * 3.0;


      draw(frameTime);


      gif.addFrame(
        ctx,
        {
          copy: true,
          delay: frameDelay
        }
      );

    }


    /*
       Progress
    */

    gif.on(
      "progress",
      progress => {

        statusEl.textContent =
          `Generating GIF… ${Math.round(progress * 100)}%`;

      }
    );


    /*
       Finished
    */

    gif.on(
      "finished",
      blob => {

        const objectURL =
          URL.createObjectURL(blob);


        const link =
          document.createElement("a");


        link.download =
          "of-ambition-and-grind-banner.gif";


        link.href =
          objectURL;


        link.click();


        setTimeout(
          () => {

            URL.revokeObjectURL(
              objectURL
            );

          },
          10000
        );


        statusEl.textContent =
          "GIF ready.";

      }
    );


    /*
       Error/cancel
    */

    gif.on(
      "abort",
      () => {

        statusEl.textContent =
          "GIF generation cancelled.";

      }
    );


    gif.render();

  });

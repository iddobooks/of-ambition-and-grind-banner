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
   DEFAULT BOOK IMAGE
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

    const uploaded = new Image();

    uploaded.onload = () => {

      source = uploaded;
      sourceReady = true;

      statusEl.textContent =
        "Background image loaded.";

      draw(0);
    };

    uploaded.onerror = () => {

      statusEl.textContent =
        "Could not load that image.";

    };

    uploaded.src = reader.result;
  };

  reader.readAsDataURL(file);
});


/* =========================================================
   CONTROLS
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


overlayInput.addEventListener("input", () => {

  updateOverlayLabel();

  draw(
    (performance.now() - animationStart) / 1000
  );

});


speedInput.addEventListener("input", () => {

  updateSpeedLabel();

});


function updateOverlayLabel() {

  const value =
    Number(overlayInput.value);

  overlayValue.textContent =
    `${value}%`;
}


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

  speedValue.textContent = label;
}


updateOverlayLabel();
updateSpeedLabel();


/* =========================================================
   IMAGE COVER
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
   TEXT
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
     SMALL DIVIDER
  */

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(
    32,
    174
  );

  ctx.lineTo(
    32 + Math.min(185, ctaWidth + 45),
    174
  );

  ctx.stroke();
}


/* =========================================================
   DARK OPENING STATE
========================================================= */

function drawDarkState(opacity) {

  /*
     IMPORTANT:

     This is NOT opaque black.

     The photograph remains visible
     underneath the black overlay.
  */

  ctx.fillStyle =
    `rgba(0, 0, 0, ${opacity})`;

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
   WHITE FINAL STATE
========================================================= */

function drawLightState(opacity) {

  /*
     IMPORTANT:

     This is NOT solid white.

     The photograph remains visible
     underneath the white overlay.
  */

  ctx.fillStyle =
    `rgba(255, 255, 255, ${opacity})`;

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
    "rgba(18,18,18,0.96)"
  );
}


/* =========================================================
   MAIN DRAW
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
     ALWAYS START WITH THE PHOTOGRAPH
  */

  drawCoverImage(source);


  /*
     USER CONTROL

     0% transparency =
     strongest overlay

     70% transparency =
     very subtle overlay
  */

  const transparency =
    Number(overlayInput.value) / 100;


  /*
     Convert transparency into
     overlay opacity.

     Default:

     30% transparent
     = 70% overlay opacity
  */

  const overlayOpacity =
    1 - transparency;


  /*
     3 SECOND LOOP
  */

  const duration = 3.0;

  const time =
    ((t % duration) + duration) % duration;


  /*
     ---------------------------------
     PHASE 1
     DARK STATE
     ---------------------------------
  */

  const transitionStart = 1.20;


  if (time < transitionStart) {

    drawDarkState(
      0.72 * overlayOpacity
    );

    return;
  }


  /*
     ---------------------------------
     PHASE 2
     UPWARD LIGHT SHOT
     ---------------------------------
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
     Strong acceleration at the beginning,
     then smooth finish.
  */

  const eased =
    1 -
    Math.pow(
      1 - progress,
      3
    );


  /*
     ---------------------------------
     DARK BASE
     ---------------------------------
  */

  ctx.fillStyle =
    `rgba(0,0,0,${0.72 * overlayOpacity})`;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /*
     ---------------------------------
     UPWARD LIGHT POSITION
     ---------------------------------

     Starts below the canvas.

     Ends above the canvas.

     Therefore the light literally
     shoots upward through the banner.
  */

  const startY = H + 35;
  const endY = -35;

  const lightY =
    startY +
    (endY - startY) * eased;


  /*
     ---------------------------------
     LIGHT SPREAD
     ---------------------------------

     It begins narrow and becomes
     much wider as it travels upward.
  */

  const startWidth = 30;
  const endWidth = 310;

  const lightWidth =
    startWidth +
    (endWidth - startWidth) * eased;


  /*
     ---------------------------------
     LIGHT CENTER
     ---------------------------------

     Slightly left of center so the
     light can reveal the composition
     without simply sweeping sideways.
  */

  const centerX = 270;


  /*
     ---------------------------------
     SOFT LIGHT CORE
     ---------------------------------
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


  lightGradient.addColorStop(
    0,
    `rgba(
      255,
      255,
      255,
      ${0.82 * overlayOpacity}
    )`
  );


  lightGradient.addColorStop(
    0.25,
    `rgba(
      255,
      255,
      255,
      ${0.68 * overlayOpacity}
    )`
  );


  lightGradient.addColorStop(
    0.55,
    `rgba(
      255,
      255,
      255,
      ${0.38 * overlayOpacity}
    )`
  );


  lightGradient.addColorStop(
    0.78,
    `rgba(
      255,
      255,
      255,
      ${0.15 * overlayOpacity}
    )`
  );


  lightGradient.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );


  /*
     Draw the expanding light.
  */

  ctx.fillStyle =
    lightGradient;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /*
     ---------------------------------
     VERTICAL WHITE REVEAL
     ---------------------------------

     This creates the broad white
     field following behind the
     upward shot.
  */

  const revealTop =
    lightY - lightWidth * 0.45;


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
      ${0.18 * eased * overlayOpacity}
    )`
  );


  revealGradient.addColorStop(
    0.30,
    `rgba(
      255,
      255,
      255,
      ${0.34 * eased * overlayOpacity}
    )`
  );


  revealGradient.addColorStop(
    0.55,
    `rgba(
      255,
      255,
      255,
      ${0.55 * eased * overlayOpacity}
    )`
  );


  revealGradient.addColorStop(
    1,
    `rgba(
      255,
      255,
      255,
      ${0.70 * eased * overlayOpacity}
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
     ---------------------------------
     TEXT TRANSITION
     ---------------------------------

     White text gradually becomes
     black as the white state appears.
  */

  const textR =
    Math.round(
      255 -
      237 * eased
    );

  const textG =
    Math.round(
      255 -
      237 * eased
    );

  const textB =
    Math.round(
      255 -
      237 * eased
    );


  drawText(
    `rgba(
      ${textR},
      ${textG},
      ${textB},
      0.96
    )`
  );


  /*
     ---------------------------------
     FINAL LIGHT STATE
     ---------------------------------
  */

  if (progress >= 1) {

    drawLightState(
      0.70 * overlayOpacity
    );

  }
}


/* =========================================================
   ANIMATION LOOP
========================================================= */

function animationLoop(now) {

  const elapsed =
    (now - animationStart) / 1000;

  draw(elapsed);

  requestAnimationFrame(
    animationLoop
  );
}


requestAnimationFrame(
  animationLoop
);


/* =========================================================
   PNG
========================================================= */

document
  .getElementById("pngBtn")
  .addEventListener("click", () => {

    /*
       Capture the current frame.
    */

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
   GIF
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
       Speed slider:

       Lower value = shorter frame delay
       Higher value = longer frame delay
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
       45 frames across 3 seconds.

       This gives the upward light shot
       enough frames to look smooth.
    */

    const totalFrames = 45;


    for (
      let frame = 0;
      frame < totalFrames;
      frame++
    ) {

      const frameTime =
        (frame / totalFrames) * 3;


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
       GIF progress
    */

    gif.on(
      "progress",
      progress => {

        statusEl.textContent =
          `Generating GIF… ${Math.round(progress * 100)}%`;

      }
    );


    /*
       GIF complete
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


        setTimeout(() => {

          URL.revokeObjectURL(
            objectURL
          );

        }, 10000);


        statusEl.textContent =
          "GIF ready.";

      }
    );


    gif.on(
      "abort",
      () => {

        statusEl.textContent =
          "GIF generation cancelled.";

      }
    );


    gif.render();

  });

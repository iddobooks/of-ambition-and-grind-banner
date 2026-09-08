const W = 600;
const H = 200;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const imageInput = document.getElementById("imageInput");

const titleInput = document.getElementById("titleInput");
const subInput = document.getElementById("subInput");
const ctaInput = document.getElementById("ctaInput");
const urlInput = document.getElementById("urlInput");

const openingColorInput =
  document.getElementById("openingColorInput");

const revealColorInput =
  document.getElementById("revealColorInput");

const photoInput =
  document.getElementById("photoInput");

const softnessInput =
  document.getElementById("softnessInput");

const spreadInput =
  document.getElementById("spreadInput");

const speedInput =
  document.getElementById("speedInput");

const photoValue =
  document.getElementById("photoValue");

const softnessValue =
  document.getElementById("softnessValue");

const spreadValue =
  document.getElementById("spreadValue");

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


/* -------------------------------------------------------
   BASIC HELPERS
------------------------------------------------------- */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function easeInOut(value) {
  value = clamp(value, 0, 1);
  return value * value * (3 - 2 * value);
}


function easeOut(value) {
  value = clamp(value, 0, 1);
  return 1 - Math.pow(1 - value, 3);
}


function hexToRgb(hex) {

  const clean = hex.replace("#", "");

  const number = parseInt(clean, 16);

  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255
  };
}


function rgba(hex, alpha) {

  const c = hexToRgb(hex);

  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}


/* -------------------------------------------------------
   SETTINGS
------------------------------------------------------- */

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

    photoVisibility:
      Number(photoInput.value) / 100,

    softness:
      Number(softnessInput.value) / 100,

    spread:
      Number(spreadInput.value) / 100,

    speed:
      Number(speedInput.value) / 100

  };
}


function updateOutputs() {

  photoValue.textContent =
    `${photoInput.value}%`;

  softnessValue.textContent =
    `${softnessInput.value}%`;

  spreadValue.textContent =
    `${spreadInput.value}%`;

  speedValue.textContent =
    `${speedInput.value}%`;
}


/* -------------------------------------------------------
   IMAGE
------------------------------------------------------- */

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

  const dw =
    image.width * scale;

  const dh =
    image.height * scale;

  const dx =
    (W - dw) / 2;

  const dy =
    (H - dh) / 2;

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


/* -------------------------------------------------------
   MAIN REVEAL

   IMPORTANT:

   This is NOT a collection of rays.

   It is one continuous expanding light shape whose
   origin is below the centre of the banner.

   The boundary is broad and controlled, producing a
   professional motion-graphics wipe rather than a
   "starburst" effect.
------------------------------------------------------- */

function drawReveal(progress, settings) {

  if (progress <= 0) {
    return;
  }

  const p =
    easeInOut(progress);


  const originX = W * 0.5;
  const originY = H + 18;


  /*
     Width of the expanding reveal.

     At the beginning it is narrow.

     As it grows, it reaches the entire banner.
  */

  const maxWidth =
    W * (0.75 + settings.spread * 1.25);


  const currentWidth =
    maxWidth *
    Math.pow(p, 0.72);


  /*
     Height of the reveal.
  */

  const currentHeight =
    (H + 80) *
    Math.pow(p, 0.70);


  const left =
    originX - currentWidth / 2;

  const right =
    originX + currentWidth / 2;

  const top =
    originY - currentHeight;


  /*
     The reveal has a slightly asymmetric editorial
     shape instead of looking like a perfect triangle.
  */

  const curve =
    0.10 + settings.softness * 0.25;


  ctx.save();


  /*
     Soft outer light.
     This is intentionally subtle.
  */

  const outerAlpha =
    (0.08 + p * 0.22) *
    (1 - settings.photoVisibility * 0.55);


  ctx.fillStyle =
    rgba(
      settings.revealColor,
      outerAlpha
    );


  ctx.beginPath();

  ctx.moveTo(
    originX,
    originY
  );

  ctx.bezierCurveTo(
    left - currentWidth * curve,
    originY - currentHeight * 0.38,

    left,
    top + currentHeight * 0.20,

    left,
    top
  );

  ctx.lineTo(
    right,
    top
  );

  ctx.bezierCurveTo(
    right,
    top + currentHeight * 0.20,

    right + currentWidth * curve,
    originY - currentHeight * 0.38,

    originX,
    originY
  );

  ctx.closePath();

  ctx.fill();


  /*
     Main reveal.

     This is a single continuous shape.
  */

  const mainAlpha =
    (0.32 + p * 0.62) *
    (1 - settings.photoVisibility * 0.60);


  ctx.fillStyle =
    rgba(
      settings.revealColor,
      mainAlpha
    );


  ctx.beginPath();

  ctx.moveTo(
    originX,
    originY
  );

  ctx.bezierCurveTo(
    left,
    originY - currentHeight * 0.28,

    left,
    top + currentHeight * 0.16,

    left,
    top
  );

  ctx.lineTo(
    right,
    top
  );

  ctx.bezierCurveTo(
    right,
    top + currentHeight * 0.16,

    right,
    originY - currentHeight * 0.28,

    originX,
    originY
  );

  ctx.closePath();

  ctx.fill();


  /*
     A very soft centre highlight.

     This prevents the reveal from looking like a basic
     CSS triangle while keeping the edge clean.
  */

  if (settings.softness > 0) {

    const gradient =
      ctx.createRadialGradient(
        originX,
        originY,
        0,
        originX,
        originY,
        currentHeight
      );

    gradient.addColorStop(
      0,
      rgba(
        settings.revealColor,
        0.24 * settings.softness
      )
    );

    gradient.addColorStop(
      0.55,
      rgba(
        settings.revealColor,
        0.08 * settings.softness
      )
    );

    gradient.addColorStop(
      1,
      rgba(
        settings.revealColor,
        0
      )
    );

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.moveTo(
      originX,
      originY
    );

    ctx.ellipse(
      originX,
      originY - currentHeight * 0.45,
      currentWidth * 0.38,
      currentHeight * 0.65,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }


  ctx.restore();
}


/* -------------------------------------------------------
   FINAL WHITE STATE
------------------------------------------------------- */

function drawFinalOverlay(settings) {

  const finalOpacity =
    1 - settings.photoVisibility;


  ctx.fillStyle =
    rgba(
      settings.revealColor,
      finalOpacity
    );


  ctx.fillRect(
    0,
    0,
    W,
    H
  );
}


/* -------------------------------------------------------
   TEXT
------------------------------------------------------- */

function drawText(progress, settings) {

  const p =
    clamp(progress, 0, 1);


  /*
     The text is cross-faded.

     Opening:
       white

     Ending:
       black
  */

  const whiteAlpha =
    1 - p;

  const blackAlpha =
    p;


  const titleY = 64;
  const subY = 92;
  const ctaY = 124;


  ctx.save();

  ctx.textBaseline = "middle";


  /*
     WHITE VERSION
  */

  ctx.fillStyle =
    rgba(
      "#ffffff",
      whiteAlpha
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
     BLACK VERSION
  */

  ctx.fillStyle =
    rgba(
      "#111111",
      blackAlpha
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


/* -------------------------------------------------------
   FRAME RENDER
------------------------------------------------------- */

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
     1. ORIGINAL PHOTOGRAPH
  */

  drawCoverImage(
    backgroundImage,
    1
  );


  /*
     2. DARK OPENING OVERLAY

     Photo visibility is independent from the colour.
  */

  const openingOpacity =
    1 - settings.photoVisibility;


  if (progress < 1) {

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


  /*
     3. CONTINUOUS BOTTOM-CENTRE REVEAL
  */

  drawReveal(
    progress,
    settings
  );


  /*
     4. FINAL LIGHT STATE
  */

  if (progress >= 1) {

    drawFinalOverlay(
      settings
    );
  }


  /*
     5. TEXT
  */

  drawText(
    progress,
    settings
  );
}


/* -------------------------------------------------------
   PREVIEW TIMELINE
------------------------------------------------------- */

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
     Dark opening hold.
  */

  if (t < 0.30) {
    return 0;
  }


  /*
     Main reveal.

     No vertical climbing field.
     The geometry itself expands from below.
  */

  if (t < 0.70) {

    const q =
      (t - 0.30) / 0.40;

    return easeInOut(q);
  }


  /*
     Final state hold.
  */

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


  renderFrame(
    progress
  );


  requestAnimationFrame(
    animatePreview
  );
}


function restartPreview() {

  previewStart =
    performance.now();
}


/* -------------------------------------------------------
   IMAGE UPLOAD
------------------------------------------------------- */

imageInput.addEventListener(
  "change",
  () => {

    const file =
      imageInput.files &&
      imageInput.files[0];


    if (!file) {
      return;
    }


    const objectURL =
      URL.createObjectURL(file);


    const img =
      new Image();


    img.onload = () => {

      backgroundImage =
        img;


      URL.revokeObjectURL(
        objectURL
      );


      status.textContent =
        "Background image loaded.";


      restartPreview();
    };


    img.onerror = () => {

      URL.revokeObjectURL(
        objectURL
      );


      status.textContent =
        "Could not load that image.";
    };


    img.src =
      objectURL;
  }
);


/* -------------------------------------------------------
   LIVE CONTROLS
------------------------------------------------------- */

[
  titleInput,
  subInput,
  ctaInput,
  urlInput,
  openingColorInput,
  revealColorInput,
  photoInput,
  softnessInput,
  spreadInput,
  speedInput

].forEach(
  element => {

    element.addEventListener(
      "input",
      () => {

        updateOutputs();

        restartPreview();
      }
    );
  }
);


/* -------------------------------------------------------
   PNG
------------------------------------------------------- */

pngBtn.addEventListener(
  "click",
  () => {

    renderFrame(
      1
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


    status.textContent =
      "PNG created.";


    restartPreview();
  }
);


/* -------------------------------------------------------
   GIF
------------------------------------------------------- */

gifBtn.addEventListener(
  "click",
  () => {

    if (!window.GIF) {

      status.textContent =
        "GIF library did not load. Check your internet connection.";

      return;
    }


    gifBtn.disabled = true;
    pngBtn.disabled = true;


    status.textContent =
      "Generating GIF…";


    const settings =
      getSettings();


    const frameCount =
      60;


    const delay =
      55;


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
         30% opening hold
         40% reveal
         30% final hold
      */

      if (t < 0.30) {

        progress = 0;

      } else if (t < 0.70) {

        const q =
          (t - 0.30) /
          0.40;

        progress =
          easeInOut(q);

      } else {

        progress = 1;
      }


      renderFrame(
        progress
      );


      gif.addFrame(
        ctx,
        {
          copy: true,
          delay: delay
        }
      );
    }


    gif.on(
      "progress",
      progress => {

        status.textContent =
          `Generating GIF… ${Math.round(progress * 100)}%`;
      }
    );


    gif.on(
      "finished",
      blob => {

        const link =
          document.createElement("a");


        link.download =
          "of-ambition-and-grind-banner.gif";


        link.href =
          URL.createObjectURL(
            blob
          );


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
      }
    );


    try {

      gif.render();

    } catch (error) {

      console.error(error);


      status.textContent =
        "GIF generation failed. Check the browser console.";


      gifBtn.disabled = false;
      pngBtn.disabled = false;


      restartPreview();
    }
  }
);


/* -------------------------------------------------------
   DEFAULT ORIGINAL IMAGE
------------------------------------------------------- */

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
  "assets/book-background.png";


/* -------------------------------------------------------
   START
------------------------------------------------------- */

updateOutputs();

requestAnimationFrame(
  animatePreview
);

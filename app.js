"use strict";


/* =========================================================
   CANVAS
========================================================= */

const canvas =
  document.getElementById("previewCanvas");

const ctx =
  canvas.getContext("2d");


const W = 600;
const H = 200;

canvas.width = W;
canvas.height = H;


/* =========================================================
   BACKGROUND IMAGE
========================================================= */

const bgImage =
  new Image();

bgImage.decoding =
  "async";

bgImage.src =
  "assets/book-background.png";


const imageError =
  document.getElementById(
    "imageError"
  );


let imageReady = false;


/* =========================================================
   SETTINGS
========================================================= */

const settings = {

  title:
    "OF AMBITION AND GRIND",

  supporting:
    "A practical guide to turning ambition into action.",

  cta:
    "READ THE BOOK",

  url:
    "",

  openingColor:
    "#000000",

  revealColor:
    "#ffffff",

  photoVisibility:
    28,

  revealSoftness:
    42,

  revealWidth:
    82,

  speed:
    80

};


/* =========================================================
   IMAGE LOADING
========================================================= */

bgImage.onload =
  function () {

    imageReady = true;

    if (imageError) {
      imageError.hidden = true;
    }

    restartAnimation();

  };


bgImage.onerror =
  function () {

    imageReady = false;

    if (imageError) {
      imageError.hidden = false;
    }

    /*
     * Still draw the animation background
     * so the canvas itself remains alive.
     */
    restartAnimation();

  };


/* =========================================================
   HELPERS
========================================================= */

function clamp(
  value,
  min,
  max
) {

  return Math.max(
    min,
    Math.min(max, value)
  );

}


function easeInOut(
  t
) {

  t = clamp(
    t,
    0,
    1
  );

  if (t < 0.5) {

    return (
      4 *
      t *
      t *
      t
    );

  }

  return (
    1 -
    Math.pow(
      -2 * t + 2,
      3
    ) /
    2
  );

}


function hexToRgba(
  hex,
  alpha
) {

  let value =
    String(hex)
      .replace("#", "");

  if (value.length === 3) {

    value =
      value
        .split("")
        .map(
          character =>
            character +
            character
        )
        .join("");

  }

  const r =
    parseInt(
      value.substring(0, 2),
      16
    );

  const g =
    parseInt(
      value.substring(2, 4),
      16
    );

  const b =
    parseInt(
      value.substring(4, 6),
      16
    );

  return (
    `rgba(${r},${g},${b},${alpha})`
  );

}


/* =========================================================
   BACKGROUND
========================================================= */

function drawBackground() {

  /*
   * If the image has loaded,
   * draw the actual book photograph.
   */

  if (
    imageReady &&
    bgImage.naturalWidth > 0
  ) {

    const imageRatio =
      bgImage.naturalWidth /
      bgImage.naturalHeight;

    const canvasRatio =
      W / H;

    let sx = 0;
    let sy = 0;
    let sw =
      bgImage.naturalWidth;
    let sh =
      bgImage.naturalHeight;


    /*
     * Cover the entire banner.
     */

    if (
      imageRatio >
      canvasRatio
    ) {

      sw =
        bgImage.naturalHeight *
        canvasRatio;

      sx =
        (
          bgImage.naturalWidth -
          sw
        ) /
        2;

    } else {

      sh =
        bgImage.naturalWidth /
        canvasRatio;

      sy =
        (
          bgImage.naturalHeight -
          sh
        ) /
        2;

    }


    ctx.drawImage(
      bgImage,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      W,
      H
    );

  } else {

    /*
     * Temporary fallback while image loads.
     */
    ctx.fillStyle =
      "#111111";

    ctx.fillRect(
      0,
      0,
      W,
      H
    );

  }

}


/* =========================================================
   OPENING DARK OVERLAY
========================================================= */

function drawOpeningOverlay() {

  const visibility =
    settings.photoVisibility /
    100;


  /*
   * Higher photo visibility =
   * lower black opacity.
   */

  const opacity =
    0.82 -
    visibility * 0.55;


  ctx.save();

  ctx.globalAlpha =
    clamp(
      opacity,
      0.15,
      0.82
    );

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


/* =========================================================
   THE OVERLAY SHAPE
=========================================================

   THIS is the only part being vertically flipped.

   The animation direction remains the same.

   We construct the shape normally, then mirror its
   geometry around its own horizontal centre.

   We DO NOT flip the canvas.

========================================================= */

function drawRevealShape(
  progress
) {

  const p =
    clamp(
      progress,
      0,
      1
    );


  if (p <= 0) {
    return;
  }


  /*
   * Animation geometry.
   *
   * This remains anchored at the bottom,
   * exactly as the animation was designed.
   */

  const centerX =
    W * 0.5;

  const bottom =
    H + 12;


  const width =
    W *
    (
      0.42 +
      (
        settings.revealWidth /
        100
      ) *
      1.05
    );


  const height =
    (
      H + 80
    ) *
    Math.pow(
      p,
      0.72
    );


  /*
   * Shape bounding box.
   */

  const left =
    centerX -
    width / 2;

  const right =
    centerX +
    width / 2;

  const top =
    bottom -
    height;


  /*
   * The ORIGINAL shape is defined in normalized
   * coordinates from 0 to 1.
   *
   * We then vertically mirror those coordinates.
   */

  function Y(
    normalized
  ) {

    /*
     * THIS IS THE VERTICAL FLIP.
     *
     * 0 becomes 1
     * 1 becomes 0
     */

    const flipped =
      1 -
      normalized;


    return (
      top +
      flipped *
      height
    );

  }


  function X(
    normalized
  ) {

    return (
      left +
      normalized *
      width
    );

  }


  ctx.save();


  ctx.beginPath();


  /*
   * TOP / CENTRE OF THE SHAPE
   *
   * Because Y() is vertically flipped,
   * this point is now in the opposite orientation.
   */

  ctx.moveTo(
    X(0.50),
    Y(0.00)
  );


  /*
   * LEFT SIDE OF THE CURVED SHAPE
   */

  ctx.bezierCurveTo(

    X(0.39),
    Y(0.015),

    X(0.24),
    Y(0.08),

    X(0.14),
    Y(0.20)

  );


  ctx.bezierCurveTo(

    X(0.055),
    Y(0.32),

    X(0.025),
    Y(0.47),

    X(0.00),
    Y(0.63)

  );


  /*
   * LOWER LEFT CURVE
   */

  ctx.bezierCurveTo(

    X(0.07),
    Y(0.79),

    X(0.22),
    Y(0.91),

    X(0.39),
    Y(0.97)

  );


  /*
   * NARROW LOWER CENTRE
   */

  ctx.bezierCurveTo(

    X(0.45),
    Y(0.99),

    X(0.48),
    Y(1.00),

    X(0.50),
    Y(1.00)

  );


  /*
   * NARROW LOWER CENTRE → RIGHT
   */

  ctx.bezierCurveTo(

    X(0.52),
    Y(1.00),

    X(0.55),
    Y(0.99),

    X(0.61),
    Y(0.97)

  );


  /*
   * LOWER RIGHT CURVE
   */

  ctx.bezierCurveTo(

    X(0.78),
    Y(0.91),

    X(0.93),
    Y(0.79),

    X(1.00),
    Y(0.63)

  );


  /*
   * RIGHT SIDE
   */

  ctx.bezierCurveTo(

    X(0.975),
    Y(0.47),

    X(0.945),
    Y(0.32),

    X(0.86),
    Y(0.20)

  );


  ctx.bezierCurveTo(

    X(0.76),
    Y(0.08),

    X(0.61),
    Y(0.015),

    X(0.50),
    Y(0.00)

  );


  ctx.closePath();


  /*
   * Soft edge.
   */

  const softness =
    settings.revealSoftness /
    100;


  if (softness > 0) {

    ctx.shadowColor =
      hexToRgba(
        settings.revealColor,
        0.22
      );

    ctx.shadowBlur =
      5 +
      softness * 20;

  }


  ctx.fillStyle =
    settings.revealColor;

  ctx.fill();


  ctx.restore();

}


/* =========================================================
   FINAL WHITE STATE
========================================================= */

function drawFinalState() {

  ctx.save();

  ctx.fillStyle =
    settings.revealColor;

  ctx.globalAlpha =
    0.96;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.restore();

}


/* =========================================================
   TEXT
========================================================= */

function drawText(
  revealProgress
) {

  const p =
    clamp(
      revealProgress,
      0,
      1
    );


  /*
   * Text changes from white to black
   * during the reveal.
   */

  const transition =
    clamp(
      (
        p - 0.35
      ) /
      0.65,
      0,
      1
    );


  const whiteAlpha =
    1 -
    transition;

  const blackAlpha =
    transition;


  ctx.save();


  ctx.textAlign =
    "left";

  ctx.textBaseline =
    "middle";


  /*
   * TITLE
   */

  ctx.font =
    "700 27px Arial, Helvetica, sans-serif";


  ctx.fillStyle =
    `rgba(255,255,255,${whiteAlpha})`;


  ctx.fillText(
    settings.title,
    30,
    62
  );


  ctx.fillStyle =
    `rgba(0,0,0,${blackAlpha})`;


  ctx.fillText(
    settings.title,
    30,
    62
  );


  /*
   * SUPPORTING TEXT
   */

  ctx.font =
    "400 13px Arial, Helvetica, sans-serif";


  ctx.fillStyle =
    `rgba(255,255,255,${whiteAlpha})`;


  ctx.fillText(
    settings.supporting,
    30,
    88
  );


  ctx.fillStyle =
    `rgba(0,0,0,${blackAlpha})`;


  ctx.fillText(
    settings.supporting,
    30,
    88
  );


  /*
   * CTA
   */

  ctx.font =
    "700 12px Arial, Helvetica, sans-serif";


  ctx.fillStyle =
    `rgba(255,255,255,${whiteAlpha})`;


  ctx.fillText(
    settings.cta,
    30,
    122
  );


  ctx.fillStyle =
    `rgba(0,0,0,${blackAlpha})`;


  ctx.fillText(
    settings.cta,
    30,
    122
  );


  ctx.restore();

}


/* =========================================================
   COMPLETE FRAME
========================================================= */

function render(
  timeline
) {

  /*
   * ALWAYS clear the canvas first.
   */

  ctx.clearRect(
    0,
    0,
    W,
    H
  );


  /*
   * 1. PHOTO
   */

  drawBackground();


  /*
   * 2. OPENING
   */

  if (
    timeline <
    0.30
  ) {

    drawOpeningOverlay();

    drawText(0);

    return;

  }


  /*
   * 3. REVEAL
   */

  if (
    timeline <
    0.70
  ) {

    drawOpeningOverlay();


    const revealProgress =
      (
        timeline -
        0.30
      ) /
      0.40;


    const eased =
      easeInOut(
        revealProgress
      );


    drawRevealShape(
      eased
    );


    drawText(
      revealProgress
    );


    return;

  }


  /*
   * 4. FINAL
   */

  drawFinalState();

  drawText(1);

}


/* =========================================================
   ANIMATION
========================================================= */

let animationStart =
  performance.now();


function restartAnimation() {

  animationStart =
    performance.now();

}


function animationLoop(
  now
) {

  const elapsed =
    now -
    animationStart;


  /*
   * 4200 ms at 80%.
   */

  const speedFactor =
    settings.speed /
    80;


  const duration =
    4200 /
    speedFactor;


  const timeline =
    (
      elapsed %
      duration
    ) /
    duration;


  render(
    timeline
  );


  requestAnimationFrame(
    animationLoop
  );

}


/*
 * Start the animation immediately.
 */

requestAnimationFrame(
  animationLoop
);


/* =========================================================
   INPUT BINDINGS
========================================================= */

function bindText(
  id,
  property
) {

  const element =
    document.getElementById(id);


  if (!element) {
    return;
  }


  element.addEventListener(
    "input",
    function () {

      settings[property] =
        element.value;

    }
  );

}


function bindSlider(
  id,
  property
) {

  const element =
    document.getElementById(id);


  if (!element) {
    return;
  }


  const output =
    document.getElementById(
      id + "Value"
    );


  element.addEventListener(
    "input",
    function () {

      settings[property] =
        Number(
          element.value
        );


      if (output) {

        output.textContent =
          element.value;

      }

    }
  );

}


bindText(
  "bookTitle",
  "title"
);

bindText(
  "supportingText",
  "supporting"
);

bindText(
  "ctaText",
  "cta"
);

bindText(
  "purchaseUrl",
  "url"
);

bindText(
  "openingColor",
  "openingColor"
);

bindText(
  "revealColor",
  "revealColor"
);

bindSlider(
  "photoVisibility",
  "photoVisibility"
);

bindSlider(
  "revealSoftness",
  "revealSoftness"
);

bindSlider(
  "revealWidth",
  "revealWidth"
);

bindSlider(
  "animationSpeed",
  "speed"
);


/* =========================================================
   RESTART BUTTON
========================================================= */

const resetButton =
  document.getElementById(
    "resetPreview"
  );


if (resetButton) {

  resetButton.addEventListener(
    "click",
    function () {

      restartAnimation();

    }
  );

}


/* =========================================================
   GIF EXPORT
========================================================= */

const generateButton =
  document.getElementById(
    "generateGif"
  );


async function generateGif() {

  if (
    typeof GIF ===
    "undefined"
  ) {

    alert(
      "The GIF generator could not be loaded. The preview itself should still work."
    );

    return;

  }


  if (!imageReady) {

    alert(
      "The banner image has not loaded yet. Check assets/book-background.png."
    );

    return;

  }


  generateButton.disabled =
    true;

  generateButton.textContent =
    "Generating...";


  try {

    const gif =
      new GIF({

        workers: 2,

        quality: 10,

        width: W,

        height: H,

        workerScript:
          "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js"

      });


    const frameCount =
      60;


    const frameDelay =
      70;


    /*
     * Generate the same animation
     * shown in the preview.
     */

    for (
      let i = 0;
      i < frameCount;
      i++
    ) {

      const timeline =
        i /
        (
          frameCount -
          1
        );


      render(
        timeline
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
      "finished",
      function (blob) {

        const downloadUrl =
          URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


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
          1000
        );


        generateButton.disabled =
          false;

        generateButton.textContent =
          "Generate GIF";

      }
    );


    gif.on(
      "abort",
      function () {

        generateButton.disabled =
          false;

        generateButton.textContent =
          "Generate GIF";

      }
    );


    gif.render();


  } catch (error) {

    console.error(
      "GIF generation failed:",
      error
    );


    alert(
      "GIF generation failed. The preview is still working."
    );


    generateButton.disabled =
      false;

    generateButton.textContent =
      "Generate GIF";

  }

}


if (generateButton) {

  generateButton.addEventListener(
    "click",
    generateGif
  );

}


/* =========================================================
   INITIAL FRAME
========================================================= */

/*
 * Draw immediately.
 * This guarantees that the canvas is never blank while
 * the image is loading.
 */

render(0);

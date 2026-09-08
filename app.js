const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");

const W = 600;
const H = 200;

canvas.width = W;
canvas.height = H;

const bgImage = new Image();
bgImage.src = "assets/book-background.png";

const settings = {
  title: "OF AMBITION AND GRIND",
  supporting: "A practical guide to turning ambition into action.",
  cta: "READ THE BOOK",
  url: "",
  openingColor: "#000000",
  revealColor: "#ffffff",
  photoVisibility: 28,
  revealSoftness: 42,
  revealWidth: 82,
  speed: 80
};

let imageReady = false;
let animationStart = performance.now();

bgImage.onload = () => {
  imageReady = true;
  renderPreview(0);
};

bgImage.onerror = () => {
  console.error(
    "Could not load assets/book-background.png"
  );
};


/* =====================================================
   HELPERS
===================================================== */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeInOut(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");

  let r;
  let g;
  let b;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  }

  return `rgba(${r},${g},${b},${alpha})`;
}


/* =====================================================
   BACKGROUND
===================================================== */

function drawCoverImage() {
  if (!imageReady) return;

  const imageRatio =
    bgImage.width / bgImage.height;

  const canvasRatio =
    W / H;

  let sx = 0;
  let sy = 0;
  let sw = bgImage.width;
  let sh = bgImage.height;

  if (imageRatio > canvasRatio) {
    sw =
      bgImage.height * canvasRatio;

    sx =
      (bgImage.width - sw) / 2;
  } else {
    sh =
      bgImage.width / canvasRatio;

    sy =
      (bgImage.height - sh) / 2;
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
}


/* =====================================================
   OPENING OVERLAY
===================================================== */

function drawOpeningOverlay() {
  ctx.save();

  ctx.fillStyle =
    settings.openingColor;

  const alpha =
    0.72 -
    (settings.photoVisibility / 100) * 0.52;

  ctx.globalAlpha =
    clamp(alpha, 0.15, 0.80);

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.restore();
}


/* =====================================================
   REVEAL SHAPE
=====================================================

   IMPORTANT:

   The animation direction remains unchanged.

   We are NOT flipping the canvas.

   We are NOT moving the animation from bottom to top.

   We are flipping ONLY the geometry of the shape
   vertically inside its own bounding box.

===================================================== */

function drawReveal(progress) {

  const p =
    clamp(progress, 0, 1);

  const revealColor =
    settings.revealColor;

  const spread =
    0.35 +
    (settings.revealWidth / 100) * 0.9;

  const softness =
    settings.revealSoftness / 100;

  /*
   * Original animation position.
   */
  const originX =
    W * 0.5;

  const originY =
    H + 18;

  const maxWidth =
    W * spread;

  const maxHeight =
    H + 80;

  /*
   * Animation growth remains exactly the same.
   */
  const currentWidth =
    maxWidth *
    Math.pow(p, 0.72);

  const currentHeight =
    maxHeight *
    Math.pow(p, 0.70);

  const left =
    originX -
    currentWidth / 2;

  const right =
    originX +
    currentWidth / 2;

  const top =
    originY -
    currentHeight;


  /*
   * -------------------------------------------------
   * VERTICAL FLIP OF THE SHAPE ONLY
   * -------------------------------------------------
   *
   * Every Y coordinate is mirrored around the
   * horizontal centre of the shape's own bounding box.
   *
   * This is:
   *
   *     flippedY = top + originY - originalY
   *
   * NOT:
   *
   *     flippedY = H - originalY
   *
   * because the latter flips against the entire canvas
   * and pushes the shape out of view.
   */

  function flipY(y) {
    return (
      top +
      originY -
      y
    );
  }


  ctx.save();

  ctx.beginPath();


  /*
   * ORIGINAL LOWER CENTRE
   * becomes the vertically flipped upper centre.
   */
  ctx.moveTo(
    originX,
    flipY(originY)
  );


  /*
   * LEFT LOWER CURVE
   */
  ctx.bezierCurveTo(

    originX -
      currentWidth * 0.10,

    flipY(
      originY -
      currentHeight * 0.10
    ),

    left +
      currentWidth * 0.02,

    flipY(
      originY -
      currentHeight * 0.34
    ),

    left +
      currentWidth * 0.16,

    flipY(
      originY -
      currentHeight * 0.56
    )
  );


  /*
   * BROAD CURVED SECTION
   */
  ctx.bezierCurveTo(

    left +
      currentWidth * 0.30,

    flipY(
      originY -
      currentHeight * 0.78
    ),

    left +
      currentWidth * 0.50,

    flipY(
      top +
      currentHeight * 0.04
    ),

    originX,

    flipY(top)
  );


  /*
   * RIGHT SIDE
   */
  ctx.bezierCurveTo(

    right -
      currentWidth * 0.50,

    flipY(
      top +
      currentHeight * 0.04
    ),

    right -
      currentWidth * 0.30,

    flipY(
      originY -
      currentHeight * 0.78
    ),

    right -
      currentWidth * 0.16,

    flipY(
      originY -
      currentHeight * 0.56
    )
  );


  ctx.bezierCurveTo(

    right -
      currentWidth * 0.02,

    flipY(
      originY -
      currentHeight * 0.34
    ),

    originX +
      currentWidth * 0.10,

    flipY(
      originY -
      currentHeight * 0.10
    ),

    originX,

    flipY(originY)
  );


  ctx.closePath();


  /*
   * Softness
   */
  if (softness > 0) {

    ctx.shadowColor =
      hexToRgba(
        revealColor,
        0.20
      );

    ctx.shadowBlur =
      8 +
      softness * 18;

    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }


  ctx.fillStyle =
    revealColor;

  ctx.fill();

  ctx.restore();
}


/* =====================================================
   FINAL WHITE STATE
===================================================== */

function drawFinalOverlay() {

  ctx.save();

  ctx.fillStyle =
    settings.revealColor;

  ctx.globalAlpha = 0.96;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.restore();
}


/* =====================================================
   TEXT
===================================================== */

function drawText(progress) {

  const p =
    clamp(progress, 0, 1);

  const textTransition =
    clamp(
      (p - 0.40) / 0.35,
      0,
      1
    );

  const whiteAlpha =
    1 - textTransition;

  const blackAlpha =
    textTransition;


  ctx.save();

  ctx.textBaseline =
    "middle";

  ctx.textAlign =
    "left";


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
    63
  );

  ctx.fillStyle =
    `rgba(0,0,0,${blackAlpha})`;

  ctx.fillText(
    settings.title,
    30,
    63
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
    125
  );

  ctx.fillStyle =
    `rgba(0,0,0,${blackAlpha})`;

  ctx.fillText(
    settings.cta,
    30,
    125
  );


  ctx.restore();
}


/* =====================================================
   PREVIEW TIMELINE
===================================================== */

function renderPreview(progress) {

  if (!imageReady) return;

  ctx.clearRect(
    0,
    0,
    W,
    H
  );

  /*
   * Background is never flipped.
   */
  drawCoverImage();


  /*
   * DARK OPENING
   */
  if (progress < 0.30) {

    drawOpeningOverlay();

    const openingProgress =
      progress / 0.30;

    drawText(
      openingProgress * 0.15
    );

  }


  /*
   * REVEAL
   */
  else if (progress < 0.70) {

    drawOpeningOverlay();

    const revealProgress =
      (progress - 0.30) / 0.40;

    drawReveal(
      easeInOut(
        revealProgress
      )
    );

    drawText(
      revealProgress
    );

  }


  /*
   * FINAL WHITE STATE
   */
  else {

    drawFinalOverlay();

    drawText(1);

  }
}


/* =====================================================
   ANIMATION LOOP
===================================================== */

function previewLoop(now) {

  const elapsed =
    now -
    animationStart;

  const speedFactor =
    settings.speed / 80;

  const duration =
    4200 /
    speedFactor;

  const progress =
    (elapsed % duration) /
    duration;

  renderPreview(
    progress
  );

  requestAnimationFrame(
    previewLoop
  );
}

requestAnimationFrame(
  previewLoop
);


/* =====================================================
   CONTROLS
===================================================== */

function bindInput(
  id,
  property
) {

  const element =
    document.getElementById(id);

  if (!element) return;

  element.addEventListener(
    "input",
    () => {

      settings[property] =
        element.value;

    }
  );
}


function bindValue(
  id,
  property
) {

  const element =
    document.getElementById(id);

  if (!element) return;

  element.addEventListener(
    "input",
    () => {

      settings[property] =
        Number(element.value);

      const output =
        document.getElementById(
          `${id}Value`
        );

      if (output) {

        output.textContent =
          element.value;

      }

    }
  );
}


bindInput(
  "bookTitle",
  "title"
);

bindInput(
  "supportingText",
  "supporting"
);

bindInput(
  "ctaText",
  "cta"
);

bindInput(
  "purchaseUrl",
  "url"
);

bindInput(
  "openingColor",
  "openingColor"
);

bindInput(
  "revealColor",
  "revealColor"
);


bindValue(
  "photoVisibility",
  "photoVisibility"
);

bindValue(
  "revealSoftness",
  "revealSoftness"
);

bindValue(
  "revealWidth",
  "revealWidth"
);

bindValue(
  "animationSpeed",
  "speed"
);


/* =====================================================
   GIF GENERATION
===================================================== */

async function generateGif() {

  if (
    typeof GIF ===
    "undefined"
  ) {

    alert(
      "GIF library has not loaded yet."
    );

    return;
  }


  const button =
    document.getElementById(
      "generateGif"
    );


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Generating...";

  }


  const gif =
    new GIF({

      workers: 2,

      quality: 10,

      width: W,

      height: H,

      workerScript:
        "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js"

    });


  const frameCount = 60;
  const frameDelay = 55;


  for (
    let i = 0;
    i < frameCount;
    i++
  ) {

    const progress =
      i /
      (frameCount - 1);

    renderPreview(
      progress
    );

    gif.addFrame(
      ctx,
      {
        copy: true,
        delay: frameDelay
      }
    );
  }


  gif.on(
    "finished",
    blob => {

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        "of-ambition-and-grind-banner.gif";

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
        1000
      );


      if (button) {

        button.disabled =
          false;

        button.textContent =
          "Generate GIF";

      }

    }
  );


  gif.render();
}


const gifButton =
  document.getElementById(
    "generateGif"
  );


if (gifButton) {

  gifButton.addEventListener(
    "click",
    generateGif
  );

}


/* =====================================================
   RESET
===================================================== */

const resetButton =
  document.getElementById(
    "resetPreview"
  );


if (resetButton) {

  resetButton.addEventListener(
    "click",
    () => {

      animationStart =
        performance.now();

    }
  );

}

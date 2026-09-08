const W = 600, H = 200;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const imageInput = document.getElementById("imageInput");
const titleInput = document.getElementById("titleInput");
const subInput = document.getElementById("subInput");
const ctaInput = document.getElementById("ctaInput");
const urlInput = document.getElementById("urlInput");
const overlayInput = document.getElementById("overlayInput");
const speedInput = document.getElementById("speedInput");
const statusEl = document.getElementById("status");

let source = new Image();
let sourceReady = false;
let start = performance.now();

source.onload = () => {
  sourceReady = true;
  draw(0);
};

source.src = "assets/book-background.png";


/* --------------------------------
   IMAGE UPLOAD
-------------------------------- */

imageInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    source = new Image();

    source.onload = () => {
      sourceReady = true;
      draw(0);
    };

    source.src = reader.result;
  };

  reader.readAsDataURL(file);
});


/* --------------------------------
   LIVE CONTROLS
-------------------------------- */

[
  titleInput,
  subInput,
  ctaInput,
  urlInput,
  overlayInput,
  speedInput
].forEach(el => {
  el.addEventListener("input", () => {
    draw((performance.now() - start) / 1000);
  });
});


/* --------------------------------
   IMAGE FIT
-------------------------------- */

function coverImage(img, w, h) {
  const scale = Math.max(
    w / img.width,
    h / img.height
  );

  const sw = img.width * scale;
  const sh = img.height * scale;

  ctx.drawImage(
    img,
    (w - sw) / 2,
    (h - sh) / 2,
    sw,
    sh
  );
}


/* --------------------------------
   TITLE SIZING
-------------------------------- */

function fitTitle(text, maxWidth) {

  let size = 35;

  while (size > 20) {

    ctx.font = `700 ${size}px Georgia, serif`;

    if (ctx.measureText(text).width <= maxWidth) {
      return size;
    }

    size--;
  }

  return size;
}


/* --------------------------------
   DRAW TEXT
-------------------------------- */

function drawText(color) {

  const title =
    titleInput.value.trim().toUpperCase();

  const sub =
    subInput.value.trim().toUpperCase();

  const cta =
    ctaInput.value.trim().toUpperCase();


  ctx.textBaseline = "middle";
  ctx.textAlign = "left";


  /* TITLE */

  const titleSize = fitTitle(title, 350);

  ctx.font =
    `700 ${titleSize}px Georgia, serif`;

  ctx.fillStyle = color;

  ctx.fillText(
    title,
    30,
    76
  );


  /* SUPPORTING TEXT */

  ctx.font =
    "600 10px Arial, sans-serif";

  ctx.fillStyle = color;

  ctx.fillText(
    sub,
    32,
    118
  );


  /* CTA */

  const ctaY = 158;

  ctx.font =
    "700 11px Arial, sans-serif";

  ctx.fillStyle = color;

  ctx.fillText(
    cta,
    32,
    ctaY
  );


  const ctaWidth =
    ctx.measureText(cta).width;


  ctx.font =
    "700 16px Arial, sans-serif";

  ctx.fillText(
    "→",
    42 + ctaWidth,
    ctaY
  );


  /* UNDERLINE */

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(32, 177);

  ctx.lineTo(
    32 + Math.min(190, ctaWidth + 45),
    177
  );

  ctx.stroke();
}


/* --------------------------------
   MAIN ANIMATION
--------------------------------

   0.00 → 1.50 seconds
   BLACK STATE
   White text

   1.50 → 2.35 seconds
   WHITE LIGHT SHOOTS
   FROM BOTTOM → TOP

   2.35 → 3.00 seconds
   WHITE STATE
   Black text

-------------------------------- */

function draw(t) {

  ctx.clearRect(0, 0, W, H);

  if (!sourceReady) return;


  /* -----------------------------
     BASE PHOTO
  ----------------------------- */

  coverImage(source, W, H);


  const strength =
    Number(overlayInput.value) / 100;


  /*
     THREE-SECOND LOOP
  */

  const duration = 3.0;

  const time =
    ((t % duration) + duration) % duration;


  /*
     TRANSITION STARTS AT 1.25s
  */

  const transitionStart = 1.25;
  const transitionDuration = 0.85;


  let progress = 0;

  if (time > transitionStart) {

    progress =
      Math.min(
        1,
        (time - transitionStart) /
        transitionDuration
      );

  }


  /* -----------------------------
     DARK OPENING STATE
  ----------------------------- */

  /*
     The first state is intentionally
     almost black.

     This gives us the reference-image
     effect:

     BLACK + WHITE TEXT
  */

  if (progress === 0) {

    ctx.fillStyle =
      `rgba(0,0,0,${0.82 * strength})`;

    ctx.fillRect(
      0,
      0,
      W,
      H
    );

    drawText(
      "rgba(255,255,255,.96)"
    );

    return;
  }


  /* -----------------------------
     UPWARD LIGHT TRANSITION
  ----------------------------- */

  /*
     Easing makes the light shoot upward
     rather than move linearly.
  */

  const eased =
    1 - Math.pow(1 - progress, 3);


  /*
     The white region starts at the
     BOTTOM.

     As it rises it becomes wider.
  */

  const bottom =
    H + 20;

  const top =
    bottom - eased * (H + 40);


  /*
     Width grows as the light rises.
  */

  const maxWidth = 230;

  const width =
    25 + eased * maxWidth;


  /*
     Center of the rising light.
  */

  const centerX =
    W * 0.50;


  /*
     Soft feathered light.

     This is deliberately NOT a
     left-to-right sweep.
  */

  const light =
    ctx.createRadialGradient(
      centerX,
      top,
      0,
      centerX,
      top,
      width
    );


  light.addColorStop(
    0,
    `rgba(255,255,255,${0.98 * eased})`
  );

  light.addColorStop(
    0.35,
    `rgba(255,255,255,${0.92 * eased})`
  );

  light.addColorStop(
    0.72,
    `rgba(255,255,255,${0.45 * eased})`
  );

  light.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );


  /*
     First create the black state.
  */

  ctx.fillStyle =
    `rgba(0,0,0,${0.82 * strength})`;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /*
     Rising light.
  */

  ctx.save();

  ctx.beginPath();

  ctx.rect(
    centerX - width,
    top - width,
    width * 2,
    H - top + width
  );

  ctx.clip();

  ctx.fillStyle = light;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.restore();


  /*
     Main white rising field.

     This is what creates the
     "black becomes white" effect.
  */

  const field =
    ctx.createLinearGradient(
      0,
      top - 30,
      0,
      H
    );


  field.addColorStop(
    0,
    "rgba(255,255,255,0)"
  );

  field.addColorStop(
    0.18,
    `rgba(255,255,255,${0.35 * eased})`
  );

  field.addColorStop(
    0.42,
    `rgba(255,255,255,${0.88 * eased})`
  );

  field.addColorStop(
    0.68,
    `rgba(255,255,255,${0.97 * eased})`
  );

  field.addColorStop(
    1,
    `rgba(255,255,255,${0.98 * eased})`
  );


  ctx.fillStyle = field;

  ctx.fillRect(
    0,
    0,
    W,
    H
  );


  /* -----------------------------
     TEXT TRANSFORMATION
  ----------------------------- */

  /*
     Text changes from WHITE → BLACK
     as the white field rises.
  */

  const textMix = eased;

  const r =
    Math.round(255 * (1 - textMix));

  const g =
    Math.round(255 * (1 - textMix));

  const b =
    Math.round(255 * (1 - textMix));


  const alpha =
    0.96;


  drawText(
    `rgba(${r},${g},${b},${alpha})`
  );


  /* -----------------------------
     FINAL WHITE STATE
  ----------------------------- */

  if (progress >= 1) {

    ctx.fillStyle =
      "rgba(255,255,255,.97)";

    ctx.fillRect(
      0,
      0,
      W,
      H
    );

    drawText(
      "rgba(20,20,20,.96)"
    );

  }
}


/* --------------------------------
   ANIMATION PREVIEW
-------------------------------- */

function animationLoop(now) {

  draw(
    (now - start) / 1000
  );

  requestAnimationFrame(
    animationLoop
  );
}

requestAnimationFrame(
  animationLoop
);


/* --------------------------------
   PNG DOWNLOAD
-------------------------------- */

document.getElementById("pngBtn").onclick =
  () => {

    /*
       PNG captures the current state.
    */

    draw(
      (performance.now() - start) / 1000
    );

    const a =
      document.createElement("a");

    a.download =
      "of-ambition-and-grind-banner.png";

    a.href =
      canvas.toDataURL("image/png");

    a.click();
  };


/* --------------------------------
   GIF GENERATION
-------------------------------- */

document.getElementById("gifBtn").onclick =
  async () => {

    if (!sourceReady) return;

    statusEl.textContent =
      "Generating animated GIF…";


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
       3-second animation.

       45 frames gives the upward
       transition a smoother appearance.
    */

    const frames = 45;

    const delay =
      Number(speedInput.value);


    for (
      let i = 0;
      i < frames;
      i++
    ) {

      const time =
        (i / frames) * 3.0;


      draw(time);


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
      p => {

        statusEl.textContent =
          `Generating animated GIF… ${Math.round(p * 100)}%`;

      }
    );


    gif.on(
      "finished",
      blob => {

        const a =
          document.createElement("a");

        a.download =
          "of-ambition-and-grind-banner.gif";

        a.href =
          URL.createObjectURL(blob);

        a.click();


        setTimeout(
          () => URL.revokeObjectURL(a.href),
          10000
        );


        statusEl.textContent =
          "GIF ready.";


        draw(
          (performance.now() - start) / 1000
        );

      }
    );


    gif.render();

  };

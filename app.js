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
source.crossOrigin = "anonymous";
let sourceReady = false;
let start = performance.now();

source.onload = () => { sourceReady = true; draw(0); };
source.src = "assets/book-background.png";

imageInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    source = new Image();
    source.onload = () => { sourceReady = true; draw(0); };
    source.src = reader.result;
  };
  reader.readAsDataURL(file);
});

[titleInput, subInput, ctaInput, urlInput, overlayInput, speedInput].forEach(el => {
  el.addEventListener("input", () => draw((performance.now() - start) / 1000));
});

function coverImage(img, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale, sh = img.height * scale;
  ctx.drawImage(img, (w-sw)/2, (h-sh)/2, sw, sh);
}

function fitTitle(text, maxWidth) {
  let size = 35;
  while (size > 22) {
    ctx.font = `700 ${size}px Georgia, serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size--;
  }
  return size;
}

function draw(t) {
  ctx.clearRect(0,0,W,H);
  if (!sourceReady) return;

  // Base photograph.
  coverImage(source, W, H);

  // Animated editorial overlay:
  // a deep left-side wash + a soft moving reveal band.
  const strength = Number(overlayInput.value) / 100;
  const phase = (t * 0.24) % 1;
  const revealX = -80 + phase * 760;

  const wash = ctx.createLinearGradient(0,0,W,0);
  wash.addColorStop(0, `rgba(8,7,6,${0.90*strength})`);
  wash.addColorStop(0.34, `rgba(8,7,6,${0.72*strength})`);
  wash.addColorStop(0.66, `rgba(8,7,6,${0.20*strength})`);
  wash.addColorStop(1, `rgba(8,7,6,${0.02*strength})`);
  ctx.fillStyle = wash;
  ctx.fillRect(0,0,W,H);

  // Soft animated veil; deliberately subtle rather than a hard sweep.
  const veil = ctx.createLinearGradient(revealX-150,0,revealX+150,0);
  veil.addColorStop(0,"rgba(255,245,225,0)");
  veil.addColorStop(.5,"rgba(255,245,225,.10)");
  veil.addColorStop(1,"rgba(255,245,225,0)");
  ctx.fillStyle = veil;
  ctx.fillRect(0,0,W,H);

  // Typography.
  const title = titleInput.value.trim().toUpperCase();
  const sub = subInput.value.trim().toUpperCase();
  const cta = ctaInput.value.trim().toUpperCase();

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const titleSize = fitTitle(title, 355);
  ctx.font = `700 ${titleSize}px Georgia, serif`;
  ctx.fillStyle = "rgba(255,250,240,.97)";
  ctx.fillText(title, 30, 78);

  ctx.font = "600 10px Inter, Arial, sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillStyle = "rgba(255,250,240,.78)";
  ctx.fillText(sub, 32, 119);

  // CTA with understated rule.
  const ctaY = 162;
  ctx.font = "700 11px Inter, Arial, sans-serif";
  ctx.fillStyle = "rgba(255,250,240,.95)";
  ctx.fillText(cta, 32, ctaY);
  const ctaWidth = ctx.measureText(cta).width;
  ctx.font = "700 16px Arial";
  ctx.fillText("→", 42 + ctaWidth, ctaY);

  ctx.strokeStyle = "rgba(255,250,240,.65)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, 178);
  ctx.lineTo(32 + Math.min(190, ctaWidth + 45), 178);
  ctx.stroke();

  // Very subtle vignette for the signature-banner look.
  const vig = ctx.createRadialGradient(W*.48,H*.5,55,W*.48,H*.5,430);
  vig.addColorStop(0,"rgba(0,0,0,0)");
  vig.addColorStop(1,"rgba(0,0,0,.28)");
  ctx.fillStyle = vig;
  ctx.fillRect(0,0,W,H);
}

function animationLoop(now) {
  draw((now-start)/1000);
  requestAnimationFrame(animationLoop);
}
requestAnimationFrame(animationLoop);

document.getElementById("pngBtn").onclick = () => {
  draw((performance.now()-start)/1000);
  const a = document.createElement("a");
  a.download = "of-ambition-and-grind-banner.png";
  a.href = canvas.toDataURL("image/png");
  a.click();
};

document.getElementById("gifBtn").onclick = async () => {
  if (!sourceReady) return;
  statusEl.textContent = "Generating animated GIF…";
  const gif = new GIF({
    workers: 2,
    quality: 8,
    width: W,
    height: H,
    workerScript: "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js"
  });

  const frames = 36;
  const delay = Number(speedInput.value);
  for (let i=0;i<frames;i++) {
    draw((i / frames) * 3.0);
    gif.addFrame(ctx, {copy:true, delay});
  }

  gif.on("progress", p => {
    statusEl.textContent = `Generating animated GIF… ${Math.round(p*100)}%`;
  });

  gif.on("finished", blob => {
    const a = document.createElement("a");
    a.download = "of-ambition-and-grind-banner.gif";
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    statusEl.textContent = "GIF ready.";
    draw((performance.now()-start)/1000);
  });

  gif.render();
};

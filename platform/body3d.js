// Modelo paramétrico ilustrativo. Não representa escaneamento nem composição corporal.
import { esc } from "./api.js";
export function mountBody3D(host, assessments) {
  if (!assessments.length) {
    host.innerHTML =
      '<p class="empty">Cadastre uma avaliação para visualizar o modelo estimado.</p>';
    return () => {};
  }
  const list = assessments.slice().sort((a, b) => a.date.localeCompare(b.date));
  host.innerHTML = `<div class="comparison"><div class="two"><label>Avaliação inicial<select id="bodyBefore">${list.map((x, i) => `<option value="${i}">${esc(x.date)}</option>`).join("")}</select></label><label>Avaliação final<select id="bodyAfter">${list.map((x, i) => `<option value="${i}" ${i === list.length - 1 ? "selected" : ""}>${esc(x.date)}</option>`).join("")}</select></label></div><div class="body-stage"><span class="pill body-label">3D estimado por medidas</span><canvas id="bodyCanvas" role="img" aria-label="Modelo corporal tridimensional estimado. Use os controles para girar e comparar avaliações."></canvas><span class="body-help">Arraste para girar · use os controles para comparar</span></div><label>Comparar evolução<input id="bodyBlend" type="range" min="0" max="100" value="100"></label><div class="two"><label>Rotação<input id="bodyRotate" type="range" min="-180" max="180" value="0"></label><label>Aproximação<input id="bodyZoom" type="range" min="70" max="130" value="100"></label></div><div id="bodyMeasures" class="macro" aria-live="polite"></div><p class="note">A forma é uma estimativa visual de cintura, quadril e altura. Ela não reproduz seu corpo com exatidão nem permite avaliar composição corporal.</p></div>`;
  const canvas = host.querySelector("canvas"),
    ctx = canvas.getContext("2d"),
    before = host.querySelector("#bodyBefore"),
    after = host.querySelector("#bodyAfter"),
    blend = host.querySelector("#bodyBlend"),
    rotate = host.querySelector("#bodyRotate"),
    zoom = host.querySelector("#bodyZoom");
  let angle = 0,
    active = false,
    prevX = 0,
    raf = 0,
    disposed = false;
  function mesh(m) {
    const polys = [],
      ring = (y, rx, rz, cx = 0) =>
        Array.from({ length: 25 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return [cx + Math.cos(a) * rx, y, Math.sin(a) * rz];
        });
    const connect = (a, b, color) => {
      for (let i = 0; i < 24; i++)
        polys.push({ points: [a[i], a[i + 1], b[i + 1], b[i]], color });
    };
    const hip = m.hip / 6,
      waist = m.waist / 6,
      height = m.height / 170;
    const torso = [
      [-65, 27, 17],
      [-51, 34, 20],
      [-25, 31, 20],
      [2, waist, waist * 0.72],
      [25, hip, hip * 0.72],
      [40, hip * 0.82, hip * 0.67],
    ];
    for (let i = 0; i < torso.length - 1; i++) {
      const a = torso[i],
        b = torso[i + 1];
      connect(
        ring(a[0] * height, a[1], a[2]),
        ring(b[0] * height, b[1], b[2]),
        [91, 132, 75],
      );
    }
    function oval(cx, cy, rx, ry, rz, color) {
      let prior = ring(cy - ry, 0.01, 0.01, cx);
      for (let j = 1; j <= 14; j++) {
        const t = (j / 14) * Math.PI,
          cur = ring(
            cy - Math.cos(t) * ry,
            Math.max(0.01, Math.sin(t) * rx),
            Math.max(0.01, Math.sin(t) * rz),
            cx,
          );
        connect(prior, cur, color);
        prior = cur;
      }
    }
    oval(0, -91 * height, 18, 24 * height, 17, [128, 159, 103]);
    oval(0, -67 * height, 11, 14 * height, 10, [91, 132, 75]);
    for (const sign of [-1, 1]) {
      oval(sign * 15, 81 * height, 15, 51 * height, 15, [104, 144, 83]);
      oval(sign * 15, 139 * height, 10, 28 * height, 10, [91, 132, 75]);
      oval(sign * 43, -9 * height, 10, 48 * height, 10, [116, 151, 93]);
      oval(sign * 44, 37 * height, 8, 19 * height, 8, [128, 159, 103]);
      oval(sign * 15, 168 * height, 11, 6 * height, 18, [91, 132, 75]);
    }
    return polys;
  }
  function draw() {
    if (disposed) return;
    const a = list[+before.value],
      b = list[+after.value],
      t = Number(blend.value) / 100,
      m = {};
    for (const k of ["height", "weight", "waist", "hip"])
      m[k] = a[k] + (b[k] - a[k]) * t;
    const rect = canvas.getBoundingClientRect(),
      ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    const w = rect.width,
      h = rect.height,
      scale = ((h / 330) * Number(zoom.value)) / 100;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#17331c12";
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.91, 60 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    const rad = (angle * Math.PI) / 180;
    const project = ([x, y, z]) => {
      const xx = x * Math.cos(rad) + z * Math.sin(rad),
        zz = z * Math.cos(rad) - x * Math.sin(rad),
        p = 500 / (500 + zz);
      return [w / 2 + xx * scale * p, h / 2 + (y - 30) * scale * p, zz];
    };
    const shapes = mesh(m)
      .map((poly) => {
        const pts = poly.points.map(project);
        return {
          ...poly,
          pts,
          z: pts.reduce((s, p) => s + p[2], 0) / pts.length,
        };
      })
      .sort((a, b) => b.z - a.z);
    for (const poly of shapes) {
      const shade = Math.max(0.6, Math.min(1.12, 1 - poly.z / 180));
      ctx.fillStyle = `rgb(${poly.color.map((x) => Math.round(x * shade)).join(",")})`;
      ctx.beginPath();
      poly.pts.forEach((p, i) =>
        i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]),
      );
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    host.querySelector("#bodyMeasures").innerHTML = [
      ["Cintura", m.waist, "cm"],
      ["Quadril", m.hip, "cm"],
      ["Peso", m.weight, "kg"],
    ]
      .map(
        ([l, n, u]) =>
          `<div><b>${n.toFixed(1).replace(".", ",")} ${u}</b><small>${l}</small></div>`,
      )
      .join("");
  }
  const render = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(draw);
  };
  for (const el of [before, after, blend, rotate, zoom])
    el.addEventListener("input", () => {
      angle = +rotate.value;
      render();
    });
  canvas.addEventListener("pointerdown", (e) => {
    active = true;
    prevX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (active) {
      angle += (e.clientX - prevX) * 0.7;
      prevX = e.clientX;
      angle = ((((angle + 180) % 360) + 360) % 360) - 180;
      rotate.value = angle;
      render();
    }
  });
  canvas.addEventListener("pointerup", () => (active = false));
  canvas.addEventListener("pointercancel", () => (active = false));
  const observer = new ResizeObserver(render);
  observer.observe(canvas);
  render();
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    canvas.width = 0;
    canvas.height = 0;
  };
}

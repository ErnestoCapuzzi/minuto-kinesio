// =======================
// Minuto Kine PRO (Final) + Vibración + Sonido + Confetti + Transiciones
// =======================

// Configuración
const TOTAL_QUESTIONS = 10;
const USE_TIMER = true;
const TOTAL_SECONDS = 60;

// Vibración
const USE_VIBRATION = true;

// Sonido (sutil)
let soundEnabled = true; // se carga desde localStorage

// Confetti minimalista
const CONFETTI_ENABLED = true;
const CONFETTI_SCORE_THRESHOLD = 95; // umbral para "celebración elegante"
const CONFETTI_HITS_THRESHOLD = 8;   // o por aciertos

// Patrones de vibración (ms)
const VIB = {
  correct: [20, 30, 20],
  wrong: [60],
  warn: [25, 60, 25],
  end: [80, 60, 80],
};

// Preguntas
const QUESTIONS = [
  {
    tag: "Bases",
    q: "¿Qué significa “kinesiología” en términos simples?",
    o: ["Solo masajes", "Movimiento y función", "Cirugía", "Dieta"],
    a: 1,
    exp: "Se centra en movimiento, función y recuperación. No es solo masaje."
  },
  {
    tag: "Deporte",
    q: "Dolor muscular tardío tras entrenar (agujetas): lo más común es…",
    o: ["Lesión grave siempre", "Adaptación del músculo", "Infección", "“Ácido láctico” por días"],
    a: 1,
    exp: "Suele ser adaptación a carga nueva. Si es intenso o persiste, conviene evaluar."
  },
  {
    tag: "Postura",
    q: "La mejor “postura” suele ser…",
    o: ["La perfecta", "La que más repetís", "La siguiente (cambiar de posición)", "La de Instagram"],
    a: 2,
    exp: "Variar posturas y moverse suele ser lo más saludable para el cuerpo."
  },
  {
    tag: "Oficina",
    q: "¿Qué suele empeorar más el dolor de cuello en oficina?",
    o: ["Pausas", "Pantalla baja y cuello hacia adelante", "Caminar", "Hidratación"],
    a: 1,
    exp: "La cabeza adelantada aumenta carga en cervical y trapecios."
  },
  {
    tag: "Movilidad",
    q: "¿Qué es la movilidad?",
    o: ["Flexibilidad únicamente", "Rango de movimiento controlado", "Fuerza máxima", "Resistencia aeróbica"],
    a: 1,
    exp: "Movilidad = rango + control. No es solo “estirar”."
  },
  {
    tag: "Adultos mayores",
    q: "Para prevenir caídas en adultos mayores es clave…",
    o: ["Solo estirar", "Equilibrio + fuerza", "Evitar moverse", "Masajes diarios"],
    a: 1,
    exp: "Fuerza y equilibrio aumentan estabilidad y confianza al moverse."
  },
  {
    tag: "Mitos",
    q: "Si me duele, entonces debo parar todo movimiento siempre.",
    o: ["Verdadero", "Falso"],
    a: 1,
    exp: "Muchas veces se adapta movimiento y carga. Parar siempre puede empeorar."
  },
  {
    tag: "Calor",
    q: "La termoterapia (calor) suele ayudar más cuando hay…",
    o: ["Rigidez/tensión", "Herida abierta", "Fiebre", "Inflamación aguda fuerte"],
    a: 0,
    exp: "El calor puede relajar y mejorar confort en rigidez."
  },
  {
    tag: "Tecnología",
    q: "Ultrasonido terapéutico: lo más correcto es…",
    o: ["Cura todo", "Herramienta complementaria", "Sustituye movimiento", "Sirve para diagnosticar"],
    a: 1,
    exp: "Complementa. Lo activo (movimiento) suele ser parte clave del plan."
  },
  {
    tag: "Criterio clínico",
    q: "¿Qué suele dar mejores resultados a largo plazo?",
    o: ["Una sesión", "Solo aparatología", "Tratamiento + hábitos + ejercicios simples", "Esperar"],
    a: 2,
    exp: "Lo sostenible gana: hábitos y ejercicios simples mantienen el cambio."
  }
];

// Helpers DOM
const $ = (id) => document.getElementById(id);

// UI
const els = {
  screens: {
    start: $("screenStart"),
    quiz: $("screenQuiz"),
    result: $("screenResult"),
  },

  btnStart: $("btnStart"),
  btnHow: $("btnHow"),
  btnCloseHow: $("btnCloseHow"),
  btnStartFromHow: $("btnStartFromHow"),
  modalHow: $("modalHow"),

  hudProgress: $("hudProgress"),
  hudScore: $("hudScore"),
  hudTime: $("hudTime"),
  btnSound: $("btnSound"),

  quizCard: $("quizCard"),

  progressFill: $("progressFill"),
  qMeta: $("qMeta"),
  streakMeta: $("streakMeta"),
  qTag: $("qTag"),
  qText: $("qText"),
  answers: $("answers"),

  feedback: $("feedback"),
  fbTitle: $("fbTitle"),
  fbPoints: $("fbPoints"),
  fbText: $("fbText"),
  btnNext: $("btnNext"),
  btnSkip: $("btnSkip"),

  resultTitle: $("resultTitle"),
  resultLead: $("resultLead"),
  statScore: $("statScore"),
  statHits: $("statHits"),
  statBestStreak: $("statBestStreak"),
  btnPlayAgain: $("btnPlayAgain"),
  btnCopy: $("btnCopy"),

  confetti: $("confetti"),
  year: $("year"),
};

// State
let queue = [];
let index = 0;
let score = 0;
let hits = 0;
let streak = 0;
let bestStreak = 0;

let timeLeft = TOTAL_SECONDS;
let timerHandle = null;
let locked = false;

let endedByTime = false;
let warned10s = false;

// Motion preferences
const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// =======================
// Vibración
// =======================
function canVibrate(){
  return USE_VIBRATION && typeof navigator !== "undefined" && "vibrate" in navigator;
}
function vibrate(pattern){
  if(!canVibrate()) return;
  try{ navigator.vibrate(pattern); }catch{}
}

// =======================
// Sonido (Web Audio) - sutil y premium
// =======================
let audioCtx = null;

function getAudioCtx(){
  if(!audioCtx){
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    audioCtx = new AC();
  }
  return audioCtx;
}

function beep({freq=440, dur=0.08, type="sine", vol=0.04} = {}){
  if(!soundEnabled) return;
  const ctx = getAudioCtx();
  if(!ctx) return;

  // algunos navegadores necesitan "resume" luego de interacción
  if(ctx.state === "suspended") ctx.resume().catch(()=>{});

  const o = ctx.createOscillator();
  const g = ctx.createGain();

  o.type = type;
  o.frequency.value = freq;

  const now = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(vol, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  o.connect(g);
  g.connect(ctx.destination);

  o.start(now);
  o.stop(now + dur + 0.02);
}

function soundCorrect(){
  // dos tonos suaves
  beep({freq: 620, dur: 0.07, type:"sine", vol:0.035});
  setTimeout(()=>beep({freq: 820, dur: 0.06, type:"sine", vol:0.03}), 70);
}
function soundWrong(){
  beep({freq: 220, dur: 0.10, type:"triangle", vol:0.035});
}
function soundTick10(){
  // aviso leve al entrar en ≤10s
  beep({freq: 520, dur: 0.05, type:"sine", vol:0.02});
}
function soundEnd(){
  beep({freq: 260, dur: 0.10, type:"triangle", vol:0.03});
  setTimeout(()=>beep({freq: 200, dur: 0.12, type:"triangle", vol:0.028}), 120);
}
function soundClick(){
  beep({freq: 480, dur: 0.03, type:"sine", vol:0.018});
}

// =======================
// Confetti minimalista (canvas)
// =======================
let confettiRAF = null;

function resizeConfetti(){
  const c = els.confetti;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  c.width = Math.floor(window.innerWidth * dpr);
  c.height = Math.floor(window.innerHeight * dpr);
  c.style.width = "100%";
  c.style.height = "100%";
}

function stopConfetti(){
  if(confettiRAF) cancelAnimationFrame(confettiRAF);
  confettiRAF = null;
  els.confetti.style.opacity = "0";
}

function runConfetti(){
  if(prefersReducedMotion) return;
  if(!CONFETTI_ENABLED) return;

  resizeConfetti();
  const c = els.confetti;
  const ctx = c.getContext("2d");
  if(!ctx) return;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const W = c.width;
  const H = c.height;

  // colores desde CSS vars
  const styles = getComputedStyle(document.documentElement);
  const teal = (styles.getPropertyValue("--teal") || "#6A837E").trim();
  const ink = (styles.getPropertyValue("--ink") || "#2F2F2F").trim();
  const muted = (styles.getPropertyValue("--muted") || "#667170").trim();

  const colors = [teal, muted, ink, "rgba(255,255,255,.9)"];

  const n = 120;
  const particles = Array.from({length:n}, ()=>({
    x: Math.random()*W,
    y: -Math.random()*H*0.3,
    vx: (Math.random()-0.5) * 0.6 * dpr,
    vy: (1.6 + Math.random()*2.4) * dpr,
    r: (2 + Math.random()*3.5) * dpr,
    rot: Math.random()*Math.PI,
    vr: (Math.random()-0.5) * 0.08,
    color: colors[Math.floor(Math.random()*colors.length)],
    alpha: 0.85 + Math.random()*0.15
  }));

  const start = performance.now();
  const duration = 1700; // corto y elegante

  els.confetti.style.opacity = "1";

  function frame(t){
    const elapsed = t - start;
    ctx.clearRect(0,0,W,H);

    // desvanecer hacia el final
    const fade = Math.max(0, 1 - (elapsed / duration));
    ctx.globalAlpha = fade;

    for(const p of particles){
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      // leve drift horizontal
      p.vx += (Math.random()-0.5) * 0.01 * dpr;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = fade * p.alpha;
      ctx.fillRect(-p.r, -p.r*0.45, p.r*2.0, p.r*0.9);
      ctx.restore();
    }

    if(elapsed < duration){
      confettiRAF = requestAnimationFrame(frame);
    }else{
      stopConfetti();
    }
  }

  confettiRAF = requestAnimationFrame(frame);
}

// =======================
// Utils
// =======================
function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1; i>0; i--){
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showScreen(name){
  Object.values(els.screens).forEach(s => s.classList.remove("screen--active"));
  els.screens[name].classList.add("screen--active");
}

// Transición suave para cambio de pregunta
function swapQuestion(renderFn){
  if(prefersReducedMotion){
    renderFn();
    return;
  }

  const card = els.quizCard;
  card.classList.remove("quiz--swapIn", "quiz--swapOut");
  card.classList.add("quiz--swapOut");

  const onEnd = () => {
    card.removeEventListener("animationend", onEnd);
    card.classList.remove("quiz--swapOut");
    renderFn();
    card.classList.add("quiz--swapIn");
    // limpiar clase luego
    card.addEventListener("animationend", () => card.classList.remove("quiz--swapIn"), {once:true});
  };

  card.addEventListener("animationend", onEnd, {once:true});
}

function updateHud(){
  els.hudProgress.textContent = `${Math.min(index+1, TOTAL_QUESTIONS)}/${TOTAL_QUESTIONS}`;
  els.hudScore.textContent = `${score} pts`;
  els.hudTime.textContent = USE_TIMER ? `${Math.max(timeLeft,0)}s` : "∞";

  if(USE_TIMER){
    const danger = timeLeft <= 10;
    els.hudTime.classList.toggle("hudPill--danger", danger);

    if(danger && !warned10s){
      warned10s = true;
      vibrate(VIB.warn);
      soundTick10();
    }
  }
}

function updateProgress(){
  const pct = (index / TOTAL_QUESTIONS) * 100;
  els.progressFill.style.width = `${pct}%`;
}

function startTimer(){
  stopTimer();
  if(!USE_TIMER){
    updateHud();
    return;
  }

  timeLeft = TOTAL_SECONDS;
  warned10s = false;
  updateHud();

  timerHandle = setInterval(()=>{
    timeLeft -= 1;
    updateHud();

    if(timeLeft <= 0){
      stopTimer();
      endedByTime = true;
      vibrate(VIB.end);
      soundEnd();
      finish();
    }
  }, 1000);
}

function stopTimer(){
  if(timerHandle){
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

function resetGame(){
  queue = shuffle(QUESTIONS).slice(0, TOTAL_QUESTIONS);
  index = 0;
  score = 0;
  hits = 0;
  streak = 0;
  bestStreak = 0;
  locked = false;
  endedByTime = false;
  warned10s = false;

  stopConfetti();
  els.feedback.hidden = true;

  updateHud();
  updateProgress();
}

function renderQuestion(){
  locked = false;
  els.feedback.hidden = true;
  els.answers.innerHTML = "";

  updateHud();
  updateProgress();

  const q = queue[index];
  if(!q){ finish(); return; }

  els.qMeta.textContent = `Pregunta ${index+1} de ${TOTAL_QUESTIONS}`;
  els.streakMeta.textContent = `Racha: ${streak}`;
  els.qTag.textContent = q.tag || "Kinesiología";
  els.qText.textContent = q.q;

  q.o.forEach((opt, i)=>{
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer";
    btn.textContent = opt;
    btn.addEventListener("click", () => onAnswer(i));
    els.answers.appendChild(btn);
  });
}

function onAnswer(choice){
  if(locked) return;
  locked = true;

  const q = queue[index];
  const buttons = [...els.answers.querySelectorAll("button")];
  buttons.forEach(b => b.disabled = true);

  const correctIndex = q.a;
  const isCorrect = choice === correctIndex;

  // Pintar correct/incorrect
  buttons.forEach((b, i) => {
    if(i === correctIndex) b.classList.add("good");
    if(i === choice && i !== correctIndex) b.classList.add("bad");
  });

  let gained = 0;

  if(isCorrect){
    hits += 1;
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);

    gained = 10;

    // Bonus por racha
    if(streak >= 3) gained += 5;

    // Bonus por velocidad (0 a +6 aprox)
    if(USE_TIMER){
      const speedBonus = Math.max(0, Math.min(6, Math.floor(timeLeft / 10)));
      gained += speedBonus;
    }

    score += gained;
    els.fbTitle.textContent = streak >= 3 ? "✅ Correcto (racha)" : "✅ Correcto";
    vibrate(VIB.correct);
    soundCorrect();
  }else{
    streak = 0;
    els.fbTitle.textContent = "❌ Casi";
    vibrate(VIB.wrong);
    soundWrong();
  }

  els.fbPoints.textContent = isCorrect ? `+${gained}` : "+0";
  els.fbText.textContent = q.exp;

  els.feedback.hidden = false;
  updateHud();
}

function next(){
  index += 1;
  if(index >= TOTAL_QUESTIONS){
    finish();
    return;
  }
  swapQuestion(renderQuestion);
}

function skip(){
  streak = 0;
  soundClick();
  vibrate([12]);
  next();
}

function finish(){
  stopTimer();
  showScreen("result");

  els.resultTitle.textContent = endedByTime ? "Se terminó el tiempo ⏱️" : "Listo ✅";
  els.resultLead.textContent = endedByTime
    ? `Tiempo agotado. Puntaje final: ${score} pts`
    : `Tu puntaje final: ${score} pts`;

  els.statScore.textContent = String(score);
  els.statHits.textContent = `${hits}/${TOTAL_QUESTIONS}`;
  els.statBestStreak.textContent = String(bestStreak);

  els.progressFill.style.width = "100%";
  els.hudProgress.textContent = `${TOTAL_QUESTIONS}/${TOTAL_QUESTIONS}`;

  // Confetti minimalista si fue muy buen resultado
  const shouldCelebrate = (score >= CONFETTI_SCORE_THRESHOLD) || (hits >= CONFETTI_HITS_THRESHOLD);
  if(shouldCelebrate && !endedByTime){
    runConfetti();
  }
}

async function copyResult(){
  const text = `Hice Minuto Kine (10 preguntas · ${USE_TIMER ? "60s" : "sin tiempo"}) y saqué ${score} pts (${hits}/10). ¿Me ganás?`;

  try{
    await navigator.clipboard.writeText(text);
    els.btnCopy.textContent = "Copiado ✅";
    setTimeout(()=> els.btnCopy.textContent = "Copiar resultado", 1200);
    soundClick();
    vibrate([18, 40, 18]);
  }catch{
    alert(text);
  }
}

// Modal
function openHow(){ els.modalHow.hidden = false; soundClick(); vibrate([12]); }
function closeHow(){ els.modalHow.hidden = true; soundClick(); vibrate([12]); }

// Sonido toggle
function loadSoundSetting(){
  const v = localStorage.getItem("mk_sound");
  soundEnabled = (v === null) ? true : (v === "1");
  els.btnSound.textContent = soundEnabled ? "🔊" : "🔇";
}
function toggleSound(){
  soundEnabled = !soundEnabled;
  localStorage.setItem("mk_sound", soundEnabled ? "1" : "0");
  els.btnSound.textContent = soundEnabled ? "🔊" : "🔇";
  soundClick();
  vibrate([10]);
}

// Init
function startGame(){
  resetGame();
  showScreen("quiz");

  // iOS/Safari: crear contexto con gesto
  getAudioCtx();

  soundClick();
  vibrate([10]);

  startTimer();
  swapQuestion(renderQuestion);
}

// Eventos
els.btnHow.addEventListener("click", openHow);
els.btnCloseHow.addEventListener("click", closeHow);
els.btnStartFromHow.addEventListener("click", () => { closeHow(); startGame(); });

els.btnStart.addEventListener("click", startGame);

els.btnNext.addEventListener("click", () => { soundClick(); vibrate([12]); next(); });
els.btnSkip.addEventListener("click", skip);

els.btnPlayAgain.addEventListener("click", () => { soundClick(); vibrate([12]); startGame(); });
els.btnCopy.addEventListener("click", copyResult);

els.btnSound.addEventListener("click", toggleSound);

window.addEventListener("resize", resizeConfetti);

// Boot
els.year.textContent = String(new Date().getFullYear());
loadSoundSetting();
updateHud();
resizeConfetti();

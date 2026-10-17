import { request, esc, localDate, money, prettyDate } from "./api.js";
import { mountBody3D } from "./body3d.js";
const app = document.querySelector("#app"),
  top = document.querySelector("#topNav");
const s = {
  user: null,
  links: [],
  patients: [],
  pid: null,
  page: "home",
  generation: 0,
  controller: null,
  cleanup: null,
  foods: [],
  drafts: new Map(),
  config: null,
  catalogVersion: null,
  catalogSource: "Valores aproximados de demonstração",
  recipeDrafts: new Map(),
  shoppingDays: 7,
};
const button = (label, action, cls = "") =>
  `<button type="button" class="btn ${cls}" data-go="${action}">${label}</button>`;
const input = (label, name, type = "text", value = "", attrs = "") =>
  `<label>${label}<input name="${name}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
const area = (label, name, value = "", attrs = "") =>
  `<label>${label}<textarea name="${name}" ${attrs}>${esc(value)}</textarea></label>`;
const select = (label, name, options, value = "") =>
  `<label>${label}<select name="${name}">${options.map(([v, n]) => `<option value="${esc(v)}" ${String(value) === String(v) ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`;
const check = (name, label, value = false) =>
  `<label class="check"><input name="${name}" type="checkbox" ${value ? "checked" : ""}><span>${label}</span></label>`;
const form = (name, html, label = "Salvar") =>
  `<form class="form" data-form="${name}">${html}<div class="form-error" role="alert"></div><button class="btn primary" type="submit">${label}</button></form>`;
const empty = (msg) => `<div class="empty">${esc(msg)}</div>`;
function toast(msg, error = false) {
  const el = document.createElement("div");
  el.className = "toast" + (error ? " error" : "");
  el.textContent = msg;
  const host = document.querySelector("#notices");
  host.append(el);
  while (host.children.length > 2) host.firstElementChild.remove();
  setTimeout(() => el.remove(), 6000);
}
function go(page) {
  if (location.hash === "#" + page) render();
  else location.hash = page;
}
const read = (path) => request(path, { signal: s.controller?.signal });
const write = (path, body, method = "POST") => request(path, { method, body });
function patient(kind) {
  if (!s.pid) throw new Error("Selecione um paciente.");
  return `/patients/${s.pid}/${kind}`;
}
function paint(html, g) {
  if (g !== undefined && g !== s.generation) return;
  const p = document.querySelector("#panel");
  if (p) p.innerHTML = html;
  else
    app.innerHTML = `<main id="content" class="landing reveal">${html}</main>`;
}
function nav() {
  top.innerHTML = s.user
    ? `<span class="badge">${esc(s.user.name)}</span>${button("Sair", "logout", "ghost")}`
    : `${button("Encontrar atendimento", "directory", "ghost")}${button("Entrar", "login", "ghost")}${button("Criar conta", "register", "primary")}`;
}
async function session() {
  const d = await request("/me");
  s.user = d.user;
  s.links = d.links;
  if (s.user.role === "patient") s.pid = s.user.id;
  nav();
}
const plant =
  '<svg viewBox="0 0 180 240" aria-hidden="true"><path d="M90 174V50" stroke="#CFF580" stroke-width="6" stroke-linecap="round"/><g fill="#CFF580"><path d="M90 80C25 85 25 25 90 80M90 112C155 117 155 57 90 112M90 144C25 149 25 89 90 144"/><path d="M90 58C130 63 130 20 90 58" fill="#E7F5BE"/></g><circle cx="90" cy="37" r="10" fill="#e8a369"/><path d="M50 185h80l-10 50H60z" fill="#c9a27a"/><rect x="44" y="172" width="92" height="16" rx="7" fill="#b98a5e"/></svg>';
function landing() {
  app.innerHTML = `<main id="content" class="landing reveal"><div class="hero-grid"><div class="hero-copy"><div class="eyebrow">Sua rotina, seu ritmo</div><h1>Pequenos hábitos.<br>Um cuidado que cresce.</h1><p>Seu plano, suas consultas e sua evolução no mesmo lugar. Com o acompanhamento de quem cuida de você.</p><div class="actions">${button("Quero me cuidar", "register", "primary")}${button("Sou nutricionista", "register-nut")}</div><small>Já tem um profissional? Entre com o e-mail e a senha do seu convite.</small></div><div class="hero-art">${plant}<div class="art-label"><span>Constância floresce.<br>Sem pressa, com cuidado.</span><span class="pill">Um dia de cada vez</span></div></div></div><div class="cards"><article class="card"><span class="step-num">01</span><h3>Encontre seu caminho</h3><p class="muted">Entre pelo convite do seu nutricionista ou encontre atendimento perto de você.</p>${button("Buscar atendimento", "directory", "ghost")}</article><article class="card"><span class="step-num">02</span><h3>Cuidado que acompanha</h3><p class="muted">Plano alimentar, registros e mensagens para construir uma rotina possível.</p></article><article class="card"><span class="step-num">03</span><h3>Sua evolução, privada</h3><p class="muted">Medidas e modelo corporal 3D estimado, somente se você autorizar.</p></article></div><p class="footer"><a href="demo.html">Explorar demonstração com dados fictícios</a> · Seus dados de saúde não aparecem na busca.</p>${!s.config ? '<div class="server-info">Para criar contas e salvar dados é necessário o servidor Nutrilume. A demonstração permanece disponível.</div>' : ""}</main>`;
}
function auth(mode, role = "patient") {
  app.innerHTML = `<main id="content" class="auth reveal"><div class="card"><div class="eyebrow">Bem-vindo ao seu espaço</div><h1>${mode === "register" ? "Vamos começar" : mode === "forgot" ? "Recuperar acesso" : "Que bom ter você aqui"}</h1>${
    mode === "register"
      ? `<p class="muted">Você pode usar seu Gmail com uma senha exclusiva do Nutrilume.</p>${form(
          "register",
          select(
            "Eu sou",
            "role",
            [
              ["patient", "Paciente"],
              ["nutritionist", "Nutricionista"],
            ],
            role,
          ) +
            input(
              "Nome completo",
              "name",
              "text",
              "",
              'required maxlength="60" autocomplete="name"',
            ) +
            input(
              "E-mail",
              "email",
              "email",
              "",
              'required autocomplete="email"',
            ) +
            input(
              "Senha do Nutrilume",
              "password",
              "password",
              "",
              'required minlength="12" maxlength="128" autocomplete="new-password"',
            ) +
            `<div id="crnField" ${role === "patient" ? "hidden" : ""}>${input("Registro profissional (CRN)", "crn", "text", "", 'maxlength="50" ' + (role === "nutritionist" ? "required" : ""))}</div>` +
            "<small>Use pelo menos 12 caracteres. O CRN será informado pelo profissional.</small>",
          "Criar minha conta",
        )}`
      : mode === "forgot"
        ? form(
            "forgot",
            input("E-mail da conta", "email", "email", "", "required"),
            "Enviar instruções",
          )
        : form(
            "login",
            input(
              "E-mail",
              "email",
              "email",
              "",
              'required autocomplete="email"',
            ) +
              input(
                "Senha do Nutrilume",
                "password",
                "password",
                "",
                'required autocomplete="current-password"',
              ),
            "Entrar",
          )
  }<hr class="divider"><div class="row">${button(mode === "login" ? "Criar conta" : "Já tenho conta", mode === "login" ? "register" : "login", "ghost")}${mode === "login" ? button("Esqueci minha senha", "forgot", "ghost") : ""}</div></div></main>`;
}
function menus() {
  return s.user.role === "nutritionist"
    ? [
        ["home", "Visão geral"],
        ["patients", "Pacientes"],
        ["plan", "Planos alimentares"],
        ["assessments", "Avaliações e 3D"],
        ["clinical", "Acompanhamento"],
        ["messages", "Mensagens"],
        ["agenda", "Agenda"],
        ["finance", "Financeiro"],
        ["recipes", "Receitas"],
        ["community", "Meu grupo"],
        ["public-community", "Comunidade"],
        ["profile", "Meu perfil"],
      ]
    : [
        ["home", "Meu dia"],
        ["plan", "Meu plano"],
        ["assessments", "Minha evolução"],
        ["clinical", "Diário e ficha"],
        ["messages", "Mensagens"],
        ["agenda", "Consultas"],
        ["shopping", "Lista de compras"],
        ["recipes", "Receitas"],
        ["community", "Meu grupo"],
        ["public-community", "Comunidade"],
        ["directory", "Encontrar atendimento"],
        ["consents", "Privacidade"],
        ["profile", "Meu perfil"],
      ];
}
function shell() {
  app.innerHTML = `<div class="layout"><aside class="sidebar"><div class="eyebrow">${s.user.role === "nutritionist" ? "Meu consultório" : "Meu acompanhamento"}</div>${menus()
    .map(
      ([id, label]) =>
        `<button type="button" data-go="${id}" class="${s.page === id ? "active" : ""}" ${s.page === id ? 'aria-current="page"' : ""}>${label}</button>`,
    )
    .join(
      "",
    )}</aside><main id="content" class="workspace reveal"><div class="page-head"><div><div class="eyebrow">${new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}</div><h1>${esc(menus().find((x) => x[0] === s.page)?.[1] || "Seu espaço")}</h1></div>${s.user.role === "nutritionist" && s.patients.length && ["plan", "assessments", "clinical", "messages", "recipes"].includes(s.page) ? `<label class="patient-picker">Paciente<select id="patientPicker">${s.patients.map((p) => `<option value="${p.id}" ${p.id === s.pid ? "selected" : ""}>${esc(p.name)}${p.status !== "active" ? " · aguardando aceite" : ""}</option>`).join("")}</select></label>` : ""}</div><div id="panel"><div class="loading" role="status">Carregando seu espaço…</div></div></main></div>`;
}
async function directory(g) {
  paint(
    `<div class="page-head"><div><div class="eyebrow">Um primeiro passo perto de você</div><h1>Encontre atendimento</h1><p class="muted">Profissionais que escolheram divulgar seu atendimento no Nutrilume.</p></div></div><div class="card">${form("directory", `<div class="two">${input("Cidade", "city", "search", "", 'placeholder="Ex.: Recife" maxlength="100"')}<div class="row">${button("Usar minha localização", "locate")}</div></div><p class="note">A localização é opcional e usada somente nesta busca. O registro profissional é informado pelo próprio profissional.</p>`, "Buscar profissionais")}<div class="actions"><a id="externalMap" class="btn" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/nutricionista/">Pesquisar clínicas no Google Maps ↗</a></div></div><div id="directoryResults" class="cards" style="margin-top:20px"></div>`,
    g,
  );
  await searchDirectory({});
}
let directoryRun=0;
async function searchDirectory({ city = "", lat, lng } = {}) {
  const run=++directoryRun;
  const host = document.querySelector("#directoryResults");
  if (!host) return;
  host.innerHTML = '<p role="status">Buscando…</p>';
  document.querySelector("#externalMap").href =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(
      "nutricionista " + (lat !== undefined ? lat + "," + lng : city),
    );
  try {
    const q = new URLSearchParams();
    if (city) q.set("city", city);
    if (lat !== undefined) {
      q.set("lat", lat);
      q.set("lng", lng);
    }
    const d = await read("/directory?" + q);
    if (!host.isConnected||run!==directoryRun) return;
    host.innerHTML = d.items.length
      ? d.items
          .map(
            (x) =>
              `<article class="card nutri-card"><span class="pill">${x.km !== null ? x.km + " km de você" : esc(x.city)}</span><h3>${esc(x.name)}</h3><small>${esc(x.crn)} · informado pelo profissional</small><p>${esc(x.specialties || "Atendimento nutricional")}</p><p class="note">${esc(x.address || "")} · ${esc(x.city || "")}</p><p>${esc(x.bio || "")}</p><div class="actions"><button class="btn primary" data-request-nut="${x.id}">Solicitar acompanhamento</button><a class="btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.address + " " + x.city)}" target="_blank" rel="noopener noreferrer">Ver local ↗</a></div></article>`,
          )
          .join("")
      : empty(
          "Ainda não há profissionais cadastrados para esta busca. Você pode pesquisar outras clínicas no mapa.",
        );
  } catch (e) {
    if (e.name !== "AbortError" && host.isConnected)
      host.innerHTML = empty(e.message);
  }
}
async function consents(g) {
  const d = await read(patient("consents"));
  paint(
    `<div class="stack"><div class="card"><h2>Você escolhe o que compartilhar</h2><p>${d.link ? "Profissional responsável: <b>" + esc(d.link.nutritionistName) + "</b>" : "Você ainda não tem um acompanhamento vinculado."}</p>${d.link ? form("consents", check("health", "Autorizo o tratamento dos meus dados de saúde para meu acompanhamento.", d.consents.health) + check("photos", "Autorizo fotos privadas de evolução, visíveis para mim e meu nutricionista.", d.consents.photos) + check("body3d", "Autorizo um modelo corporal 3D estimado pelas minhas medidas, privado para mim e meu nutricionista.", d.consents.body3d) + check("group", "Quero participar do grupo do meu nutricionista.", d.consents.group) + check("reminders", "Quero receber lembretes de consultas por WhatsApp no telefone do meu perfil.", d.consents.reminders) + '<p class="note">Você pode revogar estas escolhas. Revogar fotos remove os arquivos de fotos. Revogar o 3D bloqueia o visualizador. As medidas continuam no histórico autorizado de saúde.</p>', "Atualizar autorizações") : button("Encontrar atendimento", "directory", "primary")}</div>${d.link ? `<div class="card"><h3>Encerrar vínculo</h3><p class="note">O profissional perde acesso. Seu histórico permanece na conta, sujeito às autorizações de acompanhamento.</p><button class="btn danger" data-end-link="${d.link.id}">Encerrar acompanhamento</button></div>` : ""}</div>`,
    g,
  );
}
async function patients(g) {
  paint(
    `<div class="stack"><div class="card"><h2>Preparar conta do paciente</h2><p class="muted">Use o e-mail do paciente, inclusive Gmail, e uma senha temporária exclusiva do Nutrilume. Ele confirma o e-mail, troca a senha e autoriza o acompanhamento.</p>${form("patient", input("Nome do paciente", "name", "text", "", 'required maxlength="60"') + input("E-mail do paciente", "email", "email", "", 'required autocomplete="off"') + input("Senha temporária do Nutrilume", "password", "password", "", 'required minlength="12" maxlength="128" autocomplete="new-password"'), "Preparar conta e enviar confirmação")}</div><div class="card"><h2>Seus pacientes</h2><div class="list">${s.patients.map((p) => `<article class="item"><div class="row between"><div><b>${esc(p.name)}</b><br><small>${esc(p.email)}</small></div><span class="pill">${esc({ active: "Em acompanhamento", invited: "Aguardando paciente", requested: "Solicitou acompanhamento", ended: "Vínculo encerrado" }[p.status])}</span></div><div class="actions">${p.status === "requested" ? `<button class="btn primary" data-accept-link="${p.linkId}">Aceitar solicitação</button>` : p.status === "active" ? `<button class="btn" data-open-patient="${p.id}">Abrir acompanhamento</button>` : ""}</div></article>`).join("") || empty("Você ainda não tem pacientes vinculados.")}</div></div></div>`,
    g,
  );
}
async function home(g) {
  if (s.user.role === "nutritionist") {
    const [a, f] = await Promise.all([read("/appointments"), read("/finance")]);
    paint(
      `<div class="stack"><div class="card"><div class="eyebrow">Seu consultório, com clareza</div><h2>Olá, ${esc(s.user.name.split(" ")[0])}.</h2><p class="muted">Organize o acompanhamento, publique planos e observe a evolução com seus pacientes.</p>${button("Cadastrar paciente", "patients", "primary")}</div><div class="cards"><article class="card"><small>Pacientes ativos</small><div class="metric">${s.patients.filter((x) => x.status === "active").length}</div></article><article class="card"><small>Consultas agendadas</small><div class="metric">${a.items.filter((x) => ["scheduled", "confirmed"].includes(x.status)).length}</div></article><article class="card"><small>Recebido</small><div class="metric">${money(f.paid)}</div></article></div><div class="card"><h3>Próximos atendimentos</h3>${
        a.items
          .filter(
            (x) =>
              ["scheduled", "confirmed"].includes(x.status) &&
              new Date(x.start) >= new Date(),
          )
          .slice(0, 5)
          .map(
            (x) =>
              `<div class="item"><b>${esc(x.patientName)}</b> · ${prettyDate(x.start)}<br><small>${esc(x.mode)}</small></div>`,
          )
          .join("") || empty("Nenhuma consulta futura agendada.")
      }</div></div>`,
      g,
    );
    return;
  }
  const link = s.links.find((x) =>
    ["active", "invited", "requested"].includes(x.status),
  );
  if (!link || link.status !== "active" || !link.consents.health) {
    paint(
      `<div class="card"><div class="eyebrow">Seu cuidado começa aqui</div><h2>Olá, ${esc(s.user.name.split(" ")[0])}.</h2><p>${link?.status === "requested" ? "Sua solicitação foi enviada. Aguarde a confirmação do profissional." : link ? "Você tem um convite de " + esc(link.nutritionist_name) + ". Escolha suas autorizações para começar." : "Encontre atendimento próximo ou aguarde o convite do seu nutricionista."}</p><div class="actions">${link && link.status !== "requested" ? button("Revisar autorizações", "consents", "primary") : button("Encontrar atendimento", "directory", "primary")}</div></div>`,
      g,
    );
    return;
  }
  const [h, goals] = await Promise.all([
    read(patient("habits")),
    read(patient("goals")),
  ]);
  const today = h.items.find((x) => x.date === localDate()) || {
    water: 0,
    goalDone: false,
  };
  const goal = goals.items[0];
  const days = goal
    ? h.items.filter(
        (x) =>
          x.goalDone &&
          x.date >= goal.start &&
          x.date <= localDate() &&
          new Date(x.date + "T12:00Z") <
            new Date(new Date(goal.start + "T12:00Z").getTime() + 7 * 86400000),
      ).length
    : 0;
  paint(
    `<div class="stack"><div class="card"><div class="eyebrow">Um dia de cada vez</div><h2>Olá, ${esc(s.user.name.split(" ")[0])}.</h2><p class="muted">Seu acompanhamento com ${esc(link.nutritionist_name)}.</p></div><div class="two"><div class="card"><h3>Água de hoje</h3><div class="metric">${today.water.toFixed(2).replace(".", ",")} L</div>${form("habits", input("Quantidade em litros", "water", "number", today.water, 'min="0" max="10" step="0.05" required') + check("goalDone", "Cumpri minha meta hoje", today.goalDone), "Salvar registro de hoje")}</div><div class="card"><h3>Seu hábito da semana</h3>${goal ? `<p>${esc(goal.title)}</p><div class="metric">${days} / ${goal.days} dias</div><div class="progress"><span style="width:${Math.min(100, (days / goal.days) * 100)}%"></span></div><p class="note">Semana a partir de ${esc(goal.start)}. Cada data conta uma vez.</p>` : empty("Seu nutricionista ainda não definiu uma meta.")}</div></div><div class="card"><h3>Seu próximo passo</h3><div class="actions">${button("Consultar meu plano", "plan", "primary")}${button("Registrar no diário", "clinical")}${button("Ver minha evolução", "assessments")}</div></div></div>`,
    g,
  );
}
function totals(items) {
  return items.reduce(
    (a, x) => {
      if (Number.isFinite(x.k)) {
        a.k += x.k;
        a.p += x.p;
        a.c += x.c;
        a.f += x.f;
      } else a.missing++;
      return a;
    },
    { k: 0, p: 0, c: 0, f: 0, missing: 0 },
  );
}
function macros(t) {
  return `<div class="macro">${[
    ["Energia", Math.round(t.k) + " kcal"],
    ["Proteína", t.p.toFixed(1) + " g"],
    ["Carboidrato", t.c.toFixed(1) + " g"],
    ["Gordura", t.f.toFixed(1) + " g"],
  ]
    .map(([l, n]) => `<div><b>${n}</b><small>${l}</small></div>`)
    .join(
      "",
    )}</div><p class="note">${t.missing ? `Total parcial: ${t.missing} item(ns) sem cálculo.` : "Todos os itens possuem cálculo."}</p>`;
}
function versions(items) {
  return items.length
    ? items
        .map(
          (x) =>
            `<details class="item"><summary>${prettyDate(x.created)} · ${x.items.length} itens</summary><p>${esc(x.note)}</p>${x.items.map((it) => `<p>${esc(it.meal)}: ${esc(it.name)} · ${esc(it.portion)}</p>`).join("")}</details>`,
        )
        .join("")
    : empty("Nenhuma versão publicada.");
}
async function plan(g) {
  const d = await read(patient("plan"));
  let savedDraft = null;
  if (s.user.role === "nutritionist") {
    const r = await read(patient("plan-draft"));
    savedDraft = r.items[0] || null;
  }
  if (s.user.role === "patient") {
    const p = d.current;
    paint(
      p
        ? `<div class="stack"><div class="card"><span class="pill">Publicado em ${prettyDate(p.created)}</span><p>${esc(p.note)}</p>${[
            ...new Set(p.items.map((x) => x.meal)),
          ]
            .map(
              (meal) =>
                `<h3>${esc(meal)}</h3>${p.items
                  .filter((x) => x.meal === meal)
                  .map(
                    (x) =>
                      `<div class="item"><b>${esc(x.name)}</b> · ${esc(x.portion)}${x.swaps ? `<p class="note">Trocas orientadas: ${esc(x.swaps)}</p>` : ""}</div>`,
                  )
                  .join("")}`,
            )
            .join(
              "",
            )}<p class="note">${esc(p.source)}</p></div><div class="card"><h3>Trocas que escolhi hoje</h3>${form("choices", area("Registre as trocas orientadas que você escolheu", "text", "", 'required maxlength="1000"'), "Salvar escolhas de hoje")}<hr class="divider"><h3>Histórico do plano</h3>${versions(d.versions)}</div></div>`
        : empty("Seu nutricionista ainda não publicou um plano."),
      g,
    );
    return;
  }
  const draft = s.drafts.get(s.pid) || {
    items: structuredClone(savedDraft?.items || d.current?.items || []),
    note: savedDraft?.note || d.current?.note || "",
  };
  s.drafts.set(s.pid, draft);
  paint(
    `<div class="stack"><div class="card"><h2>Seu rascunho</h2><p class="note">O paciente vê as alterações depois da publicação. Use Salvar rascunho para guardar sem publicar.</p><div id="planItems"></div><div class="actions">${button("Adicionar item manual", "manual-food")}${button("Salvar rascunho", "save-draft")}</div>${form("publish", area("Orientações do plano", "note", draft.note, 'maxlength="2000"'), "Publicar nova versão")}</div><div class="card"><h2>Banco de alimentos</h2><p class="note">${s.foods.length} alimentos · ${esc(s.catalogSource)}. Valores por 100 g, sujeitos à revisão profissional.</p>${input("Buscar alimento", "foodSearch", "search", "", 'id="foodSearch" placeholder="Ex.: pão ou frango"')}<div id="foodResults" class="food-results"></div><div id="foodSelected"></div></div><div class="card"><h3>Versões publicadas</h3>${versions(d.versions)}</div></div>`,
    g,
  );
  if (g === s.generation) {
    renderPlanItems();
    renderFoodResults("");
  }
}
function renderPlanItems() {
  const host = document.querySelector("#planItems"),
    draft = s.drafts.get(s.pid);
  if (!host) return;
  host.innerHTML =
    draft.items
      .map(
        (x, i) =>
          `<div class="plan-item" data-plan-item="${i}"><label>Alimento<input value="${esc(x.name)}" data-edit="name" maxlength="150"></label><label>Porção<input value="${esc(x.portion)}" data-edit="portion" maxlength="100"></label><label>Refeição<select data-edit="meal">${["Café", "Almoço", "Lanche", "Jantar"].map((m) => `<option ${x.meal === m ? "selected" : ""}>${m}</option>`).join("")}</select></label><button type="button" class="btn danger" data-remove-food="${i}" aria-label="Remover ${esc(x.name)}">Remover</button><label>Trocas<input value="${esc(x.swaps || "")}" data-edit="swaps" maxlength="500"></label></div>`,
      )
      .join("") + `<div id="planTotals">${macros(totals(draft.items))}</div>`;
}
let selectedFood = null;
function renderFoodResults(q) {
  const norm = (x) =>
      x
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase(),
    host = document.querySelector("#foodResults");
  if (!host) return;
  host.innerHTML =
    s.foods
      .map((f, id) => ({ f, id }))
      .filter((x) => norm(x.f[0]).includes(norm(q)))
      .slice(0, 6)
      .map(
        (x) =>
          `<button type="button" data-food="${x.id}" aria-pressed="${selectedFood === x.id}">${esc(x.f[0])} <small>· ${x.f[1]} kcal / 100 g</small></button>`,
      )
      .join("") || empty("Nenhum alimento encontrado.");
}
function selectFood(id) {
  selectedFood = id;
  const f = s.foods[id];
  document.querySelector("#foodSelected").innerHTML = form(
    "add-food",
    `<hr class="divider"><h3>${esc(f[0])}</h3><div class="two">${input("Quantidade em gramas", "grams", "number", 100, 'required min="1" max="2000" step="1"')}${select(
      "Refeição",
      "meal",
      ["Café", "Almoço", "Lanche", "Jantar"].map((x) => [x, x]),
      "Almoço",
    )}</div><div class="food-preview" id="foodPreview"></div>`,
    "Adicionar ao plano",
  );
  foodPreview(100);
}
function foodPreview(grams) {
  const f = s.foods[selectedFood];
  if (!f) return;
  const g = Math.max(1, Math.min(2000, Number(grams) || 100));
  document.querySelector("#foodPreview").innerHTML =
    `<p class="note">${Math.round((f[1] * g) / 100)} kcal · ${((f[2] * g) / 100).toFixed(1)} g proteína · ${((f[3] * g) / 100).toFixed(1)} g carboidrato · ${((f[4] * g) / 100).toFixed(1)} g gordura</p>`;
}
function fileList(items) {
  return (
    items
      .map(
        (x) =>
          `<div class="item row between"><span>${esc(x.name)} <small>${prettyDate(x.created)}</small></span><div class="row"><button type="button" class="btn" data-download="${x.id}">Baixar</button><button type="button" class="btn danger" data-delete-file="${x.id}">Apagar</button></div></div>`,
      )
      .join("") || empty("Nenhum arquivo enviado.")
  );
}
async function assessments(g) {
  const [a, c, f] = await Promise.all([
    read(patient("assessments")),
    read(patient("consents")),
    read(patient("files")),
  ]);
  if(g===s.generation)s.assessmentItems=a.items;
  paint(
    `<div class="stack">${s.user.role === "nutritionist" ? `<div class="card"><h2>Nova avaliação</h2>${form("assessment", `<div class="two">${input("Data", "date", "date", localDate(), "required")}${input("Altura (cm)", "height", "number", 170, 'min="80" max="250" step="0.1" required')}${input("Peso (kg)", "weight", "number", "", 'min="15" max="400" step="0.1" required')}${input("Cintura (cm)", "waist", "number", "", 'min="30" max="220" step="0.1" required')}${input("Quadril (cm)", "hip", "number", "", 'min="40" max="250" step="0.1" required')}</div>${area("Observações", "note", "", 'maxlength="1000"')}`, "Registrar avaliação")}</div>` : ""}<div class="card"><h2>Seu corpo ao longo do tempo</h2>${c.consents.body3d ? '<div id="bodyViewer"></div>' : `<p class="muted">O modelo 3D precisa de autorização específica do paciente.</p>${s.user.role === "patient" ? button("Revisar autorizações", "consents") : ""}`}</div><div class="card"><h3>Avaliações registradas</h3>${a.items.map((x) => `<div class="item"><b>${esc(x.date)}</b>${x.superseded?'<span class="badge">Versão anterior</span>':''}<p>${x.weight} kg · cintura ${x.waist} cm · quadril ${x.hip} cm · altura ${x.height} cm</p><small>${esc(x.note)}</small>${s.user.role==='nutritionist'&&!x.superseded?`<div class="actions"><button class="btn" data-correct-assessment="${x.id}">Corrigir avaliação</button></div>`:''}</div>`).join("") || empty("Nenhuma avaliação registrada.")}</div><div class="card"><h3>Fotos privadas</h3>${c.consents.photos ? `${form("photo", '<label>Foto de evolução<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required></label>', "Salvar foto privada")}<div class="files list">${fileList(f.items.filter((x) => x.kind === "photo"))}</div>` : '<p class="note">O paciente não autorizou o armazenamento de fotos.</p>'}</div></div>`,
    g,
  );
  if (c.consents.body3d && g === s.generation) {
    const d = await read(patient("body3d"));
    if (g === s.generation) {
      const host = document.querySelector("#bodyViewer"),
        dispose = mountBody3D(host, d.items);
      const timer = setInterval(async () => {
        try {
          await read(patient("body3d"));
        } catch (e) {
          if (e.name !== "AbortError" && g === s.generation) {
            dispose();
            clearInterval(timer);
            host.innerHTML = empty(
              "A autorização do modelo foi revogada ou sua sessão expirou.",
            );
          }
        }
      }, 5000);
      s.cleanup = () => {
        clearInterval(timer);
        dispose();
      };
    }
  }
}
async function clinical(g) {
  const [d, i, h, goals] = await Promise.all(
    ["diary", "intake", "habits", "goals"].map((x) => read(patient(x))),
  );
  const intake = i.items[0] || {};
  paint(
    `<div class="stack">${
      s.user.role === "patient"
        ? `<div class="card"><h2>Como foi seu dia?</h2>${form(
            "diary",
            input("Data", "date", "date", localDate(), "required") +
              select(
                "Como se sentiu",
                "feeling",
                ["Satisfeita", "Com fome", "Tranquila", "Ansiosa"].map((x) => [
                  x,
                  x,
                ]),
              ) +
              area("Seu registro", "text", "", 'required maxlength="2000"'),
            "Salvar no diário",
          )}</div>`
        : `<div class="card"><h2>Meta de hábito</h2>${form("goal", input("Hábito", "title", "text", goals.items[0]?.title || "", 'required maxlength="100"') + `<div class="two">${input("Dias da semana", "days", "number", 5, 'min="1" max="7" required')}${input("Início da semana", "start", "date", localDate(), "required")}</div>`, "Definir meta")}</div>`
    }<div class="card"><h2>Diário</h2>${d.items.map((x) => `<article class="item"><small>${esc(x.date)} · ${esc(x.feeling)}</small><p>${esc(x.text)}</p></article>`).join("") || empty("Nenhum registro no diário.")}</div><div class="card"><h2>Ficha de acompanhamento</h2>${
      s.user.role === "patient"
        ? form(
            "intake",
            area(
              "Alergias ou intolerâncias",
              "allergies",
              intake.allergies,
              'maxlength="500"',
            ) +
              area(
                "Remédios em uso",
                "medication",
                intake.medication,
                'maxlength="500"',
              ) +
              input("Sono", "sleep", "text", intake.sleep, 'maxlength="100"') +
              area(
                "Objetivo",
                "objective",
                intake.objective,
                'maxlength="500"',
              ) +
              area("Observações", "note", intake.note, 'maxlength="1000"'),
            "Atualizar ficha",
          )
        : `<div class="list">${[
            ["Alergias", "allergies"],
            ["Remédios", "medication"],
            ["Sono", "sleep"],
            ["Objetivo", "objective"],
            ["Observações", "note"],
          ]
            .map(
              ([label, key]) =>
                `<div class="item"><b>${label}</b><p>${esc(intake[key] || "Ainda não informado.")}</p></div>`,
            )
            .join("")}</div>`
    }</div><div class="card"><h3>Histórico de hábitos</h3>${h.items.map((x) => `<div class="item">${esc(x.date)} · ${x.water} L de água · meta ${x.goalDone ? "cumprida" : "não marcada"}</div>`).join("") || empty("Nenhum dia registrado.")}</div></div>`,
    g,
  );
}
async function messages(g) {
  const [m, f] = await Promise.all([
    read(patient("messages")),
    read(patient("files")),
  ]);
  paint(
    `<div class="stack"><div class="card"><div class="thread">${
      m.items
        .slice()
        .reverse()
        .map(
          (x) =>
            `<div class="bubble ${x.from === s.user.id ? "mine" : ""}"><small>${esc(x.name)} · ${prettyDate(x.created)}</small>${esc(x.text)}</div>`,
        )
        .join("") || empty("Comece a conversa com seu acompanhamento.")
    }</div><hr class="divider">${form("message", area("Mensagem privada", "text", "", 'required maxlength="2000"'), "Enviar mensagem")}</div><div class="card"><h3>Exames e anexos privados</h3>${form("exam", '<label>Arquivo de até 8 MB<input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required></label>', "Enviar anexo")}<div class="list">${fileList(f.items.filter((x) => x.kind === "exam"))}</div></div><p class="note">Evite exames e fotos do corpo no WhatsApp. Use os anexos privados.</p></div>`,
    g,
  );
}
function patientOptions() {
  return s.patients
    .filter((x) => x.status === "active")
    .map((x) => [x.id, x.name]);
}
async function agenda(g) {
  const d = await read("/appointments"),
    r = s.user.role === "nutritionist" ? await read("/reminders") : null;
  paint(
    `<div class="stack">${
      s.user.role === "nutritionist"
        ? `<div class="card"><h2>Agendar consulta</h2>${form(
            "appointment",
            select("Paciente", "patientId", patientOptions(), s.pid) +
              `<div class="two">${input("Data e hora local", "start", "datetime-local", "", "required")}${input("Duração em minutos", "minutes", "number", 60, 'min="10" max="240" required')}</div>` +
              select("Modalidade", "mode", [
                ["online", "Online"],
                ["presencial", "Presencial"],
              ]) +
              area("Observações", "note", "", 'maxlength="500"'),
            "Agendar consulta",
          )}</div>`
        : ""
    }<div class="card"><h2>Consultas</h2>${d.items.map((x) => `<article class="item"><div class="row between"><div><b>${s.user.role === "nutritionist" ? esc(x.patientName) : "Sua consulta"}</b><p>${prettyDate(x.start)} · ${esc(x.mode)}</p></div><span class="pill">${esc({ scheduled: "Agendada", confirmed: "Confirmada", cancelled: "Cancelada", completed: "Realizada", missed: "Não compareceu" }[x.status])}</span></div>${["scheduled", "confirmed"].includes(x.status) ? `<div class="actions">${x.status === "scheduled" ? `<button class="btn" data-appointment-status="confirmed" data-id="${x.id}">Confirmar</button>` : ""}<button class="btn danger" data-appointment-status="cancelled" data-id="${x.id}">Cancelar</button>${s.user.role === "nutritionist" ? `<button class="btn" data-reschedule="${x.id}">Reagendar</button><button class="btn" data-appointment-status="completed" data-id="${x.id}">Marcar realizada</button>` : ""}</div><div id="reschedule-${x.id}"></div>` : ""}</article>`).join("") || empty("Nenhuma consulta cadastrada.")}</div>${r ? `<div class="card"><h3>Lembretes</h3><p class="note">${s.config?.whatsapp ? "Canal configurado; consulte os estados de envio." : "Envio automático por WhatsApp ainda não está configurado. Os lembretes ficam pendentes; nenhum envio é simulado como entregue."}</p>${r.items.map((x) => `<div class="item">${prettyDate(x.due)} · ${esc(x.status)}</div>`).join("") || empty("Nenhum lembrete gerado.")}</div>` : ""}</div>`,
    g,
  );
}
async function finance(g) {
  const d = await read("/finance");
  paint(
    `<div class="stack"><div class="two"><div class="card"><small>Recebido</small><div class="metric">${money(d.paid)}</div></div><div class="card"><small>A receber</small><div class="metric">${money(d.pending)}</div></div></div><div class="card"><h2>Novo lançamento</h2>${form(
      "finance",
      select("Paciente", "patientId", patientOptions(), s.pid) +
        input(
          "Descrição",
          "description",
          "text",
          "",
          'required maxlength="200"',
        ) +
        `<div class="two">${input("Valor (R$)", "amount", "number", "", 'min="0.01" step="0.01" required')}${input("Vencimento", "due", "date", localDate(), "required")}</div>` +
        select("Situação", "status", [
          ["pending", "A receber"],
          ["paid", "Recebido"],
        ]),
      "Registrar lançamento",
    )}</div><div class="card"><h3>Lançamentos</h3>${d.items.map((x) => `<div class="item row between"><span><b>${money(x.amount)}</b> · ${esc(x.description)}<br><small>${esc(x.due)} · ${esc(x.status)}</small></span>${x.status === "pending" ? `<button class="btn" data-pay="${x.id}">Marcar recebido</button>` : ""}${x.status !== "cancelled" ? `<button class="btn danger" data-cancel-finance="${x.id}">Cancelar</button>` : ""}</div>`).join("") || empty("Nenhum lançamento.")}</div></div>`,
    g,
  );
}
async function shopping(g) {
  const list = await read(
    patient("shopping") + "?generate=1&days=" + s.shoppingDays,
  );
  const items = list.items[0]?.items || [];
  paint(
    `<div class="card"><h2>Sua lista de compras</h2><p class="note">As quantidades em gramas são somadas para o período. Porções manuais ficam identificadas para conferência.</p>${form("shopping-period", input("Período em dias", "days", "number", s.shoppingDays, 'min="1" max="31" required'), "Atualizar período")}<hr class="divider">${form("shopping", items.map((x, i) => check("item-" + i, esc(x.name) + (x.grams ? " · " + Math.round(x.grams) + " g" : "") + (x.manual?.length ? " · porções manuais: " + esc(x.manual.join("; ")) + " por dia" : ""), x.done)).join("") + area("Adicionar itens, um por linha", "extra", "", 'maxlength="2000"'), "Salvar lista")}<div id="shoppingNames" hidden>${esc(JSON.stringify(items))}</div></div>`,
    g,
  );
}
function renderRecipeItems() {
  const items = s.recipeDrafts.get(s.pid) || [],
    host = document.querySelector("#recipeItems");
  if (!host) return;
  host.innerHTML =
    items
      .map(
        (x, i) =>
          `<div class="item row between"><span>${esc(x.name)} · ${x.grams} g</span><button class="btn" type="button" data-remove-recipe="${i}">Remover</button></div>`,
      )
      .join("") + macros(totals(items));
}
async function recipes(g) {
  const d = await read(patient("recipes"));
  if (!s.recipeDrafts.has(s.pid)) s.recipeDrafts.set(s.pid, []);
  paint(
    `<div class="stack">${
      s.user.role === "nutritionist"
        ? `<div class="card"><h2>Ingredientes calculados</h2>${form(
            "recipe-add",
            select(
              "Alimento",
              "food",
              s.foods.map((x, i) => [i, x[0]]),
            ) +
              input(
                "Quantidade total na receita (g)",
                "grams",
                "number",
                100,
                'required min="1" max="2000"',
              ),
            "Adicionar ingrediente",
          )}<div id="recipeItems"></div><hr class="divider"><h2>Nova receita</h2>${form("recipe", input("Nome", "name", "text", "", 'required maxlength="150"') + area("Outros ingredientes, sem cálculo (opcional)", "ingredients", "", 'maxlength="3000"') + area("Modo de preparo", "instructions", "", 'required maxlength="3000"') + input("Rendimento em porções", "portions", "number", 1, 'min="1" max="100" required'), "Salvar receita")}</div>`
        : ""
    }<div class="card"><h3>Receitas do plano</h3>${d.items.map((x) => `<details class="item"><summary>${esc(x.name)} · ${x.portions} porções</summary><h3>Ingredientes</h3>${(x.items || []).map((it) => `<p>${esc(it.name)} · ${it.grams} g</p>`).join("")}<p>${esc(x.ingredients).replace(/\n/g, "<br>")}</p><h3>Preparo</h3><p>${esc(x.instructions).replace(/\n/g, "<br>")}</p>${x.nutrition ? `<h3>Por porção</h3>${macros({ ...x.nutrition.perPortion, missing: x.nutrition.missing })}` : ""}<small>${esc(x.source || "")}</small></details>`).join("") || empty("Nenhuma receita cadastrada.")}</div></div>`,
    g,
  );
  if (g === s.generation) renderRecipeItems();
}
async function community(g, publicRoom = false) {
  const prefix = publicRoom ? "/community" : "";
  const r = await read(prefix + "/rooms"),
    room = r.items.find((x) => x.id === s.publicRoomId) || r.items[0];
  if (!room) {
    paint(
      empty(
        "O grupo estará disponível quando houver um vínculo ativo e autorizado.",
      ),
      g,
    );
    return;
  }
  const [p, a] = await Promise.all([
    read(`${prefix}/rooms/${room.id}/posts`),
    s.user.role === "nutritionist"
      ? read(`${prefix}/rooms/${room.id}/alerts`)
      : Promise.resolve({ items: [] }),
  ]);
  paint(
    `<div class="card">${
      publicRoom
        ? select(
            "Sala",
            "publicRoomId",
            r.items.map((x) => [x.id, x.name]),
            room.id,
          )
        : ""
    }<h2>${esc(room.name)}</h2><p class="note">Receitas e constância, sem pesos, doses ou links. Questões clínicas vão para a conversa privada.</p>${a.items.length ? `<div class="server-info">${a.items.length} alerta(s) de cuidado desta sala. O texto bloqueado não é armazenado.</div>` : ""}<div class="list">${p.items.map((x) => `<article class="item"><b>${esc(x.nickname)}</b>${x.nutritionist ? ' <span class="pill">Nutricionista</span>' : ""}<p>${esc(x.text)}</p><div class="row">${x.mine ? `<button class="btn ghost" data-post="delete" data-id="${x.id}" data-room="${room.id}" data-prefix="${prefix}">Apagar</button>` : s.user.role === "nutritionist" ? `<button class="btn ghost" data-post="hide" data-id="${x.id}" data-room="${room.id}" data-prefix="${prefix}">${x.hidden ? "Oculta" : "Ocultar"}</button>` : `<button class="btn ghost" data-post="report" data-id="${x.id}" data-room="${room.id}" data-prefix="${prefix}">Denunciar</button>${!x.nutritionist ? `<button class="btn ghost" data-post="block" data-id="${x.id}" data-room="${room.id}" data-prefix="${prefix}">Bloquear</button>` : ""}`}${x.reported ? '<span class="pill">Denunciada</span>' : ""}</div></article>`).join("") || empty("O grupo ainda não tem mensagens.")}</div><hr class="divider">${form("post", `<input name="room" type="hidden" value="${room.id}"><input name="prefix" type="hidden" value="${prefix}">${area("Publicar no grupo", "text", "", 'required maxlength="280"')}`, "Publicar")}<p class="note">Pacientes usam o apelido e o aceite das regras definidos no perfil.</p></div>`,
    g,
  );
}
function profile(g) {
  const p = s.user.profile || {},
    nut = s.user.role === "nutritionist";
  paint(
    `<div class="stack"><div class="card"><h2>Seu perfil</h2>${form("profile", input("Nome", "name", "text", s.user.name, 'required maxlength="60"') + input("Cidade", "city", "text", p.city, 'maxlength="150"') + area("Bio", "bio", p.bio, 'maxlength="400"') + input("WhatsApp com país e DDD (opcional)", "phone", "tel", p.phone, 'maxlength="15" placeholder="5581999990000"') + (nut ? input("Endereço de atendimento", "address", "text", p.address, 'maxlength="150"') + input("Especialidades", "specialties", "text", p.specialties, 'maxlength="150"') + `<div class="two">${input("Latitude do consultório (opcional)", "lat", "number", p.lat ?? "", 'min="-90" max="90" step="any"')}${input("Longitude do consultório (opcional)", "lng", "number", p.lng ?? "", 'min="-180" max="180" step="any"')}</div><p class="note">Use as coordenadas do consultório para calcular distância. Este endereço será público se você ativar a divulgação.</p>` + check("listed", "Quero aparecer na busca de atendimento com estes dados profissionais.", p.listed) + check("publicRoom", "Quero ser anfitrião de uma sala aberta da comunidade.", p.publicRoom) : input("Apelido no grupo", "nickname", "text", p.nickname, 'maxlength="20"') + check("community", "Tenho 18 anos ou mais e aceito as regras: sem nome real, peso, doses ou links no grupo. Questões clínicas ficam na conversa privada.", p.community)), "Atualizar perfil")}</div><div class="card"><h3>Segurança da conta</h3>${form("password", input("Senha atual", "currentPassword", "password", "", 'required autocomplete="current-password"') + input("Nova senha", "password", "password", "", 'required minlength="12" maxlength="128" autocomplete="new-password"'), "Trocar senha")}</div><div class="card"><h3>Excluir minha conta</h3><p class="note">Apaga sua conta e seus registros próprios. Contas de pacientes são independentes da conta do profissional.</p>${form("delete-account", input("Confirme sua senha", "password", "password", "", 'required autocomplete="current-password"'), "Excluir minha conta e dados")}</div></div>`,
    g,
  );
}
async function render() {
  s.cleanup?.();
  s.cleanup = null;
  s.controller?.abort();
  s.controller = new AbortController();
  const g = ++s.generation;
  s.page = (location.hash.slice(1) || "home").split("?")[0];
  nav();
  try {
    const params = new URLSearchParams(location.search);
    if (params.has("token")) {
      const action = params.get("action"),
        raw = params.get("token");
      history.replaceState(null,"",location.pathname+location.hash);
      if (action === "verify") {
        app.innerHTML =
          '<main id="content" class="auth"><p role="status">Confirmando seu e-mail…</p></main>';
        const verified = await write("/auth/verify", { token: raw });
        if (verified.requiresPassword) {
          s.user = verified.user;
          history.replaceState(null, "", "/#home");
          await render();
          return;
        }
        history.replaceState(null, "", "/#login");
        auth("login");
        toast("E-mail confirmado. Entre na sua conta.");
        return;
      }
      if (action === "reset") {
        app.innerHTML = `<main id="content" class="auth"><div class="card"><h1>Nova senha</h1>${form("reset", `<input name="token" type="hidden" value="${esc(raw)}">${input("Nova senha", "password", "password", "", 'required minlength="12" maxlength="128" autocomplete="new-password"')}`, "Definir nova senha")}</div></main>`;
        return;
      }
    }
    if (!s.user) {
      if (["login", "register", "register-nut", "forgot"].includes(s.page))
        auth(
          s.page === "register-nut" ? "register" : s.page,
          s.page === "register-nut" ? "nutritionist" : "patient",
        );
      else if (s.page === "directory") {
        app.innerHTML =
          '<main id="content" class="landing reveal"><div id="panel"></div></main>';
        await directory(g);
      } else landing();
      return;
    }
    if (s.user.mustChangePassword) {
      app.innerHTML = `<main id="content" class="auth"><div class="card"><h1>Uma senha só sua</h1><p>Troque a senha temporária criada pelo nutricionista antes de abrir seu acompanhamento.</p>${form("password", input("Senha temporária", "currentPassword", "password", "", 'required autocomplete="current-password"') + input("Sua nova senha", "password", "password", "", 'required minlength="12" maxlength="128" autocomplete="new-password"'), "Trocar senha e continuar")}</div></main>`;
      return;
    }
    shell();
    if (s.user.role === "nutritionist") {
      const d = await read("/patients");
      if (g !== s.generation) return;
      s.patients = d.items;
      if (!s.patients.some((x) => x.id === s.pid))
        s.pid =
          s.patients.find((x) => x.status === "active")?.id ||
          s.patients[0]?.id;
    } else s.pid = s.user.id;
    shell();
    if (
      ["plan", "assessments", "clinical", "messages", "recipes"].includes(
        s.page,
      ) &&
      !s.pid
    ) {
      paint(
        empty("Cadastre ou selecione um paciente para abrir o acompanhamento."),
        g,
      );
      return;
    }
    if (s.user.role === "patient" && ["patients", "finance"].includes(s.page))
      throw new Error("Esta área é exclusiva do nutricionista.");
    const pages = {
      home,
      patients,
      consents,
      plan,
      assessments,
      clinical,
      messages,
      agenda,
      finance,
      shopping,
      recipes,
      community,
      "public-community": (g) => community(g, true),
      directory,
      profile,
    };
    await (pages[s.page] || home)(g);
  } catch (e) {
    if (e.name === "AbortError" || g !== s.generation) return;
    if (e.status === 401 && s.user) {
      s.user = null;
      s.drafts.clear();
      s.recipeDrafts.clear();
      nav();
      auth("login");
      toast("Sua sessão expirou. Entre novamente.", true);
      return;
    }
    paint(
      `<div class="card"><p class="error">${esc(e.message)}</p>${s.user?.role === "patient" ? button("Revisar autorizações", "consents") : button("Ver pacientes", "patients")}</div>`,
      g,
    );
  }
}
async function refresh() {
  await session();
  await render();
}
async function encodeFile(file, reencode) {
  if (reencode) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      throw new Error("Use JPG, PNG ou WEBP.");
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height)),
        canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas
        .getContext("2d")
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return {
        mime: "image/jpeg",
        content: canvas.toDataURL("image/jpeg", 0.88).split(",")[1],
      };
    } finally {
      bitmap.close();
    }
  }
  const content = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return { mime: file.type, content };
}
async function submit(f) {
  const pid = s.pid,
    route = (kind) => `/patients/${pid}/${kind}`;
  const name = f.dataset.form,
    values = Object.fromEntries(new FormData(f)),
    submitter = f.querySelector("[type=submit]"),
    err = f.querySelector(".form-error");
  if (f.dataset.busy) return;
  f.dataset.busy = "1";
  err.innerHTML = "";
  submitter.disabled = true;
  try {
    if (name === "register") {
      await write("/auth/register", values);
      f.innerHTML =
        `<div class="success" role="status">Conta preparada! Confira ${s.config?.emailDelivery==='local'?'a caixa de teste do servidor':'seu e-mail'} para ativar o acesso.</div>`;
      return;
    }
    if (name === "login") {
      await write("/auth/login", values);
      await session();
      go("home");
      return;
    }
    if (name === "forgot") {
      const d = await write("/auth/forgot", values);
      f.innerHTML = `<div class="success">${esc(d.message)}</div>`;
      return;
    }
    if (name === "reset") {
      await write("/auth/reset", values);
      history.replaceState(null, "", "/#login");
      auth("login");
      toast("Senha atualizada. Entre novamente.");
      return;
    }
    if (name === "password") {
      await write("/auth/password", values);
      toast("Sua senha foi atualizada.");
      await refresh();
      return;
    }
    if (name === "directory") {
      await searchDirectory(values);
      return;
    }
    if (name === "patient") {
      await write("/patients", values);
      toast(
        "Conta preparada. A confirmação foi encaminhada ao e-mail do paciente.",
      );
      await render();
      return;
    }
    if (name === "consents") {
      await write(
        route("consents"),
        Object.fromEntries(
          ["health", "photos", "body3d", "group", "reminders"].map((k) => [
            k,
            f.elements[k].checked,
          ]),
        ),
        "PUT",
      );
      toast("Autorizações atualizadas.");
      await refresh();
      return;
    }
    if (name === "profile") {
      const body = { ...values };
      for (const key of ["listed", "community", "publicRoom"])
        if (f.elements[key]) body[key] = f.elements[key].checked;
      for (const key of ["lat", "lng"])
        if (key in body)
          body[key] = body[key] === "" ? null : Number(body[key]);
      await write("/profile", body, "PUT");
      toast("Perfil atualizado.");
      await refresh();
      return;
    }
    if (name === "add-food") {
      const grams = Number(values.grams),
        food = s.foods[selectedFood];
      if (!food || grams < 1 || grams > 2000)
        throw new Error("Selecione o alimento e uma quantidade válida.");
      s.drafts
        .get(pid)
        .items.push({
          catalogVersion: s.catalogVersion,
          foodId: selectedFood,
          name: food[0],
          grams,
          portion: grams + " g",
          meal: values.meal,
          k: Math.round((food[1] * grams) / 100),
          p: (food[2] * grams) / 100,
          c: (food[3] * grams) / 100,
          f: (food[4] * grams) / 100,
        });
      renderPlanItems();
      toast("Alimento adicionado ao rascunho.");
      return;
    }
    if (name === "publish") {
      const draft = s.drafts.get(pid);
      draft.note = values.note;
      await write(
        route("plan"),
        { ...draft, catalogVersion: s.catalogVersion },
        "PUT",
      );
      s.drafts.delete(pid);
      toast("Nova versão publicada para este paciente.");
      await render();
      return;
    }
    if (name === "habits")
      await write(
        route("habits"),
        {
          date: localDate(),
          water: Number(values.water),
          goalDone: f.elements.goalDone.checked,
        },
        "PUT",
      );
    else if (name === "assessment") await write(route("assessments")+(values.id?"/"+values.id:""), values,values.id?"PUT":"POST");
    else if (name === "choices")
      await write(
        route("choices"),
        { text: values.text, date: localDate() },
        "PUT",
      );
    else if (name === "diary") await write(route("diary"), values);
    else if (name === "intake") await write(route("intake"), values, "PUT");
    else if (name === "goal") await write(route("goals"), values, "PUT");
    else if (name === "message") await write(route("messages"), values);
    else if (name === "appointment")
      await write("/appointments", {
        ...values,
        start: new Date(values.start).toISOString(),
      });
    else if (name === "reschedule")
      await write(
        "/appointments/" + values.id,
        {
          start: new Date(values.start).toISOString(),
          minutes: Number(values.minutes),
        },
        "PUT",
      );
    else if (name === "finance")
      await write("/finance", {
        ...values,
        amount: Math.round(Number(values.amount) * 100),
      });
    else if (name === "recipe") {
      await write(route("recipes"), {
        ...values,
        items: s.recipeDrafts.get(pid) || [],
        catalogVersion: s.catalogVersion,
      });
      s.recipeDrafts.delete(pid);
    } else if (name === "recipe-add") {
      const id = Number(values.food),
        g = Number(values.grams),
        food = s.foods[id];
      s.recipeDrafts
        .get(pid)
        .push({
          foodId: id,
          catalogVersion: s.catalogVersion,
          name: food[0],
          grams: g,
          k: Math.round((food[1] * g) / 100),
          p: (food[2] * g) / 100,
          c: (food[3] * g) / 100,
          f: (food[4] * g) / 100,
        });
      renderRecipeItems();
      return;
    } else if (name === "shopping-period") {
      s.shoppingDays = Number(values.days);
      await render();
      return;
    } else if (name === "shopping") {
      const initial = JSON.parse(
          document.querySelector("#shoppingNames").textContent,
        ),
        items = initial.map((x, i) => ({
          ...x,
          done: !!f.elements["item-" + i]?.checked,
        }));
      for (const line of values.extra
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean))
        if (!items.some((x) => x.name === line))
          items.push({ name: line, done: false, extra: true });
      await write(route("shopping"), { items, days: s.shoppingDays }, "PUT");
    } else if (name === "post")
      await write(`${values.prefix || ""}/rooms/${values.room}/posts`, {
        text: values.text,
      });
    else if (name === "photo" || name === "exam") {
      const file = f.elements.file.files[0];
      if (!file) throw new Error("Escolha um arquivo.");
      if (file.size > 8 * 1024 * 1024)
        throw new Error("O arquivo deve ter até 8 MB.");
      const encoded = await encodeFile(file, name === "photo");
      await write(route("files"), {
        kind: name === "photo" ? "photo" : "exam",
        name: file.name,
        ...encoded,
      });
    } else if (name === "delete-account") {
      if (!confirm("Excluir sua conta e seus dados? Esta ação é permanente."))
        return;
      await write("/account", values, "DELETE");
      s.user = null;
      s.links = [];
      s.patients = [];
      s.drafts.clear();
      s.recipeDrafts.clear();
      go("home");
      toast("Conta excluída.");
      return;
    }
    toast("Salvo com sucesso.");
    await render();
  } catch (e) {
    if (f.isConnected) err.innerHTML = `<p class="error">${esc(e.message)}</p>`;
    else toast(e.message, true);
  } finally {
    if (submitter.isConnected) {
      submitter.disabled = false;
      delete f.dataset.busy;
    }
  }
}
document.addEventListener("submit", (e) => {
  if (e.target.matches("[data-form]")) {
    e.preventDefault();
    submit(e.target);
  }
});
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.id === "foodSearch") renderFoodResults(el.value);
  if (el.name === "grams" && el.closest("[data-form=add-food]"))
    foodPreview(el.value);
  if (el.name === "note" && el.closest("[data-form=publish]"))
    s.drafts.get(s.pid).note = el.value;
  if (el.matches("[data-edit]")) {
    const item = s.drafts.get(s.pid).items[
      Number(el.closest("[data-plan-item]").dataset.planItem)
    ];
    item[el.dataset.edit] = el.value;
    if (["name", "portion"].includes(el.dataset.edit))
      for (const k of ["foodId", "grams", "k", "p", "c", "f"]) delete item[k];
    document.querySelector("#planTotals").innerHTML = macros(
      totals(s.drafts.get(s.pid).items),
    );
  }
});
document.addEventListener("change", (e) => {
  if (e.target.name === "role") {
    const crn = document.querySelector("#crnField");
    crn.hidden = e.target.value !== "nutritionist";
    crn.querySelector("input").required = !crn.hidden;
  }
  if (e.target.name === "publicRoomId") {
    s.publicRoomId = e.target.value;
    render();
  }
  if (e.target.id === "patientPicker") {
    s.pid = e.target.value;
    render();
  }
});
document.addEventListener("click", async (e) => {
  const el = e.target.closest("button,a");
  if (!el) return;
  try {
    if (el.dataset.go) {
      const action = el.dataset.go;
      if (action === "logout") {
        await write("/auth/logout", {});
        s.user = null;
        s.links = [];
        s.patients = [];
        s.pid = null;
        s.drafts.clear();
        s.recipeDrafts.clear();
        go("home");
        return;
      }
      if (action === "locate") {
        if (!navigator.geolocation)
          throw new Error(
            "Seu navegador não oferece localização. Informe uma cidade.",
          );
        el.disabled = true;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            el.disabled = false;
            searchDirectory({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          () => {
            el.disabled = false;
            toast(
              "Localização não autorizada ou indisponível. Você pode buscar pela cidade.",
              true,
            );
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        );
        return;
      }
      if (action === "save-draft") {
        const pid = s.pid;
        await write(
          `/patients/${pid}/plan-draft`,
          { ...s.drafts.get(pid), catalogVersion: s.catalogVersion },
          "PUT",
        );
        toast("Rascunho salvo, sem publicar.");
        return;
      }
      if (action === "manual-food") {
        s.drafts
          .get(s.pid)
          .items.push({
            name: "Novo alimento",
            portion: "1 porção",
            meal: "Almoço",
          });
        renderPlanItems();
        return;
      }
      go(action);
      return;
    }
    if (el.dataset.removeRecipe !== undefined) {
      s.recipeDrafts.get(s.pid).splice(+el.dataset.removeRecipe, 1);
      renderRecipeItems();
      return;
    }
    if(el.dataset.correctAssessment){const assessment=s.assessmentItems.find(x=>x.id===el.dataset.correctAssessment),f=document.querySelector('[data-form=assessment]');for(const k of ['date','height','weight','waist','hip','note'])f.elements[k].value=assessment[k]||'';let id=f.elements.id;if(!id){id=document.createElement('input');id.type='hidden';id.name='id';f.append(id)}id.value=assessment.id;f.querySelector('[type=submit]').textContent='Salvar correção como nova versão';f.elements.date.focus();return}
    if (el.dataset.food !== undefined) {
      selectFood(+el.dataset.food);
      return;
    }
    if (el.dataset.removeFood !== undefined) {
      s.drafts.get(s.pid).items.splice(+el.dataset.removeFood, 1);
      renderPlanItems();
      return;
    }
    if (el.dataset.requestNut) {
      if (!s.user) {
        go("register");
        toast("Crie sua conta de paciente para solicitar acompanhamento.");
        return;
      }
      await write("/link-request", { nutritionistId: el.dataset.requestNut });
      toast("Solicitação enviada ao profissional.");
      await refresh();
      return;
    }
    if (el.dataset.acceptLink) {
      await write(`/links/${el.dataset.acceptLink}/accept`, {});
      toast("Solicitação aceita. Aguarde as autorizações do paciente.");
      await render();
      return;
    }
    if (el.dataset.endLink) {
      if (!confirm("Encerrar o vínculo e retirar o acesso do profissional?"))
        return;
      await write(`/links/${el.dataset.endLink}/end`, {});
      toast("Vínculo encerrado.");
      await refresh();
      return;
    }
    if (el.dataset.openPatient) {
      s.pid = el.dataset.openPatient;
      go("clinical");
      return;
    }
    if (el.dataset.appointmentStatus) {
      await write(
        "/appointments/" + el.dataset.id,
        { status: el.dataset.appointmentStatus },
        "PUT",
      );
      toast("Consulta atualizada.");
      await render();
      return;
    }
    if (el.dataset.reschedule) {
      document.querySelector("#reschedule-" + el.dataset.reschedule).innerHTML =
        form(
          "reschedule",
          `<input name="id" type="hidden" value="${el.dataset.reschedule}">${input("Novo horário", "start", "datetime-local", "", "required")}${input("Duração (minutos)", "minutes", "number", 60, 'min="10" max="240" required')}`,
          "Salvar novo horário",
        );
      return;
    }
    if (el.dataset.pay || el.dataset.cancelFinance) {
      await write(
        "/finance/" + (el.dataset.pay || el.dataset.cancelFinance),
        { status: el.dataset.pay ? "paid" : "cancelled" },
        "PUT",
      );
      await render();
      return;
    }
    if (el.dataset.deleteFile) {
      if (!confirm("Apagar este arquivo?")) return;
      await write(patient("files") + "/" + el.dataset.deleteFile, {}, "DELETE");
      await render();
      return;
    }
    if (el.dataset.download) {
      const response = await fetch("/api/files/" + el.dataset.download, {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!response.ok)
        throw new Error("Arquivo indisponível ou sem autorização.");
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = blob.type === "application/pdf" ? "exame.pdf" : "imagem";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    if (el.dataset.post) {
      await write(
        `${el.dataset.prefix || ""}/rooms/${el.dataset.room}/posts/${el.dataset.id}`,
        { action: el.dataset.post },
        el.dataset.post === "delete" ? "DELETE" : "PUT",
      );
      await render();
      return;
    }
  } catch (err) {
    toast(err.message, true);
  }
});
window.addEventListener("hashchange", render);
async function boot() {
  try {
    s.config = await request("/config");
    const catalog = await request("/catalog");
    s.foods = catalog.items;
    s.catalogVersion = catalog.version;
    s.catalogSource = catalog.source.name;
    try {
      await session();
    } catch (e) {
      if (e.status !== 401) throw e;
    }
  } catch {
    s.config = null;
  }
  await render();
}
boot();

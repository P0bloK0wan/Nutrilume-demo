export async function request(path, { method = "GET", body, signal } = {}) {
  let r;
  try {
    r = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw Object.assign(new Error("Falha de conexão. Não confirmamos o envio. O texto permanece nesta tela; confira e tente novamente."), { status: 0 });
  }
  const type = r.headers.get("content-type") || "";
  if (!type.includes("application/json"))
    throw Object.assign(
      new Error(
        "Esta página precisa do servidor Nutrilume. A demonstração continua disponível.",
      ),
      { status: 503 },
    );
  const data = await r.json();
  if (!r.ok)
    throw Object.assign(new Error(data.error || "Não foi possível concluir."), {
      status: r.status,
    });
  return data;
}
export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const localDate = () => new Date().toLocaleDateString("en-CA");
export const money = (v) =>
  (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const prettyDate = (v) =>
  new Date(v).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

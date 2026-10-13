(() => {
  "use strict";

  /* ---------- constants ---------- */
  const DEBUT = "2022-07-22";
  // Stack order below is the validated categorical order (CVD-safe adjacency in both themes).
  const STACK = ["tv", "mv", "ad", "live", "music", "web", "goods", "magazine", "tweet"];
  const CATS = {
    music:    { ja: "楽曲",   en: "Music",    color: "var(--c-music)",    ratio: "1 / 1" },
    mv:       { ja: "映像",   en: "Video",    color: "var(--c-mv)",       ratio: "16 / 9" },
    tv:       { ja: "テレビ", en: "TV",       color: "var(--c-tv)",       ratio: "16 / 10" },
    magazine: { ja: "雑誌",   en: "Magazine", color: "var(--c-magazine)", ratio: "4 / 5" },
    web:      { ja: "WEB",    en: "Web",      color: "var(--c-web)",      ratio: "16 / 10" },
    ad:       { ja: "広告",   en: "Ad",       color: "var(--c-ad)",       ratio: "4 / 5" },
    tweet:    { ja: "X投稿",  en: "X",        color: "var(--c-tweet)",    ratio: "1 / 1" },
    goods:    { ja: "グッズ", en: "Goods",    color: "var(--c-goods)",    ratio: "1 / 1" },
    live:     { ja: "ライブ", en: "Live",     color: "var(--c-live)",     ratio: "16 / 10" }
  };
  const ENTITIES = { newjeans: "NewJeans", njz: "NJZ" };
  const DATE_TYPES = { release: "release", announce: "announce", broadcast: "broadcast", publish: "publish", post: "post", sale_start: "on sale", event: "event" };
  const MEMBERS = { all: "all", minji: "Minji", hanni: "Hanni", danielle: "Danielle", haerin: "Haerin", hyein: "Hyein" };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const KIND_TAGS = ["teaser", "trailer", "concept-film", "lyric-video", "track-video", "dance-practice", "performance", "stage-cam"];

  const state = {
    items: [], eras: [], images: {},
    cats: new Set(Object.keys(CATS)), entities: new Set(Object.keys(ENTITIES)),
    q: "", onlyVerified: false, sort: "asc", view: "timeline"
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, text) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (k === "class") n.className = v; else n.setAttribute(k, v); }
    if (text != null) n.textContent = text;
    return n;
  };
  const svgEl = (tag, attrs = {}) => { const n = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
  const dayNum = date => Math.round((Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) - Date.UTC(2022, 6, 22)) / 86400000) + 1;
  const dayLabel = date => { const n = dayNum(date); return n <= 0 ? `D${n - 1}` : `DAY ${n}`; };
  const dayShort = date => { const n = dayNum(date); return n <= 0 ? `D${n - 1}` : `D${n}`; };
  const sortKey = it => `${it.date} ${it.time || "99:99"} ${it.id}`;

  /* ---------- theme ---------- */
  function initTheme() {
    let saved = null; try { saved = localStorage.getItem("njas-theme"); } catch (_) {}
    if (saved === "dark" || saved === "light") document.documentElement.dataset.theme = saved;
    $("#theme-btn").addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("njas-theme", next); } catch (_) {}
    });
  }

  /* ---------- url state ---------- */
  function readHash() {
    try {
      const p = new URLSearchParams(location.hash.replace(/^#/, ""));
      if (p.get("cat")) state.cats = new Set(p.get("cat").split(",").filter(c => CATS[c]));
      if (p.get("ent")) state.entities = new Set(p.get("ent").split(",").filter(e => ENTITIES[e]));
      if (p.get("q")) state.q = p.get("q");
      if (p.get("v") === "1") state.onlyVerified = true;
      if (p.get("sort") === "desc") state.sort = "desc";
      if (p.get("view") === "grid") state.view = "grid";
    } catch (_) {}
  }
  function writeHash() {
    const p = new URLSearchParams();
    if (state.cats.size !== Object.keys(CATS).length) p.set("cat", [...state.cats].join(","));
    if (state.entities.size !== Object.keys(ENTITIES).length) p.set("ent", [...state.entities].join(","));
    if (state.q) p.set("q", state.q);
    if (state.onlyVerified) p.set("v", "1");
    if (state.sort === "desc") p.set("sort", "desc");
    if (state.view === "grid") p.set("view", "grid");
    const h = p.toString();
    history.replaceState(null, "", h ? "#" + h : location.pathname);
  }

  /* ---------- data ---------- */
  async function load() {
    const manifest = await (await fetch("data/manifest.json", { cache: "no-store" })).json();
    const lists = await Promise.all(manifest.files.map(async f => {
      const r = await fetch("data/" + f, { cache: "no-store" });
      if (!r.ok) throw new Error("failed to load data/" + f);
      return r.json();
    }));
    state.items = lists.flat();
    try { state.eras = await (await fetch("data/eras.json", { cache: "no-store" })).json(); } catch (_) { state.eras = []; }
    try { const r = await fetch("media/auto/index.json", { cache: "no-store" }); if (r.ok) state.images = await r.json(); } catch (_) {}
  }
  function imageOf(it) {
    if (it.image && it.image.path) return { src: "media/" + it.image.path, from: it.image.source_url || it.source_url, local: true };
    if (it.local_assets && it.local_assets.length) return { src: "media/" + it.local_assets[0], from: it.source_url, local: true };
    const a = state.images[it.id];
    if (a) return { src: "media/auto/" + a.file, from: a.page_url, local: true };
    if (it.media && it.media.type === "youtube" && it.media.ref) return { src: `https://i.ytimg.com/vi/${it.media.ref}/hqdefault.jpg`, from: it.source_url, local: false };
    return null;
  }
  const eraOf = date => state.eras.find(e => date >= e.start && (!e.end || date <= e.end));

  /* ---------- controls ---------- */
  function buildControls() {
    const cc = $("#cat-chips");
    for (const [k, v] of Object.entries(CATS)) {
      const b = el("button", { class: "chip", type: "button", "data-cat": k, "aria-pressed": "true" });
      b.style.setProperty("--chip", v.color);
      b.append(el("i", { class: "sw" }), el("span", {}, v.en));
      b.addEventListener("click", e => {
        if (e.altKey || e.metaKey) state.cats = new Set([k]);
        else { if (state.cats.has(k)) state.cats.delete(k); else state.cats.add(k); }
        if (state.cats.size === 0) state.cats = new Set(Object.keys(CATS));
        render();
      });
      cc.appendChild(b);
    }
    const ec = $("#entity-chips");
    for (const [k, v] of Object.entries(ENTITIES)) {
      const b = el("button", { class: "chip", type: "button", "data-ent": k, "aria-pressed": "true" }, v);
      b.addEventListener("click", () => {
        if (state.entities.has(k)) state.entities.delete(k); else state.entities.add(k);
        if (state.entities.size === 0) state.entities = new Set(Object.keys(ENTITIES));
        render();
      });
      ec.appendChild(b);
    }
    $("#filters-toggle").addEventListener("click", () => { const tb = $("#toolbar"); const open = tb.classList.toggle("open"); $("#filters-toggle").setAttribute("aria-expanded", String(open)); });
    document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => { state.view = b.dataset.view; render(); }));
    $("#q").addEventListener("input", e => { state.q = e.target.value.trim(); render(); });
    $("#only-verified").addEventListener("change", e => { state.onlyVerified = e.target.checked; render(); });
    $("#sort").addEventListener("click", () => { state.sort = state.sort === "desc" ? "asc" : "desc"; render(); });

    const counters = $("#counters");
    for (const [k, v] of Object.entries(CATS)) {
      const c = el("div", { class: "counter", "data-count": k, role: "button", tabindex: "0", title: `${v.ja}のみ表示` });
      c.style.setProperty("--cc", v.color);
      c.append(el("span", { class: "n" }, "0"), el("span", { class: "l mono dim" }, v.en), el("span", { class: "l-jp" }, v.ja));
      const only = () => { state.cats = new Set([k]); render(); $("#toolbar").scrollIntoView({ block: "start" }); };
      c.addEventListener("click", only);
      c.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); only(); } });
      counters.appendChild(c);
    }
    $("#lightbox").addEventListener("click", e => { if (e.target === e.currentTarget || e.target.closest(".lb-close")) closeLightbox(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });
  }
  function syncControls() {
    document.querySelectorAll("[data-cat]").forEach(b => b.setAttribute("aria-pressed", String(state.cats.has(b.dataset.cat))));
    document.querySelectorAll("[data-ent]").forEach(b => b.setAttribute("aria-pressed", String(state.entities.has(b.dataset.ent))));
    $("#filters-toggle").addEventListener("click", () => { const tb = $("#toolbar"); const open = tb.classList.toggle("open"); $("#filters-toggle").setAttribute("aria-expanded", String(open)); });
    document.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(state.view === b.dataset.view)));
    $("#q").value = state.q;
    $("#only-verified").checked = state.onlyVerified;
    $("#sort").textContent = state.sort === "desc" ? "NEWEST ↓" : "OLDEST ↑";
  }
  function fillCounters() {
    const counts = {};
    for (const it of state.items) counts[it.category] = (counts[it.category] || 0) + 1;
    document.querySelectorAll("[data-count]").forEach(c => { $(".n", c).textContent = counts[c.dataset.count] || 0; });
    const years = state.items.map(i => i.date.slice(0, 4));
    if (years.length) $("#mast-range").textContent = `${Math.min(...years)} — ${Math.max(...years)}`;
  }

  /* ---------- filtering ---------- */
  function matches(it) {
    if (!state.cats.has(it.category)) return false;
    if (!state.entities.has(it.entity)) return false;
    if (state.onlyVerified && !it.verified) return false;
    if (state.q) {
      const hay = [it.title?.ja, it.title?.en, it.title?.original, it.summary?.ja, it.summary?.en, it.note, it.date, ...(it.tags || []), ...(it.members || [])].filter(Boolean).join(" ").toLowerCase();
      for (const term of state.q.toLowerCase().split(/\s+/)) if (term && !hay.includes(term)) return false;
    }
    return true;
  }
  function fmtDate(it) {
    const [y, m, d] = it.date.split("-");
    if (it.date_precision === "year") return y;
    if (it.date_precision === "month") return `${y}.${m}`;
    return `${y}.${m}.${d}`;
  }

  /* ---------- lightbox ---------- */
  function openLightbox(it, img) {
    const lb = $("#lightbox");
    $("#lb-img").src = img.src; $("#lb-img").alt = it.title.ja;
    $("#lb-meta").textContent = `${fmtDate(it)} · ${dayLabel(it.date)} · ${CATS[it.category]?.en || it.category}`;
    $("#lb-title").textContent = `${it.title.ja} — ${it.title.en}`;
    const links = $("#lb-links"); links.innerHTML = "";
    links.append(el("a", { href: "#" + it.id, class: "lb-jump" }, "show in timeline"), el("a", { href: img.from, target: "_blank", rel: "noopener" }, "image source"));
    $(".lb-jump", links).addEventListener("click", e => { e.preventDefault(); closeLightbox(); if (state.view !== "timeline") { state.view = "timeline"; render(); } document.getElementById(it.id)?.scrollIntoView({ block: "center" }); });
    lb.hidden = false; document.body.style.overflow = "hidden";
  }
  function closeLightbox() { const lb = $("#lightbox"); if (lb.hidden) return; lb.hidden = true; $("#lb-img").src = ""; document.body.style.overflow = ""; }

  /* ---------- entry ---------- */
  function renderItem(it) {
    const node = $("#tpl-item").content.firstElementChild.cloneNode(true);
    const cat = CATS[it.category] || { ja: it.category, en: it.category, color: "var(--rule)", ratio: "16 / 10" };
    node.style.setProperty("--cat", cat.color);
    node.id = it.id;
    const d = $(".date", node); d.textContent = fmtDate(it); d.setAttribute("datetime", it.date);
    const dt = $(".dtype", node); dt.textContent = `${dayLabel(it.date)} · ${DATE_TYPES[it.date_type] || it.date_type}${it.time ? " " + it.time : ""}`;
    const kind = (it.tags || []).find(t => KIND_TAGS.includes(t));
    $(".cat-label", node).textContent = `${cat.en} · ${cat.ja}${kind ? " · " + kind.replace("-", " ") : ""}`;
    if (it.entity === "njz") $(".entity", node).hidden = false;
    if (it.members && it.members.length && !(it.members.length === 1 && it.members[0] === "all")) { const m = $(".members", node); m.hidden = false; m.textContent = it.members.map(x => MEMBERS[x] || x).join(" · "); }
    if (it.date_precision !== "day") { const p = $(".prec", node); p.hidden = false; p.textContent = it.date_precision === "month" ? "month only" : "year only"; }
    if (!it.verified) $(".unverified", node).hidden = false;
    $(".t-ja", node).textContent = it.title.ja;
    $(".t-en", node).textContent = it.title.en;
    if (it.title.original && it.title.original !== it.title.ja && it.title.original !== it.title.en) { const o = $(".t-orig", node); o.hidden = false; o.textContent = it.title.original; }
    if (it.summary?.ja || it.summary?.en) {
      $(".desc", node).hidden = false;
      if (it.summary.ja) $(".s-ja", node).textContent = it.summary.ja; else $(".s-ja", node).remove();
      if (it.summary.en) $(".s-en", node).textContent = it.summary.en; else $(".s-en", node).remove();
    }
    if (it.note) { const n = $(".note", node); n.hidden = false; n.textContent = it.note; }

    const img = imageOf(it);
    const isYt = it.media && it.media.type === "youtube" && it.media.ref;
    if (img) {
      const fig = $(".thumb", node); fig.hidden = false; fig.style.setProperty("--ratio", cat.ratio);
      const im = el("img", { src: img.src, alt: "", loading: "lazy", decoding: "async" });
      fig.appendChild(im);
      if (isYt) {
        fig.classList.add("is-video");
        fig.appendChild(el("span", { class: "play mono" }, "▶ PLAY"));
        fig.addEventListener("click", () => {
          const box = $(".media", node); box.hidden = false; box.innerHTML = "";
          box.appendChild(el("iframe", { src: `https://www.youtube-nocookie.com/embed/${it.media.ref}?autoplay=1`, allow: "autoplay; encrypted-media; picture-in-picture", allowfullscreen: "", title: it.title.en }));
          fig.hidden = true;
        });
      } else {
        fig.addEventListener("click", () => openLightbox(it, img));
      }
    }
    if (it.local_assets && it.local_assets.length > 1) {
      const box = $(".assets", node); box.hidden = false;
      for (const p of it.local_assets.slice(1)) { const a = el("a", { href: "media/" + p, target: "_blank", rel: "noopener" }); a.appendChild(el("img", { src: "media/" + p, alt: it.title.ja, loading: "lazy" })); box.appendChild(a); }
    }
    const links = $(".links", node);
    if (isYt) links.appendChild(el("a", { href: `https://www.youtube.com/watch?v=${it.media.ref}`, target: "_blank", rel: "noopener" }, "youtube"));
    if (it.media && it.media.type === "x" && it.media.ref) links.appendChild(el("a", { href: it.media.ref, target: "_blank", rel: "noopener" }, "open on x"));
    links.appendChild(el("a", { href: it.source_url, target: "_blank", rel: "noopener" }, "source"));
    (it.reference_urls || []).forEach((u, i) => links.appendChild(el("a", { href: u, target: "_blank", rel: "noopener" }, `ref ${i + 1}`)));
    if (it.tags && it.tags.length) { const t = $(".tags", node); t.hidden = false; it.tags.forEach(x => t.appendChild(el("span", {}, x))); }
    return node;
  }

  function renderEraHead(era) {
    const h = el("section", { class: "era-head", id: era.id });
    h.style.setProperty("--era", era.accent || "var(--ink)");
    const src = era.image && state.images[era.image] ? "media/auto/" + state.images[era.image].file : null;
    if (src) { h.classList.add("has-img"); h.appendChild(el("img", { class: "era-img", src, alt: "", loading: "lazy" })); }
    const body = el("div", { class: "era-body" });
    const range = `${era.start.replace(/-/g, ".")} — ${era.end ? era.end.replace(/-/g, ".") : "now"} · DAY ${dayNum(era.start)}${era.end ? " – " + dayNum(era.end) : " –"}`;
    body.append(el("span", { class: "era-kicker mono" }, "ERA · 活動期"), el("h2", { class: "era-title" }, era.title.en), el("p", { class: "era-sub" }, era.title.ja), el("p", { class: "era-cap" }, era.caption?.ja || ""), el("p", { class: "era-range mono" }, range));
    h.appendChild(body);
    return h;
  }

  let observer = null;
  function observe(nodes) {
    if (observer) observer.disconnect();
    if (!("IntersectionObserver" in window)) { nodes.forEach(n => n.classList.add("in")); return; }
    observer = new IntersectionObserver(entries => { for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); observer.unobserve(e.target); } }, { rootMargin: "0px 0px -5% 0px" });
    nodes.forEach(n => observer.observe(n));
  }

  /* ---------- spectrum chart ---------- */
  function monthRange() {
    if (!state.items.length) return [];
    const dates = state.items.map(i => i.date).sort();
    const [y0, m0] = [+dates[0].slice(0, 4), +dates[0].slice(5, 7)];
    const [y1, m1] = [+dates[dates.length - 1].slice(0, 4), +dates[dates.length - 1].slice(5, 7)];
    const out = [];
    for (let y = y0, m = m0; y < y1 || (y === y1 && m <= m1); m++) { if (m > 12) { m = 1; y++; } out.push(`${y}-${String(m).padStart(2, "0")}`); }
    return out;
  }
  function renderSpectrum(list) {
    const svg = $("#spectrum"); svg.innerHTML = "";
    const months = monthRange(); if (!months.length) return;
    const counts = Object.fromEntries(months.map(m => [m, {}]));
    for (const it of list) { const m = it.date.slice(0, 7); counts[m][it.category] = (counts[m][it.category] || 0) + 1; }
    const totals = months.map(m => Object.values(counts[m]).reduce((a, b) => a + b, 0));
    const max = Math.max(1, ...totals);
    const cum = []; let c = 0; for (const t of totals) { c += t; cum.push(c); }
    const W = 1000, H = 160, barH = 92, gap = 2, top = 4, labelY = top + barH + 13, areaTop = top + barH + 22, areaH = H - areaTop - 4;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const n = months.length, slot = W / n, bw = Math.max(2, slot - 2);
    // cumulative area (share x; separate panel below the bars, no dual axis)
    const pts = cum.map((v, i) => [i * slot + slot / 2, areaTop + areaH - (v / Math.max(1, c)) * areaH]);
    const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    svg.appendChild(svgEl("path", { d: `${path} L${pts[pts.length - 1][0].toFixed(1)} ${areaTop + areaH} L${pts[0][0].toFixed(1)} ${areaTop + areaH} Z`, class: "cum-area" }));
    svg.appendChild(svgEl("path", { d: path, class: "cum-line" }));
    svg.appendChild(svgEl("line", { x1: 0, x2: W, y1: areaTop + areaH + 0.5, y2: areaTop + areaH + 0.5, class: "axis" }));
    // bars
    months.forEach((m, i) => {
      const g = svgEl("g", { class: "bar", "data-month": m });
      let y = top + barH;
      for (const cat of STACK) {
        const v = counts[m][cat]; if (!v) continue;
        const h = (v / max) * barH; y -= h;
        const r = svgEl("rect", { x: (i * slot + 1).toFixed(1), y: y.toFixed(1), width: bw.toFixed(1), height: Math.max(0, h - gap).toFixed(1), fill: CATS[cat].color, rx: 1 });
        g.appendChild(r);
      }
      g.appendChild(svgEl("rect", { x: (i * slot).toFixed(1), y: 0, width: slot.toFixed(1), height: H, class: "hit" }));
      const tip = () => {
        const t = $("#spectrum-tip"); const [yy, mm] = m.split("-");
        const parts = STACK.filter(k => counts[m][k]).map(k => `${CATS[k].en} ${counts[m][k]}`).join(" · ");
        t.textContent = `${yy} ${MONTHS[+mm - 1]} · ${totals[i]} entries · cumulative ${cum[i]}${parts ? " — " + parts : ""}`;
        t.hidden = false;
        const rect = svg.getBoundingClientRect(); const x = (i + 0.5) / n;
        t.style.left = `${Math.min(Math.max(x * rect.width, 120), rect.width - 120)}px`;
        g.classList.add("hover");
      };
      g.addEventListener("mouseenter", tip); g.addEventListener("focus", tip);
      g.addEventListener("mouseleave", () => { $("#spectrum-tip").hidden = true; g.classList.remove("hover"); });
      g.addEventListener("click", () => { if (state.view !== "timeline") { state.view = "timeline"; render(); } document.getElementById("m" + m)?.scrollIntoView({ block: "start" }); });
      svg.appendChild(g);
    });
    // year ticks
    months.forEach((m, i) => { if (m.endsWith("-01") || i === 0) { svg.appendChild(svgEl("line", { x1: (i * slot).toFixed(1), x2: (i * slot).toFixed(1), y1: top + barH + 2, y2: top + barH + 8, class: "tick" })); const t = svgEl("text", { x: (i * slot + 4).toFixed(1), y: labelY, class: "tick-label" }); t.textContent = m.slice(0, 4); svg.appendChild(t); } });
    const lab = svgEl("text", { x: W - 4, y: areaTop + 9, class: "tick-label", "text-anchor": "end" }); lab.textContent = `CUMULATIVE ${c}`; svg.appendChild(lab);
    // eras strip
    const strip = $("#eras-strip"); strip.innerHTML = "";
    const first = months[0], last = months[n - 1];
    const idx = m => Math.min(n - 1, Math.max(0, months.indexOf(m)));
    for (const e of state.eras) {
      const a = idx(e.start.slice(0, 7)), b = e.end ? idx(e.end.slice(0, 7)) : n - 1;
      const s = el("a", { class: "era-seg", href: "#" + e.id, title: `${e.title.en} · ${e.title.ja}` });
      s.style.left = `${(a / n) * 100}%`; s.style.width = `${((b - a + 1) / n) * 100}%`; s.style.setProperty("--era", e.accent || "var(--ink)");
      s.appendChild(el("span", { class: "mono" }, e.short || e.title.en));
      s.addEventListener("click", ev => { ev.preventDefault(); if (state.view !== "timeline") { state.view = "timeline"; render(); } document.getElementById(e.id)?.scrollIntoView({ block: "start" }); });
      strip.appendChild(s);
    }
    void first; void last;
  }

  /* ---------- minimap ---------- */
  let mmObserver = null;
  function renderMinimap(years, yearCount) {
    const mm = $("#minimap"); mm.innerHTML = "";
    if (mmObserver) mmObserver.disconnect();
    for (const y of years) {
      const a = el("a", { href: "#y" + y, class: "mm-year", "data-year": y });
      a.append(el("span", { class: "mm-label mono" }, y), el("span", { class: "mm-count mono" }, String(yearCount[y] || 0)));
      mm.appendChild(a);
    }
    if (!("IntersectionObserver" in window)) return;
    const heads = [...document.querySelectorAll(".year-block")];
    mmObserver = new IntersectionObserver(entries => {
      for (const e of entries) {
        const y = e.target.dataset.year; const link = mm.querySelector(`[data-year="${y}"]`);
        if (link) link.classList.toggle("active", e.isIntersecting);
      }
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
    heads.forEach(h => mmObserver.observe(h));
  }

  /* ---------- grid view ---------- */
  function renderGrid(list) {
    const g = $("#grid"); g.innerHTML = "";
    const withImg = list.map(it => [it, imageOf(it)]).filter(([, im]) => im);
    if (!withImg.length) { g.appendChild(el("p", { class: "empty" }, "No images. 画像なし")); return; }
    let curYear = null;
    for (const [it, im] of withImg) {
      const y = it.date.slice(0, 4);
      if (y !== curYear) { curYear = y; g.appendChild(el("h2", { class: "grid-year" }, y)); }
      const tile = el("figure", { class: "tile", tabindex: "0" });
      tile.style.setProperty("--cat", CATS[it.category]?.color || "var(--rule)");
      tile.appendChild(el("img", { src: im.src, alt: it.title.ja, loading: "lazy", decoding: "async" }));
      const cap = el("figcaption", {});
      cap.append(el("span", { class: "mono" }, `${fmtDate(it)} · ${dayShort(it.date)}`), el("span", { class: "tile-title" }, it.title.ja));
      tile.appendChild(cap);
      tile.addEventListener("click", () => openLightbox(it, im));
      tile.addEventListener("keydown", e => { if (e.key === "Enter") openLightbox(it, im); });
      g.appendChild(tile);
    }
  }

  /* ---------- render ---------- */
  function render() {
    syncControls(); writeHash();
    const list = state.items.filter(matches);
    const dir = state.sort === "asc" ? 1 : -1;
    list.sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1) * dir);
    const verified = list.filter(i => i.verified).length;
    $("#foot-stats").textContent = `${list.length} of ${state.items.length} shown · ${verified} verified · ${Object.keys(state.images).length} images`;
    renderSpectrum(list);

    const tl = $("#timeline"), grid = $("#grid"), nav = $("#yearnav"), mm = $("#minimap");
    tl.innerHTML = ""; nav.innerHTML = "";
    if (state.view === "grid") { tl.hidden = true; nav.hidden = true; mm.hidden = true; grid.hidden = false; renderGrid(list); return; }
    grid.hidden = true; tl.hidden = false; nav.hidden = false; mm.hidden = false;
    if (!list.length) { tl.appendChild(el("p", { class: "empty" }, "Nothing here. 該当なし")); mm.innerHTML = ""; return; }

    const yearCount = {};
    for (const it of list) yearCount[it.date.slice(0, 4)] = (yearCount[it.date.slice(0, 4)] || 0) + 1;
    const seenYears = [], seenEras = new Set();
    let curMonth = null, yearBlock = null;
    const frag = document.createDocumentFragment(), entries = [];
    for (const it of list) {
      const y = it.date.slice(0, 4), ym = it.date.slice(0, 7);
      const era = eraOf(it.date);
      if (era && !seenEras.has(era.id)) { seenEras.add(era.id); (yearBlock || frag).appendChild(renderEraHead(era)); }
      if (!seenYears.includes(y)) {
        seenYears.push(y);
        yearBlock = el("div", { class: "year-block", "data-year": y });
        const yh = el("div", { class: "year-head", id: "y" + y });
        yh.append(el("div", { class: "yr" }, y), el("div", { class: "yr-meta mono dim" }, `${yearCount[y]} entries`));
        yearBlock.appendChild(yh); frag.appendChild(yearBlock);
      }
      if (ym !== curMonth) {
        curMonth = ym;
        const mi = parseInt(ym.slice(5, 7), 10) - 1;
        const mh = el("div", { class: "month-head", id: "m" + ym });
        const m = el("div", { class: "m" }, MONTHS[mi]); m.appendChild(el("small", {}, `${mi + 1}月`));
        mh.append(m, el("div", { class: "line" }));
        yearBlock.appendChild(mh);
      }
      const node = renderItem(it); entries.push(node); yearBlock.appendChild(node);
    }
    tl.appendChild(frag);
    for (const y of seenYears) nav.appendChild(el("a", { href: "#y" + y }, y));
    observe(entries);
    renderMinimap(seenYears, yearCount);
  }

  initTheme(); readHash(); buildControls();
  load().then(() => { fillCounters(); render(); if (location.hash && !location.hash.includes("=")) document.getElementById(location.hash.slice(1))?.scrollIntoView(); })
    .catch(err => { $("#timeline").appendChild(el("p", { class: "empty" }, "Failed to load data: " + err.message)); });
})();

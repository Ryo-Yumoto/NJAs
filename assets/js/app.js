(() => {
  "use strict";

  const CATS = {
    music:    { ja: "楽曲",     en: "Music",    color: "var(--c-music)" },
    mv:       { ja: "映像",     en: "Video",    color: "var(--c-mv)" },
    tv:       { ja: "テレビ",   en: "TV",       color: "var(--c-tv)" },
    magazine: { ja: "雑誌",     en: "Magazine", color: "var(--c-magazine)" },
    web:      { ja: "WEB",      en: "Web",      color: "var(--c-web)" },
    ad:       { ja: "広告",     en: "Ad",       color: "var(--c-ad)" },
    tweet:    { ja: "X投稿",    en: "X",        color: "var(--c-tweet)" },
    goods:    { ja: "グッズ",   en: "Goods",    color: "var(--c-goods)" }
  };
  const ENTITIES = { newjeans: "NewJeans", njz: "NJZ" };
  const DATE_TYPES = {
    release: "release", announce: "announce", broadcast: "broadcast", publish: "publish",
    post: "post", sale_start: "on sale", event: "event"
  };
  const MEMBERS = { all: "all", minji: "Minji", hanni: "Hanni", danielle: "Danielle", haerin: "Haerin", hyein: "Hyein" };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const state = {
    items: [],
    cats: new Set(Object.keys(CATS)),
    entities: new Set(Object.keys(ENTITIES)),
    q: "",
    onlyVerified: false,
    sort: "desc"
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, text) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v; else n.setAttribute(k, v);
    }
    if (text != null) n.textContent = text;
    return n;
  };

  /* ---------- theme ---------- */
  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem("njas-theme"); } catch (_) {}
    if (saved === "dark" || saved === "light") document.documentElement.dataset.theme = saved;
    $("#theme-btn").addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme
        || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
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
      if (p.get("sort") === "asc") state.sort = "asc";
    } catch (_) {}
  }
  function writeHash() {
    const p = new URLSearchParams();
    if (state.cats.size !== Object.keys(CATS).length) p.set("cat", [...state.cats].join(","));
    if (state.entities.size !== Object.keys(ENTITIES).length) p.set("ent", [...state.entities].join(","));
    if (state.q) p.set("q", state.q);
    if (state.onlyVerified) p.set("v", "1");
    if (state.sort === "asc") p.set("sort", "asc");
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
  }

  /* ---------- controls ---------- */
  function buildControls() {
    const cc = $("#cat-chips");
    for (const [k, v] of Object.entries(CATS)) {
      const b = el("button", { class: "chip", type: "button", "data-cat": k, "aria-pressed": "true" });
      b.style.setProperty("--chip", v.color);
      b.append(el("i", { class: "sw" }), el("span", {}, v.en));
      b.addEventListener("click", e => {
        if (e.altKey || e.metaKey) { state.cats = new Set([k]); }
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
  }

  function syncControls() {
    document.querySelectorAll("[data-cat]").forEach(b => b.setAttribute("aria-pressed", String(state.cats.has(b.dataset.cat))));
    document.querySelectorAll("[data-ent]").forEach(b => b.setAttribute("aria-pressed", String(state.entities.has(b.dataset.ent))));
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
      const hay = [
        it.title?.ja, it.title?.en, it.title?.original,
        it.summary?.ja, it.summary?.en, it.note, it.date, ...(it.tags || []), ...(it.members || [])
      ].filter(Boolean).join(" ").toLowerCase();
      for (const term of state.q.toLowerCase().split(/\s+/)) {
        if (term && !hay.includes(term)) return false;
      }
    }
    return true;
  }

  function fmtDate(it) {
    const [y, m, d] = it.date.split("-");
    if (it.date_precision === "year") return `${y}`;
    if (it.date_precision === "month") return `${y}.${m}`;
    return `${y}.${m}.${d}`;
  }

  /* ---------- rendering ---------- */
  function renderItem(it) {
    const node = $("#tpl-item").content.firstElementChild.cloneNode(true);
    const cat = CATS[it.category] || { ja: it.category, en: it.category, color: "var(--rule)" };
    node.style.setProperty("--cat", cat.color);
    node.id = it.id;
    const d = $(".date", node); d.textContent = fmtDate(it); d.setAttribute("datetime", it.date);
    $(".dtype", node).textContent = DATE_TYPES[it.date_type] || it.date_type;
    $(".cat-label", node).textContent = `${cat.en} · ${cat.ja}`;
    if (it.entity === "njz") $(".entity", node).hidden = false;
    if (it.members && it.members.length && !(it.members.length === 1 && it.members[0] === "all")) {
      const m = $(".members", node); m.hidden = false; m.textContent = it.members.map(x => MEMBERS[x] || x).join(" · ");
    }
    if (it.date_precision !== "day") { const p = $(".prec", node); p.hidden = false; p.textContent = it.date_precision === "month" ? "month only" : "year only"; }
    if (!it.verified) $(".unverified", node).hidden = false;
    $(".t-ja", node).textContent = it.title.ja;
    $(".t-en", node).textContent = it.title.en;
    if (it.title.original && it.title.original !== it.title.ja && it.title.original !== it.title.en) {
      const o = $(".t-orig", node); o.hidden = false; o.textContent = it.title.original;
    }
    if (it.summary?.ja || it.summary?.en) {
      $(".desc", node).hidden = false;
      $(".s-ja", node).textContent = it.summary.ja || "";
      $(".s-en", node).textContent = it.summary.en || "";
      if (!it.summary.ja) $(".s-ja", node).remove();
      if (!it.summary.en) $(".s-en", node).remove();
    }
    if (it.note) { const n = $(".note", node); n.hidden = false; n.textContent = it.note; }

    if (it.media && it.media.type === "youtube" && it.media.ref) {
      const box = $(".media", node); box.hidden = false;
      const yt = el("div", { class: "yt", role: "button", tabindex: "0", "aria-label": "Play video" });
      const img = el("img", { src: `https://i.ytimg.com/vi/${it.media.ref}/hqdefault.jpg`, alt: "", loading: "lazy" });
      yt.append(img, el("div", { class: "play" }, "▶ Play on YouTube"));
      const start = () => {
        yt.innerHTML = "";
        yt.appendChild(el("iframe", {
          src: `https://www.youtube-nocookie.com/embed/${it.media.ref}?autoplay=1`,
          allow: "autoplay; encrypted-media; picture-in-picture", allowfullscreen: ""
        }));
      };
      yt.addEventListener("click", start);
      yt.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); } });
      box.appendChild(yt);
    }
    if (it.local_assets && it.local_assets.length) {
      const box = $(".assets", node); box.hidden = false;
      for (const p of it.local_assets) {
        const a = el("a", { href: "media/" + p, target: "_blank", rel: "noopener" });
        a.appendChild(el("img", { src: "media/" + p, alt: it.title.ja, loading: "lazy" }));
        box.appendChild(a);
      }
    }
    const links = $(".links", node);
    if (it.media && it.media.type === "x" && it.media.ref) links.appendChild(el("a", { href: it.media.ref, target: "_blank", rel: "noopener" }, "open on x"));
    links.appendChild(el("a", { href: it.source_url, target: "_blank", rel: "noopener" }, "source"));
    (it.reference_urls || []).forEach((u, i) => links.appendChild(el("a", { href: u, target: "_blank", rel: "noopener" }, `ref ${i + 1}`)));
    if (it.tags && it.tags.length) {
      const t = $(".tags", node); t.hidden = false;
      it.tags.forEach(x => t.appendChild(el("span", {}, x)));
    }
    return node;
  }

  let observer = null;
  function observe(nodes) {
    if (observer) observer.disconnect();
    if (!("IntersectionObserver" in window)) { nodes.forEach(n => n.classList.add("in")); return; }
    observer = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); observer.unobserve(e.target); }
    }, { rootMargin: "0px 0px -5% 0px" });
    nodes.forEach(n => observer.observe(n));
  }

  function render() {
    syncControls();
    writeHash();
    const list = state.items.filter(matches);
    const dir = state.sort === "asc" ? 1 : -1;
    list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1) * dir);

    const tl = $("#timeline");
    tl.innerHTML = "";
    const nav = $("#yearnav");
    nav.innerHTML = "";
    const verified = list.filter(i => i.verified).length;
    $("#foot-stats").textContent = `${list.length} of ${state.items.length} shown · ${verified} verified`;
    if (!list.length) { tl.appendChild(el("p", { class: "empty" }, "Nothing here. 該当なし")); return; }

    const yearCount = {};
    for (const it of list) yearCount[it.date.slice(0, 4)] = (yearCount[it.date.slice(0, 4)] || 0) + 1;

    const seenYears = new Set();
    let curMonth = null;
    const frag = document.createDocumentFragment();
    const entries = [];
    for (const it of list) {
      const y = it.date.slice(0, 4);
      const ym = it.date.slice(0, 7);
      if (!seenYears.has(y)) {
        seenYears.add(y);
        const yh = el("div", { class: "year-head", id: "y" + y });
        yh.append(el("div", { class: "yr" }, y), el("div", { class: "yr-meta mono dim" }, `${yearCount[y]} entries`));
        frag.appendChild(yh);
      }
      if (ym !== curMonth) {
        curMonth = ym;
        const mi = parseInt(ym.slice(5, 7), 10) - 1;
        const mh = el("div", { class: "month-head" });
        const m = el("div", { class: "m" }, MONTHS[mi]);
        m.appendChild(el("small", {}, `${mi + 1}月`));
        mh.append(m, el("div", { class: "line" }));
        frag.appendChild(mh);
      }
      const node = renderItem(it);
      entries.push(node);
      frag.appendChild(node);
    }
    tl.appendChild(frag);
    for (const y of seenYears) nav.appendChild(el("a", { href: "#y" + y }, y));
    observe(entries);
  }

  initTheme();
  readHash();
  buildControls();
  load().then(() => { fillCounters(); render(); }).catch(err => {
    $("#timeline").appendChild(el("p", { class: "empty" }, "Failed to load data: " + err.message));
  });
})();

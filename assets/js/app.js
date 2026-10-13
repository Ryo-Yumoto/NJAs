(() => {
  "use strict";

  const CATS = {
    music:    { ja: "楽曲",     en: "Music",    color: "var(--c-music)" },
    mv:       { ja: "MV",       en: "Video",    color: "var(--c-mv)" },
    tv:       { ja: "テレビ",   en: "TV",       color: "var(--c-tv)" },
    magazine: { ja: "雑誌",     en: "Magazine", color: "var(--c-magazine)" },
    web:      { ja: "WEB",      en: "Web",      color: "var(--c-web)" },
    ad:       { ja: "広告",     en: "Ad",       color: "var(--c-ad)" },
    tweet:    { ja: "ツイート", en: "X post",   color: "var(--c-tweet)" },
    goods:    { ja: "グッズ",   en: "Goods",    color: "var(--c-goods)" }
  };
  const ENTITIES = { newjeans: "NewJeans (ADOR)", njz: "NJZ" };
  const DATE_TYPES = {
    release: "発売/配信", announce: "発表", broadcast: "放送", publish: "発行",
    post: "投稿", sale_start: "販売開始", event: "開催"
  };
  const MEMBERS = { all: "全員", minji: "Minji", hanni: "Hanni", danielle: "Danielle", haerin: "Haerin", hyein: "Hyein" };

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

  function readHash() {
    try {
      const p = new URLSearchParams(location.hash.replace(/^#/, ""));
      if (p.get("cat")) state.cats = new Set(p.get("cat").split(",").filter(c => CATS[c]));
      if (p.get("ent")) state.entities = new Set(p.get("ent").split(",").filter(e => ENTITIES[e]));
      if (p.get("q")) state.q = p.get("q");
      if (p.get("v") === "1") state.onlyVerified = true;
      if (p.get("sort") === "asc") state.sort = "asc";
    } catch (_) { /* ignore */ }
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

  async function load() {
    const manifest = await (await fetch("data/manifest.json", { cache: "no-store" })).json();
    const lists = await Promise.all(manifest.files.map(async f => {
      const r = await fetch("data/" + f, { cache: "no-store" });
      if (!r.ok) throw new Error("failed to load data/" + f);
      return r.json();
    }));
    state.items = lists.flat();
  }

  function buildChips() {
    const cc = $("#cat-chips");
    for (const [k, v] of Object.entries(CATS)) {
      const b = el("button", { class: "chip", type: "button", "data-cat": k, "aria-pressed": "true" }, `${v.ja} / ${v.en}`);
      b.style.setProperty("--chip", v.color);
      b.addEventListener("click", () => {
        if (state.cats.has(k)) state.cats.delete(k); else state.cats.add(k);
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
    $("#sort").addEventListener("change", e => { state.sort = e.target.value; render(); });
  }

  function syncControls() {
    document.querySelectorAll("[data-cat]").forEach(b => b.setAttribute("aria-pressed", String(state.cats.has(b.dataset.cat))));
    document.querySelectorAll("[data-ent]").forEach(b => b.setAttribute("aria-pressed", String(state.entities.has(b.dataset.ent))));
    $("#q").value = state.q;
    $("#only-verified").checked = state.onlyVerified;
    $("#sort").value = state.sort;
  }

  function matches(it) {
    if (!state.cats.has(it.category)) return false;
    if (!state.entities.has(it.entity)) return false;
    if (state.onlyVerified && !it.verified) return false;
    if (state.q) {
      const hay = [
        it.title?.ja, it.title?.en, it.title?.original,
        it.summary?.ja, it.summary?.en, it.note, ...(it.tags || []), ...(it.members || [])
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
    if (it.date_precision === "month") return `${y}-${m}`;
    return `${y}-${m}-${d}`;
  }

  function renderItem(it) {
    const node = $("#tpl-item").content.firstElementChild.cloneNode(true);
    const cat = CATS[it.category] || { ja: it.category, en: it.category, color: "var(--line)" };
    node.style.setProperty("--cat", cat.color);
    node.id = it.id;
    $(".d", node).textContent = fmtDate(it);
    $(".dt", node).textContent = DATE_TYPES[it.date_type] || it.date_type;
    if (it.date_precision !== "day") { const p = $(".prec", node); p.hidden = false; p.textContent = it.date_precision === "month" ? "月のみ" : "年のみ"; }
    $(".cat", node).textContent = cat.ja;
    if (it.entity === "njz") { const e = $(".entity", node); e.hidden = false; e.textContent = "NJZ名義"; }
    if (it.members && it.members.length && !(it.members.length === 1 && it.members[0] === "all")) {
      const m = $(".members", node); m.hidden = false; m.textContent = it.members.map(x => MEMBERS[x] || x).join(", ");
    }
    if (!it.verified) $(".unverified", node).hidden = false;
    $(".t-ja", node).textContent = it.title.ja;
    $(".t-en", node).textContent = it.title.en;
    if (it.title.original && it.title.original !== it.title.ja && it.title.original !== it.title.en) {
      const o = $(".t-orig", node); o.hidden = false; o.textContent = it.title.original;
    }
    if (it.summary?.ja) { const s = $(".s-ja", node); s.hidden = false; s.textContent = it.summary.ja; }
    if (it.summary?.en) { const s = $(".s-en", node); s.hidden = false; s.textContent = it.summary.en; }
    if (it.note) { const n = $(".note", node); n.hidden = false; n.textContent = it.note; }

    if (it.media && it.media.type === "youtube" && it.media.ref) {
      const box = $(".media", node); box.hidden = false;
      const yt = el("div", { class: "yt", role: "button", tabindex: "0", "aria-label": "Play video" });
      const img = el("img", { src: `https://i.ytimg.com/vi/${it.media.ref}/hqdefault.jpg`, alt: "", loading: "lazy" });
      const play = el("div", { class: "play" }, "▶ YouTube");
      yt.append(img, play);
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
    if (it.media && it.media.type === "x" && it.media.ref) links.appendChild(el("a", { href: it.media.ref, target: "_blank", rel: "noopener" }, "X post"));
    links.appendChild(el("a", { href: it.source_url, target: "_blank", rel: "noopener" }, "source"));
    (it.reference_urls || []).forEach((u, i) => links.appendChild(el("a", { href: u, target: "_blank", rel: "noopener" }, `ref${i + 1}`)));
    if (it.tags && it.tags.length) {
      const t = $(".tags", node); t.hidden = false;
      it.tags.forEach(x => t.appendChild(el("span", { class: "tag" }, x)));
    }
    return node;
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
    if (!list.length) { tl.appendChild(el("p", { class: "empty" }, "該当なし / No items")); $("#stats").textContent = `0 / ${state.items.length}`; return; }

    const years = new Set();
    let curMonth = null;
    const frag = document.createDocumentFragment();
    for (const it of list) {
      const ym = it.date.slice(0, 7);
      if (ym !== curMonth) {
        curMonth = ym;
        const h = el("h2", { class: "month" }, ym.replace("-", "年") + "月");
        const y = ym.slice(0, 4);
        if (!years.has(y)) { years.add(y); h.id = "y" + y; }
        frag.appendChild(h);
      }
      frag.appendChild(renderItem(it));
    }
    tl.appendChild(frag);
    for (const y of years) nav.appendChild(el("a", { href: "#y" + y }, y));
    const verified = list.filter(i => i.verified).length;
    $("#stats").textContent = `${list.length} / ${state.items.length} (verified ${verified})`;
  }

  readHash();
  buildChips();
  load().then(render).catch(err => {
    $("#timeline").appendChild(el("p", { class: "empty" }, "データ読込エラー / failed to load: " + err.message + " (file:// では動作しません。ローカルサーバーで開いてください)"));
  });
})();

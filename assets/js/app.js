(() => {
  "use strict";

  /* ---------- constants ---------- */
  const DEBUT = "2022-07-22";
  const CATS = {
    music:    { ja: "楽曲",   en: "Music",    color: "var(--c-music)",    ratio: "1 / 1" },
    mv:       { ja: "映像",   en: "Video",    color: "var(--c-mv)",       ratio: "16 / 9" },
    tv:       { ja: "テレビ・ラジオ", en: "TV / Radio", color: "var(--c-tv)", ratio: "16 / 10" },
    magazine: { ja: "雑誌",   en: "Magazine", color: "var(--c-magazine)", ratio: "4 / 5" },
    web:      { ja: "WEB",    en: "Web",      color: "var(--c-web)",      ratio: "16 / 10" },
    ad:       { ja: "広告",   en: "Ad",       color: "var(--c-ad)",       ratio: "4 / 5" },
    sns:      { ja: "SNS",    en: "SNS",      color: "var(--c-sns)",      ratio: "1 / 1" },
    goods:    { ja: "グッズ", en: "Goods",    color: "var(--c-goods)",    ratio: "1 / 1" },
    live:     { ja: "ライブ", en: "Live",     color: "var(--c-live)",     ratio: "16 / 10" },
    notice:   { ja: "公式発表", en: "Notice",  color: "var(--c-notice)",   ratio: "16 / 10" },
    content:  { ja: "公式コンテンツ", en: "Content", color: "var(--c-content)", ratio: "16 / 9" },
    record:   { ja: "受賞・記録", en: "Record", color: "var(--c-record)",   ratio: "16 / 10" }
  };
  // default order inside a day when no time is given: announcement -> video -> music -> live -> tv -> ad -> web -> magazine -> goods
  const DAY_ORDER = ["notice", "sns", "mv", "music", "content", "live", "tv", "record", "ad", "web", "magazine", "goods"];
  const DATE_TYPES = { release: "release", announce: "announce", broadcast: "broadcast", publish: "publish", post: "post", sale_start: "on sale", event: "event" };
  const MEMBERS = { all: "all", minji: "Minji", hanni: "Hanni", danielle: "Danielle", haerin: "Haerin", hyein: "Hyein" };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const WD_JA = ["日", "月", "火", "水", "木", "金", "土"];
  const KIND_TAGS = ["teaser", "trailer", "concept-film", "lyric-video", "track-video", "dance-practice", "performance", "stage-cam", "audition", "pre-debut", "announcement"];

  const state = { items: [], eras: [], images: {}, pages: [], byDate: {}, cur: -1, mode: "cover", showMeta: false, cats: new Set(Object.keys(CATS)), tocMonth: null };

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, text) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v == null) continue; if (k === "class") n.className = v; else n.setAttribute(k, v); } if (text != null) n.textContent = text; return n; };
  const utc = d => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  const dayNum = date => Math.round((utc(date) - utc(DEBUT)) / 86400000) + 1;
  const dayLabel = date => (date < DEBUT ? "" : `DAY ${dayNum(date)}`);
  const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / 86400000);
  // within a day: announcements (announce/post) first, then events, then releases; inside each group by time, then category order, then id
  const TYPE_RANK = { announce: 0, post: 0, event: 1 };
  const sortKey = it => `${it.date} ${TYPE_RANK[it.date_type] ?? 2} ${it.time || "99:99"} ${String(DAY_ORDER.indexOf(it.category)).padStart(2, "0")} ${it.id}`;
  const fmtLong = d => `${d.slice(0, 4)}.${d.slice(5, 7)}.${d.slice(8, 10)}`;
  const weekday = d => WD_JA[new Date(utc(d)).getUTCDay()];
  const store = { get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} } };

  /* ---------- theme ---------- */
  function initTheme() {
    const saved = store.get("njas-theme");
    if (saved === "dark" || saved === "light") document.documentElement.dataset.theme = saved;
    $("#theme-btn").addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next; store.set("njas-theme", next);
    });
  }

  /* ---------- data ---------- */
  async function load() {
    const manifest = await (await fetch("data/manifest.json", { cache: "no-store" })).json();
    const lists = await Promise.all(manifest.files.map(async f => { const r = await fetch("data/" + f, { cache: "no-store" }); if (!r.ok) throw new Error("failed to load data/" + f); return r.json(); }));
    state.items = lists.flat().sort((a, b) => (sortKey(a) < sortKey(b) ? -1 : 1));
    try { state.eras = await (await fetch("data/eras.json", { cache: "no-store" })).json(); } catch (_) { state.eras = []; }
    try { const r = await fetch("media/auto/index.json", { cache: "no-store" }); if (r.ok) state.images = await r.json(); } catch (_) {}
    buildPages();
  }
  function buildPages() {
    // pages: era openers interleaved with one page per date
    // page key: exact day "YYYY-MM-DD"; month-only records "YYYY-MM"; year-only "YYYY" (sorted before the days they precede)
    const byKey = {};
    for (const it of state.items) {
      if (!state.cats.has(it.category)) continue; const k = it.date_precision === "month" ? it.date.slice(0, 7) : it.date_precision === "year" ? it.date.slice(0, 4) : it.date; (byKey[k] ||= []).push(it); }
    state.byDate = byKey;
    // month-only pages sit at the END of their month, year-only pages at the end of their year (nothing inside them can be "early")
    const sortDate = k => (k.length === 7 ? k + "-32" : k.length === 4 ? k + "-13-00" : k);
    const keys = Object.keys(byKey).sort((a, b) => (sortDate(a) < sortDate(b) ? -1 : 1));
    const pages = []; const opened = new Set();
    for (const k of keys) {
      const d = k.length === 10 ? k : sortDate(k);
      const era = state.eras.find(e => d >= e.start && (!e.end || d <= e.end));
      if (era && !opened.has(era.id)) { opened.add(era.id); pages.push({ kind: "era", era, date: d, key: era.id }); }
      pages.push({ kind: "day", date: byKey[k][0].date, hdate: d, precision: k.length === 10 ? "day" : k.length === 7 ? "month" : "year", items: byKey[k], era, key: k });
    }
    state.pages = pages;
  }
  function imageOf(it) {
    if (it.image && it.image.path) return { src: "media/" + it.image.path, from: it.image.source_url || it.source_url };
    if (it.local_assets && it.local_assets.length) return { src: "media/" + it.local_assets[0], from: it.source_url };
    const a = state.images[it.id];
    if (a) return { src: "media/auto/" + a.file, from: a.page_url };
    if (it.media && it.media.type === "youtube" && it.media.ref) return { src: `https://i.ytimg.com/vi/${it.media.ref}/hqdefault.jpg`, from: it.source_url };
    return null;
  }

  /* ---------- routing ---------- */
  function go(idx, push = true) {
    idx = Math.max(0, Math.min(state.pages.length - 1, idx));
    state.cur = idx; state.mode = "page";
    const p = state.pages[idx];
    if (push && location.hash !== "#" + p.key) history.pushState(null, "", "#" + p.key);
    store.set("njas-bookmark", p.key);
    renderPage(); closeToc(); window.scrollTo({ top: 0 });
    prefetchAround(idx);
  }
  function prefetchAround(idx) {
    for (const p of [state.pages[idx + 1], state.pages[idx + 2], state.pages[idx - 1]]) {
      if (!p) continue;
      if (p.kind === "era") { const src = p.era.image && state.images[p.era.image] ? "media/auto/" + state.images[p.era.image].file : null; if (src) new Image().src = src; continue; }
      for (const it of p.items.slice(0, 6)) { const im = imageOf(it); if (im) new Image().src = im.src; }
    }
  }
  function goKey(key) { const i = state.pages.findIndex(p => p.key === key); if (i >= 0) go(i); return i >= 0; }
  function nearestDateIdx(date) { let i = state.pages.findIndex(p => p.kind === "day" && p.key >= date); if (i < 0) i = state.pages.length - 1; return i; }
  const pageLabel = p => p.kind === "era" ? p.era.title.en : p.precision === "month" ? `${p.date.slice(0, 4)}.${p.date.slice(5, 7)}` : p.precision === "year" ? p.date.slice(0, 4) : fmtLong(p.date);
  function showCover() {
    state.mode = "cover"; history.replaceState(null, "", location.pathname);
    $("#cover").hidden = false; $("#page").hidden = true; $("#pager").hidden = true; $("#index").hidden = true;
    const bm = store.get("njas-bookmark");
    const has = bm && state.pages.some(p => p.key === bm);
    $("#resume-btn").hidden = !has;
    if (has) { const p = state.pages.find(p => p.key === bm); $("#resume-label").textContent = pageLabel(p).toUpperCase(); }
    $("#bar-pos").textContent = "";
    document.body.classList.remove("reading");
  }
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!h) return showCover();
    if (h === "index") return showIndex();
    if (/^\d{4}(-\d{2}){0,2}$/.test(h)) { const i = state.pages.findIndex(p => p.kind === "day" && p.key === h); return i >= 0 ? go(i, false) : go(nearestDateIdx(h), false); }
    if (!goKey(h)) { const it = state.items.find(i => i.id === h); if (it) go(state.pages.findIndex(p => p.kind === "day" && p.date === it.date), false); else showCover(); }
  }

  /* ---------- page ---------- */
  function renderPage() {
    const p = state.pages[state.cur];
    $("#cover").hidden = true; $("#index").hidden = true; $("#page").hidden = false; $("#pager").hidden = false;
    document.body.classList.add("reading");
    const page = $("#page"); page.innerHTML = "";
    if (p.kind === "era") page.appendChild(renderEraPage(p)); else page.appendChild(renderDayPage(p));
    if (p.kind === "day" && !store.get("njas-hint-seen")) {
      const hint = el("div", { class: "hint mono" }, matchMedia("(pointer: coarse)").matches ? "左にスワイプで次の日へ · 右で前の日へ" : "← → キーでページをめくる · M で編集者表示");
      page.appendChild(hint); store.set("njas-hint-seen", "1");
    }
    // pager
    const prev = state.pages[state.cur - 1], next = state.pages[state.cur + 1];
    $("#prev-btn").disabled = !prev; $("#next-btn").disabled = !next;
    $("#prev-date").textContent = prev ? pageLabel(prev) : "表紙 / COVER";
    $("#prev-btn").disabled = false;
    $("#next-date").textContent = next ? (next.kind === "era" ? "次の期 / NEXT ERA" : pageLabel(next)) : "ここまで / THE END, FOR NOW";
    const filt = state.cats.size !== Object.keys(CATS).length ? " · FILTERED" : "";
    $("#bar-pos").textContent = (p.kind === "era" ? `${p.era.title.en.toUpperCase()}` : `${pageLabel(p)}${p.precision === "day" && dayLabel(p.date) ? " · " + dayLabel(p.date) : ""}`) + filt;
  }
  function renderEraPage(p) {
    const era = p.era;
    const h = el("section", { class: "era-page" });
    h.style.setProperty("--era", era.accent || "var(--ink)");
    const src = era.image && state.images[era.image] ? "media/auto/" + state.images[era.image].file : null;
    if (src) { h.classList.add("has-img"); h.appendChild(el("img", { class: "era-img", src, alt: "" })); }
    const body = el("div", { class: "era-body" });
    const chapterNo = state.eras.indexOf(era) + 1;
    body.append(el("span", { class: "era-kicker mono" }, `ERA ${chapterNo} · 第${chapterNo}期`), el("h2", { class: "era-title" }, era.title.en), el("p", { class: "era-sub" }, era.title.ja), el("p", { class: "era-cap" }, era.caption?.ja || ""), el("p", { class: "era-cap-en" }, era.caption?.en || ""), el("p", { class: "era-range mono" }, `${fmtLong(era.start)} —`));
    h.appendChild(body);
    return h;
  }
  function renderDayPage(p) {
    const wrap = el("div", { class: "day" });
    const head = el("header", { class: "day-head" });
    const d = p.date;
    if (p.precision === "day") {
      head.append(
        el("div", { class: "day-kicker mono" }, `${p.era ? p.era.title.en.toUpperCase() + " · " : ""}${weekday(d)}曜日 · ${p.items.length} ${p.items.length === 1 ? "entry" : "entries"}`),
        el("h2", { class: "day-date" }, fmtLong(d)),
        el("div", { class: "day-sub" }, dayLabel(d) || "\u00a0")
      );
    } else {
      head.append(
        el("div", { class: "day-kicker mono" }, `${p.era ? p.era.title.en.toUpperCase() + " · " : ""}${p.precision === "month" ? "SOMETIME THIS MONTH" : "SOMETIME THIS YEAR"} · ${p.items.length} ${p.items.length === 1 ? "entry" : "entries"}`),
        el("h2", { class: "day-date" }, pageLabel(p)),
        el("div", { class: "day-sub" }, p.precision === "month" ? `${+d.slice(5, 7)}月中（日付未確定）` : `${d.slice(0, 4)}年中（日付未確定）`)
      );
    }
    wrap.appendChild(head);
    const list = el("div", { class: "day-list" });
    for (const it of p.items) list.appendChild(renderItem(it));
    wrap.appendChild(list);
    return wrap;
  }

  /* ---------- entry ---------- */
  function renderItem(it) {
    const node = $("#tpl-item").content.firstElementChild.cloneNode(true);
    const cat = CATS[it.category] || { ja: it.category, en: it.category, color: "var(--rule)", ratio: "16 / 10" };
    node.style.setProperty("--cat", cat.color); node.id = it.id;
    const kind = (it.tags || []).find(t => KIND_TAGS.includes(t));
    $(".cat-label", node).textContent = `${cat.en} · ${cat.ja}${kind ? " · " + kind.replace("-", " ") : ""} · ${DATE_TYPES[it.date_type] || it.date_type}`;
    if (it.time) { const t = $(".time", node); t.hidden = false; t.textContent = `${it.time} KST`; }
    if (it.platform) { const pl = el("span", { class: "pill platform" }, ({ x: "X", instagram: "Instagram", weverse: "Weverse", phoning: "Phoning", tiktok: "TikTok", youtube: "YouTube", other: "SNS" })[it.platform] || it.platform); $(".meta", node).appendChild(pl); }
    if (it.entity === "njz") { const e = $(".entity", node); e.hidden = false; e.textContent = "NJZ"; }
    if (it.members && it.members.length && !(it.members.length === 1 && it.members[0] === "all")) { const m = $(".members", node); m.hidden = false; m.textContent = it.members.map(x => MEMBERS[x] || x).join(" · "); }
    if (!it.verified && state.showMeta) $(".unverified", node).hidden = false;
    $(".t-ja", node).textContent = it.title.ja; $(".t-en", node).textContent = it.title.en;
    if (it.title.original && it.title.original !== it.title.ja && it.title.original !== it.title.en) { const o = $(".t-orig", node); o.hidden = false; o.textContent = it.title.original; }
    if (it.summary?.ja || it.summary?.en) { $(".desc", node).hidden = false; if (it.summary.ja) $(".s-ja", node).textContent = it.summary.ja; else $(".s-ja", node).remove(); if (it.summary.en) $(".s-en", node).textContent = it.summary.en; else $(".s-en", node).remove(); }
    if (it.detail?.ja || it.detail?.en) {
      const d = el("div", { class: "detail" });
      if (it.detail.ja) d.appendChild(el("p", { class: "d-ja" }, it.detail.ja));
      if (it.detail.en) d.appendChild(el("p", { class: "d-en" }, it.detail.en));
      $(".desc", node).hidden = false; $(".desc", node).after(d);
    }
    if (it.credits && Object.keys(it.credits).length) {
      const dl = el("dl", { class: "credits" });
      for (const [k, v] of Object.entries(it.credits)) { dl.append(el("dt", { class: "mono" }, k.replace(/_/g, " ")), el("dd", {}, v)); }
      ($(".detail", node) || $(".desc", node)).after(dl);
    }
    if (it.note) { const n = $(".note", node); n.hidden = false; n.textContent = it.note; }
    const img = imageOf(it), isYt = it.media && it.media.type === "youtube" && it.media.ref;
    if (img) {
      const fig = $(".thumb", node); fig.hidden = false;
      fig.appendChild(el("img", { src: img.src, alt: "", loading: "lazy", decoding: "async" }));
      if (isYt && !window.NJAS_NO_EMBED) {
        fig.classList.add("is-video"); fig.appendChild(el("span", { class: "play mono" }, "▶ PLAY"));
        fig.addEventListener("click", () => { const box = $(".media", node); box.hidden = false; box.innerHTML = ""; box.appendChild(el("iframe", { src: `https://www.youtube-nocookie.com/embed/${it.media.ref}?autoplay=1`, allow: "autoplay; encrypted-media; picture-in-picture", allowfullscreen: "", title: it.title.en })); fig.hidden = true; });
      } else if (isYt) {
        fig.classList.add("is-video"); fig.appendChild(el("span", { class: "play mono" }, "▶ OPEN ON YOUTUBE"));
        const a = el("a", { href: `https://www.youtube.com/watch?v=${it.media.ref}`, target: "_blank", rel: "noopener", class: "thumb-link", "aria-label": "Open on YouTube" });
        fig.appendChild(a);
      } else fig.addEventListener("click", () => openLightbox(it, img));
    }
    if (it.local_assets && it.local_assets.length > 1) { const box = $(".assets", node); box.hidden = false; for (const pth of it.local_assets.slice(1)) { const a = el("a", { href: "media/" + pth, target: "_blank", rel: "noopener" }); a.appendChild(el("img", { src: "media/" + pth, alt: it.title.ja, loading: "lazy" })); box.appendChild(a); } }
    const links = $(".links", node);
    if (isYt) links.appendChild(el("a", { href: `https://www.youtube.com/watch?v=${it.media.ref}`, target: "_blank", rel: "noopener" }, "youtube"));
    if (it.media && it.media.type === "x" && it.media.ref) links.appendChild(el("a", { href: it.media.ref, target: "_blank", rel: "noopener" }, "open post"));
    links.appendChild(el("a", { href: it.source_url, target: "_blank", rel: "noopener" }, "source"));
    for (const [k, u] of Object.entries(it.links || {})) links.appendChild(el("a", { href: u, target: "_blank", rel: "noopener", class: "svc" }, k.replace("_", " ")));
    if (state.showMeta) (it.reference_urls || []).forEach((u, i) => links.appendChild(el("a", { href: u, target: "_blank", rel: "noopener" }, `ref ${i + 1}`)));
    if (state.showMeta && it.editor_note) { const n = el("p", { class: "note mono editor" }, "EDITOR: " + it.editor_note); $(".entry-text", node).appendChild(n); }
    if (it.tags && it.tags.length) { const t = $(".tags", node); t.hidden = false; it.tags.forEach(x => t.appendChild(el("span", {}, x))); }
    return node;
  }

  /* ---------- lightbox ---------- */
  function openLightbox(it, img) {
    $("#lb-img").src = img.src; $("#lb-img").alt = it.title.ja;
    $("#lb-meta").textContent = `${fmtLong(it.date)}${dayLabel(it.date) ? " · " + dayLabel(it.date) : ""} · ${CATS[it.category]?.en || it.category}`;
    $("#lb-title").textContent = `${it.title.ja} — ${it.title.en}`;
    const links = $("#lb-links"); links.innerHTML = ""; links.appendChild(el("a", { href: img.from, target: "_blank", rel: "noopener" }, "image source"));
    $("#lightbox").hidden = false; document.body.style.overflow = "hidden";
  }
  function closeLightbox() { const lb = $("#lightbox"); if (lb.hidden) return; lb.hidden = true; $("#lb-img").src = ""; document.body.style.overflow = ""; }

  /* ---------- table of contents (knowledge horizon = current page date) ---------- */
  function horizon() { const p = state.pages[state.cur]; return p ? (p.hdate || p.date) : "0000-00-00"; }
  function isKnown(p) { const hz = state.mode === "page" ? horizon() : "0000-00-00"; const strict = state.pages[state.cur]?.kind === "era"; const d = p.hdate || p.date; return strict ? d < hz : d <= hz; }
  function openToc() {
    $("#toc").hidden = false; $("#scrim").hidden = false; $("#toc-btn").setAttribute("aria-expanded", "true");
    const p = state.pages[state.cur]; state.tocMonth = p ? p.date.slice(0, 7) : null;
    renderToc(); setTimeout(() => $("#toc .current")?.scrollIntoView({ block: "center" }), 0);
  }
  function closeToc() { $("#toc").hidden = true; $("#scrim").hidden = true; $("#toc-btn").setAttribute("aria-expanded", "false"); }
  const hitQ = (it, q) => !q || [it.title.ja, it.title.en, it.title.original, it.summary?.ja, it.summary?.en, it.detail?.ja, ...(it.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(q);
  function buildCatChips() {
    const box = $("#toc-cats"); box.innerHTML = "";
    for (const [k, v] of Object.entries(CATS)) {
      const b = el("button", { class: "chip", type: "button", "data-cat": k, "aria-pressed": String(state.cats.has(k)) });
      b.style.setProperty("--chip", v.color); b.append(el("i", { class: "sw" }), el("span", {}, `${v.ja}`));
      b.addEventListener("click", e => {
        if (e.altKey || e.metaKey) state.cats = new Set([k]); else { if (state.cats.has(k)) state.cats.delete(k); else state.cats.add(k); }
        if (!state.cats.size) state.cats = new Set(Object.keys(CATS));
        store.set("njas-cats", [...state.cats].join(","));
        applyFilter();
      });
      box.appendChild(b);
    }
    const all = el("button", { class: "chip chip-all", type: "button" }, "すべて");
    all.addEventListener("click", () => { state.cats = new Set(Object.keys(CATS)); store.set("njas-cats", ""); applyFilter(); });
    box.appendChild(all);
  }
  function applyFilter() {
    const key = state.pages[state.cur]?.key;
    buildPages();
    document.querySelectorAll("#toc-cats [data-cat]").forEach(b => b.setAttribute("aria-pressed", String(state.cats.has(b.dataset.cat))));
    if (state.mode === "page") {
      let i = key ? state.pages.findIndex(p => p.key === key) : -1;
      if (i < 0 && key) i = nearestDateIdx(key.length === 10 ? key : key + "-01");
      if (i >= 0) { state.cur = i; renderPage(); } else showCover();
    }
    renderToc();
  }
  function renderToc() {
    const body = $("#toc-body"), nav = $("#toc-nav"); body.innerHTML = ""; nav.innerHTML = "";
    const q = $("#toc-q").value.trim().toLowerCase();
    const reveal = $("#toc-reveal").checked;
    const days = state.pages.map((p, i) => ({ p, i })).filter(x => x.p.kind === "day");
    const filtered = state.cats.size !== Object.keys(CATS).length;
    if (filtered) nav.appendChild(el("span", { class: "mono toc-filtered" }, `絞り込み中: ${[...state.cats].map(k => CATS[k].ja).join("・")}`));

    // search: flat list over the known range
    if (q) {
      body.appendChild(el("div", { class: "toc-section mono" }, "検索結果 / RESULTS"));
      let n = 0;
      for (const { p, i } of days) {
        if (!(isKnown(p) || reveal)) continue;
        for (const it of p.items) if (hitQ(it, q)) { body.appendChild(itemRow(p, i, it)); n++; }
      }
      if (!n) body.appendChild(el("p", { class: "toc-empty" }, "該当なし"));
      return;
    }
    // tier 1: month calendar
    if (!state.tocMonth) {
      const byYear = {};
      for (const { p, i } of days) { const y = p.date.slice(0, 4), m = +p.date.slice(5, 7); ((byYear[y] ||= {})[m] ||= []).push({ p, i }); }
      const curYm = state.pages[state.cur]?.date.slice(0, 7);
      for (const y of Object.keys(byYear).sort()) {
        const yb = el("div", { class: "cal-year" }); yb.appendChild(el("div", { class: "cal-year-label" }, y));
        const grid = el("div", { class: "cal-grid" });
        for (let m = 1; m <= 12; m++) {
          const list = byYear[y][m]; const ym = `${y}-${String(m).padStart(2, "0")}`;
          const cell = el("button", { class: "cal-cell", type: "button" });
          if (!list) cell.setAttribute("disabled", "");
          const known = list ? list.some(x => isKnown(x.p)) : false;
          const allKnown = list ? list.every(x => isKnown(x.p)) : false;
          cell.classList.toggle("known", known); cell.classList.toggle("partial", known && !allKnown); cell.classList.toggle("current", ym === curYm);
          const nItems = list ? list.reduce((a, x) => a + x.p.items.length, 0) : 0;
          cell.append(el("span", { class: "cal-m" }, `${m}月`), el("span", { class: "cal-n mono" }, list ? `${nItems}件` : ""));
          if (list) cell.addEventListener("click", () => { state.tocMonth = ym; renderToc(); $("#toc-body").scrollTop = 0; });
          grid.appendChild(cell);
        }
        yb.appendChild(grid); body.appendChild(yb);
      }
      setTimeout(() => $("#toc .cal-cell.current")?.scrollIntoView({ block: "center" }), 0);
      return;
    }
    // tier 2: one month, every heading
    const ym = state.tocMonth;
    const back = el("button", { class: "toc-back mono", type: "button" }, "← カレンダー / ALL MONTHS");
    back.addEventListener("click", () => { state.tocMonth = null; renderToc(); });
    const prevM = days.filter(x => x.p.date.slice(0, 7) < ym).pop(), nextM = days.find(x => x.p.date.slice(0, 7) > ym);
    const mnav = el("div", { class: "toc-mnav" });
    const pb = el("button", { class: "toc-back mono", type: "button" }, "← 前の月"); if (!prevM) pb.setAttribute("disabled", ""); else pb.addEventListener("click", () => { state.tocMonth = prevM.p.date.slice(0, 7); renderToc(); });
    const nb = el("button", { class: "toc-back mono", type: "button" }, "次の月 →"); if (!nextM) nb.setAttribute("disabled", ""); else nb.addEventListener("click", () => { state.tocMonth = nextM.p.date.slice(0, 7); renderToc(); });
    mnav.append(pb, nb);
    nav.append(back, mnav);
    body.appendChild(el("h3", { class: "toc-month-title" }, `${ym.slice(0, 4)}年${+ym.slice(5, 7)}月`));
    let any = false;
    for (const { p, i } of days) {
      if (p.date.slice(0, 7) !== ym) continue;
      any = true;
      const known = isKnown(p) || reveal;
      const dh = el("button", { class: "toc-day" + (i === state.cur ? " current" : "") + (known ? "" : " unknown"), type: "button" });
      const first = p.items[0];
      const digest = known ? ((first.summary?.ja || first.title.ja) + (p.items.length > 1 ? `（ほか${p.items.length - 1}件）` : "")) : "";
      dh.append(el("span", { class: "toc-day-date mono" }, p.precision === "day" ? `${p.date.slice(8, 10)}日（${weekday(p.date)}）` : p.precision === "month" ? "月内（日付未確定）" : "年内（日付未確定）"), el("span", { class: "toc-day-digest" }, digest));
      dh.addEventListener("click", () => go(i));
      body.appendChild(dh);
      if (known) for (const it of p.items) body.appendChild(itemRow(p, i, it));
    }
    if (!any) body.appendChild(el("p", { class: "toc-empty" }, "この月に該当する項目はありません"));
  }
  function itemRow(p, i, it) {
    const row = el("button", { class: "toc-item", type: "button" });
    const dot = el("i", { class: "dot" }); dot.style.background = CATS[it.category]?.color || "var(--rule)";
    row.append(el("span", { class: "toc-item-date mono" }, p.precision === "day" ? `${p.date.slice(5, 7)}.${p.date.slice(8, 10)}` : p.date.slice(0, 7).replace("-", ".")), dot, el("span", { class: "toc-item-text" }, it.title.ja), el("span", { class: "toc-item-cat mono" }, CATS[it.category]?.en || it.category));
    row.addEventListener("click", () => { go(i); setTimeout(() => document.getElementById(it.id)?.scrollIntoView({ block: "start", behavior: "smooth" }), 80); });
    return row;
  }
  function jumpToDate(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
    go(nearestDateIdx(v));
  }

  /* ---------- index (utility: everything, spoilers included) ---------- */
  function showIndex() {
    state.mode = "index"; history.replaceState(null, "", "#index");
    $("#cover").hidden = true; $("#page").hidden = true; $("#pager").hidden = true; $("#index").hidden = false; closeToc();
    document.body.classList.add("reading"); $("#bar-pos").textContent = "INDEX";
    renderIndex(); window.scrollTo({ top: 0 });
  }
  function renderIndex() {
    const body = $("#index-body"); body.innerHTML = "";
    const q = $("#index-q").value.trim().toLowerCase();
    let curMonth = null, table = null;
    for (const p of state.pages) {
      if (p.kind !== "day") continue;
      for (const it of p.items) {
        if (q && ![it.title.ja, it.title.en, it.summary?.ja, it.summary?.en, it.date, ...(it.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(q)) continue;
        const ym = it.date.slice(0, 7);
        if (ym !== curMonth) { curMonth = ym; body.appendChild(el("h3", { class: "index-month" }, `${ym.slice(0, 4)} ${MONTHS[+ym.slice(5, 7) - 1]}`)); table = el("div", { class: "index-list" }); body.appendChild(table); }
        const key = it.date_precision === "month" ? it.date.slice(0, 7) : it.date_precision === "year" ? it.date.slice(0, 4) : it.date;
        const row = el("a", { class: "index-row", href: "#" + key });
        row.style.setProperty("--cat", CATS[it.category]?.color || "var(--rule)");
        row.append(el("span", { class: "mono" }, key.replace(/-/g, ".")), el("i", { class: "dot" }), el("span", { class: "index-title-text" }, it.title.ja + (it.verified ? "" : " ⚠")), el("span", { class: "mono dim" }, CATS[it.category]?.en || it.category));
        row.addEventListener("click", e => { e.preventDefault(); state.showMeta = true; go(state.pages.findIndex(pp => pp.kind === "day" && pp.key === key)); });
        table.appendChild(row);
      }
    }
  }

  /* ---------- wiring ---------- */
  function wire() {
    $("#start-btn").addEventListener("click", () => { state.showMeta = false; go(0); });
    $("#resume-btn").addEventListener("click", () => goKey(store.get("njas-bookmark")));
    $("#brand").addEventListener("click", e => { e.preventDefault(); showCover(); });
    $("#prev-btn").addEventListener("click", () => { if (state.cur <= 0) showCover(); else go(state.cur - 1); });
    $("#next-btn").addEventListener("click", () => go(state.cur + 1));
    $("#toc-btn").addEventListener("click", () => ($("#toc").hidden ? openToc() : closeToc()));
    $("#toc-close").addEventListener("click", closeToc); $("#scrim").addEventListener("click", closeToc);
    $("#toc-q").addEventListener("input", renderToc);
    $("#toc-reveal").addEventListener("change", () => { store.set("njas-toc-reveal", $("#toc-reveal").checked ? "1" : "0"); renderToc(); });
    const savedCats = store.get("njas-cats"); if (savedCats) { const s = new Set(savedCats.split(",").filter(k => CATS[k])); if (s.size) state.cats = s; }
    buildCatChips();
    if (store.get("njas-toc-reveal") === "1") $("#toc-reveal").checked = true;
    $("#toc-date").addEventListener("change", e => jumpToDate(e.target.value));
    $("#index-link").addEventListener("click", e => { e.preventDefault(); showIndex(); });
    $("#index-close").addEventListener("click", () => (state.cur >= 0 ? go(state.cur) : showCover()));
    $("#index-q").addEventListener("input", renderIndex);
    $("#lightbox").addEventListener("click", e => { if (e.target === e.currentTarget || e.target.closest(".lb-close")) closeLightbox(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") { closeLightbox(); closeToc(); return; }
      if (state.mode !== "page" || e.target.matches("input, textarea")) return;
      if (e.key === "m") { state.showMeta = !state.showMeta; renderPage(); return; }
      if (e.key === "ArrowRight" || e.key === "j") go(state.cur + 1);
      if (e.key === "ArrowLeft" || e.key === "k") { if (state.cur <= 0) showCover(); else go(state.cur - 1); }
    });
    let tx = null, ty = null;
    document.addEventListener("touchstart", e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    document.addEventListener("touchend", e => {
      if (tx == null || state.mode !== "page" || !$("#lightbox").hidden || !$("#toc").hidden) return;
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = ty = null;
      if (Math.abs(dx) > 70 && Math.abs(dy) < 50) { if (dx < 0) go(state.cur + 1); else if (state.cur > 0) go(state.cur - 1); }
    }, { passive: true });
    window.addEventListener("hashchange", route);
  }

  initTheme(); wire();
  load().then(route).catch(err => { $("#cover .lede").textContent = "Failed to load data: " + err.message; });
})();

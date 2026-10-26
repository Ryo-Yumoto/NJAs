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
  const CREDIT_LABELS = {"label":["レーベル","Label"],"channel":["チャンネル","Channel"],"brand":["ブランド","Brand"],"venue":["会場","Venue"],"broadcaster":["放送局","Broadcaster"],"program":["番組","Programme"],"account":["アカウント","Account"],"publisher":["出版社","Publisher"],"organizer":["主催","Organiser"],"runtime":["再生時間","Runtime"],"sale_channel":["販売","Sold via"],"producer":["プロデューサー","Producer"],"host":["司会","Host"],"photographer":["撮影","Photographer"],"stylist":["スタイリスト","Stylist"],"issuer":["発行元","Issuer"],"hair":["ヘア","Hair"],"makeup":["メイク","Makeup"],"music_video_director":["MV監督","MV director"],"distributor":["流通","Distributor"],"composer":["作曲","Composer"],"lyricist":["作詞","Lyricist"],"mv_director":["MV監督","MV director"],"editor":["編集","Editor"],"arranger":["編曲","Arranger"],"outlet":["媒体","Outlet"],"length":["長さ","Length"],"writer":["執筆","Writer"],"event":["イベント","Event"],"executive_producer":["エグゼクティブ・プロデューサー","Executive producer"],"court":["裁判所","Court"],"collaboration":["コラボレーション","Collaboration"],"director":["監督","Director"],"artwork":["アートワーク","Artwork"],"location":["場所","Location"],"streaming":["配信","Streaming"],"advertiser":["広告主","Advertiser"],"fashion_editor":["ファッションエディター","Fashion editor"],"tracklist":["収録曲","Tracklist"],"mv_cast":["MV出演","MV cast"],"feature_editor":["フィーチャーエディター","Feature editor"],"set":["セット","Set"],"production":["制作","Production"],"mixing":["ミキシング","Mixing"],"editions":["形態","Editions"],"dj":["DJ","DJ"],"beauty_editor":["ビューティーエディター","Beauty editor"],"set_stylist":["セットスタイリスト","Set stylist"],"nails":["ネイル","Nails"],"platform":["プラットフォーム","Platform"],"announced_by":["発表","Announced by"],"vocal_director":["ボーカルディレクション","Vocal director"],"film":["映像","Film"],"mastering":["マスタリング","Mastering"],"performance_director":["パフォーマンスディレクター","Performance director"],"fashion_director":["ファッションディレクター","Fashion director"],"appointing_body":["任命機関","Appointing body"],"choreographer":["振付","Choreographer"],"artist":["アーティスト","Artist"],"featuring":["フィーチャリング","Featuring"],"production_company":["制作会社","Production company"],"digital_editor":["デジタルエディター","Digital editor"],"creative_director":["クリエイティブディレクター","Creative director"],"artists":["アーティスト","Artists"],"original_artist":["原曲","Original artist"],"promotion_video_director":["プロモーション映像監督","Promotion video director"],"copyright":["著作権","Copyright"],"special_performance_video_director":["スペシャルパフォーマンス映像監督","Special performance video director"],"videographer":["撮影（映像）","Videographer"],"costume":["衣装","Costume"],"co_hosts":["共同司会","Co-hosts"],"interviewer":["インタビュアー","Interviewer"],"set_design":["セットデザイン","Set design"],"beauty_visual_director":["ビューティービジュアルディレクター","Beauty visual director"],"role":["役","Role"],"counsel":["代理人","Counsel"],"performer":["出演","Performer"],"danielle_tracks":["ダニエルの歌唱曲","Danielle's tracks"],"songwriter":["作詞作曲","Songwriter"],"featured_artist":["フィーチャリング","Featured artist"],"remixer":["リミックス","Remixer"],"album":["アルバム","Album"],"'Hype Boy' Remix Arrange":["「Hype Boy」リミックス・アレンジ","'Hype Boy' remix arrangement"],"special_video_director":["スペシャル映像監督","Special video director"],"performance_video_director":["パフォーマンス映像監督","Performance video director"],"'Attention' Remix":["「Attention」リミックス","'Attention' remix"],"Mashup Remix":["マッシュアップ・リミックス","Mashup remix"],"narration":["ナレーション","Narration"],"special_dj":["スペシャルDJ","Special DJ"],"co_host":["共同司会","Co-host"],"navigator":["ナビゲーター","Navigator"],"nail":["ネイル","Nails"],"feature_director":["フィーチャーディレクター","Feature director"],"film_director":["映像監督","Film director"],"video":["映像","Video"],"editor_in_chief":["編集長","Editor-in-chief"],"art_director":["アートディレクター","Art director"],"special_creative_director":["スペシャルクリエイティブディレクター","Special creative director"],"beauty_director":["ビューティーディレクター","Beauty director"],"makeup_and_image":["メイク・イメージ","Makeup and image"],"contributing_editor":["コントリビューティングエディター","Contributing editor"],"operator":["運営","Operator"],"co-model":["共演モデル","Co-model"],"agency":["代理店","Agency"],"client":["クライアント","Client"],"institution":["機関","Institution"],"collaborators":["コラボレーター","Collaborators"],"designers":["デザイナー","Designers"],"source_account":["投稿元","Source account"],"design":["デザイン","Design"],"lineup":["ラインナップ","Lineup"],"opening_act":["オープニングアクト","Opening act"],"guest":["ゲスト","Guest"],"art_direction":["アートディレクション","Art direction"],"guest_of":["ゲスト出演先","Guest of"],"body":["主体","Body"],"featured_artists":["フィーチャリング","Featured artists"],"partner":["パートナー","Partner"],"collaborator":["コラボレーター","Collaborator"]};
  const KIND_TAGS = ["teaser", "trailer", "concept-film", "lyric-video", "track-video", "dance-practice", "performance", "stage-cam", "audition", "pre-debut", "announcement"];

  const state = { items: [], eras: [], images: {}, sprites: null, xposts: {}, read: new Set(), member: null, pages: [], byDate: {}, cur: -1, mode: "cover", showMeta: false, cats: new Set(Object.keys(CATS)), tocMonth: null, lang: "ja" };
  const L = o => (o ? (o[state.lang] || o.ja || o.en || "") : "");
  const tx = (ja, en) => (state.lang === "en" ? en : ja);
  const biText = v => (v && typeof v === "object" ? (state.lang === "en" ? (v.en || v.ja) : state.lang === "both" && v.en && v.en !== v.ja ? `${v.ja} / ${v.en}` : (v.ja || v.en)) : (v || ""));
  const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, attrs = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v == null) continue; if (k === "class") n.className = v; else n.setAttribute(k, v); } for (const c of kids) { if (c == null) continue; n.append(c instanceof Node ? c : String(c)); } return n; };
  const utc = d => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  const dayNum = date => Math.round((utc(date) - utc(DEBUT)) / 86400000) + 1;
  const dayLabel = date => (date < DEBUT ? "" : `DAY ${dayNum(date)}`);
  const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / 86400000);
  // within a day: announcements (announce/post) first, then events, then releases; inside each group by time, then category order, then id
  const TYPE_RANK = { announce: 0, post: 0, event: 1 };
  const sortKey = it => `${it.date} ${TYPE_RANK[it.date_type] ?? 2} ${it.time || "99:99"} ${String(DAY_ORDER.indexOf(it.category)).padStart(2, "0")} ${it.id}`;
  const fmtLong = d => `${d.slice(0, 4)}.${d.slice(5, 7)}.${d.slice(8, 10)}`;
  const weekday = d => (state.lang === "en" ? WD_EN : WD_JA)[new Date(utc(d)).getUTCDay()];
  const store = { get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} } };

  /* ---------- theme ---------- */
  // static labels in index.html, switched with the language (the "both" mode keeps Japanese UI)
  function applyStatic() {
    const set = (sel, prop, ja, en) => { const n = $(sel); if (n) n[prop] = tx(ja, en); };
    const html = (sel, ja, en) => { const n = $(sel); if (n) n.innerHTML = tx(ja, en); };
    document.documentElement.lang = state.lang === "en" ? "en" : "ja";
    set("#toc-btn", "ariaLabel", "目次とメニュー", "Contents and menu");
    html(".catch", "NewJeansを、最初から。", "NewJeans, from the very beginning.");
    html(".lede-lead", '<span class="nb">あの軌跡を、</span><span class="nb">もう一度いちから辿っていく。</span>', "Retrace the whole journey, from day one.");
    const sb = $("#start-btn"); if (sb && !sb.disabled) sb.innerHTML = tx('はじめから読む <span class="mono">FROM THE BEGINNING</span>', 'Start reading <span class="mono">FROM DAY ONE</span>');
    const rb = $("#resume-btn"); if (rb) { const lab = $("#resume-label"); rb.firstChild.textContent = tx("しおりから続ける ", "Continue where you left off "); if (lab) rb.appendChild(lab); }
    set("#pager-mid", "ariaLabel", "目次を開く", "Open contents");
    html(".toc-title", '目次 <span class="mono dim">CONTENTS</span>', "Contents");
    set(".fs-ctl", "ariaLabel", "本文の文字サイズ", "Text size");
    set("#fs-minus", "ariaLabel", "文字を小さく", "Smaller text");
    set("#fs-plus", "ariaLabel", "文字を大きく", "Larger text");
    set("#theme-btn", "ariaLabel", "テーマ切替", "Switch theme");
    set(".toc-lang-label", "textContent", "言語 LANGUAGE", "LANGUAGE");
    set('#lang-seg [data-lang="both"]', "textContent", "併記 JA+EN", "Both JA+EN");
    set("#toc-q", "placeholder", "検索", "Search");
    set("#toc-cats", "ariaLabel", "カテゴリ", "Categories");
    set("#toc-members", "ariaLabel", "メンバー", "Members");
    set("#index-link", "textContent", "索引（全期間の一覧）", "Index (all dates)");
    set(".toc-foot .dim", "textContent", "未来を含みます", "Includes later events");
    html(".index-title", '索引 <span class="mono dim">INDEX · ALL DATES</span>', 'Index <span class="mono dim">ALL DATES</span>');
    set("#index-q", "placeholder", "検索（全期間）", "Search all dates");
    set(".lb-close", "ariaLabel", "閉じる", "Close");
  }
  function initLang() {
    // three modes: "ja", "en", "both" (Japanese with the English text under it, for study). UI labels follow Japanese unless "en".
    const saved = store.get("njas-lang"); if (saved === "en" || saved === "both") state.lang = saved;
    const seg = $("#lang-seg");
    const paint = () => { document.documentElement.setAttribute("data-lang", state.lang); seg.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang))); };
    paint(); applyStatic();
    seg.addEventListener("click", e => {
      const b = e.target.closest("button[data-lang]"); if (!b || b.dataset.lang === state.lang) return;
      state.lang = b.dataset.lang; store.set("njas-lang", state.lang); paint(); applyStatic();
      buildCatChips(); buildMemberChips(); if (state.mode === "page") renderPage(); if (!$("#toc").hidden) renderToc();
    });
  }
  function initTextSize() {
    const steps = [0.85, 0.92, 1, 1.1, 1.2, 1.35, 1.5];
    let i = Math.max(0, steps.indexOf(parseFloat(store.get("njas-txt") || "1"))); if (i < 0) i = 2;
    const apply = () => { document.documentElement.style.setProperty("--txt", String(steps[i])); $("#fs-val").textContent = Math.round(steps[i] * 100) + "%"; $("#fs-minus").disabled = i === 0; $("#fs-plus").disabled = i === steps.length - 1; store.set("njas-txt", String(steps[i])); };
    $("#fs-minus").addEventListener("click", () => { if (i > 0) { i--; apply(); } });
    $("#fs-plus").addEventListener("click", () => { if (i < steps.length - 1) { i++; apply(); } });
    apply();
  }
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
    try { const r = await fetch("media/x/posts.json", { cache: "no-store" }); if (r.ok) state.xposts = await r.json(); } catch (_) {}
    try { const r = await fetch("data/id-aliases.json", { cache: "no-store" }); if (r.ok) state.aliases = await r.json(); } catch (_) {}
    if (window.NJAS_SPRITES) { try { const r = await fetch(window.NJAS_SPRITES, { cache: "no-store" }); if (r.ok) state.sprites = await r.json(); } catch (_) {} }
    buildPages();
  }
  function buildPages() {
    // pages: era openers interleaved with one page per date
    // page key: exact day "YYYY-MM-DD"; month-only records "YYYY-MM"; year-only "YYYY" (sorted before the days they precede)
    const byKey = {};
    for (const it of state.items) {
      if (!state.cats.has(it.category)) continue;
      if (state.member && !(it.members || []).includes(state.member)) continue;
      const k = it.date_precision === "month" ? it.date.slice(0, 7) : it.date_precision === "year" ? it.date.slice(0, 4) : it.date; (byKey[k] ||= []).push(it); }
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
  function assetImg(path, from) { const sp = state.sprites && state.sprites["a/" + path]; return sp ? { sprite: sp, from } : { src: "media/" + path, from }; }
  function imageOf(it) {
    if (it.image && it.image.path) return assetImg(it.image.path, it.image.source_url || it.source_url);
    if (it.local_assets && it.local_assets.length) return assetImg(it.local_assets[0], it.source_url);
    const sp = state.sprites && state.sprites[it.id];
    if (sp) return { sprite: sp, from: (state.images[it.id] || {}).page_url || it.source_url };
    const a = state.images[it.id];
    if (a) return { src: "media/auto/" + a.file, from: a.page_url };
    if (it.media && it.media.type === "youtube" && it.media.ref) return { src: `https://i.ytimg.com/vi/${it.media.ref}/hqdefault.jpg`, from: it.source_url };
    return null;
  }

  /* ---------- routing ---------- */
  function go(idx, push = true, keepToc = false) {
    if (!state.pages.length) { state.mode = "page"; renderEmptyPage(); if (!keepToc) closeToc(); return; }
    idx = Math.max(0, Math.min(state.pages.length - 1, idx));
    state.cur = idx; state.mode = "page";
    const p = state.pages[idx];
    if (push && location.hash !== "#" + p.key) history.pushState(null, "", "#" + p.key);
    store.set("njas-bookmark", p.key);
    if (!state.read.has(p.key)) { state.read.add(p.key); store.set("njas-read", JSON.stringify([...state.read])); }
    renderPage(); if (!keepToc) closeToc(); window.scrollTo({ top: 0 });
    prefetchAround(idx); setTimeout(updateNav, 0); setTimeout(updateNav, 400);
  }
  function prefetchAround(idx) {
    for (const p of [state.pages[idx + 1], state.pages[idx + 2], state.pages[idx - 1]]) {
      if (!p) continue;
      if (p.kind === "era") { const im = p.era.image ? imageOf({ id: p.era.image, source_url: "" }) : null; if (im) { if (im.sprite) withSheet(im.sprite.sheet, () => {}); else new Image().src = im.src; } continue; }
      for (const it of p.items.slice(0, 6)) { const im = imageOf(it); if (!im) continue; if (im.sprite) withSheet(im.sprite.sheet, () => {}); else new Image().src = im.src; }
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
    // record ids are permanent anchors: an id renamed after a date correction resolves through data/id-aliases.json
    if (!goKey(h)) { const id = (state.aliases && state.aliases[h]) || h; const it = state.items.find(i => i.id === id); if (it) go(state.pages.findIndex(p => p.kind === "day" && p.date === it.date), false); else showCover(); }
  }

  /* ---------- page ---------- */
  function renderEmptyPage() {
    $("#cover").hidden = true; $("#index").hidden = true; $("#page").hidden = false; $("#pager").hidden = true;
    const msg = !state.items.length ? tx("読み込み中…", "Loading…") : !state.cats.size ? tx("表示するカテゴリが選択されていません。目次でカテゴリを選んでください。", "No category is selected. Choose categories in the contents menu.") : state.member ? tx("選択中のメンバーとカテゴリに該当する記録がありません。目次で絞り込みを変えてください。", "Nothing matches the selected member and categories. Change the filters in the contents menu.") : tx("表示できる記録がありません。", "There is nothing to show.");
    const page = $("#page"); page.innerHTML = ""; page.appendChild(el("p", { class: "toc-empty" }, msg));
    $("#bar-pos").textContent = "";
  }
  function renderPage() {
    const p = state.pages[state.cur];
    $("#cover").hidden = true; $("#index").hidden = true; $("#page").hidden = false; $("#pager").hidden = false;
    document.body.classList.add("reading");
    const page = $("#page"); page.innerHTML = "";
    if (p.kind === "era") page.appendChild(renderEraPage(p)); else page.appendChild(renderDayPage(p));
    if (p.kind === "day" && !store.get("njas-hint-seen")) {
      const hint = el("div", { class: "hint mono" }, matchMedia("(pointer: coarse)").matches ? tx("左にスワイプで次の日へ · 右で前の日へ", "Swipe left for the next day · right for the previous day") : tx("← → キーでページをめくる · M で編集者表示", "Use ← → to turn pages · M for editor view"));
      page.appendChild(hint); store.set("njas-hint-seen", "1");
    }
    // pager
    const prev = state.pages[state.cur - 1], next = state.pages[state.cur + 1];
    $("#prev-btn").disabled = !prev; $("#next-btn").disabled = !next;
    $("#prev-date").textContent = prev ? pageLabel(prev) : tx("表紙 / COVER", "COVER");
    $("#prev-btn").disabled = false;
    $("#next-date").textContent = next ? (next.kind === "era" ? tx("次の期 / NEXT ERA", "NEXT ERA") : pageLabel(next)) : tx("ここまで / THE END, FOR NOW", "THE END, FOR NOW");
    $("#bar-pos").textContent = p.kind === "era" ? `${p.era.title.en.toUpperCase()}` : `${pageLabel(p)}${p.precision === "day" && dayLabel(p.date) ? " · " + dayLabel(p.date) : ""}`;
  }
  function renderEraPage(p) {
    const era = p.era;
    const h = el("section", { class: "era-page" });
    h.style.setProperty("--era", era.accent || "var(--ink)");
    const sp = era.image && state.sprites && state.sprites[era.image];
    const src = era.image && state.images[era.image] ? "media/auto/" + state.images[era.image].file : null;
    if (sp) { h.classList.add("has-img"); h.appendChild(spriteCanvas(sp, "era-img")); }
    else if (src) { h.classList.add("has-img"); h.appendChild(el("img", { class: "era-img", src, alt: "" })); }
    const body = el("div", { class: "era-body" });
    const chapterNo = state.eras.indexOf(era) + 1;
    body.append(el("span", { class: "era-kicker mono" }, tx(`ERA ${chapterNo} · 第${chapterNo}期`, `ERA ${chapterNo}`)), el("h2", { class: "era-title" }, era.title.en), state.lang === "en" ? null : el("p", { class: "era-sub" }, era.title.ja), el("p", { class: "era-cap" }, L(era.caption)), el("p", { class: "era-range mono" }, `${fmtLong(era.start)} —`));
    h.appendChild(body);
    return h;
  }
  function renderDayPage(p) {
    const wrap = el("div", { class: "day" });
    const head = el("header", { class: "day-head" });
    const d = p.date;
    if (p.precision === "day") {
      head.append(
        el("div", { class: "day-kicker mono" }, `${p.era ? p.era.title.en.toUpperCase() + " · " : ""}${weekday(d)}${tx("曜日", "")} · ${p.items.length} ${p.items.length === 1 ? "entry" : "entries"}`),
        el("h2", { class: "day-date" }, fmtLong(d)),
        el("div", { class: "day-sub" }, dayLabel(d) || "\u00a0")
      );
    } else {
      head.append(
        el("div", { class: "day-kicker mono" }, `${p.era ? p.era.title.en.toUpperCase() + " · " : ""}${p.precision === "month" ? "SOMETIME THIS MONTH" : "SOMETIME THIS YEAR"} · ${p.items.length} ${p.items.length === 1 ? "entry" : "entries"}`),
        el("h2", { class: "day-date" }, pageLabel(p)),
        el("div", { class: "day-sub" }, p.precision === "month" ? tx(`${+d.slice(5, 7)}月中（日付未確定）`, `During ${MONTHS[+d.slice(5, 7) - 1]} (exact date unknown)`) : tx(`${d.slice(0, 4)}年中（日付未確定）`, `During ${d.slice(0, 4)} (exact date unknown)`))
      );
    }
    wrap.appendChild(head);
    const list = el("div", { class: "day-list" });
    p.items.forEach((it, k) => list.appendChild(renderItem(it, k + 1, p.items.length)));
    wrap.appendChild(list);
    return wrap;
  }

  /* ---------- entry ---------- */
  function renderItem(it, pos, total) {
    const node = $("#tpl-item").content.firstElementChild.cloneNode(true);
    const cat = CATS[it.category] || { ja: it.category, en: it.category, color: "var(--rule)", ratio: "16 / 10" };
    node.style.setProperty("--cat", cat.color); node.id = it.id;
    const kind = (it.tags || []).find(t => KIND_TAGS.includes(t));
    $(".cat-label", node).textContent = `${cat.en}${state.lang === "en" || cat.ja.toUpperCase() === cat.en.toUpperCase() ? "" : " · " + cat.ja}${kind ? " · " + kind.replace("-", " ") : ""} · ${DATE_TYPES[it.date_type] || it.date_type}`;
    if (it.time) { const t = $(".time", node); t.hidden = false; t.textContent = `${it.time} KST`; }
    if (it.platform) { const pl = el("span", { class: "pill platform" }, ({ x: "X", instagram: "Instagram", weverse: "Weverse", phoning: "Phoning", tiktok: "TikTok", youtube: "YouTube", other: "SNS" })[it.platform] || it.platform); $(".meta", node).appendChild(pl); }
    if (it.entity === "njz") { const e = $(".entity", node); e.hidden = false; e.textContent = "NJZ"; }
    if (it.members && it.members.length && !(it.members.length === 1 && it.members[0] === "all")) { const m = $(".members", node); m.hidden = false; m.textContent = it.members.map(x => MEMBERS[x] || x).join(" · "); }
    if (!it.verified && state.showMeta) $(".unverified", node).hidden = false;
    const ja = state.lang !== "en";
    const both = state.lang === "both";
    $(".t-ja", node).textContent = L(it.title);
    if (both && it.title.en && it.title.en !== it.title.ja) $(".t-en", node).textContent = it.title.en; else $(".t-en", node).remove();
    if (it.title.original && it.title.original !== it.title.ja && it.title.original !== it.title.en) { const o = $(".t-orig", node); o.hidden = false; o.textContent = it.title.original; }
    if (L(it.summary)) { $(".desc", node).hidden = false; $(".s-ja", node).textContent = L(it.summary); if (both && it.summary.en) $(".s-en", node).textContent = it.summary.en; else $(".s-en", node).remove(); }
    else { $(".s-ja", node).remove(); $(".s-en", node).remove(); }
    if (it.note || it.note_en) { const n = $(".note", node); n.hidden = false; n.textContent = state.lang === "en" ? (it.note_en || it.note) : it.note; if (state.lang === "both" && it.note_en) n.after(el("p", { class: "note note-en mono", lang: "en" }, it.note_en)); $(".desc", node).hidden = false; $(".desc", node).appendChild(n); }
    if (L(it.detail)) {
      const d = el("div", { class: "detail" });
      d.appendChild(el("p", { class: "d-ja" }, L(it.detail)));
      if (both && it.detail.en) d.appendChild(el("p", { class: "d-en", lang: "en" }, it.detail.en));
      $(".desc", node).hidden = false; $(".desc", node).after(d);
    }
    if (it.credits && Object.keys(it.credits).length) {
      const dl = el("dl", { class: "credits" });
      for (const [k, v] of Object.entries(it.credits)) {
        const lab = CREDIT_LABELS[k] ? tx(CREDIT_LABELS[k][0], CREDIT_LABELS[k][1]) : k.replace(/_/g, " ");
        dl.append(el("dt", { class: "mono" }, lab), el("dd", {}, biText(v)));
      }
      ($(".detail", node) || $(".desc", node)).after(dl);
    }
    const img = imageOf(it), isYt = it.media && it.media.type === "youtube" && it.media.ref;
    const xpost = it.media && it.media.type === "x" ? xPostOf(it.media.ref) : null;
    // embeds (X / Instagram / TikTok) sit in the thumbnail slot beside the text, not below the whole entry
    const embedSlot = () => { const slot = el("figure", { class: "thumb embed-fig" }); $(".thumb", node).replaceWith(slot); return slot; };
    if (xpost && !window.NJAS_NO_EMBED) {
      // production: official X embed; the native card stands in until widgets.js renders, and stays if the script is blocked
      const box = embedSlot(); box.classList.add("xcard-box");
      const card = xCard(it, xpost); box.appendChild(card);
      // the native card stays until the official embed has actually rendered; the embed grows in a collapsed holder so no raw link ever shows
      const holder = el("div", { class: "x-embed-holder" }); box.appendChild(holder);
      const theme = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      loadScript("https://platform.twitter.com/widgets.js", () => {
        const run = () => { const w = window.twttr?.widgets; if (!w?.createTweet) return;
        w.createTweet(xStatusId(it.media.ref), holder, { dnt: true, theme, align: "center", lang: state.lang === "en" ? "en" : "ja" }).then(elm => { if (elm && elm.offsetHeight > 40) { card.remove(); holder.classList.add("ready"); } }).catch(() => {}); };
        window.twttr?.ready ? window.twttr.ready(run) : run();
      });
    } else if (xpost) { const box = embedSlot(); box.classList.add("xcard-box"); box.appendChild(xCard(it, xpost)); }
    else if (img) {
      const fig = $(".thumb", node); fig.hidden = false;
      if (img.sprite) fig.appendChild(spriteCanvas(img.sprite, "thumb-cv")); else fig.appendChild(el("img", { src: img.src, alt: "", loading: "lazy", decoding: "async" }));
      if (isYt && !window.NJAS_NO_EMBED) {
        fig.classList.add("is-video"); fig.appendChild(el("span", { class: "play mono" }, "▶ PLAY"));
        fig.addEventListener("click", () => {
          if (fig.classList.contains("playing")) return;
          // player is created only on tap and takes the thumbnail's place, so it plays where it was tapped; rel=0 limits end-screen suggestions to this channel
          fig.style.width = fig.getBoundingClientRect().width + "px"; fig.classList.add("playing"); fig.innerHTML = "";
          const player = el("div", { class: "player" });
          player.appendChild(el("iframe", { src: `https://www.youtube-nocookie.com/embed/${it.media.ref}?autoplay=1&rel=0&playsinline=1&modestbranding=1`, allow: "autoplay; encrypted-media; picture-in-picture", allowfullscreen: "", title: it.title.en }));
          fig.append(player, el("p", { class: "media-foot mono" }, el("a", { href: `https://www.youtube.com/watch?v=${it.media.ref}`, target: "_blank", rel: "noopener" }, state.lang !== "en" ? "YouTubeで開く ↗" : "Open on YouTube ↗"), el("span", { class: "dim" }, state.lang !== "en" ? "　再生できない動画は埋め込みが許可されていません" : "  Videos that do not play here have embedding disabled")));
        });
      } else if (isYt) {
        fig.classList.add("is-video"); fig.appendChild(el("span", { class: "play mono" }, "▶ OPEN ON YOUTUBE"));
        const a = el("a", { href: `https://www.youtube.com/watch?v=${it.media.ref}`, target: "_blank", rel: "noopener", class: "thumb-link", "aria-label": "Open on YouTube" });
        fig.appendChild(a);
      } else fig.addEventListener("click", () => openLightbox(it, img));
    }
    // gallery: individual images under the cover (cover = image.path, or the first local asset)
    const galleryItems = it.image && it.image.path ? (it.local_assets || []) : (it.local_assets || []).slice(1);
    if (galleryItems.length) {
      const box = $(".assets", node); box.hidden = false; box.className = "assets gallery";
      galleryItems.forEach((pth, k) => {
        const im = assetImg(pth, (it.image && it.image.source_url) || it.source_url);
        const fig = el("figure", { class: "g-item", "aria-label": `${k + 1} / ${galleryItems.length}` });
        const titles = it.image && it.image.path ? (it.asset_titles || []) : (it.asset_titles || []).slice(1);
        const cap = biText(titles[k]);
        fig.appendChild(im.sprite ? spriteCanvas(im.sprite, "g-img") : el("img", { class: "g-img", src: im.src, alt: cap, loading: "lazy", decoding: "async" }));
        if (cap) fig.appendChild(el("figcaption", { class: "g-cap" }, cap));
        fig.addEventListener("click", () => openLightbox(it, im));
        box.appendChild(fig);
      });
      const cnt = el("span", { class: "g-count mono" }, `1 / ${galleryItems.length}`);
      box.after(cnt);
      box.addEventListener("scroll", () => { const i = Math.round(box.scrollLeft / Math.max(1, box.clientWidth)); cnt.textContent = `${Math.min(galleryItems.length, i + 1)} / ${galleryItems.length}`; }, { passive: true });
    }
    // official Instagram / TikTok embeds (production only; the artifact host blocks third-party scripts). X posts use the native card above.
    if (!window.NJAS_NO_EMBED && it.category === "sns" && (it.platform === "instagram" || it.platform === "tiktok")) {
      const cands = [(it.links || {})[it.platform], it.source_url, ...Object.values(it.links || {})].filter(Boolean);
      const ig = cands.find(u => /instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/.test(u));
      const tt = cands.find(u => /tiktok\.com\/@[^/]+\/video\/\d+/.test(u));
      if (it.platform === "instagram" && ig) {
        const url = ig.split("?")[0].replace(/\/?$/, "/");
        const box = embedSlot(); box.classList.add("embed");
        const bq = el("blockquote", { class: "instagram-media", "data-instgrm-permalink": url, "data-instgrm-version": "14" });
        bq.appendChild(el("a", { href: url }, url)); box.appendChild(bq);
        loadScript("https://www.instagram.com/embed.js", () => window.instgrm?.Embeds?.process());
      } else if (it.platform === "tiktok" && tt) {
        const url = tt.split("?")[0], vid = /video\/(\d+)/.exec(url)[1];
        const box = embedSlot(); box.classList.add("embed");
        const bq = el("blockquote", { class: "tiktok-embed", cite: url, "data-video-id": vid });
        bq.appendChild(el("section", {}, el("a", { href: url, target: "_blank", rel: "noopener" }, url))); box.appendChild(bq);
        loadScript("https://www.tiktok.com/embed.js", () => {});
      }
    }
    const links = $(".links", node);
    if (isYt) links.appendChild(el("a", { href: `https://www.youtube.com/watch?v=${it.media.ref}`, target: "_blank", rel: "noopener" }, state.lang !== "en" ? "YouTubeで開く" : "open on YouTube"));
    if (it.media && it.media.type === "x" && it.media.ref) { const gone = !xpost && state.xposts[xStatusId(it.media.ref)]?.unavailable; links.appendChild(el("a", { href: it.media.ref, target: "_blank", rel: "noopener", class: gone ? "gone" : "" }, gone ? (state.lang !== "en" ? "元の投稿（削除済み）" : "original post (removed)") : (state.lang !== "en" ? "Xで開く" : "open on X"))); }
    links.appendChild(el("a", { href: it.source_url, target: "_blank", rel: "noopener" }, "source"));
    for (const [k, u] of Object.entries(it.links || {})) links.appendChild(el("a", { href: u, target: "_blank", rel: "noopener", class: "svc" }, k.replace("_", " ")));
    if (state.showMeta) (it.reference_urls || []).forEach((u, i) => links.appendChild(el("a", { href: u, target: "_blank", rel: "noopener" }, `ref ${i + 1}`)));
    if (state.showMeta && it.editor_note) { const n = el("p", { class: "note mono editor" }, "EDITOR: " + it.editor_note); $(".entry-text", node).appendChild(n); }
    if (it.tags && it.tags.length) { const t = $(".tags", node); t.hidden = false; it.tags.forEach(x => t.appendChild(el("span", {}, x))); }
    return node;
  }

  const sheets = {};
  /* ---------- X post cards (data pre-fetched by scripts/fetch_x.py) ---------- */
  function xStatusId(url) { const m = /(?:x|twitter)\.com\/[^/]+\/status\/(\d+)/.exec(url || ""); return m ? m[1] : null; }
  function xPostOf(url) { const id = xStatusId(url); const p = id && state.xposts[id]; return p && !p.unavailable ? p : null; }
  function xImage(file) { const sp = state.sprites && state.sprites["x/" + file]; return sp ? { sprite: sp } : { src: "media/x/" + file }; }
  function xTime(iso) {
    if (!iso) return ""; const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
    const z = n => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}.${z(d.getUTCMonth() + 1)}.${z(d.getUTCDate())} ${z(d.getUTCHours())}:${z(d.getUTCMinutes())} KST`;
  }
  function xText(text) {
    const p = el("p", { class: "x-text" });
    const re = /(https?:\/\/\S+)|(#[\p{L}\p{N}_]+)|(@[A-Za-z0-9_]{1,15})/gu; let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) p.appendChild(document.createTextNode(text.slice(last, m.index)));
      const href = m[1] ? m[1] : m[2] ? `https://x.com/hashtag/${encodeURIComponent(m[2].slice(1))}` : `https://x.com/${m[3].slice(1)}`;
      p.appendChild(el("a", { href, target: "_blank", rel: "noopener" }, m[1] ? m[1].replace(/^https?:\/\//, "") : m[0]));
      last = m.index + m[0].length;
    }
    if (last < text.length) p.appendChild(document.createTextNode(text.slice(last)));
    return p;
  }
  function xCard(it, post) {
    const card = el("article", { class: "xcard" });
    const head = el("header", { class: "x-head" });
    const av = post.author?.avatar ? xImage(post.author.avatar) : null;
    if (av) head.appendChild(av.sprite ? spriteCanvas(av.sprite, "x-avatar") : el("img", { class: "x-avatar", src: av.src, alt: "", loading: "lazy" }));
    head.appendChild(el("div", { class: "x-names" }, el("span", { class: "x-name" }, post.author?.name || ""), el("span", { class: "x-handle mono" }, "@" + (post.author?.screen_name || ""))));
    head.appendChild(el("a", { class: "x-mark mono", href: post.url, target: "_blank", rel: "noopener", "aria-label": "Open on X" }, "X"));
    card.appendChild(head);
    if (post.text) card.appendChild(xText(post.text));
    if (post.media && post.media.length) {
      const grid = el("div", { class: "x-media n" + Math.min(post.media.length, 4) });
      post.media.forEach(me => {
        const im = xImage(me.file);
        const fig = el("figure", { class: "x-fig" + (me.type !== "photo" ? " is-video" : "") });
        fig.style.aspectRatio = `${me.w} / ${me.h}`;
        fig.appendChild(im.sprite ? spriteCanvas(im.sprite, "x-img") : el("img", { class: "x-img", src: im.src, alt: "", loading: "lazy", decoding: "async" }));
        if (me.type !== "photo") { fig.appendChild(el("a", { class: "play mono", href: post.url, target: "_blank", rel: "noopener" }, "▶ " + (me.type === "gif" ? "GIF" : "VIDEO") + " ON X")); }
        else fig.addEventListener("click", () => openLightbox(it, { sprite: im.sprite, src: im.src, from: post.url }));
        grid.appendChild(fig);
      });
      card.appendChild(grid);
    }
    if (post.quote) {
      const q = el("blockquote", { class: "x-quote" });
      q.appendChild(el("div", { class: "x-names" }, el("span", { class: "x-name" }, post.quote.author?.name || ""), el("span", { class: "x-handle mono" }, "@" + (post.quote.author?.screen_name || ""))));
      if (post.quote.text) q.appendChild(xText(post.quote.text));
      card.appendChild(q);
    }
    card.appendChild(el("footer", { class: "x-foot mono" }, el("span", {}, xTime(post.created_at)), el("a", { href: post.url, target: "_blank", rel: "noopener" }, state.lang !== "en" ? "Xで見る ↗" : "View on X ↗")));
    return card;
  }
  function withSheet(src, cb) {
    const s = sheets[src];
    if (s && s.complete && s.naturalWidth) { cb(s); return; }
    if (s) { s.addEventListener("load", () => cb(s), { once: true }); return; }
    const im = new Image(); im.src = src; sheets[src] = im; im.addEventListener("load", () => cb(im), { once: true });
  }
  // draws a sprite region into a canvas sized to the region; returns the canvas
  function spriteCanvas(sp, cls) {
    const cv = el("canvas", { width: String(sp.w), height: String(sp.h), class: cls || "" });
    cv.style.aspectRatio = `${sp.w} / ${sp.h}`;
    withSheet(sp.sheet, im => { cv.getContext("2d").drawImage(im, 0, sp.y, sp.w, sp.h, 0, 0, sp.w, sp.h); cv.classList.add("ready"); });
    return cv;
  }
  const loaded = {};
  function loadScript(src, onload) {
    if (loaded[src] === true) { onload && onload(); return; }
    if (loaded[src]) { loaded[src].push(onload); return; }
    loaded[src] = [onload];
    const s = el("script", { src, async: "" });
    s.onload = () => { const cbs = loaded[src]; loaded[src] = true; cbs.forEach(cb => cb && cb()); };
    document.head.appendChild(s);
  }

  /* ---------- lightbox ---------- */
  function openLightbox(it, img) {
    const old = $("#lb-canvas"); if (old) old.remove();
    if (img.sprite) { $("#lb-img").hidden = true; const cv = spriteCanvas(img.sprite, "lb-cv"); cv.id = "lb-canvas"; $("#lb-img").after(cv); }
    else { $("#lb-img").hidden = false; $("#lb-img").src = img.src; $("#lb-img").alt = it.title.ja; }
    $("#lb-meta").textContent = `${fmtLong(it.date)}${dayLabel(it.date) ? " · " + dayLabel(it.date) : ""} · ${CATS[it.category]?.en || it.category}`;
    $("#lb-title").textContent = L(it.title);
    const links = $("#lb-links"); links.innerHTML = ""; links.appendChild(el("a", { href: img.from, target: "_blank", rel: "noopener" }, "image source"));
    $("#lightbox").hidden = false; document.body.style.overflow = "hidden";
  }
  function closeLightbox() { const lb = $("#lightbox"); if (lb.hidden) return; lb.hidden = true; $("#lb-img").src = ""; document.body.style.overflow = ""; }

  /* ---------- table of contents (read state = pages already visited) ---------- */
  const isRead = p => state.read.has(p.key);
  function openToc() {
    $("#toc").hidden = false; $("#scrim").hidden = false; $("#toc-btn").setAttribute("aria-expanded", "true");
    state.tocMonth = null;
    renderToc(); setTimeout(() => $("#toc .current")?.scrollIntoView({ block: "center" }), 0);
  }
  /* bottom nav: scroll progress of the page and the entry in view (n / N) */
  let navTick = false;
  function updateNav() {
    navTick = false;
    const fill = $("#progress-fill"); if (!fill) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    fill.style.width = (max > 0 ? Math.min(100, Math.max(0, scrollY / max * 100)) : 100) + "%";
    const p = state.pages[state.cur]; const cnt = $("#day-count");
    if (!p || p.kind !== "day" || state.mode !== "page") { cnt.textContent = ""; return; }
    const entries = [...document.querySelectorAll("#page .entry")]; if (!entries.length) { cnt.textContent = ""; return; }
    const line = innerHeight * 0.38; let cur = 0;
    entries.forEach((e, k) => { if (e.getBoundingClientRect().top <= line) cur = k; });
    if (max > 0 && scrollY >= max - 2) cur = entries.length - 1;
    cnt.textContent = `${cur + 1} / ${entries.length}`;
  }
  function scheduleNav() { if (!navTick) { navTick = true; requestAnimationFrame(updateNav); } }
  function closeToc() { $("#toc").hidden = true; $("#scrim").hidden = true; $("#toc-btn").setAttribute("aria-expanded", "false"); }
  const hitQ = (it, q) => !q || [it.title.ja, it.title.en, it.title.original, it.summary?.ja, it.summary?.en, it.detail?.ja, it.detail?.en, ...(it.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(q);
  function buildCatChips() {
    const box = $("#toc-cats"); box.innerHTML = "";
    for (const [k, v] of Object.entries(CATS)) {
      const b = el("button", { class: "chip", type: "button", "data-cat": k, "aria-pressed": String(state.cats.has(k)) });
      b.style.setProperty("--chip", v.color); b.append(el("i", { class: "sw" }), el("span", {}, tx(v.ja, v.en)));
      b.addEventListener("click", () => {
        if (state.cats.has(k)) state.cats.delete(k); else state.cats.add(k);
        store.set("njas-cats2", state.cats.size === Object.keys(CATS).length ? "" : ("|" + [...state.cats].join(",")));
        applyFilter();
      });
      box.appendChild(b);
    }
    const tools = el("div", { class: "toc-cat-tools" });
    const all = el("button", { class: "chip chip-all", type: "button" }, tx("全選択", "Select all"));
    all.addEventListener("click", () => { state.cats = new Set(Object.keys(CATS)); store.set("njas-cats2", ""); applyFilter(); });
    const none = el("button", { class: "chip chip-all", type: "button" }, tx("全解除", "Clear"));
    none.addEventListener("click", () => { state.cats = new Set(); store.set("njas-cats2", "|"); applyFilter(); });
    tools.append(all, none); box.appendChild(tools);
  }
  function buildMemberChips() {
    const box = $("#toc-members"); if (!box) return; box.innerHTML = "";
    const mk = (key, label) => {
      const b = el("button", { class: "chip chip-member", type: "button", "data-member": key || "", "aria-pressed": String((state.member || "") === (key || "")) }, label);
      b.addEventListener("click", () => { state.member = key; store.set("njas-member", key || ""); applyFilter(); });
      return b;
    };
    box.appendChild(mk(null, state.lang !== "en" ? "全員" : "All"));
    for (const [k, v] of Object.entries(MEMBERS)) if (k !== "all") box.appendChild(mk(k, state.lang !== "en" ? ({ minji: "ミンジ", hanni: "ハニ", danielle: "ダニエル", haerin: "ヘリン", hyein: "ヘイン" })[k] : v));
  }
  function applyFilter() {
    const key = state.pages[state.cur]?.key || state.lastKey;
    if (key) state.lastKey = key;
    buildPages();
    document.querySelectorAll("#toc-cats [data-cat]").forEach(b => b.setAttribute("aria-pressed", String(state.cats.has(b.dataset.cat))));
    document.querySelectorAll("#toc-members [data-member]").forEach(b => b.setAttribute("aria-pressed", String((state.member || "") === b.dataset.member)));
    if (state.mode === "page") {
      if (!state.pages.length) { state.cur = -1; renderEmptyPage(); }
      else {
        let i = key ? state.pages.findIndex(p => p.key === key) : -1;
        if (i < 0 && key) i = nearestDateIdx(key.length === 10 ? key : key + "-01");
        if (i < 0) i = 0;
        go(i, true, true);
      }
    }
    renderToc();
  }
  function renderToc() {
    const body = $("#toc-body"), nav = $("#toc-nav"); body.innerHTML = ""; nav.innerHTML = "";
    const q = $("#toc-q").value.trim().toLowerCase();
    const days = state.pages.map((p, i) => ({ p, i })).filter(x => x.p.kind === "day");
    if (!state.cats.size) { body.appendChild(el("p", { class: "toc-empty" }, tx("表示するカテゴリが選択されていません。", "No category is selected."))); return; }

    // search: flat list over the known range
    if (q) {
      body.appendChild(el("div", { class: "toc-section mono" }, tx("検索結果 / RESULTS", "RESULTS")));
      let n = 0;
      for (const { p, i } of days) {
        for (const it of p.items) if (hitQ(it, q)) { body.appendChild(itemRow(p, i, it)); n++; }
      }
      if (!n) body.appendChild(el("p", { class: "toc-empty" }, tx("該当なし", "No matches")));
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
          const some = list ? list.some(x => isRead(x.p)) : false;
          const all = list ? list.every(x => isRead(x.p)) : false;
          cell.classList.toggle("done", all); cell.classList.toggle("partial", some && !all); cell.classList.toggle("current", ym === curYm);
          const nItems = list ? list.reduce((a, x) => a + x.p.items.length, 0) : 0;
          cell.append(el("span", { class: "cal-m" }, tx(`${m}月`, MONTHS[m - 1])), el("span", { class: "cal-n mono" }, list ? tx(`${nItems}件`, `${nItems}`) : ""));
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
    const back = el("button", { class: "toc-back mono", type: "button" }, tx("← カレンダー / ALL MONTHS", "← ALL MONTHS"));
    back.addEventListener("click", () => { state.tocMonth = null; renderToc(); });
    const prevM = days.filter(x => x.p.date.slice(0, 7) < ym).pop(), nextM = days.find(x => x.p.date.slice(0, 7) > ym);
    const mnav = el("div", { class: "toc-mnav" });
    const pb = el("button", { class: "toc-back mono", type: "button" }, tx("← 前の月", "← Previous month")); if (!prevM) pb.setAttribute("disabled", ""); else pb.addEventListener("click", () => { state.tocMonth = prevM.p.date.slice(0, 7); renderToc(); });
    const nb = el("button", { class: "toc-back mono", type: "button" }, tx("次の月 →", "Next month →")); if (!nextM) nb.setAttribute("disabled", ""); else nb.addEventListener("click", () => { state.tocMonth = nextM.p.date.slice(0, 7); renderToc(); });
    mnav.append(pb, nb);
    nav.append(back, mnav);
    body.appendChild(el("h3", { class: "toc-month-title" }, tx(`${ym.slice(0, 4)}年${+ym.slice(5, 7)}月`, `${MONTHS[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`)));
    // flat list: one row per entry (date · title · category); pages already visited are marked read
    let any = false, lastDate = null;
    for (const { p, i } of days) {
      if (p.date.slice(0, 7) !== ym) continue;
      any = true;
      const newDay = p.key !== lastDate; lastDate = p.key;
      p.items.forEach((it, k) => {
        const row = itemRow(p, i, it);
        if (k === 0 && newDay) row.classList.add("day-start");
        if (i === state.cur) row.classList.add("current");
        body.appendChild(row);
      });
    }
    if (!any) body.appendChild(el("p", { class: "toc-empty" }, tx("この月に該当する項目はありません", "Nothing this month")));
  }
  function dateLabel(p) { return p.precision === "day" ? `${p.date.slice(5, 7)}.${p.date.slice(8, 10)}` : p.precision === "month" ? (state.lang !== "en" ? "月内" : "month") : (state.lang !== "en" ? "年内" : "year"); }
  function itemRow(p, i, it) {
    const row = el("button", { class: "toc-item" + (isRead(p) ? " read" : ""), type: "button" });
    const dot = el("i", { class: "dot" }); dot.style.background = CATS[it.category]?.color || "var(--rule)";
    row.append(el("span", { class: "toc-item-date mono" }, dateLabel(p)), dot, el("span", { class: "toc-item-text" }, L(it.title)), el("span", { class: "toc-item-cat mono" }, CATS[it.category]?.en || it.category));
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
        row.append(el("span", { class: "mono" }, key.replace(/-/g, ".")), el("i", { class: "dot" }), el("span", { class: "index-title-text" }, L(it.title) + (it.verified ? "" : " ⚠")), el("span", { class: "mono dim" }, CATS[it.category]?.en || it.category));
        row.addEventListener("click", e => { e.preventDefault(); state.showMeta = true; go(state.pages.findIndex(pp => pp.kind === "day" && pp.key === key)); });
        table.appendChild(row);
      }
    }
  }

  /* ---------- wiring ---------- */
  function wire() {
    // data may still be loading when the cover is first shown: wait for it instead of rendering an empty book
    $("#start-btn").addEventListener("click", () => { state.showMeta = false; state.ready.then(() => go(0)); });
    $("#resume-btn").addEventListener("click", () => state.ready.then(() => goKey(store.get("njas-bookmark"))));
    $("#brand").addEventListener("click", e => { e.preventDefault(); showCover(); });
    // once the page scrolls, the floating bar gets a backing so the logo and MENU never sit on top of text
    const bar = $(".bar"), onScroll = () => bar.classList.toggle("scrolled", document.body.classList.contains("reading") && window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true }); new MutationObserver(onScroll).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    $("#prev-btn").addEventListener("click", () => { if (state.cur <= 0) showCover(); else go(state.cur - 1); });
    $("#pager-mid").addEventListener("click", openToc);
    addEventListener("scroll", scheduleNav, { passive: true }); addEventListener("resize", scheduleNav);
    $("#next-btn").addEventListener("click", () => go(state.cur + 1));
    $("#toc-btn").addEventListener("click", () => ($("#toc").hidden ? openToc() : closeToc()));
    $("#toc-close").addEventListener("click", closeToc); $("#scrim").addEventListener("click", closeToc);
    $("#toc-q").addEventListener("input", renderToc);
    const savedCats = store.get("njas-cats2"); if (savedCats && savedCats.startsWith("|")) { state.cats = new Set(savedCats.slice(1).split(",").filter(k => CATS[k])); }
    buildCatChips(); const sm = store.get("njas-member"); if (sm && MEMBERS[sm]) state.member = sm; buildMemberChips();
    try { state.read = new Set(JSON.parse(store.get("njas-read") || "[]")); } catch (_) { state.read = new Set(); }

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
    document.addEventListener("touchstart", e => { if (e.target.closest(".gallery, .x-media, .media, .toc, .lightbox")) { tx = ty = null; return; } tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    document.addEventListener("touchend", e => {
      if (tx == null || state.mode !== "page" || !$("#lightbox").hidden || !$("#toc").hidden) return;
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = ty = null;
      if (Math.abs(dx) > 70 && Math.abs(dy) < 50) { if (dx < 0) go(state.cur + 1); else if (state.cur > 0) go(state.cur - 1); }
    }, { passive: true });
    window.addEventListener("hashchange", route);
  }

  initLang(); initTheme(); initTextSize(); wire();
  // while the data loads, the start button says so in its own words (and cannot be pressed); the normal label returns when ready
  const startBtn = $("#start-btn");
  startBtn.classList.add("loading"); startBtn.setAttribute("aria-busy", "true"); startBtn.disabled = true; startBtn.textContent = tx("読み込み中…", "Loading…");
  // cover label: span and size of the archive, computed from the data so it stays current
  const coverSpan = () => {
    const ds = state.items.map(i => i.date).sort(); if (!ds.length) return;
    const ym = d => `${d.slice(0, 4)}.${d.slice(5, 7)}`;
    $("#cover-span").textContent = `${ym(ds[0])} — ${ym(ds[ds.length - 1])} · ${state.items.length.toLocaleString("en-US")} RECORDS`;
  };
  state.ready = load().then(() => { startBtn.classList.remove("loading"); startBtn.removeAttribute("aria-busy"); startBtn.disabled = false; applyStatic(); coverSpan(); });
  state.ready.then(route).catch(err => { $("#cover .lede").textContent = "Failed to load data: " + err.message; });
})();

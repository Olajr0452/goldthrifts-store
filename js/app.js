/* Goldthrifts Store — front-end
   Reads content/settings.json and data/products.json, renders the shop, builds WhatsApp links. */
(function () {
  "use strict";

  const CATEGORIES = ["Tops", "Outerwear", "Bottoms", "Dresses", "Loungewear", "Sneakers", "Accessories"];
  const PAGE_SIZE = 12;
  const WISH_KEY = "gt_wishlist";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const state = {
    settings: null,
    products: [],
    filters: { q: "", audience: "", category: "", special: "" },
    shown: PAGE_SIZE,
    wishlist: loadWishlist(),
  };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function naira(n) {
    const v = Number(n) || 0;
    return "₦" + v.toLocaleString("en-NG");
  }
  function loadWishlist() {
    try { return new Set(JSON.parse(localStorage.getItem(WISH_KEY) || "[]")); } catch (e) { return new Set(); }
  }
  function saveWishlist() {
    try { localStorage.setItem(WISH_KEY, JSON.stringify(Array.from(state.wishlist))); } catch (e) { /* private mode */ }
    const n = state.wishlist.size;
    $$("#savedCount").forEach((el) => (el.textContent = n ? String(n) : ""));
  }
  function productUrl(p) {
    return location.origin + "/product.html?id=" + encodeURIComponent(p.id);
  }
  function waLink(text) {
    const num = (state.settings && state.settings.whatsapp || "").replace(/\D/g, "");
    return "https://wa.me/" + num + (text ? "?text=" + encodeURIComponent(text) : "");
  }
  function waProductLink(p, size) {
    const shop = state.settings.shopName || "there";
    let msg = "Hi " + shop + "! I'm interested in *" + p.name + "* (" + naira(p.price) + ")";
    if (size) msg += ", size " + size;
    msg += ". Is it still available?\n" + productUrl(p);
    return waLink(msg);
  }
  function isSale(p) { return Number(p.oldPrice) > Number(p.price); }
  function toast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>' + esc(msg);
    t.classList.add("is-visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("is-visible"), 2200);
  }

  const ICONS = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8Zm-3.3 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.1-1.4l-.5-.3-2-1c-.3-.1-.5-.1-.7.2l-.9 1.1c-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5.3-.5v-.5l-.9-2.2c-.2-.5-.4-.5-.6-.5h-.7Z"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 15V3m0 0L8 7m4-4 4 4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>',
    hanger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a2 2 0 0 0-2 2c0 1 .8 1.6 2 2.5V11L3 17v2h18v-2l-9-6"/></svg>',
  };

  /* ---------- shared rendering ---------- */
  function bindSettings() {
    const s = state.settings;
    const pretty = {
      shopName: s.shopName, shopSuffix: s.shopSuffix, introHeading: s.introHeading, introText: s.introText,
      footerNote: s.footerNote, location: s.location,
      whatsappPretty: "+" + (s.whatsapp || "").replace(/\D/g, ""),
      instagramPretty: s.instagram ? "@" + s.instagram : "",
      tiktokPretty: s.tiktok ? "@" + s.tiktok : "",
    };
    $$("[data-bind]").forEach((el) => {
      const k = el.getAttribute("data-bind");
      if (pretty[k] != null) el.textContent = pretty[k];
    });
    const links = {
      whatsapp: waLink("Hi " + s.shopName + "! I'm browsing your shop and have a question."),
      instagram: s.instagram ? "https://instagram.com/" + encodeURIComponent(s.instagram) : "",
      tiktok: s.tiktok ? "https://tiktok.com/@" + encodeURIComponent(s.tiktok) : "",
    };
    $$("[data-link]").forEach((el) => {
      const k = el.getAttribute("data-link");
      if (links[k]) el.href = links[k]; else el.style.display = "none";
    });
    const y = $("#year"); if (y) y.textContent = String(new Date().getFullYear());
    document.title = document.title.replace(/^Goldthrifts Store/, s.shopName + " " + s.shopSuffix);
  }

  function cardHTML(p) {
    const saved = state.wishlist.has(p.id);
    const sale = isSale(p);
    const badges = [];
    if (p.soldOut) badges.push('<span class="badge badge--sold">Sold out</span>');
    else {
      if (p.new) badges.push('<span class="badge badge--new">New</span>');
      if (sale) badges.push('<span class="badge badge--sale">Sale</span>');
    }
    const price = sale
      ? '<span class="price-pill price-pill--dark"><s>' + naira(p.oldPrice) + "</s>" + naira(p.price) + "</span>"
      : '<span class="price-pill">' + naira(p.price) + "</span>";
    const img = (p.images && p.images[0]) || "";
    return (
      '<article class="card' + (p.soldOut ? " card--sold" : "") + '" data-id="' + esc(p.id) + '">' +
        '<a class="card__media" href="/product.html?id=' + encodeURIComponent(p.id) + '" aria-label="' + esc(p.name) + '">' +
          '<img src="' + esc(img) + '" alt="' + esc(p.name) + '" loading="lazy" />' +
          '<div class="card__badges">' + badges.join("") + "</div>" +
        "</a>" +
        '<div class="card__body">' +
          '<h3 class="card__name"><a href="/product.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + "</a></h3>" +
          '<p class="card__summary">' + esc(p.summary || "") + "</p>" +
          '<div class="card__foot">' + price +
            '<div class="card__actions">' +
              '<button class="round-btn' + (saved ? " is-saved" : "") + '" data-wish="' + esc(p.id) + '" aria-label="' + (saved ? "Remove from saved" : "Save") + '" aria-pressed="' + saved + '">' + ICONS.heart + "</button>" +
              '<a class="round-btn" href="' + waProductLink(p) + '" target="_blank" rel="noopener" aria-label="Ask about ' + esc(p.name) + ' on WhatsApp">' + ICONS.wa + "</a>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function wireWishlist(root) {
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-wish]");
      if (!btn) return;
      e.preventDefault();
      const id = btn.getAttribute("data-wish");
      if (state.wishlist.has(id)) { state.wishlist.delete(id); toast("Removed from your saved items"); }
      else { state.wishlist.add(id); toast("Saved. Find it under the heart icon"); }
      saveWishlist();
      $$('[data-wish="' + id + '"]').forEach((b) => {
        const on = state.wishlist.has(id);
        b.classList.toggle("is-saved", on);
        b.setAttribute("aria-pressed", String(on));
      });
      if (state.filters.special === "saved" && document.body.dataset.page === "home") renderGrid();
    });
  }

  function wireDrawer() {
    const drawer = $("#drawer");
    const open = () => { drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); };
    const close = () => { drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); };
    const btn = $("#menuBtn"); if (btn) btn.addEventListener("click", open);
    $$("[data-close]", drawer).forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------- home page ---------- */
  function initHome() {
    const s = state.settings;

    // Hero slides
    const slides = Array.isArray(s.hero) && s.hero.length ? s.hero : [{ image: "", title: s.shopName, text: s.tagline }];
    const wrap = $("#heroSlides");
    wrap.innerHTML = slides.map((sl) => '<div class="hero__slide" style="background-image:url(\'' + esc(sl.image) + '\')"></div>').join("");
    let idx = 0;
    function showSlide(i) {
      idx = (i + slides.length) % slides.length;
      $$(".hero__slide", wrap).forEach((el, k) => el.classList.toggle("is-active", k === idx));
      const sl = slides[idx];
      $("#heroTitle").textContent = sl.title || "";
      $("#heroText").textContent = sl.text || "";
      $("#heroBtn").textContent = sl.buttonLabel || "Start shopping";
      $("#heroCaption").textContent = sl.caption || "";
      const target = idx === 1 ? "#new" : idx === 2 ? "#sale" : "#browse";
      $("#heroBtn").setAttribute("href", target);
    }
    showSlide(0);
    $("#heroPrev").addEventListener("click", () => showSlide(idx - 1));
    $("#heroNext").addEventListener("click", () => showSlide(idx + 1));
    if (slides.length < 2) $(".hero__nav").style.display = "none";
    let timer = setInterval(() => showSlide(idx + 1), 7000);
    $("#hero").addEventListener("pointerenter", () => clearInterval(timer));
    $("#hero").addEventListener("pointerleave", () => { timer = setInterval(() => showSlide(idx + 1), 7000); });

    // Promo cards
    if (s.promo1) {
      $("#promo1Img").src = s.promo1.image || ""; $("#promo1Img").alt = s.promo1.title || "";
      $("#promo1Title").textContent = s.promo1.title || ""; $("#promo1Text").textContent = s.promo1.text || "";
    }
    if (s.promo2) {
      $("#promo2Img").src = s.promo2.image || ""; $("#promo2Img").alt = s.promo2.title || "";
      $("#promo2Title").textContent = s.promo2.title || ""; $("#promo2Text").textContent = s.promo2.text || "";
      $("#promo2Year").textContent = s.promo2.year || ""; $("#promo2Label").textContent = s.promo2.label || "";
    }

    // Category select + pills (only categories that have products, in fixed order)
    const present = CATEGORIES.filter((c) => state.products.some((p) => p.category === c));
    const sel = $("#catSelect");
    present.forEach((c) => { const o = document.createElement("option"); o.value = c; o.textContent = c; sel.appendChild(o); });
    $("#catPills").innerHTML =
      '<button class="chip is-active" data-cat="">All</button>' +
      present.map((c) => '<button class="chip" data-cat="' + esc(c) + '">' + esc(c) + "</button>").join("");

    // Filter events
    sel.addEventListener("change", () => setFilter({ category: sel.value }));
    $("#catPills").addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]"); if (!b) return;
      setFilter({ category: b.getAttribute("data-cat") });
    });
    $("#filters").addEventListener("click", (e) => {
      const sp = e.target.closest("[data-special]");
      if (sp) { const v = sp.getAttribute("data-special"); setFilter({ special: state.filters.special === v ? "" : v }); return; }
      const au = e.target.closest("[data-audience]");
      if (au) { const v = au.getAttribute("data-audience"); setFilter({ audience: state.filters.audience === v ? "" : v }); }
    });
    const input = $("#searchInput");
    let t;
    input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => setFilter({ q: input.value.trim() }), 180); });
    $("#searchBtn").addEventListener("click", () => setFilter({ q: input.value.trim() }));
    const sf = $("#searchFocus"); if (sf) sf.addEventListener("click", () => input.focus());
    $("#savedBtn").addEventListener("click", () => setFilter({ special: state.filters.special === "saved" ? "" : "saved" }));
    $("#grid").addEventListener("click", (e) => {
      const more = e.target.closest("[data-more]"); if (more) { state.shown += PAGE_SIZE; renderGrid(); }
      const clear = e.target.closest("[data-clear]"); if (clear) clearFilters();
    });
    $("#gridFoot").addEventListener("click", (e) => {
      const more = e.target.closest("[data-more]"); if (more) { state.shown += PAGE_SIZE; renderGrid(); }
    });
    wireWishlist($("#grid"));

    // Hash routes: #new #sale #saved #men #women #children #browse
    function applyHash() {
      const h = (location.hash || "").replace("#", "").toLowerCase();
      if (!h) return;
      if (h === "new" || h === "sale" || h === "saved") setFilter({ special: h }, true);
      else if (["men", "women", "children", "unisex"].includes(h)) setFilter({ audience: h[0].toUpperCase() + h.slice(1) }, true);
      else if (h === "browse") { $("#browse").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      else return;
      $("#browse").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    window.addEventListener("hashchange", applyHash);
    renderGrid();
    applyHash();
  }

  function setFilter(patch, keepHash) {
    Object.assign(state.filters, patch);
    state.shown = PAGE_SIZE;
    if (!keepHash && location.hash && location.hash !== "#browse") history.replaceState(null, "", location.pathname + location.search);
    syncFilterUI();
    renderGrid();
  }
  function clearFilters() {
    state.filters = { q: "", audience: "", category: "", special: "" };
    $("#searchInput").value = "";
    setFilter({});
  }
  function syncFilterUI() {
    const f = state.filters;
    $("#catSelect").value = f.category;
    $$("[data-cat]").forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-cat") === f.category));
    $$("[data-special]").forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-special") === f.special));
    $$("[data-audience]").forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-audience") === f.audience));
    $("#savedBtn").classList.toggle("is-active", f.special === "saved");
  }
  function filtered() {
    const f = state.filters;
    const q = f.q.toLowerCase();
    return state.products.filter((p) => {
      if (f.category && p.category !== f.category) return false;
      if (f.audience && p.audience !== f.audience && p.audience !== "Unisex") return false;
      if (f.special === "new" && !p.new) return false;
      if (f.special === "sale" && !isSale(p)) return false;
      if (f.special === "saved" && !state.wishlist.has(p.id)) return false;
      if (q) {
        const hay = [p.name, p.summary, p.description, p.category, p.audience, p.condition, (p.sizes || []).join(" ")].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }
  function renderGrid() {
    const grid = $("#grid");
    const foot = $("#gridFoot");
    const list = filtered();
    $("#browseCount").textContent = String(list.length);
    if (!list.length) {
      const f = state.filters;
      let msg = "Nothing here yet.";
      if (f.special === "saved") msg = "You haven't saved anything yet. Tap the heart on any item to keep it here.";
      else if (f.q) msg = "No items match “" + f.q + "”. Try another word or clear the filters.";
      else if (f.special === "sale") msg = "Nothing is on sale right now. Check back soon.";
      else if (f.special === "new") msg = "No new arrivals right now. New pieces drop every week.";
      else if (f.category || f.audience) msg = "Nothing in this section right now. New pieces drop every week.";
      grid.innerHTML =
        '<div class="empty"><div class="empty__icon">' + ICONS.hanger + "</div><p>" + esc(msg) + "</p>" +
        (f.q || f.category || f.audience || f.special ? '<button data-clear>Clear filters</button>' : "") + "</div>";
      foot.innerHTML = "";
      return;
    }
    grid.innerHTML = list.slice(0, state.shown).map(cardHTML).join("");
    foot.innerHTML = list.length > state.shown
      ? '<button class="btn-outline" data-more>Show more <span class="chip__count">' + (list.length - state.shown) + " left</span></button>"
      : "";
  }

  /* ---------- product page ---------- */
  function initProduct() {
    const id = new URLSearchParams(location.search).get("id");
    const p = state.products.find((x) => x.id === id);
    const main = $("#pdp");
    if (!p) {
      main.innerHTML =
        '<div class="notfound"><h1>We can\'t find that item.</h1><p>It may have been sold or removed. The rest of the rack is still here.</p>' +
        '<p style="margin-top:20px"><a class="btn-dark" href="/#browse">Back to shop</a></p></div>';
      return;
    }
    document.title = p.name + " — " + state.settings.shopName + " " + state.settings.shopSuffix;
    const meta = document.querySelector('meta[name="description"]'); if (meta) meta.content = p.summary || "";

    const sale = isSale(p);
    const imgs = p.images && p.images.length ? p.images : [""];
    let size = "";
    const badges = [];
    if (p.soldOut) badges.push('<span class="badge badge--sold">Sold out</span>');
    else { if (p.new) badges.push('<span class="badge badge--new">New</span>'); if (sale) badges.push('<span class="badge badge--sale">Sale</span>'); }
    const saved = state.wishlist.has(p.id);
    const added = p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

    main.innerHTML =
      '<div class="pdp' + (p.soldOut ? " pdp--sold" : "") + '">' +
        '<div class="gallery">' +
          '<div class="gallery__main"><img id="galleryMain" src="' + esc(imgs[0]) + '" alt="' + esc(p.name) + '" /><div class="card__badges">' + badges.join("") + "</div></div>" +
          (imgs.length > 1 ? '<div class="gallery__thumbs">' + imgs.map((src, i) => '<button class="' + (i === 0 ? "is-active" : "") + '" data-thumb="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" loading="lazy" /></button>').join("") + "</div>" : "") +
        "</div>" +
        '<div class="info">' +
          '<p class="info__eyebrow">' + esc(p.audience || "") + (p.category ? " · " + esc(p.category) : "") + "</p>" +
          '<h1 class="info__title">' + esc(p.name) + "</h1>" +
          '<div class="info__price"><strong>' + naira(p.price) + "</strong>" +
            (sale ? "<s>" + naira(p.oldPrice) + '</s><span class="save">Save ' + naira(p.oldPrice - p.price) + "</span>" : "") + "</div>" +
          '<div class="info__chips">' +
            (p.condition ? '<span class="tag tag--cond">' + ICONS.check + esc(p.condition) + "</span>" : "") +
            (p.soldOut ? '<span class="tag tag--sold">Sold out</span>' : (p.new ? '<span class="tag tag--new">New arrival</span>' : "")) +
          "</div>" +
          '<p class="info__desc">' + esc(p.description || p.summary || "").replace(/\n/g, "<br>") + "</p>" +
          (p.sizes && p.sizes.length ?
            '<div class="sizes"><div class="sizes__label"><span>Size</span><span>Tap one to add it to your message</span></div>' +
            '<div class="sizes__list" id="sizes">' + p.sizes.map((s) => '<button class="size" data-size="' + esc(s) + '">' + esc(s) + "</button>").join("") + "</div></div>" : "") +
          '<div class="cta" id="cta"></div>' +
          '<dl class="details">' +
            (p.condition ? "<div><dt>Condition</dt><dd>" + esc(p.condition) + "</dd></div>" : "") +
            "<div><dt>Category</dt><dd>" + esc(p.category || "") + "</dd></div>" +
            (p.sizes && p.sizes.length ? "<div><dt>Sizes</dt><dd>" + esc(p.sizes.join(", ")) + "</dd></div>" : "") +
            (added ? "<div><dt>Added</dt><dd>" + esc(added) + "</dd></div>" : "") +
            "<div><dt>Payment</dt><dd>Agreed on WhatsApp</dd></div>" +
          "</dl>" +
        "</div>" +
      "</div>";

    function ctaHTML() {
      const link = waProductLink(p, size);
      if (p.soldOut) {
        return '<button class="btn-dark is-disabled" disabled>Sold out</button>' +
          '<div class="cta__row"><a class="btn-outline" href="' + waLink("Hi " + state.settings.shopName + "! *" + p.name + "* is sold out. Do you have anything similar?") + '" target="_blank" rel="noopener">' + ICONS.wa + " Ask for something similar</a>" +
          '<button class="btn-outline' + (state.wishlist.has(p.id) ? " is-saved" : "") + '" data-wish="' + esc(p.id) + '">' + ICONS.heart + " Save</button></div>";
      }
      return '<a class="btn-dark" href="' + link + '" target="_blank" rel="noopener">' + ICONS.wa + " Chat on WhatsApp to buy</a>" +
        '<div class="cta__row">' +
          '<button class="btn-outline' + (state.wishlist.has(p.id) ? " is-saved" : "") + '" data-wish="' + esc(p.id) + '">' + ICONS.heart + " Save</button>" +
          '<button class="btn-outline" id="shareBtn">' + ICONS.share + " Share</button>" +
        "</div>" +
        '<p class="cta__hint">Opens a WhatsApp chat with the item name' + (size ? " and size " + esc(size) : "") + ' filled in. Pay only after we confirm.</p>';
    }
    function stickyHTML() {
      if (p.soldOut) return '<button class="btn-dark is-disabled" disabled>Sold out</button><button class="round-btn' + (state.wishlist.has(p.id) ? " is-saved" : "") + '" data-wish="' + esc(p.id) + '" aria-label="Save">' + ICONS.heart + "</button>";
      return '<button class="round-btn' + (state.wishlist.has(p.id) ? " is-saved" : "") + '" data-wish="' + esc(p.id) + '" aria-label="Save">' + ICONS.heart + "</button>" +
        '<a class="btn-dark" href="' + waProductLink(p, size) + '" target="_blank" rel="noopener">' + ICONS.wa + " Chat on WhatsApp</a>";
    }
    function renderCta() {
      $("#cta").innerHTML = ctaHTML();
      const sticky = $("#stickyCta"); sticky.innerHTML = stickyHTML(); sticky.hidden = false; document.body.classList.add("has-sticky");
      const sh = $("#shareBtn");
      if (sh) sh.addEventListener("click", async () => {
        const url = productUrl(p);
        try {
          if (navigator.share) await navigator.share({ title: p.name, text: p.summary || "", url });
          else { await navigator.clipboard.writeText(url); toast("Link copied"); }
        } catch (e) { /* user cancelled */ }
      });
    }
    renderCta();

    main.addEventListener("click", (e) => {
      const th = e.target.closest("[data-thumb]");
      if (th) {
        $("#galleryMain").src = imgs[Number(th.getAttribute("data-thumb"))];
        $$("[data-thumb]").forEach((b) => b.classList.toggle("is-active", b === th));
      }
      const sz = e.target.closest("[data-size]");
      if (sz) {
        const v = sz.getAttribute("data-size");
        size = size === v ? "" : v;
        $$("[data-size]").forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-size") === size));
        renderCta();
      }
    });
    wireWishlist(main);
    wireWishlist($("#stickyCta"));

    // Related
    let rel = state.products.filter((x) => x.id !== p.id && !x.soldOut && x.category === p.category);
    if (rel.length < 3) rel = rel.concat(state.products.filter((x) => x.id !== p.id && !x.soldOut && !rel.includes(x)));
    rel = rel.slice(0, 3);
    if (rel.length) {
      $("#related").hidden = false;
      $("#relatedGrid").innerHTML = rel.map(cardHTML).join("");
      wireWishlist($("#relatedGrid"));
    }
  }

  /* ---------- boot ---------- */
  async function boot() {
    wireDrawer();
    saveWishlist();
    const page = document.body.dataset.page;
    if (page === "home") {
      $("#grid").innerHTML = Array.from({ length: 6 }, () =>
        '<div class="card skeleton"><div class="card__media"></div><div class="skeleton__line"></div><div class="skeleton__line skeleton__line--short"></div></div>').join("");
    }
    try {
      const [s, p] = await Promise.all([
        fetch("/content/settings.json", { cache: "no-cache" }).then((r) => r.json()),
        fetch("/data/products.json", { cache: "no-cache" }).then((r) => r.json()),
      ]);
      state.settings = s;
      state.products = (p || []).filter((x) => x && x.name);
    } catch (err) {
      console.error(err);
      const g = $("#grid") || $("#pdp");
      if (g) g.innerHTML = '<div class="empty"><div class="empty__icon">' + ICONS.hanger + '</div><p>We couldn\'t load the shop. Check your connection and refresh.</p></div>';
      return;
    }
    bindSettings();
    if (page === "home") initHome();
    if (page === "product") initProduct();
  }
  document.addEventListener("DOMContentLoaded", boot);
})();

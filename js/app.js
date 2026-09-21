/* Goldthrifts Store — front-end
   Reads content/settings.json and data/products.json, renders the shop, builds WhatsApp links. */
(function () {
  "use strict";

  // Product data and photos are read straight from the GitHub repo, so publishing a
  // product never needs a Netlify deploy. Locally the same files are served from disk,
  // and if GitHub can't be reached the copy deployed on Netlify is used instead.
  const LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const GITHUB_BASE = "https://raw.githubusercontent.com/Olajr0452/goldthrifts-store/main";
  let contentBase = LOCAL ? "" : GITHUB_BASE;
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
  function asset(path) {
    if (!path) return "";
    if (/^https?:\/\//.test(path)) return path;
    return contentBase + (path.startsWith("/") ? path : "/" + path);
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
    wa: "<svg viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z\"/></svg>",
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 15V3m0 0L8 7m4-4 4 4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7"/></svg>',
    hanger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a2 2 0 0 0-2 2c0 1 .8 1.6 2 2.5V11L3 17v2h18v-2l-9-6"/></svg>',
  };

  /* ---------- shared rendering ---------- */
  function bindSettings() {
    const s = state.settings;
    const pretty = {
      shopName: s.shopName, shopSuffix: s.shopSuffix,
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
    const img = asset((p.images && p.images[0]) || "");
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
              '<a class="round-btn round-btn--wa" href="' + waProductLink(p) + '" target="_blank" rel="noopener" aria-label="Ask about ' + esc(p.name) + ' on WhatsApp">' + ICONS.wa + "</a>" +
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
      renderSavedPanel();
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
    wrap.innerHTML = slides.map((sl) => '<div class="hero__slide" style="background-image:url(\'' + esc(asset(sl.image)) + '\')"></div>').join("");
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
      if (h === "saved") { openSaved(); return; }
      if (h === "new" || h === "sale") setFilter({ special: h }, true);
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
  }
  function filtered() {
    const f = state.filters;
    const q = f.q.toLowerCase();
    return state.products.filter((p) => {
      if (f.category && p.category !== f.category) return false;
      if (f.audience && p.audience !== f.audience && p.audience !== "Unisex") return false;
      if (f.special === "new" && !p.new) return false;
      if (f.special === "sale" && !isSale(p)) return false;
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
      if (f.q) msg = "No items match “" + f.q + "”. Try another word or clear the filters.";
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
    const imgs = p.images && p.images.length ? p.images.map(asset) : [""];
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
      return '<a class="btn-dark btn-wa" href="' + link + '" target="_blank" rel="noopener">' + ICONS.wa + " Chat on WhatsApp to buy</a>" +
        '<div class="cta__row">' +
          '<button class="btn-outline' + (state.wishlist.has(p.id) ? " is-saved" : "") + '" data-wish="' + esc(p.id) + '">' + ICONS.heart + " Save</button>" +
          '<button class="btn-outline" id="shareBtn">' + ICONS.share + " Share</button>" +
        "</div>" +
        '<p class="cta__hint">Opens a WhatsApp chat with the item name' + (size ? " and size " + esc(size) : "") + ' filled in. Pay only after we confirm.</p>';
    }
    function stickyHTML() {
      if (p.soldOut) return '<button class="btn-dark is-disabled" disabled>Sold out</button><button class="round-btn' + (state.wishlist.has(p.id) ? " is-saved" : "") + '" data-wish="' + esc(p.id) + '" aria-label="Save">' + ICONS.heart + "</button>";
      return '<button class="round-btn' + (state.wishlist.has(p.id) ? " is-saved" : "") + '" data-wish="' + esc(p.id) + '" aria-label="Save">' + ICONS.heart + "</button>" +
        '<a class="btn-dark btn-wa" href="' + waProductLink(p, size) + '" target="_blank" rel="noopener">' + ICONS.wa + " Chat on WhatsApp</a>";
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

  /* ---------- saved items panel ---------- */
  function ensureSavedPanel() {
    if ($("#savedPanel")) return;
    const el = document.createElement("div");
    el.className = "saved";
    el.id = "savedPanel";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="saved__scrim" data-close-saved></div>' +
      '<aside class="saved__panel" role="dialog" aria-label="Saved items">' +
        '<div class="saved__head"><h2 class="saved__title">Saved items <span class="chip__count" id="savedPanelCount"></span></h2>' +
        '<button class="icon-btn" data-close-saved aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
        '<div class="saved__list" id="savedList"></div>' +
        '<p class="saved__hint">Saved on this device only. Tap the WhatsApp icon to ask about an item.</p>' +
      "</aside>";
    document.body.appendChild(el);
    $$("[data-close-saved]", el).forEach((b) => b.addEventListener("click", closeSaved));
    wireWishlist($("#savedList"));
  }
  function openSaved() {
    ensureSavedPanel();
    renderSavedPanel();
    const el = $("#savedPanel");
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
  }
  function closeSaved() {
    const el = $("#savedPanel");
    if (!el) return;
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
    if (location.hash === "#saved") history.replaceState(null, "", location.pathname + location.search);
  }
  function renderSavedPanel() {
    const list = $("#savedList");
    if (!list) return;
    const items = state.products.filter((p) => state.wishlist.has(p.id));
    $("#savedPanelCount").textContent = items.length ? String(items.length) : "";
    if (!items.length) {
      list.innerHTML = '<div class="empty"><div class="empty__icon">' + ICONS.heart + "</div><p>Nothing saved yet. Tap the heart on any item to keep it here.</p></div>";
      return;
    }
    list.innerHTML = items.map((p) =>
      '<div class="saved__item' + (p.soldOut ? " is-sold" : "") + '">' +
        '<a class="saved__img" href="/product.html?id=' + encodeURIComponent(p.id) + '"><img src="' + esc(asset((p.images && p.images[0]) || "")) + '" alt="" /></a>' +
        '<div class="saved__meta"><a class="saved__name" href="/product.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + "</a>" +
          '<span class="saved__price">' + naira(p.price) + (p.soldOut ? ' <span class="saved__sold">Sold out</span>' : "") + "</span></div>" +
        '<div class="card__actions">' +
          '<a class="round-btn round-btn--wa" href="' + waProductLink(p) + '" target="_blank" rel="noopener" aria-label="Ask about ' + esc(p.name) + ' on WhatsApp">' + ICONS.wa + "</a>" +
          '<button class="round-btn" data-wish="' + esc(p.id) + '" aria-label="Remove from saved"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
        "</div>" +
      "</div>").join("");
  }
  function wireSavedOpeners() {
    const btn = $("#savedBtn");
    if (btn) btn.addEventListener("click", (e) => { e.preventDefault(); openSaved(); });
    $$("[data-open-saved]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); openSaved(); }));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSaved(); });
  }

  /* ---------- boot ---------- */
  async function fetchJSON(path) {
    if (contentBase) {
      try {
        const r = await fetch(contentBase + path, { cache: "no-cache" });
        if (r.ok) return await r.json();
      } catch (e) { /* fall through to the Netlify copy */ }
      contentBase = "";
    }
    const r = await fetch(path, { cache: "no-cache" });
    if (!r.ok) throw new Error("Failed to load " + path);
    return await r.json();
  }
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
        fetchJSON("/content/settings.json"),
        fetchJSON("/data/products.json"),
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
    wireSavedOpeners();
    if (page === "home") initHome();
    if (page === "product") initProduct();
    if (location.hash === "#saved") openSaved();
  }
  document.addEventListener("DOMContentLoaded", boot);
})();

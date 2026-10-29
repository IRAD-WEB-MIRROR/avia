/* avia.iradgov.org: site script. Header, right column, footer, language, and the online board and schedule. */
(function () {
  "use strict";
  var SITE = {
    store: "avia_lang",
    nav: [["home", "/"], ["schedule", "/schedule.html"], ["passengers", "/passengers.html"], ["about", "/about.html"], ["contacts", "/about.html#contacts"]],
    links: [["gov", "https://iradgov.org/"], ["eirad", "https://e-irad.org/"], ["railways", "https://railways.iradgov.org/"], ["customs", "https://customs.iradgov.org/"], ["gidromet", "https://gidromet.iradgov.org/"], ["jandarm", "https://jandarm.iradgov.org/"], ["post", "https://post.iradgov.org/"], ["bank", "https://bank.iradgov.org/"], ["stats", "https://stats.iradgov.org/"], ["mejlis", "https://mejlis.iradgov.org/"], ["court", "https://court.iradgov.org/"], ["elections", "https://elections.iradgov.org/"], ["arch", "https://archives.iradgov.org/"], ["loto", "https://loto.iradgov.org/"]],
    clocks: [["cTalas", 6], ["cAlmaty", 5], ["cDubai", 4], ["cIstanbul", 3], ["cUtc", 0]],
    tel: "+996-39-2-29-10-01"
  };
  var I = window.SITE_I18N, LANGS = ["en", "ir", "ru"], PAGE = document.body.getAttribute("data-page") || "";
  var LANG = (function () {
    var q = (location.search.match(/[?&]lang=(en|ir|ru)\b/) || [])[1];
    if (q) { try { localStorage.setItem(SITE.store, q); } catch (e) {} return q; }
    try { var s = localStorage.getItem(SITE.store); if (LANGS.indexOf(s) >= 0) return s; } catch (e) {}
    return "en";
  })();
  var cache = {};

  /* ---------- helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }
  function t(k, v) { var d = I.ui[LANG] || {}; var s = d[k] != null ? d[k] : I.ui.en[k]; return s == null ? k : (v ? fill(s, v) : s); }
  function tri(o) { if (o == null) return ""; if (typeof o === "string") return o; return o[LANG] || o.en || ""; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function zoneNow(h) { var n = new Date(); return new Date(n.getTime() + n.getTimezoneOffset() * 60000 + h * 3600000); }
  function iradNow() { return zoneNow(6); }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function iradToday() { return ymd(iradNow()); }
  function addDays(s, n) { var p = s.split("-"), x = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n)); return x.getUTCFullYear() + "-" + pad(x.getUTCMonth() + 1) + "-" + pad(x.getUTCDate()); }
  function dow(s) { var p = s.split("-"), w = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay(); return w === 0 ? 7 : w; }
  function fmtDate(s) {
    var p = String(s).split("-"), M = t("months");
    if (LANG === "ir") return (+p[2]) + "-" + M[+p[1] - 1] + " " + p[0];
    return (+p[2]) + " " + M[+p[1] - 1] + " " + p[0];
  }
  function m(hm) { var p = hm.split(":"); return +p[0] * 60 + +p[1]; }
  function hm(x) { x = ((x % 1440) + 1440) % 1440; return pad(Math.floor(x / 60)) + ":" + pad(x % 60); }
  function h01(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; }
  function getJSON(url) {
    if (!cache[url]) cache[url] = fetch(url, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    return cache[url];
  }
  function sortByDate(a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; }
  /* today's numbers: the public file (iradone.com/data/today.json) nests its lists; flatten the weather */
  function todayData() {
    return getJSON("https://iradone.com/data/today.json").then(function (d) {
      if (d.weather && d.weather.places) d.weather = d.weather.places;
      return d;
    });
  }
  function failBox(el) { if (el) el.innerHTML = '<p class="muted">' + esc(t("loadFail")) + "</p>"; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- chrome ---------- */
  function clocks() {
    return SITE.clocks.map(function (c) { var d = zoneNow(c[1]); return "<span>" + esc(t(c[0])) + " <b>" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + "</b></span>"; }).join("");
  }
  function sideLinks(list) {
    return "<ul>" + list.map(function (l) { return '<li><a href="' + l[0] + '">' + esc(t(l[1])) + "</a></li>"; }).join("") + "</ul>";
  }
  function visitors() {
    var d = iradNow(), mins = d.getHours() * 60 + d.getMinutes();
    var full = 260 + Math.floor(h01(iradToday()) * 220);
    return Math.max(4, Math.round(full * Math.pow(mins / 1440, 1.1)));
  }
  function chrome() {
    var top = $("#top"), side = $("#side"), bottom = $("#bottom");
    if (top) {
      top.innerHTML =
        '<a class="skip" href="#main">' + esc(t("skip")) + "</a>" +
        '<div class="strip"><div class="clocks" id="clocks">' + clocks() + '</div><div class="right">' +
        '<button type="button" class="vi" id="vi"><span class="eye"></span>' + esc(t(document.body.classList.contains("big") ? "viOff" : "viOn")) + "</button>" +
        '<div class="langs" role="group" aria-label="' + esc(t("langLabel")) + '">' +
        ["ru", "ir", "en"].map(function (l) { return '<button type="button" data-lang="' + l + '" aria-pressed="' + (l === LANG) + '" lang="' + I.htmlLang[l] + '" title="' + esc(I.langs[l]) + '">' + esc(I.langCodes[l]) + "</button>"; }).join("") +
        "</div></div></div>" +
        '<div class="mast"><div class="photo" aria-hidden="true" style="background-image:url(/assets/photos/terminal-front.jpg)"></div>' +
        '<a class="home-link" href="/"><img class="mark" src="/assets/logo.svg" alt="' + esc(t("markAlt")) + '" width="100" height="100">' +
        '<div class="ttl"><div class="k">' + esc(t("mastK")) + '</div><div class="n">' + esc(t("mastN")) + '</div><div class="s">' + esc(t("mastS")) + "</div></div></a>" +
        '<div class="emb"><span>' + esc(t("embTxt")) + '</span><img src="/assets/state-emblem.svg" alt="' + esc(t("embAlt")) + '" width="46" height="46"></div></div>' +
        '<nav class="nav" aria-label="' + esc(t("navLabel")) + '"><button class="burger" type="button" aria-expanded="false"><span class="bars"></span>' + esc(t("menu")) + '</button><ul class="menu">' +
        SITE.nav.map(function (n) { return '<li><a href="' + n[1] + '"' + (n[0] === PAGE ? ' aria-current="page"' : "") + ">" + esc(t("nav_" + n[0])) + "</a></li>"; }).join("") + "</ul></nav>" +
        '<div class="testbar">' + t("testBar") + "</div>";
      $(".burger", top).addEventListener("click", function () {
        var nav = $(".nav", top), open = !nav.classList.contains("open");
        nav.classList.toggle("open", open); this.setAttribute("aria-expanded", open);
      });
      $$("[data-lang]", top).forEach(function (b) { b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); }); });
      $("#vi").addEventListener("click", function () {
        var on = !document.body.classList.contains("big");
        document.body.classList.toggle("big", on); store("avia_vi", on ? "1" : "0");
        this.lastChild.textContent = t(on ? "viOff" : "viOn");
      });
    }
    if (side) {
      side.innerHTML =
        '<div class="box"><h4 class="o">' + esc(t("helpH")) + '</h4><div class="in"><span class="tel">' + esc(SITE.tel) + '</span><br><span class="small muted">' + esc(t("helpHrs")) + "</span></div></div>" +
        '<div class="box"><h4>' + esc(t("sideP")) + "</h4>" + sideLinks([["/#board", "sBoard"], ["/schedule.html", "nav_schedule"], ["/passengers.html#road", "sRoad"], ["/passengers.html#checkin", "sideCk"], ["/passengers.html#baggage", "sBaggage"], ["/passengers.html#services", "sServices"], ["/passengers.html#tickets", "sTickets"]]) + "</div>" +
        '<div class="box"><h4>' + esc(t("wxH")) + '</h4><div class="in" id="wxBox"><span class="muted small">' + esc(t("loading")) + "</span></div></div>" +
        '<div class="box poll"><h4>' + esc(t("pollH")) + '</h4><div class="in" id="poll"></div></div>' +
        '<div class="box links"><h4>' + esc(t("linksH")) + "</h4><ul>" + SITE.links.map(function (l) { return '<li><a href="' + l[1] + '">' + esc(t("link_" + l[0])) + "</a></li>"; }).join("") + "</ul></div>";
      poll(); weatherBox();
    }
    if (bottom) {
      var n = visitors();
      bottom.innerHTML =
        '<footer class="foot"><div class="fl">' + SITE.nav.map(function (x) { return '<a href="' + x[1] + '">' + esc(t("nav_" + x[0])) + "</a>"; }).join("") + '<a href="mailto:info@avia.iradgov.org">info@avia.iradgov.org</a></div>' +
        '<div class="row"><div>' + esc(t("footCopy", { y: iradNow().getFullYear() })) + "<br>" + esc(t("footRef")) + "<br>" + esc(t("footCite")) + "</div>" +
        '<div class="ctr" aria-hidden="true"><div class="c88"><b>' + n + "</b>" + esc(t("ctrToday")) + '</div><div class="c88 g"><b>ATTELKOM</b>' + esc(t("ctrTop")) + "</div></div></div>" +
        '<div class="best">' + esc(t("footDev")) + " " + esc(t("footBest")) + " " + esc(t("footTime")) + "</div></footer>";
    }
  }
  var clockTimer;
  function tickClocks() {
    var el = $("#clocks"); if (el) el.innerHTML = clocks();
    clearTimeout(clockTimer); clockTimer = setTimeout(tickClocks, 30000);
  }

  /* ---------- right column: weather, poll ---------- */
  function weatherBox() {
    var el = $("#wxBox"); if (!el) return;
    todayData().then(function (W) {
      var rows = (W.weather || []).filter(function (p) { return p.id === "talas" || p.id === "tash-komur"; });
      if (!rows.length) return failBox(el);
      el.innerHTML = rows.map(function (p) {
        return '<div class="wx"><span class="t">' + (p.high > 0 ? "+" : "") + p.high + "°</span><span><b>" + esc(tri(p.name)) + "</b><br>" + esc(tri(p.label)) + ", " + esc(t("wxLow", { n: (p.low > 0 ? "+" : "") + p.low })) + "</span></div>";
      }).join('<hr style="border:0;border-top:1px dotted #bfd0e2;margin:5px 0">') + '<p class="small muted" style="margin:5px 0 0">' + t("wxSrc") + "</p>";
    }).catch(function () { failBox(el); });
  }
  function poll() {
    var el = $("#poll"); if (!el) return;
    var P = [18, 41, 27, 14], total = 1284, voted = store("avia_poll");
    if (voted) {
      el.innerHTML = '<p class="small"><b>' + esc(t("pollQ")) + "</b></p>" + (voted !== "x" ? '<p class="small" style="color:#2a7a2a">' + esc(t("pollThanks")) + "</p>" : "") +
        '<div class="res">' + P.map(function (p, i) { return "<div>" + esc(t("pollA" + i)) + " – " + p + '%<div class="bar" style="width:' + p + '%"></div></div>'; }).join("") + "</div>" +
        '<p class="small muted" style="margin:6px 0 0">' + esc(t("pollTotal", { n: total.toLocaleString(LANG === "en" ? "en" : "ru") })) + "</p>";
      return;
    }
    el.innerHTML = '<form><p class="small"><b>' + esc(t("pollQ")) + "</b></p>" + P.map(function (p, i) { return '<label><input type="radio" name="pv" value="' + i + '"> ' + esc(t("pollA" + i)) + "</label>"; }).join("") +
      '<button class="btn" type="submit">' + esc(t("pollVote")) + '</button> <a href="#" class="small" id="pollRes">' + esc(t("pollRes")) + "</a></form>";
    $("form", el).addEventListener("submit", function (e) { e.preventDefault(); if (!$("input:checked", el)) return; store("avia_poll", "1"); poll(); });
    $("#pollRes").addEventListener("click", function (e) { e.preventDefault(); store("avia_poll", "x"); poll(); });
  }

  /* ---------- flights ---------- */
  function runs(f, d, S) {
    if (d < S.season.from || d > S.season.to) return false;
    if (f.days.indexOf(String(dow(d))) >= 0) return true;
    if (f.daily) { var md = d.slice(5), a = f.daily[0], b = f.daily[1]; return a <= b ? md >= a && md <= b : md >= a || md <= b; }
    return false;
  }
  function code(W, place, d) {
    if (!W || !place) return null;
    var p = (W.weather || []).filter(function (x) { return x.id === place; })[0];
    if (!p) return null;
    if (W.date === d) return p.code;
    var f = (p.forecast || []).filter(function (x) { return x.date === d; })[0];
    return f ? f.code : null;
  }
  /* a fixed delay for each flight and day, made worse by the weather at Talas and Tash-Kömür */
  function wxEffect(c, r, dom) {
    if (c == null) return null;
    if (c === 45 || c === 48) return { min: 40 + Math.round(r * 60), why: "fog" };
    if (c === 73 || c === 75 || c === 86) return dom && r < 0.55 ? { cancel: true, why: "snow" } : { min: 60 + Math.round(r * 90), why: "snow" };
    if (c === 56 || c === 57 || c === 66 || c === 67) return { min: 30 + Math.round(r * 30), why: "ice" };
    if ((c >= 71 && c <= 77) || c === 85) return { min: 20 + Math.round(r * 25), why: "deice" };
    if (c >= 95) return { min: 20 + Math.round(r * 20), why: "storm" };
    if (c === 65 || c === 82) return { min: 10 + Math.round(r * 10), why: "rain" };
    return null;
  }
  function flightState(f, d, S, W, memo) {
    var key = f.no + d; if (memo[key]) return memo[key];
    var r = h01(d + "|" + f.no), r2 = h01(f.no + "/" + d), r3 = h01("w" + f.no + d), D = 0, res = { min: 0 };
    if (r > 0.88) D = 45 + Math.round(r2 * 75); else if (r > 0.66) D = 10 + Math.round(r2 * 30);
    var dom = f.kind !== "int";
    [S.airports[f.from].wx, S.airports[f.to].wx].forEach(function (place, i) {
      var e = wxEffect(code(W, place, d), r3, dom); if (!e) return;
      if (e.cancel) res.cancel = true;
      if (e.min && e.min > D) { D = e.min; res.why = e.why; }
      if (i === 1 && place === "talas" && e.why === "fog" && r3 < 0.3) res.diverted = true;
    });
    if (f.permit && h01("permit|" + d) < 0.22) res.postponed = true;
    if (f.after) {
      var a = S.flights.filter(function (x) { return x.no === f.after; })[0];
      if (a) {
        var p = flightState(a, d, S, W, memo);
        if (p.cancel) res.cancel = true;
        if (p.postponed) res.postponed = true;
        var late = m(a.arr) + p.min + (f.turn || 40) - m(f.dep); /* both in the turnaround airport's local time */
        if (late > D) { D = late; if (p.why) res.why = p.why; }
      }
    }
    res.min = D;
    memo[key] = res;
    return res;
  }
  function apName(S, c) { return tri(S.airports[c].name); }
  function depRow(f, d, S, st, now, isToday) {
    var sched = m(f.dep), at = sched + st.min, cls = "", s, past = false;
    var open = sched - (f.kind === "int" ? 150 : f.kind === "closed" ? 60 : 90), close = at - (f.kind === "int" ? 50 : 30);
    if (st.cancel) { s = t("sCancel"); cls = "bad"; }
    else if (st.postponed) { s = t("sPermit"); cls = "bad"; }
    else if (!isToday) s = t("sSched");
    else if (now >= at) { s = t("sDeparted", { t: hm(at) }); cls = "dim"; past = true; }
    else if (now >= at - 10) s = t("sGate");
    else if (now >= at - 35) { s = "<b>" + esc(t("sBoarding", { x: f.exit })) + "</b>"; cls = "go"; }
    else if (now >= close) s = t("sCkClosed");
    else if (now >= open) { s = f.kind === "closed" ? t("sClosedCk") : t("sCheckin", { c: f.counters }); cls = "ok"; }
    else if (st.min) s = t("sDelayed", { t: hm(at) });
    else s = t("sCkFrom", { t: hm(open) });
    var html = s.charAt(0) === "<" ? s : esc(s);
    return '<tr class="' + (past ? "past" : "") + '"><td class="fl">' + esc(f.no) + '</td><td class="al h-ac"><img src="/assets/brand/iradiya-mark.svg" alt="Iradiya" title="Iradiya"></td><td>' + esc(apName(S, f.to)) +
      (f.kind === "closed" ? '<span class="via">' + esc(t("closedNote")) + "</span>" : f.tech ? '<span class="via">' + esc(tri(f.tech)) + "</span>" : "") + '</td><td class="tm">' + f.dep + '</td><td class="tm">' + (isToday && st.min && !st.cancel && !st.postponed ? hm(at) : "") +
      '</td><td class="h-ck">' + esc(f.counters || "") + '</td><td class="h-ex">' + esc(f.exit || "") + '</td><td class="st ' + cls + '">' + html + "</td></tr>";
  }
  function arrRow(f, d, S, st, now, isToday) {
    var sched = m(f.arr), at = sched + st.min, cls = "", s, past = false;
    var depIrad = m(f.dep) + (6 - S.airports[f.from].utc) * 60 + st.min;
    if (st.cancel) { s = t("sCancel"); cls = "bad"; }
    else if (st.postponed) { s = t("sPermit"); cls = "bad"; }
    else if (!isToday) s = t("sSched");
    else if (now >= at) { s = st.diverted ? t("sDiverted") : t("sLanded", { t: hm(at) }); cls = st.diverted ? "bad" : "ok"; past = !st.diverted; }
    else if (now >= depIrad) { s = t("sAir"); cls = "go"; }
    else if (st.min) s = t("sExpected", { t: hm(at) });
    else s = t("sOnTime");
    return '<tr class="' + (past ? "past" : "") + '"><td class="fl">' + esc(f.no) + '</td><td class="al h-ac"><img src="/assets/brand/iradiya-mark.svg" alt="Iradiya" title="Iradiya"></td><td>' + esc(apName(S, f.from)) +
      (f.kind === "closed" ? '<span class="via">' + esc(t("closedNote")) + "</span>" : f.tech ? '<span class="via">' + esc(tri(f.tech)) + "</span>" : "") + '</td><td class="tm">' + f.arr + '</td><td class="tm">' + (isToday && st.min && !st.cancel && !st.postponed ? hm(at) : "") +
      '</td><td class="h-ck"></td><td class="h-ex"></td><td class="st ' + cls + '">' + esc(s) + "</td></tr>";
  }
  var boardMode = "dep";
  function board(S, W) {
    var el = $("#board"); if (!el) return;
    var today = iradToday(), tom = addDays(today, 1), nd = iradNow(), now = nd.getHours() * 60 + nd.getMinutes(), memo = {};
    var dep = boardMode === "dep";
    var head = "<thead><tr><th>" + esc(t("hFlight")) + '</th><th class="h-ac"></th><th>' + esc(t(dep ? "hTo" : "hFrom")) + "</th><th>" + esc(t("hTime")) + "</th><th>" + esc(t("hExp")) + '</th><th class="h-ck">' + esc(t(dep ? "hCk" : "hBlank")) + '</th><th class="h-ex">' + esc(t(dep ? "hExit" : "hBlank")) + "</th><th>" + esc(t("hStatus")) + "</th></tr></thead>";
    function list(d) {
      return S.flights.filter(function (f) { return (dep ? f.from === "TLS" : f.to === "TLS") && runs(f, d, S); })
        .sort(function (a, b) { return m(dep ? a.dep : a.arr) - m(dep ? b.dep : b.arr); });
    }
    var body = "", a = list(today), b = list(tom);
    body += '<tr class="day"><td colspan="8">' + esc(t("today")) + ", " + esc(fmtDate(today)) + "</td></tr>";
    body += a.length ? a.map(function (f) { var st = flightState(f, today, S, W, memo); return dep ? depRow(f, today, S, st, now, true) : arrRow(f, today, S, st, now, true); }).join("") :
      '<tr class="none"><td colspan="8">' + esc(t(dep ? "noDep" : "noArr")) + "</td></tr>";
    body += '<tr class="day"><td colspan="8">' + esc(t("tomorrow")) + ", " + esc(fmtDate(tom)) + "</td></tr>";
    body += b.length ? b.map(function (f) { var st = flightState(f, tom, S, W, memo); return dep ? depRow(f, tom, S, st, now, false) : arrRow(f, tom, S, st, now, false); }).join("") :
      '<tr class="none"><td colspan="8">' + esc(t(dep ? "noDep" : "noArr")) + "</td></tr>";
    el.innerHTML = '<div class="tabs" role="tablist"><button type="button" role="tab" data-mode="dep" aria-selected="' + dep + '"><svg viewBox="0 0 24 24"><path d="M2.5 19h19v2h-19zm19.6-9.4c-.2-.8-1-1.3-1.8-1.1L14.9 10 8 3.6l-1.9.5 4.1 7.2-5 1.3-2-1.5-1.5.4 2.6 4.5 16.8-4.5c.8-.2 1.3-1.1 1-1.9z"/></svg>' + esc(t("tabDep")) +
      '</button><button type="button" role="tab" data-mode="arr" aria-selected="' + !dep + '"><svg viewBox="0 0 24 24"><path d="M2.5 19h19v2h-19zm7.2-5.2l4.3 1.2 5.3 1.4c.8.2 1.6-.3 1.8-1.1.2-.8-.3-1.6-1.1-1.8l-5.3-1.4-2.8-9.1-1.9-.5v8.3l-5-1.3-.9-2.3-1.5-.4v5.2z"/></svg>' + esc(t("tabArr")) +
      '</button><span class="upd">' + esc(t("updated", { t: hm(now) })) + "</span></div>" +
      '<div class="tbl-wrap"><table class="board">' + head + "<tbody>" + body + "</tbody></table></div>";
    $$("[data-mode]", el).forEach(function (bt) { bt.addEventListener("click", function () { boardMode = bt.getAttribute("data-mode"); board(S, W); }); });
  }
  function daysCell(f, S) {
    return '<span class="days">' + [1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<span class="' + (f.days.indexOf(String(i)) >= 0 ? "on" : "") + '">' + i + "</span>"; }).join("") + "</span>";
  }
  function schedule(S) {
    var el = $("#sched"); if (!el) return;
    var groups = {};
    S.flights.filter(function (f) { return f.kind !== "closed"; }).forEach(function (f) { var k = f.from === "TLS" ? f.to : f.from; (groups[k] = groups[k] || []).push(f); });
    var order = ["TKM", "ALA", "TAS", "DXB", "IST"];
    el.innerHTML = '<p class="small"><b>' + esc(tri(S.season.name)) + "</b>: " + esc(fmtDate(S.season.from)) + " – " + esc(fmtDate(S.season.to)) + "</p>" +
      order.filter(function (k) { return groups[k]; }).map(function (k) {
        var fs = groups[k];
        return "<h2>" + esc(t("schTo", { a: apName(S, "TLS"), b: apName(S, k) })) + '</h2><div class="tbl-wrap"><table class="facts"><thead><tr><th>' + esc(t("hFlight")) + "</th><th>" + esc(t("hRoute")) + "</th><th>" + esc(t("hDays")) + '</th><th class="num">' + esc(t("hDep")) + '</th><th class="num">' + esc(t("hArr")) + "</th><th>" + esc(t("hAc")) + "</th></tr></thead><tbody>" +
          fs.map(function (f) {
            return '<tr><td class="nw"><b>' + esc(f.no) + "</b></td><td>" + esc(apName(S, f.from)) + " – " + esc(apName(S, f.to)) + (f.tech ? '<br><span class="small muted">' + esc(tri(f.tech)) + "</span>" : "") + "</td><td>" + daysCell(f, S) +
              (f.daily ? '<br><span class="small">' + esc(t("dailyFrom", { a: fmtDM(f.daily[0]), b: fmtDM(f.daily[1]) })) + "</span>" : "") + '</td><td class="num">' + f.dep + '</td><td class="num">' + f.arr + "</td><td>" + esc(tri(S.aircraft[f.ac])) + "</td></tr>";
          }).join("") + "</tbody></table></div>" + (k === "TAS" ? '<p class="small">' + t("schPermit") + "</p>" : "");
      }).join("");
  }
  function fmtDM(md) { var p = md.split("-"), M = t("months"); return LANG === "ir" ? (+p[1]) + "-" + M[+p[0] - 1] : (+p[1]) + " " + M[+p[0] - 1]; }
  function nextTkm(S) {
    var el = $("#nextTkm"); if (!el) return;
    var d = iradToday(), out = [];
    for (var i = 0; i < 14 && out.length < 3; i++) {
      var dd = addDays(d, i);
      S.flights.forEach(function (f) { if (f.no === "IRD 301" && runs(f, dd, S)) out.push(dd); });
    }
    el.textContent = out.map(fmtDate).join(", ");
  }
  function flights() {
    if (!$("#board") && !$("#sched") && !$("#nextTkm")) return;
    var wxP = todayData().catch(function () { return null; });
    getJSON("/data/flights.json").then(function (S) {
      schedule(S); nextTkm(S);
      if ($("#board")) wxP.then(function (W) { board(S, W); });
    }).catch(function () { failBox($("#board")); failBox($("#sched")); });
  }

  /* ---------- static text ---------- */
  function staticText() {
    var P = (I.pages || {})[LANG] || {};
    $$("[data-i18n]").forEach(function (el) {
      if (!el.hasAttribute("data-en")) el.setAttribute("data-en", el.innerHTML);
      var k = el.getAttribute("data-i18n");
      el.innerHTML = LANG === "en" ? el.getAttribute("data-en") : (P[k] != null ? P[k] : el.getAttribute("data-en"));
    });
    var tk = document.body.getAttribute("data-title");
    var dt = (tk && P["title_" + tk] && LANG !== "en" ? P["title_" + tk] : (document.body.getAttribute("data-title-en") || document.title.split(" | ")[0]));
    document.title = dt === t("mastN") ? dt : dt + " | " + t("mastN");
    document.documentElement.lang = I.htmlLang[LANG];
  }
  function setLang(l) {
    LANG = l;
    store(SITE.store, l);
    render();
  }
  function notices() {
    var el = $("#notices"); if (!el) return;
    var n = +(el.getAttribute("data-n") || 99);
    getJSON("/data/notices.json").then(function (d) {
      el.innerHTML = (d.notices || []).slice().sort(sortByDate).slice(0, n).map(function (x) {
        return '<div class="notice"><div class="meta">' + esc(fmtDate(x.date)) + (x.number ? " · " + esc(tri(x.number)) : "") + '</div><div class="t">' + esc(tri(x.title)) + "</div>" +
          (x.text ? "<p>" + tri(x.text) + "</p>" : "") + (x.signed ? '<p class="small muted">' + esc(tri(x.signed)) + "</p>" : "") + "</div>";
      }).join("");
    }).catch(function () { failBox(el); });
  }
  function render() {
    if (store("avia_vi") === "1") document.body.classList.add("big");
    chrome();
    staticText();
    notices();
    flights();
  }
  render();
  tickClocks();
  setInterval(function () { if ($("#board")) flights(); }, 60000);
})();

/*
 * Petróleo em Angola — Painel de Dados Públicos
 * Lê data/petroleo.json e desenha os gráficos em SVG puro (sem dependências).
 * Ver README.md para instruções de como correr e atualizar os dados.
 */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const fmt = (n) => Math.round(n).toLocaleString("pt-PT");
  const fmt1 = (n) => n.toLocaleString("pt-PT", { maximumFractionDigits: 1 });

  function make(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  const tooltip = document.getElementById("tooltip");
  function showTip(evt, html) {
    tooltip.innerHTML = html;
    tooltip.style.opacity = "1";
    positionTip(evt);
  }
  function positionTip(evt) {
    const pad = 14;
    let x = evt.clientX + pad, y = evt.clientY + pad;
    const tw = 240, th = 70;
    if (x + tw > window.innerWidth) x = evt.clientX - tw - pad;
    if (y + th > window.innerHeight) y = evt.clientY - th - pad;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
  }
  function hideTip() { tooltip.style.opacity = "0"; }

  /* ============ CHART: monthly line ============ */
  function renderLine(id, data) {
    const svg = document.getElementById(id);
    const W = 680, H = 300, m = { top: 20, right: 20, bottom: 34, left: 56 };
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const plotW = W - m.left - m.right, plotH = H - m.top - m.bottom;
    const values = data.map(d => d.avg);
    const min = Math.min(...values), max = Math.max(...values);
    const yMin = Math.floor((min - 30000) / 25000) * 25000;
    const yMax = Math.ceil((max + 20000) / 25000) * 25000;
    const x = i => m.left + (plotW * i) / (data.length - 1);
    const y = v => m.top + plotH * (1 - (v - yMin) / (yMax - yMin));

    const steps = 4;
    for (let s = 0; s <= steps; s++) {
      const v = yMin + ((yMax - yMin) * s) / steps;
      const gy = y(v);
      svg.appendChild(make("line", { class: "grid-line", x1: m.left, x2: W - m.right, y1: gy, y2: gy }));
      const t = make("text", { class: "axis-label", x: m.left - 8, y: gy + 4, "text-anchor": "end" });
      t.textContent = (v / 1000).toFixed(0) + "k";
      svg.appendChild(t);
    }
    if (1000000 >= yMin && 1000000 <= yMax) {
      const ty = y(1000000);
      svg.appendChild(make("line", { x1: m.left, x2: W - m.right, y1: ty, y2: ty, stroke: "var(--critical)", "stroke-width": 1, "stroke-dasharray": "3,3", opacity: 0.55 }));
      const lbl = make("text", { class: "axis-label", x: W - m.right, y: ty - 5, "text-anchor": "end", fill: "var(--critical)" });
      lbl.textContent = "1M bopd";
      svg.appendChild(lbl);
    }
    data.forEach((d, i) => {
      const t = make("text", { class: "axis-label", x: x(i), y: H - m.bottom + 18, "text-anchor": "middle" });
      t.textContent = d.m;
      svg.appendChild(t);
    });
    let areaPath = `M ${x(0)} ${y(data[0].avg)} `;
    data.forEach((d, i) => { if (i > 0) areaPath += `L ${x(i)} ${y(d.avg)} `; });
    areaPath += `L ${x(data.length - 1)} ${m.top + plotH} L ${x(0)} ${m.top + plotH} Z`;
    svg.appendChild(make("path", { d: areaPath, fill: "var(--s-blue)", opacity: 0.08 }));
    let linePath = `M ${x(0)} ${y(data[0].avg)} `;
    data.forEach((d, i) => { if (i > 0) linePath += `L ${x(i)} ${y(d.avg)} `; });
    svg.appendChild(make("path", { d: linePath, fill: "none", stroke: "var(--s-blue)", "stroke-width": 2.5, "stroke-linejoin": "round", "stroke-linecap": "round" }));
    data.forEach((d, i) => {
      const isLast = i === data.length - 1;
      const isMin = d.avg === min;
      const c = make("circle", { cx: x(i), cy: y(d.avg), r: isLast || isMin ? 5 : 3.5, fill: "var(--surface)", stroke: isMin ? "var(--critical)" : "var(--s-blue)", "stroke-width": 2.2, style: "cursor:pointer" });
      c.addEventListener("mouseenter", (e) => showTip(e, `<b>${d.m} 2025</b>Média diária: <span class="num">${fmt(d.avg)} bopd</span><br>Total do mês: <span class="num">${fmt(d.total)}</span> barris`));
      c.addEventListener("mousemove", positionTip);
      c.addEventListener("mouseleave", hideTip);
      svg.appendChild(c);
      if (isMin) {
        const t = make("text", { class: "value-tag", x: x(i), y: y(d.avg) + 20, "text-anchor": "middle", fill: "var(--critical)", "font-weight": 700 });
        t.textContent = "mínimo do ano";
        svg.appendChild(t);
      }
      if (isLast) {
        const t = make("text", { class: "bar-label", x: x(i) - 6, y: y(d.avg) - 12, "text-anchor": "end" });
        t.textContent = fmt(d.avg);
        svg.appendChild(t);
      }
    });

    const tbody = document.querySelector("#table-monthly tbody");
    data.forEach(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${d.m} 2025</td><td class="num">${fmt(d.total)}</td><td class="num">${fmt(d.avg)}</td>`;
      tbody.appendChild(tr);
    });
  }

  /* ============ CHART: vertical bars (historical) ============ */
  function renderVerticalBars(id, data) {
    const svg = document.getElementById(id);
    const W = 460, H = 300, m = { top: 24, right: 12, bottom: 46, left: 50 };
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const plotW = W - m.left - m.right, plotH = H - m.top - m.bottom;
    const max = Math.max(...data.map(d => d.value)) * 1.15;
    const band = plotW / data.length;
    const barW = band * 0.52;
    const y = v => m.top + plotH * (1 - v / max);

    [0, 0.5, 1].forEach(f => {
      const v = max * f;
      const gy = y(v);
      svg.appendChild(make("line", { class: "grid-line", x1: m.left, x2: W - m.right, y1: gy, y2: gy }));
      const t = make("text", { class: "axis-label", x: m.left - 8, y: gy + 4, "text-anchor": "end" });
      t.textContent = (v / 1e6).toFixed(1) + "M";
      svg.appendChild(t);
    });

    data.forEach((d, i) => {
      const cx = m.left + band * i + band / 2;
      const bx = cx - barW / 2;
      const by = y(d.value);
      const bh = m.top + plotH - by;
      const rect = make("rect", {
        x: bx, y: by, width: barW, height: bh, rx: 4,
        fill: d.peak ? "var(--critical)" : "var(--s-blue)",
        opacity: d.peak ? 1 : 0.85, style: "cursor:pointer"
      });
      rect.addEventListener("mouseenter", (e) => showTip(e, `<b>${d.label}${d.peak ? " — pico" : ""}</b>Produção: <span class="num">${fmt(d.value)} bopd</span><br>${d.note}`));
      rect.addEventListener("mousemove", positionTip);
      rect.addEventListener("mouseleave", hideTip);
      svg.appendChild(rect);

      const vt = make("text", { class: "value-tag", x: cx, y: by - 6, "text-anchor": "middle", "font-weight": 700, fill: d.peak ? "var(--critical)" : "var(--ink-2)" });
      vt.textContent = (d.value / 1e6).toFixed(2) + "M";
      svg.appendChild(vt);

      const xt = make("text", { class: "axis-label", x: cx, y: H - m.bottom + 18, "text-anchor": "middle", "font-weight": d.peak ? 700 : 400 });
      xt.textContent = d.label;
      svg.appendChild(xt);
    });
    svg.appendChild(make("line", { class: "baseline", x1: m.left, x2: W - m.right, y1: m.top + plotH, y2: m.top + plotH }));

    const tbody = document.querySelector("#table-historical tbody");
    data.forEach(d => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${d.label}</td><td class="num">${fmt(d.value)}</td><td>${d.note}</td>`;
      tbody.appendChild(tr);
    });
  }

  /* ============ CHART: horizontal bars (generic) ============ */
  function renderHorizontalBars(id, data, opts) {
    opts = opts || {};
    const svg = document.getElementById(id);
    const W = 620, rowH = 44, m = { top: 8, right: 70, bottom: 8, left: opts.left || 176 };
    const H = m.top + m.bottom + rowH * data.length;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const plotW = W - m.left - m.right;
    const max = Math.max(...data.map(d => d.value)) * 1.12;
    const x = v => m.left + plotW * (v / max);

    data.forEach((d, i) => {
      const cy = m.top + rowH * i + rowH / 2;
      const barH = rowH * 0.46;
      const by = cy - barH / 2;
      const bw = x(d.value) - m.left;
      const color = d.muted ? "var(--other)" : (d.planned ? "var(--other)" : (opts.color || "var(--s-blue)"));

      const rect = make("rect", { x: m.left, y: by, width: Math.max(bw, 2), height: barH, rx: 4, fill: color, "fill-opacity": d.muted ? 0.55 : (d.planned ? 0.5 : 1), style: "cursor:pointer" });
      rect.addEventListener("mouseenter", (e) => showTip(e, `<b>${d.label}</b>${opts.tooltipUnit ? fmt(d.value) + " " + opts.tooltipUnit : fmt(d.value) + (opts.suffix || "")}${d.op ? "<br>" + d.op : ""}`));
      rect.addEventListener("mousemove", positionTip);
      rect.addEventListener("mouseleave", hideTip);
      svg.appendChild(rect);

      const nameT = make("text", { class: "bar-name", x: m.left - 10, y: cy - (d.op ? 3 : -4), "text-anchor": "end" });
      nameT.textContent = d.label;
      svg.appendChild(nameT);

      if (d.op) {
        const opT = make("text", { class: "op-tag", x: m.left - 10, y: cy + 11, "text-anchor": "end" });
        opT.textContent = d.op;
        svg.appendChild(opT);
      }

      const valT = make("text", { class: "bar-label", x: x(d.value) + 8, y: cy + 4 });
      valT.textContent = opts.suffix ? d.value + opts.suffix : fmt(d.value);
      svg.appendChild(valT);
    });
  }

  /* ============ CHART: grouped bars (economy) ============ */
  function renderGrouped(id, groups, series) {
    const svg = document.getElementById(id);
    const W = 640, H = 260, m = { top: 20, right: 16, bottom: 30, left: 42 };
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const plotW = W - m.left - m.right, plotH = H - m.top - m.bottom;
    const groupBand = plotW / groups.length;
    const barW = Math.min(30, groupBand / (series.length + 1.4));
    const max = 100;
    const y = v => m.top + plotH * (1 - v / max);

    [0, 25, 50, 75, 100].forEach(v => {
      const gy = y(v);
      svg.appendChild(make("line", { class: "grid-line", x1: m.left, x2: W - m.right, y1: gy, y2: gy }));
      const t = make("text", { class: "axis-label", x: m.left - 8, y: gy + 4, "text-anchor": "end" });
      t.textContent = v + "%";
      svg.appendChild(t);
    });

    groups.forEach((g, gi) => {
      const groupX = m.left + groupBand * gi + groupBand / 2;
      const present = series.filter(s => s.values[gi] !== null);
      const totalW = present.length * barW + (present.length - 1) * 6;
      let startX = groupX - totalW / 2;
      present.forEach((s) => {
        const v = s.values[gi];
        const bx = startX;
        const by = y(v);
        const bh = m.top + plotH - by;
        const rect = make("rect", { x: bx, y: by, width: barW, height: bh, rx: 3, fill: s.color, style: "cursor:pointer" });
        rect.addEventListener("mouseenter", (e) => showTip(e, `<b>${s.name}</b>${g}: <span class="num">${fmt1(v)}%</span>`));
        rect.addEventListener("mousemove", positionTip);
        rect.addEventListener("mouseleave", hideTip);
        svg.appendChild(rect);
        const vt = make("text", { class: "value-tag", x: bx + barW / 2, y: by - 6, "text-anchor": "middle", "font-weight": 700 });
        vt.textContent = fmt1(v) + "%";
        svg.appendChild(vt);
        startX += barW + 6;
      });
      const xt = make("text", { class: "axis-label", x: groupX, y: H - m.bottom + 18, "text-anchor": "middle", "font-weight": 600 });
      xt.textContent = g;
      svg.appendChild(xt);
    });
    svg.appendChild(make("line", { class: "baseline", x1: m.left, x2: W - m.right, y1: m.top + plotH, y2: m.top + plotH }));

    const legend = document.getElementById("legend-economy");
    series.forEach(s => {
      const item = document.createElement("span");
      item.className = "legend-item";
      item.innerHTML = `<span class="legend-dot" style="background:${s.color}"></span>${s.name}`;
      legend.appendChild(item);
    });
  }

  /* ============ Timeline ============ */
  function renderTimeline(data) {
    const el = document.getElementById("timeline");
    data.forEach(d => {
      const item = document.createElement("div");
      item.className = "tl-item";
      const dotClass = d.type === "peak" ? "peak" : d.type === "good" ? "good" : "";
      item.innerHTML = `
        <div class="tl-date">${d.date}</div>
        <div class="tl-dot ${dotClass}"></div>
        <div class="tl-body"><h4>${d.title}</h4><p>${d.body}</p></div>
      `;
      el.appendChild(item);
    });
  }

  /* ============ Exports-by-value list ============ */
  function renderExportsValue(list) {
    const el = document.getElementById("exports-value-list");
    list.forEach(d => {
      const row = document.createElement("div");
      row.className = "value-row";
      row.innerHTML = `<span>${d.flag} ${d.label}</span><b class="num">${d.valueLabel}</b>`;
      el.appendChild(row);
    });
  }

  /* ============ KPIs derived from monthly2025 ============ */
  function renderKpis(monthly) {
    const last = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    document.getElementById("kpi-daily").innerHTML = `${fmt(last.avg)} <small>bopd</small>`;
    if (prev) {
      const delta = ((last.avg - prev.avg) / prev.avg) * 100;
      const dir = delta < 0 ? "down" : delta > 0 ? "up" : "flat";
      const arrow = delta < 0 ? "▼" : delta > 0 ? "▲" : "→";
      const el = document.getElementById("kpi-daily-delta");
      el.className = "kpi-delta " + dir;
      el.innerHTML = `${arrow} ${fmt1(Math.abs(delta))}% <span style="font-weight:500;color:var(--ink-muted)">vs. mês anterior</span>`;
    }
    const totalYear = monthly.reduce((s, d) => s + d.total, 0);
    const avgYear = monthly.reduce((s, d) => s + d.avg, 0) / monthly.length;
    document.getElementById("kpi-accum").innerHTML = `${fmt1(totalYear / 1e6)}M <small>barris</small>`;
    document.getElementById("kpi-accum-sub").textContent = `média de ${fmt(avgYear)} bopd/ano`;
  }

  /* ============ Boot ============ */
  fetch("data/petroleo.json")
    .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(data => {
      renderKpis(data.monthly2025);
      renderLine("chart-monthly", data.monthly2025);
      renderVerticalBars("chart-historical", data.historical);
      renderHorizontalBars("chart-blocks", data.blocks, { tooltipUnit: "bopd" });
      renderHorizontalBars("chart-exports", data.exports2023, { tooltipUnit: "bopd", left: 150 });
      renderExportsValue(data.exportsValue2024);
      renderHorizontalBars("chart-operators", data.operators, { suffix: "%", left: 190 });
      renderHorizontalBars("chart-refining", data.refining, { tooltipUnit: "bopd", left: 210 });
      renderGrouped("chart-economy", data.economyGroups, data.economySeries);
      renderTimeline(data.timeline);
    })
    .catch(err => {
      console.error("Falha ao carregar data/petroleo.json:", err);
      document.getElementById("load-error").style.display = "block";
    });
})();

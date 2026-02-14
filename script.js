const form = document.getElementById("analysis-form");
const report = document.getElementById("report");
const content = document.getElementById("report-content");

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const fmt = (n) => Number(n).toFixed(2);

function calculateAnalysis(d) {
  const valuationGap = ((d.sectorPe - d.fpe) / d.sectorPe) * 100;
  const growthComposite = d.revGrowth * 0.35 + d.epsGrowth * 0.45 + (d.relativeGrowth + d.industryGrowth) * 0.2;
  const qualityComposite = d.roic * 0.35 + d.opMargin * 0.3 + d.conversion * 0.2 + (10 - d.debtEbitda) * 2 * 0.15;
  const technicalComposite =
    (d.above200 ? 18 : 6) +
    (d.bullishSignal ? 16 : 4) +
    clamp((65 - Math.abs(55 - d.rsi)) * 0.5, 0, 20) +
    clamp((40 - d.volatility) * 0.5, 0, 20);

  const guidanceBoost = d.guidance * 2.2;
  const conviction = clamp(
    growthComposite * 0.32 + qualityComposite * 0.28 + technicalComposite * 0.2 + valuationGap * 0.1 + guidanceBoost + d.dataConfidence,
    0,
    100
  );

  const regime = conviction > 75 ? "High-Conviction Buy Zone" : conviction > 60 ? "Accumulation Zone" : conviction > 45 ? "Watchlist / Neutral" : "Avoid / Risky";
  const valuationLabel = valuationGap > 12 ? "Undervalued" : valuationGap > 0 ? "Fair to Slightly Undervalued" : valuationGap > -10 ? "Fair to Slightly Overvalued" : "Overvalued";

  const baseGrowth = (d.epsGrowth * 0.55 + d.revGrowth * 0.25 + d.industryGrowth * 0.1 + d.relativeGrowth * 0.1) / 100;
  const adjustedGrowth = baseGrowth * (0.8 + d.guidance / 20);
  const riskDiscount = 1 - clamp((d.volatility - 20) / 100, 0.02, 0.2);

  const price1Y = d.price * (1 + adjustedGrowth) * riskDiscount;
  const price2Y = price1Y * (1 + adjustedGrowth * 0.92);
  const price3Y = price2Y * (1 + adjustedGrowth * 0.85);

  const discountedEntry = d.price * (1 - clamp(d.volatility / 180, 0.07, 0.22));
  const stopLoss = discountedEntry * 0.88;
  const potentialExit = price2Y * 1.08;

  const support1 = d.price * 0.93;
  const support2 = d.price * 0.86;
  const resistance1 = d.price * 1.11;
  const resistance2 = d.price * 1.24;

  return {
    valuationGap,
    growthComposite,
    qualityComposite,
    technicalComposite,
    conviction,
    regime,
    valuationLabel,
    price1Y,
    price2Y,
    price3Y,
    discountedEntry,
    stopLoss,
    potentialExit,
    support1,
    support2,
    resistance1,
    resistance2,
  };
}

function recommendationClass(conviction) {
  if (conviction > 75) return "good";
  if (conviction > 55) return "warn";
  return "bad";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const d = {
    ...data,
    above200: data.above200 === "yes",
    bullishSignal: data.bullishSignal === "yes",
  };

  Object.keys(d).forEach((key) => {
    if (!["company", "ticker", "industry", "region", "above200", "bullishSignal"].includes(key)) {
      d[key] = Number(d[key]);
    }
  });

  const a = calculateAnalysis(d);
  const signalText = [
    d.above200 ? "Price structure remains above 200DMA (macro trend supportive)." : "Price below 200DMA (trend risk elevated).",
    d.bullishSignal ? "Bullish crossover is active; momentum confirmation exists." : "No bullish crossover; wait for setup confirmation.",
    d.rsi > 70 ? "RSI indicates overbought conditions—expect pullback risk." : d.rsi < 35 ? "RSI near oversold region—reversion probability rising." : "RSI is balanced; trend can continue without extreme conditions.",
  ];

  content.innerHTML = `
    <div class="report-grid">
      <div class="block">
        <small>Company</small>
        <div class="kpi">${d.company} (${d.ticker})</div>
        <div>${d.industry} · ${d.region}</div>
        <ul>
          <li>Valuation Status: <b>${a.valuationLabel}</b> (${fmt(a.valuationGap)}% vs sector P/E).</li>
          <li>Primary Recommendation: <b class="${recommendationClass(a.conviction)}">${a.regime}</b>.</li>
          <li>AI Confidence Score: <b>${fmt(a.conviction)}/100</b>.</li>
        </ul>
      </div>

      <div class="block">
        <small>Fundamental Health</small>
        <div class="kpi">${fmt(a.qualityComposite)}</div>
        <ul>
          <li>Revenue CAGR: ${fmt(d.revGrowth)}%; EPS CAGR: ${fmt(d.epsGrowth)}%.</li>
          <li>Margin profile: ${fmt(d.opMargin)}% with conversion efficiency ${fmt(d.conversion)}%.</li>
          <li>ROIC ${fmt(d.roic)}% and leverage ${fmt(d.debtEbitda)}x support durability.</li>
        </ul>
      </div>

      <div class="block">
        <small>Technicals & Trading Plan</small>
        <div class="kpi">${fmt(a.technicalComposite)}</div>
        <ul>
          <li>Discounted entry zone: <b>$${fmt(a.discountedEntry)}</b>.</li>
          <li>Risk control (stop): <b>$${fmt(a.stopLoss)}</b>.</li>
          <li>Potential swing/institutional exit: <b>$${fmt(a.potentialExit)}</b>.</li>
          <li>Supports: $${fmt(a.support1)} / $${fmt(a.support2)}.</li>
          <li>Resistances: $${fmt(a.resistance1)} / $${fmt(a.resistance2)}.</li>
        </ul>
      </div>

      <div class="block">
        <small>Forward Price Forecast (Guidance-Adjusted)</small>
        <div class="kpi">$${fmt(a.price3Y)} (3Y target)</div>
        <ul>
          <li>12M fair value: $${fmt(a.price1Y)}.</li>
          <li>24M fair value: $${fmt(a.price2Y)}.</li>
          <li>36M fair value: $${fmt(a.price3Y)}.</li>
          <li>Model blends EPS, revenue, industry growth, relative product growth, volatility, and management guidance credibility.</li>
        </ul>
      </div>

      <div class="block" style="grid-column:1/-1;">
        <small>Executive Quantamental Narrative</small>
        <ul>
          <li>Growth engine score (${fmt(a.growthComposite)}) indicates ${a.growthComposite > 18 ? "strong compounding potential" : "moderate expansion potential"} across revenue, earnings, and product-market momentum.</li>
          <li>Industry outlook (${fmt(d.industryGrowth)}%) plus relative product growth (${fmt(d.relativeGrowth)}%) imply ${d.relativeGrowth > 0 ? "market share gains" : "competitive pressure"} over the coming cycle.</li>
          <li>Guidance confidence (${d.guidance}/10) and data confidence (${d.dataConfidence}/10) are integrated as Bayesian-style conviction boosts for scenario calibration.</li>
          <li>${signalText.join(" ")}</li>
          <li>For portfolio construction: position size should scale with volatility (${fmt(d.volatility)}%) and conviction (${fmt(a.conviction)}), using staged entries around support.</li>
        </ul>
      </div>
    </div>
  `;

  report.classList.remove("hidden");
  report.scrollIntoView({ behavior: "smooth", block: "start" });
});

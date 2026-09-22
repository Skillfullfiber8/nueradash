import { scanBusinessRadar } from "./radarEngine.js";
import { analyzeRootCauses } from "./rootCauseEngine.js";
import { runSimulation } from "./simulationEngine.js";
import { generateText } from "./aiService.js";

/**
 * Synthesize business findings into a Prioritized AI Action Plan
 */
export async function generateActionPlan(userId) {
  // 1. Fetch live radar risks, opportunities, and root cause evidence
  const [radar, rootCause] = await Promise.all([
    scanBusinessRadar(userId),
    analyzeRootCauses(userId),
  ]);

  if (radar.status === "insufficient_data" || rootCause.status === "insufficient_data") {
    return {
      status: "insufficient_data",
      actions: [],
      message: "Insufficient data to formulate an action plan. Please upload more transactions.",
    };
  }

  const { risks = [], opportunities = [] } = radar;
  const actions = [];

  // 2. Formulate actions for Critical & High Risks
  for (const risk of risks.slice(0, 3)) {
    let simulatedImpact = "Positive stabilization expected";
    let simDelta = null;

    if (risk.simulationPreset) {
      try {
        const sim = await runSimulation(userId, {
          scenarioType: risk.simulationPreset.type,
          targetType: risk.simulationPreset.productId ? "product" : "all",
          targetValue: risk.simulationPreset.productId || risk.simulationPreset.target || "All",
          percentageChange: risk.simulationPreset.changePercent || 10,
        });
        if (sim.status === "success") {
          simDelta = sim.delta;
          simulatedImpact = `Estimated +₹${sim.delta.profit.toLocaleString("en-IN")} net profit impact (${sim.delta.profitPercent > 0 ? "+" : ""}${sim.delta.profitPercent}%)`;
        }
      } catch (e) {
        console.warn("Simulation pre-run failed:", e.message);
      }
    }

    actions.push({
      id: `action-${risk.id}`,
      type: "risk_mitigation",
      title: `Mitigate ${risk.affectedEntity} Performance Risk`,
      priority: risk.severity === "Critical" ? "Critical" : "High",
      urgency: "Immediate (Next 7 Days)",
      problem: risk.title,
      rootCause: risk.rootCause || "Underlying demand contraction across recent trading cycles.",
      prediction: "Historical trajectory suggests continued volume softening without price or promo intervention.",
      simulatedOutcome: simulatedImpact,
      simDelta,
      recommendedAction: risk.recommendedNextStep,
      simulationPreset: risk.simulationPreset,
      evidence: risk.evidence,
    });
  }

  // 3. Formulate actions for High Growth & Margin Opportunities
  for (const opp of opportunities.slice(0, 3)) {
    let simulatedImpact = "Accelerated top-line expansion";
    let simDelta = null;

    if (opp.simulationPreset) {
      try {
        const sim = await runSimulation(userId, {
          scenarioType: opp.simulationPreset.type,
          targetType: opp.simulationPreset.productId ? "product" : "all",
          targetValue: opp.simulationPreset.productId || opp.simulationPreset.target || "All",
          percentageChange: opp.simulationPreset.changePercent || 20,
        });
        if (sim.status === "success") {
          simDelta = sim.delta;
          simulatedImpact = `Potential revenue lift of +₹${sim.delta.revenue.toLocaleString("en-IN")} (+₹${sim.delta.profit.toLocaleString("en-IN")} gross profit)`;
        }
      } catch (e) {
        console.warn("Opportunity simulation pre-run failed:", e.message);
      }
    }

    actions.push({
      id: `action-${opp.id}`,
      type: "growth_capture",
      title: `Capitalize on ${opp.affectedEntity} Growth Momentum`,
      priority: opp.severity === "High" ? "High" : "Medium",
      urgency: "Medium (Next 14 Days)",
      problem: `High potential demand in ${opp.affectedEntity} is currently constrained by visibility or supply.`,
      rootCause: `Strong market pull and favorable margins (+${opp.percentChange}%) signaling product-market fit.`,
      prediction: "Accelerating demand curve with upside revenue potential across upcoming quarters.",
      simulatedOutcome: simulatedImpact,
      simDelta,
      recommendedAction: opp.suggestedOpportunity,
      simulationPreset: opp.simulationPreset,
      evidence: opp.evidence,
    });
  }

  // Sort actions: Critical first, then High, then Medium
  const priorityWeight = { Critical: 3, High: 2, Medium: 1, Low: 0 };
  actions.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  return {
    status: "success",
    totalActions: actions.length,
    actions,
  };
}

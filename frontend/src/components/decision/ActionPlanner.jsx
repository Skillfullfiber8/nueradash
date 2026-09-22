export default function ActionPlanner({ actionPlanData, onSelectSimulate }) {
  const actions = actionPlanData?.actions || [];

  if (!actions.length) {
    return (
      <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500">
        <p className="text-3xl mb-2">📋</p>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">No Action Items Generated</h3>
        <p className="text-xs mt-1">
          {actionPlanData?.message || "Upload sales data to formulate prioritized, evidence-backed action plans."}
        </p>
      </div>
    );
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Critical":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            🚨 Critical Priority
          </span>
        );
      case "High":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            ⚡ High Priority
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            📌 Standard Priority
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Step Indicator */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <h2 className="text-xl font-bold">Evidence-Backed Decision Playbook</h2>
        </div>
        <p className="text-slate-300 text-xs max-w-3xl leading-relaxed">
          Every recommendation is synthesized directly through the 5-step Decision Intelligence pipeline:
          anomaly detection, root-cause decomposition, forward prediction, sandbox simulation, and actionable strategy.
        </p>

        {/* 5-Step Pipeline Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-center text-xs font-semibold">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
            <span className="block text-[10px] text-indigo-300 uppercase">Step 1</span>
            🔍 1. DETECT
          </div>
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
            <span className="block text-[10px] text-indigo-300 uppercase">Step 2</span>
            🔬 2. EXPLAIN
          </div>
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
            <span className="block text-[10px] text-indigo-300 uppercase">Step 3</span>
            🔮 3. PREDICT
          </div>
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
            <span className="block text-[10px] text-indigo-300 uppercase">Step 4</span>
            🧪 4. SIMULATE
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-600 border border-indigo-400/50 shadow">
            <span className="block text-[10px] text-indigo-200 uppercase">Step 5</span>
            📋 5. RECOMMEND
          </div>
        </div>
      </div>

      {/* Action Cards List */}
      <div className="space-y-4">
        {actions.map((act) => (
          <div
            key={act.id}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Action Card Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700/60 flex flex-wrap justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getPriorityBadge(act.priority)}
                  <span className="text-xs text-gray-400 font-mono">Urgency: {act.urgency}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white pt-1">
                  {act.title}
                </h3>
              </div>

              {act.simulationPreset && (
                <button
                  onClick={() => onSelectSimulate && onSelectSimulate(act.simulationPreset)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-semibold shadow hover:from-indigo-700 hover:to-violet-700 transition flex items-center gap-1.5"
                >
                  <span>🧪</span> Test in Simulator →
                </button>
              )}
            </div>

            {/* Step-by-Step Evidence Breakdown */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Box 1: Problem & Evidence */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                <p className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px]">
                  1. Problem & Underlying Evidence
                </p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{act.problem}</p>
                <p className="text-gray-500 dark:text-gray-400">{act.evidence}</p>
              </div>

              {/* Box 2: Root Cause Decomposition */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                <p className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[10px]">
                  2. Root Cause
                </p>
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{act.rootCause}</p>
              </div>

              {/* Box 3: Forward Prediction */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                <p className="font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider text-[10px]">
                  3. Predictive Outlook (If No Action)
                </p>
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{act.prediction}</p>
              </div>

              {/* Box 4: Simulated Impact */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                <p className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px]">
                  4. Simulated Intervention Impact
                </p>
                <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {act.simulatedOutcome}
                </p>
              </div>
            </div>

            {/* Strategic Action Recommendation Box */}
            <div className="px-6 pb-6 pt-2">
              <div className="p-4 bg-indigo-50/90 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div className="space-y-1">
                  <p className="font-bold text-indigo-950 dark:text-indigo-200 text-xs">
                    5. Strategic Recommendation
                  </p>
                  <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                    {act.recommendedAction}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const BRANCH_COLORS = ["#D4FF4F", "#5EA1F2", "#F2A65E", "#E06B9E"];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-lg px-3 py-2">
      <p className="text-xs text-[var(--ng-text-muted)] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
          {p.dataKey}: KSh {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function BranchTrendChart({ data, branchNames }) {
  return (
    <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6 mb-6">
      <h2 className="font-display text-2xl text-[var(--ng-text)] mb-4">
        Monthly revenue by branch
      </h2>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ng-border)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="var(--ng-text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "var(--ng-border)" }}
            />
            <YAxis
              stroke="var(--ng-text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--ng-text-muted)" }} />
            {branchNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={BRANCH_COLORS[i % BRANCH_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
"use client";

import { ResponsivePie } from "@nivo/pie";
import type { AggregatedPoint } from "@/lib/types";
import { fmtNumber, fmtPct, totalOf } from "@/lib/format";
import { useContainerWidth } from "@/hooks/useContainerWidth";
import { PALETTE } from "./palette";
import { nivoTheme } from "./nivoTheme";

type NivoDatum = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export function PieChart({ data }: { data: AggregatedPoint[] }) {
  const { ref, width } = useContainerWidth();
  const total = totalOf(data);
  const compact = width > 0 && width < 480;

  const nivoData: NivoDatum[] = data.map((d, i) => ({
    id: d.label,
    label: d.label,
    value: d.value,
    color: PALETTE[i % PALETTE.length],
  }));

  const margin = compact
    ? { top: 16, right: 16, bottom: 16, left: 16 }
    : { top: 32, right: 120, bottom: 16, left: 120 };

  return (
    <div
      ref={ref}
      style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}
    >
      {width > 0 && (
        <>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsivePie
              data={nivoData}
              theme={nivoTheme}
              colors={{ datum: "data.color" }}
              margin={margin}
              innerRadius={0}
              padAngle={0.6}
              cornerRadius={4}
              activeOuterRadiusOffset={8}
              borderWidth={0}
              enableArcLinkLabels={!compact}
              arcLinkLabelsSkipAngle={9}
              arcLinkLabelsTextColor="#6b7280"
              arcLinkLabelsThickness={1.5}
              arcLinkLabelsColor={{ from: "color" }}
              arcLinkLabelsDiagonalLength={12}
              arcLinkLabelsStraightLength={16}
              arcLabelsSkipAngle={compact ? 8 : 13}
              arcLabelsTextColor="#ffffff"
              arcLabelsRadiusOffset={compact ? 0.6 : 0.7}
              tooltip={({ datum }) => {
                const pct = total > 0 ? datum.value / total : 0;
                return (
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #f0f0ef",
                      borderRadius: 8,
                      padding: "8px 12px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      fontSize: 12,
                      fontFamily: "var(--font-outfit), system-ui, sans-serif",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontWeight: 600,
                        color: "#111110",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: datum.color as string,
                        }}
                      />
                      {datum.label}
                    </div>
                    <div style={{ color: "#6b7280" }}>
                      {fmtNumber(datum.value)}{" "}
                      <span style={{ color: "#d4d4d8" }}>·</span> {fmtPct(pct)}
                    </div>
                  </div>
                );
              }}
              legends={[]}
            />
          </div>

          {/* Custom wrapping legend — replaces Nivo's non-wrapping built-in */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "6px 16px",
              padding: "8px 4px 4px",
              flexShrink: 0,
            }}
          >
            {nivoData.map((d) => (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  color: "#9ca3af",
                  fontFamily: "var(--font-outfit), system-ui, sans-serif",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: d.color,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {d.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

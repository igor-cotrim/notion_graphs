"use client";

import { ResponsiveBar } from "@nivo/bar";
import type { AggregatedPoint } from "@/lib/types";
import { fmtNumber, fmtPct, totalOf } from "@/lib/format";
import { useContainerWidth } from "@/hooks/useContainerWidth";
import { PALETTE } from "./palette";
import { nivoTheme } from "./nivoTheme";

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #f0f0ef",
  borderRadius: 8,
  padding: "8px 12px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  fontSize: 12,
  fontFamily: "var(--font-outfit), system-ui, sans-serif",
};

export function BarChart({ data }: { data: AggregatedPoint[] }) {
  const { ref, width } = useContainerWidth();
  const total = totalOf(data);
  const compact = width > 0 && width < 480;

  const tickRotation = compact && data.length > 5 ? -35 : 0;
  const bottomMargin = compact ? (data.length > 5 ? 72 : 56) : 56;
  const leftMargin = compact ? 44 : 60;

  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      {width > 0 && (
        <ResponsiveBar
          data={data}
          theme={nivoTheme}
          keys={["value"]}
          indexBy="label"
          margin={{ top: 16, right: 16, bottom: bottomMargin, left: leftMargin }}
          padding={0.32}
          colors={({ index }) => PALETTE[(index as number) % PALETTE.length]}
          borderRadius={5}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 10,
            tickRotation,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 8,
            tickValues: compact ? 4 : 5,
            format: (v) => fmtNumber(Number(v)),
          }}
          enableLabel={false}
          enableGridX={false}
          gridYValues={compact ? 4 : 5}
          tooltip={({ value, color, indexValue }) => {
            const pct = total > 0 ? value / total : 0;
            return (
              <div style={tooltipStyle}>
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
                      background: color,
                    }}
                  />
                  {String(indexValue)}
                </div>
                <div style={{ color: "#6b7280" }}>
                  {fmtNumber(value)}{" "}
                  <span style={{ color: "#d4d4d8" }}>·</span> {fmtPct(pct)}
                </div>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}

"use client";

import { ResponsiveLine } from "@nivo/line";
import type { AggregatedPoint } from "@/lib/types";
import { fmtNumber, fmtPct, totalOf } from "@/lib/format";
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

export function LineChart({ data }: { data: AggregatedPoint[] }) {
  const total = totalOf(data);
  const lineData = [
    {
      id: "Series",
      color: PALETTE[0],
      data: data.map((d) => ({ x: d.label, y: d.value })),
    },
  ];

  return (
    <ResponsiveLine
      data={lineData}
      theme={nivoTheme}
      margin={{ top: 16, right: 16, bottom: 56, left: 60 }}
      xScale={{ type: "point" }}
      yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
      curve="catmullRom"
      colors={[PALETTE[0]]}
      lineWidth={2.5}
      pointSize={8}
      pointColor="#ffffff"
      pointBorderWidth={2.5}
      pointBorderColor={PALETTE[0]}
      enableArea={true}
      areaOpacity={0.07}
      areaBaselineValue={0}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 0,
        tickPadding: 10,
        tickRotation: 0,
      }}
      axisLeft={{
        tickSize: 0,
        tickPadding: 10,
        tickValues: 5,
        format: (v) => fmtNumber(Number(v)),
      }}
      enableGridX={false}
      gridYValues={5}
      enableCrosshair={true}
      crosshairType="x"
      useMesh={true}
      tooltip={({ point }) => {
        const value = point.data.y as number;
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
                  background: point.seriesColor,
                }}
              />
              {String(point.data.x)}
            </div>
            <div style={{ color: "#6b7280" }}>
              {fmtNumber(value)}{" "}
              <span style={{ color: "#d4d4d8" }}>·</span> {fmtPct(pct)}
            </div>
          </div>
        );
      }}
    />
  );
}

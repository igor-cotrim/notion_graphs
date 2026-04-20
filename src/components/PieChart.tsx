"use client";

import { ResponsivePie } from "@nivo/pie";
import type { AggregatedPoint } from "@/lib/types";
import { fmtNumber, fmtPct, totalOf } from "@/lib/format";
import { PALETTE } from "./palette";
import { nivoTheme } from "./nivoTheme";

type NivoDatum = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export function PieChart({ data }: { data: AggregatedPoint[] }) {
  const total = totalOf(data);
  const nivoData: NivoDatum[] = data.map((d, i) => ({
    id: d.label,
    label: d.label,
    value: d.value,
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <ResponsivePie
      data={nivoData}
      theme={nivoTheme}
      colors={{ datum: "data.color" }}
      margin={{ top: 32, right: 120, bottom: 64, left: 120 }}
      innerRadius={0}
      padAngle={0.6}
      cornerRadius={4}
      activeOuterRadiusOffset={8}
      activeInnerRadiusOffset={4}
      borderWidth={0}
      arcLinkLabelsSkipAngle={9}
      arcLinkLabelsTextColor="#6b7280"
      arcLinkLabelsThickness={1.5}
      arcLinkLabelsColor={{ from: "color" }}
      arcLinkLabelsDiagonalLength={12}
      arcLinkLabelsStraightLength={16}
      arcLabelsSkipAngle={13}
      arcLabelsTextColor="#ffffff"
      arcLabelsRadiusOffset={0.7}
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
      legends={[
        {
          anchor: "bottom",
          direction: "row",
          justify: false,
          translateX: 0,
          translateY: 52,
          itemsSpacing: 8,
          itemWidth: 96,
          itemHeight: 20,
          itemTextColor: "#9ca3af",
          itemDirection: "left-to-right",
          itemOpacity: 1,
          symbolSize: 8,
          symbolShape: "circle",
          effects: [
            {
              on: "hover",
              style: {
                itemTextColor: "#374151",
              },
            },
          ],
        },
      ]}
    />
  );
}

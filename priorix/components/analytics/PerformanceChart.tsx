"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PerformanceChartProps {
  dailyStats: Array<{
    date: string;
    cardsStudied: number;
    studyTime: number;
    accuracy: number;
    sessions: number;
  }>;
}

export default function PerformanceChart({ dailyStats }: PerformanceChartProps) {
  return (
    <Card className="bg-green/20 dark:bg-card border-2 border-black dark:border-darkborder rounded-xl">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 font-sora">Performance Over Time</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => {
                  const d = new Date(date);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                style={{ fontSize: "12px" }}
              />
              <YAxis yAxisId="left" style={{ fontSize: "12px" }} />
              <YAxis yAxisId="right" orientation="right" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "2px solid hsl(var(--border))",
                  borderRadius: "12px",
                }}
                labelFormatter={(date) => {
                  const d = new Date(date);
                  return d.toLocaleDateString();
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="cardsStudied"
                stroke="#39cbb7"
                strokeWidth={3}
                name="Cards Studied"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="accuracy"
                stroke="#cae044"
                strokeWidth={3}
                name="Accuracy (%)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface MasteryDistributionProps {
  distribution: {
    new: number;
    learning: number;
    relearning: number;
    young: number;
    mature: number;
    mastered: number;
  };
}

export default function MasteryDistribution({
  distribution,
}: MasteryDistributionProps) {
  // Using app's color palette
  const data = [
    { name: "New", value: distribution.new, color: "#A78BFA" }, // purple
    { name: "Learning", value: distribution.learning, color: "#39cbb7" }, // perry
    { name: "Relearning", value: distribution.relearning, color: "#FFB6FB" }, // pink
    { name: "Young", value: distribution.young, color: "#FFD700" }, // yellow
    { name: "Mature", value: distribution.mature, color: "#C4A0FF" }, // light purple
    { name: "Mastered", value: distribution.mastered, color: "#cae044" }, // green
  ].filter((item) => item.value > 0);

  const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);

  return (
    <Card className="bg-perry/20 dark:bg-card border-2 border-black dark:border-darkborder rounded-xl">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 font-sora">Card Mastery Distribution</h3>
        {total === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No cards studied yet
          </p>
        ) : (
          <div className="flex flex-col md:flex-row items-center">
            <div className="h-[250px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-2">
              {data.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-2 rounded hover:bg-accent"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{item.value}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({Math.round((item.value / total) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const fs = require('fs');
const content = fs.readFileSync('app/dashboard/page.tsx', 'utf8');

const newAnalyticsGrids = `
        {/* Analytics & Insights Grids */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-full">
            {patterns && (
              <div className="h-full">
                {patterns?.requiresMoreSessions ? (
                  <div className="bento-card bg-muted/30 border-dashed text-center p-8 h-full flex flex-col justify-center items-center">
                    <div className="max-w-md mx-auto space-y-4">
                      <h3 className="text-2xl font-editorial">Unlock Insights</h3>
                      <p className="text-muted-foreground font-medium">
                        Complete at least {patterns.minimumRequired} study
                        sessions to get personalized learning insights.
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border-2 border-border shadow-bento-sm font-bold text-sm">
                        <span>
                          {patterns.currentSessions} / {patterns.minimumRequired}
                        </span>
                        <span className="text-muted-foreground">sessions</span>
                      </div>
                    </div>
                  </div>
                ) : patterns?.insights ? (
                  <InsightsPanel insights={patterns.insights} />
                ) : (
                  <div className="bento-card bg-muted/30 border-dashed text-center p-8 h-full flex flex-col justify-center items-center">
                    <p className="font-editorial text-2xl text-muted-foreground">
                      Start studying to unlock insights
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="h-full">
            {userStats?.overview && (
              <OverviewStats stats={userStats.overview} layout="compact" />
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Todo List */}
      <div className="xl:col-span-1">
        <TodoList />
      </div>
    </div>

    {/* 4. Full Width Heatmap */}
    {userStats?.dailyStats && userStats.dailyStats.length > 0 && (
      <div className="w-full mb-8">
        <HeatmapCalendar dailyStats={userStats.dailyStats} />
      </div>
    )}
`;

const startIndex = content.indexOf('{/* Analytics Grids */}');
const endIndexStr = '<TodoList />\r\n        </div>\r\n      </div>';
let endIndex = content.indexOf(endIndexStr);
if (endIndex === -1) {
  const unixEndIndexStr = '<TodoList />\n        </div>\n      </div>';
  endIndex = content.indexOf(unixEndIndexStr);
  if (endIndex !== -1) endIndex += unixEndIndexStr.length;
} else {
  endIndex += endIndexStr.length;
}

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + newAnalyticsGrids.trim() + content.substring(endIndex);
  fs.writeFileSync('app/dashboard/page.tsx', newContent, 'utf8');
  console.log("Success");
} else {
  console.log("Could not find boundaries", startIndex, endIndex);
}

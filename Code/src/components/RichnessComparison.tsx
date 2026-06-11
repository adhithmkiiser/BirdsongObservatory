import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { Recorder } from '../types';
import { calculateStats } from '../utils/stats';

interface RichnessComparisonProps {
  recorders: Recorder[];
  siteRichness: Record<string, number>;
  selectedSiteGroup: string;
}

const RichnessComparison: React.FC<RichnessComparisonProps> = ({
  recorders,
  siteRichness,
  selectedSiteGroup,
}) => {
  // Filter recorders based on selected site group
  const filteredRecs = useMemo(() => {
    if (selectedSiteGroup === 'All') return recorders;
    return recorders.filter((r) => r.site_group === selectedSiteGroup);
  }, [recorders, selectedSiteGroup]);

  // Extract richness values
  const { lcData, liData, stats } = useMemo(() => {
    const lcs = filteredRecs.filter((r) => r.habitat === 'LC').map((r) => {
      const key = `${r.site_group}/${r.recorder_id}`;
      return { id: r.recorder_id, group: r.site_group, val: siteRichness[key] || 0 };
    });
    
    const lis = filteredRecs.filter((r) => r.habitat === 'LI').map((r) => {
      const key = `${r.site_group}/${r.recorder_id}`;
      return { id: r.recorder_id, group: r.site_group, val: siteRichness[key] || 0 };
    });

    const lcValues = lcs.map(item => item.val);
    const liValues = lis.map(item => item.val);

    return {
      lcData: lcs,
      liData: lis,
      stats: calculateStats(lcValues, liValues)
    };
  }, [filteredRecs, siteRichness]);

  // Chart configuration
  const chartOption = useMemo(() => {
    // We will list recorders on the X-axis
    // If All is selected, we sort by site group, then habitat, then name
    const sortedLC = [...lcData].sort((a, b) => a.group.localeCompare(b.group) || a.id.localeCompare(b.id));
    const sortedLI = [...liData].sort((a, b) => a.group.localeCompare(b.group) || a.id.localeCompare(b.id));

    const categories = [
      ...sortedLC.map(item => `${item.group}\n${item.id}`),
      ...sortedLI.map(item => `${item.group}\n${item.id}`)
    ];

    const data = [
      ...sortedLC.map(item => ({
        value: item.val,
        itemStyle: { color: '#16a34a' } // Green for LC
      })),
      ...sortedLI.map(item => ({
        value: item.val,
        itemStyle: { color: '#ef4444' } // Red for LI
      }))
    ];

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const nameParts = params.name.split('\n');
          const group = nameParts[0];
          const id = nameParts[1] || nameParts[0];
          const isLC = params.dataIndex < sortedLC.length;
          return `
            <div style="font-family: Inter, sans-serif; padding: 4px 8px;">
              <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">
                ${group} — ${id}
              </div>
              <div style="font-size: 12px; color: #666;">
                Habitat: <span style="font-weight: 600; color: ${isLC ? '#16a34a' : '#ef4444'}">
                  ${isLC ? 'Lantana-Cleared (LC)' : 'Lantana-Infested (LI)'}
                </span>
              </div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                Richness: <strong style="font-size: 13px; color: #333">${params.value} species</strong>
              </div>
            </div>
          `;
        }
      },
      grid: {
        top: '10%',
        left: '5%',
        right: '5%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          interval: 0,
          rotate: selectedSiteGroup === 'All' ? 45 : 0,
          fontSize: 10,
          color: '#475569'
        },
        axisLine: {
          lineStyle: { color: '#cbd5e1' }
        }
      },
      yAxis: {
        type: 'value',
        name: 'Species Richness (S)',
        nameTextStyle: {
          color: '#475569',
          fontWeight: 600,
          padding: [0, 0, 10, 0]
        },
        splitLine: {
          lineStyle: { type: 'dashed', color: '#f1f5f9' }
        },
        axisLabel: { color: '#475569' }
      },
      series: [
        {
          name: 'Species Richness',
          type: 'bar',
          barWidth: '60%',
          data: data,
          label: {
            show: true,
            position: 'top',
            color: '#475569',
            fontWeight: 600,
            fontSize: 10
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'solid', width: 2 },
            data: [
              {
                name: 'LC Mean',
                yAxis: stats.meanLC,
                lineStyle: { color: '#16a34a', width: 2, type: 'dashed' },
                label: {
                  formatter: `LC Mean: ${stats.meanLC.toFixed(1)}`,
                  position: 'start',
                  fontSize: 10,
                  fontWeight: 600
                }
              },
              {
                name: 'LI Mean',
                yAxis: stats.meanLI,
                lineStyle: { color: '#ef4444', width: 2, type: 'dashed' },
                label: {
                  formatter: `LI Mean: ${stats.meanLI.toFixed(1)}`,
                  position: 'end',
                  fontSize: 10,
                  fontWeight: 600
                }
              }
            ]
          }
        }
      ]
    };
  }, [lcData, liData, stats, selectedSiteGroup]);

  return (
    <div className="dashboard-section" id="richness-comparison-section">
      <div className="section-header">
        <div>
          <h2>Species Richness: LC vs LI Comparison</h2>
          <p>Avian species richness comparison between Lantana-Cleared (LC) and Lantana-Infested (LI) sites.</p>
        </div>
      </div>

      <div className="split-layout">
        <div className="chart-wrapper">
          <ReactECharts option={chartOption} style={{ height: '380px', width: '100%' }} />
        </div>

        <div className="stats-summary-panel">
          <h3 className="stats-summary-title">Summary Statistics</h3>
          
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-item-label">LC Mean Richness</span>
              <span className="stat-item-value lc">
                {stats.meanLC.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>± {stats.sdLC.toFixed(1)}</span>
              </span>
              <span className="kpi-subtext">n = {stats.nLC} sites</span>
            </div>

            <div className="stat-item">
              <span className="stat-item-label">LI Mean Richness</span>
              <span className="stat-item-value li">
                {stats.meanLI.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>± {stats.sdLI.toFixed(1)}</span>
              </span>
              <span className="kpi-subtext">n = {stats.nLI} sites</span>
            </div>
          </div>

          <div className="stat-diff-callout">
            <span className="stat-diff-label">Richness Difference (LC vs LI)</span>
            <span className="stat-diff-val" style={{ color: stats.difference >= 0 ? '#16a34a' : '#ea580c' }}>
              {stats.difference >= 0 ? '+' : ''}{stats.difference.toFixed(1)}
            </span>
            <span className="kpi-subtext">
              {stats.difference > 0 
                ? 'Lantana-cleared sites show higher species richness.' 
                : stats.difference < 0 
                  ? 'Lantana-infested sites show higher species richness.' 
                  : 'No difference in richness.'
              }
            </span>
          </div>

          <div className="stat-item" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1rem' }}>
            <span className="stat-item-label">Mann-Whitney U Test (Significance)</span>
            <span className="stat-item-value" style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {stats.significance}
            </span>
            <span className="kpi-subtext" style={{ lineHeight: '1.2' }}>
              {stats.pValue !== null
                ? `U = ${stats.uStat?.toFixed(0)}, p = ${stats.pValue.toFixed(4)}. ${
                    stats.pValue < 0.05 
                      ? 'The difference is statistically significant.' 
                      : 'The difference is not statistically significant.'
                  }`
                : 'Insufficient sample size.'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RichnessComparison;

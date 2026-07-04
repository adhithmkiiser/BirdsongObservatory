import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { Recorder } from './types';

interface RichnessOverviewProps {
  recorders: Recorder[];
  siteRichness: Record<string, number>;
  siteDetections: Record<string, number>;
  selectedSiteGroup: string;
  onDownloadCSV: () => void;
}

const RichnessOverview: React.FC<RichnessOverviewProps> = ({
  recorders,
  siteRichness,
  siteDetections,
  selectedSiteGroup,
  onDownloadCSV,
}) => {
  // Filter and sort recorders
  const sortedRecs = useMemo(() => {
    let list = [...recorders];
    if (selectedSiteGroup !== 'All') {
      list = list.filter((r) => r.site_group === selectedSiteGroup);
    }
    return list.sort((a, b) => a.site_group.localeCompare(b.site_group) || a.recorder_id.localeCompare(b.recorder_id));
  }, [recorders, selectedSiteGroup]);

  // ECharts Option
  const chartOption = useMemo(() => {
    const categories = sortedRecs.map((r) => `${r.site_group}\n${r.recorder_id}`);
    const richnessData = sortedRecs.map((r) => {
      const key = `${r.site_group}/${r.recorder_id}`;
      return siteRichness[key] || 0;
    });
    
    const detectionsData = sortedRecs.map((r) => {
      const key = `${r.site_group}/${r.recorder_id}`;
      return siteDetections[key] || 0;
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Unique Species', 'Total Detections'],
        textStyle: { color: '#475569' }
      },
      grid: {
        top: '12%',
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
          rotate: categories.length > 8 ? 45 : 0,
          fontSize: 10,
          color: '#475569'
        },
        axisLine: { lineStyle: { color: '#cbd5e1' } }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Species Richness',
          min: 0,
          axisLabel: { color: '#475569' },
          splitLine: { show: false }
        },
        {
          type: 'value',
          name: 'Detections Count',
          min: 0,
          axisLabel: { color: '#475569' },
          splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
        }
      ],
      series: [
        {
          name: 'Unique Species',
          type: 'bar',
          data: richnessData,
          itemStyle: { color: '#6366f1' }, // Indigo for unique species
          barMaxWidth: 30
        },
        {
          name: 'Total Detections',
          type: 'line',
          yAxisIndex: 1,
          data: detectionsData,
          itemStyle: { color: '#10b981' }, // Emerald green for detections
          lineStyle: { width: 3 }
        }
      ]
    };
  }, [sortedRecs, siteRichness, siteDetections]);

  return (
    <div className="dashboard-section" id="richness-overview-section">
      <div className="section-header">
        <div>
          <h2>Site-Level Performance & Detections</h2>
          <p>Avian species counts paired with acoustic detection triggers per active recorder site.</p>
        </div>
        <button className="btn-primary" onClick={onDownloadCSV}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Summary CSV
        </button>
      </div>

      <div className="chart-wrapper">
        <ReactECharts option={chartOption} style={{ height: '380px', width: '100%' }} />
      </div>

      <div className="matrix-scroll-container" style={{ marginTop: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-slate-light)', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Landscape Group</th>
              <th style={{ padding: '0.75rem 1rem' }}>Recorder ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Habitat Type</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Audio Effort (Files)</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Species Richness</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total Detections</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecs.map((rec) => {
              const key = `${rec.site_group}/${rec.recorder_id}`;
              const richness = siteRichness[key] || 0;
              const detections = siteDetections[key] || 0;
              
              return (
                <tr key={key} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{rec.site_group}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{rec.recorder_id}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`legend-pill ${rec.habitat.toLowerCase()}`}>
                      {rec.habitat === 'LC' ? 'Lantana-Cleared' : 'Lantana-Infested'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{rec.actual_files}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#4f46e5' }}>{richness}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{new Intl.NumberFormat().format(detections)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RichnessOverview;

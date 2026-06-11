import React from 'react';

interface FilterBarProps {
  selectedSiteGroup: string;
  setSelectedSiteGroup: (val: string) => void;
  siteGroups: string[];
  selectedRecorder: string;
  setSelectedRecorder: (val: string) => void;
  recorders: string[];
  confidenceThreshold: number;
  setConfidenceThreshold: (val: number) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  selectedSiteGroup,
  setSelectedSiteGroup,
  siteGroups,
  selectedRecorder,
  setSelectedRecorder,
  recorders,
  confidenceThreshold,
  setConfidenceThreshold,
}) => {
  return (
    <div className="filter-bar">
      <div className="filter-grid">
        <div className="filter-item">
          <label className="filter-label">Landscape / Site Group</label>
          <select
            className="select-input"
            value={selectedSiteGroup}
            onChange={(e) => setSelectedSiteGroup(e.target.value)}
          >
            <option value="All">All Landscapes</option>
            {siteGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label className="filter-label">Recorder Site</label>
          <select
            className="select-input"
            value={selectedRecorder}
            onChange={(e) => setSelectedRecorder(e.target.value)}
          >
            <option value="All">All Recorders</option>
            {recorders.map((rec) => (
              <option key={rec} value={rec}>
                {rec}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label className="filter-label">BirdNET Confidence Cutoff</label>
            <span className="slider-val">{(confidenceThreshold).toFixed(2)}</span>
          </div>
          <div className="slider-wrapper">
            <input
              type="range"
              className="range-slider"
              min="0.70"
              max="0.99"
              step="0.01"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;

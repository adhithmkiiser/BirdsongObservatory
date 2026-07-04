import React, { useState, useMemo, useEffect } from 'react';
import HeroLantana from './HeroLantana';
import FilterBar from './FilterBar';
import SummaryCards from './SummaryCards';
import MapPanel from './MapPanel';
import RichnessComparison from './RichnessComparison';
import RichnessOverview from './RichnessOverview';
import HeatmapPanel from './HeatmapPanel';
import IndicatorPanel from './IndicatorPanel';
import BirdSearch from './BirdSearch';
import type { AggregatedData, Recorder } from './types';
import FooterLantana from './FooterLantana';

import 'leaflet/dist/leaflet.css';
import { supabase } from '../../../home-about/src/supabaseClient';
import dataRawDefault from '../data/data.json';

interface AppLantanaProps {
  projectId?: string;
  hideHero?: boolean;
}

const AppLantana: React.FC<AppLantanaProps> = ({ projectId = 'tst-lantana', hideHero = false }) => {
  const [data, setData] = useState<AggregatedData | null>(null);

  // Filters State
  const [selectedSiteGroup, setSelectedSiteGroup] = useState<string>('All');
  const [selectedRecorder, setSelectedRecorder] = useState<string>('All');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.70);

  // Load visibility settings
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    map: true,
    richness: true,
    comparison: true,
    heatmap: true,
    search: true,
    indicator: true
  });
  const [user, setUser] = useState<any>(null);
  
  // Load dynamic species list and metadata state overrides
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [speciesMetadata, setSpeciesMetadata] = useState<Record<string, any>>({});

  // Load dynamic recorders list with local coordinate overrides
  const [recorders, setRecorders] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: fileData, error } = await supabase
          .storage
          .from('observatory-data')
          .download(`${projectId}/data.json`);

        if (error || !fileData) {
          throw new Error('Failed to download data.json');
        }

        const text = await fileData.text();
        const rawJson = JSON.parse(text);
        
        const typedData = rawJson as AggregatedData;
        setData(typedData);

        const storedSpList = localStorage.getItem('species_list');
        setSpeciesList(storedSpList ? JSON.parse(storedSpList) : typedData.species_list);

        const storedSpMeta = localStorage.getItem('species_metadata');
        setSpeciesMetadata(storedSpMeta ? JSON.parse(storedSpMeta) : typedData.species_metadata);

        const savedSites = localStorage.getItem('sites');
        if (savedSites) {
          const allSites = JSON.parse(savedSites);
          const mapped = typedData.recorders.map(r => {
            const match = allSites.find(
              (s: any) => 
                s.id.toLowerCase() === r.site_group.toLowerCase() ||
                s.id.toLowerCase() === `${r.site_group.toLowerCase()}_${r.recorder_id.toLowerCase()}`
            );
            if (match) {
              return {
                ...r,
                latitude: match.latitude !== undefined ? match.latitude : r.latitude,
                longitude: match.longitude !== undefined ? match.longitude : r.longitude,
                expected_files: match.expectedFiles !== undefined ? match.expectedFiles : r.expected_files
              };
            }
            return r;
          });
          setRecorders(mapped);
        } else {
          setRecorders(typedData.recorders);
        }
      } catch (err) {
        console.error('Failed to load dynamic project data', err);
        // Fallback to default
        const typedData = dataRawDefault as unknown as AggregatedData;
        setData(typedData);
        setSpeciesList(typedData.species_list);
        setSpeciesMetadata(typedData.species_metadata);
        setRecorders(typedData.recorders);
      }
    };
    fetchDashboardData();
  }, [projectId]);

  useEffect(() => {
    const storedVisibility = localStorage.getItem('dashboardVisibility');
    if (storedVisibility) setVisibility(JSON.parse(storedVisibility));

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const isAuthorized = user && (user.role === 'admin' || user.role === 'manager_project');

  const renderSection = (key: string, title: string, element: React.ReactNode) => {
    const isVisible = visibility[key] !== false;
    if (isVisible) return element;
    if (isAuthorized) {
      return (
        <div className="admin-only-section-wrapper">
          <div className="admin-only-badge">🔒 Private Section - Visible to Admin/Manager Only</div>
          {element}
        </div>
      );
    }
    return (
      <div className="dashboard-section private-locked-card">
        <div className="locked-content">
          <div className="lock-icon-circle">🔒</div>
          <h3>{title} is Private</h3>
          <p>This dataset section has been restricted by the project manager. Sign-in is required to view this data.</p>
          <a href="#/login" className="btn btn-secondary btn-small">Sign In to Access</a>
        </div>
      </div>
    );
  };

  // 1. Get unique site groups and active recorders for dropdown lists
  const siteGroups = useMemo(() => {
    const groups = new Set<string>();
    recorders.forEach((r) => groups.add(r.site_group));
    return Array.from(groups).sort();
  }, [recorders]);

  const recordersList = useMemo(() => {
    let list = recorders;
    if (selectedSiteGroup !== 'All') {
      list = list.filter((r) => r.site_group === selectedSiteGroup);
    }
    const ids = list.map((r) => r.recorder_id);
    return Array.from(new Set(ids)).sort();
  }, [recorders, selectedSiteGroup]);

  // Reset recorder selection if it is no longer valid in the newly selected site group
  React.useEffect(() => {
    if (selectedRecorder !== 'All' && !recordersList.includes(selectedRecorder)) {
      setSelectedRecorder('All');
    }
  }, [selectedSiteGroup, recordersList, selectedRecorder]);

  // 2. Filter recorders list based on site selection (fully filtered)
  const filteredRecorders = useMemo(() => {
    let list = recorders;
    if (selectedSiteGroup !== 'All') {
      list = list.filter((r) => r.site_group === selectedSiteGroup);
    }
    if (selectedRecorder !== 'All') {
      list = list.filter((r) => r.recorder_id === selectedRecorder);
    }
    return list;
  }, [recorders, selectedSiteGroup, selectedRecorder]);

  // Recorders filtered ONLY by site group (ignores selected recorder)
  const landscapeRecorders = useMemo(() => {
    let list = recorders;
    if (selectedSiteGroup !== 'All') {
      list = list.filter((r) => r.site_group === selectedSiteGroup);
    }
    return list;
  }, [recorders, selectedSiteGroup]);

  // Map recorder key to its index in data.recorders
  const recorderKeyToIdx = useMemo(() => {
    const map = new Map<string, number>();
    recorders.forEach((r, idx) => {
      map.set(`${r.site_group}/${r.recorder_id}`, idx);
    });
    return map;
  }, [recorders]);

  // Map of valid recorder indices for fast filtering of detections (fully filtered)
  const validRecorderIndices = useMemo(() => {
    const indices = new Set<number>();
    filteredRecorders.forEach((r) => {
      const idx = recorderKeyToIdx.get(`${r.site_group}/${r.recorder_id}`);
      if (idx !== undefined) indices.add(idx);
    });
    return indices;
  }, [filteredRecorders, recorderKeyToIdx]);

  // Map of valid recorder indices for landscape-level filtering
  const landscapeRecorderIndices = useMemo(() => {
    const indices = new Set<number>();
    landscapeRecorders.forEach((r) => {
      const idx = recorderKeyToIdx.get(`${r.site_group}/${r.recorder_id}`);
      if (idx !== undefined) indices.add(idx);
    });
    return indices;
  }, [landscapeRecorders, recorderKeyToIdx]);

  // 3. Filter Detections in real-time (fully filtered by site group, recorder, and confidence)
  const filteredDetections = useMemo(() => {
    if (!data) return [];
    const thresholdPercentage = Math.round(confidenceThreshold * 100);
    return data.detections.filter((d) => {
      const recIdx = d[0];
      const confidence = d[4];

      // Filter by confidence threshold
      if (confidence < thresholdPercentage) return false;

      // Filter by recorder selection
      return validRecorderIndices.has(recIdx);
    });
  }, [data, confidenceThreshold, validRecorderIndices]);

  // Landscape-level detections (filtered by site group & confidence, ignoring recorder)
  const landscapeDetections = useMemo(() => {
    if (!data) return [];
    const thresholdPercentage = Math.round(confidenceThreshold * 100);
    return data.detections.filter((d) => {
      const recIdx = d[0];
      const confidence = d[4];

      // Filter by confidence threshold
      if (confidence < thresholdPercentage) return false;

      // Filter by landscape recorders
      return landscapeRecorderIndices.has(recIdx);
    });
  }, [data, confidenceThreshold, landscapeRecorderIndices]);

  // 4. Calculate stats on fully filtered detections (used for KPIs, Map, and Richness Comparison)
  const {
    uniqueSpeciesCount,
    totalDetections,
    activeRecordersCount,
    totalFilesProcessed,
    totalExpectedFiles,
    totalDays,
    siteRichness,
    siteDetections,
  } = useMemo(() => {
    if (!data) {
      return {
        uniqueSpeciesCount: 0,
        totalDetections: 0,
        activeRecordersCount: 0,
        totalFilesProcessed: 0,
        totalExpectedFiles: 0,
        totalDays: 0,
        siteRichness: {},
        siteDetections: {},
      };
    }
    const detectedSpecies = new Set<number>();
    const activeRecs = new Set<number>();
    const richnessMap: Record<string, Set<number>> = {};
    const detectionsMap: Record<string, number> = {};

    filteredDetections.forEach((d) => {
      const recIdx = d[0];
      const spIdx = d[1];

      detectedSpecies.add(spIdx);
      activeRecs.add(recIdx);

      const rec = data.recorders[recIdx];
      const recKey = `${rec.site_group}/${rec.recorder_id}`;

      // Site totals
      if (!richnessMap[recKey]) richnessMap[recKey] = new Set<number>();
      richnessMap[recKey].add(spIdx);
      detectionsMap[recKey] = (detectionsMap[recKey] || 0) + 1;
    });

    const finalRichness: Record<string, number> = {};
    Object.keys(richnessMap).forEach((key) => {
      finalRichness[key] = richnessMap[key].size;
    });

    // Calculate effort stats
    const filesProcessed = filteredRecorders.reduce((sum, r) => sum + r.actual_files, 0);
    const expectedFiles = filteredRecorders.reduce((sum, r) => sum + (r.expected_files || 0), 0);

    // Recorders metadata has days (about 11 days per site)
    const days = filteredRecorders.length * 11;

    return {
      uniqueSpeciesCount: detectedSpecies.size,
      totalDetections: filteredDetections.length,
      activeRecordersCount: activeRecs.size,
      totalFilesProcessed: filesProcessed,
      totalExpectedFiles: expectedFiles,
      totalDays: days,
      siteRichness: finalRichness,
      siteDetections: detectionsMap,
    };
  }, [filteredDetections, data, filteredRecorders]);

  // 4b. Calculate stats on landscape-level detections (ignoring recorder site filter)
  const {
    siteRichness: landscapeSiteRichness,
    siteDetections: landscapeSiteDetections,
    speciesDetectionsMatrix: landscapeSpeciesDetectionsMatrix,
    detectionsByHour: landscapeDetectionsByHour,
  } = useMemo(() => {
    if (!data) {
      return {
        siteRichness: {},
        siteDetections: {},
        speciesDetectionsMatrix: {},
        detectionsByHour: {},
      };
    }
    const richnessMap: Record<string, Set<number>> = {};
    const detectionsMap: Record<string, number> = {};
    const matrixMap: Record<string, Record<string, number>> = {};
    const hourMap: Record<string, Record<number, number>> = {};

    landscapeDetections.forEach((d) => {
      const recIdx = d[0];
      const spIdx = d[1];
      const hour = d[3];

      const rec = data.recorders[recIdx];
      const recKey = `${rec.site_group}/${rec.recorder_id}`;
      const spName = data.species_list[spIdx];

      // Hour timeline by species name
      if (!hourMap[spName]) hourMap[spName] = {};
      hourMap[spName][hour] = (hourMap[spName][hour] || 0) + 1;

      // Richness
      if (!richnessMap[recKey]) richnessMap[recKey] = new Set<number>();
      richnessMap[recKey].add(spIdx);

      // Total detections
      detectionsMap[recKey] = (detectionsMap[recKey] || 0) + 1;

      // Matrix mapping
      if (!matrixMap[spName]) matrixMap[spName] = {};
      matrixMap[spName][recKey] = (matrixMap[spName][recKey] || 0) + 1;
    });

    const finalRichness: Record<string, number> = {};
    Object.keys(richnessMap).forEach((key) => {
      finalRichness[key] = richnessMap[key].size;
    });

    return {
      siteRichness: finalRichness,
      siteDetections: detectionsMap,
      speciesDetectionsMatrix: matrixMap,
      detectionsByHour: hourMap,
    };
  }, [landscapeDetections, data]);

  // 5. CSV Download Handlers
  const downloadSummaryCSV = () => {
    if (!data) return;
    const headers = ['Landscape Group', 'Recorder ID', 'Habitat Type', 'Processed Files', 'Species Richness', 'Total Detections'];
    const rows = landscapeRecorders.map((rec) => {
      const key = `${rec.site_group}/${rec.recorder_id}`;
      const richness = landscapeSiteRichness[key] || 0;
      const detections = landscapeSiteDetections[key] || 0;
      return [
        rec.site_group,
        rec.recorder_id,
        rec.habitat === 'LC' ? 'Lantana-Cleared' : 'Lantana-Infested',
        rec.actual_files,
        richness,
        detections
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    triggerDownload(csvContent, `richness_summary_${selectedSiteGroup}_conf${confidenceThreshold}.csv`);
  };

  const downloadMatrixCSV = (filteredSpecies: string[], activeRecs: Recorder[]) => {
    if (!data) return;
    const headers = ['Species (Common Name)', 'Scientific Name', ...activeRecs.map(r => `${r.site_group}_${r.recorder_id}`)];
    const rows = filteredSpecies.map((sp) => {
      const meta = data.species_metadata[sp];
      const sci = meta?.scientific || '';
      const detections = activeRecs.map((rec) => {
        const key = `${rec.site_group}/${rec.recorder_id}`;
        return landscapeSpeciesDetectionsMatrix[sp]?.[key] || 0;
      });
      return [sp, sci, ...detections];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    triggerDownload(csvContent, `species_site_matrix_${selectedSiteGroup}_conf${confidenceThreshold}.csv`);
  };

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: 'var(--forest-dark)', flexDirection: 'column', gap: '1rem', backgroundColor: '#f4f6f0' }}>
        <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', borderTop: '4px solid var(--forest-dark)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ fontFamily: 'Outfit', fontWeight: 600 }}>Loading Dynamic Bioacoustic Dashboard...</h3>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return (
    <>
      {!hideHero && <HeroLantana />}
      <FilterBar
        selectedSiteGroup={selectedSiteGroup}
        setSelectedSiteGroup={setSelectedSiteGroup}
        siteGroups={siteGroups}
        selectedRecorder={selectedRecorder}
        setSelectedRecorder={setSelectedRecorder}
        recorders={recordersList}
        confidenceThreshold={confidenceThreshold}
        setConfidenceThreshold={setConfidenceThreshold}
      />

      <SummaryCards
        uniqueSpeciesCount={uniqueSpeciesCount}
        totalDetections={totalDetections}
        activeRecordersCount={activeRecordersCount}
        totalFilesProcessed={totalFilesProcessed}
        totalExpectedFiles={totalExpectedFiles}
        totalDays={totalDays}
      />

      <main className="dashboard-grid">
        {renderSection('map', 'Study Area Map', 
          <MapPanel
            recorders={filteredRecorders}
            siteRichness={siteRichness}
            siteDetections={siteDetections}
            selectedSiteGroup={selectedSiteGroup}
          />
        )}

        {renderSection('search', 'Avian Species Explorer',
          <BirdSearch
            recorders={recorders}
            speciesList={speciesList}
            speciesMetadata={speciesMetadata}
            speciesDetectionsMatrix={landscapeSpeciesDetectionsMatrix}
            detectionsByHour={landscapeDetectionsByHour}
          />
        )}

        {renderSection('comparison', 'Habitat Richness Comparison',
          <RichnessComparison
            recorders={filteredRecorders}
            siteRichness={siteRichness}
            selectedSiteGroup={selectedSiteGroup === 'All' ? 'All' : selectedSiteGroup}
          />
        )}

        {renderSection('richness', 'Species Richness Overview',
          <RichnessOverview
            recorders={recorders}
            siteRichness={landscapeSiteRichness}
            siteDetections={landscapeSiteDetections}
            selectedSiteGroup={selectedSiteGroup}
            onDownloadCSV={downloadSummaryCSV}
          />
        )}

        {renderSection('heatmap', 'Species Detection Heatmap',
          <HeatmapPanel
            recorders={recorders}
            speciesList={speciesList}
            speciesDetectionsMatrix={landscapeSpeciesDetectionsMatrix}
            selectedSiteGroup={selectedSiteGroup}
            onDownloadCSV={downloadMatrixCSV}
          />
        )}

        {renderSection('indicator', 'Indicator Groups Matrix',
          <IndicatorPanel
            recorders={recorders}
            speciesDetectionsMatrix={landscapeSpeciesDetectionsMatrix}
            selectedSiteGroup={selectedSiteGroup}
          />
        )}
      </main>
      {!hideHero && <FooterLantana />}
    </>
  );
};

export default AppLantana;

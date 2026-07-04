import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Download, BarChart3, ClipboardList } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Site {
  id: string;
  projectId: string;
  name: string;
  elevation: string;
  status: string;
  latitude?: number;
  longitude?: number;
}

interface CommonDashboardProps {
  projectId: string;
  hideHero?: boolean;
}

// Map view helper to dynamic recentering
const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [center, zoom, map]);
  return null;
};

const CommonDashboard: React.FC<CommonDashboardProps> = ({ projectId, hideHero = false }) => {
  const [data, setData] = useState<any>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [siteSettings, setSiteSettings] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('All');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.70);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedExplorerSpecies, setSelectedExplorerSpecies] = useState<string>('');
  const [explorerQuery, setExplorerQuery] = useState<string>('');
  const [explorerSuggestions, setExplorerSuggestions] = useState<string[]>([]);
  const [showExplorerDropdown, setShowExplorerDropdown] = useState<boolean>(false);
  const explorerDropdownRef = useRef<HTMLDivElement>(null);

  // Read visibility setting for Species Detection Matrix from localStorage
  const [showDetectionMatrix, setShowDetectionMatrix] = useState<boolean>(true);
  useEffect(() => {
    const stored = localStorage.getItem('dashboardVisibility');
    if (stored) {
      const v = JSON.parse(stored);
      setShowDetectionMatrix(v.detectionMatrix !== false);
    }
  }, []);

  // Close explorer suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (explorerDropdownRef.current && !explorerDropdownRef.current.contains(event.target as Node)) {
        setShowExplorerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExplorerInput = (val: string) => {
    setExplorerQuery(val);
    if (!val.trim()) {
      setExplorerSuggestions([]);
      setShowExplorerDropdown(false);
      return;
    }
    const filtered = detectedSpeciesList
      .filter(sp => {
        const matchCommon = sp.name.toLowerCase().includes(val.toLowerCase());
        const matchSci = (sp.meta?.scientific || '').toLowerCase().includes(val.toLowerCase());
        return matchCommon || matchSci;
      })
      .map(sp => sp.name)
      .slice(0, 10);
    setExplorerSuggestions(filtered);
    setShowExplorerDropdown(true);
  };

  const handleExplorerSelect = (spName: string) => {
    setSelectedExplorerSpecies(spName);
    setExplorerQuery('');
    setExplorerSuggestions([]);
    setShowExplorerDropdown(false);
  };

  // Load project sites list from Supabase
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const { data, error } = await supabase
          .from('sites')
          .select('*')
          .eq('project_id', projectId);

        if (!error && data) {
          // Map database snake_case to frontend camelCase
          const mappedSites = data.map(s => ({
            id: s.id,
            projectId: s.project_id,
            name: s.name,
            elevation: s.elevation,
            status: s.status,
            latitude: s.latitude,
            longitude: s.longitude
          }));
          setSites(mappedSites);
        }
      } catch (err) {
        console.error('Error fetching sites:', err);
      }
    };
    fetchSites();
  }, [projectId]);

  // Load compiled data from Supabase Storage
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: fileData, error } = await supabase
          .storage
          .from('observatory-data')
          .download(`${projectId}/data.json`);

        if (error || !fileData) {
          console.error('Failed to load project dashboard data from Supabase:', error);
          setLoading(false);
          return;
        }

        const text = await fileData.text();
        const json = JSON.parse(text);
        setData(json);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [projectId]);

  // Load site settings (visibility toggles) from Supabase
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('project_id', projectId);

        if (!error && data) {
          setSiteSettings(data);
        }
      } catch (err) {
        console.error('Error fetching site settings:', err);
      }
    };
    fetchSettings();
  }, [projectId]);

  // Recorders data list derived from fetched data and merged with Supabase metadata
  const recorders = useMemo(() => {
    // Start with API recorders (sites that have uploaded BirdNET data)
    const apiRecorders = (data?.recorders ?? []).map((r: any) => {
      const match = sites.find(s => s.id && typeof s.id === 'string' && r.site_group && typeof r.site_group === 'string' && s.id.toLowerCase() === r.site_group.toLowerCase());
      return {
        ...r,
        name: match ? match.name : r.site_group,
        latitude: match && match.latitude !== undefined && match.latitude !== null ? parseFloat(match.latitude as any) : (r.latitude !== null && r.latitude !== undefined ? parseFloat(r.latitude) : null),
        longitude: match && match.longitude !== undefined && match.longitude !== null ? parseFloat(match.longitude as any) : (r.longitude !== null && r.longitude !== undefined ? parseFloat(r.longitude) : null),
        elevation: match ? match.elevation : 'Unknown'
      };
    });

    // Collect site_group IDs already covered by the API recorders
    const coveredIds = new Set(apiRecorders.map((r: any) => (r.site_group ?? '').toLowerCase()));

    // Append LocalStorage-only sites as synthetic "Setup Mode" entries (no files yet)
    const ghostRecorders = sites
      .filter(s => s.id && !coveredIds.has(s.id.toLowerCase()))
      .map(s => ({
        site_group: s.id,
        name: s.name,
        latitude: s.latitude !== undefined && s.latitude !== null ? parseFloat(s.latitude as any) : null,
        longitude: s.longitude !== undefined && s.longitude !== null ? parseFloat(s.longitude as any) : null,
        elevation: s.elevation || 'Unknown',
        actual_files: 0,
        expected_files: 0,
        recorder_id: ''
      }));

    return [...apiRecorders, ...ghostRecorders];
  }, [data, sites]);

  // Filter detections by active filters (Selected Site & Confidence Threshold)
  const filteredDetections = useMemo(() => {
    if (!data || !data.detections) return [];
    return data.detections.filter((d: number[]) => {
      const recIdx = d[0];
      const confidence = d[4] / 100;
      if (confidence < confidenceThreshold) return false;

      if (selectedSite !== 'All') {
        const recorder = data.recorders[recIdx];
        if (!recorder || !recorder.site_group || typeof recorder.site_group !== 'string') return false;
        if (recorder.site_group.toLowerCase() !== selectedSite.toLowerCase()) return false;
      }
      return true;
    });
  }, [data, selectedSite, confidenceThreshold]);

  // Calculations: Site Metrics & Effort Counts
  const stats = useMemo(() => {
    if (!data) {
      return {
        uniqueSpeciesCount: 0,
        totalDetections: 0,
        activeStations: 0,
        rawLogsProcessed: 0
      };
    }

    const uniqueSpecies = new Set<number>();
    const activeRecs = new Set<number>();

    filteredDetections.forEach((d: number[]) => {
      uniqueSpecies.add(d[1]);
      activeRecs.add(d[0]);
    });

    // Sum file counts across matching recorders
    const matchedRecorders = selectedSite === 'All' 
      ? recorders 
      : recorders.filter((r: any) => r.site_group.toLowerCase() === selectedSite.toLowerCase());
    
    const logsProcessed = matchedRecorders.reduce((sum: number, r: any) => sum + r.actual_files, 0);

    return {
      uniqueSpeciesCount: uniqueSpecies.size,
      totalDetections: filteredDetections.length,
      activeStations: activeRecs.size,
      rawLogsProcessed: logsProcessed
    };
  }, [filteredDetections, recorders, data, selectedSite]);

  // Calculations: Hourly timeline array [0..23]
  const detectionsByHour = useMemo(() => {
    const hours = Array(24).fill(0);
    filteredDetections.forEach((d: number[]) => {
      const hour = d[3];
      if (hour >= 0 && hour < 24) {
        hours[hour]++;
      }
    });
    return hours;
  }, [filteredDetections]);

  // Calculations: Richness by Site
  const richnessBySite = useMemo(() => {
    if (!data || !data.recorders) return {};
    const richnessMap: Record<string, Set<number>> = {};

    // Group all detections by site index
    data.detections.forEach((d: number[]) => {
      const conf = d[4] / 100;
      if (conf < confidenceThreshold) return;

      const recIdx = d[0];
      const spIdx = d[1];
      const recorder = data.recorders[recIdx];
      if (!recorder || !recorder.site_group) return;
      const siteGroup = recorder.site_group;

      if (!richnessMap[siteGroup]) {
        richnessMap[siteGroup] = new Set<number>();
      }
      richnessMap[siteGroup].add(spIdx);
    });

    const counts: Record<string, number> = {};
    Object.keys(richnessMap).forEach(key => {
      const match = sites.find(s => s.id && typeof s.id === 'string' && s.id.toLowerCase() === key.toLowerCase());
      const label = match ? match.name : key;
      counts[label] = richnessMap[key].size;
    });
    return counts;
  }, [data, sites, confidenceThreshold]);

  // Calculations: Matrix of detections (Species -> Site Key -> Count)
  const speciesDetectionsMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    if (!data) return matrix;

    filteredDetections.forEach((d: number[]) => {
      const recIdx = d[0];
      const spIdx = d[1];
      const recorder = data.recorders[recIdx];
      const speciesName = data.species_list[spIdx];
      const siteKey = recorder.site_group;

      if (!matrix[speciesName]) {
        matrix[speciesName] = {};
      }
      matrix[speciesName][siteKey] = (matrix[speciesName][siteKey] || 0) + 1;
    });

    return matrix;
  }, [filteredDetections, data]);

  // Map settings
  const mapCenterInfo = useMemo(() => {
    const validRecs = recorders.filter((r: any) => {
      if (r.latitude === null || r.longitude === null || isNaN(r.latitude) || isNaN(r.longitude)) return false;
      const setting = siteSettings.find(s => s.site_id === r.site_group);
      if (setting && setting.hide_map) return false;
      return true;
    });

    if (validRecs.length > 0) {
      const sumLat = validRecs.reduce((sum: number, r: any) => sum + r.latitude, 0);
      const sumLng = validRecs.reduce((sum: number, r: any) => sum + r.longitude, 0);
      const lat = sumLat / validRecs.length;
      const lng = sumLng / validRecs.length;
      const zoom = selectedSite === 'All' ? 9.5 : 14.5;
      return { center: [lat, lng] as [number, number], zoom };
    }
    return { center: [11.0, 76.9] as [number, number], zoom: 8.5 };
  }, [recorders, selectedSite, siteSettings]);

  // Create custom Leaflet pin icon: Blue/Indigo for active, Grey for inactive
  const createPinIcon = (active: boolean) => {
    const color = active ? '#4f46e5' : '#94a3b8'; // Indigo for data-active, Slate for empty
    const svgHtml = `
      <div style="display: flex; justify-content: center; align-items: center; width: 32px; height: 32px;">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="${color}" stroke="#ffffff" stroke-width="1.8" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `;
    return L.divIcon({
      html: svgHtml,
      className: 'custom-pin-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });
  };

  // Compile full species metrics list for display in the Search table
  const searchTableData = useMemo(() => {
    if (!data) return [];
    return data.species_list.map((spName: string, idx: number) => {
      const meta = data.species_metadata[spName] || {};
      
      // Count detections for the selected site
      let count = 0;
      filteredDetections.forEach((d: number[]) => {
        if (d[1] === idx) count++;
      });

      return {
        commonName: spName,
        scientificName: meta.scientific || 'Unknown',
        iucn: meta.iucn || 'LC',
        detections: count
      };
    }).filter((sp: any) => sp.detections > 0);
  }, [filteredDetections, data]);

  // Filter search table based on input text query
  const filteredSearchTable = useMemo(() => {
    return searchTableData.filter((item: any) => 
      item.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.scientificName.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a: any, b: any) => b.detections - a.detections);
  }, [searchTableData, searchQuery]);

  // Compile list of detected species (at least 1 detection matching conf threshold)
  const detectedSpeciesList = useMemo(() => {
    if (!data) return [];
    const spIndices = new Set<number>();
    filteredDetections.forEach((d: number[]) => {
      spIndices.add(d[1]);
    });
    return Array.from(spIndices).map(idx => ({
      idx,
      name: data.species_list[idx],
      meta: data.species_metadata[data.species_list[idx]] || {}
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredDetections, data]);

  // Set default Explorer species when data loads
  useEffect(() => {
    if (detectedSpeciesList.length > 0 && !selectedExplorerSpecies) {
      setSelectedExplorerSpecies(detectedSpeciesList[0].name);
    }
  }, [detectedSpeciesList, selectedExplorerSpecies]);

  // Compile dynamic stats and map centers for the selected species in explorer
  const explorerSpeciesStats = useMemo(() => {
    if (!selectedExplorerSpecies || !data) return null;

    const spIdx = data.species_list.indexOf(selectedExplorerSpecies);
    if (spIdx === -1) return null;

    const detections = filteredDetections.filter((d: number[]) => d[1] === spIdx);
    const siteCounts: Record<string, number> = {};
    const hourlyCounts = Array(24).fill(0);

    detections.forEach((d: number[]) => {
      const recIdx = d[0];
      const hour = d[3];
      const recorder = data.recorders[recIdx];
      if (!recorder || !recorder.site_group) return;
      const siteGroup = recorder.site_group;

      siteCounts[siteGroup] = (siteCounts[siteGroup] || 0) + 1;
      if (hour >= 0 && hour < 24) {
        hourlyCounts[hour]++;
      }
    });

    // Find dominant site
    let dominantSite = 'None';
    let maxDetections = 0;
    Object.entries(siteCounts).forEach(([site, count]) => {
      if (count > maxDetections) {
        maxDetections = count;
        const match = sites.find(s => s.id && typeof s.id === 'string' && s.id.toLowerCase() === site.toLowerCase());
        dominantSite = match ? match.name : site;
      }
    });

    const total = detections.length;
    const dominantPct = total > 0 ? Math.round((maxDetections / total) * 100) : 0;

    return {
      total,
      siteCounts,
      hourlyCounts,
      dominantSite,
      dominantPct
    };
  }, [selectedExplorerSpecies, filteredDetections, data, sites]);

  // CSV Exporter for Species Richness metrics
  const handleDownloadCSV = () => {
    if (!data) return;
    const headers = ['Common Name', 'Scientific Name', 'IUCN Category', 'Detections Count'];
    const rows = filteredSearchTable.map((item: any) => [
      `"${item.commonName}"`,
      `"${item.scientificName}"`,
      `"${item.iucn}"`,
      item.detections
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `species_detections_${selectedSite}_conf${confidenceThreshold}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#10b981', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', borderTop: '4px solid #10b981', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ fontFamily: 'Outfit', fontWeight: 600 }}>Loading Project Datasets...</h3>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  // Determine if files exist at all
  const hasFiles = recorders.some((r: any) => r.actual_files > 0);

  return (
    <div className="common-dashboard-container" style={{ '--color-primary': '#10b981', '--color-neutral': '#163f28' } as React.CSSProperties}>
      {/* TST-matched theme token injection */}
      <style dangerouslySetInnerHTML={{__html: `
        .common-dashboard-container { background-color: #f4f6f0; }
        .common-dashboard-container .dashboard-section { background: #ffffff; }
        .common-dashboard-container .kpi-card { background: #ffffff; }
        .common-dashboard-container .filter-bar { background: #ffffff; }
      `}} />
      {/* Optional Project Hero Section */}
      {!hideHero && (
        <section className="dashboard-header-banner" style={{ background: 'linear-gradient(135deg, #091a10 0%, #0f172a 60%, #1e293b 100%)', color: 'white', padding: '3.5rem 3rem', borderRadius: '16px', marginBottom: '2.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.18)' }}>
          <div className="banner-content">
            <span className="banner-tag" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.12em', background: 'rgba(16,185,129,0.18)', padding: '0.3rem 0.8rem', borderRadius: '30px', fontWeight: 700, color: '#34d399' }}>Bioacoustic Research Site</span>
            <h1 className="banner-title" style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.75rem 0 0.5rem 0', fontFamily: 'Outfit' }}>Dynamic Bioacoustic Dashboard</h1>
            <p className="banner-desc" style={{ opacity: 0.8, fontSize: '1.05rem', maxWidth: '800px', margin: 0, lineHeight: 1.5, color: '#cbd5e1' }}>
              Explore real-time avian diversity, timeline profiles, and activity maps derived from acoustic field recordings.
            </p>
          </div>
        </section>
      )}

      {/* Global Filter Bar */}
      <section className="filter-bar" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', padding: '1.5rem 2rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '240px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter study site</label>
          <select 
            value={selectedSite} 
            onChange={(e) => setSelectedSite(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', fontFamily: 'Inter' }}
          >
            <option value="All">All Sites ({sites.length})</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexGrow: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="filter-label">BirdNET Confidence Cutoff</label>
            <span className="slider-val">{confidenceThreshold.toFixed(2)}</span>
          </div>
          <div className="slider-wrapper">
            <input 
              type="range" 
              className="range-slider"
              min="0.10" 
              max="0.99" 
              step="0.05"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            />
          </div>
        </div>
      </section>

      {/* Summary KPI Cards */}
      <section className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="kpi-card" style={{ padding: '1.5rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', borderTop: '3px solid #10b981' }}>
          <div className="kpi-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 600, letterSpacing: '0.05em' }}>Avian Species Richness</div>
          <div className="kpi-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', margin: '0.4rem 0' }}>{stats.uniqueSpeciesCount}</div>
          <div className="kpi-subtext" style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Unique species detected</div>
        </div>

        <div className="kpi-card" style={{ padding: '1.5rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', borderTop: '3px solid #163f28' }}>
          <div className="kpi-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 600, letterSpacing: '0.05em' }}>Acoustic Detections</div>
          <div className="kpi-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#163f28', margin: '0.4rem 0' }}>{stats.totalDetections.toLocaleString()}</div>
          <div className="kpi-subtext" style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Total identified calls</div>
        </div>

        <div className="kpi-card" style={{ padding: '1.5rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', borderTop: '3px solid #059669' }}>
          <div className="kpi-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 600, letterSpacing: '0.05em' }}>Active Study Sites</div>
          <div className="kpi-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#059669', margin: '0.4rem 0' }}>{recorders.filter((r: any) => r.actual_files > 0).length}</div>
          <div className="kpi-subtext" style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Out of {sites.length} total stations</div>
        </div>

        <div className="kpi-card" style={{ padding: '1.5rem 2rem', background: '#fff', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)', borderTop: '3px solid #34d399' }}>
          <div className="kpi-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 600, letterSpacing: '0.05em' }}>Survey Effort Archive</div>
          <div className="kpi-value" style={{ fontSize: '2.2rem', fontWeight: 800, color: '#34d399', margin: '0.4rem 0' }}>{stats.rawLogsProcessed}</div>
          <div className="kpi-subtext" style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Raw logs (CSV/TXT) parsed</div>
        </div>
      </section>

      {/* Main Grid View */}
      <main className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', padding: 0 }}>
        
        {/* Leaflet Map Section */}
        <section className="dashboard-section" style={{ gridColumn: 'span 12', padding: '2rem' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Study Area Mapping</h2>
              <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Interactive satellite map. Click pins to view study site details or apply filter.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                <span>Active (With logs)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#94a3b8', display: 'inline-block' }}></span>
                <span>Setup Mode (No logs yet)</span>
              </div>
            </div>
          </div>

          <div style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', isolation: 'isolate' }}>
            <MapContainer
              center={mapCenterInfo.center}
              zoom={mapCenterInfo.zoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <ChangeView center={mapCenterInfo.center} zoom={mapCenterInfo.zoom} />
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              {recorders
                .filter((r: any) => {
                  if (r.latitude === null || r.longitude === null || isNaN(r.latitude) || isNaN(r.longitude)) return false;
                  const setting = siteSettings.find(s => s.site_id === r.site_group);
                  if (setting && setting.hide_map) return false;
                  return true;
                })
                .map((rec: any) => {
                  const richness = richnessBySite[rec.name] || 0;
                  const isActive = rec.actual_files > 0;

                  return (
                    <Marker
                      key={rec.site_group}
                      position={[rec.latitude, rec.longitude]}
                      icon={createPinIcon(isActive)}
                      eventHandlers={{
                        click: () => {
                          setSelectedSite(rec.site_group);
                        }
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -25]} opacity={0.9}>
                        <div style={{ padding: '0.1rem', fontSize: '0.8rem', fontWeight: 700 }}>
                          {rec.name}
                        </div>
                      </Tooltip>
                      <Popup>
                        <div className="map-popup-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '160px', fontFamily: 'Inter', fontSize: '0.8rem' }}>
                          <h4 style={{ fontWeight: 800, margin: '0 0 0.2rem 0', color: '#10b981', borderBottom: '1px solid #eee', paddingBottom: '0.2rem' }}>{rec.name}</h4>
                          <div>Elevation: <strong>{rec.elevation}</strong></div>
                          <div>Status: <span style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', backgroundColor: isActive ? '#dcfce7' : '#f1f5f9', color: isActive ? '#166534' : '#475569', fontWeight: 600 }}>{isActive ? 'Active' : 'Awaiting data'}</span></div>
                          <div>Acoustic Logs: <strong>{rec.actual_files}</strong></div>
                          {isActive && (
                            <div style={{ borderTop: '1px solid #eee', paddingTop: '0.3rem', marginTop: '0.2rem', color: '#4f46e5', fontWeight: 700 }}>
                              Richness: {richness} species
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
            </MapContainer>
          </div>
        </section>

        {/* Empty State Banner if no files are uploaded */}
        {!hasFiles && (
          <section className="dashboard-section" style={{ gridColumn: 'span 12', padding: '3rem 2rem', textAlign: 'center', backgroundColor: '#fcfdfa', borderStyle: 'dashed', borderWidth: '2px' }}>
            <ClipboardList size={48} style={{ color: 'var(--text-light)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Acoustic Log Files Uploaded Yet</h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', maxWidth: '550px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              Acoustic analysis is queued for this project. To see live graphs, species detection lists, and vocal activity trends, please upload BirdNET inference logs or selection tables inside the **Admin Panel &rarr; Import Bioacoustic Logs** tab.
            </p>
            <a href="#/admin" className="btn btn-primary btn-small">Import Logs & Selection Tables</a>
          </section>
        )}

        {hasFiles && (
          <>
            {/* Left: Species Richness Bar Chart */}
            <section className="dashboard-section" style={{ gridColumn: 'span 6', padding: '2rem' }}>
              <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}><BarChart3 size={18} style={{ verticalAlign: 'middle', marginRight: '0.4rem', display: 'inline' }} /> Species Richness Comparison</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Unique species detected per research site</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                {Object.entries(richnessBySite).map(([name, count]) => {
                  const maxCount = Math.max(...Object.values(richnessBySite), 1);
                  const widthPct = (count / maxCount) * 100;
                  return (
                    <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{name}</span>
                        <span style={{ fontWeight: 800, color: '#4f46e5' }}>{count} Species</span>
                      </div>
                      <div style={{ height: '24px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${widthPct}%`, backgroundColor: '#4f46e5', transition: 'width 0.5s ease', borderRadius: '6px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Right: Daily Vocal Activity Profile */}
            <section className="dashboard-section" style={{ gridColumn: 'span 6', padding: '2rem' }}>
              <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>Daily Vocal Activity Profile</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>Total acoustic calls detected by hour of day</p>
              </div>

              <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '4px', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', marginTop: '2rem' }}>
                {detectionsByHour.map((count: number, hr: number) => {
                  const maxCount = Math.max(...detectionsByHour, 1);
                  const heightPct = (count / maxCount) * 100;
                  return (
                    <div 
                      key={hr} 
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'end' }}
                      title={`${count.toLocaleString()} calls`}
                    >
                      <div style={{ height: `${heightPct}%`, width: '100%', backgroundColor: '#4f46e5', borderRadius: '3px 3px 0 0', minHeight: count > 0 ? '3px' : '0' }}></div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '0.5rem', padding: '0 0.2rem' }}>
                <span>00:00 (Midnight)</span>
                <span>06:00 (Dawn)</span>
                <span>12:00 (Noon)</span>
                <span>18:00 (Dusk)</span>
                <span>23:00</span>
              </div>
            </section>

            {/* Species Detections Heatmap Grid — visibility gated */}
            {showDetectionMatrix && (
            <section className="dashboard-section" style={{ gridColumn: 'span 12', padding: '2rem' }}>
              <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Species Detection Matrix</h2>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Heatmap displaying relative call count densities across all research sites.</p>
                </div>
                {/* Download CSV button */}
                <button
                  onClick={() => {
                    const header = ['Species', ...sites.map(s => s.name)].join(',');
                    const rows = Object.keys(speciesDetectionsMatrix).map(sp =>
                      [sp, ...sites.map(s => speciesDetectionsMatrix[sp]?.[s.id] || 0)].join(',')
                    );
                    const csv = [header, ...rows].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `species_detection_matrix_${projectId}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Inter' }}
                >
                  <Download size={14} /> Download CSV
                </button>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', fontFamily: 'Inter' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-main)' }}>Species Name</th>
                      {sites.map(s => (
                        <th key={s.id} style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, color: 'var(--text-main)', minWidth: '120px' }}>{s.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(speciesDetectionsMatrix).slice(0, 15).map((sp) => (
                      <tr key={sp} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>{sp}</td>
                        {sites.map(s => {
                          const count = speciesDetectionsMatrix[sp]?.[s.id] || 0;
                          
                          // Determine heatmap color density
                          let bg = 'transparent';
                          let fg = '#64748b';
                          if (count > 0 && count < 10) { bg = '#ede9fe'; fg = '#7c3aed'; }
                          else if (count >= 10 && count < 50) { bg = '#ddd6fe'; fg = '#6d28d9'; }
                          else if (count >= 50 && count < 200) { bg = '#c4b5fd'; fg = '#5b21b6'; }
                          else if (count >= 200) { bg = '#a78bfa'; fg = '#4c1d95'; }

                          return (
                            <td key={s.id} style={{ padding: '0.85rem 1rem', textAlign: 'center', backgroundColor: bg, color: fg, fontWeight: count > 0 ? 800 : 400 }}>
                              {count > 0 ? count.toLocaleString() : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {Object.keys(speciesDetectionsMatrix).length === 0 && (
                      <tr>
                        <td colSpan={sites.length + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>No detections meet the confidence threshold.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            )}

            {/* Avian Species Explorer Section */}
            <section className="dashboard-section" style={{ gridColumn: 'span 12', padding: '2.5rem' }}>
              <div className="section-header" style={{ marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>Avian Species Explorer</h2>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: 0 }}>
                    Search for any detected bird species to view its ecological profile, IUCN status, and spatial map density.
                  </p>
                </div>
              </div>

              {/* TST-style autocomplete search box */}
              <div className="search-box" ref={explorerDropdownRef} style={{ maxWidth: '500px', marginBottom: '1.5rem' }}>
                <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder={selectedExplorerSpecies ? `Selected: ${selectedExplorerSpecies}` : 'Search by common or scientific name…'}
                  value={explorerQuery}
                  onChange={(e) => handleExplorerInput(e.target.value)}
                  onFocus={() => explorerQuery.trim() !== '' && setShowExplorerDropdown(true)}
                />
                {showExplorerDropdown && explorerSuggestions.length > 0 && (
                  <div className="autocomplete-suggestions">
                    {explorerSuggestions.map(sp => (
                      <div key={sp} className="suggestion-item" onClick={() => handleExplorerSelect(sp)}>
                        <span className="common">{sp}</span>
                        <span className="scientific">{data?.species_metadata[sp]?.scientific}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedExplorerSpecies && explorerSpeciesStats ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', marginTop: '1.5rem' }}>
                  
                  {/* Left Column: Ecological Profile & Details */}
                  <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', margin: '0 0 0.25rem 0' }}>{selectedExplorerSpecies}</h3>
                      <p style={{ fontStyle: 'italic', color: 'var(--text-light)', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>
                        {data.species_metadata[selectedExplorerSpecies]?.scientific || 'Scientific name not configured'}
                      </p>

                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.6rem', 
                          borderRadius: '6px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          backgroundColor: data.species_metadata[selectedExplorerSpecies]?.iucn === 'LC' ? '#dcfce7' : '#fee2e2', 
                          color: data.species_metadata[selectedExplorerSpecies]?.iucn === 'LC' ? '#166534' : '#991b1b' 
                        }}>
                          IUCN: {data.species_metadata[selectedExplorerSpecies]?.iucn || 'LC'}
                        </span>
                        <span style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                          {data.species_metadata[selectedExplorerSpecies]?.group || 'Avian Species'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-main)', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                        <div>Total Detections: <strong style={{ color: '#10b981', fontSize: '1rem' }}>{explorerSpeciesStats.total.toLocaleString()} calls</strong></div>
                        <div>Primary Location: <strong>{explorerSpeciesStats.dominantSite}</strong> <span style={{ color: 'var(--text-light)' }}>({explorerSpeciesStats.dominantPct}% of detections)</span></div>
                        <div style={{ marginTop: '0.4rem', color: 'var(--text-light)', lineHeight: 1.4, fontSize: '0.8rem' }}>
                          <strong>Habitat Association:</strong> This species shows high site preference for {explorerSpeciesStats.dominantSite}, representing the primary soundscape profile in this landscape section.
                        </div>
                      </div>
                    </div>

                    {/* Species Vocal Profile */}
                    <div style={{ padding: '1.2rem', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-light)', letterSpacing: '0.05em', margin: '0 0 1rem 0' }}>Diurnal Singing Pattern</h4>
                      {/* key forces full re-render when species changes */}
                      <div key={selectedExplorerSpecies} style={{ height: '90px', display: 'flex', alignItems: 'end', gap: '2px', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.2rem' }}>
                        {explorerSpeciesStats.hourlyCounts.map((count: number, hr: number) => {
                          const maxCount = Math.max(...explorerSpeciesStats.hourlyCounts, 1);
                          const heightPct = (count / maxCount) * 100;
                          // Indigo 3-shade ramp matching TST
                          const intensity = count / maxCount;
                          const barColor = intensity > 0.6 ? '#4f46e5' : intensity > 0.3 ? '#818cf8' : '#c7d2fe';
                          return (
                            <div key={hr} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'end' }} title={`${count} calls at ${String(hr).padStart(2,'0')}:00`}>
                              <div style={{ height: `${heightPct}%`, width: '100%', backgroundColor: count > 0 ? barColor : '#e2e8f0', borderRadius: '1.5px 1.5px 0 0', minHeight: count > 0 ? '3px' : '0', transition: 'height 0.4s ease, background-color 0.3s ease' }}></div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-light)', marginTop: '0.3rem' }}>
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Spatial Distribution Heatmap Map — colour-gradient mode */}
                  <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Spatial Distribution Heatmap</h4>
                      {/* Colour legend */}
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--text-light)', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#94a3b8', display: 'inline-block' }}></span>None</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block' }}></span>Low</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#facc15', display: 'inline-block' }}></span>Med</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f97316', display: 'inline-block' }}></span>High</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#dc2626', display: 'inline-block' }}></span>Peak</span>
                      </div>
                    </div>

                    <div style={{ height: '340px', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', isolation: 'isolate' }}>
                      <MapContainer
                        center={mapCenterInfo.center}
                        zoom={mapCenterInfo.zoom - 0.5}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                      >
                        <ChangeView center={mapCenterInfo.center} zoom={mapCenterInfo.zoom - 0.5} />
                        <TileLayer
                          attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                        {recorders
                          .filter((r: any) => r.latitude !== null && r.longitude !== null && !isNaN(r.latitude) && !isNaN(r.longitude))
                          .map((rec: any) => {
                            const count = explorerSpeciesStats.siteCounts[rec.site_group] || 0;
                            const maxVal = Math.max(...(Object.values(explorerSpeciesStats.siteCounts) as number[]), 1);
                            const pct = count / maxVal; // 0.0 – 1.0 normalised intensity

                            // Fixed radius — colour encodes intensity (green→yellow→orange→red)
                            const RADIUS = 10;
                            let heatColor = '#94a3b8'; // slate = no detections
                            let heatOpacity = 0.30;
                            if (count > 0) {
                              if      (pct >= 0.75) { heatColor = '#dc2626'; heatOpacity = 0.85; } // Peak – red
                              else if (pct >= 0.40) { heatColor = '#f97316'; heatOpacity = 0.75; } // High – orange
                              else if (pct >= 0.15) { heatColor = '#facc15'; heatOpacity = 0.70; } // Med  – yellow
                              else                  { heatColor = '#4ade80'; heatOpacity = 0.65; } // Low  – green
                            }

                            return (
                              <CircleMarker
                                key={`${rec.site_group}-${selectedExplorerSpecies}`}
                                center={[rec.latitude, rec.longitude]}
                                radius={RADIUS}
                                pathOptions={{
                                  color: heatColor,
                                  fillColor: heatColor,
                                  fillOpacity: heatOpacity,
                                  weight: count > 0 ? 2 : 1
                                }}
                              >
                                <Tooltip direction="top" offset={[0, -5]} opacity={0.95} permanent={false}>
                                  <div style={{ padding: '0.15rem', fontSize: '0.8rem', fontFamily: 'Inter' }}>
                                    <strong style={{ color: heatColor !== '#94a3b8' ? heatColor : '#64748b' }}>{rec.name}</strong>
                                    <div style={{ marginTop: '0.15rem', fontSize: '0.75rem', color: '#333' }}>
                                      {count > 0
                                        ? `${count.toLocaleString()} calls (${Math.round(pct * 100)}% of max)`
                                        : 'No detections recorded'}
                                    </div>
                                  </div>
                                </Tooltip>
                              </CircleMarker>
                            );
                          })}
                      </MapContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                  No detected species meet the current confidence threshold in this project.
                </div>
              )}
            </section>

            {/* Bird Species Interactive Search Table */}
            <section className="dashboard-section" style={{ gridColumn: 'span 12', padding: '2rem' }}>
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Acoustic Species Inventory</h2>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Comprehensive checklist of all bird species identified at the selected site.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', minWidth: '220px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                    <input 
                      type="text" 
                      placeholder="Search species name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', fontFamily: 'Inter' }}
                    />
                  </div>
                  <button className="btn btn-secondary btn-small" onClick={handleDownloadCSV} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}>
                    <Download size={14} /> Export CSV List
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', fontFamily: 'Inter' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-main)' }}>Common Name</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-main)' }}>Scientific Name</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, color: 'var(--text-main)', width: '150px' }}>IUCN Status</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)', width: '150px' }}>Detections Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSearchTable.map((item: any) => {
                      // Status colors
                      let statusBg = '#e2e8f0';
                      let statusFg = '#475569';
                      if (item.iucn === 'EN') { statusBg = '#fee2e2'; statusFg = '#991b1b'; }
                      else if (item.iucn === 'VU') { statusBg = '#fef3c7'; statusFg = '#92400e'; }
                      else if (item.iucn === 'NT') { statusBg = '#fef9c3'; statusFg = '#854d0e'; }
                      else if (item.iucn === 'LC') { statusBg = '#dcfce7'; statusFg = '#166534'; }

                      return (
                        <tr key={item.commonName} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.commonName}</td>
                          <td style={{ padding: '0.85rem 1rem', fontStyle: 'italic', color: 'var(--text-light)' }}>{item.scientificName}</td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                            <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: statusBg, color: statusFg }}>
                              {item.iucn === 'LC' ? 'Least Concern' : item.iucn === 'EN' ? 'Endangered' : item.iucn === 'VU' ? 'Vulnerable' : item.iucn}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                            {item.detections.toLocaleString()} calls
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSearchTable.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-light)' }}>
                          No species matches the search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default CommonDashboard;

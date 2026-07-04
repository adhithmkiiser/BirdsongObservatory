import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Check, CloudUpload, Clock, Edit2 } from 'lucide-react';

interface ManagerDashboardProps {
  currentUser: {
    username: string;
    role: 'manager_project' | 'manager_site';
    assignedSites?: string[];
  };
}

interface Site {
  id: string;
  projectId: string;
  name: string;
  elevation: string;
  status: string;
  latitude?: number;
  longitude?: number;
  expectedFiles?: number;
}

interface AudioLog {
  id: string;
  siteId: string;
  date: string;
  duration: string;
  fileSize: string;
  status: string;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ currentUser }) => {
  const [successMsg, setSuccessMsg] = useState('');
  
  // Dashboard Section visibility toggles
  const [visibilitySettings, setVisibilitySettings] = useState<Record<string, boolean>>({
    map: true,
    richness: true,
    comparison: true,
    heatmap: true,
    search: true,
    indicator: true,
    detectionMatrix: true
  });

  // Project sites and Audio Logs states
  const [sites, setSites] = useState<Site[]>([]);
  const [audioLogs, setAudioLogs] = useState<AudioLog[]>([]);

  // Site manager selected active station
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  // Site operator form states
  const [newLogDate, setNewLogDate] = useState('');
  const [newLogDuration, setNewLogDuration] = useState('30 mins');
  const [newLogSize, setNewLogSize] = useState('140 MB');

  // Edit Site Coordinates state (Manager Grid)
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [editSiteName, setEditSiteName] = useState('');
  const [editSiteElev, setEditSiteElev] = useState('');
  const [editSiteLat, setEditSiteLat] = useState<number | ''>('');
  const [editSiteLng, setEditSiteLng] = useState<number | ''>('');
  const [editSiteFiles, setEditSiteFiles] = useState<number | ''>('');
  const [editSiteStatus, setEditSiteStatus] = useState('');

  useEffect(() => {
    // 1. Load section visibility
    const storedVisibility = localStorage.getItem('dashboardVisibility');
    if (storedVisibility) {
      setVisibilitySettings(JSON.parse(storedVisibility));
    }

    // 2. Load sites
    const storedSites = localStorage.getItem('sites');
    if (storedSites) {
      const allSites = JSON.parse(storedSites);
      setSites(allSites);
      
      // Auto-select first assigned site
      const assigned = currentUser.assignedSites || [];
      if (assigned.length > 0) {
        setSelectedSiteId(assigned[0]);
      }
    }

    // 3. Load Audio Logs
    const storedLogs = localStorage.getItem('audioLogs');
    if (storedLogs) {
      setAudioLogs(JSON.parse(storedLogs));
    }
  }, [currentUser]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Handler: Toggle visibility of a specific section
  const handleToggleVisibility = (sectionKey: string) => {
    const updated = {
      ...visibilitySettings,
      [sectionKey]: !visibilitySettings[sectionKey]
    };
    setVisibilitySettings(updated);
    localStorage.setItem('dashboardVisibility', JSON.stringify(updated));
    showSuccess(`Visibility for section "${sectionKey.toUpperCase()}" updated.`);
  };

  // Handler: Site Manager - Upload audio log
  const handleAddAudioLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogDate || !selectedSiteId) return;

    const newLog: AudioLog = {
      id: `log_${Date.now()}`,
      siteId: selectedSiteId,
      date: newLogDate,
      duration: newLogDuration,
      fileSize: newLogSize,
      status: 'Pending Analysis'
    };

    const updated = [newLog, ...audioLogs];
    setAudioLogs(updated);
    localStorage.setItem('audioLogs', JSON.stringify(updated));
    setNewLogDate('');
    showSuccess('Audio log registered successfully! Queued for classifier processing.');
  };

  // Handler: Edit Site Coordinates (Manager scope)
  const handleStartEditSite = (site: Site) => {
    setEditingSiteId(site.id);
    setEditSiteName(site.name);
    setEditSiteElev(site.elevation);
    setEditSiteLat(site.latitude ?? '');
    setEditSiteLng(site.longitude ?? '');
    setEditSiteFiles(site.expectedFiles ?? '');
    setEditSiteStatus(site.status);
  };

  const handleSaveEditSite = (siteId: string) => {
    const updated = sites.map(s => {
      if (s.id === siteId) {
        return {
          ...s,
          name: editSiteName,
          elevation: editSiteElev,
          latitude: editSiteLat !== '' ? Number(editSiteLat) : undefined,
          longitude: editSiteLng !== '' ? Number(editSiteLng) : undefined,
          expectedFiles: editSiteFiles !== '' ? Number(editSiteFiles) : undefined,
          status: editSiteStatus
        };
      }
      return s;
    });

    setSites(updated);
    localStorage.setItem('sites', JSON.stringify(updated));
    setEditingSiteId(null);
    showSuccess('Location details saved successfully!');
  };

  // Find active site details
  const activeSite = sites.find(s => s.id === selectedSiteId);
  const activeProjectId = activeSite?.projectId;

  // Filter manager's assigned sites belonging to the active project
  const projectSites = sites.filter(
    s => (currentUser.assignedSites || []).includes(s.id) && s.projectId === activeProjectId
  );

  return (
    <div className="manager-dashboard-container">
      {/* Header Banner */}
      <section className="dashboard-header-banner manager-banner">
        <div className="banner-content">
          <span className="banner-tag">Research Operator Console</span>
          <h1 className="banner-title">
            Settings for {activeProjectId === 'tst-lantana' ? 'TST Lantana' : 'The Nilgiri Project'}
          </h1>
          <p className="banner-desc">
            Manage public visibility settings, edit recorder coordinates, and upload acoustic logs for assigned research stations.
          </p>
        </div>
      </section>

      {/* Station Selector Bar */}
      <section className="manager-station-selector-bar" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-color)', padding: '1rem 2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontWeight: 700, color: 'var(--forest-dark)', fontSize: '0.9rem' }}>Active Research Station:</span>
        {currentUser.assignedSites && currentUser.assignedSites.length > 0 ? (
          <select 
            value={selectedSiteId} 
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="admin-select"
            style={{ width: '320px', margin: 0 }}
          >
            {currentUser.assignedSites.map(sid => {
              const siteObj = sites.find(s => s.id === sid);
              return (
                <option key={sid} value={sid}>
                  {siteObj ? `${siteObj.name} [${siteObj.projectId}]` : sid}
                </option>
              );
            })}
          </select>
        ) : (
          <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ No stations assigned to your account. Contact Admin.</span>
        )}
      </section>

      <div className="manager-layout-wrapper">
        {successMsg && (
          <div className="admin-toast-success animate-fade-in">
            <Check className="toast-icon" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* If no site selected / assigned, show warnings */}
        {!selectedSiteId && (
          <div className="manager-card flex-column text-center text-muted" style={{ padding: '3rem' }}>
            <p>Access restricted. You do not have permissions to manage any research stations. Please coordinate with IISER Tirupati Admin.</p>
          </div>
        )}

        {selectedSiteId && (
          <div className="manager-grid-layout" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
            
            {/* Context Adaptive Views based on Project ID */}
            {activeProjectId === 'tst-lantana' ? (
              /* TST RESTORATION VIEW: Visibility Toggles + Coordinates Edit */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="manager-top-cards">
                
                {/* Visibility Settings Panel */}
                <div className="manager-card flex-column">
                  <div className="card-header-bar">
                    <h2>Dashboard Section Visibility</h2>
                    <p>Decide which metrics and sections are public or private for TST Lantana.</p>
                  </div>

                  <div className="visibility-toggles-list">
                    <div className="toggle-row">
                      <div className="toggle-details">
                        <strong>Study Area Map & Locations</strong>
                        <span>Shows coordinates and recorder positions on Leaflet map.</span>
                      </div>
                      <button className="toggle-action-btn" onClick={() => handleToggleVisibility('map')}>
                        {visibilitySettings.map ? (
                          <span className="toggle-badge public"><ToggleRight size={38} className="toggle-icon-on" /> Public</span>
                        ) : (
                          <span className="toggle-badge private"><ToggleLeft size={38} className="toggle-icon-off" /> Private</span>
                        )}
                      </button>
                    </div>

                    <div className="toggle-row">
                      <div className="toggle-details">
                        <strong>Species Richness Overview</strong>
                        <span>Displays aggregate charts and processed files counts.</span>
                      </div>
                      <button className="toggle-action-btn" onClick={() => handleToggleVisibility('richness')}>
                        {visibilitySettings.richness ? (
                          <span className="toggle-badge public"><ToggleRight size={38} className="toggle-icon-on" /> Public</span>
                        ) : (
                          <span className="toggle-badge private"><ToggleLeft size={38} className="toggle-icon-off" /> Private</span>
                        )}
                      </button>
                    </div>

                    <div className="toggle-row">
                      <div className="toggle-details">
                        <strong>Statistical Habitat Comparison</strong>
                        <span>Comparison chart between Cleared and Infested habitats.</span>
                      </div>
                      <button className="toggle-action-btn" onClick={() => handleToggleVisibility('comparison')}>
                        {visibilitySettings.comparison ? (
                          <span className="toggle-badge public"><ToggleRight size={38} className="toggle-icon-on" /> Public</span>
                        ) : (
                          <span className="toggle-badge private"><ToggleLeft size={38} className="toggle-icon-off" /> Private</span>
                        )}
                      </button>
                    </div>

                    <div className="toggle-row">
                      <div className="toggle-details">
                        <strong>Detection Heatmap Grid</strong>
                        <span>Renders species detection grid by active recorder sites.</span>
                      </div>
                      <button className="toggle-action-btn" onClick={() => handleToggleVisibility('heatmap')}>
                        {visibilitySettings.heatmap ? (
                          <span className="toggle-badge public"><ToggleRight size={38} className="toggle-icon-on" /> Public</span>
                        ) : (
                          <span className="toggle-badge private"><ToggleLeft size={38} className="toggle-icon-off" /> Private</span>
                        )}
                      </button>
                    </div>

                    <div className="toggle-row">
                      <div className="toggle-details">
                        <strong>Species Detection Matrix</strong>
                        <span>Table showing per-species call counts across all research sites.</span>
                      </div>
                      <button className="toggle-action-btn" onClick={() => handleToggleVisibility('detectionMatrix')}>
                        {visibilitySettings.detectionMatrix !== false ? (
                          <span className="toggle-badge public"><ToggleRight size={38} className="toggle-icon-on" /> Public</span>
                        ) : (
                          <span className="toggle-badge private"><ToggleLeft size={38} className="toggle-icon-off" /> Private</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info Cards Panel */}
                <div className="manager-card flex-column">
                  <div className="card-header-bar">
                    <h2>Active Corridor Information</h2>
                    <p>Study details for selected recorder corridor.</p>
                  </div>
                  <div className="info-points-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="info-point-card" style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>STATION CODE</span>
                      <p style={{ margin: '0.2rem 0 0 0', fontWeight: 700 }}>{activeSite?.name}</p>
                    </div>
                    <div className="info-point-card" style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>ELEVATION</span>
                      <p style={{ margin: '0.2rem 0 0 0', fontWeight: 700 }}>{activeSite?.elevation}</p>
                    </div>
                    <div className="info-point-card" style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600 }}>CLASSIFIER METHOD</span>
                      <p style={{ margin: '0.2rem 0 0 0', fontWeight: 700 }}>BirdNET v2.4 (Threshold: 0.70)</p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* NILGIRI CLIMATE VIEW: Audio Logging Forms */
              <div className="manager-grid-layout" style={{ margin: 0, padding: 0 }}>
                {/* Audio Log Register Form */}
                <div className="manager-card flex-column">
                  <div className="card-header-bar">
                    <h2>Register Audio Recording Log</h2>
                    <p>Log a new passive acoustic recording file block from the field.</p>
                  </div>

                  <form onSubmit={handleAddAudioLog} className="admin-mini-form">
                    <div className="form-group-sub">
                      <label>Assigned Location / Site</label>
                      <input type="text" value={activeSite?.name || 'Assigned Site'} disabled />
                    </div>
                    <div className="form-group-sub">
                      <label>Recording Date</label>
                      <input 
                        type="date" 
                        value={newLogDate}
                        onChange={(e) => setNewLogDate(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-group-sub">
                      <label>Record Block Duration</label>
                      <select 
                        value={newLogDuration}
                        onChange={(e) => setNewLogDuration(e.target.value)}
                        className="admin-select"
                      >
                        <option value="30 mins">30 minutes (Standard sample)</option>
                        <option value="4 hours">4 hours (Am/Pm block)</option>
                        <option value="12 hours">12 hours (Continuous day block)</option>
                        <option value="24 hours">24 hours (Full day cycle)</option>
                      </select>
                    </div>
                    <div className="form-group-sub">
                      <label>Acoustic File Size (MB / GB)</label>
                      <input 
                        type="text" 
                        value={newLogSize}
                        onChange={(e) => setNewLogSize(e.target.value)}
                        placeholder="e.g. 140 MB or 3.2 GB"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      <CloudUpload size={16} /> Register Audio Log
                    </button>
                  </form>
                </div>

                {/* Audio Logs List */}
                <div className="manager-card flex-column border-left">
                  <div className="card-header-bar">
                    <h2>Audio Logs Status</h2>
                    <p>Passive Acoustic Monitoring logs for this station.</p>
                  </div>

                  <div className="audio-logs-list">
                    {audioLogs.filter(l => l.siteId === selectedSiteId).map((log) => (
                      <div key={log.id} className="audio-log-item">
                        <div className="log-details-left">
                          <Clock className="log-clock-icon" />
                          <div className="log-meta">
                            <strong>Date: {log.date}</strong>
                            <span>Duration: {log.duration} | Size: {log.fileSize}</span>
                          </div>
                        </div>
                        <span className={`log-status-tag ${log.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                    {audioLogs.filter(l => l.siteId === selectedSiteId).length === 0 && (
                      <div className="text-center text-muted pad-top">No audio logs registered for this site yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Editable site coordinates table grid for assigned project sites */}
            <div className="manager-card flex-column">
              <div className="card-header-bar">
                <h2>Project Sites Coordinate Registry</h2>
                <p>Edit metadata and geographic coordinates for active recorders in your assigned corridor.</p>
              </div>

              <div className="sites-table-wrapper">
                <table className="admin-sites-table">
                  <thead>
                    <tr>
                      <th>Site Code</th>
                      <th>Site / Corridor Name</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                      <th>Elevation</th>
                      <th>Expected Logs</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectSites.map((site) => {
                      const isEditing = editingSiteId === site.id;
                      return (
                        <tr key={site.id}>
                          <td><code>{site.id}</code></td>
                          <td>
                            {isEditing ? (
                              <input type="text" value={editSiteName} onChange={(e) => setEditSiteName(e.target.value)} className="inline-table-input" />
                            ) : (
                              <strong>{site.name}</strong>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input type="number" step="0.0001" value={editSiteLat} onChange={(e) => setEditSiteLat(e.target.value !== '' ? Number(e.target.value) : '')} className="inline-table-input width-small" />
                            ) : (
                              site.latitude ?? '-'
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input type="number" step="0.0001" value={editSiteLng} onChange={(e) => setEditSiteLng(e.target.value !== '' ? Number(e.target.value) : '')} className="inline-table-input width-small" />
                            ) : (
                              site.longitude ?? '-'
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input type="text" value={editSiteElev} onChange={(e) => setEditSiteElev(e.target.value)} className="inline-table-input width-small" />
                            ) : (
                              site.elevation
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input type="number" value={editSiteFiles} onChange={(e) => setEditSiteFiles(e.target.value !== '' ? Number(e.target.value) : '')} className="inline-table-input width-small" />
                            ) : (
                              site.expectedFiles ?? '-'
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <select value={editSiteStatus} onChange={(e) => setEditSiteStatus(e.target.value)} className="admin-select select-inline">
                                <option value="Active">Active</option>
                                <option value="Setup Pending">Setup Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Completed">Completed</option>
                              </select>
                            ) : (
                              <span className={`site-status-badge ${site.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                {site.status}
                              </span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <div className="btn-inline-flex">
                                <button className="btn-icon btn-save" onClick={() => handleSaveEditSite(site.id)}>Save</button>
                                <button className="btn-icon btn-cancel" onClick={() => setEditingSiteId(null)}>X</button>
                              </div>
                            ) : (
                              <button className="btn btn-secondary btn-small" onClick={() => handleStartEditSite(site)}>
                                <Edit2 size={12} /> Edit Details
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default ManagerDashboard;

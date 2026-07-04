import React, { useState, useEffect } from 'react';
import { Thermometer, TreePine, Clock } from 'lucide-react';
import CommonDashboard from '../../../home-about/src/dashboard/CommonDashboard';

interface Site {
  id: string;
  projectId: string;
  name: string;
  elevation: string;
  status: string;
}

const NilgiriDashboard: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    const savedSites = localStorage.getItem('sites');
    if (savedSites) {
      const all = JSON.parse(savedSites);
      setSites(all.filter((s: any) => s.projectId === 'nilgiri-project'));
    } else {
      const defaultSites = [
        { id: "site_1", projectId: "nilgiri-project", name: "Coonoor Tea Estate Patch A", elevation: "1,600m", status: "Active" },
        { id: "site_2", projectId: "nilgiri-project", name: "Ooty Reserve Forest Compartment 4", elevation: "2,200m", status: "Active" },
        { id: "a11_01", projectId: "nilgiri-project", name: "Kavita Chandran's Site (D09-01)", elevation: "1,850m", status: "Active" }
      ];
      setSites(defaultSites);
    }
  }, []);

  return (
    <div className="nilgiri-placeholder-page">
      {/* Dashboard Header */}
      <section className="dashboard-header-banner">
        <div className="banner-content">
          <span className="banner-tag">Project Scaffold</span>
          <h1 className="banner-title">The Nilgiri Project</h1>
          <p className="banner-desc">
            Acoustic monitoring across elevation gradients, forest fragments, and tea estates in the Nilgiri hills.
          </p>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="summary-cards mock-kpis">
        <div className="kpi-card">
          <div className="kpi-label">Deployed Stations</div>
          <div className="kpi-value">{sites.length} Sites</div>
          <div className="kpi-subtext">Forest patches & tea estates</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Effort Hours Recorded</div>
          <div className="kpi-value">4,840 Hours</div>
          <div className="kpi-subtext">Continuous audio archive</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Expected Richness</div>
          <div className="kpi-value">142 Species</div>
          <div className="kpi-subtext">Estimated based on history</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Project Status</div>
          <div className="kpi-value" style={{ color: 'var(--color-neutral)' }}>Processing</div>
          <div className="kpi-subtext">Acoustic analysis underway</div>
        </div>
      </section>

      {/* Dashboard Main Grid */}
      <main className="dashboard-grid">
        <div className="dashboard-section placeholder-sec">
          <div className="section-header">
            <div>
              <h2>Research Scope & Framework</h2>
              <p>Understanding avian distributions in changing climates</p>
            </div>
          </div>

          <div className="split-layout">
            <div className="placeholder-info-text">
              <h3 className="scope-title">Objective</h3>
              <p className="scope-text">
                This project focuses on identifying climate refuge zones and analyzing bird species distribution patterns in 
                fragmented landscapes of the Western Ghats. High-elevation areas (above 1,500m) are particularly vulnerable 
                to climate shifts, forcing species to shift their ranges upward. By placing passive acoustic recorders in both 
                tea estate shola fragments and large reserve forests, we study how habitat connectivity and microclimate buffer 
                these climate impacts.
              </p>

              <h3 className="scope-title">Key Research Questions</h3>
              <ul className="scope-list">
                <li>
                  <TreePine className="scope-icon" />
                  <strong>Habitat Context:</strong> Do reserve forests support significantly distinct or more specialized avian communities compared to tea estate shola fragments?
                </li>
                <li>
                  <Thermometer className="scope-icon" />
                  <strong>Climate Sensitivity:</strong> How does temperature and elevation influence the daily vocal activity profiles of endemic and restricted-range birds?
                </li>
                <li>
                  <Clock className="scope-icon" />
                  <strong>Phenology Shifts:</strong> Are breeding vocalizations and dawn chorus times shifting in relation to microclimatic variations?
                </li>
              </ul>
            </div>

            <div className="placeholder-map-area" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="simulated-map" style={{ width: '100%' }}>
                <div className="simulated-map-overlay">
                  <TreePine size={40} className="map-tree-icon" />
                  <h4>Nilgiris Study Area Map</h4>
                  <p>Study boundaries spanning Ooty, Coonoor, and reserve corridors</p>
                  <span className="coordinate-bounds">11.35° N, 76.80° E</span>
                  <div className="map-dots">
                    <span className="dot dot-1" />
                    <span className="dot dot-2" />
                    <span className="dot dot-3" />
                  </div>
                </div>
              </div>

              {/* Dynamic site list displayed inside the sidebar */}
              <div className="registered-sites-list-card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 className="scope-title" style={{ margin: 0 }}>Registered Research Stations ({sites.length})</h3>
                <div className="sites-mini-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {sites.map(s => (
                    <div key={s.id} className="site-mini-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{s.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Elevation: {s.elevation}</span>
                      </div>
                      <span className={`site-status-badge ${s.status.toLowerCase().replace(/\s+/g, '-')}`} style={{ alignSelf: 'center', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-section placeholder-sec">
          <div className="section-header">
            <div>
              <h2>Classifier Progress & Data pipeline</h2>
              <p>Computational progress for Nilgiri bioacoustic recordings</p>
            </div>
          </div>

          <div className="pipeline-grid">
            <div className="pipeline-step done">
              <div className="step-badge">1</div>
              <h4>Acoustic Deployments</h4>
              <p>Completed field recordings in {sites.length} locations over 2 seasons.</p>
              <span className="status-label">100% Complete</span>
            </div>
            
            <div className="pipeline-step active">
              <div className="step-badge">2</div>
              <h4>BirdNET Species Inference</h4>
              <p>Running species detection using customized confidence parameters.</p>
              <span className="status-label">In Progress (70%)</span>
            </div>

            <div className="pipeline-step pending">
              <div className="step-badge">3</div>
              <h4>Ecological Synthesis</h4>
              <p>Applying occupancies, abundance indices, and guild mapping.</p>
              <span className="status-label">Queued</span>
            </div>
          </div>
        </div>

        {/* Dynamic Bioacoustics Dashboard Section */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
          <div className="section-header" style={{ marginBottom: '-1rem' }}>
            <span className="section-pre" style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>Live Bioacoustic Results</span>
            <h2 className="section-main-heading" style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0' }}>Dynamic Analysis & Species Detections</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', margin: 0 }}>Real-time insights compiled from uploaded BirdNET inference logs and selection tables</p>
          </div>
          <CommonDashboard projectId="nilgiri-project" hideHero={true} />
        </div>
      </main>
    </div>
  );
};

export default NilgiriDashboard;

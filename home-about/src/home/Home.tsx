import React, { useState, useEffect } from 'react';
import HomeHero from './HomeHero';
import HowWeWork from './HowWeWork';

interface Project {
  id: string;
  title: string;
  tag: string;
  collaboration: string;
  description: string;
  image: string;
}

const Home: React.FC = () => {
  const [introText, setIntroText] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Load dynamic intro text
    const savedIntro = localStorage.getItem('homeIntroText') || 
      "We use bioacoustics to measure and monitor biodiversity at landscape scales. By combining rigorous field protocols, automated acoustic identification, and statistical modeling, we assess species richness and avian community dynamics. Our service transforms raw acoustic data into interactive dashboards and reports, providing forest departments, conservation NGOs, and research collaborators with the evidence-based insights required to guide ecological restoration and habitat conservation.";
    setIntroText(savedIntro);

    // Load projects list
    const savedProjs = localStorage.getItem('projects');
    if (savedProjs) {
      setProjects(JSON.parse(savedProjs));
    }
  }, []);

  return (
    <div className="home-page">
      <HomeHero />

      {/* Intro Paragraph Section */}
      <section className="intro-section">
        <div className="intro-container">
          <p className="intro-text">{introText}</p>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="projects-section">
        <div className="projects-container">
          <div className="section-title-area">
            <span className="section-pre">Monitoring Portfolio</span>
            <h2 className="section-main-heading">Active Projects</h2>
            <div className="section-title-line" />
          </div>

          <div className="projects-list">
            {projects.map((proj, idx) => {
              const isAlternate = idx % 2 === 1;
              return (
                <div key={proj.id} className={`project-card ${isAlternate ? 'alternate' : ''}`}>
                  <div className="project-content">
                    <span className="project-tag">{proj.tag}</span>
                    <h3 className="project-title">{proj.title}</h3>
                    <p className="collaboration-meta">
                      In collaboration with <strong>{proj.collaboration}</strong>
                    </p>
                    <p className="project-description">{proj.description}</p>
                    
                    <div className="project-actions">
                      <a href={`#/dashboard/${proj.id}`} className="btn btn-primary">
                        View Dashboard
                      </a>
                    </div>
                  </div>
                  <div className="project-visual">
                    <div className="project-image-wrapper">
                      <img src={proj.image} alt={proj.title} className="project-image" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <HowWeWork />
    </div>
  );
};

export default Home;

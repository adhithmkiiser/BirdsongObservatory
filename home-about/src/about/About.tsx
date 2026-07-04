import React, { useState, useEffect } from 'react';

const About: React.FC = () => {
  const [missionHeading, setMissionHeading] = useState('Our Mission');
  const [missionText1, setMissionText1] = useState('');
  const [missionText2, setMissionText2] = useState('');
  const [whyHeading, setWhyHeading] = useState('Why Bioacoustics?');
  const [whyText1, setWhyText1] = useState('');
  const [whyText2, setWhyText2] = useState('');
  
  // Bullets
  const [bullet1, setBullet1] = useState('');
  const [bullet2, setBullet2] = useState('');
  const [bullet3, setBullet3] = useState('');
  const [bullet4, setBullet4] = useState('');

  // Sidebar
  const [sideTitle1, setSideTitle1] = useState('');
  const [sideText1, setSideText1] = useState('');
  const [sideTitle2, setSideTitle2] = useState('');
  const [sideText2, setSideText2] = useState('');
  const [sideImg, setSideImg] = useState('');
  const [sideImgCaption, setSideImgCaption] = useState('');

  useEffect(() => {
    setMissionHeading(localStorage.getItem('aboutMissionHeading') || 'Our Mission');
    
    setMissionText1(localStorage.getItem('aboutMissionText1') || 
      "The Birdsong Observatory is a specialized bioacoustics biodiversity monitoring service based at the Bird Ecology Lab, IISER Tirupati. We bridge the gap between advanced computational ecology and practical, on-the-ground conservation action.");
    
    setMissionText2(localStorage.getItem('aboutMissionText2') || 
      "Rather than treating bioacoustics as a purely academic endeavor, the Observatory operates as an active ecological service. We partner with forest departments, conservation trusts, non-governmental organisations, and land managers to design, deploy, and analyze robust acoustic monitoring networks. Our mission is to provide science-based, quantitative ecological evidence that directly informs forest restoration strategies, habitat management, and policy decisions.");
    
    setWhyHeading(localStorage.getItem('aboutWhyHeading') || 'Why Bioacoustics?');
    
    setWhyText1(localStorage.getItem('aboutWhyText1') || 
      "Traditional biodiversity surveys—such as manual point counts, transects, or mist netting—are labor-intensive, seasonal, and often subject to observer bias. They struggle to scale across large landscapes or capture long-term environmental trends.");
    
    setWhyText2(localStorage.getItem('aboutWhyText2') || 
      "Bioacoustics offers a non-invasive, continuous, and highly scalable alternative:");

    setBullet1(localStorage.getItem('aboutBullet1') || 
      "Standardized Sampling: Recorders capture the entire soundscape, eliminating subjective variations in observer detection and identification.");
    
    setBullet2(localStorage.getItem('aboutBullet2') || 
      "24/7 Presence: Automated schedules record dawn choruses, nocturnal species, and rare vocalizations that manual surveyors might miss.");
    
    setBullet3(localStorage.getItem('aboutBullet3') || 
      "Verifiable Evidence: Sound recordings act as a permanent, auditable ecological record that can be re-analyzed as classifiers improve.");
    
    setBullet4(localStorage.getItem('aboutBullet4') || 
      "Minimal Disturbance: Unlike physical capture methods, passive recording does not alter wildlife behavior or disrupt ecological patterns.");

    setSideTitle1(localStorage.getItem('aboutSideTitle1') || 'Acoustic Monitoring at Scale');
    
    setSideText1(localStorage.getItem('aboutSideText1') || 
      "Passive Acoustic Monitoring (PAM) records the acoustic environment continuously over weeks or months, creating massive audio libraries. We handle the computational complexity of indexing and analyzing these datasets, moving from gigabytes of audio files to precise, actionable species maps.");

    setSideTitle2(localStorage.getItem('aboutSideTitle2') || 'Supporting Conservation Workflows');
    
    setSideText2(localStorage.getItem('aboutSideText2') || 
      "Our services are engineered to fit directly into reporting workflows for environmental stakeholders: Baseline Assessments, Restoration Audits, Guild Indicator Tracking, and Climate Elevation mapping.");

    setSideImg(localStorage.getItem('aboutSideImg') || 
      "https://images.unsplash.com/photo-1480044965905-02098d419e96?auto=format&fit=crop&w=800&q=80");

    setSideImgCaption(localStorage.getItem('aboutSideImgCaption') || 'A vocal songbird perched in forest habitat');
  }, []);

  return (
    <div className="about-page">
      {/* Mini Hero/Header Banner */}
      <section className="about-hero">
        <div className="about-hero-bg" />
        <div className="about-hero-content">
          <span className="about-subtitle">IISER Tirupati Initiative</span>
          <h1 className="about-title">About the Observatory</h1>
          <div className="about-title-line" />
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="about-content-section">
        <div className="about-container">
          <div className="about-grid">
            
            {/* Left side: Mission & Background */}
            <div className="about-main-text">
              <h2 className="about-section-heading">{missionHeading}</h2>
              <p className="about-paragraph">{missionText1}</p>
              <p className="about-paragraph">{missionText2}</p>

              <h2 className="about-section-heading">{whyHeading}</h2>
              <p className="about-paragraph">{whyText1}</p>
              <p className="about-paragraph">{whyText2}</p>
              
              <ul className="about-list">
                {bullet1 && <li>{bullet1}</li>}
                {bullet2 && <li>{bullet2}</li>}
                {bullet3 && <li>{bullet3}</li>}
                {bullet4 && <li>{bullet4}</li>}
              </ul>
            </div>

            {/* Right side: Technology & Impact */}
            <div className="about-sidebar">
              <div className="sidebar-card">
                <h3 className="sidebar-card-title">{sideTitle1}</h3>
                <p className="sidebar-card-text">{sideText1}</p>
              </div>

              <div className="sidebar-card highlight">
                <h3 className="sidebar-card-title">{sideTitle2}</h3>
                <p className="sidebar-card-text">{sideText2}</p>
              </div>

              <div className="sidebar-image-container">
                <img src={sideImg} alt={sideImgCaption} className="sidebar-image" />
                <div className="image-caption">{sideImgCaption}</div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default About;

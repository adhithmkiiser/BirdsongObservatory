import React from 'react';

const FooterLantana: React.FC = () => {
  return (
    <footer className="collab-footer">
      <div className="footer-content">
        <p className="collab-text">
          This project is a collaborative initiative of the <strong>Bird Ecology Lab at IISER Tirupati</strong>, <strong>The Shola Trust</strong>, and the <strong>Tamil Nadu Forest Department</strong>.
        </p>

        <div className="collab-logos">
          {/* Logo 1: IISER Tirupati Bird Lab */}
          <div className="logo-card">
            <img src="/iiser tpt.png" alt="IISER Tirupati Bird Lab Logo" className="collab-logo-img" />
            <span className="logo-label">IISER Tirupati</span>
          </div>

          {/* Logo 2: The Shola Trust */}
          <div className="logo-card">
            <img src="/The_shola_trust.avif" alt="The Shola Trust Logo" className="collab-logo-img" />
            <span className="logo-label">The Shola Trust</span>
          </div>

          {/* Logo 3: The TN Forest dept */}
          <div className="logo-card">
            <img src="/logo-tn.jpg" alt="TN Forest dept Logo" className="collab-logo-img" />
            <span className="logo-label">TN Forest dept</span>
          </div>
        </div>

        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} Bird Ecology Lab, IISER Tirupati. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default FooterLantana;

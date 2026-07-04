import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="collab-footer">
      <div className="footer-content">
        <p className="collab-text">
          The Birdsong Observatory is a service initiative of the <strong>Bird Ecology Lab at IISER Tirupati</strong>.
        </p>

        <div className="collab-logos">
          {/* Logo: IISER Tirupati Bird Lab */}
          <div className="logo-card">
            <img src="/iiser tpt.png" alt="IISER Tirupati Bird Lab Logo" className="collab-logo-img" />
            <span className="logo-label">IISER Tirupati</span>
          </div>
        </div>

        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} Bird Ecology Lab, IISER Tirupati. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

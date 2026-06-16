import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky-header">
      <div className="header-content">
        <img src="/iiser tpt.png" alt="IISER Tirupati Logo" className="header-logo" />
        <h1 className="header-title">Bioacoustics Monitoring in Lantana Invaded Landscapes</h1>
      </div>
    </header>
  );
};

export default Header;

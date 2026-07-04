import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  currentUser?: any;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, currentUser, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isHomeActive = currentView === 'home';
  const isAboutActive = currentView === 'about';
  const isDashboardActive = currentView.startsWith('dashboard/');

  return (
    <header className="global-header sticky-header">
      <div className="header-content justify-between">
        {/* Brand/Logo Area */}
        <a href="#/home" className="header-brand-link" onClick={closeMobileMenu}>
          <img src="/Birdlab_logo.jpeg" alt="IISER Tirupati Logo" className="header-logo" />
          <div className="brand-text">
            <span className="brand-main"><span>birdsong</span>observatory</span>
            <span className="brand-sub">IISER TIRUPATI</span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            <li>
              <a href="#/home" className={`nav-item ${isHomeActive ? 'active' : ''}`}>
                Home
              </a>
            </li>
            <li>
              <a href="#/about" className={`nav-item ${isAboutActive ? 'active' : ''}`}>
                About
              </a>
            </li>
            <li>
              <a href="#/home#projects" className={`nav-item ${isDashboardActive ? 'active' : ''}`}>
                Dashboard
              </a>
            </li>
            <li>
              <a href="https://www.skyisland.in/" target="_blank" rel="noopener noreferrer" className="nav-item">
                Bird Lab
              </a>
            </li>

            {/* Auth Link Controls */}
            {currentUser ? (
              <>
                <li>
                  <a 
                    href={currentUser.role === 'admin' ? '#/admin' : '#/manager'} 
                    className={`nav-item highlight-btn ${currentUser.role === 'admin' ? (currentView === 'admin' ? 'active' : '') : (currentView === 'manager' ? 'active' : '')}`}
                  >
                    {currentUser.role === 'admin' ? 'Admin Panel' : 'Manager Panel'}
                  </a>
                </li>
                <li>
                  <button onClick={onLogout} className="header-logout-button">
                    Logout ({currentUser.username})
                  </button>
                </li>
              </>
            ) : (
              <li>
                <a href="#/login" className={`nav-item highlight-btn ${currentView === 'login' ? 'active' : ''}`}>
                  Login
                </a>
              </li>
            )}
          </ul>
        </nav>

        {/* Mobile Hamburger Button */}
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle Menu">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav className="mobile-nav">
          <ul className="mobile-nav-links">
            <li>
              <a href="#/home" className={`mobile-nav-item ${isHomeActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                Home
              </a>
            </li>
            <li>
              <a href="#/about" className={`mobile-nav-item ${isAboutActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                About
              </a>
            </li>
            <li>
              <a href="#/home#projects" className={`mobile-nav-item ${isDashboardActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                Dashboard
              </a>
            </li>
            <li>
              <a href="https://www.skyisland.in/" target="_blank" rel="noopener noreferrer" className="mobile-nav-item" onClick={closeMobileMenu}>
                Bird Lab
              </a>
            </li>

            {/* Mobile Auth Controls */}
            {currentUser ? (
              <>
                <li>
                  <a 
                    href={currentUser.role === 'admin' ? '#/admin' : '#/manager'} 
                    className={`mobile-nav-item ${currentUser.role === 'admin' ? (currentView === 'admin' ? 'active' : '') : (currentView === 'manager' ? 'active' : '')}`}
                    onClick={closeMobileMenu}
                  >
                    {currentUser.role === 'admin' ? 'Admin Panel' : 'Manager Panel'}
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => { closeMobileMenu(); onLogout?.(); }} 
                    className="mobile-nav-logout-btn-action"
                  >
                    Logout ({currentUser.username})
                  </button>
                </li>
              </>
            ) : (
              <li>
                <a 
                  href="#/login" 
                  className={`mobile-nav-item ${currentView === 'login' ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Login
                </a>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default Header;

import React, { useState, useEffect } from 'react';

const HomeHero: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <section className="home-hero">
      {/* Background image layer with real scroll-driven parallax */}
      <div 
        className="hero-bg-layer" 
        style={{ transform: `translate3d(0, ${scrollY * 0.35}px, 0)` }}
      />

      {/* Subtle topographic contour overlay */}
      <div className="hero-contour-overlay" />

      {/* Floating mist/fog layer for depth */}
      <div className="hero-mist-layer" />

      {/* Hero Content */}
      <div className="hero-container">
        <div className="hero-text-content">
          <h1 className="hero-main-title">
            <span>birdsong</span>observatory
          </h1>
          <p className="hero-main-subheading">
            Bioacoustic monitoring for biodiversity, conservation, and ecological insight.
          </p>
          <div className="hero-buttons">
            <a href="#projects" className="btn btn-primary">
              Explore Projects
            </a>
            <a href="#/about" className="btn btn-secondary">
              Learn Our Science
            </a>
          </div>
        </div>
      </div>

      {/* Wave bottom decoration */}
      <div className="hero-bottom-wave">
        <svg viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none">
          <path
            d="M0,96 C280,128 560,128 840,96 C1120,64 1280,32 1440,64 L1440,120 L0,120 Z"
            fill="var(--bg-primary)"
          />
        </svg>
      </div>
    </section>
  );
};

export default HomeHero;

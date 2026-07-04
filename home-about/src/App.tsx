import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './home/Home';
import About from './about/About';
import AppLantana from '../../dashboard/tst/codes/AppLantana';
import NilgiriDashboard from '../../dashboard/nilgiri/codes/NilgiriDashboard';
import CommonDashboard from './dashboard/CommonDashboard';
import Login from './admin/Login';
import AdminDashboard from './admin/AdminDashboard';
import ManagerDashboard from './admin/ManagerDashboard';
import dataRaw from '../../dashboard/tst/data/data.json';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeProjectId, setActiveProjectId] = useState<string>('tst-lantana');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Initialize LocalStorage structures on startup
  useEffect(() => {
    // 1. Initialise default projects list if not present
    if (!localStorage.getItem('projects')) {
      const defaultProjects = [
        {
          id: "tst-lantana",
          title: "TST Lantana",
          tag: "Restoration Assessment",
          collaboration: "The Shola Trust, Tamil Nadu Forest Department, and IISER Tirupati",
          description: "This initiative acts as a bioacoustic restoration assessment service evaluating the impact of the invasive shrub Lantana camara and its removal on native bird communities. By comparing bird species richness, activity levels, and indicator guilds between cleared and invaded habitats, the project provides concrete evidence of ecological recovery. Continuous monitoring using passive acoustic recorders is supplemented by seasonal point counts, and raw audio files are classified using the BirdNET computational pipeline.",
          image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80"
        }
      ];
      localStorage.setItem('projects', JSON.stringify(defaultProjects));
    }

    // 2. Initialise default sites with lat, long, and elevation
    const savedSitesStr = localStorage.getItem('sites');
    if (!savedSitesStr) {
      const defaultSites = [
        { id: "atr_01", projectId: "tst-lantana", name: "ATR_01 Recorder Corridor", elevation: "950m", status: "Active", latitude: 11.58, longitude: 76.92 },
        { id: "str_01", projectId: "tst-lantana", name: "STR_01 Recorder Corridor", elevation: "1,050m", status: "Active", latitude: 11.60, longitude: 76.95 },
        { id: "str_02", projectId: "tst-lantana", name: "STR_02 Recorder Corridor", elevation: "1,020m", status: "Active", latitude: 11.59, longitude: 76.94 }
      ];
      localStorage.setItem('sites', JSON.stringify(defaultSites));
    }


    // 3. Initialise default species lists from data.json if not present
    if (!localStorage.getItem('species_list')) {
      localStorage.setItem('species_list', JSON.stringify(dataRaw.species_list));
    }
    if (!localStorage.getItem('species_metadata')) {
      localStorage.setItem('species_metadata', JSON.stringify(dataRaw.species_metadata));
    }

    // 4. Initialise default panel visibility settings if not present
    if (!localStorage.getItem('dashboardVisibility')) {
      const defaultVisibility = {
        map: true,
        richness: true,
        comparison: true,
        heatmap: true,
        search: true,
        indicator: true,
        detectionMatrix: true
      };
      localStorage.setItem('dashboardVisibility', JSON.stringify(defaultVisibility));
    }

    // 5. Initialise user accounts with email, passwords, assigned sites, and temp flags
    if (!localStorage.getItem('userAccounts')) {
      const defaultUsers = [
        { username: 'admin', email: 'admin@iiser.ac.in', password: 'iiser123', role: 'admin', tempPassword: false, assignedSites: [] },
        { username: 'manager_tst', email: 'tst_manager@iiser.ac.in', password: 'tst123', role: 'manager_project', targetProject: 'tst-lantana', tempPassword: false, assignedSites: ['atr_01', 'str_01', 'str_02'] },
        { username: 'manager_nilgiri', email: 'nilgiri_manager@iiser.ac.in', password: 'nilgiri123', role: 'manager_site', targetProject: 'nilgiri-project', tempPassword: false, assignedSites: ['site_1', 'site_2'] }
      ];
      localStorage.setItem('userAccounts', JSON.stringify(defaultUsers));
    }

    // 6. Initialise active user session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      let targetView = 'home';

      if (hash === '' || hash === '#/' || hash === '#/home' || hash.includes('#projects')) {
        targetView = 'home';
      } else if (hash === '#/about') {
        targetView = 'about';
      } else if (hash.startsWith('#/dashboard/')) {
        targetView = 'dashboard';
        const projId = hash.replace('#/dashboard/', '');
        setActiveProjectId(projId);
      } else if (hash === '#/login') {
        targetView = 'login';
      } else if (hash === '#/admin') {
        targetView = 'admin';
      } else if (hash === '#/manager') {
        targetView = 'manager';
      }

      // Route protection: admin & manager panels
      const userStr = localStorage.getItem('currentUser');
      const user = userStr ? JSON.parse(userStr) : null;

      if (targetView === 'admin' && (!user || user.role !== 'admin')) {
        window.location.hash = '#/login';
        targetView = 'login';
      } else if (targetView === 'manager' && (!user || (user.role !== 'manager_project' && user.role !== 'manager_site'))) {
        window.location.hash = '#/login';
        targetView = 'login';
      }

      setCurrentView(targetView);
      
      // UX Scroll behavior
      if (hash.includes('#projects')) {
        setTimeout(() => {
          const el = document.getElementById('projects');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      } else {
        window.scrollTo(0, 0);
      }
    };

    // Run once on load
    handleHashChange();

    // Listen to hash change event
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    window.location.hash = '#/home';
  };

  return (
    <div className="app-container">
      {/* Global Header */}
      <Header currentView={currentView} currentUser={currentUser} onLogout={handleLogout} />

      {/* Main Page Area */}
      <div className="main-content-wrapper flex-grow">
        {currentView === 'home' && <Home />}
        {currentView === 'about' && <About />}
        {currentView === 'dashboard' && (
          activeProjectId === 'tst-lantana'
            ? <AppLantana projectId={activeProjectId} />
            : activeProjectId === 'nilgiri-project'
              ? <NilgiriDashboard />
              : <CommonDashboard projectId={activeProjectId} />
        )}
        {currentView === 'login' && <Login onLoginSuccess={handleLoginSuccess} />}
        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'manager' && <ManagerDashboard currentUser={currentUser} />}
      </div>

      {/* Global Footer (shown for all pages except dashboard) */}
      {currentView !== 'dashboard' && <Footer />}
    </div>
  );
};

export default App;

import { Routes, Route, Link, useLocation } from 'react-router';
import './App.css';
import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import AutoplayTabsPage from './pages/AutoplayTabsPage';
import ProSpherePage from './pages/ProSpherePage';

function Navigation() {
  const location = useLocation();

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(8, 8, 8, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '1rem 2rem',
    display: 'flex',
    gap: '2rem',
    alignItems: 'center',
  };

  const linkStyle: React.CSSProperties = {
    color: '#fff',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  };

  const activeLinkStyle: React.CSSProperties = {
    ...linkStyle,
    backgroundColor: 'rgba(20, 110, 245, 0.2)',
    color: '#146EF5',
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={location.pathname === '/' ? activeLinkStyle : linkStyle}>
        Home
      </Link>
      <Link to="/calendar" style={location.pathname === '/calendar' ? activeLinkStyle : linkStyle}>
        Calendar
      </Link>
      <Link
        to="/autoplay-tabs"
        style={location.pathname === '/autoplay-tabs' ? activeLinkStyle : linkStyle}
      >
        Autoplay Tabs
      </Link>
      <Link
        to="/prosphere"
        style={location.pathname === '/prosphere' ? activeLinkStyle : linkStyle}
      >
        ProSphere
      </Link>
    </nav>
  );
}

function App() {
  return (
    <>
      <Navigation />
      <div style={{ paddingTop: '60px' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/autoplay-tabs" element={<AutoplayTabsPage />} />
          <Route path="/prosphere" element={<ProSpherePage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;

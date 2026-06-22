import { Routes, Route, Link, useLocation } from 'react-router';
import './App.css';
import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import AutoplayTabsPage from './pages/AutoplayTabsPage';
import ProSpherePage from './pages/ProSpherePage';
import ConcentricShapePage from './pages/ConcentricShapePage';
import CalendarCMSFromFlatlist from './components/CalendarCMS/CalendarCMSFromFlatlist';
import TimeSlotsAndRegistration from './components/TimeSlotsAndRegistration/TimeSlotsAndRegistration';

const flatlistCalendarSessions = [
  {
    name: 'SEO & AEO',
    slug: 'seo-aeo',
    datetimes: [
      '2026-05-18T14:00:00-04:00',
      '2026-06-04T10:00:00-04:00',
      '2026-06-23T14:00:00-04:00',
      '2026-07-01T10:00:00-04:00',
      '2026-07-08T14:00:00-04:00',
    ],
  },
  {
    name: 'Analyze & Optimize',
    slug: 'analyze-optimize',
    datetimes: [
      '2026-05-21T10:00:00-04:00',
      '2026-06-16T14:00:00-04:00',
      '2026-06-25T10:00:00-04:00',
    ],
  },
  {
    name: 'Build & style',
    slug: 'build-style-your-site',
    datetimes: ['2026-06-09T14:00:00-04:00', '2026-06-18T10:00:00-04:00'],
  },
  {
    name: 'The Webflow CMS',
    slug: 'the-webflow-cms',
    datetimes: [
      '2026-05-19T10:00:00-04:00',
      '2026-06-04T14:00:00-04:00',
      '2026-06-09T10:00:00-04:00',
      '2026-06-18T14:00:00-04:00',
      '2026-06-23T10:00:00-04:00',
    ],
  },
  {
    name: 'Build flexible components',
    slug: 'build-flexible-components',
    datetimes: [
      '2026-05-28T14:00:00-04:00',
      '2026-06-10T14:00:00-04:00',
      '2026-06-24T10:00:00-04:00',
    ],
  },
  {
    name: 'Design systems',
    slug: 'design-systems',
    datetimes: [
      '2026-06-02T14:00:00-04:00',
      '2026-06-11T10:00:00-04:00',
      '2026-06-30T14:00:00-04:00',
    ],
  },
  {
    name: 'Enterprise collaboration',
    slug: 'enterprise-collaboration',
    datetimes: [
      '2026-05-20T14:00:00-04:00',
      '2026-06-02T10:00:00-04:00',
      '2026-06-11T14:00:00-04:00',
      '2026-06-16T10:00:00-04:00',
      '2026-06-25T14:00:00-04:00',
      '2026-06-30T10:00:00-04:00',
    ],
  },
];

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
        to="/calendar-flatlist"
        style={location.pathname === '/calendar-flatlist' ? activeLinkStyle : linkStyle}
      >
        Calendar Flatlist
      </Link>
      <Link
        to="/time-slots"
        style={location.pathname === '/time-slots' ? activeLinkStyle : linkStyle}
      >
        Time Slots
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
      <Link
        to="/concentric-shape"
        style={location.pathname === '/concentric-shape' ? activeLinkStyle : linkStyle}
      >
        ConcentricShape
      </Link>
    </nav>
  );
}

function CalendarFlatlistExample() {
  return (
    <div style={{ padding: '2rem' }}>
      <CalendarCMSFromFlatlist
        daysLimit={90}
        showLegend
        cmsCollectionComponentSlot={
          <div slot="cmsCollectionComponentSlot">
            <div className="w-dyn-list">
              <div role="list" className="w-dyn-items">
                {flatlistCalendarSessions.map((session) => (
                  <div
                    key={session.slug}
                    className="w-dyn-item"
                    data-datetime-flatlist={session.datetimes.join(', ')}
                    data-duration="60"
                    data-name={session.name}
                    data-slug={session.slug}
                    data-type="Live Training"
                    role="listitem"
                  />
                ))}
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}

function TimeSlotsExample() {
  return (
    <div style={{ maxWidth: '720px', padding: '2rem' }}>
      <TimeSlotsAndRegistration
        dateTimeFlatlist={[
          '2026-05-20T14:00:00-04:00',
          '2026-06-02T10:00:00-04:00',
          '2026-06-11T14:00:00-04:00',
          '2026-06-16T10:00:00-04:00',
          '2026-06-25T14:00:00-04:00',
          '2026-06-30T10:00:00-04:00',
        ].join(', ')}
        duration={60}
        buttonLinkText="Register now ->"
        buttonLinkUrl="https://webflow.zoom.us/meeting/register/example"
      />
    </div>
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
          <Route path="/calendar-flatlist" element={<CalendarFlatlistExample />} />
          <Route path="/time-slots" element={<TimeSlotsExample />} />
          <Route path="/autoplay-tabs" element={<AutoplayTabsPage />} />
          <Route path="/prosphere" element={<ProSpherePage />} />
          <Route path="/concentric-shape" element={<ConcentricShapePage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;

import { Leva } from 'leva';
import { Routes, Route, Link, useLocation } from 'react-router';
import './App.css';
import HomePage from './pages/HomePage';
import CalendarPage from './pages/CalendarPage';
import AutoplayTabsPage from './pages/AutoplayTabsPage';
import ProSpherePage from './pages/ProSpherePage';
import ConcentricShapePage from './pages/ConcentricShapePage';
import StampSVGPage from './pages/StampSVGPage';
import StampSVGBatchExportPage from './pages/StampSVGBatchExportPage';
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

export const NAV_WIDTH = 140;

function Navigation() {
  const location = useLocation();

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: `${NAV_WIDTH}px`,
    zIndex: 1000,
    backgroundColor: 'rgba(8, 8, 8, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '0.75rem 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    overflowY: 'auto',
  };

  const linkStyle: React.CSSProperties = {
    color: '#fff',
    textDecoration: 'none',
    padding: '0.4rem 0.55rem',
    borderRadius: '4px',
    fontSize: '0.78rem',
    lineHeight: 1.2,
    transition: 'background-color 0.2s',
  };

  const activeLinkStyle: React.CSSProperties = {
    ...linkStyle,
    backgroundColor: 'rgba(20, 110, 245, 0.2)',
    color: '#146EF5',
  };

  const links: Array<{ to: string; label: string }> = [
    { to: '/', label: 'Home' },
    { to: '/calendar', label: 'Calendar' },
    { to: '/calendar-flatlist', label: 'Calendar Flatlist' },
    { to: '/time-slots', label: 'Time Slots' },
    { to: '/autoplay-tabs', label: 'Autoplay Tabs' },
    { to: '/prosphere', label: 'ProSphere' },
    { to: '/concentric-shape', label: 'ConcentricShape' },
    { to: '/stamp-svg', label: 'StampSVG' },
  ];

  return (
    <nav style={navStyle}>
      {links.map(({ to, label }) => (
        <Link key={to} to={to} style={location.pathname === to ? activeLinkStyle : linkStyle}>
          {label}
        </Link>
      ))}
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
      <Leva theme={{ sizes: { rootWidth: '420px' } }} />
      <Navigation />
      <div style={{ paddingLeft: `${NAV_WIDTH}px` }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/calendar-flatlist" element={<CalendarFlatlistExample />} />
          <Route path="/time-slots" element={<TimeSlotsExample />} />
          <Route path="/autoplay-tabs" element={<AutoplayTabsPage />} />
          <Route path="/prosphere" element={<ProSpherePage />} />
          <Route path="/concentric-shape" element={<ConcentricShapePage />} />
          <Route path="/stamp-svg" element={<StampSVGPage />} />
          <Route path="/stamp-svg-batch-export" element={<StampSVGBatchExportPage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;

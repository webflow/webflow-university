import { Link } from 'react-router';

function HomePage() {

  const containerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '3rem',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '1rem',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: '1.6',
    marginBottom: '2rem',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '4rem',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '1.5rem',
  };

  const linksGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '1.5rem',
    transition: 'all 0.2s',
  };

  const linkStyle: React.CSSProperties = {
    color: '#146EF5',
    textDecoration: 'none',
    fontSize: '1.125rem',
    fontWeight: '600',
    display: 'block',
    marginBottom: '0.5rem',
  };

  const cardDescriptionStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.9rem',
    lineHeight: '1.5',
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Webflow University Components</h1>
        <p style={descriptionStyle}>
          A collection of React components built for Webflow University. These components are designed
          to be imported into Webflow using the Webflow CLI, providing interactive and dynamic UI
          elements for the university website.
        </p>
      </header>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Components</h2>
        <div style={linksGridStyle}>
          <div style={cardStyle}>
            <Link to="/calendar" style={linkStyle}>
              Calendar CMS →
            </Link>
            <p style={cardDescriptionStyle}>
              A dynamic calendar component that integrates with Webflow CMS collections to display
              scheduled training sessions, workshops, and events with support for recurring dates
              and blackout dates.
            </p>
          </div>

          <div style={cardStyle}>
            <Link to="/autoplay-tabs" style={linkStyle}>
              Autoplay Tabs →
            </Link>
            <p style={cardDescriptionStyle}>
              An interactive tab component with autoplay functionality, perfect for showcasing
              different learning formats like live training, workshops, and on-demand content.
            </p>
          </div>

          <div style={cardStyle}>
            <Link to="/prosphere" style={linkStyle}>
              ProSphere →
            </Link>
            <p style={cardDescriptionStyle}>
              A stunning 3D animated sphere built with Three.js, featuring neon glow effects,
              cursor interaction, and customizable visual parameters. Perfect for hero sections
              and visual showcases.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;


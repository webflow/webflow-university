import { useState } from 'react';
import ThemeIcon from '../components/ThemeIcon/ThemeIcon';
import ThemeIconPreview from '../components/ThemeIconPreview/ThemeIconPreview';
import { DEFAULT_FIGMA_SVG } from '../components/ThemeIcon/themeSvgTokens';
import './ThemeIconPage.css';

function ThemeIconPage() {
  const [svgCode, setSvgCode] = useState(DEFAULT_FIGMA_SVG);

  return (
    <div className="theme-icon-page">
      <header className="theme-icon-page__header">
        <p className="theme-icon-page__eyebrow">Media</p>
        <h1 className="theme-icon-page__title">Theme Icon</h1>
        <p className="theme-icon-page__lede">
          Paste SVG copied from Figma. Hard-coded colors become WFU theme CSS variables so icons
          follow light/dark theme tokens on the site.
        </p>
      </header>

      <label className="theme-icon-page__label" htmlFor="theme-icon-page-input">
        Figma SVG input
      </label>
      <textarea
        id="theme-icon-page-input"
        className="theme-icon-page__input"
        value={svgCode}
        onChange={(event) => setSvgCode(event.target.value)}
        rows={10}
        spellCheck={false}
      />

      <section className="theme-icon-page__section">
        <h2 className="theme-icon-page__section-title">1. Theme Icon (render only)</h2>
        <div className="theme-icon-page__stage">
          <ThemeIcon svgCode={svgCode} label="Org chart" width="48px" />
        </div>
      </section>

      <section className="theme-icon-page__section">
        <h2 className="theme-icon-page__section-title">2. Theme Icon Preview (render + copyable code)</h2>
        <ThemeIconPreview svgCode={svgCode} showTokenMap />
      </section>
    </div>
  );
}

export default ThemeIconPage;

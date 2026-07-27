import ThemeIcon from './ThemeIcon';
import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';
import { DEFAULT_FIGMA_SVG } from './themeSvgTokens';
import './ThemeIcon.css';

const ThemeIconWebflow = declareComponent(ThemeIcon, {
  name: 'Theme Icon',
  description:
    'Paste Figma "Copy as SVG" markup; hard-coded colors are swapped for WFU theme tokens (bg-tertiary, border-primary, icon-primary). Safe to place inside Link blocks.',
  group: 'Media',
  options: {
    applyTagSelectors: true,
  },
  props: {
    svgCode: props.Text({
      name: 'SVG Code',
      defaultValue: DEFAULT_FIGMA_SVG,
      group: 'Content',
      tooltip:
        'Paste SVG markup from Figma (Copy as SVG). Colors map to theme CSS variables. Works inside Link blocks.',
    }),
    useCurrentColor: props.Boolean({
      name: 'Use currentColor for icon',
      defaultValue: false,
      group: 'Content',
      tooltip:
        'Replace icon ink (white / icon-primary) with currentColor so the SVG inherits the parent text color — useful inside links and buttons.',
    }),
    label: props.Text({
      name: 'Accessible Label',
      defaultValue: '',
      group: 'Content',
      tooltip: 'Optional aria-label. Leave empty for decorative icons.',
    }),
    width: props.Text({
      name: 'Width',
      defaultValue: '',
      group: 'Size',
      tooltip: 'Optional CSS width (e.g. 48px or 2rem). Leave empty to use the SVG width.',
    }),
    height: props.Text({
      name: 'Height',
      defaultValue: '',
      group: 'Size',
      tooltip: 'Optional CSS height. Leave empty to keep aspect ratio.',
    }),
  },
});

export default ThemeIconWebflow;

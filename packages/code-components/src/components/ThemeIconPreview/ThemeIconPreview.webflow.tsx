import ThemeIconPreview from './ThemeIconPreview';
import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';
import { DEFAULT_FIGMA_SVG } from '../ThemeIcon/themeSvgTokens';
import './ThemeIconPreview.css';

const ThemeIconPreviewWebflow = declareComponent(ThemeIconPreview, {
  name: 'Theme Icon Preview',
  description:
    'Paste Figma SVG markup to preview the themed icon and copy the SVG source with WFU theme CSS variables applied.',
  group: 'Media',
  options: {
    applyTagSelectors: true,
    ssr: false,
  },
  props: {
    svgCode: props.Text({
      name: 'SVG Code',
      defaultValue: DEFAULT_FIGMA_SVG,
      group: 'Content',
      tooltip:
        'Initial SVG shown in the util. On the published page the fields are editable — paste Figma SVG there to convert.',
    }),
    useCurrentColor: props.Boolean({
      name: 'Use currentColor for icon',
      defaultValue: false,
      group: 'Content',
      tooltip:
        'Initial checkbox state. Maps icon ink to currentColor so it inherits parent text color.',
    }),
    showTokenMap: props.Boolean({
      name: 'Show Token Map',
      defaultValue: true,
      group: 'Display',
      tooltip: 'Show the color → CSS variable reference list under the code.',
    }),
  },
});

export default ThemeIconPreviewWebflow;

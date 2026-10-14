import RetroComputer from './RetroComputer';
import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';

const RetroComputerWebflow = declareComponent(RetroComputer, {
  name: 'RetroComputer',
  description:
    'Low-poly 90s computer on a desk. Click the Enter key to watch it publish, with a little ASCII celebration.',
  group: '3D Graphics',
  options: {
    applyTagSelectors: true,
    ssr: false,
  },
  props: {
    showCords: props.Boolean({
      name: 'Show Cords',
      defaultValue: true,
      group: 'Model',
      tooltip: 'Show the keyboard and mouse cords running to the back of the tower',
    }),
    showDesk: props.Boolean({
      name: 'Show Desk',
      defaultValue: true,
      group: 'Model',
      tooltip: 'Show the desk the computer sits on',
    }),
    backgroundColor: props.Text({
      name: 'Background',
      defaultValue: '#0b0b0c',
      group: 'Scene',
      tooltip: 'Any CSS color. Use "transparent" to show the page background behind the scene.',
    }),
    screenBackground: props.Text({
      name: 'Screen Background',
      defaultValue: '#0a0e16',
      group: 'Screen',
      tooltip: 'Any CSS color for the monitor screen background',
    }),
    screenText: props.Text({
      name: 'Screen Text',
      defaultValue: '#4b8bff',
      group: 'Screen',
      tooltip: 'Any CSS color for the terminal text',
    }),
    enterLink: props.Link({
      name: 'After Publish Link',
      group: 'Interaction',
      tooltip:
        'Optional page to open once the publish animation finishes. Links are not followed in the Designer.',
    }),
  },
});

export default RetroComputerWebflow;

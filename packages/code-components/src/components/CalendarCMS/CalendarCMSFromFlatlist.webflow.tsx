import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';

import CalendarCMSFromFlatlist from './CalendarCMSFromFlatlist';

const CalendarCMSFromFlatlistWebflow = declareComponent(CalendarCMSFromFlatlist, {
  name: 'WFU CMS Calendar From Flatlist',
  description: 'Monthly calendar that plots explicit session dates from data-datetime-flatlist',
  group: 'Content',
  options: {
    applyTagSelectors: true,
  },
  props: {
    cmsCollectionComponentSlot: props.Slot({
      name: 'CMS Collection Component Slot',
      group: 'Content',
      tooltip: 'The slot for the CMS collection component',
    }),
    showCMSCollectionComponent: props.Boolean({
      name: 'Show CMS Collection Component',
      group: 'Visibility',
      tooltip: 'Whether to show the CMS collection component for editing',
      defaultValue: false,
    }),
    showWeekends: props.Boolean({
      name: 'Show Weekends',
      defaultValue: false,
      group: 'Display',
      tooltip: 'Whether to show Saturday and Sunday columns',
    }),
    debugNoData: props.Boolean({
      name: 'Debug: No Data',
      defaultValue: false,
      group: 'Debug',
      tooltip: 'Whether to prevent data loading and show empty calendar',
    }),
    daysLimit: props.Number({
      name: 'Days Limit',
      defaultValue: 100,
      group: 'Display',
      tooltip: 'Number of days from now to show flatlist occurrences up to',
    }),
    showLegend: props.Boolean({
      name: 'Show Legend',
      defaultValue: false,
      group: 'Display',
      tooltip: 'Whether to show the legend',
    }),
  },
});

export default CalendarCMSFromFlatlistWebflow;

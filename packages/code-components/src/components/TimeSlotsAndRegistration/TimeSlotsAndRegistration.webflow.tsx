import { props } from '@webflow/data-types';
import { declareComponent } from '@webflow/react';

import TimeSlotsAndRegistration from './TimeSlotsAndRegistration';

const TimeSlotsAndRegistrationWebflow = declareComponent(TimeSlotsAndRegistration, {
  name: 'Time Slots And Registration',
  description: 'Lists explicit session dates from a datetime flatlist with a registration CTA',
  group: 'Content',
  options: {
    applyTagSelectors: true,
  },
  props: {
    dateTimeFlatlist: props.Text({
      name: 'DateTime Flatlist',
      defaultValue:
        '2026-06-16T10:00:00-04:00, 2026-06-25T14:00:00-04:00, 2026-06-30T10:00:00-04:00',
      group: 'Content',
      tooltip: 'Comma-separated ISO datetimes from data-datetime-flatlist',
    }),
    duration: props.Number({
      name: 'Duration',
      defaultValue: 60,
      group: 'Content',
      tooltip: 'Session duration in minutes',
    }),
    buttonLinkUrl: props.Text({
      name: 'Button Link URL',
      defaultValue: '#',
      group: 'Registration',
      tooltip: 'URL for the Register button',
    }),
    buttonLinkText: props.Text({
      name: 'Button Link Text',
      defaultValue: 'Register now ->',
      group: 'Registration',
    }),
    showInLocalTimezone: props.Boolean({
      name: 'Show In Local Timezone',
      defaultValue: true,
      group: 'Display',
      tooltip: 'When enabled, converts ET datetimes to the visitor timezone',
    }),
  },
});

export default TimeSlotsAndRegistrationWebflow;

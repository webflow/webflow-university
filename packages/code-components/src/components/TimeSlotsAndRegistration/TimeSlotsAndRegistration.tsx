import { DateTime } from 'luxon';
import './TimeSlotsAndRegistration.css';

const DEFAULT_EVENT_TIMEZONE = 'America/New_York';
const DEFAULT_DURATION_MINUTES = 60;
const DEFAULT_BUTTON_TEXT = 'Register now ->';

interface TimeSlotsAndRegistrationProps {
  dateTimeFlatlist?: string;
  duration?: number;
  buttonLinkUrl?: string;
  buttonLinkText?: string;
  registrationUrl?: string;
  title?: string;
  buttonText?: string;
  eventTimezone?: string;
  showInLocalTimezone?: boolean;
}

interface TimeSlot {
  start: DateTime;
  end: DateTime;
}

function parseDateTimeFlatlist(dateTimeFlatlist = '', eventTimezone: string): DateTime[] {
  return dateTimeFlatlist
    .split(',')
    .map((dateString) => dateString.trim())
    .filter(Boolean)
    .map((dateString) => {
      const date = DateTime.fromISO(dateString, { setZone: true });

      if (!date.isValid) {
        return null;
      }

      return date.setZone(eventTimezone);
    })
    .filter((date): date is DateTime => date !== null)
    .sort((a, b) => a.toMillis() - b.toMillis());
}

function formatTimeRange(slot: TimeSlot): string {
  const start = slot.start.toFormat(slot.start.minute === 0 ? 'h a' : 'h:mm a').replace(' ', '');
  const end = slot.end.toFormat(slot.end.minute === 0 ? 'h a' : 'h:mm a').replace(' ', '');
  const timezone = slot.start.toFormat('ZZZZ');

  return `${start} - ${end} ${timezone}`;
}

const TimeSlotsAndRegistration = ({
  dateTimeFlatlist = '',
  duration = DEFAULT_DURATION_MINUTES,
  buttonLinkUrl,
  buttonLinkText,
  registrationUrl = '#',
  buttonText = DEFAULT_BUTTON_TEXT,
  eventTimezone = DEFAULT_EVENT_TIMEZONE,
  showInLocalTimezone = true,
}: TimeSlotsAndRegistrationProps) => {
  const safeDuration =
    Number.isFinite(duration) && duration > 0 ? duration : DEFAULT_DURATION_MINUTES;
  const ctaUrl = buttonLinkUrl || registrationUrl;
  const ctaText = buttonLinkText || buttonText;
  const displayTimezone =
    showInLocalTimezone && typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : eventTimezone;
  const now = DateTime.now();

  const slots = parseDateTimeFlatlist(dateTimeFlatlist, eventTimezone)
    .filter((date) => date > now)
    .map((date) => {
      const start = date.setZone(displayTimezone);
      return {
        start,
        end: start.plus({ minutes: safeDuration }),
      };
    });

  return (
    <aside className="time-slots-and-registration">
      <div className="time-slots-and-registration__card">
        <ul
          data-datetimes="flatlist"
          role="list"
          className="time-slots-and-registration__list"
        >
          {slots.map((slot) => (
            <li key={slot.start.toISO()} className="time-slots-and-registration__item">
              <div className="time-slots-and-registration__day">
                {slot.start.toFormat('ccc')}
              </div>
              <div className="time-slots-and-registration__date">
                {slot.start.toFormat('MMM d')}
              </div>
              <div className="time-slots-and-registration__dots"></div>
              <div className="time-slots-and-registration__time">{formatTimeRange(slot)}</div>
            </li>
          ))}
        </ul>
        {slots.length === 0 && (
          <div className="time-slots-and-registration__empty">
            <div>No upcoming sessions</div>
          </div>
        )}
        <a href={ctaUrl} className="time-slots-and-registration__button">
          <span>{ctaText}</span>
        </a>
      </div>
    </aside>
  );
};

export default TimeSlotsAndRegistration;

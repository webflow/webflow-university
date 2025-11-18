import CalendarCMS from '../components/CalendarCMS/Calendar';

function CalendarPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <CalendarCMS
        cmsCollectionComponentSlot={
          <div slot="cmsCollectionComponentSlot">
            <div className="w-dyn-list">
              <div role="list" className="w-dyn-items">
                <div
                  className="w-dyn-item"
                  data-start-1="2025-12-16 15:00"
                  data-start-2="2025-12-11 11:00"
                  data-name="Build &amp; style your site"
                  data-slug="build-style-your-site"
                  data-blackout-date-string="12/18/2025, 12/23/2025, 12/25/2025, 12/30/2025, 01/01/2026, 01/08/2026, 01/13/2026, 01/22/2026, 01/27/2026"
                  role="listitem"
                  data-duration-1="60"
                  data-duration-2="60"
                  data-end-1="2026-01-21"
                  data-frequency-1="weekly"
                  data-type="Live Training"
                  data-end-2="2026-01-30"
                  data-frequency-2="weekly"
                ></div>
                <div
                  className="w-dyn-item"
                  data-start-1="2025-12-16 11:00"
                  data-start-2="2025-12-11 15:00"
                  data-name="The Webflow CMS"
                  data-slug="the-webflow-cms"
                  data-blackout-date-string="12/18/2025, 12/23/2025, 12/25/2025, 12/30/2025, 01/01/2026, 01/08/2026, 01/13/2026, 01/22/2026, 01/27/2026"
                  role="listitem"
                  data-duration-1="60"
                  data-duration-2="60"
                  data-end-1="2026-01-21"
                  data-frequency-1="weekly"
                  data-type="Live Training"
                  data-end-2="2026-01-30"
                  data-frequency-2="weekly"
                ></div>
                <div
                  className="w-dyn-item"
                  data-start-1="2025-12-17 11:00"
                  data-start-2="2026-01-07 15:00"
                  data-name="Build flexible components"
                  data-slug="build-flexible-components"
                  data-blackout-date-string="12/24/2025, 12/31/2025, 1/14/2026, 1/28/2026"
                  role="listitem"
                  data-duration-1="60"
                  data-duration-2="60"
                  data-end-1="2026-01-03"
                  data-frequency-1="monthly"
                  data-type="Workshop"
                  data-end-2="2026-01-08"
                  data-frequency-2="monthly"
                ></div>
                <div
                  className="w-dyn-item"
                  data-start-1="2025-12-09 15:00"
                  data-start-2="2025-12-18 11:00"
                  data-name="Design systems"
                  data-slug="design-systems"
                  data-blackout-date-string="12/16/2025, 12/23/2025, 12/25/2025, 12/30/2025, 01/01/2026, 01/06/2026, 01/15/2026, 01/20/2026, 01/29/2026"
                  role="listitem"
                  data-duration-1="60"
                  data-duration-2="60"
                  data-end-1="2026-01-28"
                  data-frequency-1="weekly"
                  data-type="Live Training"
                  data-end-2="2026-01-23"
                  data-frequency-2="weekly"
                ></div>
                <div
                  className="w-dyn-item"
                  data-start-1="2025-12-09 11:00"
                  data-start-2="2025-12-18 15:00"
                  data-name="Enterprise collaboration"
                  data-slug="enterprise-collaboration"
                  data-blackout-date-string="12/16/2025, 12/23/2025, 12/30/2025, 1/6/2026, 1/20/2026, 12/25/2025, 1/1/2026, 1/15/2026, 1/29/2026"
                  role="listitem"
                  data-duration-1="60"
                  data-duration-2="60"
                  data-end-1="2026-01-28"
                  data-frequency-1="weekly"
                  data-type="Live Training"
                  data-end-2="2026-01-23"
                  data-frequency-2="weekly"
                ></div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}

export default CalendarPage;


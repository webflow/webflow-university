import './App.css';
// import { useControls } from 'leva';
// import ProSphere from './components/ProSphere/ProSphere';
// import UnrealBloomExample from './components/UnrealBloomExample/UnrealBloomExample';
import AutoplayTabs from './components/AutoplayTabs/AutoplayTabs';
// import CalendarCMS from './components/CalendarCMS/Calendar';
// import Calendar from "./components/Calendar/Calendar";

function App() {
  // Bloom controls
  // const bloomControls = useControls('Bloom', {
  //   bloomIntensity: { value: 3.5, min: 0, max: 10, step: 0.1 },
  //   bloomThreshold: { value: 0.0, min: 0, max: 1, step: 0.05 },
  //   bloomSmoothing: { value: 0.3, min: 0, max: 1, step: 0.05 },
  //   bloomRadius: { value: 0.8, min: 0, max: 1, step: 0.05 },
  // });

  // // Vignette controls
  // const vignetteControls = useControls('Vignette', {
  //   vignetteOffset: { value: 0.75, min: 0, max: 1, step: 0.05 },
  //   vignetteDarkness: { value: 0.75, min: 0, max: 1, step: 0.05 },
  // });

  // // Sphere controls
  // const sphereControls = useControls('Sphere', {
  //   scale: { value: 3, min: 1, max: 10, step: 0.1 },
  //   horizontalStretch: { value: 1.2, min: 0.5, max: 3, step: 0.1 },
  //   meridianCount: { value: 16, min: 4, max: 64, step: 1 },
  //   verticalOffset: { value: -2, min: -10, max: 10, step: 0.5 },
  //   rotationSpeed: { value: 0.1, min: 0, max: 2, step: 0.05 },
  // });

  // // Material controls
  // const materialControls = useControls('Material', {
  //   glowIntensity: { value: 4.0, min: 0, max: 20, step: 0.5 },
  //   coreIntensity: { value: 8.0, min: 0, max: 20, step: 0.5 },
  //   focusHeight: { value: 4.0, min: -5, max: 10, step: 0.5 },
  // });

  // // Fog controls
  // const fogControls = useControls('Fog', {
  //   fogNear: { value: 5.0, min: 0, max: 20, step: 0.5, label: 'Fog Near' },
  //   fogFar: { value: 19.5, min: 5, max: 30, step: 0.5, label: 'Fog Far' },
  //   fogDensity: { value: 3.0, min: 0.1, max: 5, step: 0.1, label: 'Fog Density' },
  // });

  // // Cursor Spotlight controls
  // const spotlightControls = useControls('Cursor Spotlight', {
  //   spotlightRadius: { value: 2.0, min: 0.5, max: 5, step: 0.1, label: 'Radius' },
  //   spotlightIntensity: { value: 3.0, min: 0, max: 10, step: 0.5, label: 'Intensity' },
  //   iridescenceStrength: { value: 0.5, min: 0, max: 1, step: 0.05, label: 'Iridescence' },
  //   spotlightDepth: { value: 0.0, min: -10, max: 10, step: 0.5, label: 'Depth Offset' },
  // });

  return (
    <>
      {/* <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
        <ProSphere
          {...sphereControls}
          {...materialControls}
          {...fogControls}
          {...spotlightControls}
          {...bloomControls}
          {...vignetteControls}
        />
      </div> */}
      <AutoplayTabs
        autoplay={true}
        autoplayDuration={5000}
        tabOneLabel="LEARN IN REAL TIME"
        tabOneTitle="Live training"
        tabOneDescription="Learn directly from the Webflow team in live classroom sessions, with the ability to ask questions on the material along the way."
        tabTwoLabel="PUT IT INTO PRACTICE"
        tabTwoTitle="Workshops"
        tabTwoDescription="Hands-on, collaborative sessions that tackle real challenges and strategic solutions in a guided setting."
        tabThreeLabel="LEARN ON YOUR OWN TIME"
        tabThreeTitle="On-demand library"
        tabThreeDescription="Need a primer or refresher? You'll still have full access to our Webflow University self-paced courses — available anytime, anywhere."
      />
      {/* <CalendarCMS
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
      /> */}
    </>
  );
}

export default App;

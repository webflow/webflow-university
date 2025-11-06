import './App.css';
import AutoplayTabs from './components/AutoplayTabs/AutoplayTabs';
// import Calendar from "./components/Calendar/Calendar";

function App() {
  return (
    <>
      {/* <Calendar /> */}
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
    </>
  );
}

export default App;

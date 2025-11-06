import { useState, useEffect, useRef } from 'react';
import './AutoplayTabs.css';

interface TabContent {
  id: string;
  label: string;
  title: string;
  description: string;
  content: Image;
}

interface Image {
  src: string;
  alt: string;
}

interface AutoplayTabsProps {
  autoplay?: boolean;
  autoplayDuration?: number;
  tabOneLabel?: string;
  tabOneTitle?: string;
  tabOneDescription?: string;
  tabOneContent?: Image;
  tabTwoLabel?: string;
  tabTwoTitle?: string;
  tabTwoDescription?: string;
  tabTwoContent?: Image;
  tabThreeLabel?: string;
  tabThreeTitle?: string;
  tabThreeDescription?: string;
  tabThreeContent?: Image;
}

const AutoplayTabs = ({
  autoplay = false,
  autoplayDuration = 5000,
  tabOneLabel = 'Tab 1',
  tabOneTitle = 'Tab 1 Title',
  tabOneDescription = 'Tab 1 Description',
  tabOneContent = {
    src: 'https://placehold.co/800x450/blue/white',
    alt: 'Tab 1 Content',
  },
  tabTwoLabel = 'Tab 2',
  tabTwoTitle = 'Tab 2 Title',
  tabTwoDescription = 'Tab 2 Description',
  tabTwoContent = {
    src: 'https://placehold.co/800x450/orange/white',
    alt: 'Tab 2 Content',
  },
  tabThreeLabel = 'Tab 3',
  tabThreeTitle = 'Tab 3 Title',
  tabThreeDescription = 'Tab 3 Description',
  tabThreeContent = {
    src: 'https://placehold.co/800x450/green/white',
    alt: 'Tab 3 Content',
  },
}: AutoplayTabsProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const tabs: TabContent[] = [
    {
      id: 'tab1',
      label: tabOneLabel,
      title: tabOneTitle,
      description: tabOneDescription,
      content: tabOneContent,
    },
    {
      id: 'tab2',
      label: tabTwoLabel,
      title: tabTwoTitle,
      description: tabTwoDescription,
      content: tabTwoContent,
    },
    {
      id: 'tab3',
      label: tabThreeLabel,
      title: tabThreeTitle,
      description: tabThreeDescription,
      content: tabThreeContent,
    },
  ];

  // Autoplay logic
  useEffect(() => {
    if (!autoplay) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = window.setTimeout(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, autoplayDuration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activeTab, autoplay, autoplayDuration, tabs.length]);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    // The useEffect will automatically restart the timer when activeTab changes
  };

  return (
    <div className="autoplay-tabs">
      {/* Desktop View - Tabs Interface */}
      <div className="tabs-interface">
        {/* Main Display Pane */}
        <div className="display-pane">
          {tabs.map((tab, index) => (
            <div key={tab.id} className={`display-content ${activeTab === index ? 'active' : ''}`}>
              <img className="display-image" src={tab.content.src} alt={tab.content.alt} />
            </div>
          ))}
        </div>

        {/* Tab Buttons */}
        <div className="tabs-container">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === index ? 'active' : ''}`}
              onClick={() => handleTabClick(index)}
            >
              <div className="tab-content-wrapper">
                <span className="tab-label">{tab.label}</span>
                {/* Progress bar */}
                <div className="progress-bar-container">
                  <div
                    className={`progress-bar ${activeTab === index && autoplay ? 'active' : ''}`}
                    style={
                      activeTab === index && autoplay
                        ? { animationDuration: `${autoplayDuration}ms` }
                        : undefined
                    }
                  />
                </div>
                <h3 className="tab-title">{tab.title}</h3>
                <p className="tab-description">{tab.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile View - Stacked Sections */}
      <div className="mobile-sections">
        {tabs.map((tab) => (
          <div key={tab.id} className="mobile-section">
            <img className="mobile-image" src={tab.content.src} alt={tab.content.alt} />
            <div className="mobile-info">
              <span className="tab-label">{tab.label}</span>
              <h3 className="tab-title">{tab.title}</h3>
              <p className="tab-description">{tab.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutoplayTabs;

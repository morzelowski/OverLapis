import { useAppStore } from '../../stores/appStore';
import './Tabs.css';

export default function TabBar() {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useAppStore();

  if (openTabs.length === 0) return <div className="tab-bar" />;

  return (
    <div className="tab-bar">
      {openTabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="tab-name">{tab.name}</span>
          <button
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

import { useState } from 'react'

// { name: 'Name', content: <div>Content</div> }
function Tabs({ tabs }) {
  const [tab, setTab] = useState(0);

  return (
    <div className="tabs">
      <div className="tab-head">
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} className={tab === i ? '' : 'secondary'}>{t.name}</button>
        ))}
      </div>
      <div className="tab-content">
        {tabs[tab].content}
      </div>
    </div>
  )
}

export default Tabs

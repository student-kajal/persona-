import React from 'react';

export default function Tabs({ tabs, current, onChange }) {
  return (
    <div className="flex gap-4 mb-4 border-b border-gray-300">
      {tabs.map(tab => (
        <button
          key={tab}
          className={`py-2 px-4 border-b-2 ${
            current === tab ? 'border-blue-500 text-blue-600 font-bold' : 'border-transparent'
          }`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

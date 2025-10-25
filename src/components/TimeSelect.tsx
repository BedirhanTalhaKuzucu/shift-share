import React, { useState, useRef, useEffect } from 'react';

interface TimeSelectProps {
  value: string;
  onChange: (time: string) => void;
  required?: boolean;
}

export function TimeSelect({ value, onChange, required }: TimeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Generate time options with 15, 30, 45, 00 minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of ['00', '15', '30', '45']) {
        const timeStr = `${String(hour).padStart(2, '0')}:${minute}`;
        options.push(timeStr);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to selected option when dropdown opens
  useEffect(() => {
    if (isOpen && optionsRef.current) {
      const selectedOption = optionsRef.current.querySelector('[data-selected="true"]');
      if (selectedOption) {
        selectedOption.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="input text-sm w-full text-left flex items-center justify-between"
      >
        <span>{value}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div
          ref={optionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          {timeOptions.map((time) => (
            <button
              key={time}
              type="button"
              data-selected={time === value}
              onClick={() => {
                onChange(time);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 ${
                time === value ? 'bg-indigo-100 text-indigo-600 font-medium' : ''
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

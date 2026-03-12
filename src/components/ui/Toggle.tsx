'use client';

import { useState } from 'react';

interface ToggleProps {
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function Toggle({ defaultChecked = false, onChange }: ToggleProps) {
  const [on, setOn] = useState(defaultChecked);

  const handleClick = () => {
    const next = !on;
    setOn(next);
    onChange?.(next);
  };

  return (
    <div
      className={`toggle ${on ? 'on' : ''}`}
      onClick={handleClick}
      role="switch"
      aria-checked={on}
    />
  );
}

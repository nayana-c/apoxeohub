'use client';

import { useState } from 'react';

interface ToggleProps {
  /** Uncontrolled: sets the initial state only */
  defaultChecked?: boolean;
  /** Controlled: drives the visual state from outside */
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({
  defaultChecked = false,
  checked,
  onChange,
  disabled = false,
}: ToggleProps) {
  const [internalOn, setInternalOn] = useState(defaultChecked);

  // When `checked` is provided the component is controlled; otherwise it manages its own state.
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internalOn;

  const handleClick = () => {
    if (disabled) return;
    const next = !on;
    if (!isControlled) setInternalOn(next);
    onChange?.(next);
  };

  return (
    <div
      className={`toggle ${on ? 'on' : ''}`}
      onClick={handleClick}
      role="switch"
      aria-checked={on}
      aria-disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    />
  );
}

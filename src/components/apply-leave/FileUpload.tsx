'use client';

import { useRef, useState } from 'react';

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

export default function FileUpload({ file, onChange, disabled }: Props) {
  const [hovering, setHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setHovering(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    onChange(selected);
    // Reset so same file can be re-selected
    e.target.value = '';
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  return (
    <div
      onClick={() => !disabled && !file && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setHovering(true); }}
      onDragLeave={() => setHovering(false)}
      onDrop={handleDrop}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `2px dashed ${
          hovering
            ? 'rgba(59,130,246,0.5)'
            : file
              ? 'rgba(16,185,129,0.4)'
              : 'var(--border)'
        }`,
        borderRadius: 10,
        padding: 20,
        textAlign: 'center',
        cursor: disabled ? 'default' : file ? 'default' : 'pointer',
        transition: 'all 0.18s',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleFileInput}
        disabled={disabled}
      />

      {file ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📎</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>
              {file.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {(file.size / 1024).toFixed(0)} KB
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                marginLeft: 8,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 6,
                color: 'var(--red)',
                fontSize: 11,
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            Drop file here or{' '}
            <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>browse</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
            PDF, JPG, PNG · Max 5 MB
          </div>
        </>
      )}
    </div>
  );
}

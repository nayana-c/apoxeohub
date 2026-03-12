'use client';

import { useState } from 'react';

interface AnnouncementBannerProps {
  title: string;
  body: string;
}

export default function AnnouncementBanner({ title, body }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="announcement">
      <div className="ann-icon">📣</div>
      <div className="ann-text">
        <div className="ann-title">{title}</div>
        <div className="ann-body">{body}</div>
      </div>
      <div className="ann-dismiss" onClick={() => setDismissed(true)}>
        Dismiss
      </div>
    </div>
  );
}

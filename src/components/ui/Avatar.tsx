import { AvatarColor } from '@/types';

interface AvatarProps {
  initials: string;
  color?: AvatarColor;
  size?: 'default' | 'sm';
}

export default function Avatar({ initials, color = 'default', size = 'default' }: AvatarProps) {
  const classes = [
    'avatar',
    size === 'sm' ? 'sm' : '',
    color !== 'default' ? color : '',
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{initials}</div>;
}

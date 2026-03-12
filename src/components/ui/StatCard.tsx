import { StatCardData } from '@/types';

export default function StatCard({ color, icon, label, value, sub, subBold }: StatCardData) {
  return (
    <div className={`stat-card ${color}`}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">
        {subBold && <b>{subBold} </b>}
        {sub}
      </div>
    </div>
  );
}

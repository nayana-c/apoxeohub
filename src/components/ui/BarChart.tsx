import { BarChartItem } from '@/types';

interface BarChartProps {
  items: BarChartItem[];
}

export default function BarChart({ items }: BarChartProps) {
  return (
    <div className="bar-chart">
      {items.map((item) => (
        <div key={item.label} className="bar-row">
          <div className="bar-label">{item.label}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${item.percentage}%`, background: item.gradient }}
            />
          </div>
          <div className="bar-val">{item.displayValue}</div>
        </div>
      ))}
    </div>
  );
}

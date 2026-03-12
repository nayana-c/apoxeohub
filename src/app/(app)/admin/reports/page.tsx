import ReportsView from '@/components/admin/ReportsView';
import { reportStats, leaveByTypeChart, leaveByDeptChart } from '@/data/mockData';

export default function ReportsPage() {
  return (
    <ReportsView
      stats={reportStats}
      byTypeChart={leaveByTypeChart}
      byDeptChart={leaveByDeptChart}
    />
  );
}

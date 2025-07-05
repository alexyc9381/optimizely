import DashboardLayout from '../components/Layout/DashboardLayout';
import UniversalAIDashboard from '../components/UniversalAIDashboard';

export default function Home() {
  return (
    <DashboardLayout
      title='Universal AI Platform - Dashboard'
      data-oid='2:2att-'
    >
      <UniversalAIDashboard data-oid='5i4y-0.' />
    </DashboardLayout>
  );
}

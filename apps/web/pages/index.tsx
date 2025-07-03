import DashboardLayout from '../components/Layout/DashboardLayout';
import UniversalAIDashboard from '../components/UniversalAIDashboard';

export default function Home() {
  return (
    <DashboardLayout
      title='Universal AI Platform - Dashboard'
      data-oid='lta:gyd'
    >
      <UniversalAIDashboard data-oid='hz2y:2c' />
    </DashboardLayout>
  );
}

import { useAccount } from 'wagmi';
import LandingPage from '@/components/LandingPage';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const { isConnected } = useAccount();

  if (isConnected) {
    return <Dashboard />;
  }

  return <LandingPage />;
};

export default Index;

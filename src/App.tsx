import { Routes, Route } from 'react-router-dom';
import { WalletProvider } from '@/context/WalletContext';
import { Landing } from '@/pages/Landing';
import { CreateLink } from '@/pages/CreateLink';
import { Dashboard } from '@/pages/Dashboard';
import { PayPage } from '@/pages/PayPage';
import { NotFound } from '@/pages/NotFound';

export default function App() {
  return (
    <WalletProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/create" element={<CreateLink />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/:slug" element={<PayPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </WalletProvider>
  );
}

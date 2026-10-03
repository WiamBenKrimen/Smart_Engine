import { AuthProvider } from './providers/AuthProvider';
import { ProcessProvider } from './providers/ProcessProvider';
import { RequestProvider } from './providers/RequestProvider';

export default function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ProcessProvider>
        <RequestProvider>{children}</RequestProvider>
      </ProcessProvider>
    </AuthProvider>
  );
}

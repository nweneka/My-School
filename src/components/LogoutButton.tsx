import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

export function LogoutButton({ className = '' }: { className?: string }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  return (
    <button
      onClick={handleLogout}
      className={`text-white/80 hover:text-white text-sm ${className}`}
    >
      Déconnexion
    </button>
  );
}

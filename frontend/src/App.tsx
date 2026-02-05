/**
 * =============================================================================
 * VEIL - Application Principale
 * =============================================================================
 * 
 * Point d'entrée de l'application React.
 * Gère le routage entre AuthForm (non connecté) et Dashboard (connecté).
 * 
 * =============================================================================
 */

import { useAuthStore } from './store/authStore';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import './App.css';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="app">
      {isAuthenticated ? <Dashboard /> : <AuthForm />}
    </div>
  );
}

export default App;

/* Entrar a la cuenta demo desde la landing o el login */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLocale, localizeError } from '../i18n';

export function useDemoLogin() {
  const { loginDemo } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const tryDemo = async () => {
    setBusy(true); setError('');
    try {
      await loginDemo();
      navigate('/dashboard');
    } catch (err) {
      setError(localizeError(err, t));
      setBusy(false);
    }
  };

  return { tryDemo, busy, error };
}

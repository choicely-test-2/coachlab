'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined, password }),
      });
      if (res.ok) {
        // Redirect to sign-in with success message
        router.push('/api/auth/signin?callbackUrl=/dashboard&message=account-created');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create account');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-silver flex items-center justify-center">
      <div className="bg-white pa4 br2 shadow-1 w-100 mw-500">
        <h1 className="f3 fw6 tc mb4">Create Account</h1>
        {error && <p className="red f6 mb3">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb3">
            <label className="db fw6 mb1">Email</label>
            <input
              type="email"
              required
              className="w-100 pa2 br2 ba"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="mb3">
            <label className="db fw6 mb1">Name (optional)</label>
            <input
              type="text"
              className="w-100 pa2 br2 ba"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="mb3">
            <label className="db fw6 mb1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-100 pa2 br2 ba"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div className="mb3">
            <label className="db fw6 mb1">Confirm Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="w-100 pa2 br2 ba"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-100 bg-dark-blue white bn br2 pa3 fw6 pointer"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt3 f6 tc">
          Already have an account?{' '}
          <a href="/api/auth/signin" className="link blue">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

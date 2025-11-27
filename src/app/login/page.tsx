'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, handleAPIError } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import styles from './auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginResponse = await authAPI.login(email, password);
      const user = await authAPI.getCurrentUser(loginResponse.access_token);

      // Fetch user profiles
      const profiles = await authAPI.getMyProfiles(loginResponse.access_token);

      let profileUid;
      if (profiles.length > 0) {
        profileUid = profiles[0].uid;
      } else {
        // Create a default profile if none exists
        const newProfile = await authAPI.createMyProfile(
          { name: user.username || 'New User' },
          loginResponse.access_token
        );
        profileUid = newProfile.uid;
      }

      setAuth(user, loginResponse.access_token, profileUid);

      router.push('/home');
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>Unknown App</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <div className={styles.divider}>
          <span>또는</span>
        </div>
        <p className={styles.signup}>
          계정이 없으신가요? <Link href="/signup">가입하기</Link>
        </p>
      </div>
    </div>
  );
}

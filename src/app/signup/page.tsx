'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI, handleAPIError } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import styles from '../login/auth.module.css';

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authAPI.signup(email, password, username);
      const loginResponse = await authAPI.login(email, password);

      // Create initial profile for new user
      const newProfile = await authAPI.createMyProfile(
        { name: username },
        loginResponse.access_token
      );

      setAuth(user, loginResponse.access_token, loginResponse.refresh_token, newProfile.uid);

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
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            marginBottom: '20px',
            fontSize: '14px',
          }}
        >
          친구들의 사진과 동영상을 보려면 가입하세요.
        </p>
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
            type="text"
            placeholder="사용자 이름"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className={styles.input}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={styles.input}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? '가입 중...' : '가입'}
          </button>
        </form>
        <div className={styles.divider}>
          <span>또는</span>
        </div>
        <p className={styles.signup}>
          계정이 있으신가요? <Link href="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}

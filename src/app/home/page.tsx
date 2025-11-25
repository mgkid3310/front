'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import styles from './home.module.css';

export default function HomePage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const handleDMClick = () => {
    router.push('/dm');
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>Unknown App</h1>
          <div className={styles.headerRight}>
            <button onClick={handleDMClick} className={styles.dmButton}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className={styles.username}>{user.username}</span>
            <button onClick={handleLogout} className={styles.logoutButton}>
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.feed}>
          <div className={styles.emptyState}>
            <h2>피드가 비어있습니다</h2>
            <p>아직 게시물이 없습니다. DM으로 대화를 시작해보세요!</p>
            <button onClick={handleDMClick} className={styles.dmLinkButton}>
              DM 열기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

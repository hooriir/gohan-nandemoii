"use client";

import Link from "next/link";
import styles from "./page.module.css";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function Home() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  return (
    <main className={styles.container}>
      <div className={styles.textArea}>
        <p className={styles.guest}>
          {isLoggedIn ? `${session.user?.name ?? "ユーザー"}さんの` : "ゲストさんの"}
        </p>

        <h1 className={styles.title}>
          <Image
            src="/images/title.svg"
            alt="ごはん？なんでもいい～"
            width={537}
            height={251}
            
          />
        </h1>
      </div>

      <div className={styles.iconArea}>
        {/* ごはん画像 */}
        <div className={styles.iconBlock}>
          {isLoggedIn ? (
            <Link href="/mypage">
              <span className={styles.iconLabel}>
                マイページ
              </span>
                <Image
                  src="/images/gohan.svg"
                  alt="マイページ"
                  width={180}
                  height={143}
                  className={styles.icon}
                />
            </Link>
          ) : (
            <Link href="/signup" className={styles.iconLink}>
              <span className={styles.iconLabel}>
                新規登録
              </span>
                <Image
                  src="/images/gohan.svg"
                  alt="新規登録"
                  width={271}
                  height={61}
                  className={styles.icon}
                />
            </Link>
          )}
        </div>

        {/* はし画像 */}
        <div className={styles.iconBlock}>
          {isLoggedIn ? (
            <button className={`${styles.buttonReset} ${styles.iconLink}`} onClick={() => signOut()}>
              <span className={`${styles.iconLabel} ${styles.hashiLabel}`}>
                ログイン
              </span>
              <Image
                  src="/images/hashi.svg"
                  alt="ログアウト"
                  width={271}
                  height={61}
                  className={styles.icon}
                />
            </button>
          ) : (
            <Link href="/login" className={styles.iconLink}>
              <span className={`${styles.iconLabel} ${styles.hashiLabel}`}>
                ログイン
              </span>
              <Image
                  src="/images/hashi.svg"
                  alt="ログイン"
                  width={271}
                  height={61}
                  className={styles.icon}
                />
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
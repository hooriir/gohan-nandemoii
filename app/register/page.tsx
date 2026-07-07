import styles from "./register.module.css";
import { registerUser } from "../actions";

export default async function RegisterPage(props: {
    searchParams: Promise<{ error?: string }>;
}) {
    const searchParams = await props.searchParams;
    const error = searchParams.error;

    return (
        <div className={styles.container}>
      <div className={styles.card}>
        {/* ロゴ部分 */}
        <div className={styles.logoArea}>
          <h1 className={styles.logoTitle}>ごはん？</h1>
          <p className={styles.logoSubtitle}>なんでもいい〜</p>
        </div>

        <h2 className={styles.title}>新規登録</h2>

        {/* エラーメッセージがあれば表示 */}
        {error && <p className={styles.error}>{error}</p>}

        {/* バックエンドの処理（Server Actions）を直接呼び出す */}
        <form action={registerUser} className={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="ユーザー名"
            required
            className={styles.input}
          />
          <input
            type="email"
            name="email"
            placeholder="メールアドレス"
            required
            className={styles.input}
          />
          <input
            type="password"
            name="password"
            placeholder="パスワード"
            required
            className={styles.input}
          />
          <button type="submit" className={styles.submitButton}>
            新規登録
          </button>
        </form>
      </div>
    </div>
    )
}
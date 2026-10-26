import styles from './App.module.scss'

function App() {
  return (
    <main className={styles.app}>
      <h1 className={styles.title}>붕붕어스</h1>
      <p className="typo-body-m">디자인 시스템 적용 확인용 화면</p>
      <span className={`${styles.badge} typo-caption-bold`}>D+000</span>
    </main>
  )
}

export default App

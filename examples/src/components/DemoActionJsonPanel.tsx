import styles from "./demo-action-json-panel.module.css";

interface DemoActionJsonPanelProps {
  value: string | readonly number[];
}

export default function DemoActionJsonPanel({ value }: DemoActionJsonPanelProps) {
  const content =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);

  return (
    <section className={styles.panel} aria-label="Latest grid action output">
      <div className={styles.header}>
        <h2 className={styles.title}>Action JSON</h2>
        <span className={styles.caption}>Latest grid operation</span>
      </div>
      <pre className={styles.output} aria-live="polite">
        {content}
      </pre>
    </section>
  );
}

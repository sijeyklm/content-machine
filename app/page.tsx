import { Fragment } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

const STAGES = [
  { icon: "📄", label: "Intake", description: "Parse brand book PDF" },
  { icon: "🎨", label: "Rules", description: "Extract voice and visual rules" },
  { icon: "🔍", label: "Retrieval", description: "Find similar past winners" },
  { icon: "✍️", label: "Directives", description: "Generate per-channel directions" },
  { icon: "🎬", label: "Render", description: "Produce video and static kit" },
];

const OUTPUTS = [
  {
    count: "3",
    label: "Video formats",
    description: "9:16 for TikTok and Shorts, 1:1 for Meta feed, 4:5 for Meta portrait",
  },
  {
    count: "4",
    label: "Static variants",
    description: "Meta Square and Google Display in two visual treatments each",
  },
  {
    count: "1",
    label: "Brand brain",
    description: "Structured rules and platform directives from a single brand book",
  },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <div className={styles.eyebrow}>Performance creative automation</div>
          <h1 className={styles.heroHeadline}>
            Turn brand books into channel-ready ad kits.
          </h1>
          <p className={styles.heroSubhead}>
            An AI orchestration layer that reads your brand guidelines, studies your past winning ads,
            and produces video and static creative across every channel — in under 90 seconds.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/pipeline-test" className={styles.ctaPrimary}>
              Run the pipeline
            </Link>
            <Link href="/render-test" className={styles.ctaSecondary}>
              View the kit
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionHeader}>The creative bottleneck</h2>
          <p className={styles.sectionLead}>
            Modern marketing teams ship campaigns across Meta, TikTok, Shorts, and Google Display — each
            with its own format, aspect ratio, and native creative idioms. Producing on-brand variants
            for every channel is slow, repetitive, and the first thing that gets cut when speed matters.
            Brand consistency erodes. Variant testing stalls. Past winners get forgotten.
          </p>
        </div>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionHeader}>From brand book to creative kit in 90 seconds</h2>
          <p className={styles.sectionLead}>
            Five stages. Each produces output the next consumes. Inspect any stage&apos;s output to see
            what the system actually decided.
          </p>
          <div className={styles.stageRow}>
            {STAGES.map((stage, i) => (
              <Fragment key={stage.label}>
                <div className={styles.stageCard}>
                  <div className={styles.stageIcon}>{stage.icon}</div>
                  <p className={styles.stageLabel}>{stage.label}</p>
                  <p className={styles.stageDescription}>{stage.description}</p>
                </div>
                {i < STAGES.length - 1 ? (
                  <div className={styles.stageConnector}>
                    <div className={styles.stageConnectorLine} />
                  </div>
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>
      </section>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionHeader}>One brief, seven channel-ready assets</h2>
          <p className={styles.sectionLead}>
            A single campaign brief produces every format your team needs across paid social and
            display. Each is brand-compliant, dimension-correct, and ready to upload.
          </p>
          <div className={styles.outputsGrid}>
            {OUTPUTS.map((output) => (
              <div key={output.label} className={styles.outputCard}>
                <p className={styles.outputCount}>{output.count}</p>
                <p className={styles.outputLabel}>{output.label}</p>
                <p className={styles.outputDescription}>{output.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionHeader}>Try it yourself</h2>
          <p className={styles.sectionLead}>
            Run the real pipeline against the included sample brand, or browse the rendered creative kit
            it produces. No signup, no API key required.
          </p>
          <div className={styles.tryLinkGroup}>
            <Link href="/pipeline-test" className={styles.tryLink}>
              <p className={styles.tryLinkLabel}>Run the pipeline →</p>
              <p className={styles.tryLinkDescription}>
                Watch five stages flip from pending to complete as the brand brain runs end-to-end.
                About 60-90 seconds total.
              </p>
            </Link>
            <Link href="/render-test" className={styles.tryLink}>
              <p className={styles.tryLinkLabel}>View the rendered kit →</p>
              <p className={styles.tryLinkDescription}>
                Browse all seven outputs (three video aspect ratios plus four static variants) and
                download any of them as real files.
              </p>
            </Link>
          </div>
          <div className={styles.honestyNote}>
            <strong>What&apos;s real, what&apos;s shown:</strong> The brand brain, retrieval, directive
            generation, and rendering pipelines all run with real Claude and Voyage API calls. The sample
            brand (Northbean cold brew) and its past ads are fictional, included as demonstration data.
            For a real client, this same architecture consumes their actual brand assets.
          </div>
        </div>
      </section>
      <footer className={styles.footer}>
        Content Machine prototype · Built as a portfolio piece
      </footer>
    </div>
  );
}
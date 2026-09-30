import { useEffect, useRef } from "react";
import { Coin } from "./coin";
import { Chevron, Donut } from "./ui";

const QUESTIONS = [
  { q: "How much have I made?", a: "Every shift you log adds up to your income for the month.", tone: "yellow" },
  { q: "How much have I spent?", a: "Log an expense in seconds and file it under a category.", tone: "mint" },
  { q: "Where is my money going?", a: "Charts split your spending by category and by day.", tone: "white" },
  { q: "How much do I have left?", a: "Available income minus spending, front and center.", tone: "white" },
  { q: "Am I staying within my budget?", a: "Each category has a progress bar against its monthly limit.", tone: "yellow" },
  { q: "How much should I set aside?", a: "Switch on the optional tax set-aside and pick a rate.", tone: "lav" },
];
const COLUMNS = [[0, 3], [1, 4], [2, 5]];
const COLUMN_SPEEDS = [0.07, -0.06, 0.12];

export default function Landing({ onOpen }) {
  const ref = useRef(null);

  // Parallax: each [data-speed] element drifts relative to where its parent sits in the viewport.
  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...root.querySelectorAll("[data-speed]")];
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const mobile = window.innerWidth < 700;
      for (const el of els) {
        if (mobile && el.dataset.desktop) { el.style.transform = ""; continue; }
        const r = el.parentElement.getBoundingClientRect();
        const offset = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${(-offset * Number(el.dataset.speed)).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="landing" ref={ref}>
      <header className="top">
        <div className="top-inner">
          <span className="wordmark">centsible</span>
          <button className="btn-small top-cta" onClick={onOpen}>Open Centsible</button>
        </div>
      </header>

      <section className="l-hero">
        <div className="blob yellow" data-speed="0.22" />
        <div className="blob lav" data-speed="0.4" />
        <div className="blob mint" data-speed="0.6" />
        <div className="hero-coin" data-speed="0.32"><Coin size={132} variant="turn" /></div>

        <div className="l-hero-copy" data-speed="0.1">
          <h1>Budgeting shouldn't cost you money.</h1>
          <p>
            Centsible is a free budgeting app for students and shift workers. Log what you earn, set money aside for
            taxes if you want to, and see what's left to spend.
          </p>
          <button className="btn-big" onClick={onOpen}>Open Centsible <Chevron /></button>
        </div>
      </section>

      <section className="l-section">
        <h2>Every question about your money, answered in one place.</h2>
        <div className="q-grid">
          {COLUMNS.map((col, ci) => (
            <div className="q-col" key={ci} data-speed={COLUMN_SPEEDS[ci]} data-desktop="1">
              {col.map((qi) => (
                <article className={`q-card ${QUESTIONS[qi].tone}`} key={qi}>
                  <h3>{QUESTIONS[qi].q}</h3>
                  <p>{QUESTIONS[qi].a}</p>
                </article>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="l-section">
        <h2>From a shift to what's left, in four steps.</h2>
        <ol className="steps">
          <li className="step">
            <span className="step-n">1</span>
            <h3>Log a shift</h3>
            <p>Enter the date, hours, and hourly rate. Centsible works out what you earned.</p>
          </li>
          <li className="step">
            <span className="step-n">2</span>
            <h3>Set some aside</h3>
            <p>Optional. Reserve a share of your income for taxes before you budget the rest.</p>
          </li>
          <li className="step">
            <span className="step-n">3</span>
            <h3>Budget the rest</h3>
            <p>Give each category a monthly limit and log expenses as they happen.</p>
          </li>
          <li className="step">
            <span className="step-n">4</span>
            <h3>See where it went</h3>
            <p>Charts show your spending by category, by day, and month to month.</p>
            <div className="step-demo">
              <Donut size={120} segments={[
                { value: 15, color: "#000" },
                { value: 40, color: "#cdbbff" },
                { value: 45, color: "#fff94f" },
              ]} />
              <span className="muted">Example</span>
            </div>
          </li>
        </ol>
      </section>

      <section className="l-band">
        <div className="band-coin a" data-speed="0.3"><Coin size={90} variant="turn" /></div>
        <div className="band-coin b" data-speed="-0.25"><Coin size={64} variant="turn" /></div>
        <div className="band-inner">
          <p>You shouldn't have to spend money just to learn how to manage it.</p>
        </div>
      </section>

      <section className="l-section l-cta">
        <h2>Start with one shift.</h2>
        <button className="btn-big" onClick={onOpen}>Open Centsible <Chevron /></button>
      </section>

      <footer className="l-foot">
        <span>Centsible, by Joshua Ane.</span>
        <span>Tax figures are estimates, not tax advice.</span>
      </footer>
    </div>
  );
}

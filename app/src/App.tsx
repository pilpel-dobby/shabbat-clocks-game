import { useState, useEffect, useRef, useMemo } from "react";
import { simulate, evaluateSolution } from "./engine";
import type { Clock, ClockSimState } from "./engine";
import { puzzles } from "./puzzles";
import type { Difficulty } from "./puzzles";

const ONBOARDING_SEEN_KEY = "shabbat-clocks-onboarding-seen";
const ACTIVE_PUZZLE_KEY = "shabbat-clocks-active-puzzle";
const puzzleKey = (id: string) => `shabbat-clocks-puzzle-${id}`;

// localStorage can throw (blocked storage, some private modes). The game must keep working without it.
const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

/** Load a saved clock configuration, only if it still fits the puzzle (same clocks, 24 boolean teeth). */
function loadSavedClocks(p: (typeof puzzles)[number]): Clock[] | null {
  const saved = storage.get(puzzleKey(p.id));
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as Clock[];
    if (!Array.isArray(parsed) || parsed.length !== p.initialClocks.length) return null;
    const expectedIds = p.initialClocks.map((c) => c.id).sort().join("|");
    const savedIds = parsed.map((c) => c?.id).sort().join("|");
    if (expectedIds !== savedIds) return null;
    const ok = parsed.every(
      (c) =>
        Array.isArray(c.teeth) &&
        c.teeth.length === 24 &&
        c.teeth.every((t) => typeof t === "boolean") &&
        Number.isInteger(c.initialPosition)
    );
    if (!ok) return null;
    // Names/colors always come from the puzzle definition, so copy fixes reach saved games too
    return parsed.map((c) => {
      const def = p.initialClocks.find((d) => d.id === c.id)!;
      return { ...def, teeth: c.teeth };
    });
  } catch {
    return null;
  }
}

/** Clock names carry their original role in parentheses ("(ראשי)"); the role changes when clocks are reordered. */
const displayName = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, "");

const difficultyClass: Record<Difficulty, string> = {
  "קל": "easy",
  "בינוני": "medium",
  "קשה": "hard",
};

export default function App() {
  const [activePuzzleIndex, setActivePuzzleIndex] = useState<number>(() => {
    const saved = Number(storage.get(ACTIVE_PUZZLE_KEY));
    return Number.isInteger(saved) && saved >= 0 && saved < puzzles.length ? saved : 0;
  });
  const puzzle = puzzles[activePuzzleIndex];
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [solvedPuzzles, setSolvedPuzzles] = useState<Record<string, boolean>>({});

  // Scan localStorage to update solved badge status for all puzzles
  useEffect(() => {
    const checkSolved = () => {
      const status: Record<string, boolean> = {};
      puzzles.forEach((p) => {
        const saved = loadSavedClocks(p);
        status[p.id] = saved
          ? evaluateSolution(simulate(saved, p.simulationDuration).timeline, p.targetTimeline)
          : false;
      });
      setSolvedPuzzles(status);
    };
    checkSolved();
  }, [activePuzzleIndex]);

  // Remember the open puzzle across reloads
  useEffect(() => {
    storage.set(ACTIVE_PUZZLE_KEY, String(activePuzzleIndex));
  }, [activePuzzleIndex]);

  // Keep the active tab visible in the horizontally scrolling tab bar (mobile)
  const tabsRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const nav = tabsRef.current;
    const tab = nav?.querySelector<HTMLElement>(".tab-btn.active");
    if (!nav || !tab || nav.scrollWidth <= nav.clientWidth) return;
    const navBox = nav.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();
    if (tabBox.left < navBox.left || tabBox.right > navBox.right) {
      nav.scrollBy({ left: tabBox.left + tabBox.width / 2 - (navBox.left + navBox.width / 2) });
    }
  }, [activePuzzleIndex]);

  const goToPuzzle = (idx: number) => {
    setActivePuzzleIndex(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Return keyboard focus to the help button when the dialog closes
  const helpBtnRef = useRef<HTMLButtonElement | null>(null);
  const closeHelp = () => {
    setShowHelpModal(false);
    helpBtnRef.current?.focus();
  };

  // Close the help modal with Escape
  useEffect(() => {
    if (!showHelpModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowHelpModal(false);
        helpBtnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showHelpModal]);

  const solvedCount = puzzles.filter((p) => solvedPuzzles[p.id]).length;

  const handleSolveChange = (puzzleId: string, solved: boolean) => {
    setSolvedPuzzles((prev) => {
      if (prev[puzzleId] === solved) return prev;
      return { ...prev, [puzzleId]: solved };
    });
  };

  return (
    <div>
      {/* Header */}
      <header className="header-container">
        <h1 className="header-title">משחק שעוני שבת</h1>
        <p className="header-subtitle">
          פתרו תבניות הדלקה מורכבות באמצעות שרשור של שעוני שבת מכניים
        </p>
      </header>

      {/* Tabs / Puzzle Selector & Help Button */}
      <div className="progress-line" aria-live="polite">
        פתרתם {solvedCount} מתוך {puzzles.length} חידות
        {solvedCount === puzzles.length && " 🏆"}
      </div>
      <div className="tabs-container">
        <nav className="puzzle-tabs" aria-label="בחירת חידה" ref={tabsRef}>
          {puzzles.map((p, idx) => (
            <button
              key={p.id}
              className={`tab-btn ${activePuzzleIndex === idx ? "active" : ""} ${solvedPuzzles[p.id] ? "solved-tab" : ""}`}
              onClick={() => goToPuzzle(idx)}
              title={`${p.title} (${p.difficulty})${solvedPuzzles[p.id] ? " - נפתרה" : ""}`}
              aria-current={activePuzzleIndex === idx ? "page" : undefined}
            >
              {solvedPuzzles[p.id] ? "✓ " : ""}
              {idx + 1}. {p.shortTitle}
            </button>
          ))}
        </nav>
        <button
          className="tab-btn help-btn"
          ref={helpBtnRef}
          onClick={() => setShowHelpModal(true)}
        >
          ℹ️ מדריך חוקים ואודות
        </button>
      </div>

      {/* Puzzle Information */}
      <section className="card puzzle-info-card">
        <div className="puzzle-title-row">
          <h2>
            {activePuzzleIndex + 1}. {puzzle.title}
          </h2>
          <span className={`difficulty-badge ${difficultyClass[puzzle.difficulty]}`}>{puzzle.difficulty}</span>
        </div>
        <p>{puzzle.description}</p>
        {puzzle.hint && <HintToggle key={puzzle.id} hint={puzzle.hint} />}
      </section>

      {/* Workspace Area - Keyed by puzzle.id to reset all state upon switching */}
      <PuzzleWorkspace
        key={puzzle.id}
        puzzle={puzzle}
        onSolveStatusChange={(solved) => handleSolveChange(puzzle.id, solved)}
        onNextPuzzle={
          activePuzzleIndex < puzzles.length - 1
            ? () => goToPuzzle(activePuzzleIndex + 1)
            : undefined
        }
      />

      {/* Help & About Modal */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={closeHelp}>
          <div
            className="modal-content card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="help-modal-title">מדריך המשחק: שעוני שבת מכניים</h3>
              <button className="icon-btn" aria-label="סגירה" onClick={closeHelp} autoFocus>✕</button>
            </div>
            <div className="modal-body">
              <p>
                ברוכים הבאים ל<strong>משחק שעוני שבת</strong>! זהו משחק פאזל לוגי המבוסס על האופן שבו שעוני שבת מכניים פועלים במציאות.
              </p>
              
              <h4>הכללים הבסיסיים:</h4>
              <ul>
                <li>
                  <strong>הזנת חשמל:</strong> שעון שבת הוא מכשיר מכני בעל חוגה שמסתובבת. החוגה <strong>מסתובבת רק כאשר השעון מקבל חשמל</strong>.
                </li>
                <li>
                  <strong>עצירת זמן:</strong> אם השעון אינו מקבל חשמל (הקלט שלו הוא OFF), המנוע הפנימי שלו נעצר והוא "קופא" בזמן הנוכחי שלו.
                </li>
                <li>
                  <strong>פלט השעון:</strong> השעון מוציא חשמל (ON) רק אם:
                  <ol>
                    <li>הוא מקבל חשמל בכניסה.</li>
                    <li>השן הנוכחית עליה עומדת החוגה מכוונת למצב <strong>פעיל (דולק)</strong>.</li>
                  </ol>
                </li>
                <li>
                  <strong>שרשור שעונים:</strong> על ידי חיבור היציאה של שעון אחד לכניסה של שעון שני, נוצרת שרשרת. השעון השני יסתובב רק כאשר השעון הראשון מוציא חשמל.
                </li>
              </ul>

              <h4>איך פותרים?</h4>
              <ul>
                <li>
                  לחצו וגררו את העכבר (או האצבע בנייד) על גבי <strong>שיני השעון</strong> (24 שיניים, שן לכל שעה) כדי לקבוע מתי החוגה תהיה במצב פעיל. אפשר גם לעבור בין השיניים במקלדת (Tab) ולהפעיל עם רווח או Enter.
                </li>
                <li>
                  שנו את סדר השעונים בשרשרת באמצעות כפתורי החצים (▲ ו-▼).
                </li>
                <li>
                  שימו לב לצירי הזמן: <strong>תבנית היעד</strong> מציגה את הדפוס הדרוש, ו<strong>הפלט בפועל</strong> מציג את התוצאה של השעונים שלכם כרגע. שעות שלא תואמות ליעד מסומנות במסגרת אדומה, ומד ההתאמה מראה כמה שעות כבר נכונות.
                </li>
                <li>
                  הצביעו עם העכבר על שעה כלשהי בציר הזמן (או לחצו עליה) כדי לראות את המצב הפנימי המדויק של כל שעון (השעה הנוכחית שלו, וזרימת החשמל) באותה נקודת זמן!
                </li>
                <li>
                  נתקעתם? לכל חידה יש כפתור <strong>רמז</strong> מתחת לתיאור.
                </li>
              </ul>
            </div>
            <div className="modal-footer">
              <button className="tab-btn active" onClick={closeHelp}>הבנתי, תודה!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HintToggle({ hint }: { hint: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="hint-wrap">
      <button className="hint-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? "הסתר רמז" : "💡 צריכים רמז?"}
      </button>
      {open && <p className="hint-text">{hint}</p>}
    </div>
  );
}

interface PuzzleWorkspaceProps {
  puzzle: typeof puzzles[number];
  onSolveStatusChange?: (solved: boolean) => void;
  onNextPuzzle?: () => void;
}

function PuzzleWorkspace({ puzzle, onSolveStatusChange, onNextPuzzle }: PuzzleWorkspaceProps) {
  // State for the clocks of the active puzzle, initialized lazily to avoid cascading effect
  const [clocks, setClocks] = useState<Clock[]>(
    () => loadSavedClocks(puzzle) ?? (JSON.parse(JSON.stringify(puzzle.initialClocks)) as Clock[])
  );

  // Simulation results. The engine is tiny (<= 72 ticks x 3 clocks), so it runs
  // synchronously on every change for instant feedback (no debounce/spinner).
  const simulationResult = useMemo(
    () => simulate(clocks, puzzle.simulationDuration),
    [clocks, puzzle.simulationDuration]
  );
  const isSolved = useMemo(
    () => evaluateSolution(simulationResult.timeline, puzzle.targetTimeline),
    [simulationResult, puzzle.targetTimeline]
  );
  const matchCount = useMemo(
    () => simulationResult.timeline.filter((v, i) => v === puzzle.targetTimeline[i]).length,
    [simulationResult, puzzle.targetTimeline]
  );
  const matchPercent = Math.round((matchCount / puzzle.simulationDuration) * 100);

  // Onboarding is expanded on the very first visit only
  const [onboardingOpen] = useState<boolean>(() => storage.get(ONBOARDING_SEEN_KEY) === null);
  useEffect(() => {
    storage.set(ONBOARDING_SEEN_KEY, "1");
  }, []);

  // Hover state to show details for a specific hour
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Scrubber / playback controls for mobile simulation-step inspection
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Drag-to-draw state for teeth editing
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawValue, setDrawValue] = useState<boolean>(true);
  const activeClockIdRef = useRef<string | null>(null);

  // Persist clocks state in localStorage when it changes
  useEffect(() => {
    if (clocks.length > 0) {
      storage.set(puzzleKey(puzzle.id), JSON.stringify(clocks));
    }
  }, [clocks, puzzle.id]);

  // Report solved status to the parent only when it actually changes
  const onSolveRef = useRef(onSolveStatusChange);
  useEffect(() => {
    onSolveRef.current = onSolveStatusChange;
  });
  useEffect(() => {
    onSolveRef.current?.(isSolved);
  }, [isSolved]);

  // Global mouseup/touchend/touchcancel cleanup
  useEffect(() => {
    const handleGlobalRelease = () => {
      setIsDrawing(false);
      activeClockIdRef.current = null;
    };

    window.addEventListener("mouseup", handleGlobalRelease);
    window.addEventListener("touchend", handleGlobalRelease);
    window.addEventListener("touchcancel", handleGlobalRelease);

    return () => {
      window.removeEventListener("mouseup", handleGlobalRelease);
      window.removeEventListener("touchend", handleGlobalRelease);
      window.removeEventListener("touchcancel", handleGlobalRelease);
    };
  }, []);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedHour((prev) => (prev + 1) % puzzle.simulationDuration);
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying, puzzle.simulationDuration]);

  // Handler for toggle/drag teeth
  const handleToothState = (clockId: string, toothIndex: number, targetState: boolean) => {
    lastToothRef.current = toothIndex;
    setClocks((prevClocks) =>
      prevClocks.map((clock) => {
        if (clock.id !== clockId) return clock;
        const newTeeth = [...clock.teeth];
        newTeeth[toothIndex] = targetState;
        return { ...clock, teeth: newTeeth };
      })
    );
  };

  // While dragging, fill every tooth between the previous and current one, so a fast
  // mouse/finger movement (or a dropped move event) doesn't skip teeth.
  const lastToothRef = useRef<number | null>(null);
  const drawToTooth = (clockId: string, toothIndex: number, targetState: boolean) => {
    const from = lastToothRef.current ?? toothIndex;
    lastToothRef.current = toothIndex;
    const lo = Math.min(from, toothIndex);
    const hi = Math.max(from, toothIndex);
    setClocks((prevClocks) =>
      prevClocks.map((clock) => {
        if (clock.id !== clockId) return clock;
        const newTeeth = [...clock.teeth];
        for (let i = lo; i <= hi; i++) newTeeth[i] = targetState;
        return { ...clock, teeth: newTeeth };
      })
    );
  };

  const handleMouseDown = (clockId: string, toothIndex: number, currentState: boolean) => {
    setIsDrawing(true);
    const newValue = !currentState;
    setDrawValue(newValue);
    activeClockIdRef.current = clockId;
    handleToothState(clockId, toothIndex, newValue);
  };

  const handleMouseEnterTooth = (clockId: string, toothIndex: number) => {
    if (isDrawing && activeClockIdRef.current === clockId) {
      drawToTooth(clockId, toothIndex, drawValue);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDrawing(false);
    activeClockIdRef.current = null;
  };

  const handleTouchStart = (clockId: string, toothIndex: number, currentState: boolean) => {
    setIsDrawing(true);
    const newValue = !currentState;
    setDrawValue(newValue);
    activeClockIdRef.current = clockId;
    handleToothState(clockId, toothIndex, newValue);
  };

  const handleTouchMove = (e: React.TouchEvent, clockId: string) => {
    if (!isDrawing || activeClockIdRef.current !== clockId) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    // Walk up DOM to find closest data-tooth-index element (robustness fix)
    let target: Element | null = element;
    while (target && target !== document.body) {
      if (target.getAttribute("data-tooth-index") !== null) {
        break;
      }
      target = target.parentElement;
    }

    if (target) {
      const elementClockId = target.getAttribute("data-clock-id");
      const elementToothIndexAttr = target.getAttribute("data-tooth-index");

      if (elementClockId === clockId && elementToothIndexAttr !== null) {
        const tIdx = parseInt(elementToothIndexAttr, 10);
        drawToTooth(clockId, tIdx, drawValue);
      }
    }
  };

  // Reorder clocks
  const moveClock = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= clocks.length) return;

    const reordered = [...clocks];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;
    setClocks(reordered);
    setHoveredHour(null);
  };

  // Reset current puzzle
  const resetPuzzle = () => {
    storage.remove(puzzleKey(puzzle.id));
    const clonedClocks = JSON.parse(JSON.stringify(puzzle.initialClocks)) as Clock[];
    setClocks(clonedClocks);
    setHoveredHour(null);
    setSelectedHour(0);
    setIsPlaying(false);
  };

  const activeHour = hoveredHour !== null ? hoveredHour : selectedHour;

  const activeStep = activeHour !== null && activeHour < simulationResult.steps.length
    ? simulationResult.steps[activeHour]
    : null;

  const formatHour = (h: number) => {
    const day = Math.floor(h / 24) + 1;
    const hourVal = h % 24;
    const padHour = hourVal.toString().padStart(2, "0");
    return `יום ${day}, ${padHour}:00`;
  };

  return (
    <div>
      {/* Onboarding Banner */}
      <details className="card onboarding-card" open={onboardingOpen}>
        <summary>💡 איך משחקים? (מדריך מהיר)</summary>
        <ul className="onboarding-list">
          <li><strong>כיוון שיניים:</strong> לחצו וגררו על פסי השיניים של השעונים. שן צבעונית = דולק (ON), שן כהה = כבוי (OFF).</li>
          <li><strong>כלל הזרימה:</strong> חשמל זורם מלמעלה למטה. שעון משני מסתובב <em>רק</em> כשהשעון שמעליו מספק לו חשמל!</li>
          <li><strong>מטרת החידה:</strong> שנו את שיני השעונים כך שפס ה-<strong>פלט בפועל</strong> יתאים בדיוק לפס ה-<strong>תבנית היעד</strong>.</li>
          <li><strong>בדיקה בנייד:</strong> לחצו על שעה כלשהי בציר הזמן או השתמשו בנגן הסימולציה כדי לראות את כיוון מחוגי השעון בזמן אמת.</li>
          <li><strong>מה עוד לא תואם?</strong> שעות בפלט שלא תואמות ליעד מסומנות במסגרת אדומה.</li>
        </ul>
      </details>

      {/* Success Notification */}
      {isSolved && (
        <div className="success-banner" role="status" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
          <div>🎉 כל הכבוד! הצלחתם להתאים את תבנית שעוני השבת ליעד הנדרש!</div>
          {!onNextPuzzle && <div className="success-sub">זו הייתה החידה האחרונה. אפשר לחזור לחידות שעוד לא פתרתם בלשוניות למעלה.</div>}
          {onNextPuzzle && (
            <button
              className="tab-btn active"
              style={{
                marginTop: "0.5rem",
                padding: "0.4rem 1.25rem",
                fontSize: "0.95rem",
                backgroundColor: "#10b981",
                borderColor: "#10b981",
                boxShadow: "0 0 10px rgba(16, 185, 129, 0.4)",
              }}
              onClick={onNextPuzzle}
            >
              לעבור לחידה הבאה ←
            </button>
          )}
        </div>
      )}

      {/* Main Workspace Layout */}
      <main className="workspace-grid">
        {/* Left Column: Clocks configuration */}
        <section className="clocks-section">
          <div className="section-title">
            <span>הגדרת שעונים (זרימת חשמל מלמעלה למטה)</span>
          </div>

          {clocks.map((clock, idx) => {
            // Find current dial position and states for the active hour
            let activeDialPos: number | null = null;
            let currentClockSimState: ClockSimState | null = null;
            if (activeStep) {
              const state = activeStep.clocks.find((c) => c.clockId === clock.id);
              if (state) {
                activeDialPos = state.position;
                currentClockSimState = state;
              }
            }

            const prevClock = idx > 0 ? clocks[idx - 1] : null;
            const prevClockState = prevClock && activeStep ? activeStep.clocks.find((c) => c.clockId === prevClock.id) : null;
            const isPowerFlowing = prevClockState ? prevClockState.hasOutputPower : false;

            return (
              <div key={clock.id} className="clock-wrapper" style={{ display: "flex", flexDirection: "column" }}>
                {idx > 0 && prevClock && (
                  <div className="clock-connector">
                    <div
                      className={`connector-wire ${isPowerFlowing ? "flowing" : ""}`}
                      style={{
                        backgroundColor: isPowerFlowing ? prevClock.color : "rgba(255, 255, 255, 0.1)",
                        boxShadow: isPowerFlowing ? `0 0 10px ${prevClock.color}` : "none",
                      }}
                    />
                    <div
                      className={`connector-arrow ${isPowerFlowing ? "flowing" : ""}`}
                      style={{
                        borderTopColor: isPowerFlowing ? prevClock.color : "rgba(255, 255, 255, 0.1)",
                      }}
                    />
                  </div>
                )}
                <div
                  className="card clock-card"
                  style={{ borderRightColor: clock.color }}
                >
                  <div className="clock-header">
                    <div className="clock-title-wrap">
                      <span
                        className="clock-color-badge"
                        style={{ color: clock.color, backgroundColor: clock.color }}
                      ></span>
                      <span className="clock-name">
                        {displayName(clock.name)}
                        <span className="clock-source">
                          {idx === 0 ? "מחובר לחשמל הראשי" : `מקבל חשמל מ${displayName(clocks[idx - 1]?.name ?? "")}`}
                        </span>
                      </span>
                    </div>

                    {currentClockSimState && (
                      <div className="clock-status-badges">
                        <span className={`status-indicator ${currentClockSimState.hasInputPower ? "on" : "off"}`}>
                          {currentClockSimState.hasInputPower ? "⚡ פעיל" : "⏸ מוקפא"} (שן {activeDialPos})
                        </span>
                        <span className={`status-indicator ${currentClockSimState.hasOutputPower ? "on" : "off"}`}>
                          {currentClockSimState.hasOutputPower ? "💡 ON" : "⚫ OFF"}
                        </span>
                      </div>
                    )}

                    <div className="clock-controls">
                      <button
                        className="icon-btn"
                        title="הזז למעלה"
                        onClick={() => moveClock(idx, "up")}
                        disabled={idx === 0}
                      >
                        ▲
                      </button>
                      <button
                        className="icon-btn"
                        title="הזז למטה"
                        onClick={() => moveClock(idx, "down")}
                        disabled={idx === clocks.length - 1}
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {/* Teeth Strip */}
                  <div className="teeth-strip-container">
                    <div className="teeth-strip-label">
                      <span>חצות (00:00)</span>
                      <span>צהריים (12:00)</span>
                      <span>חצות (24:00)</span>
                    </div>

                    <div className="teeth-grid">
                      {clock.teeth.map((isToothOn, tIdx) => {
                        const isActiveDial = activeDialPos === tIdx;
                        return (
                          <div
                            key={tIdx}
                            data-clock-id={clock.id}
                            data-tooth-index={tIdx}
                            title={`שעה ${tIdx.toString().padStart(2, "0")}:00 - לחצו וגררו לשינוי`}
                            role="switch"
                            aria-checked={isToothOn}
                            aria-label={`${displayName(clock.name)}, שן ${tIdx.toString().padStart(2, "0")}:00`}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === " " || e.key === "Enter") {
                                e.preventDefault();
                                handleToothState(clock.id, tIdx, !isToothOn);
                              }
                            }}
                            className={`tooth-cell ${isActiveDial ? "active-dial" : ""}`}
                            style={{
                              backgroundColor: isToothOn ? clock.color : "rgba(255, 255, 255, 0.05)",
                              border: isActiveDial ? `2px solid #ffffff` : `1px solid ${isToothOn ? clock.color : "rgba(255, 255, 255, 0.08)"}`,
                              boxShadow: isActiveDial ? `0 0 10px #ffffff, ${isToothOn ? `0 0 6px ${clock.color}` : 'none'}` : (isToothOn ? `0 0 6px ${clock.color}` : "none"),
                              transform: isActiveDial ? "scale(1.15)" : "none",
                              zIndex: isActiveDial ? 10 : 1,
                            }}
                            onMouseDown={() => handleMouseDown(clock.id, tIdx, isToothOn)}
                            onMouseEnter={() => handleMouseEnterTooth(clock.id, tIdx)}
                            onTouchStart={() => handleTouchStart(clock.id, tIdx, isToothOn)}
                            onTouchMove={(e) => handleTouchMove(e, clock.id)}
                            onTouchEnd={(e) => {
                              // Stop the browser's emulated mousedown after a tap, which would toggle the tooth back
                              if (e.cancelable) e.preventDefault();
                              handleMouseUpOrLeave();
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Hour markers grid */}
                    <div className="hour-markers-grid">
                      {Array.from({ length: 24 }).map((_, h) => {
                        const isMarker = h % 3 === 0;
                        return (
                          <span key={h} className={`hour-marker-text ${isMarker ? "active-marker" : ""}`}>
                            {isMarker ? h.toString().padStart(2, "0") : "·"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button className="tab-btn" onClick={resetPuzzle} style={{ alignSelf: "flex-start" }}>
            ↺ אתחול החידה
          </button>
        </section>

        {/* Right Column: Target vs Current Timelines */}
        <section className="timelines-container">
          {/* Interactive Playback Scrubber Card */}
          <div className="card playback-controls-card">
            <div className="timeline-title">⏱️ נגן סימולציה אינטראקטיבי (מותאם לנייד)</div>
            <div className="playback-row">
              <div className="playback-buttons">
                <button
                  className="icon-btn"
                  title="שעה קודמת"
                  aria-label="שעה קודמת"
                  onClick={() => {
                    setIsPlaying(false);
                    setSelectedHour((prev) => (prev - 1 + puzzle.simulationDuration) % puzzle.simulationDuration);
                  }}
                >
                  {/* RTL: time runs right-to-left on this page, so "previous" points right */}
                  ⏭
                </button>
                <button
                  className="tab-btn"
                  style={{
                    padding: "0.25rem 1rem",
                    fontSize: "0.9rem",
                    backgroundColor: isPlaying ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    borderColor: isPlaying ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)",
                    color: isPlaying ? "#f87171" : "#34d399",
                    fontWeight: 600,
                    minWidth: "75px"
                  }}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? "⏸ השהה" : "▶ הפעל"}
                </button>
                <button
                  className="icon-btn"
                  title="שעה הבאה"
                  aria-label="שעה הבאה"
                  onClick={() => {
                    setIsPlaying(false);
                    setSelectedHour((prev) => (prev + 1) % puzzle.simulationDuration);
                  }}
                >
                  ⏮
                </button>
              </div>

              <input
                type="range"
                min="0"
                max={puzzle.simulationDuration - 1}
                value={selectedHour}
                onChange={(e) => {
                  setSelectedHour(Number(e.target.value));
                  setIsPlaying(false);
                }}
                className="scrubber-slider"
                aria-label="בחירת שעה בסימולציה"
                aria-valuetext={formatHour(selectedHour)}
              />

              <div className="playback-time-label">
                {formatHour(activeHour)}
              </div>
            </div>
          </div>

          {/* Target Timeline */}
          <div className="card timeline-card">
            <div className="timeline-title">🎯 תבנית היעד (מה שנדרש להשיג)</div>
            <div className="timeline-wrapper">
              {Array.from({ length: Math.ceil(puzzle.simulationDuration / 24) }).map((_, dayIdx) => {
                const startHour = dayIdx * 24;
                const endHour = Math.min(startHour + 24, puzzle.simulationDuration);
                const dayHours = puzzle.targetTimeline.slice(startHour, endHour);

                return (
                  <div key={dayIdx} className="timeline-row">
                    <div className="timeline-header-wrap">
                      <span>יום {dayIdx + 1} - 00:00</span>
                      <span>12:00</span>
                      <span>24:00</span>
                    </div>
                    <div className="timeline-grid">
                      {dayHours.map((isOn, hOffset) => {
                        const absHour = startHour + hOffset;
                        return (
                          <div
                            key={absHour}
                            title={`יום ${dayIdx + 1}, שעה ${hOffset.toString().padStart(2, "0")}:00: ${isOn ? "דולק" : "כבוי"}`}
                            className={`timeline-cell target-timeline-cell ${isOn ? "on-state" : "off-state"}`}
                            onClick={() => {
                              setSelectedHour(absHour);
                              setIsPlaying(false);
                            }}
                            style={{ cursor: "pointer" }}
                          />
                        );
                      })}
                    </div>
                    <div className="hour-markers-grid">
                      {Array.from({ length: 24 }).map((_, h) => {
                        const isMarker = h % 3 === 0;
                        return (
                          <span key={h} className={`hour-marker-text ${isMarker ? "active-marker" : ""}`}>
                            {isMarker ? h.toString().padStart(2, "0") : "·"}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actual Simulation Output Timeline */}
          <div className="card timeline-card">
            <div className="timeline-title">💡 פלט בפועל (המצב הנוכחי)</div>
            <div className={`match-meter ${isSolved ? "complete" : ""}`} aria-live="polite">
              <div className="match-meter-text">
                התאמה ליעד: {matchCount} מתוך {puzzle.simulationDuration} שעות
                {!isSolved && ` · עוד ${puzzle.simulationDuration - matchCount} לתקן`}
              </div>
              <div className="match-meter-track">
                <div className="match-meter-fill" style={{ width: `${matchPercent}%` }} />
              </div>
            </div>
            <div className="timeline-wrapper">
              {(
                <>
                  {Array.from({ length: Math.ceil(puzzle.simulationDuration / 24) }).map((_, dayIdx) => {
                    const startHour = dayIdx * 24;
                    const endHour = Math.min(startHour + 24, puzzle.simulationDuration);
                    const dayHours = simulationResult.timeline.slice(startHour, endHour);

                    return (
                      <div key={dayIdx} className="timeline-row">
                        <div className="timeline-header-wrap">
                          <span>יום {dayIdx + 1} - 00:00</span>
                          <span>12:00</span>
                          <span>24:00</span>
                        </div>
                        <div className="timeline-grid">
                          {dayHours.map((isOn, hOffset) => {
                            const absHour = startHour + hOffset;
                            const mismatch = isOn !== puzzle.targetTimeline[absHour];
                            return (
                              <div
                                key={absHour}
                                className={`timeline-cell ${isOn ? "on-state" : "off-state"} ${mismatch ? "mismatch" : ""}`}
                                onPointerEnter={(e) => {
                                  // Touch taps must not leave a "sticky" hover that overrides the player/scrubber
                                  if (e.pointerType === "mouse") setHoveredHour(absHour);
                                }}
                                onPointerLeave={(e) => {
                                  if (e.pointerType === "mouse") setHoveredHour(null);
                                }}
                                onClick={() => {
                                  setSelectedHour(absHour);
                                  setIsPlaying(false);
                                }}
                                title={`הצביעו לפרטים • יום ${dayIdx + 1}, שעה ${hOffset.toString().padStart(2, "0")}:00: ${isOn ? "דולק" : "כבוי"}${mismatch ? (isOn ? " (צריך להיות כבוי)" : " (צריך להיות דולק)") : ""}`}
                                style={{
                                  cursor: "pointer",
                                  ...(activeHour === absHour ? { outline: "2px solid #3b82f6", outlineOffset: "1px" } : {})
                                }}
                              />
                            );
                          })}
                        </div>
                        <div className="hour-markers-grid">
                          {Array.from({ length: 24 }).map((_, h) => {
                            const isMarker = h % 3 === 0;
                            return (
                              <span key={h} className={`hour-marker-text ${isMarker ? "active-marker" : ""}`}>
                                {isMarker ? h.toString().padStart(2, "0") : "·"}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Hover Details Panel */}
          {activeHour !== null && activeStep && (
            <div className="hover-details-panel">
              <h4 className="hover-details-title">
                פרטי סימולציה לשעת בחירה: {formatHour(activeHour)}
              </h4>
              <div className="hover-clock-status">
                <span>פלט האור הראשי:</span>
                <span className={`status-indicator ${activeStep.outputPower ? "on" : "off"}`}>
                  {activeStep.outputPower ? "דולק ON" : "כבוי OFF"}
                </span>
              </div>
              {activeStep.clocks.map((clockState) => {
                const config = clocks.find((c) => c.id === clockState.clockId);
                return (
                  <div
                    key={clockState.clockId}
                    style={{
                      borderRight: `3px solid ${config?.color || "transparent"}`,
                      paddingRight: "8px",
                      marginTop: "8px",
                    }}
                  >
                    <div className="hover-clock-status">
                      <strong>{config ? displayName(config.name) : clockState.clockId}:</strong>
                      <span>
                        שן {clockState.position}:{" "}
                        <span className={`status-indicator ${config?.teeth[clockState.position] ? "on" : "off"}`}>
                          {config?.teeth[clockState.position] ? "פעיל" : "לא פעיל"}
                        </span>
                      </span>
                    </div>
                    <div className="hover-clock-status" style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
                      <span>חשמל בכניסה: {clockState.hasInputPower ? "כן" : "לא"}</span>
                      <span>חשמל ביציאה: {clockState.hasOutputPower ? "כן" : "לא"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rules / Help Card */}
          <div className="card helper-card">
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem" }}>איך עובד שעון שבת מכני?</h3>
            <ul>
              <li>שעון שבת מתקדם (מסתובב) אך ורק כאשר זורם אליו חשמל.</li>
              <li>אם שעון מסוים לא מקבל חשמל, הוא <strong>נעצר לחלוטין</strong> ומחכה עד שהחשמל יחזור.</li>
              <li>היציאה של כל שעון תידלק (ON) רק אם השעון מקבל חשמל, והשן הנוכחית שלו מכוונת למצב פעיל.</li>
              <li>כשמחברים שעונים בשרשרת, אפשר לגרום לשעון הבא להסתובב לאט יותר או במקטעים מסוימים בלבד, ובכך ליצור מחזוריות ארוכה מ-24 שעות.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

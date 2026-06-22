import { useState, useEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";

const START_YEAR = 2005;
const END_YEAR = 2106;
const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];
// Sun=0..Sat=6 → Arabic abbreviation
const DAY_ABBR_BY_JS = ["ح", "إ", "ث", "ر", "خ", "ج", "س"];

export default function Home() {
  const [level, setLevel]               = useState<1 | 2 | 3>(1);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [scrollVersion, setScrollVersion] = useState(0);

  const handleYearClick = (year: number) => { setSelectedYear(year); setLevel(2); };
  const handleMonthClick = (month: string) => { setSelectedMonth(month); setLevel(3); };

  const goBackToLevel1 = () => {
    setLevel(1);
    setTimeout(() => { setSelectedYear(null); setSelectedMonth(null); }, 500);
  };
  const goBackToLevel2 = () => {
    setLevel(2);
    setTimeout(() => { setSelectedMonth(null); }, 500);
  };
  const handleBack = () => {
    if (level === 2) goBackToLevel1();
    else if (level === 3) goBackToLevel2();
  };
  const goToToday = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(MONTHS[now.getMonth()]);
    setLevel(3);
    setScrollVersion(v => v + 1);
  };

  return (
    <div className="min-h-screen w-full bg-white text-black relative overflow-hidden" dir="rtl" data-testid="app-container">

      {/* ── Breadcrumb ── */}
      <header className="absolute top-0 right-0 px-12 pt-8 z-50">
        <nav
          className="flex items-center gap-4 select-none"
          style={{ fontFamily: "'Rakkas', serif", fontSize: "2.7rem", lineHeight: 1.2, fontWeight: 400 }}
        >
          <span
            onClick={() => level > 1 && goBackToLevel1()}
            className={`transition-colors duration-300 ${
              level > 1 ? "text-black/30 hover:text-black cursor-pointer" : "text-black"
            }`}
          >
            عمري
          </span>

          {selectedYear && level >= 2 && (
            <>
              <span className="text-black/20" style={{ fontSize: "1.6rem" }}>›</span>
              <span
                onClick={() => level > 2 && goBackToLevel2()}
                className={`transition-colors duration-300 ${
                  level > 2 ? "text-black/30 hover:text-black cursor-pointer" : "text-black"
                }`}
              >
                {selectedYear}
              </span>
            </>
          )}

          {selectedMonth && level === 3 && (
            <>
              <span className="text-black/20" style={{ fontSize: "1.6rem" }}>›</span>
              <span className="text-black">{selectedMonth}</span>
            </>
          )}
        </nav>
      </header>

      {/* نقطة اليوم — ثابتة تحت بداية الـ breadcrumb في كل المستويات */}
      <button
        onClick={goToToday}
        className="absolute right-12 top-[90px] z-50 w-5 h-5 rounded-full bg-black ring-2 ring-offset-2 ring-black transition-transform duration-300 hover:scale-125"
        title="اليوم"
      />

      {/* ── Main Content ── */}
      <main className="w-full h-screen flex flex-col justify-center items-center relative">
        <AnimatePresence mode="wait">

          {/* LEVEL 1 — عمري */}
          {level === 1 && (
            <motion.div
              key="level-1"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
              data-testid="level-1-container"
            >
              <TimelineBlock>
                <YearDots years={YEARS} onYearClick={handleYearClick} />
              </TimelineBlock>
            </motion.div>
          )}

          {/* LEVEL 2 — الشهور */}
          {level === 2 && selectedYear && (
            <motion.div
              key="level-2"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
              data-testid="level-2-container"
            >
              <TimelineBlock>
                <MonthDots
                  months={MONTHS}
                  year={selectedYear}
                  onMonthClick={handleMonthClick}
                />
              </TimelineBlock>
            </motion.div>
          )}

          {/* LEVEL 3 — الأيام */}
          {level === 3 && selectedYear && selectedMonth && (
            <motion.div
              key={`level-3-${selectedYear}-${selectedMonth}-${scrollVersion}`}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
              data-testid="level-3-container"
            >
              <TimelineBlock scrollToToday>
                <DayDots
                  year={selectedYear}
                  monthIndex={MONTHS.indexOf(selectedMonth)}
                />
              </TimelineBlock>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

/* ── Shared Timeline Block ── */
function TimelineBlock({
  children,
  scrollToToday,
}: {
  children: React.ReactNode;
  scrollToToday?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    if (scrollToToday) {
      const container = scrollRef.current;
      const todayEl = container.querySelector("[data-today]") as HTMLElement | null;
      if (todayEl) {
        // wait for paint then use getBoundingClientRect for RTL-safe centering
        setTimeout(() => {
          const cRect = container.getBoundingClientRect();
          const eRect = todayEl.getBoundingClientRect();
          const elCenter   = eRect.left + eRect.width / 2;
          const conCenter  = cRect.left + cRect.width / 2;
          container.scrollLeft += elCenter - conCenter;
        }, 80);
        return;
      }
    }
    scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [scrollToToday]);

  return (
    <div className="w-full py-8">
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto hide-scrollbar"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex items-start min-w-max relative pl-16 pr-40 pt-4 pb-12">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── useToday ── */
function useToday() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    function schedule() {
      const now      = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const timer    = setTimeout(() => { setToday(new Date()); schedule(); }, tomorrow.getTime() - now.getTime());
      return timer;
    }
    const t = schedule();
    return () => clearTimeout(t);
  }, []);
  return today;
}

/* ── Dot ── */
function Dot({ state, letter }: { state: "past" | "current" | "future"; letter?: string }) {
  return (
    <div className={`w-7 h-7 rounded-full transition-all duration-300 flex items-center justify-center ${
      state === "current" ? "bg-black ring-2 ring-offset-2 ring-black"
      : state === "past"  ? "bg-black"
      : "border-[1.5px] border-black/40 bg-white"
    }`}>
      {letter && (
        <span className={`text-[11px] leading-none select-none ${
          state === "past" || state === "current" ? "text-white" : "text-black/40"
        }`}>
          {letter}
        </span>
      )}
    </div>
  );
}

/* ── Year Dots ── */
function YearDots({ years, onYearClick }: { years: number[]; onYearClick: (y: number) => void }) {
  const today       = useToday();
  const currentYear = today.getFullYear();

  return (
    <>
      <div className="absolute top-[30px] left-0 right-20 h-[2px] bg-black/40 z-0" />
      <div className="flex items-start gap-36 z-10">
        {years.map((year) => {
          const state = year < currentYear ? "past" : year === currentYear ? "current" : "future";
          return (
            <button
              key={year}
              onClick={() => onYearClick(year)}
              className="flex flex-col items-center group outline-none"
              data-testid={`btn-year-${year}`}
              {...(state === "current" ? { "data-today": true } : {})}
            >
              <div className="group-hover:scale-150 transition-transform duration-300">
                <Dot state={state} />
              </div>
              <span className={`mt-4 text-lg font-medium whitespace-nowrap transition-colors duration-300 ${
                state === "current" ? "font-bold text-black"
                : state === "past"  ? "text-black/70 group-hover:text-black"
                : "text-black/30 group-hover:text-black/60"
              }`}>
                {year}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ── Month Dots ── */
function MonthDots({
  months,
  year,
  onMonthClick,
}: {
  months: string[];
  year: number;
  onMonthClick: (m: string) => void;
}) {
  const today        = useToday();
  const currentYear  = today.getFullYear();
  const currentMonth = today.getMonth();

  return (
    <>
      <div className="absolute top-[30px] left-0 right-20 h-[2px] bg-black/40 z-0" />
      <div className="flex items-start gap-12 z-10">
        {months.map((month, idx) => {
          const state =
            year < currentYear || (year === currentYear && idx < currentMonth) ? "past"
            : year === currentYear && idx === currentMonth ? "current"
            : "future";
          return (
            <button
              key={month}
              onClick={() => onMonthClick(month)}
              className="flex flex-col items-center group outline-none"
              data-testid={`btn-month-${idx}`}
              {...(state === "current" ? { "data-today": true } : {})}
            >
              <div className="group-hover:scale-150 transition-transform duration-300">
                <Dot state={state} />
              </div>
              <span className={`mt-4 text-lg font-medium whitespace-nowrap transition-colors duration-300 ${
                state === "current" ? "font-bold text-black"
                : state === "past"  ? "text-black/70 group-hover:text-black"
                : "text-black/30 group-hover:text-black/60"
              }`}>
                {month}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ── Day Dots ── */
function DayDots({ year, monthIndex }: { year: number; monthIndex: number }) {
  const today       = useToday();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days        = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getState = (day: number): "past" | "current" | "future" => {
    const d         = new Date(year, monthIndex, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (d < todayStart) return "past";
    if (d.getTime() === todayStart.getTime()) return "current";
    return "future";
  };

  const getDayAbbr = (day: number) => DAY_ABBR_BY_JS[new Date(year, monthIndex, day).getDay()];

  return (
    <>
      <div className="absolute top-[30px] left-0 right-20 h-[2px] bg-black/40 z-0" />
      <div className="flex items-start gap-4 z-10">
        {days.map((day) => {
          const state   = getState(day);
          const isCur   = state === "current";
          const isSat   = new Date(year, monthIndex, day).getDay() === 6;
          return (
            <Fragment key={day}>
              {isSat && (
                <div
                  className="self-stretch w-px flex-shrink-0 mx-2"
                  style={{
                    background:
                      "repeating-linear-gradient(to bottom, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 4px, transparent 4px, transparent 8px)",
                  }}
                />
              )}
              <div
                className="flex flex-col items-center"
                {...(isCur ? { "data-today": true } : {})}
              >
                <Dot state={state} letter={getDayAbbr(day)} />
                <span className={`mt-1 text-xs font-medium whitespace-nowrap ${
                  isCur              ? "font-bold text-black"
                  : state === "past" ? "text-black/60"
                  : "text-black/30"
                }`}>
                  {day}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>
    </>
  );
}

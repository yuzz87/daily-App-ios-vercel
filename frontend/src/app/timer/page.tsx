"use client"

//import ThreeBox from "./components/three/ThreeBox"
import StopwatchPanel from "./components/StopwatchPanel"
import CountdownPanel from "./components/CountdownPanel"
import { useSwipeNavigation } from "./hooks/useSwipeNavigation"

const PANEL_LABELS = ["Stopwatch", "Countdown"]

export default function TimerPage() {
  const { activeIndex, dragOffset, isDragging, goTo, containerRef, handlers } =
    useSwipeNavigation({ panelCount: PANEL_LABELS.length, threshold: 50 })

  return (
    <>
      {/*<ThreeBox />}

      {/* Panel indicator dots */}
      <div className="fixed top-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {PANEL_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => goTo(i)}
            aria-label={label}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === activeIndex ? "bg-gray-900" : "bg-gray-400/70"
            }`}
          />
        ))}
      </div>

      {/* Swipe container */}
      <div
        ref={containerRef}
        {...handlers}
        className="relative z-10 h-full overflow-hidden"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        {/* Sliding track */}
        <div
          className="flex h-full"
          style={{
            width: "200%",
            transform: `translateX(calc(${-activeIndex * 50}% + ${dragOffset}px))`,
            transition: isDragging ? "none" : "transform 300ms ease-out",
            willChange: "transform",
          }}
        >
          <div className="h-full flex-shrink-0 overflow-y-auto" style={{ width: "50%" }}>
            <StopwatchPanel />
          </div>
          <div className="h-full flex-shrink-0 overflow-y-auto" style={{ width: "50%" }}>
            <CountdownPanel />
          </div>
        </div>
      </div>
    </>
  )
}

import React, { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Loader2, ArrowDown } from "lucide-react";

// Wraps a scrollable container and adds a native-like pull-to-refresh gesture.
// Forwards its ref to the scrollable div so parents can still control scroll.
const PullToRefresh = forwardRef(({ onRefresh, className, children }, ref) => {
  const innerRef = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  useImperativeHandle(ref, () => innerRef.current);

  const handleTouchStart = (e) => {
    const el = innerRef.current;
    if (!el || refreshing) return;
    if (el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    } else {
      pulling.current = false;
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPull(Math.min(delta * 0.5, 80));
    }
  };

  const handleTouchEnd = () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull > 50) {
      setRefreshing(true);
      setPull(0);
      Promise.resolve(onRefresh?.()).finally(() => setRefreshing(false));
    } else {
      setPull(0);
    }
  };

  const indicatorHeight = refreshing ? 40 : pull;

  return (
    <div
      ref={innerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={className}
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: indicatorHeight, opacity: pull > 0 || refreshing ? 1 : 0 }}
      >
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" strokeWidth={2} />
        ) : (
          <ArrowDown
            className="h-5 w-5 text-primary transition-transform"
            style={{ transform: `rotate(${Math.min(180, pull * 3)}deg)`, opacity: Math.min(1, pull / 50) }}
            strokeWidth={2}
          />
        )}
      </div>
      {children}
    </div>
  );
});

PullToRefresh.displayName = "PullToRefresh";
export default PullToRefresh;
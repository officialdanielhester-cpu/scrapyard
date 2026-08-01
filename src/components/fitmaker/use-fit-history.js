import { useCallback, useRef, useState } from "react";

// Unlimited-ish undo/redo history for the Fit Maker design state.
// Present + past stack + future stack. Each setState pushes a snapshot.
const CAP = 200;

export function useFitHistory(initial) {
  const [state, setStateRaw] = useState(initial);
  const past = useRef([]);
  const future = useRef([]);
  const [tick, setTick] = useState(0); // force canUndo/canRedo refresh

  const setState = useCallback((next) => {
    setStateRaw((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      if (value === prev) return prev;
      past.current.push(prev);
      if (past.current.length > CAP) past.current.shift();
      future.current = [];
      setTick((t) => t + 1);
      return value;
    });
  }, []);

  const undo = useCallback(() => {
    setStateRaw((prev) => {
      if (!past.current.length) return prev;
      const last = past.current.pop();
      future.current.push(prev);
      setTick((t) => t + 1);
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setStateRaw((prev) => {
      if (!future.current.length) return prev;
      const next = future.current.pop();
      past.current.push(prev);
      setTick((t) => t + 1);
      return next;
    });
  }, []);

  const reset = useCallback((value) => {
    past.current = [];
    future.current = [];
    setTick((t) => t + 1);
    setStateRaw(value);
  }, []);

  // eslint-disable-next-line no-unused-vars
  const _ = tick;
  return { state, setState, undo, redo, reset, canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
}
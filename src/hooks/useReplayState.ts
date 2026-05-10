import { useEffect, useCallback, useRef, useReducer } from 'react';

interface ReplayStateValues {
  isPlaying: boolean;
  hasStarted: boolean;
  playbackSpeed: number;
  currentTime: number;
  selectedDriver: string | null;
  showSpeedHeatmap: boolean;
  showWeather: boolean;
  showRaceControlFeed: boolean;
  showSectorTimes: boolean;
  showTelemetry: boolean;
  showLapHistory: boolean;
  showIntervals: boolean;
  dismissedMessages: Set<string>;
}

const SPEEDS = [1, 2, 5, 10, 20];

type Action =
  | {
      type: 'SET';
      field: keyof ReplayStateValues;
      value: ReplayStateValues[keyof ReplayStateValues];
    }
  | { type: 'RESET' };

const initialState: ReplayStateValues = {
  isPlaying: false,
  hasStarted: false,
  playbackSpeed: 1,
  currentTime: 0,
  selectedDriver: null,
  showSpeedHeatmap: false,
  showWeather: true,
  showRaceControlFeed: true,
  showSectorTimes: true,
  showTelemetry: true,
  showLapHistory: true,
  showIntervals: true,
  dismissedMessages: new Set(),
};

function replayReducer(state: ReplayStateValues, action: Action): ReplayStateValues {
  switch (action.type) {
    case 'SET':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return { ...initialState, dismissedMessages: new Set() };
    default:
      return state;
  }
}

const setter =
  <K extends keyof ReplayStateValues>(dispatch: React.Dispatch<Action>, field: K) =>
  (value: ReplayStateValues[K]) =>
    dispatch({ type: 'SET', field, value } as Action);

export function useReplayState(totalDuration: number, toggleFullscreen: () => void) {
  const [state, dispatch] = useReducer(replayReducer, initialState);

  const totalDurationRef = useRef(totalDuration);
  const toggleFullscreenRef = useRef(toggleFullscreen);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    totalDurationRef.current = totalDuration;
  }, [totalDuration]);

  useEffect(() => {
    toggleFullscreenRef.current = toggleFullscreen;
  }, [toggleFullscreen]);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const cycleSpeed = useCallback(() => {
    const idx = SPEEDS.indexOf(stateRef.current.playbackSpeed);
    dispatch({ type: 'SET', field: 'playbackSpeed', value: SPEEDS[(idx + 1) % SPEEDS.length] });
  }, []);

  const seek = useCallback((time: number) => {
    dispatch({
      type: 'SET',
      field: 'currentTime',
      value: Math.max(0, Math.min(totalDurationRef.current, time)),
    });
  }, []);

  const seekRelative = useCallback((delta: number) => {
    const next = Math.max(
      0,
      Math.min(totalDurationRef.current, stateRef.current.currentTime + delta)
    );
    dispatch({ type: 'SET', field: 'currentTime', value: next });
  }, []);

  const dismissMessage = useCallback((id: string) => {
    const next = new Set(stateRef.current.dismissedMessages);
    next.add(id);
    dispatch({ type: 'SET', field: 'dismissedMessages', value: next });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'text') return;
      if (e.target instanceof HTMLTextAreaElement) return;

      const s = stateRef.current;
      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          dispatch({ type: 'SET', field: 'isPlaying', value: !s.isPlaying });
          break;
        case 'f':
        case 'F':
          toggleFullscreenRef.current();
          break;
        case 'ArrowLeft':
        case 'j':
        case 'J':
          e.preventDefault();
          dispatch({ type: 'SET', field: 'currentTime', value: Math.max(0, s.currentTime - 5) });
          break;
        case 'ArrowRight':
        case 'l':
        case 'L':
          e.preventDefault();
          dispatch({
            type: 'SET',
            field: 'currentTime',
            value: Math.min(totalDurationRef.current, s.currentTime + 5),
          });
          break;
        case 'w':
        case 'W':
          dispatch({ type: 'SET', field: 'showWeather', value: !s.showWeather });
          break;
        case 'r':
        case 'R':
          dispatch({ type: 'SET', field: 'showRaceControlFeed', value: !s.showRaceControlFeed });
          break;
        case 's':
        case 'S':
          dispatch({ type: 'SET', field: 'showSectorTimes', value: !s.showSectorTimes });
          break;
        case 't':
        case 'T':
          dispatch({ type: 'SET', field: 'showTelemetry', value: !s.showTelemetry });
          break;
        case 'h':
        case 'H':
          dispatch({ type: 'SET', field: 'showSpeedHeatmap', value: !s.showSpeedHeatmap });
          break;
        case 'i':
        case 'I':
          dispatch({ type: 'SET', field: 'showLapHistory', value: !s.showLapHistory });
          break;
        case 'g':
        case 'G':
          dispatch({ type: 'SET', field: 'showIntervals', value: !s.showIntervals });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isPlaying: state.isPlaying,
    setIsPlaying: setter(dispatch, 'isPlaying'),
    hasStarted: state.hasStarted,
    setHasStarted: setter(dispatch, 'hasStarted'),
    playbackSpeed: state.playbackSpeed,
    setPlaybackSpeed: setter(dispatch, 'playbackSpeed'),
    currentTime: state.currentTime,
    setCurrentTime: setter(dispatch, 'currentTime'),
    selectedDriver: state.selectedDriver,
    setSelectedDriver: setter(dispatch, 'selectedDriver'),
    showSpeedHeatmap: state.showSpeedHeatmap,
    setShowSpeedHeatmap: setter(dispatch, 'showSpeedHeatmap'),
    showWeather: state.showWeather,
    setShowWeather: setter(dispatch, 'showWeather'),
    showRaceControlFeed: state.showRaceControlFeed,
    setShowRaceControlFeed: setter(dispatch, 'showRaceControlFeed'),
    showSectorTimes: state.showSectorTimes,
    setShowSectorTimes: setter(dispatch, 'showSectorTimes'),
    showTelemetry: state.showTelemetry,
    setShowTelemetry: setter(dispatch, 'showTelemetry'),
    showLapHistory: state.showLapHistory,
    setShowLapHistory: setter(dispatch, 'showLapHistory'),
    showIntervals: state.showIntervals,
    setShowIntervals: setter(dispatch, 'showIntervals'),
    dismissedMessages: state.dismissedMessages,
    reset,
    cycleSpeed,
    seek,
    seekRelative,
    dismissMessage,
  };
}

import { createContext, useState, useContext, useRef, useCallback } from 'react';

const TelemetryContext = createContext(null);

export function TelemetryProvider({ children }) {
  const [isTracking, setIsTracking] = useState(false);
  const startTime = useRef(null);
  const mouseData = useRef({ totalDistance: 0, idleTime: 0, positions: [] });
  const lastPosition = useRef(null);

  const startTracking = useCallback(() => {
    startTime.current = performance.now();
    mouseData.current = { totalDistance: 0, idleTime: 0, positions: [] };
    lastPosition.current = null;
    setIsTracking(true);
    console.log('📊 Telemetry tracking started');
  }, []);

  const trackMouseMove = useCallback((event) => {
    if (!isTracking) return;

    const currentPos = { x: event.clientX, y: event.clientY };

    if (lastPosition.current) {
      const distance = Math.sqrt(
        Math.pow(currentPos.x - lastPosition.current.x, 2) +
        Math.pow(currentPos.y - lastPosition.current.y, 2)
      );
      mouseData.current.totalDistance += distance;
    }

    lastPosition.current = currentPos;
    mouseData.current.positions.push(currentPos);
  }, [isTracking]);

  const stopTracking = useCallback(() => {
    const endTime = performance.now();
    const timeTaken = Math.round(endTime - startTime.current);

    const startPos = mouseData.current.positions[0];
    const endPos = mouseData.current.positions[mouseData.current.positions.length - 1];

    let hesitationScore = 1.0;
    if (startPos && endPos) {
      const optimalDistance = Math.sqrt(
        Math.pow(endPos.x - startPos.x, 2) +
        Math.pow(endPos.y - startPos.y, 2)
      );
      if (optimalDistance > 0) {
        hesitationScore = mouseData.current.totalDistance / optimalDistance;
      }
    }

    setIsTracking(false);

    const metrics = {
      time_taken_ms: timeTaken,
      hesitation_score: parseFloat(hesitationScore.toFixed(4)),
      mouse_total_distance: parseFloat(mouseData.current.totalDistance.toFixed(2)),
      mouse_idle_time_ms: mouseData.current.idleTime,
      sample_count: mouseData.current.positions.length
    };

    console.log('📊 Telemetry stopped:', metrics);
    return metrics;
  }, []);

  const value = {
    isTracking,
    startTracking,
    stopTracking,
    trackMouseMove
  };

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within TelemetryProvider');
  }
  return context;
}
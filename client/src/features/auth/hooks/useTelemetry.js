// client/src/features/auth/hooks/useTelemetry.js
/**
 * Telemetry Hook - "Black Box" Recorder
 * 
 * Captures high-precision timing and mouse behavior data for UX research.
 * Implements privacy-preserving aggregation: raw coordinates are never stored.
 * 
 * Metrics:
 * - Time-on-task (millisecond precision using performance.now())
 * - Mouse movement patterns (hesitation proxy)
 * - Idle time detection
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Calculate Euclidean distance between two points
 */
const calculateDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Calculate hesitation score from mouse path data
 * Formula: Total Distance / Optimal Distance
 * - 1.0 = Perfect straight line movement
 * - >1.0 = Indicates searching, confusion, or hesitation
 */
const calculateHesitationScore = (totalDistance, startPos, endPos) => {
  if (!startPos || !endPos) return 0;
  
  const optimalDistance = calculateDistance(
    startPos.x, startPos.y,
    endPos.x, endPos.y
  );
  
  if (optimalDistance === 0) return 0;
  
  return totalDistance / optimalDistance;
};

export const useTelemetry = (containerRef) => {
  const [isTracking, setIsTracking] = useState(false);
  
  // Timing state
  const taskStartTime = useRef(null);
  const taskEndTime = useRef(null);
  
  // Mouse tracking state
  const mousePositions = useRef([]);
  const lastPosition = useRef(null);
  const totalDistance = useRef(0);
  const idleStartTime = useRef(null);
  const totalIdleTime = useRef(0);
  const samplingInterval = useRef(null);
  
  // Configuration
  const SAMPLING_RATE_MS = 100; // Sample every 100ms
  const IDLE_THRESHOLD_MS = 500; // Consider idle after 500ms without movement
  const MOVEMENT_THRESHOLD_PX = 5; // Minimum movement to count (avoid jitter)

  /**
   * Start tracking - called when login component mounts or user enters login area
   */
  const startTracking = useCallback(() => {
    if (isTracking) return;
    
    console.log('🎯 Telemetry: Started tracking');
    
    // Use performance.now() for monotonic, high-precision timing
    taskStartTime.current = performance.now();
    taskEndTime.current = null;
    
    // Reset mouse tracking state
    mousePositions.current = [];
    lastPosition.current = null;
    totalDistance.current = 0;
    idleStartTime.current = null;
    totalIdleTime.current = 0;
    
    setIsTracking(true);
  }, [isTracking]);

  /**
   * Stop tracking and calculate final metrics
   */
  const stopTracking = useCallback(() => {
    if (!isTracking) return null;
    
    taskEndTime.current = performance.now();
    setIsTracking(false);
    
    // Stop sampling
    if (samplingInterval.current) {
      clearInterval(samplingInterval.current);
      samplingInterval.current = null;
    }
    
    // Calculate final metrics
    const timeTaken = Math.round(taskEndTime.current - taskStartTime.current);
    
    const startPos = mousePositions.current[0];
    const endPos = mousePositions.current[mousePositions.current.length - 1];
    
    const hesitationScore = calculateHesitationScore(
      totalDistance.current,
      startPos,
      endPos
    );
    
    const metrics = {
      time_taken_ms: timeTaken,
      hesitation_score: parseFloat(hesitationScore.toFixed(4)),
      mouse_total_distance: parseFloat(totalDistance.current.toFixed(2)),
      mouse_idle_time_ms: totalIdleTime.current,
      sample_count: mousePositions.current.length
    };
    
    console.log('📊 Telemetry metrics:', metrics);
    
    return metrics;
  }, [isTracking]);

  /**
   * Reset telemetry state (for admin kiosk reset)
   */
  const resetTelemetry = useCallback(() => {
    if (samplingInterval.current) {
      clearInterval(samplingInterval.current);
    }
    
    taskStartTime.current = null;
    taskEndTime.current = null;
    mousePositions.current = [];
    lastPosition.current = null;
    totalDistance.current = 0;
    idleStartTime.current = null;
    totalIdleTime.current = 0;
    
    setIsTracking(false);
  }, []);

  /**
   * Mouse move handler - samples position and calculates distance
   */
  const handleMouseMove = useCallback((event) => {
    if (!isTracking) return;
    
    const currentPos = {
      x: event.clientX,
      y: event.clientY,
      timestamp: performance.now()
    };
    
    // First position - no distance to calculate yet
    if (!lastPosition.current) {
      lastPosition.current = currentPos;
      mousePositions.current.push(currentPos);
      idleStartTime.current = currentPos.timestamp;
      return;
    }
    
    // Calculate distance from last position
    const distance = calculateDistance(
      lastPosition.current.x,
      lastPosition.current.y,
      currentPos.x,
      currentPos.y
    );
    
    // Only count significant movements (avoid counting tiny jitters)
    if (distance >= MOVEMENT_THRESHOLD_PX) {
      totalDistance.current += distance;
      
      // Reset idle timer on movement
      if (idleStartTime.current) {
        const idleDuration = currentPos.timestamp - idleStartTime.current;
        if (idleDuration >= IDLE_THRESHOLD_MS) {
          totalIdleTime.current += idleDuration;
        }
        idleStartTime.current = null;
      }
      
      lastPosition.current = currentPos;
      mousePositions.current.push(currentPos);
    } else {
      // No significant movement - start/continue idle timer
      if (!idleStartTime.current) {
        idleStartTime.current = currentPos.timestamp;
      }
    }
  }, [isTracking]);

  /**
   * Attach mouse event listener to container
   */
  useEffect(() => {
    if (!containerRef?.current || !isTracking) return;
    
    const container = containerRef.current;
    
    // Add passive listener for better performance
    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // Start periodic sampling for consistent data collection
    // Even if mouse doesn't move, we want to know it was idle
    samplingInterval.current = setInterval(() => {
      if (lastPosition.current && idleStartTime.current) {
        const now = performance.now();
        const idleDuration = now - idleStartTime.current;
        if (idleDuration >= IDLE_THRESHOLD_MS) {
          // Update idle time without resetting (continuous idle period)
          totalIdleTime.current += SAMPLING_RATE_MS;
        }
      }
    }, SAMPLING_RATE_MS);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      if (samplingInterval.current) {
        clearInterval(samplingInterval.current);
      }
    };
  }, [containerRef, isTracking, handleMouseMove]);

  /**
   * Get current elapsed time (for real-time display)
   */
  const getCurrentElapsedTime = useCallback(() => {
    if (!taskStartTime.current) return 0;
    return Math.round(performance.now() - taskStartTime.current);
  }, []);

  return {
    isTracking,
    startTracking,
    stopTracking,
    resetTelemetry,
    getCurrentElapsedTime,
    
    // For debugging/monitoring (don't expose in production)
    _debug: {
      totalDistance: totalDistance.current,
      sampleCount: mousePositions.current.length,
      idleTime: totalIdleTime.current
    }
  };
};

/**
 * React Context Provider for global telemetry state
 */
import { createContext, useContext } from 'react';

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
  const containerRef = useRef(null);
  const telemetry = useTelemetry(containerRef);
  
  return (
    <TelemetryContext.Provider value={{ ...telemetry, containerRef }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetryContext = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetryContext must be used within TelemetryProvider');
  }
  return context;
};
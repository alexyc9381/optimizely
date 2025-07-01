/**
 * Mobile Chart Example
 * Comprehensive demonstration of mobile-responsive chart capabilities including
 * touch gestures, device detection, responsive layouts, and adaptive interactions.
 */

import React, { useCallback, useEffect, useState } from 'react';
import '../components/MobileChart.css';
import { MobileResponsiveChart } from '../components/MobileResponsiveChart';
import { DetectedGesture, DeviceInfo, mobileChartEngine } from '../MobileChartEngine';

// Sample data for different chart types
const sampleData = {
  line: [
    { x: 0, y: 10, label: 'January' },
    { x: 1, y: 25, label: 'February' },
    { x: 2, y: 15, label: 'March' },
    { x: 3, y: 35, label: 'April' },
    { x: 4, y: 20, label: 'May' },
    { x: 5, y: 45, label: 'June' }
  ],
  bar: [
    { value: 30, label: 'Mobile', color: '#007AFF' },
    { value: 45, label: 'Tablet', color: '#34C759' },
    { value: 25, label: 'Desktop', color: '#FF9500' }
  ],
  pie: [
    { value: 40, label: 'iOS', color: '#007AFF' },
    { value: 35, label: 'Android', color: '#34C759' },
    { value: 25, label: 'Other', color: '#FF9500' }
  ]
};

// Real-time mobile analytics data
const generateMobileAnalytics = () => ({
  deviceType: Math.random() > 0.5 ? 'mobile' : 'tablet',
  touchPoints: Math.floor(Math.random() * 3) + 1,
  screenSize: {
    width: 375 + Math.random() * 400,
    height: 667 + Math.random() * 400
  },
  batteryLevel: Math.random() * 100,
  networkType: ['wifi', '4g', '5g'][Math.floor(Math.random() * 3)],
  timestamp: Date.now()
});

interface MobileExampleProps {
  className?: string;
}

export const MobileExample: React.FC<MobileExampleProps> = ({ className = '' }) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [currentChartType, setCurrentChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [gestureHistory, setGestureHistory] = useState<DetectedGesture[]>([]);
  const [realTimeData, setRealTimeData] = useState(sampleData.line);
  const [touchMetrics, setTouchMetrics] = useState({
    totalTouches: 0,
    gestureCount: { tap: 0, swipe: 0, pinch: 0, pan: 0 },
    averagePressure: 0
  });

  // Initialize mobile chart engine and get device info
  useEffect(() => {
    const info = mobileChartEngine.getDeviceInfo();
    setDeviceInfo(info);

    // Setup event listeners
    const handleGesture = (event: CustomEvent) => {
      const gesture = event.detail.gesture;
      setGestureHistory(prev => [...prev.slice(-4), gesture]);

      setTouchMetrics(prev => ({
        ...prev,
        totalTouches: prev.totalTouches + 1,
        gestureCount: {
          ...prev.gestureCount,
          [gesture.type]: (prev.gestureCount[gesture.type] || 0) + 1
        }
      }));
    };

    const handleOrientationChange = () => {
      const updatedInfo = mobileChartEngine.getDeviceInfo();
      setDeviceInfo(updatedInfo);
    };

    mobileChartEngine.on('gesture:detected', handleGesture);
    mobileChartEngine.on('orientation:changed', handleOrientationChange);

    return () => {
      mobileChartEngine.off('gesture:detected', handleGesture);
      mobileChartEngine.off('orientation:changed', handleOrientationChange);
    };
  }, []);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => {
        const newData = [...prev];
        const randomIndex = Math.floor(Math.random() * newData.length);
        newData[randomIndex] = {
          ...newData[randomIndex],
          y: Math.max(5, Math.min(50, newData[randomIndex].y + (Math.random() - 0.5) * 10))
        };
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Handle gesture events
  const handleGesture = useCallback((gesture: DetectedGesture) => {
    console.log('Gesture detected:', gesture);

    // Provide haptic feedback for supported gestures
    if (['tap', 'double-tap', 'long-press'].includes(gesture.type)) {
      mobileChartEngine.provideFeedback(gesture.type === 'long-press' ? 'heavy' : 'light');
    }
  }, []);

  // Handle data point selection
  const handleDataSelect = useCallback((data: any) => {
    console.log('Data point selected:', data);
    mobileChartEngine.provideFeedback('medium');
  }, []);

  // Get current chart data based on type
  const getCurrentData = () => {
    switch (currentChartType) {
      case 'line':
        return realTimeData;
      case 'bar':
        return sampleData.bar;
      case 'pie':
        return sampleData.pie;
      default:
        return realTimeData;
    }
  };

  // Generate responsive configuration based on device
  const getResponsiveConfig = () => {
    if (!deviceInfo) return {};

    const baseConfig = {
      touch: {
        enabled: true,
        feedback: 'haptic' as const,
        gestures: mobileChartEngine.getDeviceInfo().supportedGestures
      },
      accessibility: {
        enableVoiceOver: deviceInfo.os === 'ios',
        enableScreenReader: true,
        keyboardNavigation: true,
        reducedMotion: false,
        highContrastMode: false
      }
    };

    // Device-specific optimizations
    if (deviceInfo.type === 'mobile') {
      return {
        ...baseConfig,
        ui: {
          fontSize: 10,
          touchTargetSize: 44,
          tooltipStyle: 'compact' as const,
          legendPosition: 'bottom' as const
        },
        performance: {
          enableVirtualization: true,
          maxDataPoints: 50,
          useWebGL: false
        }
      };
    } else if (deviceInfo.type === 'tablet') {
      return {
        ...baseConfig,
        ui: {
          fontSize: 12,
          touchTargetSize: 48,
          tooltipStyle: 'full' as const,
          legendPosition: 'right' as const
        },
        performance: {
          enableVirtualization: false,
          maxDataPoints: 200,
          useWebGL: true
        }
      };
    }

    return baseConfig;
  };

  if (!deviceInfo) {
    return <div className="loading">Loading mobile chart engine...</div>;
  }

  return (
    <div className={`mobile-example ${className}`}>
      {/* Header with device info */}
      <div className="example-header">
        <h2>Mobile Chart System Demo</h2>
        <div className="device-info">
          <span className="device-badge">{deviceInfo.type}</span>
          <span className="os-badge">{deviceInfo.os}</span>
          <span className="orientation-badge">{deviceInfo.orientation}</span>
          <span className="touch-badge">
            {deviceInfo.touchCapabilities.supportsMultiTouch ? 'Multi-touch' : 'Single-touch'}
          </span>
        </div>
      </div>

      {/* Chart type selector */}
      <div className="chart-controls">
        <h3>Chart Type</h3>
        <div className="button-group">
          {(['line', 'bar', 'pie'] as const).map(type => (
            <button
              key={type}
              className={`control-button ${currentChartType === type ? 'active' : ''}`}
              onClick={() => setCurrentChartType(type)}
              style={{ minHeight: deviceInfo.type === 'mobile' ? 44 : 36 }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main chart display */}
      <div className="chart-container">
        <MobileResponsiveChart
          data={getCurrentData()}
          type={currentChartType}
          config={getResponsiveConfig()}
          onGesture={handleGesture}
          onDataSelect={handleDataSelect}
          className="demo-chart"
          testId="mobile-demo-chart"
        />
      </div>

      {/* Feature showcase panels */}
      <div className="feature-panels">
        {/* Touch Metrics Panel */}
        <div className="panel touch-metrics">
          <h3>Touch Metrics</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-label">Total Touches</span>
              <span className="metric-value">{touchMetrics.totalTouches}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Taps</span>
              <span className="metric-value">{touchMetrics.gestureCount.tap}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Swipes</span>
              <span className="metric-value">{touchMetrics.gestureCount.swipe}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Pinches</span>
              <span className="metric-value">{touchMetrics.gestureCount.pinch}</span>
            </div>
          </div>
        </div>

        {/* Recent Gestures Panel */}
        <div className="panel gesture-history">
          <h3>Recent Gestures</h3>
          <div className="gesture-list">
            {gestureHistory.map((gesture, index) => (
              <div key={index} className="gesture-item">
                <span className="gesture-type">{gesture.type}</span>
                <span className="gesture-duration">{gesture.duration}ms</span>
                {gesture.direction && (
                  <span className="gesture-direction">{gesture.direction}</span>
                )}
              </div>
            ))}
            {gestureHistory.length === 0 && (
              <p className="no-gestures">Interact with the chart to see gestures</p>
            )}
          </div>
        </div>

        {/* Device Capabilities Panel */}
        <div className="panel device-capabilities">
          <h3>Device Capabilities</h3>
          <div className="capabilities-list">
            <div className="capability">
              <span className="capability-label">Multi-touch</span>
              <span className={`capability-status ${deviceInfo.touchCapabilities.supportsMultiTouch ? 'supported' : 'not-supported'}`}>
                {deviceInfo.touchCapabilities.supportsMultiTouch ? '✓' : '✗'}
              </span>
            </div>
            <div className="capability">
              <span className="capability-label">Pressure Sensitivity</span>
              <span className={`capability-status ${deviceInfo.touchCapabilities.supportsPressure ? 'supported' : 'not-supported'}`}>
                {deviceInfo.touchCapabilities.supportsPressure ? '✓' : '✗'}
              </span>
            </div>
            <div className="capability">
              <span className="capability-label">Hover Support</span>
              <span className={`capability-status ${deviceInfo.touchCapabilities.supportsHover ? 'supported' : 'not-supported'}`}>
                {deviceInfo.touchCapabilities.supportsHover ? '✓' : '✗'}
              </span>
            </div>
            <div className="capability">
              <span className="capability-label">Haptic Feedback</span>
              <span className={`capability-status ${mobileChartEngine.supportsFeature('haptic') ? 'supported' : 'not-supported'}`}>
                {mobileChartEngine.supportsFeature('haptic') ? '✓' : '✗'}
              </span>
            </div>
            <div className="capability">
              <span className="capability-label">WebGL</span>
              <span className={`capability-status ${mobileChartEngine.supportsFeature('webgl') ? 'supported' : 'not-supported'}`}>
                {mobileChartEngine.supportsFeature('webgl') ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        {/* Screen Info Panel */}
        <div className="panel screen-info">
          <h3>Screen Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Dimensions</span>
              <span className="info-value">
                {deviceInfo.screenSize.width} × {deviceInfo.screenSize.height}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Device Pixel Ratio</span>
              <span className="info-value">{deviceInfo.screenSize.devicePixelRatio}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Max Touch Points</span>
              <span className="info-value">{deviceInfo.touchCapabilities.maxTouchPoints}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Current Breakpoint</span>
              <span className="info-value">{mobileChartEngine.getCurrentBreakpoint().name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions for testing */}
      <div className="testing-instructions">
        <h3>Testing Instructions</h3>
        <div className="instruction-grid">
          <div className="instruction-item">
            <strong>Touch Gestures:</strong>
            <ul>
              <li>Single tap: Select data points</li>
              <li>Double tap: Zoom in/out</li>
              <li>Long press: Show context menu</li>
              <li>Pinch: Zoom (multi-touch devices)</li>
              <li>Swipe: Navigate or scroll</li>
            </ul>
          </div>
          <div className="instruction-item">
            <strong>Responsive Features:</strong>
            <ul>
              <li>Rotate device to test orientation changes</li>
              <li>Resize browser to test breakpoints</li>
              <li>Try different chart types</li>
              <li>Toggle touch controls</li>
            </ul>
          </div>
          <div className="instruction-item">
            <strong>Accessibility:</strong>
            <ul>
              <li>Use keyboard navigation (Tab, Arrow keys)</li>
              <li>Test with screen reader</li>
              <li>Try high contrast mode</li>
              <li>Enable reduced motion</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility component for responsive design testing
export const ResponsiveTestGrid: React.FC = () => {
  const [activeBreakpoint, setActiveBreakpoint] = useState('');

  useEffect(() => {
    const updateBreakpoint = () => {
      const bp = mobileChartEngine.getCurrentBreakpoint();
      setActiveBreakpoint(bp.name);
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, []);

  return (
    <div className="responsive-test-grid">
      <h3>Responsive Breakpoint Testing</h3>
      <div className="breakpoint-indicator">
        Current: <strong>{activeBreakpoint}</strong>
      </div>

      <div className="test-charts">
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(breakpoint => (
          <div key={breakpoint} className={`test-chart breakpoint-${breakpoint}`}>
            <h4>{breakpoint.toUpperCase()}</h4>
            <MobileResponsiveChart
              data={sampleData.line}
              type="line"
              config={{
                layout: { minHeight: 150 },
                ui: { legendPosition: 'bottom' }
              }}
              className={`test-chart-${breakpoint}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileExample;

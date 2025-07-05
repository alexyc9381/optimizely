/**
 * Mobile Chart Example
 * Comprehensive demonstration of mobile-responsive chart capabilities including
 * touch gestures, device detection, responsive layouts, and adaptive interactions.
 */

import React, { useCallback, useEffect, useState } from 'react';
import '../components/MobileChart.css';
import { MobileResponsiveChart } from '../components/MobileResponsiveChart';
import {
  DetectedGesture,
  DeviceInfo,
  mobileChartEngine,
} from '../MobileChartEngine';

// Sample data for different chart types
const sampleData = {
  line: [
    { x: 0, y: 10, label: 'January' },
    { x: 1, y: 25, label: 'February' },
    { x: 2, y: 15, label: 'March' },
    { x: 3, y: 35, label: 'April' },
    { x: 4, y: 20, label: 'May' },
    { x: 5, y: 45, label: 'June' },
  ],

  bar: [
    { value: 30, label: 'Mobile', color: '#007AFF' },
    { value: 45, label: 'Tablet', color: '#34C759' },
    { value: 25, label: 'Desktop', color: '#FF9500' },
  ],

  pie: [
    { value: 40, label: 'iOS', color: '#007AFF' },
    { value: 35, label: 'Android', color: '#34C759' },
    { value: 25, label: 'Other', color: '#FF9500' },
  ],
};

// Real-time mobile analytics data
const generateMobileAnalytics = () => ({
  deviceType: Math.random() > 0.5 ? 'mobile' : 'tablet',
  touchPoints: Math.floor(Math.random() * 3) + 1,
  screenSize: {
    width: 375 + Math.random() * 400,
    height: 667 + Math.random() * 400,
  },
  batteryLevel: Math.random() * 100,
  networkType: ['wifi', '4g', '5g'][Math.floor(Math.random() * 3)],
  timestamp: Date.now(),
});

interface MobileExampleProps {
  className?: string;
}

export const MobileExample: React.FC<MobileExampleProps> = ({
  className = '',
}) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [currentChartType, setCurrentChartType] = useState<
    'line' | 'bar' | 'pie'
  >('line');
  const [gestureHistory, setGestureHistory] = useState<DetectedGesture[]>([]);
  const [realTimeData, setRealTimeData] = useState(sampleData.line);
  const [touchMetrics, setTouchMetrics] = useState({
    totalTouches: 0,
    gestureCount: { tap: 0, swipe: 0, pinch: 0, pan: 0 },
    averagePressure: 0,
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
          [gesture.type]: (prev.gestureCount[gesture.type] || 0) + 1,
        },
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
          y: Math.max(
            5,
            Math.min(50, newData[randomIndex].y + (Math.random() - 0.5) * 10)
          ),
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
      mobileChartEngine.provideFeedback(
        gesture.type === 'long-press' ? 'heavy' : 'light'
      );
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
        gestures: mobileChartEngine.getDeviceInfo().supportedGestures,
      },
      accessibility: {
        enableVoiceOver: deviceInfo.os === 'ios',
        enableScreenReader: true,
        keyboardNavigation: true,
        reducedMotion: false,
        highContrastMode: false,
      },
    };

    // Device-specific optimizations
    if (deviceInfo.type === 'mobile') {
      return {
        ...baseConfig,
        ui: {
          fontSize: 10,
          touchTargetSize: 44,
          tooltipStyle: 'compact' as const,
          legendPosition: 'bottom' as const,
        },
        performance: {
          enableVirtualization: true,
          maxDataPoints: 50,
          useWebGL: false,
        },
      };
    } else if (deviceInfo.type === 'tablet') {
      return {
        ...baseConfig,
        ui: {
          fontSize: 12,
          touchTargetSize: 48,
          tooltipStyle: 'full' as const,
          legendPosition: 'right' as const,
        },
        performance: {
          enableVirtualization: false,
          maxDataPoints: 200,
          useWebGL: true,
        },
      };
    }

    return baseConfig;
  };

  if (!deviceInfo) {
    return (
      <div className='loading' data-oid='2sw.hey'>
        Loading mobile chart engine...
      </div>
    );
  }

  return (
    <div className={`mobile-example ${className}`} data-oid='hf668zk'>
      {/* Header with device info */}
      <div className='example-header' data-oid='05eggti'>
        <h2 data-oid='c4cz5-b'>Mobile Chart System Demo</h2>
        <div className='device-info' data-oid='jj5am1z'>
          <span className='device-badge' data-oid='5bz-x4x'>
            {deviceInfo.type}
          </span>
          <span className='os-badge' data-oid='qevu22e'>
            {deviceInfo.os}
          </span>
          <span className='orientation-badge' data-oid='d5odd3m'>
            {deviceInfo.orientation}
          </span>
          <span className='touch-badge' data-oid='zsuj9j4'>
            {deviceInfo.touchCapabilities.supportsMultiTouch
              ? 'Multi-touch'
              : 'Single-touch'}
          </span>
        </div>
      </div>

      {/* Chart type selector */}
      <div className='chart-controls' data-oid='87:zm0w'>
        <h3 data-oid='.u5pog0'>Chart Type</h3>
        <div className='button-group' data-oid='gyc69ko'>
          {(['line', 'bar', 'pie'] as const).map(type => (
            <button
              key={type}
              className={`control-button ${currentChartType === type ? 'active' : ''}`}
              onClick={() => setCurrentChartType(type)}
              style={{ minHeight: deviceInfo.type === 'mobile' ? 44 : 36 }}
              data-oid='jrul2da'
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main chart display */}
      <div className='chart-container' data-oid='jidafwd'>
        <MobileResponsiveChart
          data={getCurrentData()}
          type={currentChartType}
          config={getResponsiveConfig()}
          onGesture={handleGesture}
          onDataSelect={handleDataSelect}
          className='demo-chart'
          testId='mobile-demo-chart'
          data-oid='4p2yisl'
        />
      </div>

      {/* Feature showcase panels */}
      <div className='feature-panels' data-oid=':f5u:zw'>
        {/* Touch Metrics Panel */}
        <div className='panel touch-metrics' data-oid='qhfngly'>
          <h3 data-oid='3fb5wz3'>Touch Metrics</h3>
          <div className='metrics-grid' data-oid='1yg-s26'>
            <div className='metric' data-oid='e36bia5'>
              <span className='metric-label' data-oid='1jd6ivt'>
                Total Touches
              </span>
              <span className='metric-value' data-oid='pw9_-u1'>
                {touchMetrics.totalTouches}
              </span>
            </div>
            <div className='metric' data-oid='x65a:ny'>
              <span className='metric-label' data-oid='s5ndvvh'>
                Taps
              </span>
              <span className='metric-value' data-oid='yc-.qcb'>
                {touchMetrics.gestureCount.tap}
              </span>
            </div>
            <div className='metric' data-oid='u6vd:c8'>
              <span className='metric-label' data-oid='0f3z4wr'>
                Swipes
              </span>
              <span className='metric-value' data-oid='nzb79o5'>
                {touchMetrics.gestureCount.swipe}
              </span>
            </div>
            <div className='metric' data-oid='w4.uxz:'>
              <span className='metric-label' data-oid='7rh-nad'>
                Pinches
              </span>
              <span className='metric-value' data-oid='_jml4s2'>
                {touchMetrics.gestureCount.pinch}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Gestures Panel */}
        <div className='panel gesture-history' data-oid='wv53.f1'>
          <h3 data-oid='lz6.bh_'>Recent Gestures</h3>
          <div className='gesture-list' data-oid='jj_xbnu'>
            {gestureHistory.map((gesture, index) => (
              <div key={index} className='gesture-item' data-oid='ebne27_'>
                <span className='gesture-type' data-oid='6o-7tke'>
                  {gesture.type}
                </span>
                <span className='gesture-duration' data-oid=':zup3:n'>
                  {gesture.duration}ms
                </span>
                {gesture.direction && (
                  <span className='gesture-direction' data-oid='hy2vmgq'>
                    {gesture.direction}
                  </span>
                )}
              </div>
            ))}
            {gestureHistory.length === 0 && (
              <p className='no-gestures' data-oid='cznqs8m'>
                Interact with the chart to see gestures
              </p>
            )}
          </div>
        </div>

        {/* Device Capabilities Panel */}
        <div className='panel device-capabilities' data-oid=':k2srlx'>
          <h3 data-oid='eqh4ts8'>Device Capabilities</h3>
          <div className='capabilities-list' data-oid='d74ecz_'>
            <div className='capability' data-oid=':n1y._v'>
              <span className='capability-label' data-oid='f:gb0zm'>
                Multi-touch
              </span>
              <span
                className={`capability-status ${deviceInfo.touchCapabilities.supportsMultiTouch ? 'supported' : 'not-supported'}`}
                data-oid='phban3:'
              >
                {deviceInfo.touchCapabilities.supportsMultiTouch ? '✓' : '✗'}
              </span>
            </div>
            <div className='capability' data-oid='jiupz-7'>
              <span className='capability-label' data-oid='kclc3ac'>
                Pressure Sensitivity
              </span>
              <span
                className={`capability-status ${deviceInfo.touchCapabilities.supportsPressure ? 'supported' : 'not-supported'}`}
                data-oid='8_z-lpi'
              >
                {deviceInfo.touchCapabilities.supportsPressure ? '✓' : '✗'}
              </span>
            </div>
            <div className='capability' data-oid='tn.sh9j'>
              <span className='capability-label' data-oid='jw_gd18'>
                Hover Support
              </span>
              <span
                className={`capability-status ${deviceInfo.touchCapabilities.supportsHover ? 'supported' : 'not-supported'}`}
                data-oid='bc2__0h'
              >
                {deviceInfo.touchCapabilities.supportsHover ? '✓' : '✗'}
              </span>
            </div>
            <div className='capability' data-oid='adhtb_b'>
              <span className='capability-label' data-oid=':bx:_-1'>
                Haptic Feedback
              </span>
              <span
                className={`capability-status ${mobileChartEngine.supportsFeature('haptic') ? 'supported' : 'not-supported'}`}
                data-oid='mgaupeq'
              >
                {mobileChartEngine.supportsFeature('haptic') ? '✓' : '✗'}
              </span>
            </div>
            <div className='capability' data-oid='p39if5.'>
              <span className='capability-label' data-oid='xt:3q1:'>
                WebGL
              </span>
              <span
                className={`capability-status ${mobileChartEngine.supportsFeature('webgl') ? 'supported' : 'not-supported'}`}
                data-oid='xpo1m8p'
              >
                {mobileChartEngine.supportsFeature('webgl') ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        {/* Screen Info Panel */}
        <div className='panel screen-info' data-oid='gihdpd9'>
          <h3 data-oid='w8mq.ga'>Screen Information</h3>
          <div className='info-grid' data-oid='augl17l'>
            <div className='info-item' data-oid='n:j--0c'>
              <span className='info-label' data-oid='6q14z4w'>
                Dimensions
              </span>
              <span className='info-value' data-oid='00h5s8l'>
                {deviceInfo.screenSize.width} × {deviceInfo.screenSize.height}
              </span>
            </div>
            <div className='info-item' data-oid='7oqm7t8'>
              <span className='info-label' data-oid='84lsjil'>
                Device Pixel Ratio
              </span>
              <span className='info-value' data-oid='dhfb-o4'>
                {deviceInfo.screenSize.devicePixelRatio}
              </span>
            </div>
            <div className='info-item' data-oid='-b.ofe_'>
              <span className='info-label' data-oid='j-y_sp7'>
                Max Touch Points
              </span>
              <span className='info-value' data-oid='ibe9-q0'>
                {deviceInfo.touchCapabilities.maxTouchPoints}
              </span>
            </div>
            <div className='info-item' data-oid='u6n74ql'>
              <span className='info-label' data-oid='y5pfou0'>
                Current Breakpoint
              </span>
              <span className='info-value' data-oid='1o34ksp'>
                {mobileChartEngine.getCurrentBreakpoint().name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions for testing */}
      <div className='testing-instructions' data-oid='n4r_gob'>
        <h3 data-oid='emewqsx'>Testing Instructions</h3>
        <div className='instruction-grid' data-oid='n.864y.'>
          <div className='instruction-item' data-oid='1sh8ws6'>
            <strong data-oid='l7x2w-2'>Touch Gestures:</strong>
            <ul data-oid='58rf4g-'>
              <li data-oid='a4d:cgw'>Single tap: Select data points</li>
              <li data-oid='yt2jkye'>Double tap: Zoom in/out</li>
              <li data-oid='kin0w9o'>Long press: Show context menu</li>
              <li data-oid='.s_n4re'>Pinch: Zoom (multi-touch devices)</li>
              <li data-oid='vzj.8tk'>Swipe: Navigate or scroll</li>
            </ul>
          </div>
          <div className='instruction-item' data-oid='slgai0h'>
            <strong data-oid='3wlnlak'>Responsive Features:</strong>
            <ul data-oid='-p.bnuq'>
              <li data-oid='khunn6l'>
                Rotate device to test orientation changes
              </li>
              <li data-oid='u67gq5b'>Resize browser to test breakpoints</li>
              <li data-oid='p59oerl'>Try different chart types</li>
              <li data-oid='eed_hoz'>Toggle touch controls</li>
            </ul>
          </div>
          <div className='instruction-item' data-oid='8734k5f'>
            <strong data-oid='650w.pf'>Accessibility:</strong>
            <ul data-oid='w7i:chq'>
              <li data-oid='l4gx8nb'>
                Use keyboard navigation (Tab, Arrow keys)
              </li>
              <li data-oid='-jwbe7-'>Test with screen reader</li>
              <li data-oid='n2u8ps4'>Try high contrast mode</li>
              <li data-oid='lirbzy5'>Enable reduced motion</li>
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
    <div className='responsive-test-grid' data-oid='jtv4ohj'>
      <h3 data-oid='zb8ve0l'>Responsive Breakpoint Testing</h3>
      <div className='breakpoint-indicator' data-oid='vkyth._'>
        Current: <strong data-oid='8_q8rm3'>{activeBreakpoint}</strong>
      </div>

      <div className='test-charts' data-oid='..03wl7'>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(breakpoint => (
          <div
            key={breakpoint}
            className={`test-chart breakpoint-${breakpoint}`}
            data-oid='yo9298s'
          >
            <h4 data-oid='_2o-4.6'>{breakpoint.toUpperCase()}</h4>
            <MobileResponsiveChart
              data={sampleData.line}
              type='line'
              config={{
                layout: { minHeight: 150 },
                ui: { legendPosition: 'bottom' },
              }}
              className={`test-chart-${breakpoint}`}
              data-oid='4sm4_oa'
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileExample;

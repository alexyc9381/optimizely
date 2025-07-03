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
      <div className='loading' data-oid='qe28u55'>
        Loading mobile chart engine...
      </div>
    );
  }

  return (
    <div className={`mobile-example ${className}`} data-oid='bmcs-tx'>
      {/* Header with device info */}
      <div className='example-header' data-oid='1yvkmzw'>
        <h2 data-oid='zee7dop'>Mobile Chart System Demo</h2>
        <div className='device-info' data-oid='cqlyk-1'>
          <span className='device-badge' data-oid='jbk91-j'>
            {deviceInfo.type}
          </span>
          <span className='os-badge' data-oid='49562cb'>
            {deviceInfo.os}
          </span>
          <span className='orientation-badge' data-oid='fxujbht'>
            {deviceInfo.orientation}
          </span>
          <span className='touch-badge' data-oid='s047n:w'>
            {deviceInfo.touchCapabilities.supportsMultiTouch
              ? 'Multi-touch'
              : 'Single-touch'}
          </span>
        </div>
      </div>

      {/* Chart type selector */}
      <div className='chart-controls' data-oid='o-kpdr.'>
        <h3 data-oid='9l:1z57'>Chart Type</h3>
        <div className='button-group' data-oid='aso9aa9'>
          {(['line', 'bar', 'pie'] as const).map(type => (
            <button
              key={type}
              className={`control-button ${currentChartType === type ? 'active' : ''}`}
              onClick={() => setCurrentChartType(type)}
              style={{ minHeight: deviceInfo.type === 'mobile' ? 44 : 36 }}
              data-oid='gvjeci0'
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main chart display */}
      <div className='chart-container' data-oid='jb2.vws'>
        <MobileResponsiveChart
          data={getCurrentData()}
          type={currentChartType}
          config={getResponsiveConfig()}
          onGesture={handleGesture}
          onDataSelect={handleDataSelect}
          className='demo-chart'
          testId='mobile-demo-chart'
          data-oid='uk_ue8t'
        />
      </div>

      {/* Feature showcase panels */}
      <div className='feature-panels' data-oid='d8yemqz'>
        {/* Touch Metrics Panel */}
        <div className='panel touch-metrics' data-oid='h707b.i'>
          <h3 data-oid='9t77bfg'>Touch Metrics</h3>
          <div className='metrics-grid' data-oid='uuotfhx'>
            <div className='metric' data-oid=':nom2sx'>
              <span className='metric-label' data-oid='e.9q-w0'>
                Total Touches
              </span>
              <span className='metric-value' data-oid='kq.nk1_'>
                {touchMetrics.totalTouches}
              </span>
            </div>
            <div className='metric' data-oid='nslab2i'>
              <span className='metric-label' data-oid='izpjq73'>
                Taps
              </span>
              <span className='metric-value' data-oid='5s:5ufw'>
                {touchMetrics.gestureCount.tap}
              </span>
            </div>
            <div className='metric' data-oid='ja7:ss_'>
              <span className='metric-label' data-oid='gm9w7b6'>
                Swipes
              </span>
              <span className='metric-value' data-oid='9dl.5kt'>
                {touchMetrics.gestureCount.swipe}
              </span>
            </div>
            <div className='metric' data-oid='5jt28vh'>
              <span className='metric-label' data-oid='v4x0l_r'>
                Pinches
              </span>
              <span className='metric-value' data-oid='zp-91qe'>
                {touchMetrics.gestureCount.pinch}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Gestures Panel */}
        <div className='panel gesture-history' data-oid='cn-3c-r'>
          <h3 data-oid='vs8w7pl'>Recent Gestures</h3>
          <div className='gesture-list' data-oid='w8rz7wg'>
            {gestureHistory.map((gesture, index) => (
              <div key={index} className='gesture-item' data-oid='lkj6_wt'>
                <span className='gesture-type' data-oid='hfr9tb_'>
                  {gesture.type}
                </span>
                <span className='gesture-duration' data-oid='lzdil26'>
                  {gesture.duration}ms
                </span>
                {gesture.direction && (
                  <span className='gesture-direction' data-oid='1yv.3dp'>
                    {gesture.direction}
                  </span>
                )}
              </div>
            ))}
            {gestureHistory.length === 0 && (
              <p className='no-gestures' data-oid='69o9qy_'>
                Interact with the chart to see gestures
              </p>
            )}
          </div>
        </div>

        {/* Device Capabilities Panel */}
        <div className='panel device-capabilities' data-oid=':cxjd8h'>
          <h3 data-oid='eucanyz'>Device Capabilities</h3>
          <div className='capabilities-list' data-oid=':c2wvqu'>
            <div className='capability' data-oid='85.-wel'>
              <span className='capability-label' data-oid='thhjxb6'>
                Multi-touch
              </span>
              <span
                className={`capability-status ${deviceInfo.touchCapabilities.supportsMultiTouch ? 'supported' : 'not-supported'}`}
                data-oid='hq1nvm4'
              >
                {deviceInfo.touchCapabilities.supportsMultiTouch ? '✓' : '✗'}
              </span>
            </div>
            <div className='capability' data-oid='-yge-86'>
              <span className='capability-label' data-oid='m-xxz.f'>
                Pressure Sensitivity
              </span>
              <span
                className={`capability-status ${deviceInfo.touchCapabilities.supportsPressure ? 'supported' : 'not-supported'}`}
                data-oid='xkrlyev'
              >
                {deviceInfo.touchCapabilities.supportsPressure ? '✓' : '✗'}
              </span>
            </div>
            <div className='capability' data-oid='smx5bge'>
              <span className='capability-label' data-oid='orcewac'>
                Hover Support
              </span>
              <span
                className={`capability-status ${deviceInfo.touchCapabilities.supportsHover ? 'supported' : 'not-supported'}`}
                data-oid='38vqi9e'
              >
                {deviceInfo.touchCapabilities.supportsHover ? '✓' : '✗'}
              </span>
            </div>
            <div className='capability' data-oid='oc-dhen'>
              <span className='capability-label' data-oid='sentjz-'>
                Haptic Feedback
              </span>
              <span
                className={`capability-status ${mobileChartEngine.supportsFeature('haptic') ? 'supported' : 'not-supported'}`}
                data-oid='5l_6:6c'
              >
                {mobileChartEngine.supportsFeature('haptic') ? '✓' : '✗'}
              </span>
            </div>
            <div className='capability' data-oid='mrzh1pl'>
              <span className='capability-label' data-oid='w.rg_4f'>
                WebGL
              </span>
              <span
                className={`capability-status ${mobileChartEngine.supportsFeature('webgl') ? 'supported' : 'not-supported'}`}
                data-oid='v46212y'
              >
                {mobileChartEngine.supportsFeature('webgl') ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        {/* Screen Info Panel */}
        <div className='panel screen-info' data-oid='bgfg5pc'>
          <h3 data-oid='c_qc_3-'>Screen Information</h3>
          <div className='info-grid' data-oid='hrh_:gp'>
            <div className='info-item' data-oid='bbkl.81'>
              <span className='info-label' data-oid='0aiuid:'>
                Dimensions
              </span>
              <span className='info-value' data-oid='qd50nx9'>
                {deviceInfo.screenSize.width} × {deviceInfo.screenSize.height}
              </span>
            </div>
            <div className='info-item' data-oid='jdzo56m'>
              <span className='info-label' data-oid='su:_j3m'>
                Device Pixel Ratio
              </span>
              <span className='info-value' data-oid='k85q3im'>
                {deviceInfo.screenSize.devicePixelRatio}
              </span>
            </div>
            <div className='info-item' data-oid='-dlz:ej'>
              <span className='info-label' data-oid='_z4:xqq'>
                Max Touch Points
              </span>
              <span className='info-value' data-oid='b0k.ld8'>
                {deviceInfo.touchCapabilities.maxTouchPoints}
              </span>
            </div>
            <div className='info-item' data-oid='do:fyw7'>
              <span className='info-label' data-oid='1v3zu0p'>
                Current Breakpoint
              </span>
              <span className='info-value' data-oid='pqlj1.q'>
                {mobileChartEngine.getCurrentBreakpoint().name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions for testing */}
      <div className='testing-instructions' data-oid='v0_ocoj'>
        <h3 data-oid='n8l2xy3'>Testing Instructions</h3>
        <div className='instruction-grid' data-oid='86kzr1t'>
          <div className='instruction-item' data-oid='2zn56d:'>
            <strong data-oid='455_q0k'>Touch Gestures:</strong>
            <ul data-oid='u6n0pas'>
              <li data-oid='d7wxyea'>Single tap: Select data points</li>
              <li data-oid='g.mjwba'>Double tap: Zoom in/out</li>
              <li data-oid='01cbodq'>Long press: Show context menu</li>
              <li data-oid='._ubr.9'>Pinch: Zoom (multi-touch devices)</li>
              <li data-oid='_otg0uz'>Swipe: Navigate or scroll</li>
            </ul>
          </div>
          <div className='instruction-item' data-oid='qftl6_j'>
            <strong data-oid='4hc8qeu'>Responsive Features:</strong>
            <ul data-oid='e6ir61y'>
              <li data-oid='ve73890'>
                Rotate device to test orientation changes
              </li>
              <li data-oid='yv4ntm6'>Resize browser to test breakpoints</li>
              <li data-oid='x-m49fk'>Try different chart types</li>
              <li data-oid='-wj.p80'>Toggle touch controls</li>
            </ul>
          </div>
          <div className='instruction-item' data-oid='xmzuwwo'>
            <strong data-oid='w37spsw'>Accessibility:</strong>
            <ul data-oid='_l.srzj'>
              <li data-oid='s87r5ow'>
                Use keyboard navigation (Tab, Arrow keys)
              </li>
              <li data-oid='znaip48'>Test with screen reader</li>
              <li data-oid='diink47'>Try high contrast mode</li>
              <li data-oid='_okaf17'>Enable reduced motion</li>
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
    <div className='responsive-test-grid' data-oid='68ecz29'>
      <h3 data-oid='158xej6'>Responsive Breakpoint Testing</h3>
      <div className='breakpoint-indicator' data-oid='l3mi77j'>
        Current: <strong data-oid='xwnygev'>{activeBreakpoint}</strong>
      </div>

      <div className='test-charts' data-oid='dsjhzm_'>
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(breakpoint => (
          <div
            key={breakpoint}
            className={`test-chart breakpoint-${breakpoint}`}
            data-oid='9rwh6bo'
          >
            <h4 data-oid='_01i_fr'>{breakpoint.toUpperCase()}</h4>
            <MobileResponsiveChart
              data={sampleData.line}
              type='line'
              config={{
                layout: { minHeight: 150 },
                ui: { legendPosition: 'bottom' },
              }}
              className={`test-chart-${breakpoint}`}
              data-oid='4noutpr'
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileExample;

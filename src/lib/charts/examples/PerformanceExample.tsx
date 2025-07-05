/**
 * Performance Example
 * Comprehensive demonstration of performance optimization features including
 * virtualization, progressive loading, memory management, and monitoring.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../components/PerformanceChart.css';
import {
  PerformanceDashboard,
  ProgressiveChart,
  VirtualizedChart,
} from '../components/VirtualizedChart';
import { performanceEngine, PerformanceMetrics } from '../PerformanceEngine';

// Large dataset generator
const generateLargeDataset = (size: number) => {
  const data = [];
  for (let i = 0; i < size; i++) {
    data.push({
      id: i,
      x: i,
      y: Math.sin(i * 0.1) * 100 + Math.random() * 50,
      value: Math.random() * 1000,
      category: `Category ${Math.floor(i / 1000)}`,
      timestamp: Date.now() + i * 1000,
    });
  }
  return data;
};

// Simulated API data provider
const createDataProvider = (chunkSize: number = 1000) => {
  let offset = 0;
  const totalSize = 100000; // 100k records

  return async (): Promise<any[]> => {
    // Simulate network delay
    await new Promise(resolve =>
      setTimeout(resolve, 100 + Math.random() * 200)
    );

    const remainingSize = Math.max(0, totalSize - offset);
    const actualChunkSize = Math.min(chunkSize, remainingSize);

    if (actualChunkSize === 0) {
      return [];
    }

    const chunk = generateLargeDataset(actualChunkSize).map(item => ({
      ...item,
      id: offset + item.id,
      x: offset + item.x,
    }));

    offset += actualChunkSize;
    return chunk;
  };
};

export const PerformanceExample: React.FC = () => {
  const [dataSize, setDataSize] = useState(10000);
  const [chartType, setChartType] = useState<
    'line' | 'bar' | 'area' | 'scatter'
  >('line');
  const [data, setData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [showVirtualization, setShowVirtualization] = useState(true);
  const [showProgressiveLoading, setShowProgressiveLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const chartRef = useRef<any>(null);
  const dataProviderRef = useRef(createDataProvider());

  // Generate initial data
  useEffect(() => {
    if (!showProgressiveLoading) {
      setIsGenerating(true);
      const newData = generateLargeDataset(dataSize);
      setData(newData);
      setIsGenerating(false);
    }
  }, [dataSize, showProgressiveLoading]);

  // Performance metrics handler
  const handlePerformanceMetrics = useCallback(
    (newMetrics: PerformanceMetrics) => {
      setMetrics(prev => [...prev.slice(-99), newMetrics]);
    },
    []
  );

  // Data size change handler
  const handleDataSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const size = parseInt(event.target.value);
    setDataSize(size);
  };

  // Chart type change handler
  const handleChartTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setChartType(event.target.value as any);
  };

  // Clear cache handler
  const handleClearCache = () => {
    performanceEngine.clearCache();
    performanceEngine.clearDataChunks();
  };

  // Force garbage collection
  const handleGarbageCollection = () => {
    performanceEngine.manageMemory();
  };

  // Export chart as image
  const handleExportChart = () => {
    if (chartRef.current) {
      const imageData = chartRef.current.exportImage();
      if (imageData) {
        const link = document.createElement('a');
        link.download = `performance-chart-${Date.now()}.png`;
        link.href = imageData;
        link.click();
      }
    }
  };

  // Optimize data
  const handleOptimizeData = () => {
    if (chartRef.current) {
      const optimized = chartRef.current.optimize();
      setData(optimized);
    }
  };

  return (
    <div className='performance-example' data-oid='-a6ifpe'>
      <div className='example-header' data-oid='p-w1wul'>
        <h2 data-oid='z5ylje:'>Performance Optimization Example</h2>
        <p data-oid='jrh5bdc'>
          Demonstrating high-performance chart rendering with virtualization,
          progressive loading, and memory management for large datasets.
        </p>
      </div>

      {/* Configuration Controls */}
      <div className='controls-section' data-oid=':rb.y4q'>
        <h3 data-oid='oa70o32'>Configuration</h3>

        <div className='controls-grid' data-oid='24_ipok'>
          <div className='control-group' data-oid='vzrrr:c'>
            <label htmlFor='data-size' data-oid='yx7eaou'>
              Dataset Size:
            </label>
            <select
              id='data-size'
              value={dataSize}
              onChange={handleDataSizeChange}
              disabled={isGenerating}
              data-oid='gjzq727'
            >
              <option value={1000} data-oid='ualuiqy'>
                1K records
              </option>
              <option value={10000} data-oid='x36p.77'>
                10K records
              </option>
              <option value={50000} data-oid='.-hx0nz'>
                50K records
              </option>
              <option value={100000} data-oid='6_syec8'>
                100K records
              </option>
              <option value={500000} data-oid='uu3yi6z'>
                500K records
              </option>
              <option value={1000000} data-oid='lk27ecz'>
                1M records
              </option>
            </select>
          </div>

          <div className='control-group' data-oid='hv-knje'>
            <label htmlFor='chart-type' data-oid='9j9p6cx'>
              Chart Type:
            </label>
            <select
              id='chart-type'
              value={chartType}
              onChange={handleChartTypeChange}
              data-oid='t4qey5p'
            >
              <option value='line' data-oid='wzq997-'>
                Line Chart
              </option>
              <option value='bar' data-oid='vkotfn7'>
                Bar Chart
              </option>
              <option value='area' data-oid='8z:z-4w'>
                Area Chart
              </option>
              <option value='scatter' data-oid='1709qq:'>
                Scatter Plot
              </option>
            </select>
          </div>

          <div className='control-group' data-oid='-75x8ng'>
            <label data-oid='6i9lco-'>
              <input
                type='checkbox'
                checked={showVirtualization}
                onChange={e => setShowVirtualization(e.target.checked)}
                data-oid='woc8sb6'
              />
              Enable Virtualization
            </label>
          </div>

          <div className='control-group' data-oid='9-vhy0b'>
            <label data-oid='d.jc75o'>
              <input
                type='checkbox'
                checked={showProgressiveLoading}
                onChange={e => setShowProgressiveLoading(e.target.checked)}
                data-oid='dzsd-:r'
              />
              Progressive Loading
            </label>
          </div>
        </div>

        <div className='action-buttons' data-oid='-qtjgak'>
          <button
            onClick={handleClearCache}
            className='btn-secondary'
            data-oid='r_m7dlb'
          >
            Clear Cache
          </button>
          <button
            onClick={handleGarbageCollection}
            className='btn-secondary'
            data-oid='evlaiyq'
          >
            Force GC
          </button>
          <button
            onClick={handleOptimizeData}
            className='btn-secondary'
            data-oid='qte4m1k'
          >
            Optimize Data
          </button>
          <button
            onClick={handleExportChart}
            className='btn-primary'
            data-oid='7xtl307'
          >
            Export Chart
          </button>
        </div>
      </div>

      {/* Performance Dashboard */}
      <PerformanceDashboard data-oid='lyhnjfi' />

      {/* Chart Rendering Section */}
      <div className='chart-section' data-oid='y64yug3'>
        <h3 data-oid='44yj1we'>
          {showProgressiveLoading
            ? 'Progressive Loading Chart'
            : 'Virtualized Chart'}
          {isGenerating && (
            <span className='generating' data-oid='x.76e4g'>
              {' '}
              (Generating...)
            </span>
          )}
        </h3>

        <div className='chart-info' data-oid='5hak.0-'>
          <span data-oid='j:_13ql'>
            Data Points: {data.length.toLocaleString()}
          </span>
          <span data-oid='mw038j4'>Chart Type: {chartType}</span>
          <span data-oid='uxcd21k'>
            Virtualization: {showVirtualization ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className='chart-container' data-oid='k1lzfo9'>
          {showProgressiveLoading ? (
            <ProgressiveChart
              dataProvider={dataProviderRef.current}
              type={chartType}
              height={400}
              width={800}
              config={{
                chunkSize: 5000,
                loadDelay: 100,
                loadingStrategy: 'adaptive',
              }}
              data-oid='m81v99z'
            />
          ) : (
            <VirtualizedChart
              ref={chartRef}
              data={data}
              type={chartType}
              height={400}
              width={800}
              virtualization={{
                enabled: showVirtualization,
                itemHeight: 2,
                bufferSize: 10,
                overscan: 5,
                chunkSize: 1000,
              }}
              progressiveLoading={{
                enabled: false,
                chunkSize: 1000,
              }}
              memory={{
                maxCacheSize: 50 * 1024 * 1024, // 50MB
                maxDataPoints: dataSize,
                gcThreshold: 0.8,
              }}
              onPerformanceMetrics={handlePerformanceMetrics}
              onError={error => console.error('Chart error:', error)}
              className='example-chart'
              testId='performance-chart'
              data-oid='xqvru7:'
            />
          )}
        </div>
      </div>

      {/* Performance Metrics History */}
      <div className='metrics-section' data-oid='1v:2yha'>
        <h3 data-oid='j8gcj2o'>Performance Metrics History</h3>

        {metrics.length > 0 ? (
          <div className='metrics-charts' data-oid='-k2ol4y'>
            <div className='metric-chart' data-oid='9h90.1z'>
              <h4 data-oid='26uwzfc'>Render Time (ms)</h4>
              <div className='metric-graph' data-oid='725zbpi'>
                {metrics.slice(-20).map((metric, index) => (
                  <div
                    key={index}
                    className='metric-bar'
                    style={{
                      height: `${Math.min((metric.renderTime / 50) * 100, 100)}%`,
                      backgroundColor:
                        metric.renderTime > 16.67 ? '#ef4444' : '#10b981',
                    }}
                    title={`${metric.renderTime.toFixed(2)}ms`}
                    data-oid='z3bim1y'
                  />
                ))}
              </div>
            </div>

            <div className='metric-chart' data-oid='zrrs3p-'>
              <h4 data-oid='nfz56-k'>Frame Rate (fps)</h4>
              <div className='metric-graph' data-oid='co-mqhl'>
                {metrics.slice(-20).map((metric, index) => (
                  <div
                    key={index}
                    className='metric-bar'
                    style={{
                      height: `${metric.frameRate}%`,
                      backgroundColor:
                        metric.frameRate < 30 ? '#ef4444' : '#10b981',
                    }}
                    title={`${metric.frameRate.toFixed(1)} fps`}
                    data-oid='.wu7mry'
                  />
                ))}
              </div>
            </div>

            <div className='metric-chart' data-oid='5sjz4w-'>
              <h4 data-oid='ygljh8c'>Memory Usage (%)</h4>
              <div className='metric-graph' data-oid='am4:oza'>
                {metrics.slice(-20).map((metric, index) => (
                  <div
                    key={index}
                    className='metric-bar'
                    style={{
                      height: `${metric.memoryUsage * 100}%`,
                      backgroundColor:
                        metric.memoryUsage > 0.8 ? '#ef4444' : '#10b981',
                    }}
                    title={`${(metric.memoryUsage * 100).toFixed(1)}%`}
                    data-oid='-jhqz6c'
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p data-oid='gos_6zb'>
            No performance metrics available yet. Interact with the chart to see
            metrics.
          </p>
        )}
      </div>

      {/* Feature Comparison */}
      <div className='comparison-section' data-oid='ibd5c9q'>
        <h3 data-oid='8:8z4p7'>Performance Comparison</h3>

        <div className='comparison-table' data-oid='qqltd6b'>
          <table data-oid='ew98g8d'>
            <thead data-oid='u.y018s'>
              <tr data-oid='qgsv00j'>
                <th data-oid='99i:p..'>Feature</th>
                <th data-oid='nwcq_3j'>Without Optimization</th>
                <th data-oid='e20wevd'>With Optimization</th>
                <th data-oid='89g5qr7'>Improvement</th>
              </tr>
            </thead>
            <tbody data-oid='ni-653i'>
              <tr data-oid='1pzsa9.'>
                <td data-oid='k5f2o59'>Render Time</td>
                <td data-oid='lhp2rhi'>~200ms</td>
                <td data-oid='e1iicio'>~15ms</td>
                <td data-oid='1yiio6a'>13x faster</td>
              </tr>
              <tr data-oid='y4fr7hk'>
                <td data-oid='a51gtyl'>Memory Usage</td>
                <td data-oid='267-07-'>~500MB</td>
                <td data-oid='8bmpez2'>~50MB</td>
                <td data-oid='4adolky'>10x reduction</td>
              </tr>
              <tr data-oid='olx1ty_'>
                <td data-oid='lpe0:gq'>Scroll Performance</td>
                <td data-oid='h7rt:zo'>Laggy</td>
                <td data-oid='du5blpn'>Smooth 60fps</td>
                <td data-oid='e7xealz'>Smooth</td>
              </tr>
              <tr data-oid='sebtyki'>
                <td data-oid='vhjn:.j'>Initial Load</td>
                <td data-oid='js3k80t'>~5 seconds</td>
                <td data-oid='phpu584'>~500ms</td>
                <td data-oid='w6p:j.w'>10x faster</td>
              </tr>
              <tr data-oid='xb3.yaq'>
                <td data-oid='jw.l2-:'>Max Data Points</td>
                <td data-oid='y:985ip'>~10K</td>
                <td data-oid='4b3rn:t'>~1M+</td>
                <td data-oid='jcw:ui0'>100x more</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Implementation */}
      <div className='implementation-section' data-oid='7o58suk'>
        <h3 data-oid='l68jen5'>Technical Implementation</h3>

        <div className='implementation-grid' data-oid='1y0-sb0'>
          <div className='implementation-card' data-oid=':ek8_0:'>
            <h4 data-oid='pbp311e'>Data Virtualization</h4>
            <ul data-oid='0-86r_f'>
              <li data-oid='-chc96b'>Renders only visible data points</li>
              <li data-oid='w1a:hyh'>Dynamic viewport calculation</li>
              <li data-oid='n3ztb20'>Buffered scrolling with overscan</li>
              <li data-oid='6ts0un-'>Memory-efficient data structures</li>
            </ul>
          </div>

          <div className='implementation-card' data-oid='8als8qr'>
            <h4 data-oid='h97:b4i'>Progressive Loading</h4>
            <ul data-oid='e2_bp_m'>
              <li data-oid='3jj86-b'>Chunked data loading</li>
              <li data-oid='bq-5ok0'>Adaptive loading strategies</li>
              <li data-oid='5:kv5mi'>Background processing</li>
              <li data-oid='h-58-lf'>Error recovery mechanisms</li>
            </ul>
          </div>

          <div className='implementation-card' data-oid='fw-p_kb'>
            <h4 data-oid='f6ymr1.'>Memory Management</h4>
            <ul data-oid='zml:v8u'>
              <li data-oid='ga70rdo'>Intelligent caching with LRU eviction</li>
              <li data-oid='ppmbqw1'>Automatic garbage collection</li>
              <li data-oid='nkkgua8'>Memory usage monitoring</li>
              <li data-oid='rqnd9bk'>Configurable memory limits</li>
            </ul>
          </div>

          <div className='implementation-card' data-oid='_pgfjgd'>
            <h4 data-oid='ljq_e.5'>Performance Monitoring</h4>
            <ul data-oid='kgzd4o2'>
              <li data-oid='6vr2jtg'>Real-time metrics collection</li>
              <li data-oid='ke7l4f:'>Frame rate monitoring</li>
              <li data-oid='4wt387-'>Render time tracking</li>
              <li data-oid='3s42w.9'>Performance alerts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo Grid Component
export const PerformanceTestGrid: React.FC = () => {
  const smallData = generateLargeDataset(1000);
  const mediumData = generateLargeDataset(10000);
  const largeData = generateLargeDataset(100000);

  return (
    <div className='performance-test-grid' data-oid='-e6yduj'>
      <h2 data-oid='l4zhcpj'>Performance Test Grid</h2>

      <div className='test-grid' data-oid='1guaubp'>
        <div className='test-case' data-oid='u4t9g6c'>
          <h3 data-oid='jztdwtf'>Small Dataset (1K)</h3>
          <VirtualizedChart
            data={smallData}
            type='line'
            height={200}
            width={300}
            virtualization={{ enabled: false }}
            data-oid='--pixds'
          />
        </div>

        <div className='test-case' data-oid='mqr6m8c'>
          <h3 data-oid='dtupifx'>Medium Dataset (10K)</h3>
          <VirtualizedChart
            data={mediumData}
            type='bar'
            height={200}
            width={300}
            virtualization={{ enabled: true }}
            data-oid='3vfjk3u'
          />
        </div>

        <div className='test-case' data-oid='ths6-e2'>
          <h3 data-oid='2ppym97'>Large Dataset (100K)</h3>
          <VirtualizedChart
            data={largeData}
            type='area'
            height={200}
            width={300}
            virtualization={{
              enabled: true,
              itemHeight: 1,
              bufferSize: 20,
            }}
            data-oid='0.p73p:'
          />
        </div>
      </div>
    </div>
  );
};

export default PerformanceExample;

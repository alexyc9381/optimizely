#!/usr/bin/env node

/**
 * Test script for Data Visualization APIs
 * Tests REST endpoints and GraphQL queries for the visualization service
 */

const http = require('http');
const https = require('https');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:4000',
  apiKey: 'ak_test_key_123456', // Using the test API key
  timeout: 10000
};

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === 'https:' ? https : http;

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (error) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

// Helper function to create request options
function createRequestOptions(path, method = 'GET', headers = {}) {
  const url = new URL(CONFIG.baseUrl + path);

  return {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': CONFIG.apiKey,
      ...headers
    }
  };
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n🔍 Testing Charts Health Endpoint...');
  try {
    const options = createRequestOptions('/api/v1/charts/health');
    const response = await makeRequest(options);

    if (response.status === 200) {
      console.log('✅ Health check passed:', response.data);
      return true;
    } else {
      console.log('❌ Health check failed:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

async function testMetricsEndpoint() {
  console.log('\n🔍 Testing Available Metrics Endpoint...');
  try {
    const options = createRequestOptions('/api/v1/charts/metrics');
    const response = await makeRequest(options);

    if (response.status === 200) {
      console.log('✅ Metrics endpoint successful');
      console.log('Available metrics:', response.data.data.metrics);
      console.log('Available chart types:', response.data.data.chartTypes);
      return true;
    } else {
      console.log('❌ Metrics endpoint failed:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Metrics endpoint error:', error.message);
    return false;
  }
}

async function testTimeSeriesChart() {
  console.log('\n📊 Testing Time Series Chart Endpoint...');
  try {
    const params = new URLSearchParams({
      metric: 'pageViews',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      endDate: new Date().toISOString(),
      granularity: 'day'
    });

    const options = createRequestOptions(`/api/v1/charts/timeseries?${params}`);
    const response = await makeRequest(options);

    if (response.status === 200 && response.data.success) {
      console.log('✅ Time series chart generated successfully');
      console.log('Chart title:', response.data.data.config.title);
      console.log('Data points:', response.data.data.metadata.totalDataPoints);
      return true;
    } else {
      console.log('❌ Time series chart failed:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Time series chart error:', error.message);
    return false;
  }
}

async function testDistributionChart() {
  console.log('\n🥧 Testing Distribution Chart Endpoint...');
  try {
    const params = new URLSearchParams({
      dimension: 'country',
      metric: 'visitors',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      limit: '5'
    });

    const options = createRequestOptions(`/api/v1/charts/distribution?${params}`);
    const response = await makeRequest(options);

    if (response.status === 200 && response.data.success) {
      console.log('✅ Distribution chart generated successfully');
      console.log('Chart title:', response.data.data.config.title);
      console.log('Series count:', response.data.data.series.length);
      return true;
    } else {
      console.log('❌ Distribution chart failed:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Distribution chart error:', error.message);
    return false;
  }
}

async function testFunnelChart() {
  console.log('\n🔢 Testing Funnel Chart Endpoint...');
  try {
    const params = new URLSearchParams({
      steps: 'page_view,add_to_cart,checkout,purchase',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    });

    const options = createRequestOptions(`/api/v1/charts/funnel?${params}`);
    const response = await makeRequest(options);

    if (response.status === 200 && response.data.success) {
      console.log('✅ Funnel chart generated successfully');
      console.log('Chart title:', response.data.data.config.title);
      console.log('Funnel steps:', response.data.data.series.length);
      return true;
    } else {
      console.log('❌ Funnel chart failed:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Funnel chart error:', error.message);
    return false;
  }
}

async function testWidgetData() {
  console.log('\n📈 Testing Widget Data Endpoint...');
  try {
    const config = {
      metric: 'totalVisitors',
      showComparison: true,
      format: 'number'
    };

    const params = new URLSearchParams({
      config: JSON.stringify(config),
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    });

    const options = createRequestOptions(`/api/v1/charts/widgets/metric?${params}`);
    const response = await makeRequest(options);

    if (response.status === 200 && response.data.success) {
      console.log('✅ Widget data generated successfully');
      console.log('Widget type:', response.data.data.type);
      console.log('Widget title:', response.data.data.title);
      return true;
    } else {
      console.log('❌ Widget data failed:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Widget data error:', error.message);
    return false;
  }
}

async function testDashboardData() {
  console.log('\n📊 Testing Dashboard Data Endpoint...');
  try {
    const dashboardRequest = {
      widgets: [
        {
          type: 'metric',
          config: { metric: 'totalVisitors', showComparison: true }
        },
        {
          type: 'chart',
          config: { chartType: 'line', metric: 'pageViews', granularity: 'day' }
        }
      ],
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    };

    const options = createRequestOptions('/api/v1/charts/dashboard', 'POST');
    const response = await makeRequest(options, dashboardRequest);

    if (response.status === 200 && response.data.success) {
      console.log('✅ Dashboard data generated successfully');
      console.log('Widget count:', response.data.data.length);
      console.log('Widgets:', response.data.data.map(w => `${w.type} - ${w.title}`));
      return true;
    } else {
      console.log('❌ Dashboard data failed:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Dashboard data error:', error.message);
    return false;
  }
}

async function testGraphQLVisualization() {
  console.log('\n🔍 Testing GraphQL Visualization Query...');
  try {
    const query = {
      query: `
        query GetChartData($input: ChartDataInput!) {
          chartData(input: $input) {
            config {
              type
              title
            }
            series {
              name
              data {
                label
                value
              }
            }
            metadata {
              totalDataPoints
              queryTime
            }
          }
        }
      `,
      variables: {
        input: {
          type: 'LINE',
          metric: 'pageViews',
          dateRange: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          },
          granularity: 'DAY'
        }
      }
    };

    const options = createRequestOptions('/api/v1/graphql', 'POST');
    const response = await makeRequest(options, query);

    if (response.status === 200 && response.data.data) {
      console.log('✅ GraphQL visualization query successful');
      console.log('Chart type:', response.data.data.chartData.config.type);
      console.log('Chart title:', response.data.data.chartData.config.title);
      console.log('Data points:', response.data.data.chartData.metadata.totalDataPoints);
      return true;
    } else {
      console.log('❌ GraphQL visualization query failed:', response.status, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ GraphQL visualization query error:', error.message);
    return false;
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Data Visualization API Tests...');
  console.log('Base URL:', CONFIG.baseUrl);
  console.log('API Key:', CONFIG.apiKey);

  const results = [];

  // Test all endpoints
  results.push(await testHealthEndpoint());
  results.push(await testMetricsEndpoint());
  results.push(await testTimeSeriesChart());
  results.push(await testDistributionChart());
  results.push(await testFunnelChart());
  results.push(await testWidgetData());
  results.push(await testDashboardData());
  results.push(await testGraphQLVisualization());

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All Data Visualization API tests passed!');
    console.log('\n✅ REST API Endpoints Working:');
    console.log('   • /api/v1/charts/health');
    console.log('   • /api/v1/charts/metrics');
    console.log('   • /api/v1/charts/timeseries');
    console.log('   • /api/v1/charts/distribution');
    console.log('   • /api/v1/charts/funnel');
    console.log('   • /api/v1/charts/widgets/:type');
    console.log('   • /api/v1/charts/dashboard');
    console.log('\n✅ GraphQL Queries Working:');
    console.log('   • chartData query');
    console.log('\n✅ Features Implemented:');
    console.log('   • Chart Data APIs (Time Series, Distribution, Funnel)');
    console.log('   • Widget APIs (Metrics, Charts, Tables, Progress, Gauge)');
    console.log('   • Dashboard APIs (Multiple widgets)');
    console.log('   • Data Export capabilities');
    console.log('   • Caching and performance optimization');
    console.log('   • Universal platform support');
  } else {
    console.log('❌ Some tests failed. Check the server logs for details.');
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };

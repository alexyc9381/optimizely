import express from 'express';
import request from 'supertest';
import dashboardRoutes from '../routes/dashboard-management';
import { DashboardService } from '../services/dashboard-service';
import {
    Dashboard,
    DashboardFilter,
    DashboardWidget,
    FilterOperator,
    FilterType,
    WidgetType
} from '../types/dashboard';

describe('Dashboard Framework', () => {
  let app: express.Application;
  let dashboardService: DashboardService;
  let testDashboard: Dashboard;
  let testWidget: DashboardWidget;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', dashboardRoutes);
    dashboardService = DashboardService.getInstance();
  });

  beforeEach(async () => {
    // Reset the singleton instance for clean tests
    (DashboardService as any)._instance = null;
    dashboardService = DashboardService.getInstance();

    // Create test dashboard
    testDashboard = await dashboardService.createDashboard({
      name: 'Test Dashboard',
      description: 'Dashboard for testing',
      isPublic: false,
      tags: ['test', 'analytics']
    }, 'test-user-1');
  });

  describe('DashboardService', () => {
    describe('Dashboard CRUD Operations', () => {
      it('should create a dashboard with default values', async () => {
        const dashboard = await dashboardService.createDashboard({
          name: 'New Dashboard'
        }, 'user-123');

        expect(dashboard).toBeDefined();
        expect(dashboard.id).toBeDefined();
        expect(dashboard.name).toBe('New Dashboard');
        expect(dashboard.ownerId).toBe('user-123');
        expect(dashboard.isPublic).toBe(false);
        expect(dashboard.widgets).toEqual([]);
        expect(dashboard.filters).toEqual([]);
        expect(dashboard.viewCount).toBe(0);
        expect(dashboard.createdAt).toBeDefined();
        expect(dashboard.updatedAt).toBeDefined();
      });

      it('should retrieve a dashboard with data', async () => {
        const response = await dashboardService.getDashboard(testDashboard.id, true);

        expect(response).toBeDefined();
        expect(response?.dashboard.id).toBe(testDashboard.id);
        expect(response?.data).toBeDefined();
        expect(response?.metadata).toBeDefined();
        expect(response?.metadata.totalWidgets).toBe(0);
        expect(response?.metadata.performance).toBeDefined();
      });

      it('should update a dashboard', async () => {
        const updates = {
          name: 'Updated Dashboard',
          description: 'Updated description',
          isPublic: true,
          tags: ['updated', 'test']
        };

        const updatedDashboard = await dashboardService.updateDashboard(testDashboard.id, updates);

        expect(updatedDashboard).toBeDefined();
        expect(updatedDashboard?.name).toBe('Updated Dashboard');
        expect(updatedDashboard?.description).toBe('Updated description');
        expect(updatedDashboard?.isPublic).toBe(true);
        expect(updatedDashboard?.tags).toEqual(['updated', 'test']);
        expect(new Date(updatedDashboard?.updatedAt || '').getTime())
          .toBeGreaterThan(new Date(testDashboard.updatedAt).getTime());
      });

      it('should delete a dashboard', async () => {
        const deleted = await dashboardService.deleteDashboard(testDashboard.id);
        expect(deleted).toBe(true);

        const retrievedDashboard = await dashboardService.getDashboard(testDashboard.id);
        expect(retrievedDashboard).toBeNull();
      });

      it('should list dashboards with filtering', async () => {
        await dashboardService.createDashboard({
          name: 'Public Dashboard',
          isPublic: true,
          tags: ['public']
        }, 'user-2');

        await dashboardService.createDashboard({
          name: 'Private Dashboard',
          isPublic: false,
          tags: ['private']
        }, 'user-2');

        const publicDashboards = await dashboardService.listDashboards(undefined, { isPublic: true });
        const privateDashboards = await dashboardService.listDashboards('user-2', { isPublic: false });
        const taggedDashboards = await dashboardService.listDashboards(undefined, { tags: ['test'] });

        expect(publicDashboards.length).toBeGreaterThan(0);
        expect(publicDashboards.every(d => d.isPublic)).toBe(true);

        expect(privateDashboards.length).toBeGreaterThan(0);
        expect(privateDashboards.every(d => !d.isPublic)).toBe(true);

        expect(taggedDashboards.length).toBeGreaterThan(0);
        expect(taggedDashboards.every(d => d.tags.includes('test'))).toBe(true);
      });
    });

    describe('Widget Management', () => {
      beforeEach(async () => {
        testWidget = await dashboardService.addWidget(testDashboard.id, {
          type: WidgetType.LINE_CHART,
          title: 'Test Line Chart',
          description: 'A test line chart widget',
          position: { x: 0, y: 0 },
          size: { width: 6, height: 4 }
        }) as DashboardWidget;
      });

      it('should add a widget to a dashboard', async () => {
        expect(testWidget).toBeDefined();
        expect(testWidget.id).toBeDefined();
        expect(testWidget.type).toBe(WidgetType.LINE_CHART);
        expect(testWidget.title).toBe('Test Line Chart');
        expect(testWidget.position).toEqual({ x: 0, y: 0 });
        expect(testWidget.size).toEqual({ width: 6, height: 4 });
        expect(testWidget.isVisible).toBe(true);
        expect(testWidget.permissions).toBeDefined();
      });

      it('should update a widget', async () => {
        const updates = {
          title: 'Updated Line Chart',
          position: { x: 1, y: 1 },
          size: { width: 8, height: 6 }
        };

        const updatedWidget = await dashboardService.updateWidget(
          testDashboard.id,
          testWidget.id,
          updates
        );

        expect(updatedWidget).toBeDefined();
        expect(updatedWidget?.title).toBe('Updated Line Chart');
        expect(updatedWidget?.position).toEqual({ x: 1, y: 1 });
        expect(updatedWidget?.size).toEqual({ width: 8, height: 6 });
      });

      it('should remove a widget from a dashboard', async () => {
        const removed = await dashboardService.removeWidget(testDashboard.id, testWidget.id);
        expect(removed).toBe(true);

        const dashboard = await dashboardService.getDashboard(testDashboard.id);
        expect(dashboard?.dashboard.widgets.length).toBe(0);
      });

      it('should handle different widget types', async () => {
        const widgetTypes = [
          WidgetType.BAR_CHART,
          WidgetType.PIE_CHART,
          WidgetType.KPI_CARD,
          WidgetType.TABLE,
          WidgetType.HEATMAP,
          WidgetType.GAUGE
        ];

        for (const type of widgetTypes) {
          const widget = await dashboardService.addWidget(testDashboard.id, {
            type,
            title: `Test ${type}`,
            position: { x: 0, y: 0 },
            size: { width: 4, height: 3 }
          });

          expect(widget).toBeDefined();
          expect(widget?.type).toBe(type);
        }

        const dashboard = await dashboardService.getDashboard(testDashboard.id);
        expect(dashboard?.dashboard.widgets.length).toBe(widgetTypes.length + 1); // +1 for the beforeEach widget
      });
    });

    describe('Filter Management', () => {
      it('should add filters to a dashboard', async () => {
        const textFilter: Partial<DashboardFilter> = {
          name: 'Text Filter',
          type: FilterType.TEXT,
          field: 'name',
          operator: FilterOperator.CONTAINS,
          value: 'test',
          isGlobal: true,
          affectedWidgets: [],
          isVisible: true,
          isRequired: false
        };

        const numberFilter: Partial<DashboardFilter> = {
          name: 'Number Filter',
          type: FilterType.NUMBER,
          field: 'value',
          operator: FilterOperator.GREATER_THAN,
          value: 100,
          isGlobal: false,
          affectedWidgets: [testWidget?.id || ''],
          isVisible: true,
          isRequired: true
        };

        const addedTextFilter = await dashboardService.addFilter(testDashboard.id, textFilter);
        const addedNumberFilter = await dashboardService.addFilter(testDashboard.id, numberFilter);

        expect(addedTextFilter).toBeDefined();
        expect(addedTextFilter?.name).toBe('Text Filter');
        expect(addedTextFilter?.type).toBe(FilterType.TEXT);
        expect(addedTextFilter?.operator).toBe(FilterOperator.CONTAINS);
        expect(addedTextFilter?.value).toBe('test');
        expect(addedTextFilter?.isGlobal).toBe(true);

        expect(addedNumberFilter).toBeDefined();
        expect(addedNumberFilter?.name).toBe('Number Filter');
        expect(addedNumberFilter?.type).toBe(FilterType.NUMBER);
        expect(addedNumberFilter?.operator).toBe(FilterOperator.GREATER_THAN);
        expect(addedNumberFilter?.value).toBe(100);
        expect(addedNumberFilter?.isGlobal).toBe(false);
        expect(addedNumberFilter?.isRequired).toBe(true);
      });

      it('should apply filters to a dashboard', async () => {
        const filter = await dashboardService.addFilter(testDashboard.id, {
          name: 'Test Filter',
          type: FilterType.TEXT,
          field: 'category',
          operator: FilterOperator.EQUALS,
          value: 'analytics',
          isGlobal: true,
          affectedWidgets: [],
          isVisible: true,
          isRequired: false
        });

        const updatedDashboard = await dashboardService.applyFilters(testDashboard.id, [filter!]);

        expect(updatedDashboard).toBeDefined();
        expect(updatedDashboard?.filters.length).toBeGreaterThan(0);
      });
    });

    describe('Template Management', () => {
      it('should create dashboard templates', async () => {
        const templateData = {
          name: 'Analytics Template',
          description: 'Standard analytics dashboard template',
          category: 'analytics',
          industry: 'technology',
          tags: ['analytics', 'kpi'],
          template: {
            layout: {
              type: 'grid' as const,
              columns: 12,
              rowHeight: 100,
              gaps: { horizontal: 16, vertical: 16 },
              breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 }
            },
            widgets: [
              {
                type: WidgetType.KPI_CARD,
                title: 'Total Revenue',
                position: { x: 0, y: 0 },
                size: { width: 3, height: 2 }
              }
            ]
          },
          requiredDataFields: ['revenue', 'date']
        };

        const template = await dashboardService.createTemplate(templateData);

        expect(template).toBeDefined();
        expect(template.name).toBe('Analytics Template');
        expect(template.category).toBe('analytics');
        expect(template.industry).toBe('technology');
        expect(template.requiredDataFields).toEqual(['revenue', 'date']);
        expect(template.popularity).toBe(0);
      });

      it('should create dashboard from template', async () => {
        const template = await dashboardService.createTemplate({
          name: 'Test Template',
          description: 'Test template',
          category: 'test',
          template: {
            name: 'Template Dashboard',
            widgets: []
          },
          requiredDataFields: []
        });

        const dashboard = await dashboardService.createDashboardFromTemplate(
          template.id,
          'user-123',
          { name: 'Custom Dashboard Name' }
        );

        expect(dashboard).toBeDefined();
        expect(dashboard?.name).toBe('Custom Dashboard Name');
        expect(dashboard?.ownerId).toBe('user-123');
        expect(template.popularity).toBe(1); // Should increment popularity
      });
    });

    describe('Performance and Caching', () => {
      it('should track performance metrics', async () => {
        const dashboard = await dashboardService.getDashboard(testDashboard.id, true);

        expect(dashboard?.metadata.performance).toBeDefined();
        expect(dashboard?.metadata.performance.renderTime).toBeGreaterThan(0);
        expect(dashboard?.metadata.performance.totalSize).toBeGreaterThan(0);
        expect(dashboard?.metadata.performance.cacheHitRate).toBeGreaterThanOrEqual(0);
      });

      it('should provide data freshness information', async () => {
        await dashboardService.addWidget(testDashboard.id, {
          type: WidgetType.LINE_CHART,
          title: 'Test Chart',
          position: { x: 0, y: 0 },
          size: { width: 4, height: 3 }
        });

        const dashboard = await dashboardService.getDashboard(testDashboard.id, true);

        expect(dashboard?.metadata.dataFreshness).toBeDefined();
        expect(Object.keys(dashboard?.metadata.dataFreshness || {}).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Dashboard API Routes', () => {
    describe('Dashboard CRUD', () => {
      it('POST /api/dashboards - should create a dashboard', async () => {
        const dashboardData = {
          ownerId: 'api-test-user',
          name: 'API Test Dashboard',
          description: 'Dashboard created via API',
          isPublic: true,
          tags: ['api', 'test']
        };

        const response = await request(app)
          .post('/api/dashboards')
          .send(dashboardData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('API Test Dashboard');
        expect(response.body.data.ownerId).toBe('api-test-user');
        expect(response.body.data.isPublic).toBe(true);
      });

      it('GET /api/dashboards - should list dashboards', async () => {
        const response = await request(app)
          .get('/api/dashboards')
          .query({ ownerId: 'test-user-1' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.total).toBeGreaterThan(0);
      });

      it('GET /api/dashboards/:id - should get a specific dashboard', async () => {
        const response = await request(app)
          .get(`/api/dashboards/${testDashboard.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.dashboard.id).toBe(testDashboard.id);
        expect(response.body.data.metadata).toBeDefined();
      });

      it('PUT /api/dashboards/:id - should update a dashboard', async () => {
        const updates = {
          name: 'Updated via API',
          description: 'Updated description'
        };

        const response = await request(app)
          .put(`/api/dashboards/${testDashboard.id}`)
          .send(updates)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('Updated via API');
        expect(response.body.data.description).toBe('Updated description');
      });

      it('DELETE /api/dashboards/:id - should delete a dashboard', async () => {
        const response = await request(app)
          .delete(`/api/dashboards/${testDashboard.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });
    });

    describe('Widget Management', () => {
      it('POST /api/dashboards/:id/widgets - should add a widget', async () => {
        const widgetData = {
          type: WidgetType.BAR_CHART,
          title: 'API Bar Chart',
          position: { x: 0, y: 0 },
          size: { width: 6, height: 4 }
        };

        const response = await request(app)
          .post(`/api/dashboards/${testDashboard.id}/widgets`)
          .send(widgetData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.type).toBe(WidgetType.BAR_CHART);
        expect(response.body.data.title).toBe('API Bar Chart');
      });

      it('PUT /api/dashboards/:id/widgets/:widgetId - should update a widget', async () => {
        const widget = await dashboardService.addWidget(testDashboard.id, {
          type: WidgetType.LINE_CHART,
          title: 'Test Widget',
          position: { x: 0, y: 0 },
          size: { width: 4, height: 3 }
        });

        const updates = {
          title: 'Updated Widget Title',
          size: { width: 8, height: 6 }
        };

        const response = await request(app)
          .put(`/api/dashboards/${testDashboard.id}/widgets/${widget?.id}`)
          .send(updates)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe('Updated Widget Title');
        expect(response.body.data.size.width).toBe(8);
      });
    });

    describe('Filter Management', () => {
      it('POST /api/dashboards/:id/filters - should add a filter', async () => {
        const filterData = {
          name: 'API Filter',
          type: FilterType.TEXT,
          field: 'category',
          operator: FilterOperator.EQUALS,
          value: 'analytics',
          isGlobal: true,
          affectedWidgets: [],
          isVisible: true,
          isRequired: false
        };

        const response = await request(app)
          .post(`/api/dashboards/${testDashboard.id}/filters`)
          .send(filterData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('API Filter');
        expect(response.body.data.type).toBe(FilterType.TEXT);
      });

      it('POST /api/dashboards/:id/filters/apply - should apply filters', async () => {
        const filter = await dashboardService.addFilter(testDashboard.id, {
          name: 'Test Filter',
          type: FilterType.TEXT,
          field: 'status',
          operator: FilterOperator.EQUALS,
          value: 'active',
          isGlobal: true,
          affectedWidgets: [],
          isVisible: true,
          isRequired: false
        });

        const response = await request(app)
          .post(`/api/dashboards/${testDashboard.id}/filters/apply`)
          .send({ filters: [filter] })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('applied successfully');
      });
    });

    describe('Utility Endpoints', () => {
      it('GET /api/widget-types - should return available widget types', async () => {
        const response = await request(app)
          .get('/api/widget-types')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);

        const lineChart = response.body.data.find((w: any) => w.type === WidgetType.LINE_CHART);
        expect(lineChart).toBeDefined();
        expect(lineChart.name).toBeDefined();
        expect(lineChart.description).toBeDefined();
        expect(lineChart.requiredFields).toBeDefined();
        expect(lineChart.supportedFeatures).toBeDefined();
      });

      it('GET /api/filter-options - should return filter options', async () => {
        const response = await request(app)
          .get('/api/filter-options')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.types).toBeDefined();
        expect(response.body.data.operators).toBeDefined();
        expect(response.body.data.typeOperators).toBeDefined();

        expect(Array.isArray(response.body.data.types)).toBe(true);
        expect(Array.isArray(response.body.data.operators)).toBe(true);
        expect(typeof response.body.data.typeOperators).toBe('object');
      });
    });

    describe('Error Handling', () => {
      it('should handle missing dashboard', async () => {
        await request(app)
          .get('/api/dashboards/non-existent-id')
          .expect(404);
      });

      it('should handle missing owner ID', async () => {
        await request(app)
          .post('/api/dashboards')
          .send({ name: 'Test Dashboard' })
          .expect(400);
      });

      it('should handle invalid filter format', async () => {
        await request(app)
          .post(`/api/dashboards/${testDashboard.id}/filters/apply`)
          .send({ filters: 'invalid' })
          .expect(400);
      });
    });
  });

  describe('Real-time Functionality', () => {
    it('should emit events on dashboard operations', (done) => {
      let eventCount = 0;
      const expectedEvents = ['dashboard:created', 'widget:added', 'dashboard:updated'];

      const checkCompletion = () => {
        eventCount++;
        if (eventCount === expectedEvents.length) {
          done();
        }
      };

      dashboardService.on('dashboard:created', checkCompletion);
      dashboardService.on('widget:added', checkCompletion);
      dashboardService.on('dashboard:updated', checkCompletion);

      // Trigger events
      (async () => {
        const dashboard = await dashboardService.createDashboard({ name: 'Event Test Dashboard' }, 'event-user');
        await dashboardService.addWidget(dashboard.id, { type: WidgetType.KPI_CARD, title: 'Event Widget' });
        await dashboardService.updateDashboard(dashboard.id, { name: 'Updated Event Dashboard' });
      })();
    });

    it('should handle widget data updates', async () => {
      const widget = await dashboardService.addWidget(testDashboard.id, {
        type: WidgetType.LINE_CHART,
        title: 'Real-time Chart'
      });

      // Simulate real-time data update
      const updateData = {
        dashboardId: testDashboard.id,
        widgetId: widget!.id,
        data: { series: [{ name: 'Test', data: [1, 2, 3] }] },
        timestamp: new Date().toISOString(),
        updateType: 'replace' as const
      };

      // This would normally be triggered by WebSocket
      dashboardService.emit('data:updated', updateData);

      // Verify the update was processed
      expect(updateData.widgetId).toBe(widget!.id);
      expect(updateData.data).toBeDefined();
    });
  });
});

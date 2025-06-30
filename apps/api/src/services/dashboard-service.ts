import { EventEmitter } from 'events';
import WebSocket from 'ws';
import {
    Dashboard,
    DashboardFilter,
    DashboardResponse,
    DashboardShare,
    DashboardTemplate,
    DashboardWidget,
    DataSource,
    FilterOperator,
    FilterType,
    PerformanceMetrics,
    WebSocketMessage,
    WidgetFilter,
    WidgetType
} from '../types/dashboard';

export class DashboardService extends EventEmitter {
  private static instance: DashboardService;
  private dashboards: Map<string, Dashboard> = new Map();
  private templates: Map<string, DashboardTemplate> = new Map();
  private shares: Map<string, DashboardShare> = new Map();
  private websocketConnections: Map<string, WebSocket[]> = new Map();
  private dataCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();

  private constructor() {
    super();
    this.initializeDefaultTemplates();
    this.startCacheCleanup();
  }

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  // Dashboard CRUD Operations
  async createDashboard(dashboardData: Partial<Dashboard>, ownerId: string): Promise<Dashboard> {
    const startTime = Date.now();

    const dashboard: Dashboard = {
      id: this.generateId(),
      name: dashboardData.name || 'Untitled Dashboard',
      description: dashboardData.description,
      ownerId,
      isPublic: dashboardData.isPublic || false,
      layout: dashboardData.layout || this.getDefaultLayout(),
      widgets: dashboardData.widgets || [],
      filters: dashboardData.filters || [],
      settings: dashboardData.settings || this.getDefaultSettings(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 0,
      tags: dashboardData.tags || []
    };

    this.dashboards.set(dashboard.id, dashboard);

    // Initialize performance tracking
    this.performanceMetrics.set(dashboard.id, {
      renderTime: Date.now() - startTime,
      dataLoadTime: 0,
      totalSize: JSON.stringify(dashboard).length,
      cacheHitRate: 0
    });

    this.emit('dashboard:created', dashboard);
    return dashboard;
  }

  async getDashboard(dashboardId: string, includeData: boolean = true): Promise<DashboardResponse | null> {
    const startTime = Date.now();
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return null;
    }

    // Update view count and last viewed
    dashboard.viewCount++;
    dashboard.lastViewedAt = new Date().toISOString();
    dashboard.updatedAt = new Date().toISOString();

    let data: Record<string, any> = {};
    let totalDataLoadTime = 0;

    if (includeData) {
      // Load data for all widgets
      for (const widget of dashboard.widgets) {
        const widgetDataStartTime = Date.now();
        const widgetData = await this.getWidgetData(widget);
        data[widget.id] = widgetData;
        totalDataLoadTime += Date.now() - widgetDataStartTime;
      }
    }

    const metrics = this.performanceMetrics.get(dashboardId) || this.getDefaultMetrics();
    metrics.renderTime = Date.now() - startTime;
    metrics.dataLoadTime = totalDataLoadTime;
    this.performanceMetrics.set(dashboardId, metrics);

    const response: DashboardResponse = {
      dashboard,
      data,
      metadata: {
        totalWidgets: dashboard.widgets.length,
        lastRefresh: new Date().toISOString(),
        dataFreshness: this.getDataFreshness(dashboard.widgets),
        performance: metrics
      }
    };

    this.emit('dashboard:viewed', { dashboardId, userId: dashboard.ownerId });
    return response;
  }

  async updateDashboard(dashboardId: string, updates: Partial<Dashboard>): Promise<Dashboard | null> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return null;
    }

    const updatedDashboard = {
      ...dashboard,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.dashboards.set(dashboardId, updatedDashboard);
    this.emit('dashboard:updated', updatedDashboard);

    // Notify real-time connections
    this.broadcastUpdate(dashboardId, {
      type: 'dashboard_updated',
      payload: updatedDashboard,
      timestamp: new Date().toISOString()
    });

    return updatedDashboard;
  }

  async deleteDashboard(dashboardId: string): Promise<boolean> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return false;
    }

    this.dashboards.delete(dashboardId);
    this.performanceMetrics.delete(dashboardId);

    // Clean up associated data
    this.cleanupDashboardData(dashboardId);

    this.emit('dashboard:deleted', { dashboardId, dashboard });
    return true;
  }

  async listDashboards(ownerId?: string, filters?: { tags?: string[]; isPublic?: boolean }): Promise<Dashboard[]> {
    let dashboards = Array.from(this.dashboards.values());

    if (ownerId) {
      dashboards = dashboards.filter(d => d.ownerId === ownerId || d.isPublic);
    }

    if (filters) {
      if (filters.tags && filters.tags.length > 0) {
        dashboards = dashboards.filter(d =>
          filters.tags!.some(tag => d.tags.includes(tag))
        );
      }

      if (filters.isPublic !== undefined) {
        dashboards = dashboards.filter(d => d.isPublic === filters.isPublic);
      }
    }

    return dashboards.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // Widget Management
  async addWidget(dashboardId: string, widget: Partial<DashboardWidget>): Promise<DashboardWidget | null> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return null;
    }

    const newWidget: DashboardWidget = {
      id: this.generateId(),
      type: widget.type || WidgetType.LINE_CHART,
      title: widget.title || 'Untitled Widget',
      description: widget.description,
      position: widget.position || { x: 0, y: 0 },
      size: widget.size || { width: 4, height: 3 },
      configuration: widget.configuration || this.getDefaultWidgetConfiguration(widget.type || WidgetType.LINE_CHART),
      dataSource: widget.dataSource || this.getDefaultDataSource(),
      filters: widget.filters || [],
      refreshInterval: widget.refreshInterval,
      isVisible: widget.isVisible !== undefined ? widget.isVisible : true,
      permissions: widget.permissions || this.getDefaultWidgetPermissions(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dashboard.widgets.push(newWidget);
    dashboard.updatedAt = new Date().toISOString();

    this.emit('widget:added', { dashboardId, widget: newWidget });
    return newWidget;
  }

  async updateWidget(dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget | null> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return null;
    }

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);

    if (widgetIndex === -1) {
      return null;
    }

    const updatedWidget = {
      ...dashboard.widgets[widgetIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    dashboard.widgets[widgetIndex] = updatedWidget;
    dashboard.updatedAt = new Date().toISOString();

    this.emit('widget:updated', { dashboardId, widget: updatedWidget });
    return updatedWidget;
  }

  async removeWidget(dashboardId: string, widgetId: string): Promise<boolean> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return false;
    }

    const initialLength = dashboard.widgets.length;
    dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);

    if (dashboard.widgets.length === initialLength) {
      return false;
    }

    dashboard.updatedAt = new Date().toISOString();
    this.emit('widget:removed', { dashboardId, widgetId });
    return true;
  }

  // Filter Management
  async addFilter(dashboardId: string, filter: Partial<DashboardFilter>): Promise<DashboardFilter | null> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return null;
    }

    const newFilter: DashboardFilter = {
      id: this.generateId(),
      name: filter.name || 'New Filter',
      type: filter.type || FilterType.TEXT,
      field: filter.field || '',
      operator: filter.operator || FilterOperator.EQUALS,
      value: filter.value,
      isGlobal: filter.isGlobal || false,
      affectedWidgets: filter.affectedWidgets || [],
      isVisible: filter.isVisible !== undefined ? filter.isVisible : true,
      isRequired: filter.isRequired || false
    };

    dashboard.filters.push(newFilter);
    dashboard.updatedAt = new Date().toISOString();

    this.emit('filter:added', { dashboardId, filter: newFilter });
    return newFilter;
  }

  async applyFilters(dashboardId: string, filters: DashboardFilter[]): Promise<Dashboard | null> {
    const dashboard = this.dashboards.get(dashboardId);

    if (!dashboard) {
      return null;
    }

    // Apply filters and refresh affected widgets
    for (const filter of filters) {
      if (filter.isGlobal) {
        // Apply to all widgets
        for (const widget of dashboard.widgets) {
          await this.refreshWidgetData(widget, [filter]);
        }
      } else {
        // Apply to specific widgets
        for (const widgetId of filter.affectedWidgets) {
          const widget = dashboard.widgets.find(w => w.id === widgetId);
          if (widget) {
            await this.refreshWidgetData(widget, [filter]);
          }
        }
      }
    }

    dashboard.updatedAt = new Date().toISOString();
    this.emit('filters:applied', { dashboardId, filters });

    return dashboard;
  }

  // Data Management
  private async getWidgetData(widget: DashboardWidget): Promise<any> {
    const cacheKey = this.generateCacheKey(widget);
    const cached = this.dataCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      // Update cache hit rate
      const metrics = this.performanceMetrics.get(widget.id);
      if (metrics) {
        metrics.cacheHitRate = Math.min(100, metrics.cacheHitRate + 1);
      }
      return cached.data;
    }

    // Simulate data fetching based on data source
    const data = await this.fetchDataFromSource(widget.dataSource, widget);

    // Cache the data
    if (widget.dataSource.caching.enabled) {
      this.dataCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: widget.dataSource.caching.ttl
      });
    }

    return data;
  }

  private async fetchDataFromSource(dataSource: DataSource, widget: DashboardWidget): Promise<any> {
    // This would integrate with actual data sources
    // For now, return mock data based on widget type
    return this.generateMockData(widget.type, dataSource.query.parameters);
  }

  private async refreshWidgetData(widget: DashboardWidget, filters: DashboardFilter[]): Promise<void> {
    // Clear cache for widget
    const cacheKey = this.generateCacheKey(widget);
    this.dataCache.delete(cacheKey);

    // Apply filters to data source query
    const modifiedDataSource = { ...widget.dataSource };

    for (const filter of filters) {
      this.applyFilterToQuery(modifiedDataSource, filter);
    }

    // Fetch new data
    const newData = await this.fetchDataFromSource(modifiedDataSource, widget);

    // Broadcast update to real-time connections
    this.broadcastUpdate(widget.id, {
      type: 'data_update',
      payload: { widgetId: widget.id, data: newData },
      timestamp: new Date().toISOString()
    });
  }

  // Real-time Updates
  async subscribeToRealTimeUpdates(dashboardId: string, connection: WebSocket): Promise<void> {
    if (!this.websocketConnections.has(dashboardId)) {
      this.websocketConnections.set(dashboardId, []);
    }

    this.websocketConnections.get(dashboardId)!.push(connection);

    connection.on('close', () => {
      this.unsubscribeFromRealTimeUpdates(dashboardId, connection);
    });
  }

  async unsubscribeFromRealTimeUpdates(dashboardId: string, connection: WebSocket): Promise<void> {
    const connections = this.websocketConnections.get(dashboardId);

    if (connections) {
      const index = connections.indexOf(connection);
      if (index > -1) {
        connections.splice(index, 1);
      }

      if (connections.length === 0) {
        this.websocketConnections.delete(dashboardId);
      }
    }
  }

  private broadcastUpdate(dashboardId: string, message: WebSocketMessage): void {
    const connections = this.websocketConnections.get(dashboardId);

    if (connections) {
      connections.forEach(connection => {
        if (connection.readyState === WebSocket.OPEN) {
          connection.send(JSON.stringify(message));
        }
      });
    }
  }

  // Template Management
  async createTemplate(templateData: Partial<DashboardTemplate>): Promise<DashboardTemplate> {
    const template: DashboardTemplate = {
      id: this.generateId(),
      name: templateData.name || 'Untitled Template',
      description: templateData.description || '',
      category: templateData.category || 'custom',
      industry: templateData.industry,
      tags: templateData.tags || [],
      thumbnail: templateData.thumbnail,
      template: templateData.template || {},
      requiredDataFields: templateData.requiredDataFields || [],
      createdAt: new Date().toISOString(),
      popularity: 0
    };

    this.templates.set(template.id, template);
    return template;
  }

  async getTemplates(category?: string, industry?: string): Promise<DashboardTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    if (industry) {
      templates = templates.filter(t => t.industry === industry);
    }

    return templates.sort((a, b) => b.popularity - a.popularity);
  }

  async createDashboardFromTemplate(templateId: string, ownerId: string, customizations?: Partial<Dashboard>): Promise<Dashboard | null> {
    const template = this.templates.get(templateId);

    if (!template) {
      return null;
    }

    // Increment template popularity
    template.popularity++;

    // Convert template widgets to full dashboard widgets
    const widgets: DashboardWidget[] = template.template.widgets?.map(templateWidget => ({
      id: this.generateId(),
      type: templateWidget.type,
      title: templateWidget.title,
      description: templateWidget.description,
      position: templateWidget.position,
      size: templateWidget.size,
      configuration: {
        ...this.getDefaultWidgetConfiguration(templateWidget.type),
        ...templateWidget.configuration
      },
      dataSource: {
        ...this.getDefaultDataSource(),
        ...templateWidget.dataSource
      },
      filters: templateWidget.filters?.map(filter => ({
        ...filter,
        id: filter.id || this.generateId(),
        widgetId: this.generateId()
      } as WidgetFilter)) || [],
      refreshInterval: templateWidget.refreshInterval,
      isVisible: templateWidget.isVisible !== undefined ? templateWidget.isVisible : true,
      permissions: {
        ...this.getDefaultWidgetPermissions(),
        ...templateWidget.permissions
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })) || [];

    const dashboardData = {
      ...template.template,
      ...customizations,
      widgets,
      name: customizations?.name || `${template.name} - ${new Date().toLocaleDateString()}`
    };

    return await this.createDashboard(dashboardData, ownerId);
  }

  // Helper Methods
  private initializeDefaultTemplates(): void {
    const templates = [
      {
        name: 'Executive KPI Dashboard',
        description: 'High-level KPIs and metrics for executives',
        category: 'business',
        tags: ['kpi', 'executive', 'metrics'],
        template: {
          layout: this.getDefaultLayout(),
          widgets: [
            {
              type: WidgetType.KPI_CARD,
              title: 'Revenue',
              position: { x: 0, y: 0 },
              size: { width: 3, height: 2 }
            },
            {
              type: WidgetType.LINE_CHART,
              title: 'Revenue Trend',
              position: { x: 3, y: 0 },
              size: { width: 6, height: 4 }
            }
          ]
        },
        requiredDataFields: ['revenue', 'date']
      }
    ];

    templates.forEach(async (template) => {
      await this.createTemplate(template);
    });
  }

  private generateId(): string {
    return `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(widget: DashboardWidget): string {
    return `widget_${widget.id}_${JSON.stringify(widget.dataSource.query)}`;
  }

  private getDefaultLayout() {
    return {
      type: 'grid' as const,
      columns: 12,
      rowHeight: 100,
      gaps: { horizontal: 16, vertical: 16 },
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480 }
    };
  }

  private getDefaultSettings() {
    return {
      theme: 'light' as const,
      timezone: 'UTC',
      locale: 'en-US',
      currency: 'USD',
      numberFormat: {
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.'
      },
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h' as const,
      gridSize: 20,
      snapToGrid: true,
      showGrid: false,
      allowExport: true,
      allowSharing: true,
      allowEmbedding: false
    };
  }

  private getDefaultWidgetConfiguration(type: WidgetType) {
    // Return basic configuration based on widget type
    return {
      chartConfig: {
        series: [],
        title: { text: '', position: 'top' as const, styling: {} },
        legend: { enabled: true, position: 'bottom' as const }
      },
      styling: {
        padding: 16,
        margin: 8,
        theme: 'auto' as const
      },
      interactions: {
        enableZoom: true,
        enablePan: true,
        enableSelection: false,
        enableCrosshair: false,
        enableTooltip: true
      }
    };
  }

  private getDefaultDataSource(): DataSource {
    return {
      id: this.generateId(),
      type: 'api',
      connection: {
        timeout: 30000,
        retryPolicy: {
          maxAttempts: 3,
          backoffMultiplier: 2,
          initialDelay: 1000,
          maxDelay: 10000
        }
      },
      query: {
        statement: '',
        parameters: {},
        pagination: { enabled: false, pageSize: 100 }
      },
      caching: {
        enabled: true,
        ttl: 300,
        strategy: 'memory'
      },
      refreshStrategy: {
        type: 'manual'
      }
    };
  }

  private getDefaultWidgetPermissions() {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canShare: true,
      canExport: true
    };
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      renderTime: 0,
      dataLoadTime: 0,
      totalSize: 0,
      cacheHitRate: 0
    };
  }

  private getDataFreshness(widgets: DashboardWidget[]): Record<string, string> {
    const freshness: Record<string, string> = {};

    widgets.forEach(widget => {
      // Calculate based on cache or last refresh
      freshness[widget.id] = new Date().toISOString();
    });

    return freshness;
  }

  private generateMockData(type: WidgetType, parameters?: any): any {
    // Generate appropriate mock data based on widget type
    switch (type) {
      case WidgetType.LINE_CHART:
        return {
          series: [{
            name: 'Sample Data',
            data: Array.from({ length: 10 }, (_, i) => ({
              x: new Date(Date.now() - (9 - i) * 24 * 60 * 60 * 1000).toISOString(),
              y: Math.floor(Math.random() * 100)
            }))
          }]
        };

      case WidgetType.KPI_CARD:
        return {
          value: Math.floor(Math.random() * 1000000),
          change: Math.floor(Math.random() * 20) - 10,
          trend: Math.random() > 0.5 ? 'up' : 'down'
        };

      default:
        return { message: 'No data available' };
    }
  }

  private applyFilterToQuery(dataSource: DataSource, filter: DashboardFilter): void {
    // Apply filter logic to modify the data source query
    if (!dataSource.query.parameters) {
      dataSource.query.parameters = {};
    }

    dataSource.query.parameters[filter.field] = {
      operator: filter.operator,
      value: filter.value
    };
  }

  private cleanupDashboardData(dashboardId: string): void {
    // Remove cached data for dashboard widgets
    const keysToDelete: string[] = [];

    this.dataCache.forEach((_, key) => {
      if (key.includes(dashboardId)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.dataCache.delete(key));

    // Clean up websocket connections
    this.websocketConnections.delete(dashboardId);
  }

  private startCacheCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.dataCache.forEach((cached, key) => {
        if (now - cached.timestamp > cached.ttl * 1000) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.dataCache.delete(key));
    }, 5 * 60 * 1000);
  }
}

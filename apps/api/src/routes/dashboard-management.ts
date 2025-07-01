import { Request, Response, Router } from 'express';
import { DashboardService } from '../services/dashboard-service';
import {
    ExportRequest,
    FilterOperator,
    FilterType,
    WidgetType
} from '../types/dashboard';

const router = Router();
const dashboardService = DashboardService.getInstance();

// Dashboard CRUD Operations

/**
 * POST /dashboards
 * Create a new dashboard
 */
router.post('/dashboards', async (req: Request, res: Response) => {
  try {
    const { ownerId, ...dashboardData } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'Owner ID is required' });
    }

    const dashboard = await dashboardService.createDashboard(dashboardData, ownerId);

    res.status(201).json({
      success: true,
      data: dashboard,
      message: 'Dashboard created successfully'
    });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    res.status(500).json({ error: 'Failed to create dashboard' });
  }
});

/**
 * GET /dashboards
 * List dashboards with optional filtering
 */
router.get('/dashboards', async (req: Request, res: Response) => {
  try {
    const { ownerId, tags, isPublic } = req.query;

    const filters: any = {};
    if (tags) {
      filters.tags = typeof tags === 'string' ? tags.split(',') : tags;
    }
    if (isPublic !== undefined) {
      filters.isPublic = isPublic === 'true';
    }

    const dashboards = await dashboardService.listDashboards(
      ownerId as string,
      Object.keys(filters).length > 0 ? filters : undefined
    );

    res.json({
      success: true,
      data: dashboards,
      total: dashboards.length
    });
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
});

/**
 * GET /dashboards/:id
 * Get a specific dashboard with optional data
 */
router.get('/dashboards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeData = 'true' } = req.query;

    const dashboard = await dashboardService.getDashboard(
      id,
      includeData === 'true'
    );

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

/**
 * PUT /dashboards/:id
 * Update a dashboard
 */
router.put('/dashboards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const dashboard = await dashboardService.updateDashboard(id, updates);

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({
      success: true,
      data: dashboard,
      message: 'Dashboard updated successfully'
    });
  } catch (error) {
    console.error('Error updating dashboard:', error);
    res.status(500).json({ error: 'Failed to update dashboard' });
  }
});

/**
 * DELETE /dashboards/:id
 * Delete a dashboard
 */
router.delete('/dashboards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await dashboardService.deleteDashboard(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({
      success: true,
      message: 'Dashboard deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    res.status(500).json({ error: 'Failed to delete dashboard' });
  }
});

// Widget Management

/**
 * POST /dashboards/:id/widgets
 * Add a widget to a dashboard
 */
router.post('/dashboards/:id/widgets', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const widgetData = req.body;

    const widget = await dashboardService.addWidget(id, widgetData);

    if (!widget) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.status(201).json({
      success: true,
      data: widget,
      message: 'Widget added successfully'
    });
  } catch (error) {
    console.error('Error adding widget:', error);
    res.status(500).json({ error: 'Failed to add widget' });
  }
});

/**
 * PUT /dashboards/:id/widgets/:widgetId
 * Update a widget
 */
router.put('/dashboards/:id/widgets/:widgetId', async (req: Request, res: Response) => {
  try {
    const { id, widgetId } = req.params;
    const updates = req.body;

    const widget = await dashboardService.updateWidget(id, widgetId, updates);

    if (!widget) {
      return res.status(404).json({ error: 'Widget or dashboard not found' });
    }

    res.json({
      success: true,
      data: widget,
      message: 'Widget updated successfully'
    });
  } catch (error) {
    console.error('Error updating widget:', error);
    res.status(500).json({ error: 'Failed to update widget' });
  }
});

/**
 * DELETE /dashboards/:id/widgets/:widgetId
 * Remove a widget from a dashboard
 */
router.delete('/dashboards/:id/widgets/:widgetId', async (req: Request, res: Response) => {
  try {
    const { id, widgetId } = req.params;

    const removed = await dashboardService.removeWidget(id, widgetId);

    if (!removed) {
      return res.status(404).json({ error: 'Widget or dashboard not found' });
    }

    res.json({
      success: true,
      message: 'Widget removed successfully'
    });
  } catch (error) {
    console.error('Error removing widget:', error);
    res.status(500).json({ error: 'Failed to remove widget' });
  }
});

// Filter Management

/**
 * POST /dashboards/:id/filters
 * Add a filter to a dashboard
 */
router.post('/dashboards/:id/filters', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filterData = req.body;

    const filter = await dashboardService.addFilter(id, filterData);

    if (!filter) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.status(201).json({
      success: true,
      data: filter,
      message: 'Filter added successfully'
    });
  } catch (error) {
    console.error('Error adding filter:', error);
    res.status(500).json({ error: 'Failed to add filter' });
  }
});

/**
 * POST /dashboards/:id/filters/apply
 * Apply filters to a dashboard
 */
router.post('/dashboards/:id/filters/apply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { filters } = req.body;

    if (!Array.isArray(filters)) {
      return res.status(400).json({ error: 'Filters must be an array' });
    }

    const dashboard = await dashboardService.applyFilters(id, filters);

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({
      success: true,
      data: dashboard,
      message: 'Filters applied successfully'
    });
  } catch (error) {
    console.error('Error applying filters:', error);
    res.status(500).json({ error: 'Failed to apply filters' });
  }
});

// Template Management

/**
 * GET /dashboard-templates
 * Get available dashboard templates
 */
router.get('/dashboard-templates', async (req: Request, res: Response) => {
  try {
    const { category, industry } = req.query;

    const templates = await dashboardService.getTemplates(
      category as string,
      industry as string
    );

    res.json({
      success: true,
      data: templates,
      total: templates.length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * POST /dashboard-templates
 * Create a new dashboard template
 */
router.post('/dashboard-templates', async (req: Request, res: Response) => {
  try {
    const templateData = req.body;

    const template = await dashboardService.createTemplate(templateData);

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

/**
 * POST /dashboard-templates/:id/create-dashboard
 * Create a dashboard from a template
 */
router.post('/dashboard-templates/:id/create-dashboard', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ownerId, customizations } = req.body;

    if (!ownerId) {
      return res.status(400).json({ error: 'Owner ID is required' });
    }

    const dashboard = await dashboardService.createDashboardFromTemplate(
      id,
      ownerId,
      customizations
    );

    if (!dashboard) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.status(201).json({
      success: true,
      data: dashboard,
      message: 'Dashboard created from template successfully'
    });
  } catch (error) {
    console.error('Error creating dashboard from template:', error);
    res.status(500).json({ error: 'Failed to create dashboard from template' });
  }
});

// Data and Analytics

/**
 * GET /dashboards/:id/data
 * Get dashboard data with applied filters
 */
router.get('/dashboards/:id/data', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { widgetIds, refresh: _refresh = 'false' } = req.query;

    const dashboard = await dashboardService.getDashboard(id, true);

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    let data = dashboard.data;

    // Filter data by specific widgets if requested
    if (widgetIds) {
      const requestedWidgetIds: string[] = typeof widgetIds === 'string'
        ? widgetIds.split(',')
        : Array.isArray(widgetIds)
        ? widgetIds.map(id => String(id))
        : [String(widgetIds)];

      data = Object.fromEntries(
        Object.entries(data).filter(([widgetId]) =>
          requestedWidgetIds.includes(widgetId)
        )
      );
    }

    res.json({
      success: true,
      data,
      metadata: dashboard.metadata
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

/**
 * POST /dashboards/:id/refresh
 * Refresh dashboard data
 */
router.post('/dashboards/:id/refresh', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { widgetIds: _widgetIds } = req.body;

    // This would trigger a refresh of specific widgets or all widgets
    // For now, we'll just return the current data
    const dashboard = await dashboardService.getDashboard(id, true);

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({
      success: true,
      data: dashboard.data,
      metadata: dashboard.metadata,
      message: 'Dashboard data refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing dashboard data:', error);
    res.status(500).json({ error: 'Failed to refresh dashboard data' });
  }
});

// Widget Type Information

/**
 * GET /widget-types
 * Get available widget types and their configurations
 */
router.get('/widget-types', (req: Request, res: Response) => {
  try {
    const widgetTypes = Object.values(WidgetType).map(type => ({
      type,
      name: type.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' '),
      description: getWidgetTypeDescription(type),
      requiredFields: getWidgetTypeRequiredFields(type),
      supportedFeatures: getWidgetTypeSupportedFeatures(type)
    }));

    res.json({
      success: true,
      data: widgetTypes
    });
  } catch (error) {
    console.error('Error fetching widget types:', error);
    res.status(500).json({ error: 'Failed to fetch widget types' });
  }
});

/**
 * GET /filter-options
 * Get available filter types and operators
 */
router.get('/filter-options', (req: Request, res: Response) => {
  try {
    const filterTypes = Object.values(FilterType);
    const filterOperators = Object.values(FilterOperator);

    res.json({
      success: true,
      data: {
        types: filterTypes,
        operators: filterOperators,
        typeOperators: getCompatibleOperators()
      }
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

// Export and Sharing

/**
 * POST /dashboards/:id/export
 * Export dashboard or specific widgets
 */
router.post('/dashboards/:id/export', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const exportRequest: ExportRequest = req.body;

    if (!exportRequest.format) {
      return res.status(400).json({ error: 'Export format is required' });
    }

    // This would implement actual export functionality
    // For now, return export configuration
    res.json({
      success: true,
      message: 'Export initiated successfully',
      exportId: `export_${Date.now()}`,
      estimatedTime: '30 seconds',
      downloadUrl: `/exports/export_${Date.now()}.${exportRequest.format}`
    });
  } catch (error) {
    console.error('Error exporting dashboard:', error);
    res.status(500).json({ error: 'Failed to export dashboard' });
  }
});

// Helper Functions

function getWidgetTypeDescription(type: WidgetType): string {
  const descriptions: Record<WidgetType, string> = {
    [WidgetType.LINE_CHART]: 'Display trends over time with connected data points',
    [WidgetType.BAR_CHART]: 'Compare categories with rectangular bars',
    [WidgetType.PIE_CHART]: 'Show proportions of a whole with circular segments',
    [WidgetType.AREA_CHART]: 'Display quantitative data over time with filled areas',
    [WidgetType.SCATTER_PLOT]: 'Show relationships between two variables',
    [WidgetType.HEATMAP]: 'Display data through variations in coloring',
    [WidgetType.GAUGE]: 'Show single values against a scale',
    [WidgetType.KPI_CARD]: 'Display key performance indicators',
    [WidgetType.TABLE]: 'Present data in rows and columns',
    [WidgetType.FUNNEL_CHART]: 'Show progressive reduction of data',
    [WidgetType.COHORT_ANALYSIS]: 'Analyze user behavior over time',
    [WidgetType.DISTRIBUTION_CHART]: 'Show distribution of data values',
    [WidgetType.CORRELATION_MATRIX]: 'Display correlations between variables',
    [WidgetType.GEOGRAPHIC_MAP]: 'Show data on geographical maps',
    [WidgetType.TIMELINE]: 'Display events chronologically',
    [WidgetType.CUSTOM]: 'Custom widget implementation'
  };

  return descriptions[type] || 'Custom widget type';
}

function getWidgetTypeRequiredFields(type: WidgetType): string[] {
  const requiredFields: Record<WidgetType, string[]> = {
    [WidgetType.LINE_CHART]: ['x-axis', 'y-axis'],
    [WidgetType.BAR_CHART]: ['category', 'value'],
    [WidgetType.PIE_CHART]: ['category', 'value'],
    [WidgetType.AREA_CHART]: ['x-axis', 'y-axis'],
    [WidgetType.SCATTER_PLOT]: ['x-axis', 'y-axis'],
    [WidgetType.HEATMAP]: ['x-axis', 'y-axis', 'value'],
    [WidgetType.GAUGE]: ['value', 'max'],
    [WidgetType.KPI_CARD]: ['value'],
    [WidgetType.TABLE]: ['columns'],
    [WidgetType.FUNNEL_CHART]: ['stage', 'value'],
    [WidgetType.COHORT_ANALYSIS]: ['date', 'cohort', 'value'],
    [WidgetType.DISTRIBUTION_CHART]: ['value'],
    [WidgetType.CORRELATION_MATRIX]: ['variables'],
    [WidgetType.GEOGRAPHIC_MAP]: ['location', 'value'],
    [WidgetType.TIMELINE]: ['date', 'event'],
    [WidgetType.CUSTOM]: []
  };

  return requiredFields[type] || [];
}

function getWidgetTypeSupportedFeatures(type: WidgetType): string[] {
  const features: Record<WidgetType, string[]> = {
    [WidgetType.LINE_CHART]: ['zoom', 'pan', 'tooltip', 'legend', 'annotations'],
    [WidgetType.BAR_CHART]: ['tooltip', 'legend', 'sorting', 'grouping'],
    [WidgetType.PIE_CHART]: ['tooltip', 'legend', 'explosion'],
    [WidgetType.AREA_CHART]: ['zoom', 'pan', 'tooltip', 'legend', 'stacking'],
    [WidgetType.SCATTER_PLOT]: ['zoom', 'pan', 'tooltip', 'regression'],
    [WidgetType.HEATMAP]: ['tooltip', 'color-scale', 'clustering'],
    [WidgetType.GAUGE]: ['threshold-indicators', 'animations'],
    [WidgetType.KPI_CARD]: ['trend-indicators', 'comparisons', 'sparkline'],
    [WidgetType.TABLE]: ['sorting', 'filtering', 'pagination', 'export'],
    [WidgetType.FUNNEL_CHART]: ['tooltip', 'conversion-rates'],
    [WidgetType.COHORT_ANALYSIS]: ['tooltip', 'color-coding', 'retention-curves'],
    [WidgetType.DISTRIBUTION_CHART]: ['binning', 'statistics', 'overlay'],
    [WidgetType.CORRELATION_MATRIX]: ['clustering', 'color-scale', 'tooltip'],
    [WidgetType.GEOGRAPHIC_MAP]: ['zoom', 'pan', 'clustering', 'overlay'],
    [WidgetType.TIMELINE]: ['zoom', 'filtering', 'grouping', 'annotations'],
    [WidgetType.CUSTOM]: []
  };

  return features[type] || [];
}

function getCompatibleOperators(): Record<FilterType, FilterOperator[]> {
  return {
    [FilterType.TEXT]: [
      FilterOperator.EQUALS,
      FilterOperator.NOT_EQUALS,
      FilterOperator.CONTAINS,
      FilterOperator.NOT_CONTAINS,
      FilterOperator.STARTS_WITH,
      FilterOperator.ENDS_WITH,
      FilterOperator.IS_NULL,
      FilterOperator.IS_NOT_NULL
    ],
    [FilterType.NUMBER]: [
      FilterOperator.EQUALS,
      FilterOperator.NOT_EQUALS,
      FilterOperator.GREATER_THAN,
      FilterOperator.GREATER_THAN_OR_EQUAL,
      FilterOperator.LESS_THAN,
      FilterOperator.LESS_THAN_OR_EQUAL,
      FilterOperator.BETWEEN,
      FilterOperator.IS_NULL,
      FilterOperator.IS_NOT_NULL
    ],
    [FilterType.DATE]: [
      FilterOperator.EQUALS,
      FilterOperator.NOT_EQUALS,
      FilterOperator.GREATER_THAN,
      FilterOperator.GREATER_THAN_OR_EQUAL,
      FilterOperator.LESS_THAN,
      FilterOperator.LESS_THAN_OR_EQUAL,
      FilterOperator.BETWEEN
    ],
    [FilterType.SELECT]: [
      FilterOperator.EQUALS,
      FilterOperator.NOT_EQUALS,
      FilterOperator.IN,
      FilterOperator.NOT_IN
    ],
    [FilterType.MULTI_SELECT]: [
      FilterOperator.IN,
      FilterOperator.NOT_IN
    ],
    [FilterType.RANGE]: [
      FilterOperator.BETWEEN
    ],
    [FilterType.DATE_RANGE]: [
      FilterOperator.BETWEEN
    ],
    [FilterType.BOOLEAN]: [
      FilterOperator.EQUALS
    ]
  };
}

export default router;

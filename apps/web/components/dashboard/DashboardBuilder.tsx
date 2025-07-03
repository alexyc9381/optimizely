/* eslint-disable no-undef */
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from '@hello-pangea/dnd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dashboard,
  DashboardFilter,
  DashboardResponse,
  DashboardWidget,
  RealTimeDataUpdate,
  WebSocketMessage,
  WidgetType,
} from '../../../../src/lib/types/dashboard-analytics';

interface DashboardBuilderProps {
  dashboardId?: string;
  initialDashboard?: Dashboard;
  isEditable?: boolean;
  onSave?: (dashboard: Dashboard) => void;
  onWidgetClick?: (widget: DashboardWidget) => void;
  onFilterChange?: (filters: DashboardFilter[]) => void;
}

interface GridItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  widget: DashboardWidget;
}

export const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  dashboardId,
  initialDashboard,
  isEditable = true,
  onSave,
  onWidgetClick,
  onFilterChange: _onFilterChange,
}) => {
  const [dashboard, setDashboard] = useState<Dashboard | null>(
    initialDashboard || null
  );
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realTimeData, setRealTimeData] = useState<Record<string, unknown>>({});
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'connecting'
  >('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load dashboard data
  useEffect(() => {
    if (dashboardId && !initialDashboard) {
      loadDashboard(dashboardId);
    }
  }, [dashboardId, initialDashboard]);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    if (dashboard?.id) {
      connectWebSocket(dashboard.id);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [dashboard?.id]);

  // Convert widgets to grid items
  useEffect(() => {
    if (dashboard?.widgets) {
      const items = dashboard.widgets.map(widget => ({
        id: widget.id,
        x: widget.position.x,
        y: widget.position.y,
        w: widget.size.width,
        h: widget.size.height,
        widget,
      }));
      setGridItems(items);
    }
  }, [dashboard?.widgets]);

  const loadDashboard = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboards/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load dashboard');
      }

      const { data }: { data: DashboardResponse } = await response.json();
      setDashboard(data.dashboard);
      setRealTimeData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = (dashboardId: string) => {
    setConnectionStatus('connecting');

    try {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/dashboards/${dashboardId}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        console.log('Dashboard WebSocket connected');
      };

      wsRef.current.onmessage = event => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        console.log('Dashboard WebSocket disconnected');

        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (dashboard?.id) {
            connectWebSocket(dashboard.id);
          }
        }, 5000);
      };

      wsRef.current.onerror = error => {
        console.error('Dashboard WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
    } catch (err) {
      console.error('Error connecting to WebSocket:', err);
      setConnectionStatus('disconnected');
    }
  };

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'data_update': {
        const update = message.payload as RealTimeDataUpdate;
        setRealTimeData(prev => ({
          ...prev,
          [update.widgetId]: update.data,
        }));
        break;
      }

      case 'error':
        console.error('WebSocket error:', message.payload);
        break;

      case 'connection_status':
        console.log('Connection status:', message.payload);
        break;
    }
  };

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !isEditable) return;

      const { source, destination } = result;
      const newGridItems = Array.from(gridItems);
      const [reorderedItem] = newGridItems.splice(source.index, 1);
      newGridItems.splice(destination.index, 0, reorderedItem);

      setGridItems(newGridItems);

      // Update widget positions
      if (dashboard) {
        const updatedWidgets = newGridItems.map(item => ({
          ...item.widget,
          position: { x: item.x, y: item.y },
          size: { width: item.w, height: item.h },
        }));

        const updatedDashboard = {
          ...dashboard,
          widgets: updatedWidgets,
          updatedAt: new Date().toISOString(),
        };

        setDashboard(updatedDashboard);
        onSave?.(updatedDashboard);
      }
    },
    [gridItems, dashboard, isEditable, onSave]
  );

  const handleWidgetResize = useCallback(
    (widgetId: string, newSize: { width: number; height: number }) => {
      if (!isEditable || !dashboard) return;

      const updatedWidgets = dashboard.widgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, size: newSize, updatedAt: new Date().toISOString() }
          : widget
      );

      const updatedDashboard = {
        ...dashboard,
        widgets: updatedWidgets,
        updatedAt: new Date().toISOString(),
      };

      setDashboard(updatedDashboard);
      onSave?.(updatedDashboard);
    },
    [dashboard, isEditable, onSave]
  );

  const handleWidgetMove = useCallback(
    (widgetId: string, newPosition: { x: number; y: number }) => {
      if (!isEditable || !dashboard) return;

      const updatedWidgets = dashboard.widgets.map(widget =>
        widget.id === widgetId
          ? {
              ...widget,
              position: newPosition,
              updatedAt: new Date().toISOString(),
            }
          : widget
      );

      const updatedDashboard = {
        ...dashboard,
        widgets: updatedWidgets,
        updatedAt: new Date().toISOString(),
      };

      setDashboard(updatedDashboard);
      onSave?.(updatedDashboard);
    },
    [dashboard, isEditable, onSave]
  );

  const addWidget = useCallback(
    async (widgetType: WidgetType, position?: { x: number; y: number }) => {
      if (!dashboard || !isEditable) return;

      const newPosition = position || { x: 0, y: 0 };
      const newWidget: Partial<DashboardWidget> = {
        type: widgetType,
        title: `New ${widgetType.replace('_', ' ')} Widget`,
        position: newPosition,
        size: { width: 4, height: 3 },
        isVisible: true,
      };

      try {
        const response = await fetch(
          `/api/dashboards/${dashboard.id}/widgets`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newWidget),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to add widget');
        }

        const { data: createdWidget } = await response.json();

        const updatedDashboard = {
          ...dashboard,
          widgets: [...dashboard.widgets, createdWidget],
          updatedAt: new Date().toISOString(),
        };

        setDashboard(updatedDashboard);
        onSave?.(updatedDashboard);
        setShowWidgetSelector(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add widget');
      }
    },
    [dashboard, isEditable, onSave]
  );

  const removeWidget = useCallback(
    async (widgetId: string) => {
      if (!dashboard || !isEditable) return;

      try {
        const response = await fetch(
          `/api/dashboards/${dashboard.id}/widgets/${widgetId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to remove widget');
        }

        const updatedDashboard = {
          ...dashboard,
          widgets: dashboard.widgets.filter(w => w.id !== widgetId),
          updatedAt: new Date().toISOString(),
        };

        setDashboard(updatedDashboard);
        onSave?.(updatedDashboard);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to remove widget'
        );
      }
    },
    [dashboard, isEditable, onSave]
  );

  const duplicateWidget = useCallback(
    async (widget: DashboardWidget) => {
      if (!dashboard || !isEditable) return;

      const duplicatedWidget: Partial<DashboardWidget> = {
        ...widget,
        id: undefined,
        title: `${widget.title} (Copy)`,
        position: { x: widget.position.x + 1, y: widget.position.y + 1 },
        createdAt: undefined,
        updatedAt: undefined,
      };

      await addWidget(widget.type, duplicatedWidget.position);
    },
    [dashboard, isEditable, addWidget]
  );

  // TODO: Implement filter application functionality
  // const applyFilters = useCallback(async (filters: DashboardFilter[]) => {
  //   if (!dashboard) return;
  //   try {
  //     const response = await fetch(`/api/dashboards/${dashboard.id}/filters/apply`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ filters })
  //     });
  //     if (!response.ok) {
  //       throw new Error('Failed to apply filters');
  //     }
  //     const { data: updatedDashboard } = await response.json();
  //     setDashboard(updatedDashboard);
  //     onFilterChange?.(filters);
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to apply filters');
  //   }
  // }, [dashboard, onFilterChange]);

  const refreshData = useCallback(async () => {
    if (!dashboard) return;

    try {
      const response = await fetch(`/api/dashboards/${dashboard.id}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh data');
      }

      const { data } = await response.json();
      setRealTimeData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    }
  }, [dashboard]);

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64' data-oid='ch66men'>
        <div
          className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'
          data-oid='95sfgzo'
        ></div>
        <span className='ml-2' data-oid='w_q7v_3'>
          Loading dashboard...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className='bg-red-50 border border-red-200 rounded-lg p-4'
        data-oid='o51.8fy'
      >
        <h3 className='text-red-800 font-medium' data-oid='kpycu-l'>
          Error
        </h3>
        <p className='text-red-600 mt-1' data-oid='kkd.3vm'>
          {error}
        </p>
        <button
          onClick={() => dashboard?.id && loadDashboard(dashboard.id)}
          className='mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700'
          data-oid='v45c0z-'
        >
          Retry
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className='text-center py-8' data-oid='-5-hckd'>
        <p className='text-gray-500' data-oid='8wjc2ae'>
          No dashboard to display
        </p>
      </div>
    );
  }

  return (
    <div
      className='dashboard-builder h-full flex flex-col'
      ref={containerRef}
      data-oid='r_5bnd0'
    >
      {/* Header */}
      <div
        className='dashboard-header bg-white border-b border-gray-200 p-4 flex items-center justify-between'
        data-oid='0d56:2v'
      >
        <div className='flex items-center space-x-4' data-oid='8i5yhf0'>
          <h1
            className='text-xl font-semibold text-gray-900'
            data-oid='a1bgm9i'
          >
            {dashboard.name}
          </h1>
          <div
            className={`flex items-center space-x-1 text-sm ${
              connectionStatus === 'connected'
                ? 'text-green-600'
                : connectionStatus === 'connecting'
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}
            data-oid='14u_99h'
          >
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'connecting'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              data-oid='0lx63lh'
            ></div>
            <span className='capitalize' data-oid='d_q2hmz'>
              {connectionStatus}
            </span>
          </div>
        </div>

        <div className='flex items-center space-x-2' data-oid='tumsrov'>
          {isEditable && (
            <>
              <button
                onClick={() => setShowWidgetSelector(true)}
                className='bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700'
                data-oid='k1svc3y'
              >
                Add Widget
              </button>
              <button
                onClick={() => onSave?.(dashboard)}
                className='bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700'
                data-oid='4e4ikzg'
              >
                Save
              </button>
            </>
          )}
          <button
            onClick={refreshData}
            className='bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700'
            data-oid='03oc04z'
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div
        className='dashboard-grid flex-1 overflow-auto p-4'
        data-oid='.mg0xq4'
      >
        <DragDropContext onDragEnd={handleDragEnd} data-oid='y2gmprl'>
          <Droppable
            droppableId='dashboard-grid'
            direction='vertical'
            data-oid='quwyt6a'
          >
            {provided => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className='grid-container min-h-full'
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${dashboard.layout.columns}, 1fr)`,
                  gap: `${dashboard.layout.gaps.vertical}px ${dashboard.layout.gaps.horizontal}px`,
                  gridAutoRows: `${dashboard.layout.rowHeight}px`,
                }}
                data-oid='apyuap3'
              >
                {gridItems.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id}
                    index={index}
                    isDragDisabled={!isEditable}
                    data-oid='bmzwbom'
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`widget-container bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                          selectedWidget === item.id
                            ? 'ring-2 ring-blue-500'
                            : ''
                        } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                        style={{
                          ...provided.draggableProps.style,
                          gridColumn: `span ${item.w}`,
                          gridRow: `span ${item.h}`,
                          minHeight: `${item.h * dashboard.layout.rowHeight}px`,
                        }}
                        onClick={() => {
                          setSelectedWidget(item.id);
                          onWidgetClick?.(item.widget);
                        }}
                        data-oid='m6wcnk_'
                      >
                        <WidgetRenderer
                          widget={item.widget}
                          data={realTimeData[item.id]}
                          isEditable={isEditable}
                          isSelected={selectedWidget === item.id}
                          onResize={newSize =>
                            handleWidgetResize(item.id, newSize)
                          }
                          onMove={newPosition =>
                            handleWidgetMove(item.id, newPosition)
                          }
                          onRemove={() => removeWidget(item.id)}
                          onDuplicate={() => duplicateWidget(item.widget)}
                          data-oid='1_f0rlv'
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Widget Selector Modal */}
      {showWidgetSelector && (
        <WidgetSelectorModal
          onSelect={widgetType => addWidget(widgetType)}
          onClose={() => setShowWidgetSelector(false)}
          data-oid='g.kchb1'
        />
      )}
    </div>
  );
};

// Widget Renderer Component
interface WidgetRendererProps {
  widget: DashboardWidget;
  data?: any;
  isEditable?: boolean;
  isSelected?: boolean;
  onResize?: (newSize: { width: number; height: number }) => void;
  onMove?: (newPosition: { x: number; y: number }) => void;
  onRemove?: () => void;
  onDuplicate?: () => void;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  data,
  isEditable,
  isSelected: _isSelected,
  onResize: _onResize,
  onMove: _onMove,
  onRemove,
  onDuplicate,
}) => {
  const [showControls, setShowControls] = useState(false);

  return (
    <div
      className='widget-wrapper h-full relative'
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      data-oid='65xe1_z'
    >
      {/* Widget Controls */}
      {isEditable && showControls && (
        <div
          className='widget-controls absolute top-2 right-2 flex space-x-1 z-10'
          data-oid='6mn.c43'
        >
          <button
            onClick={e => {
              e.stopPropagation();
              onDuplicate?.();
            }}
            className='bg-blue-600 text-white p-1 rounded text-xs hover:bg-blue-700'
            title='Duplicate'
            data-oid='u62.8n8'
          >
            <svg
              className='w-3 h-3'
              fill='currentColor'
              viewBox='0 0 20 20'
              data-oid='w_wug4w'
            >
              <path d='M7 7h8v8H7z' data-oid='bc-8mnp' />
              <path d='M5 5v8H3V5a2 2 0 012-2h8v2H5z' data-oid='-z2e7dc' />
            </svg>
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              onRemove?.();
            }}
            className='bg-red-600 text-white p-1 rounded text-xs hover:bg-red-700'
            title='Remove'
            data-oid='vtxua6g'
          >
            <svg
              className='w-3 h-3'
              fill='currentColor'
              viewBox='0 0 20 20'
              data-oid='77r8ehd'
            >
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
                data-oid='yr:4sdw'
              />
            </svg>
          </button>
        </div>
      )}

      {/* Widget Header */}
      <div
        className='widget-header border-b border-gray-100 p-3'
        data-oid='_j..y2q'
      >
        <h3 className='font-medium text-gray-900 text-sm' data-oid='39i6j6.'>
          {widget.title}
        </h3>
        {widget.description && (
          <p className='text-xs text-gray-500 mt-1' data-oid='9830cgi'>
            {widget.description}
          </p>
        )}
      </div>

      {/* Widget Content */}
      <div className='widget-content p-3 h-full' data-oid='racdmi7'>
        <WidgetContent widget={widget} data={data} data-oid='b7t7i_z' />
      </div>

      {/* Resize Handle */}
      {isEditable && (
        <div
          className='resize-handle absolute bottom-0 right-0 w-3 h-3 bg-gray-400 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity'
          data-oid='00n:oln'
        >
          <svg
            className='w-3 h-3'
            fill='currentColor'
            viewBox='0 0 20 20'
            data-oid='c.cx_zt'
          >
            <path
              d='M14 14l-1-1v-2h2l-1 1zm-4-4l-1-1v-2h2l-1 1zm-4-4l-1-1v-2h2l-1 1z'
              data-oid='q8g26bi'
            />
          </svg>
        </div>
      )}
    </div>
  );
};

// Widget Content Component
interface WidgetContentProps {
  widget: DashboardWidget;
  data?: any;
}

const WidgetContent: React.FC<WidgetContentProps> = ({ widget, data }) => {
  // This would render different widget types based on widget.type
  // For now, return a placeholder
  return (
    <div
      className='h-full flex items-center justify-center text-gray-500'
      data-oid='0x.7h_4'
    >
      <div className='text-center' data-oid='s5cfqm1'>
        <div className='text-2xl mb-2' data-oid='iyrus30'>
          📊
        </div>
        <div className='text-sm font-medium' data-oid='9srb7oi'>
          {widget.type.replace('_', ' ')}
        </div>
        {data && (
          <div className='text-xs mt-1' data-oid='djumdc7'>
            Data: {JSON.stringify(data).substring(0, 50)}...
          </div>
        )}
      </div>
    </div>
  );
};

// Widget Selector Modal
interface WidgetSelectorModalProps {
  onSelect: (widgetType: WidgetType) => void;
  onClose: () => void;
}

const WidgetSelectorModal: React.FC<WidgetSelectorModalProps> = ({
  onSelect,
  onClose,
}) => {
  const widgetTypes = [
    { type: WidgetType.LINE_CHART, name: 'Line Chart', icon: '📈' },
    { type: WidgetType.BAR_CHART, name: 'Bar Chart', icon: '📊' },
    { type: WidgetType.PIE_CHART, name: 'Pie Chart', icon: '🥧' },
    { type: WidgetType.KPI_CARD, name: 'KPI Card', icon: '📋' },
    { type: WidgetType.TABLE, name: 'Table', icon: '📋' },
    { type: WidgetType.HEATMAP, name: 'Heatmap', icon: '🔥' },
    { type: WidgetType.GAUGE, name: 'Gauge', icon: '⏰' },
    { type: WidgetType.FUNNEL_CHART, name: 'Funnel Chart', icon: '⏳' },
  ];

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
      data-oid='94.jriq'
    >
      <div
        className='bg-white rounded-lg p-6 max-w-md w-full m-4'
        data-oid='rhi7ex3'
      >
        <div
          className='flex items-center justify-between mb-4'
          data-oid='ytfe7s1'
        >
          <h2 className='text-lg font-semibold' data-oid='ym3kw72'>
            Add Widget
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
            data-oid='zq1gy:t'
          >
            <svg
              className='w-6 h-6'
              fill='currentColor'
              viewBox='0 0 20 20'
              data-oid='8nh50eq'
            >
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
                data-oid='my9j7xd'
              />
            </svg>
          </button>
        </div>

        <div className='grid grid-cols-2 gap-3' data-oid='c:b:gu0'>
          {widgetTypes.map(({ type, name, icon }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className='p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center'
              data-oid='g4h3ys.'
            >
              <div className='text-2xl mb-2' data-oid='7hf_qtx'>
                {icon}
              </div>
              <div
                className='text-sm font-medium text-gray-900'
                data-oid='_vwaijl'
              >
                {name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardBuilder;

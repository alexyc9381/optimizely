/**
 * Virtual Scrolling Hook for Large Datasets
 * Optimizes rendering performance for large lists
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  totalItems: number;
}

export interface VirtualScrollResult {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  offsetY: number;
  totalHeight: number;
  containerProps: {
    style: React.CSSProperties;
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  };
  listProps: {
    style: React.CSSProperties;
  };
}

export function useVirtualScroll(options: VirtualScrollOptions): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 5, totalItems } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    setScrollTop(target.scrollTop);
  }, []);

  const virtualScrollData = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      totalItems - 1,
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan * 2
    );
    
    const visibleItems = endIndex - startIndex + 1;
    const offsetY = startIndex * itemHeight;
    const totalHeight = totalItems * itemHeight;

    return {
      startIndex,
      endIndex,
      visibleItems,
      offsetY,
      totalHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, totalItems]);

  const containerProps = useMemo(() => ({
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
    },
    onScroll: handleScroll,
  }), [containerHeight, handleScroll]);

  const listProps = useMemo(() => ({
    style: {
      height: virtualScrollData.totalHeight,
      position: 'relative' as const,
    },
  }), [virtualScrollData.totalHeight]);

  return {
    ...virtualScrollData,
    containerProps,
    listProps,
  };
}

// Hook for optimized table rendering
export interface VirtualTableOptions {
  rowHeight: number;
  containerHeight: number;
  totalRows: number;
  overscan?: number;
}

export function useVirtualTable(options: VirtualTableOptions) {
  const { rowHeight, containerHeight, totalRows, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(
      totalRows - 1,
      startIndex + Math.ceil(containerHeight / rowHeight) + overscan * 2
    );

    return {
      startIndex,
      endIndex,
      visibleRows: endIndex - startIndex + 1,
      offsetY: startIndex * rowHeight,
      totalHeight: totalRows * rowHeight,
    };
  }, [scrollTop, rowHeight, containerHeight, overscan, totalRows]);

  return {
    ...visibleRange,
    handleScroll,
    containerStyle: {
      height: containerHeight,
      overflow: 'auto' as const,
    },
    innerStyle: {
      height: visibleRange.totalHeight,
      position: 'relative' as const,
    },
  };
}
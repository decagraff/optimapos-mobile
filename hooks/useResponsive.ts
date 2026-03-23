import { useWindowDimensions } from 'react-native';

interface ResponsiveInfo {
  isTablet: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
  // Grid helpers
  productColumns: number;
  orderColumns: number;
  tableColumns: number;
  statColumns: number;
  // Layout
  contentMaxWidth: number | undefined;
  contentPadding: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 600;
  const isLandscape = width > height;
  const isLargeTablet = width >= 900;

  return {
    isTablet,
    isLandscape,
    width,
    height,
    productColumns: isLargeTablet ? 4 : isTablet ? 3 : 2,
    orderColumns: isTablet ? 2 : 1,
    tableColumns: isLargeTablet ? 6 : isTablet ? 5 : 3,
    statColumns: isTablet ? 4 : 2,
    contentMaxWidth: isTablet ? 800 : undefined,
    contentPadding: isTablet ? 32 : 16,
  };
}

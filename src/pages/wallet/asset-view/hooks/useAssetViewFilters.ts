import { useState } from 'react';
import {
  CATEGORY_OPTIONS,
  DEFAULT_CATEGORY_FILTER,
  DEFAULT_FLOW_FILTER,
  DEFAULT_TIME_FILTER,
  FLOW_OPTIONS,
} from '../constants';
import type { AssetFlowFilter, AssetTimeFilter } from '../types';

export function useAssetViewFilters() {
  const [filterCategory, setFilterCategory] = useState(DEFAULT_CATEGORY_FILTER);
  const [filterFlow, setFilterFlow] = useState<AssetFlowFilter>(DEFAULT_FLOW_FILTER);
  const [filterTime, setFilterTime] = useState<AssetTimeFilter>(DEFAULT_TIME_FILTER);

  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [tempFilterCategory, setTempFilterCategory] = useState(DEFAULT_CATEGORY_FILTER);
  const [tempFilterFlow, setTempFilterFlow] = useState<AssetFlowFilter>(DEFAULT_FLOW_FILTER);

  const handleOpenFilterSheet = () => {
    setTempFilterCategory(filterCategory);
    setTempFilterFlow(filterFlow);
    setShowFilterSheet(true);
  };

  const handleConfirmFilter = () => {
    setFilterCategory(tempFilterCategory);
    setFilterFlow(tempFilterFlow);
    setShowFilterSheet(false);
  };

  return {
    filterCategory,
    filterFlow,
    filterTime,
    setFilterCategory,
    setFilterFlow,
    setFilterTime,
    showFilterSheet,
    setShowFilterSheet,
    tempFilterCategory,
    tempFilterFlow,
    setTempFilterCategory,
    setTempFilterFlow,
    categoryOptions: CATEGORY_OPTIONS,
    flowOptions: FLOW_OPTIONS,
    handleOpenFilterSheet,
    handleConfirmFilter,
  };
}

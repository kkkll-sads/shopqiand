import { useState } from 'react';
import {
  CATEGORY_OPTIONS,
  DEFAULT_CATEGORY_FILTER,
  DEFAULT_FLOW_FILTER,
  DEFAULT_TIME_FILTER,
  FLOW_OPTIONS,
  TIME_OPTIONS,
} from '../constants';
import type { AssetFlowFilter, AssetTimeFilter } from '../types';

export function useAssetViewFilters() {
  const [filterCategory, setFilterCategory] = useState(DEFAULT_CATEGORY_FILTER);
  const [filterFlow, setFilterFlow] = useState<AssetFlowFilter>(DEFAULT_FLOW_FILTER);
  const [filterTime, setFilterTime] = useState<AssetTimeFilter>(DEFAULT_TIME_FILTER);

  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [tempFilterCategory, setTempFilterCategory] = useState(DEFAULT_CATEGORY_FILTER);
  const [tempFilterFlow, setTempFilterFlow] = useState<AssetFlowFilter>(DEFAULT_FLOW_FILTER);
  const [tempFilterTime, setTempFilterTime] = useState<AssetTimeFilter>(DEFAULT_TIME_FILTER);

  const handleOpenFilterSheet = () => {
    setTempFilterCategory(filterCategory);
    setTempFilterFlow(filterFlow);
    setTempFilterTime(filterTime);
    setShowFilterSheet(true);
  };

  const handleConfirmFilter = () => {
    setFilterCategory(tempFilterCategory);
    setFilterFlow(tempFilterFlow);
    setFilterTime(tempFilterTime);
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
    tempFilterTime,
    setTempFilterCategory,
    setTempFilterFlow,
    setTempFilterTime,
    categoryOptions: CATEGORY_OPTIONS,
    flowOptions: FLOW_OPTIONS,
    timeOptions: TIME_OPTIONS,
    handleOpenFilterSheet,
    handleConfirmFilter,
  };
}

import type { MyCollectionItem } from '@/services';

export enum ActionModalState {
  CLOSED = 'closed',
  OPEN_DELIVERY = 'open_delivery',
  OPEN_CONSIGNMENT = 'open_consignment',
  SUBMITTING = 'submitting',
}

export enum ActionModalEvent {
  OPEN_DELIVERY = 'OPEN_DELIVERY',
  OPEN_CONSIGNMENT = 'OPEN_CONSIGNMENT',
  SWITCH_TO_DELIVERY = 'SWITCH_TO_DELIVERY',
  SWITCH_TO_CONSIGNMENT = 'SWITCH_TO_CONSIGNMENT',
  SUBMIT = 'SUBMIT',
  SUBMIT_SUCCESS = 'SUBMIT_SUCCESS',
  SUBMIT_ERROR = 'SUBMIT_ERROR',
  CLOSE = 'CLOSE',
}

export interface ConsignmentCheckResult {
  unlocked: boolean;
  remainingSeconds: number | null;
  remainingText: string | null;
  canConsign: boolean;
}

export interface DeliveryCheckResult {
  can48Hours: boolean;
  hoursLeft: number;
  isConsigning: boolean;
  hasConsignedBefore: boolean;
  isDelivered: boolean;
  hasConsignedSuccessfully: boolean;
}

export interface ActionModalContext {
  selectedItem: MyCollectionItem | null;
  actionType: 'delivery' | 'consignment' | null;
  error: string | null;
  consignmentCheckData: any | null;
  deliveryCheckResult: DeliveryCheckResult | null;
  countdown: { hours: number; minutes: number; seconds: number } | null;
  consignmentTicketCount: number;
}

export interface UseAssetActionModalReturn {
  state: ActionModalState;
  context: ActionModalContext;
  isOpen: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  openDelivery: (item: MyCollectionItem) => void;
  openConsignment: (item: MyCollectionItem) => void;
  switchToDelivery: () => void;
  switchToConsignment: () => void;
  handleSubmit: () => void;
  close: () => void;
  deliveryCheckResult: DeliveryCheckResult | null;
  consignmentCheckResult: ConsignmentCheckResult | null;
}

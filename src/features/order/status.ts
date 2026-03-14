export function isPendingReceiptOrderStatus(status?: string | null): boolean {
  return status === 'shipped' || status === 'pending_confirm' || status === 'pending_receive';
}

export function isAfterSaleEligibleOrderStatus(status?: string | null): boolean {
  return status === 'paid' || isPendingReceiptOrderStatus(status) || status === 'completed';
}

export function canShowOrderLogistics(status?: string | null): boolean {
  return isPendingReceiptOrderStatus(status) || status === 'completed';
}

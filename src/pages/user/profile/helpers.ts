export const getUserTypeLabel = (userType?: number): string => {
  if (userType === undefined || userType === null) return '--';

  switch (userType) {
    case 0:
      return '新用户';
    case 1:
      return '普通用户';
    case 2:
      return '交易用户';
    default:
      return '--';
  }
};

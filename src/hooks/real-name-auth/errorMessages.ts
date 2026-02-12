/**
 * 根据错误码获取错误信息
 */
export const getErrorMsgByCode = (code: string): string => {
  const errorMap: Record<string, string> = {
    '2': '身份信息不匹配',
    '3': '身份信息不匹配',
    '4': '活体检测不通过',
    '5': '活体检测超时，请重试',
    '6': '身份信息不一致',
    '7': '无身份证照片',
    '8': '照片过大',
    '9': '权威数据错误，请重试',
    '10': '活体检测不通过',
    '11': '识别到未成年人',
  };

  return errorMap[code] || '人脸核身验证失败';
};

/**
 * 根据状态码和原因类型获取错误信息
 */
export const getErrorMsgByStatus = (status: number, reasonType?: number): string => {
  if (status === 2) {
    if (reasonType) {
      return getErrorMsgByCode(String(reasonType));
    }
    return '人脸核身验证失败';
  }

  if (status === 0) {
    return '核身待定，请稍后重试';
  }

  return '人脸核身验证失败';
};

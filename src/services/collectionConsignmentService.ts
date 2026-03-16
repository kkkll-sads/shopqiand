import { collectionConsignmentApi, type BatchConsignableListData } from '../api/modules/collectionConsignment';

export interface BatchConsignableResponse {
  code: number;
  data: BatchConsignableListData;
  message: string;
}

export const collectionConsignmentService = {
  async getBatchConsignableList(): Promise<BatchConsignableResponse> {
    const data = await collectionConsignmentApi.batchConsignableList({ page: 1, limit: 50 });

    return {
      code: 1,
      data,
      message: 'ok',
    };
  },
};

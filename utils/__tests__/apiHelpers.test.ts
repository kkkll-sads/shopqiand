/**
 * apiHelpers 单元测试
 *
 * 测试覆盖：
 * - isSuccess() 成功判断
 * - extractData() 数据提取
 * - extractError() 错误提取
 * - withErrorHandling() 自动错误处理
 * - withErrorThrow() 失败抛错
 * - batchApiCalls() 批量请求
 *
 * 运行测试：
 * npm test -- apiHelpers.test.ts
 */

import {
    isSuccess,
    extractData,
    extractError,
    extractErrorFromException,
    withErrorHandling,
    withErrorThrow,
    batchApiCalls,
    hasErrorCode,
    isLoginExpired,
    isApiResponse,
    ApiResponse,
} from '../apiHelpers';

// ============================================================================
// Mock Data
// ============================================================================

const mockSuccessResponse: ApiResponse<{ name: string }> = {
    code: 1,
    msg: '',
    data: { name: 'Test User' },
};

const mockFailureResponse: ApiResponse = {
    code: 0,
    msg: '操作失败',
};

const mockUndefinedCodeResponse: ApiResponse<{ value: number }> = {
    data: { value: 123 },
};

const mockErrorResponse: ApiResponse = {
    code: 500,
    message: '服务器错误',
};

// ============================================================================
// 测试套件：isSuccess()
// ============================================================================

describe('isSuccess', () => {
    test('应该在 code === 1 时返回 true', () => {
        expect(isSuccess(mockSuccessResponse)).toBe(true);
    });

    test('应该在 code !== 1 时返回 false', () => {
        expect(isSuccess(mockFailureResponse)).toBe(false);
    });

    test('应该在 code === undefined 时返回 true（兼容模式）', () => {
        expect(isSuccess(mockUndefinedCodeResponse)).toBe(true);
    });

    test('应该在 response 为 null 时返回 false', () => {
        expect(isSuccess(null)).toBe(false);
    });

    test('应该在 response 为 undefined 时返回 false', () => {
        expect(isSuccess(undefined)).toBe(false);
    });
});

// ============================================================================
// 测试套件：extractData()
// ============================================================================

describe('extractData', () => {
    test('应该在成功时返回 data', () => {
        const data = extractData(mockSuccessResponse);
        expect(data).toEqual({ name: 'Test User' });
    });

    test('应该在失败时返回 null', () => {
        const data = extractData(mockFailureResponse);
        expect(data).toBeNull();
    });

    test('应该在 code=undefined 时返回 data', () => {
        const data = extractData(mockUndefinedCodeResponse);
        expect(data).toEqual({ value: 123 });
    });

    test('应该在 response 为 null 时返回 null', () => {
        const data = extractData(null);
        expect(data).toBeNull();
    });

    test('应该在 data 字段不存在时返回 null', () => {
        const response: ApiResponse = { code: 1 };
        const data = extractData(response);
        expect(data).toBeNull();
    });
});

// ============================================================================
// 测试套件：extractError()
// ============================================================================

describe('extractError', () => {
    test('应该优先返回 msg 字段', () => {
        const response: ApiResponse = { code: 0, msg: '自定义错误', message: '次要错误' };
        expect(extractError(response)).toBe('自定义错误');
    });

    test('应该在 msg 为空时返回 message 字段', () => {
        const response: ApiResponse = { code: 0, message: '消息错误' };
        expect(extractError(response)).toBe('消息错误');
    });

    test('应该在 msg 和 message 都为空时返回默认信息', () => {
        const response: ApiResponse = { code: 0 };
        expect(extractError(response)).toBe('操作失败，请稍后重试');
    });

    test('应该支持自定义默认错误信息', () => {
        const response: ApiResponse = { code: 0 };
        expect(extractError(response, '自定义默认错误')).toBe('自定义默认错误');
    });

    test('应该在 response 为 null 时返回默认信息', () => {
        expect(extractError(null)).toBe('操作失败，请稍后重试');
    });
});

// ============================================================================
// 测试套件：extractErrorFromException()
// ============================================================================

describe('extractErrorFromException', () => {
    test('应该提取标准 Error 的 message', () => {
        const error = new Error('网络错误');
        expect(extractErrorFromException(error)).toBe('网络错误');
    });

    test('应该提取自定义错误对象的 msg', () => {
        const error = { msg: '自定义错误' };
        expect(extractErrorFromException(error)).toBe('自定义错误');
    });

    test('应该提取嵌套的 response.msg', () => {
        const error = { response: { msg: '嵌套错误' } };
        expect(extractErrorFromException(error)).toBe('嵌套错误');
    });

    test('应该在所有字段都为空时返回默认信息', () => {
        const error = {};
        expect(extractErrorFromException(error)).toBe('操作失败，请稍后重试');
    });

    test('应该在 error 为 null 时返回默认信息', () => {
        expect(extractErrorFromException(null)).toBe('操作失败，请稍后重试');
    });

    test('应该优先使用 msg 而非 response.msg', () => {
        const error = { msg: '优先错误', response: { msg: '次要错误' } };
        expect(extractErrorFromException(error)).toBe('优先错误');
    });
});

// ============================================================================
// 测试套件：withErrorHandling()
// ============================================================================

describe('withErrorHandling', () => {
    test('应该在成功时返回 data', async () => {
        const apiFn = jest.fn().mockResolvedValue(mockSuccessResponse);
        const result = await withErrorHandling(apiFn);

        expect(result).toEqual({ name: 'Test User' });
        expect(apiFn).toHaveBeenCalledTimes(1);
    });

    test('应该在失败时返回 null 并调用 onError', async () => {
        const apiFn = jest.fn().mockResolvedValue(mockFailureResponse);
        const onError = jest.fn();
        const result = await withErrorHandling(apiFn, onError);

        expect(result).toBeNull();
        expect(onError).toHaveBeenCalledWith('操作失败');
    });

    test('应该在 API 抛出异常时返回 null 并调用 onError', async () => {
        const apiFn = jest.fn().mockRejectedValue(new Error('网络错误'));
        const onError = jest.fn();
        const result = await withErrorHandling(apiFn, onError);

        expect(result).toBeNull();
        expect(onError).toHaveBeenCalledWith('网络错误');
    });

    test('应该在没有 onError 回调时仍然正常工作', async () => {
        const apiFn = jest.fn().mockResolvedValue(mockFailureResponse);
        const result = await withErrorHandling(apiFn);

        expect(result).toBeNull();
    });

    test('应该在 code=undefined 时返回 data', async () => {
        const apiFn = jest.fn().mockResolvedValue(mockUndefinedCodeResponse);
        const result = await withErrorHandling(apiFn);

        expect(result).toEqual({ value: 123 });
    });
});

// ============================================================================
// 测试套件：withErrorThrow()
// ============================================================================

describe('withErrorThrow', () => {
    test('应该在成功时返回 data', async () => {
        const apiFn = jest.fn().mockResolvedValue(mockSuccessResponse);
        const result = await withErrorThrow(apiFn);

        expect(result).toEqual({ name: 'Test User' });
    });

    test('应该在失败时抛出错误', async () => {
        const apiFn = jest.fn().mockResolvedValue(mockFailureResponse);

        await expect(withErrorThrow(apiFn)).rejects.toThrow('操作失败');
    });

    test('应该在 API 抛出异常时传递异常', async () => {
        const apiFn = jest.fn().mockRejectedValue(new Error('网络错误'));

        await expect(withErrorThrow(apiFn)).rejects.toThrow('网络错误');
    });

    test('应该在 data 为 null 时抛出错误', async () => {
        const response: ApiResponse = { code: 1, data: null };
        const apiFn = jest.fn().mockResolvedValue(response);

        await expect(withErrorThrow(apiFn)).rejects.toThrow('服务器返回数据为空');
    });

    test('应该在 code=undefined 时返回 data', async () => {
        const apiFn = jest.fn().mockResolvedValue(mockUndefinedCodeResponse);
        const result = await withErrorThrow(apiFn);

        expect(result).toEqual({ value: 123 });
    });
});

// ============================================================================
// 测试套件：batchApiCalls()
// ============================================================================

describe('batchApiCalls', () => {
    test('应该并行执行多个请求并返回成功/失败统计', async () => {
        const apiFn1 = jest.fn().mockResolvedValue(mockSuccessResponse);
        const apiFn2 = jest.fn().mockResolvedValue(mockFailureResponse);
        const apiFn3 = jest.fn().mockResolvedValue(mockUndefinedCodeResponse);

        const result = await batchApiCalls([apiFn1, apiFn2, apiFn3]);

        expect(result.total).toBe(3);
        expect(result.success).toHaveLength(2); // apiFn1 和 apiFn3 成功
        expect(result.failed).toHaveLength(1); // apiFn2 失败
    });

    test('应该在所有请求成功时返回所有数据', async () => {
        const apiFn1 = jest.fn().mockResolvedValue({ code: 1, data: { id: 1 } });
        const apiFn2 = jest.fn().mockResolvedValue({ code: 1, data: { id: 2 } });

        const result = await batchApiCalls([apiFn1, apiFn2]);

        expect(result.success).toEqual([{ id: 1 }, { id: 2 }]);
        expect(result.failed).toHaveLength(0);
    });

    test('应该在所有请求失败时返回所有错误', async () => {
        const apiFn1 = jest.fn().mockRejectedValue(new Error('错误1'));
        const apiFn2 = jest.fn().mockRejectedValue(new Error('错误2'));

        const result = await batchApiCalls([apiFn1, apiFn2]);

        expect(result.success).toHaveLength(0);
        expect(result.failed).toHaveLength(2);
    });

    test('应该处理空数组', async () => {
        const result = await batchApiCalls([]);

        expect(result.total).toBe(0);
        expect(result.success).toHaveLength(0);
        expect(result.failed).toHaveLength(0);
    });
});

// ============================================================================
// 测试套件：hasErrorCode()
// ============================================================================

describe('hasErrorCode', () => {
    test('应该在 code 匹配时返回 true', () => {
        const response: ApiResponse = { code: 404 };
        expect(hasErrorCode(response, 404)).toBe(true);
    });

    test('应该在 code 不匹配时返回 false', () => {
        const response: ApiResponse = { code: 200 };
        expect(hasErrorCode(response, 404)).toBe(false);
    });

    test('应该在 response 为 null 时返回 false', () => {
        expect(hasErrorCode(null, 404)).toBe(false);
    });
});

// ============================================================================
// 测试套件：isLoginExpired()
// ============================================================================

describe('isLoginExpired', () => {
    test('应该在 code === 401 时返回 true', () => {
        const response: ApiResponse = { code: 401 };
        expect(isLoginExpired(response)).toBe(true);
    });

    test('应该在 code === -1 时返回 true', () => {
        const response: ApiResponse = { code: -1 };
        expect(isLoginExpired(response)).toBe(true);
    });

    test('应该在 code 为其他值时返回 false', () => {
        const response: ApiResponse = { code: 200 };
        expect(isLoginExpired(response)).toBe(false);
    });

    test('应该在 response 为 null 时返回 false', () => {
        expect(isLoginExpired(null)).toBe(false);
    });
});

// ============================================================================
// 测试套件：isApiResponse()
// ============================================================================

describe('isApiResponse', () => {
    test('应该识别标准 ApiResponse', () => {
        const obj = { code: 1, data: {} };
        expect(isApiResponse(obj)).toBe(true);
    });

    test('应该识别只有 data 字段的对象', () => {
        const obj = { data: {} };
        expect(isApiResponse(obj)).toBe(true);
    });

    test('应该拒绝 null', () => {
        expect(isApiResponse(null)).toBe(false);
    });

    test('应该拒绝非对象', () => {
        expect(isApiResponse('string')).toBe(false);
        expect(isApiResponse(123)).toBe(false);
        expect(isApiResponse(true)).toBe(false);
    });

    test('应该拒绝空对象', () => {
        expect(isApiResponse({})).toBe(false);
    });
});

// ============================================================================
// 集成测试：真实场景模拟
// ============================================================================

describe('Integration Tests', () => {
    test('场景1：用户登录成功', async () => {
        // Mock API
        const loginApi = jest.fn().mockResolvedValue({
            code: 1,
            data: {
                token: 'abc123',
                userInfo: { id: 1, name: 'Test User' },
            },
        });

        // 调用
        const result = await withErrorHandling(loginApi);

        // 验证
        expect(result).toBeDefined();
        expect(result?.token).toBe('abc123');
        expect(result?.userInfo.name).toBe('Test User');
    });

    test('场景2：用户登录失败', async () => {
        // Mock API
        const loginApi = jest.fn().mockResolvedValue({
            code: 0,
            msg: '账号或密码错误',
        });

        const onError = jest.fn();

        // 调用
        const result = await withErrorHandling(loginApi, onError);

        // 验证
        expect(result).toBeNull();
        expect(onError).toHaveBeenCalledWith('账号或密码错误');
    });

    test('场景3：网络错误', async () => {
        // Mock API
        const loginApi = jest.fn().mockRejectedValue(new Error('Network Error'));

        const onError = jest.fn();

        // 调用
        const result = await withErrorHandling(loginApi, onError);

        // 验证
        expect(result).toBeNull();
        expect(onError).toHaveBeenCalledWith('Network Error');
    });

    test('场景4：批量加载多个资源', async () => {
        // Mock APIs
        const fetchProfile = jest.fn().mockResolvedValue({ code: 1, data: { name: 'User' } });
        const fetchBalance = jest.fn().mockResolvedValue({ code: 1, data: { balance: 100 } });
        const fetchOrders = jest.fn().mockResolvedValue({ code: 0, msg: '订单加载失败' });

        // 调用
        const { success, failed, total } = await batchApiCalls([
            fetchProfile,
            fetchBalance,
            fetchOrders,
        ]);

        // 验证
        expect(total).toBe(3);
        expect(success).toHaveLength(2);
        expect(failed).toHaveLength(1);
    });
});

import type { MockHandlerMap } from '../core/client';
import type { MessageTab } from '../modules/message';

/**
 * Mock 请求处理器映射表
 * 所有接口返回空数据或最小化结构，不包含硬编码业务数据。
 */

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

const mockAnnouncements = [
  {
    id: 101,
    title: '平台系统升级通知',
    content:
      '<p>为了提升稳定性，平台将于今晚 23:30 至次日 01:00 进行服务升级。</p><p>升级期间部分页面可能短暂不可用，请提前做好安排。</p>',
    type: 'normal',
    type_text: '平台公告',
    sort: 99,
    createtime: '2026-03-12 10:00:00',
    is_read: false,
  },
  {
    id: 102,
    title: '提货与发货时效说明',
    content:
      '<p>工作日 17:00 前完成支付的订单，将优先安排当日发货。</p><p>节假日期间时效可能顺延，具体以物流信息为准。</p>',
    type: 'normal',
    type_text: '平台公告',
    sort: 0,
    createtime: '2026-03-10 15:20:00',
    is_read: true,
  },
];

export const mockHandlers: MockHandlerMap = {
  'GET /api/Announcement/index': ({ url }) => {
    const type = url.searchParams.get('type');
    const list = type ? mockAnnouncements.filter((item) => item.type === type) : mockAnnouncements;

    return {
      code: 1,
      message: 'ok',
      data: {
        list,
        total: list.length,
        current_page: 1,
        last_page: 1,
      },
    };
  },

  'GET /api/Announcement/detail': ({ url }) => {
    const id = Number(url.searchParams.get('id') || '0');
    const announcement = mockAnnouncements.find((item) => item.id === id);

    if (!announcement) {
      return {
        code: 0,
        message: '公告不存在',
        data: null,
      };
    }

    return {
      code: 1,
      message: 'ok',
      data: { announcement },
    };
  },

  'GET /api/Announcement/scroll': () => ({
    code: 1,
    message: 'ok',
    data: {
      list: mockAnnouncements.map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        is_read: item.is_read,
      })),
    },
  }),

  // ─── 公告弹窗 ───
  'GET /api/Announcement/popup': () => ({
    code: 1,
    message: 'ok',
    data: { list: [] },
  }),

  // ─── 消息列表 ───
  'GET /messages': () => ({
    code: 1,
    message: 'ok',
    data: [],
  }),

  // ─── 登录预检 ───
  'GET /api/User/checkIn': () => ({
    code: 1,
    message: 'ok',
    data: {
      userLoginCaptchaSwitch: false,
      accountVerificationType: [],
      loginTabs: ['login', 'sms_login'],
      defaultTab: 'login',
    },
  }),

  // ─── 登录 / 注册 / 短信登录 ───
  'POST /api/User/checkIn': ({ body }) => {
    const payload = asRecord(body);
    const tab = readValue(payload.tab);

    if (tab === 'login') {
      const username = readValue(payload.username);
      const password = readValue(payload.password);
      if (!username || !password) {
        return { code: 0, message: '请输入用户名和密码', data: null };
      }
      return { code: 0, message: 'Mock 模式下不支持登录，请连接后端', data: null };
    }

    if (tab === 'register') {
      const mobile = readValue(payload.mobile);
      const password = readValue(payload.password);
      const payPassword = readValue(payload.pay_password);
      const captcha = readValue(payload.captcha);
      if (!mobile || !password || !payPassword || !captcha) {
        return { code: 0, message: '请完整填写注册信息', data: null };
      }
      return { code: 0, message: 'Mock 模式下不支持注册，请连接后端', data: null };
    }

    if (tab === 'sms_login') {
      const mobile = readValue(payload.mobile);
      const captcha = readValue(payload.captcha);
      if (!mobile || !captcha) {
        return { code: 0, message: '请输入手机号和验证码', data: null };
      }
      return { code: 0, message: 'Mock 模式下不支持短信登录，请连接后端', data: null };
    }

    return { code: 0, message: '未知操作', data: null };
  },

  // ─── 短信发送 ───
  'POST /api/Sms/send': ({ body }) => {
    const payload = asRecord(body);
    const mobile = readValue(payload.mobile);
    const event = readValue(payload.event);

    if (!mobile) {
      return { code: 0, message: '请输入手机号', data: null };
    }
    if (!event) {
      return { code: 0, message: '缺少短信事件类型', data: null };
    }
    return { code: 1, message: '发送成功', data: null };
  },

  // ─── 老资产解锁状态 ───
  'GET /api/Account/checkOldAssetsUnlockStatus': () => ({
    code: 1,
    message: 'ok',
    data: {
      unlock_status: 0,
      unlock_conditions: {
        has_transaction: false,
        transaction_count: 0,
        direct_referrals_count: 0,
        qualified_referrals: 0,
        is_qualified: false,
        messages: [],
      },
      required_gold: 0,
      current_gold: 0,
      can_unlock: false,
      required_transactions: 0,
      required_referrals: 0,
      reward_value: 0,
    },
  }),

  // ─── 成长权益信息 ───
  'GET /api/Account/growthRightsInfo': () => ({
    code: 1,
    message: 'ok',
    data: {
      growth_days: 0,
      effective_trade_days: 0,
      today_trade_count: 0,
      total_trade_count: 0,
      pending_activation_gold: 0,
      growth_start_date: '',
      stage: { key: 'seedling', label: '初级阶段', rights_status: '未激活', min_days: 0 },
      stages: [],
      status: {
        can_activate: false,
        can_unlock_package: false,
        financing_enabled: false,
        is_accelerated_mode: false,
      },
      financing: { ratio: '--', rules: [] },
      cycle: {
        active_mode: 'daily_once',
        cycle_days: 0,
        completed_cycles: 0,
        next_cycle_in_days: 0,
        remaining_days_in_cycle: 0,
        unlock_amount_per_cycle: 0,
        unlockable_amount: 0,
        mode_progress: {},
      },
      daily_growth_logs: [],
    },
  }),

  // ─── 老资产解锁 ───
  'POST /api/Account/unlockOldAssets': () => ({
    code: 1,
    message: '解锁成功',
    data: {
      unlock_status: 1,
      consumed_gold: 0,
      reward_equity_package: 0,
      reward_consignment_coupon: 0,
    },
  }),

  // ─── 购物车 ───
  'GET /api/shopCart/count': () => ({
    code: 1,
    message: 'ok',
    data: { count: 0 },
  }),

  'GET /api/shopCart/list': () => ({
    code: 1,
    message: 'ok',
    data: { list: [] },
  }),

  // ─── 收货地址 ───
  'GET /api/shopAddress/index': () => ({
    code: 1,
    message: 'ok',
    data: { list: [] },
  }),

  'GET /api/shopAddress/getDefault': () => ({
    code: 1,
    message: 'ok',
    data: null,
  }),

  'POST /api/shopAddress/add': () => ({
    code: 1,
    message: '添加成功',
    data: { id: 0 },
  }),

  'POST /api/shopAddress/edit': () => ({
    code: 1,
    message: '修改成功',
    data: {},
  }),

  'POST /api/shopAddress/delete': () => ({
    code: 1,
    message: '删除成功',
    data: {},
  }),

  'POST /api/shopAddress/setDefault': () => ({
    code: 1,
    message: '设置成功',
    data: {},
  }),

  // ─── 购物车添加 ───
  'POST /api/shopCart/add': (ctx) => {
    const body = ctx.body as { product_id?: number; quantity?: number; sku_id?: number } | undefined;
    const quantity = typeof body?.quantity === 'number' && body.quantity > 0 ? body.quantity : 1;
    return { code: 1, message: 'ok', data: { id: 0, quantity } };
  },

  // ─── 订单创建 ───
  'POST /api/shopOrder/create': () => ({
    code: 1,
    message: 'ok',
    data: { order_id: 0, order_no: '', total_amount: 0 },
  }),

  // ─── 订单详情 ───
  'GET /api/shopOrder/detail': ({ url }) => {
    const id = url.searchParams.get('id');
    return {
      code: 1,
      message: 'ok',
      data: { id: id ? Number(id) : 0, balance_available: '0', score: '0' },
    };
  },

  // ─── 订单删除 ───
  'POST /api/shopOrder/delete': (ctx) => {
    const body = ctx.body as { order_id?: number } | undefined;
    const orderId = typeof body?.order_id === 'number' ? body.order_id : 0;
    return { code: 1, message: 'ok', data: { order_id: orderId } };
  },

  // ─── 订单取消 ───
  'POST /api/shopOrder/cancel': (ctx) => {
    const body = ctx.body as { order_id?: number; cancel_reason?: string } | undefined;
    const orderId = typeof body?.order_id === 'number' ? body.order_id : 0;
    return {
      code: 1,
      message: 'ok',
      data: { order_no: '', order_id: orderId, status: 'cancelled', need_review: false },
    };
  },

  // ─── 订单确认收货 ───
  'POST /api/shopOrder/confirm': (ctx) => {
    const body = ctx.body as { id?: number } | undefined;
    const orderId = typeof body?.id === 'number' ? body.id : 0;
    return { code: 1, message: 'ok', data: { id: orderId } };
  },

  // ─── 订单列表 ───
  'GET /api/shopOrder/myOrders': () => ({
    code: 1,
    message: 'ok',
    data: { list: [], balance_available: '0', score: '0' },
  }),
};

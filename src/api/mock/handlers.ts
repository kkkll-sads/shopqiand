import type { MockHandlerMap } from '../core/client';
import type { MessageItem, MessageTab } from '../modules/message';

const messagesByType: Record<MessageTab, MessageItem[]> = {
  system: [
    {
      id: 's1',
      title: '系统升级通知',
      summary: '今晚 02:00 至 04:00 将进行升级维护，部分功能短时不可用。',
      time: '2026-03-05 10:00',
      isRead: false,
    },
    {
      id: 's2',
      title: '实名认证审核通过',
      summary: '您的实名认证信息已审核通过，平台核心功能已开放。',
      time: '2026-03-04 15:30',
      isRead: true,
    },
  ],
  order: [
    {
      id: 'o1',
      title: '订单已发货',
      summary: '订单 1234567890 已发货，请注意查收。',
      time: '2小时前',
      isRead: false,
    },
    {
      id: 'o2',
      title: '退款处理完成',
      summary: '订单 0987654321 的退款已原路退回，预计 1 至 3 个工作日到账。',
      time: '昨天 14:20',
      isRead: true,
    },
  ],
  activity: [
    {
      id: 'a1',
      title: '春季预售开启',
      summary: '年度春季活动已上线，多类商品限时补贴。',
      time: '2026-03-01 00:00',
      isRead: false,
    },
  ],
};

interface MockAuthUser {
  id: string;
  mobile: string;
  password: string;
  payPassword: string;
  username: string;
}

const mockAuthUsers: MockAuthUser[] = [
  {
    id: '10001',
    mobile: '13800138000',
    password: 'abc12345',
    payPassword: 'pay12345',
    username: 'demo',
  },
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildMockSession(user: MockAuthUser) {
  return {
    baToken: `mock-ba-token-${user.id}`,
    baUserToken: `mock-ba-user-token-${user.id}`,
    routePath: '/user',
    userInfo: {
      id: user.id,
      uid: user.id,
      username: user.username,
      nickname: `会员${user.mobile.slice(-4)}`,
      mobile: user.mobile,
    },
  };
}

export const mockHandlers: MockHandlerMap = {
  'GET /api/Announcement/popup': () => ({
    code: 1,
    message: 'ok',
    data: { list: [] },
  }),
  'GET /messages': ({ url }) => {
    const type = (url.searchParams.get('type') ?? 'system') as MessageTab;
    return {
      code: 1,
      message: 'ok',
      data: messagesByType[type] ?? [],
    };
  },
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
  'POST /api/User/checkIn': ({ body }) => {
    const payload = asRecord(body);
    const tab = readValue(payload.tab);

    if (tab === 'login') {
      const username = readValue(payload.username);
      const password = readValue(payload.password);

      if (!username || !password) {
        return {
          code: 0,
          message: '请输入用户名和密码',
          data: null,
        };
      }

      const user = mockAuthUsers.find(
        (item) => item.username === username || item.mobile === username,
      );

      if (!user) {
        return {
          code: 0,
          message: '帐户不存在',
          data: null,
        };
      }

      if (user.password !== password) {
        return {
          code: 0,
          message: '密码错误',
          data: null,
        };
      }

      return {
        code: 1,
        message: '登录成功',
        data: buildMockSession(user),
      };
    }

    if (tab === 'register') {
      const mobile = readValue(payload.mobile);
      const password = readValue(payload.password);
      const payPassword = readValue(payload.pay_password);
      const captcha = readValue(payload.captcha);

      if (!mobile || !password || !payPassword || !captcha) {
        return {
          code: 0,
          message: '请完整填写注册信息',
          data: null,
        };
      }

      const duplicated = mockAuthUsers.some(
        (item) => item.mobile === mobile || item.username === mobile,
      );

      if (duplicated) {
        return {
          code: 0,
          message: '手机号已注册',
          data: null,
        };
      }

      const nextUser: MockAuthUser = {
        id: String(10000 + mockAuthUsers.length + 1),
        mobile,
        password,
        payPassword,
        username: mobile,
      };

      mockAuthUsers.push(nextUser);

      return {
        code: 1,
        message: '注册成功',
        data: buildMockSession(nextUser),
      };
    }

    if (tab === 'sms_login') {
      const mobile = readValue(payload.mobile);
      const captcha = readValue(payload.captcha);

      if (!mobile || !captcha) {
        return {
          code: 0,
          message: '请输入手机号和验证码',
          data: null,
        };
      }

      const user = mockAuthUsers.find((item) => item.mobile === mobile);

      if (!user) {
        return {
          code: 0,
          message: '该手机号未注册',
          data: null,
        };
      }

      return {
        code: 1,
        message: '登录成功',
        data: buildMockSession(user),
      };
    }

    return {
      code: 0,
      message: '未知操作',
      data: null,
    };
  },
  'POST /api/Sms/send': ({ body }) => {
    const payload = asRecord(body);
    const mobile = readValue(payload.mobile);
    const event = readValue(payload.event);

    if (!mobile) {
      return {
        code: 0,
        message: '请输入手机号',
        data: null,
      };
    }

    const user = mockAuthUsers.find((item) => item.mobile === mobile);

    if (!event) {
      return {
        code: 0,
        message: '缺少短信事件类型',
        data: null,
      };
    }

    if (event === 'user_register' && user) {
      return {
        code: 0,
        message: '手机号已注册，请直接登录',
        data: null,
      };
    }

    if (['user_retrieve_pwd', 'user_mobile_verify', 'user_login'].includes(event) && !user) {
      return {
        code: 0,
        message: '手机号未注册',
        data: null,
      };
    }

    return {
      code: 1,
      message: '发送成功',
      data: null,
    };
  },
  'GET /api/Account/checkOldAssetsUnlockStatus': () => ({
    code: 1,
    message: 'ok',
    data: {
      unlock_status: 0,
      unlock_conditions: {
        has_transaction: false,
        transaction_count: 0,
        direct_referrals_count: 2,
        qualified_referrals: 1,
        is_qualified: false,
        messages: ['需至少完成 1 笔交易', '直推有效用户 1/2'],
      },
      required_gold: 1000,
      current_gold: 4500,
      can_unlock: false,
      required_transactions: 1,
      required_referrals: 2,
      reward_value: 1000,
    },
  }),
  'GET /api/Account/growthRightsInfo': () => ({
    code: 1,
    message: 'ok',
    data: {
      growth_days: 28,
      effective_trade_days: 28,
      today_trade_count: 3095,
      total_trade_count: 51259,
      pending_activation_gold: 11111,
      growth_start_date: '2026-02-12',
      stage: {
        key: 'seedling',
        label: '初级阶段',
        rights_status: '未激活',
        min_days: 0,
      },
      stages: [
        { key: 'seedling', label: '初级阶段', min_days: 0, max_days: 37, rights_status: '未激活' },
        { key: 'growing', label: '成长期', min_days: 38, max_days: 44, rights_status: '可激活转向金' },
        { key: 'mature', label: '成熟期', min_days: 45, max_days: 59, rights_status: '可解锁资产包' },
        { key: 'advanced', label: '进阶期', min_days: 60, max_days: 89, rights_status: '配资比例提升' },
        { key: 'senior', label: '高级阶段', min_days: 90, max_days: null, rights_status: '优化配资比例' },
      ],
      status: {
        can_activate: false,
        can_unlock_package: false,
        financing_enabled: false,
        is_accelerated_mode: true,
      },
      financing: {
        ratio: '--',
        rules: [
          { min_days: 38, max_days: 59, ratio: '9:1' },
          { min_days: 60, max_days: 89, ratio: '8:2' },
          { min_days: 90, max_days: 119, ratio: '7:3' },
          { min_days: 120, max_days: null, ratio: '6:4' },
        ],
      },
      cycle: {
        active_mode: 'daily_three',
        cycle_days: 30,
        completed_cycles: 0,
        next_cycle_in_days: 2,
        remaining_days_in_cycle: 2,
        unlock_amount_per_cycle: 1000,
        unlockable_amount: 0,
        mode_progress: {
          daily_once: {
            label: '每日交易1次模式',
            growth_days: 28,
            required_days: 45,
            summary: { remaining_days_in_cycle: 17 },
          },
          daily_three: {
            label: '每日交易3次模式',
            growth_days: 28,
            required_days: 30,
            summary: { remaining_days_in_cycle: 2 },
          },
        },
      },
      daily_growth_logs: [
        { date: '2026-03-08', trade_count: 3095, counted: true, reason: '当日完成 3095 笔有效交易（门槛≥1笔），计入成长 1 天' },
        { date: '2026-03-07', trade_count: 1698, counted: true, reason: '当日完成 1698 笔有效交易（门槛≥1笔），计入成长 1 天' },
        { date: '2026-02-22', trade_count: 0, counted: true, reason: '【成长活动】活动期间额外计入成长 1 天', is_activity_bonus: true },
        { date: '2026-02-17', trade_count: 0, counted: false, reason: '当日无有效交易，未计入成长' },
        { date: '2026-02-12', trade_count: 0, counted: false, reason: '起算日前，不计入成长' },
      ],
    },
  }),
  'POST /api/Account/unlockOldAssets': () => ({
    code: 1,
    message: '解锁成功',
    data: {
      unlock_status: 1,
      consumed_gold: 1000,
      reward_equity_package: 1000,
      reward_consignment_coupon: 1,
    },
  }),
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

  'GET /api/shopAddress/index': () => ({
    code: 1,
    message: 'ok',
    data: {
      list: [
        {
          id: 1,
          name: '张三',
          phone: '13800138000',
          province: '广东省',
          city: '深圳市',
          district: '南山区',
          address: '科技园南区高新南九道99号',
          is_default: '1',
          create_time: 1709884800,
          update_time: 1709884800,
        },
        {
          id: 2,
          name: '李四',
          phone: '13900139000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          address: '建国路88号SOHO现代城',
          is_default: '0',
          create_time: 1709800000,
          update_time: 1709800000,
        },
      ],
    },
  }),

  'GET /api/shopAddress/getDefault': () => ({
    code: 1,
    message: 'ok',
    data: {
      id: 1,
      name: '张三',
      phone: '13800138000',
      province: '广东省',
      city: '深圳市',
      district: '南山区',
      address: '科技园南区高新南九道99号',
      is_default: '1',
      create_time: 1709884800,
      update_time: 1709884800,
    },
  }),

  'POST /api/shopAddress/add': (ctx) => {
    const body = ctx.body as { name?: string; phone?: string; address?: string } | undefined;
    const id = 100 + Math.floor(Math.random() * 900);
    return { code: 1, message: '添加成功', data: { id } };
  },

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

  'POST /api/shopCart/add': (ctx) => {
    const body = ctx.body as { product_id?: number; quantity?: number; sku_id?: number } | undefined;
    const quantity = typeof body?.quantity === 'number' && body.quantity > 0 ? body.quantity : 1;
    const id = typeof body?.product_id === 'number' ? body.product_id * 1000 + (body.sku_id ?? 0) : 1;
    return {
      code: 1,
      message: 'ok',
      data: { id, quantity },
    };
  },
  'POST /api/shopOrder/create': (ctx) => {
    const body = ctx.body as { cart_item_ids?: number[]; total_amount?: number } | undefined;
    const totalAmount = typeof body?.total_amount === 'number' ? body.total_amount : 0;
    const orderId = 1000 + Math.floor(Math.random() * 9999);
    const orderNo = `SO${Date.now().toString().slice(-10)}`;
    return {
      code: 1,
      message: 'ok',
      data: { order_id: orderId, order_no: orderNo, total_amount: totalAmount },
    };
  },

  'GET /api/shopOrder/detail': ({ url }) => {
    const id = url.searchParams.get('id');
    return {
      code: 1,
      message: 'ok',
      data: {
        id: id ? Number(id) : 0,
        balance_available: '12345.00',
        score: '500.00',
      },
    };
  },
  'POST /api/shopOrder/delete': (ctx) => {
    const body = ctx.body as { order_id?: number } | undefined;
    const orderId = typeof body?.order_id === 'number' ? body.order_id : 0;
    return {
      code: 1,
      message: 'ok',
      data: { order_id: orderId },
    };
  },
  'POST /api/shopOrder/cancel': (ctx) => {
    const body = ctx.body as { order_id?: number; cancel_reason?: string } | undefined;
    const orderId = typeof body?.order_id === 'number' ? body.order_id : 0;
    return {
      code: 1,
      message: 'ok',
      data: {
        order_no: `MOCK${orderId}`,
        order_id: orderId,
        status: 'cancelled',
        need_review: false,
      },
    };
  },
  'POST /api/shopOrder/confirm': (ctx) => {
    const body = ctx.body as { id?: number } | undefined;
    const orderId = typeof body?.id === 'number' ? body.id : 0;
    return {
      code: 1,
      message: 'ok',
      data: { id: orderId },
    };
  },

  'GET /api/shopOrder/myOrders': ({ url }) => {
    const status = url.searchParams.get('status') ?? '';
    const page = Number(url.searchParams.get('page')) || 1;
    const limit = Number(url.searchParams.get('limit')) || 10;
    const list = [
      {
        order_id: 1001,
        order_no: 'SO202603081001',
        status: status || 'unpaid',
        total_amount: 7999,
        create_time: Date.now() / 1000 - 3600,
        items: [
          {
            name: 'Apple iPhone 15 Pro (A2849) 256GB 蓝色钛金属',
            thumbnail: '/assets/placeholder.png',
            quantity: 1,
            price: 7999,
            spec_text: '颜色：蓝色钛金属 / 容量：256GB',
          },
        ],
      },
      {
        order_id: 1002,
        order_no: 'SO202603081002',
        status: 'pending_ship',
        total_amount: 299,
        create_time: Date.now() / 1000 - 7200,
        items: [
          { name: '自营精选商品', thumbnail: '', quantity: 2, price: 149.5, spec_text: '' },
        ],
      },
    ].filter((o) => !status || o.status === status);
    const start = (page - 1) * limit;
    const pagedList = list.slice(start, start + limit);
    return {
      code: 1,
      message: 'ok',
      data: {
        list: pagedList,
        balance_available: '12345.00',
        score: '500.00',
      },
    };
  },
};

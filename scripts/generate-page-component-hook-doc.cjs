const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const DOC_PATH = path.join(ROOT, 'docs', 'project-pages-components-hooks.md');

const REACT_BUILTIN_HOOKS = new Set([
  'useState',
  'useEffect',
  'useMemo',
  'useRef',
  'useCallback',
  'useLayoutEffect',
  'useContext',
  'useReducer',
  'useId',
  'useImperativeHandle',
  'useDeferredValue',
  'useTransition',
  'useSyncExternalStore',
  'useInsertionEffect',
  'useEffectEvent',
]);

function toPosix(filePath) {
  return filePath.replace(/\\/g, '/');
}

function listFilesRecursive(dir, predicate = () => true) {
  const out = [];
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(fullPath, predicate));
      continue;
    }
    if (predicate(fullPath)) {
      out.push(fullPath);
    }
  }

  return out;
}

function isTsFile(filePath) {
  return /\.(ts|tsx)$/.test(filePath) && !/\.d\.ts$/.test(filePath);
}

function isTsxFile(filePath) {
  return /\.tsx$/.test(filePath);
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function extractExportedNames(content) {
  const names = new Set();

  for (const m of content.matchAll(/export\s+const\s+([A-Za-z0-9_]+)/g)) {
    names.add(m[1]);
  }
  for (const m of content.matchAll(/export\s+function\s+([A-Za-z0-9_]+)/g)) {
    names.add(m[1]);
  }
  for (const m of content.matchAll(/export\s+class\s+([A-Za-z0-9_]+)/g)) {
    names.add(m[1]);
  }
  for (const m of content.matchAll(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g)) {
    names.add(m[1]);
  }
  for (const m of content.matchAll(/export\s*\{([^}]+)\}\s*(?:from\s+['"][^'"]+['"])?/g)) {
    const fragments = m[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/\btype\b/g, '').trim());

    for (const fragment of fragments) {
      const nameMatch = fragment.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
      if (nameMatch) {
        names.add(nameMatch[1]);
      }
    }
  }

  return [...names];
}

function extractImportStatements(content) {
  const statements = [];
  for (const m of content.matchAll(/import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    statements.push({
      rawBindings: m[1].trim(),
      source: m[2].trim(),
    });
  }
  return statements;
}

function extractBindingIdentifiers(rawBindings) {
  const cleaned = rawBindings
    .replace(/type\s+/g, ' ')
    .replace(/[{}*]/g, ' ')
    .replace(/\bas\b/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return [];

  const tokens = cleaned.match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
  return tokens.filter((token) => token !== 'from');
}

function resolveImportPath(fromFile, source) {
  if (!source.startsWith('.')) return null;

  const base = path.resolve(path.dirname(fromFile), source);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
    path.join(base, 'index.jsx'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function extractUsedHooks(content) {
  const hooks = new Set();
  for (const m of content.matchAll(/\b(use[A-Z][A-Za-z0-9_]*)\b/g)) {
    const hookName = m[1];
    if (!REACT_BUILTIN_HOOKS.has(hookName)) {
      hooks.add(hookName);
    }
  }
  return [...hooks];
}

function extractReturnObjectKeys(content) {
  const match = content.match(/return\s*\{([\s\S]*?)\};\s*$/m);
  if (!match) return [];

  const body = match[1]
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ');
  const tokens = body.match(/\b([A-Za-z_][A-Za-z0-9_]*)\b\s*(?=[:,])/g) || [];
  return uniqueSorted(tokens);
}

function extractFunctionSignature(content, functionName) {
  const escaped = functionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const r = new RegExp(`export\\s+function\\s+${escaped}\\s*\\(([\\s\\S]*?)\\)\\s*\\{`, 'm');
  const match = content.match(r);
  if (!match) return '';
  return match[1].replace(/\s+/g, ' ').trim();
}

function normalizeSourcePathLike(sourcePath) {
  return sourcePath.replace(/^\.\//, '').replace(/\\/g, '/');
}

function resolvePageSourceToFile(sourcePath) {
  const normalized = normalizeSourcePathLike(sourcePath);
  const base = path.join(SRC_DIR, 'pages', normalized);

  const candidates = [
    `${base}.tsx`,
    `${base}.ts`,
    path.join(base, 'index.tsx'),
    path.join(base, 'index.ts'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function buildRoutePageMapping() {
  const routerFile = path.join(SRC_DIR, 'router', 'index.tsx');
  const appLayoutFile = path.join(SRC_DIR, 'components', 'layout', 'AppLayout.tsx');
  const routerText = readUtf8(routerFile);
  const appLayoutText = readUtf8(appLayoutFile);

  const componentToSource = new Map();

  for (const m of routerText.matchAll(/import\s+\{([^}]+)\}\s+from\s+'\.\.\/pages\/([^']+)'/g)) {
    const names = m[1].split(',').map((name) => name.trim()).filter(Boolean);
    for (const name of names) {
      componentToSource.set(name, m[2]);
    }
  }

  for (const m of routerText.matchAll(/const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\('\.\.\/pages\/([^']+)'\)(?:\.then\(m\s*=>\s*\(\{\s*default:\s*m\.(\w+)\s*\}\)\))?/g)) {
    componentToSource.set(m[1], m[2]);
  }

  for (const m of appLayoutText.matchAll(/import\s+\{\s*(\w+)\s*\}\s+from\s+'\.\.\/\.\.\/pages\/([^']+)'/g)) {
    componentToSource.set(m[1], m[2]);
  }

  const componentToRoutes = new Map();

  for (const line of routerText.split(/\r?\n/)) {
    let m = line.match(/\{\s*index:\s*true,\s*element:\s*<(\w+)\s*\/?/);
    if (m) {
      const componentName = m[1];
      if (!componentToRoutes.has(componentName)) componentToRoutes.set(componentName, []);
      componentToRoutes.get(componentName).push('/');
      continue;
    }

    m = line.match(/\{\s*path:\s*'([^']+)'\s*,\s*element:\s*(.+)\s*\},?/);
    if (!m) continue;

    const routePath = `/${m[1].replace(/^\/+/, '')}`;
    const elementExpr = m[2];
    const componentMatch = elementExpr.match(/<(?:Lazy><)?(\w+)\b/);
    if (!componentMatch) continue;

    const componentName = componentMatch[1];
    if (!componentToRoutes.has(componentName)) componentToRoutes.set(componentName, []);
    componentToRoutes.get(componentName).push(routePath);
  }

  for (const m of appLayoutText.matchAll(/\{\s*path:\s*'([^']+)'\s*,\s*Component:\s*(\w+)\s*\}/g)) {
    const routePath = m[1];
    const componentName = m[2];
    if (!componentToRoutes.has(componentName)) componentToRoutes.set(componentName, []);
    componentToRoutes.get(componentName).push(routePath);
  }

  const entries = [];
  for (const [componentName, routes] of componentToRoutes.entries()) {
    const sourcePath = componentToSource.get(componentName);
    if (!sourcePath) {
      continue;
    }

    const filePath = resolvePageSourceToFile(sourcePath);
    if (!filePath) {
      continue;
    }

    entries.push({
      componentName,
      routes: uniqueSorted(routes),
      sourcePath,
      filePath,
    });
  }

  return entries.sort((a, b) => a.componentName.localeCompare(b.componentName));
}

function detectDomain(routes, relativePath) {
  const routeBlob = `${routes.join(' ')} ${relativePath}`.toLowerCase();

  if (/login|register|password|auth/.test(routeBlob)) return '认证与账号安全';
  if (/order|checkout|cashier|payment|logistics|after-sales/.test(routeBlob)) return '订单与交易履约';
  if (/product|category|search|review|store|flash-sale|cart/.test(routeBlob)) return '商城与商品浏览';
  if (/coupon|billing|recharge|withdraw|transfer|rights|hashrate|collection|card-packs/.test(routeBlob)) return '资产与权益管理';
  if (/message|announcement|help|about|support|customer|friends|invite/.test(routeBlob)) return '消息、客服与社交';
  if (/live|trading|reservation|matching|item-detail/.test(routeBlob)) return '交易专区与活动场景';
  if (/user|settings|profile|security|address|payment-accounts/.test(routeBlob)) return '个人中心与设置';
  if (/sign-in/.test(routeBlob)) return '签到与活动增长';
  return '通用页面';
}

function simplifyApiNames(apiNames) {
  const normalized = apiNames
    .map((name) => name.replace(/Api$/, 'Api'))
    .filter((name) => /Api$/.test(name) || name === 'api')
    .filter((name) => name !== 'type');
  return uniqueSorted(normalized);
}

function collectFileFacts(filePath) {
  const content = readUtf8(filePath);
  const imports = extractImportStatements(content);
  const hooks = extractUsedHooks(content);
  const exported = extractExportedNames(content);

  const apiNames = [];
  const componentNames = [];

  for (const statement of imports) {
    const identifiers = extractBindingIdentifiers(statement.rawBindings);
    const resolvedImport = resolveImportPath(filePath, statement.source);

    if (statement.source.includes('/api') || statement.source === '../api' || statement.source === '../../api' || statement.source === '../../../api') {
      apiNames.push(...identifiers.filter((name) => /Api$/.test(name) || name === 'api'));
    }

    if (resolvedImport) {
      const relImport = toPosix(path.relative(SRC_DIR, resolvedImport));
      if (relImport.startsWith('components/') || relImport.includes('/components/')) {
        componentNames.push(...identifiers.filter((name) => /^[A-Z]/.test(name)));
      }
      if (relImport.includes('/hooks/') || relImport.startsWith('hooks/')) {
        hooks.push(...identifiers.filter((name) => /^use[A-Z]/.test(name)));
      }
    }
  }

  return {
    exported: uniqueSorted(exported),
    hooks: uniqueSorted(hooks),
    apiNames: simplifyApiNames(apiNames),
    componentNames: uniqueSorted(componentNames),
  };
}

function inferComponentCategory(relativePath, componentName) {
  const normalized = relativePath.toLowerCase();
  const lowerName = componentName.toLowerCase();

  if (normalized.startsWith('components/ui/')) return '基础 UI 组件';
  if (normalized.startsWith('components/layout/')) return '布局组件';
  if (normalized.startsWith('components/biz/')) return '业务复用组件';
  if (lowerName.includes('provider')) return '上下文 Provider 组件';
  if (lowerName.includes('modal') || lowerName.includes('dialog') || lowerName.includes('sheet') || lowerName.includes('actionsheet') || lowerName.includes('panel')) return '弹层与交互面板组件';
  if (lowerName.includes('header')) return '页面头部组件';
  if (lowerName.includes('card')) return '信息卡片组件';
  if (lowerName.includes('tab')) return '标签切换组件';
  if (lowerName.includes('form')) return '表单组件';
  if (normalized.includes('/features/')) return '领域功能组件';
  if (normalized.includes('/pages/')) return '页面私有组件';

  return '通用组件';
}

function buildHooksManualSection() {
  const items = [
    {
      name: 'useAppLifecycle',
      file: 'src/hooks/useAppLifecycle.ts',
      purpose: '对 `lib/appLifecycle` 的 React Hook 转发，读取当前应用前后台状态与网络状态快照。',
      input: '无。',
      output: '`appState`、`isOffline`、`lastUpdatedAt` 等生命周期字段（由底层库提供）。',
    },
    {
      name: 'useAppResumeEffect',
      file: 'src/hooks/useAppLifecycle.ts',
      purpose: '封装“应用从后台回到前台”触发逻辑，只在状态从非 `active` 切到 `active` 时执行回调。',
      input: '`callback: () => void`。',
      output: '无返回值，内部通过 `useEffectEvent` 保证回调引用稳定。',
    },
    {
      name: 'useAppNavigate',
      file: 'src/hooks/useAppNavigate.ts',
      purpose: '统一导航能力入口，透传 `lib/navigation` 中的应用级跳转方法。',
      input: '无。',
      output: '`goTo`、`goBack` 等导航方法（由底层实现提供）。',
    },
    {
      name: 'useAuthSession',
      file: 'src/hooks/useAuthSession.ts',
      purpose: '订阅登录态快照，组件内实时感知认证状态变化。',
      input: '无。',
      output: '`session`、`isAuthenticated`、`clearAuthSession`。',
    },
    {
      name: 'useCartCount',
      file: 'src/hooks/useCartCount.ts',
      purpose: '管理购物车数量读取与跨页面同步，未登录时自动归零。',
      input: '无。',
      output: '`cartCount`、`loading`、`reloadCartCount`。并提供 `notifyCartCountSync()` 触发全局刷新事件。',
    },
    {
      name: 'useClaimUnlock',
      file: 'src/hooks/useClaimUnlock.ts',
      purpose: '维护权益解锁状态对象，支持局部 patch 更新。',
      input: '`options.initialStatus`（可选初始状态覆盖）。',
      output: '`unlockStatus`、`updateUnlockStatus`。',
    },
    {
      name: 'useInfiniteScroll',
      file: 'src/hooks/useInfiniteScroll.ts',
      purpose: '基于 `IntersectionObserver` 的触底加载 Hook。',
      input: '`targetRef`、`hasMore`、`loading`、`onLoadMore` 及阈值配置。',
      output: '无返回值；监听命中时自动调用 `onLoadMore`。',
    },
    {
      name: 'useNetworkStatus',
      file: 'src/hooks/useNetworkStatus.ts',
      purpose: '读取离线状态并提供手动刷新网络快照方法。',
      input: '无。',
      output: '`isOffline`、`refreshStatus`。',
    },
    {
      name: 'useOldAssetsUnlock',
      file: 'src/hooks/useOldAssetsUnlock.ts',
      purpose: '拉取“老资产解锁”状态并映射到前端统一结构，封装解锁提交与重载。',
      input: '无（内部依赖登录态）。',
      output: '`unlockStatus`、`statusError`、`reloadStatus`、`unlock`。',
    },
    {
      name: 'usePullToRefresh',
      file: 'src/hooks/usePullToRefresh.ts',
      purpose: '处理移动端下拉刷新手势，内置阻尼、阈值与刷新状态机。',
      input: '`containerRef`、`onRefresh`、`disabled`。',
      output: '`pullDistance`、`pulling`、`refreshing`。',
    },
    {
      name: 'useRequest',
      file: 'src/hooks/useRequest.ts',
      purpose: '通用请求状态管理：支持缓存 TTL、并发取消、错误归一、手动/自动请求。',
      input: '`service(signal)` 与 `options`（`cacheKey`、`deps`、`manual` 等）。',
      output: '`data`、`error`、`loading`、`reload`、`setData`。',
    },
    {
      name: 'useRouteScrollRestoration',
      file: 'src/hooks/useRouteScrollRestoration.ts',
      purpose: '保存并恢复路由容器滚动位置，主要处理浏览器后退（`POP`）场景。',
      input: '`containerRef`、`restoreWhen`、`restoreDeps`、`namespace` 等。',
      output: '无返回值；副作用为自动写入/读取 `sessionStorage` 并恢复 `scrollTop`。',
    },
    {
      name: 'useSessionState',
      file: 'src/hooks/useSessionState.ts',
      purpose: '将 React 状态与 `sessionStorage` 双向同步，支持自定义序列化/反序列化。',
      input: '`key`、`initialValue`、`options`。',
      output: '`[value, setValue]`。',
    },
    {
      name: 'useSmsCode',
      file: 'src/hooks/useSmsCode.ts',
      purpose: '封装短信验证码发送流程，包含手机号校验、倒计时与错误提示。',
      input: '`event`、`countdownSeconds`。',
      output: '`buttonText`、`canSend`、`message`、`sendCode`、`sending`、`setMessage`。',
    },
    {
      name: 'useSwipeBack',
      file: 'src/hooks/useSwipeBack.ts',
      purpose: '移动端左边缘滑动返回手势，直接操作 DOM 保持高帧率动画。',
      input: '`containerRef`、`contentRef`、`shadowRef`、`arrowRef`、`disabled`。',
      output: '无返回值；触发阈值后执行 `navigate(-1)`。',
    },
    {
      name: 'useViewScrollSnapshot',
      file: 'src/hooks/useViewScrollSnapshot.ts',
      purpose: '在视图切换时缓存并恢复滚动位置，支持非激活时自动归零。',
      input: '`active`、`containerRef`、`enabled`、`resetOnDeactivate`。',
      output: '无返回值；副作用为切换时写回 `scrollTop`。',
    },
    {
      name: 'useSignInPage',
      file: 'src/pages/SignIn/hooks/useSignInPage.ts',
      purpose: '签到页聚合 Hook：并行加载规则/进度/用户信息，并封装签到、邀请、提现逻辑。',
      input: '无。',
      output: '返回签到页完整视图模型（loading、活动信息、日历控制、按钮事件处理器等）。',
    },
  ];

  return items;
}

function buildDocument() {
  const routePages = buildRoutePageMapping();
  const routePageFileSet = new Set(routePages.map((item) => path.resolve(item.filePath)));

  const allPageTsxFiles = listFilesRecursive(path.join(SRC_DIR, 'pages'), (file) => isTsxFile(file));

  const extraPageFiles = allPageTsxFiles
    .filter((file) => !routePageFileSet.has(path.resolve(file)))
    .filter((file) => {
      const relative = toPosix(path.relative(SRC_DIR, file));
      return !relative.includes('/components/');
    })
    .map((file) => {
      const facts = collectFileFacts(file);
      const exportedPageNames = facts.exported.filter((name) => name.endsWith('Page'));
      return {
        componentName: exportedPageNames[0] || path.basename(file, path.extname(file)),
        routes: [],
        sourcePath: toPosix(path.relative(path.join(SRC_DIR, 'pages'), file)).replace(/\.(ts|tsx)$/, ''),
        filePath: file,
      };
    })
    .sort((a, b) => a.componentName.localeCompare(b.componentName));

  const allPageEntries = [...routePages, ...extraPageFiles];

  const componentFiles = uniqueSorted([
    ...listFilesRecursive(path.join(SRC_DIR, 'components'), (file) => isTsxFile(file)),
    ...listFilesRecursive(path.join(SRC_DIR, 'features'), (file) => isTsxFile(file) && toPosix(file).includes('/components/')),
    ...listFilesRecursive(path.join(SRC_DIR, 'pages'), (file) => isTsxFile(file) && toPosix(file).includes('/components/')),
    ...listFilesRecursive(path.join(SRC_DIR, 'pages'), (file) => {
      if (!isTsxFile(file)) return false;
      const rel = toPosix(path.relative(SRC_DIR, file));
      if (rel.includes('/components/')) return false;
      return !routePageFileSet.has(path.resolve(file));
    }),
  ]);

  const hookFiles = uniqueSorted([
    ...listFilesRecursive(path.join(SRC_DIR, 'hooks'), (file) => isTsFile(file) && path.basename(file).startsWith('use')),
    ...listFilesRecursive(path.join(SRC_DIR, 'pages'), (file) => isTsFile(file) && toPosix(file).includes('/hooks/') && path.basename(file).startsWith('use')),
  ]);

  let markdown = '';
  markdown += '# 页面、组件、Hooks 详细说明\n\n';
  markdown += '## 文档目的\n\n';
  markdown += '- 对当前前端代码中的页面、组件、hooks 建立统一职责说明，帮助新人快速定位代码与业务映射。\n';
  markdown += '- 通过“路由 -> 页面 -> 组件 -> Hook”链路说明，降低改动时的理解成本和联动风险。\n';
  markdown += '- 本文档基于 `src` 实际代码自动汇总生成，建议在大规模重构后重新生成并校对。\n\n';

  markdown += '## 页面清单（含路由）\n\n';
  markdown += `共 ${allPageEntries.length} 个页面实现，其中路由挂载页面 ${routePages.length} 个，未挂载/保留页面 ${extraPageFiles.length} 个。\n\n`;

  for (const page of allPageEntries) {
    const relativeFile = toPosix(path.relative(ROOT, page.filePath));
    const facts = collectFileFacts(page.filePath);
    const domain = detectDomain(page.routes, relativeFile);
    const routeText = page.routes.length ? page.routes.map((item) => `\`${item}\``).join('、') : '未直接挂载（可能为保留页或由其他容器间接渲染）';
    const exportText = facts.exported.length ? facts.exported.map((name) => `\`${name}\``).join('、') : '无显式命名导出（默认导出页面）';
    const hooksText = facts.hooks.length ? facts.hooks.map((name) => `\`${name}\``).join('、') : '无自定义 hook 依赖';
    const componentsText = facts.componentNames.length ? facts.componentNames.slice(0, 8).map((name) => `\`${name}\``).join('、') + (facts.componentNames.length > 8 ? ' 等' : '') : '以原生 JSX 结构为主';
    const apisText = facts.apiNames.length ? facts.apiNames.map((name) => `\`${name}\``).join('、') : '当前文件未直接引用 API 模块（可能由子组件/Hook 间接处理）';

    markdown += `### ${page.componentName}\n\n`;
    markdown += `- 文件：\`${relativeFile}\`\n`;
    markdown += `- 路由：${routeText}\n`;
    markdown += `- 领域：${domain}\n`;
    markdown += `- 导出：${exportText}\n`;
    markdown += `- 页面作用：负责 ${domain} 相关场景的页面编排与交互响应，承担路由层到业务组件层的桥接。\n`;
    markdown += `- 关键组件依赖：${componentsText}\n`;
    markdown += `- 关键 Hooks：${hooksText}\n`;
    markdown += `- 数据与接口：${apisText}\n\n`;
  }

  markdown += '## 组件清单\n\n';
  markdown += `共 ${componentFiles.length} 个组件文件。\n\n`;

  for (const filePath of componentFiles) {
    const content = readUtf8(filePath);
    const relativeFile = toPosix(path.relative(ROOT, filePath));
    const facts = collectFileFacts(filePath);

    const exportedCandidates = facts.exported.filter((name) => /^[A-Z]/.test(name));
    const componentName = exportedCandidates[0] || path.basename(filePath, path.extname(filePath));
    const category = inferComponentCategory(toPosix(path.relative(SRC_DIR, filePath)), componentName);

    const hooksText = facts.hooks.length ? facts.hooks.map((name) => `\`${name}\``).join('、') : '无自定义 hook 依赖';
    const childrenComponents = facts.componentNames.filter((name) => name !== componentName);
    const depsText = childrenComponents.length ? childrenComponents.slice(0, 8).map((name) => `\`${name}\``).join('、') + (childrenComponents.length > 8 ? ' 等' : '') : '以基础样式与 DOM 结构为主';

    const propsInterfaces = uniqueSorted((content.match(/interface\s+([A-Za-z0-9_]*Props)\b/g) || []).map((line) => line.replace(/^interface\s+/, '').replace(/\s+.*$/, '')));
    const propsText = propsInterfaces.length ? propsInterfaces.map((name) => `\`${name}\``).join('、') : '未定义独立 Props 接口（可能使用内联类型）';

    markdown += `### ${componentName}\n\n`;
    markdown += `- 文件：\`${relativeFile}\`\n`;
    markdown += `- 组件分类：${category}\n`;
    markdown += `- 组件作用：用于 ${category} 场景，承接页面层拆分后的可复用 UI/交互单元。\n`;
    markdown += `- Props 结构：${propsText}\n`;
    markdown += `- 依赖子组件：${depsText}\n`;
    markdown += `- 依赖 Hooks：${hooksText}\n\n`;
  }

  markdown += '## Hooks 详细说明\n\n';
  markdown += `共 ${hookFiles.length} 个 hook 文件。\n\n`;

  const hookManualItems = buildHooksManualSection();
  const hookManualMap = new Map(hookManualItems.map((item) => [item.name, item]));

  for (const filePath of hookFiles) {
    const relativeFile = toPosix(path.relative(ROOT, filePath));
    const content = readUtf8(filePath);
    const functionNames = extractExportedNames(content).filter((name) => /^use[A-Z]/.test(name));

    if (!functionNames.length) {
      continue;
    }

    for (const hookName of functionNames) {
      const manual = hookManualMap.get(hookName);
      const signature = extractFunctionSignature(content, hookName);
      const returnKeys = extractReturnObjectKeys(content);
      const facts = collectFileFacts(filePath);

      markdown += `### ${hookName}\n\n`;
      markdown += `- 文件：\`${relativeFile}\`\n`;

      if (manual) {
        markdown += `- 作用：${manual.purpose}\n`;
        markdown += `- 输入：${manual.input}\n`;
        markdown += `- 输出：${manual.output}\n`;
      } else {
        markdown += '- 作用：封装跨页面复用的状态管理或副作用逻辑。\n';
        markdown += `- 输入：${signature ? `\`${signature}\`` : '请参考函数签名'}\n`;
        markdown += `- 输出：${returnKeys.length ? returnKeys.map((k) => `\`${k}\``).join('、') : '请参考函数返回值'}\n`;
      }

      const deps = facts.hooks.filter((name) => name !== hookName);
      markdown += `- 依赖：${deps.length ? deps.map((name) => `\`${name}\``).join('、') : '无额外自定义 Hook 依赖'}\n\n`;
    }
  }

  markdown += '## 维护建议\n\n';
  markdown += '1. 新增页面时：同步在路由与本文档页面清单补充“路由、关键组件、关键 Hook、API”。\n';
  markdown += '2. 新增业务组件时：优先放在 `src/components/biz` 或对应 `features/*/components`，并写清输入输出。\n';
  markdown += '3. 新增 Hook 时：建议保持“单一职责 + 明确返回结构”，并在本文档中补上输入/输出说明。\n';

  return markdown;
}

function main() {
  const markdown = buildDocument();
  fs.writeFileSync(DOC_PATH, markdown, 'utf8');
  console.log(`Generated: ${toPosix(path.relative(ROOT, DOC_PATH))}`);
}

main();

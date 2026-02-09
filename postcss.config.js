import tailwindcss from '@tailwindcss/postcss';
import postcssCascadeLayers from '@csstools/postcss-cascade-layers';
import postcssLightningcss from 'postcss-lightningcss';

/**
 * 自定义 PostCSS 插件：修复 Tailwind CSS v4 在老版浏览器中的兼容性问题
 *
 * 处理以下问题：
 * 1. @supports 变量降级块只匹配 Safari/Firefox，老版安卓 Chrome 被遗漏
 * 2. --tw-gradient-position 中的 "in oklab" 插值提示（Chrome 111+）
 * 3. lh 单位（Chrome 109+）
 * 4. CSS 逻辑属性 padding-inline/padding-block 等（Chrome 87+）
 */
const fixTailwindV4Compat = () => {
  const shouldStripAdvancedColorSupports = (params = '') => (
    /color\s*:\s*color-mix\(/i.test(params) ||
    /color\s*:\s*lab\(/i.test(params)
  );
  // CSS 逻辑属性 → 物理属性 映射（仅 LTR 方向，适用于中文站）
  const logicalToPhysical = {
    'padding-inline': ['padding-left', 'padding-right'],
    'padding-block': ['padding-top', 'padding-bottom'],
    'margin-inline': ['margin-left', 'margin-right'],
    'margin-block': ['margin-top', 'margin-bottom'],
    'border-inline': ['border-left', 'border-right'],
    'border-block': ['border-top', 'border-bottom'],
    'border-inline-width': ['border-left-width', 'border-right-width'],
    'border-block-width': ['border-top-width', 'border-bottom-width'],
    'border-inline-color': ['border-left-color', 'border-right-color'],
    'border-block-color': ['border-top-color', 'border-bottom-color'],
    'border-inline-style': ['border-left-style', 'border-right-style'],
    'border-block-style': ['border-top-style', 'border-bottom-style'],
    'inset-inline': ['left', 'right'],
    'inset-block': ['top', 'bottom'],
    'size': ['width', 'height'],
  };

  // 逻辑属性 start/end → LTR 物理属性
  const logicalStartEnd = {
    'padding-inline-start': 'padding-left',
    'padding-inline-end': 'padding-right',
    'padding-block-start': 'padding-top',
    'padding-block-end': 'padding-bottom',
    'margin-inline-start': 'margin-left',
    'margin-inline-end': 'margin-right',
    'margin-block-start': 'margin-top',
    'margin-block-end': 'margin-bottom',
    'border-inline-start-width': 'border-left-width',
    'border-inline-end-width': 'border-right-width',
    'border-inline-start-color': 'border-left-color',
    'border-inline-end-color': 'border-right-color',
    'border-block-start-width': 'border-top-width',
    'border-block-end-width': 'border-bottom-width',
    'inset-inline-start': 'left',
    'inset-inline-end': 'right',
    'inset-block-start': 'top',
    'inset-block-end': 'bottom',
    'inline-size': 'width',
    'block-size': 'height',
    'min-inline-size': 'min-width',
    'max-inline-size': 'max-width',
    'min-block-size': 'min-height',
    'max-block-size': 'max-height',
  };

  // 颜色空间插值正则
  const colorSpaceRe = /\s+in\s+(oklab|oklch|srgb|srgb-linear|lab|lch|hsl|hwb|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65)/;

  return {
    postcssPlugin: 'fix-tailwind-v4-compat',

    AtRule: {
      supports(atRule) {
        // 1. 展开 Tailwind v4 的 @supports 变量降级块
        if (
          atRule.params.includes('-webkit-hyphens') &&
          atRule.params.includes('-moz-orient')
        ) {
          atRule.replaceWith(atRule.nodes);
          return;
        }

        // 1.1 移除高级色彩支持块，避免部分 Android/WebView 误判支持后产生错误覆盖
        // 保留前面生成的 rgba/hex 兜底声明，提升跨机型一致性
        if (shouldStripAdvancedColorSupports(atRule.params)) {
          atRule.remove();
        }
      },
    },

    Declaration(decl) {
      const { prop, value } = decl;

      // 2. 移除渐变位置中的 "in oklab" 颜色空间插值提示
      if (prop === '--tw-gradient-position' && colorSpaceRe.test(value)) {
        decl.value = value.replace(colorSpaceRe, '');
      }

      // 3. 将 lh 单位转换为 em
      if (value && /\dlh\b/.test(value)) {
        decl.value = value.replace(/(\d*\.?\d+)lh/g, (_, num) => {
          return `${(parseFloat(num) * 1.5).toFixed(2)}em`;
        });
      }

      // 4a. 逻辑简写属性 → 展开为两个物理属性
      if (logicalToPhysical[prop]) {
        const [physA, physB] = logicalToPhysical[prop];
        decl.before({ prop: physA, value: decl.value, important: decl.important });
        decl.before({ prop: physB, value: decl.value, important: decl.important });
      }

      // 4b. 逻辑 start/end 属性 → 对应物理属性
      if (logicalStartEnd[prop]) {
        decl.before({ prop: logicalStartEnd[prop], value: decl.value, important: decl.important });
      }
    },
  };
};
fixTailwindV4Compat.postcss = true;

// 最终阶段再清理一遍高级色彩 @supports（防止被后续插件重新注入）
const stripLegacyUnsafeRules = () => ({
  postcssPlugin: 'strip-legacy-unsafe-rules',
  OnceExit(root) {
    // 1) 移除高级色彩支持块，强制使用前面已生成的 sRGB 兜底变量
    root.walkAtRules('supports', (atRule) => {
      if (
        /color\s*:\s*color-mix\(/i.test(atRule.params) ||
        /color\s*:\s*lab\(/i.test(atRule.params)
      ) {
        atRule.remove();
      }
    });

    // 2) 移除 Tailwind 生成的 @property，减少旧 WebView 解析负担
    root.walkAtRules('property', (atRule) => {
      atRule.remove();
    });

    // 3) 当前项目不使用 Shadow DOM，移除 :host 重复规则以缩小 CSS
    root.walkRules((rule) => {
      if (rule.selector && rule.selector.includes(':host')) {
        rule.remove();
      }
    });
  },
});
stripLegacyUnsafeRules.postcss = true;

export default {
  plugins: [
    tailwindcss(),
    // 修复 Tailwind v4 在老版浏览器中的兼容性问题
    fixTailwindV4Compat(),
    // 扁平化 @layer 指令，确保低版本浏览器兼容（Chrome < 99 不支持 @layer）
    postcssCascadeLayers(),
    // 添加厂商前缀、降级现代 CSS 特性（dvh → vh、CSS 嵌套展开等）
    postcssLightningcss({
      browsers: '> 0.5%, last 2 versions, not dead, Android >= 5, iOS >= 10',
      // 不在 PostCSS 阶段压缩，交给 Vite 的 lightningcss 最终处理
      minify: false,
      lightningcssOptions: {
        drafts: {
          customMedia: true,
        },
      },
    }),
    // 必须放在最后：清理上游插件最终注入的高级规则
    stripLegacyUnsafeRules(),
  ],
};

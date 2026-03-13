#!/usr/bin/env node
/**
 * @file 路由迁移脚本
 * @description 自动将所有页面组件中的 CustomEvent 导航调用替换为 useAppNavigate() hook
 * 
 * 用法: node /opt/shujiaosuoqiand/migrate-routes.cjs
 */

const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, 'src', 'pages');

/**
 * 处理单个页面文件
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // 检查是否有 change-view 或 go-back 调用
  if (!content.includes('change-view') && !content.includes('go-back')) {
    return { modified: false };
  }

  // 如果已经有 useAppNavigate，跳过 import 添加
  if (!content.includes('useAppNavigate')) {
    // 找到最后一个 import 语句的结束位置
    const lines = content.split('\n');
    let lastImportLine = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^import\s/)) {
        // 找到 import 块的结束（可能跨多行）
        let j = i;
        while (j < lines.length && !lines[j].includes(';')) {
          j++;
        }
        lastImportLine = j;
      }
    }
    
    if (lastImportLine >= 0) {
      lines.splice(lastImportLine + 1, 0, "import { useAppNavigate } from '../../lib/navigation';");
      content = lines.join('\n');
    }
  }

  // 在组件函数体内添加 hook 调用（如果还没有）
  if (!content.includes('= useAppNavigate()')) {
    // 匹配各种组件声明模式
    const patterns = [
      // export const XxxPage = () => {
      /^(export\s+const\s+\w+\s*=\s*\([^)]*\)\s*(?::\s*\w+)?\s*=>\s*\{)\s*$/m,
      // export default function XxxPage() {
      /^(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)\s*$/m,
      // export const XxxPage = () => { (single line patterns with content after)
      /(export\s+const\s+\w+\s*=\s*\([^)]*\)\s*(?::\s*\w+)?\s*=>\s*\{)/,
      /(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)/,
    ];
    
    let inserted = false;
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const insertAfter = match[1] || match[0];
        const idx = content.indexOf(insertAfter) + insertAfter.length;
        content = content.slice(0, idx) + '\n  const { goTo, goBack } = useAppNavigate();\n' + content.slice(idx);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      console.log(`  ⚠ 无法自动插入 hook: ${path.basename(path.dirname(filePath))}`);
    }
  }

  // 替换 change-view 事件调用
  
  // 模式1: 两行 - 带缩进灵活匹配
  // const event = new CustomEvent('change-view', { detail: 'xxx' });
  // window.dispatchEvent(event);
  content = content.replace(
    /(\s*)const\s+event\s*=\s*new\s+CustomEvent\s*\(\s*'change-view'\s*,\s*\{\s*detail:\s*'([^']+)'\s*\}\s*\)\s*;\s*\n\s*window\.dispatchEvent\s*\(\s*event\s*\)\s*;/g,
    (match, indent, viewId) => `${indent}goTo('${viewId}');`
  );

  // 模式2: 单行
  // window.dispatchEvent(new CustomEvent('change-view', { detail: 'xxx' }));
  content = content.replace(
    /window\.dispatchEvent\s*\(\s*new\s+CustomEvent\s*\(\s*'change-view'\s*,\s*\{\s*detail:\s*'([^']+)'\s*\}\s*\)\s*\)\s*;/g,
    (match, viewId) => `goTo('${viewId}');`
  );

  // 替换 go-back 事件调用
  
  // 模式1: 两行
  content = content.replace(
    /(\s*)const\s+event\s*=\s*new\s+CustomEvent\s*\(\s*'go-back'\s*\)\s*;\s*\n\s*window\.dispatchEvent\s*\(\s*event\s*\)\s*;/g,
    (match, indent) => `${indent}goBack();`
  );

  // 模式2: 单行
  content = content.replace(
    /window\.dispatchEvent\s*\(\s*new\s+CustomEvent\s*\(\s*'go-back'\s*\)\s*\)\s*;?/g,
    'goBack();'
  );

  // 清理: 移除多余的空行（onClick 处理器内的 3-4 行变成 1 行后可能有空行）
  // onClick={() => {
  //   goTo('xxx');
  // }}
  // 简化为 onClick={() => goTo('xxx')}
  content = content.replace(
    /onClick=\{?\(\)\s*=>\s*\{\s*\n\s*(goTo\('[^']+'\);)\s*\n\s*\}\}?/g,
    (match, goToCall) => `onClick={() => ${goToCall.replace(';', '')}}`
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { modified: true };
  }
  return { modified: false };
}

// 遍历所有页面目录
const pageDirs = fs.readdirSync(PAGES_DIR);
let modifiedCount = 0;
let totalCount = 0;
let skippedCount = 0;

for (const dir of pageDirs) {
  const dirPath = path.join(PAGES_DIR, dir);
  if (!fs.statSync(dirPath).isDirectory()) continue;
  
  const indexFile = path.join(dirPath, 'index.tsx');
  if (!fs.existsSync(indexFile)) continue;
  
  totalCount++;
  const content = fs.readFileSync(indexFile, 'utf8');
  
  if (!content.includes('change-view') && !content.includes('go-back')) {
    skippedCount++;
    continue;
  }
  
  const result = processFile(indexFile);
  if (result.modified) {
    modifiedCount++;
    console.log(`✅ 已迁移: ${dir}/index.tsx`);
  } else {
    console.log(`⏭ 无变化: ${dir}/index.tsx`);
  }
}

console.log(`\n========================================`);
console.log(`迁移完成!`);
console.log(`  总计页面: ${totalCount}`);
console.log(`  已迁移: ${modifiedCount}`);
console.log(`  无需迁移: ${skippedCount}`);
console.log(`  未变化: ${totalCount - modifiedCount - skippedCount}`);
console.log(`========================================`);

// 验证：检查是否还有遗留的 CustomEvent
let remaining = 0;
for (const dir of pageDirs) {
  const indexFile = path.join(PAGES_DIR, dir, 'index.tsx');
  if (!fs.existsSync(indexFile)) continue;
  
  const content = fs.readFileSync(indexFile, 'utf8');
  const matches = content.match(/CustomEvent\s*\(\s*'(change-view|go-back)'/g);
  if (matches) {
    remaining += matches.length;
    console.log(`⚠ 遗留: ${dir}/index.tsx 仍有 ${matches.length} 处未迁移`);
  }
}

if (remaining === 0) {
  console.log(`\n✅ 所有页面文件已完全迁移，无遗留事件调用！`);
} else {
  console.log(`\n⚠ 还有 ${remaining} 处遗留事件调用需要手动处理`);
}

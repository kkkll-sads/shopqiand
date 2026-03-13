import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/pages/AboutUs/index.tsx',
  'src/pages/TradingZone/index.tsx'
];

const replacements = [
  { regex: /bg-white(?![\w-]| \w*dark:)/g, replacement: 'bg-white dark:bg-gray-900' },
  { regex: /text-gray-900(?![\w-]| \w*dark:)/g, replacement: 'text-gray-900 dark:text-gray-100' },
  { regex: /text-gray-800(?![\w-]| \w*dark:)/g, replacement: 'text-gray-800 dark:text-gray-200' },
  { regex: /text-gray-700(?![\w-]| \w*dark:)/g, replacement: 'text-gray-700 dark:text-gray-300' },
  { regex: /text-gray-600(?![\w-]| \w*dark:)/g, replacement: 'text-gray-600 dark:text-gray-400' },
  { regex: /text-gray-500(?![\w-]| \w*dark:)/g, replacement: 'text-gray-500 dark:text-gray-400' },
  { regex: /text-gray-400(?![\w-]| \w*dark:)/g, replacement: 'text-gray-400 dark:text-gray-500' },
  { regex: /text-gray-300(?![\w-]| \w*dark:)/g, replacement: 'text-gray-300 dark:text-gray-600' },
  { regex: /bg-gray-50(?![\w-]| \w*dark:)/g, replacement: 'bg-gray-50 dark:bg-gray-800' },
  { regex: /bg-gray-100(?![\w-]| \w*dark:)/g, replacement: 'bg-gray-100 dark:bg-gray-800' },
  { regex: /bg-gray-200(?![\w-]| \w*dark:)/g, replacement: 'bg-gray-200 dark:bg-gray-800' },
  { regex: /bg-gray-300(?![\w-]| \w*dark:)/g, replacement: 'bg-gray-300 dark:bg-gray-700' },
  { regex: /border-gray-50(?![\w-]| \w*dark:)/g, replacement: 'border-gray-50 dark:border-gray-800' },
  { regex: /border-gray-100(?![\w-]| \w*dark:)/g, replacement: 'border-gray-100 dark:border-gray-800' },
  { regex: /border-gray-200(?![\w-]| \w*dark:)/g, replacement: 'border-gray-200 dark:border-gray-700' },
  { regex: /border-gray-300(?![\w-]| \w*dark:)/g, replacement: 'border-gray-300 dark:border-gray-600' },
  { regex: /active:bg-gray-50(?![\w-]| \w*dark:)/g, replacement: 'active:bg-gray-50 dark:active:bg-gray-800' },
  { regex: /active:bg-gray-100(?![\w-]| \w*dark:)/g, replacement: 'active:bg-gray-100 dark:active:bg-gray-800' },
  { regex: /bg-\[#f5f5f5\](?![\w-]| \w*dark:)/g, replacement: 'bg-[#f5f5f5] dark:bg-gray-950' },
  { regex: /bg-\[#F7F8FA\](?![\w-]| \w*dark:)/g, replacement: 'bg-[#F7F8FA] dark:bg-gray-950' },
  { regex: /bg-\[#FFF8F8\](?![\w-]| \w*dark:)/g, replacement: 'bg-[#FFF8F8] dark:bg-gray-950' },
];

filesToUpdate.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    replacements.forEach(({ regex, replacement }) => {
      if (regex.test(content)) {
        content = content.replace(regex, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Updated ${file}`);
    }
  }
});

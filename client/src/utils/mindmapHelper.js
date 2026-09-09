/**
 * Convert Markdown outline text into simple-mind-map node tree
 */
export function markdownToMindMap(mdContent, defaultTitle = '思维导图') {
  const lines = mdContent.split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return {
      root: {
        data: { text: defaultTitle },
        children: []
      }
    };
  }

  let rootNode = null;
  const stack = [];

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    const listMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    
    let level = 1;
    let text = line.trim();

    if (headerMatch) {
      level = headerMatch[1].length;
      text = headerMatch[2].trim();
    } else if (listMatch) {
      // 2 spaces per indentation level + base level 2
      const indent = listMatch[1].length;
      level = 2 + Math.floor(indent / 2);
      text = listMatch[2].trim();
    }

    const node = {
      data: { text },
      children: []
    };

    if (!rootNode) {
      rootNode = node;
      stack.push({ level: 1, node });
      continue;
    }

    // Find parent in stack
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length > 0) {
      stack[stack.length - 1].node.children.push(node);
    } else {
      rootNode.children.push(node);
    }

    stack.push({ level, node });
  }

  return {
    root: rootNode || { data: { text: defaultTitle }, children: [] },
    theme: { template: 'classic4', config: {} },
    layout: 'logicalStructure'
  };
}

/**
 * Convert simple-mind-map node tree into Markdown string
 */
export function mindMapToMarkdown(mindMapData) {
  const root = mindMapData?.root || (mindMapData?.data ? mindMapData : null);
  if (!root) return '';

  const lines = [];

  function traverse(node, depth = 1) {
    if (!node || !node.data) return;
    const text = node.data.text || '分支';
    if (depth <= 6) {
      lines.push(`${'#'.repeat(depth)} ${text}`);
    } else {
      const indent = '  '.repeat(depth - 1);
      lines.push(`${indent}- ${text}`);
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        traverse(child, depth + 1);
      }
    }
  }

  traverse(root, 1);
  return lines.join('\n\n');
}

/**
 * Available theme presets from simple-mind-map-plugin-themes
 */
export const THEMES = [
  { id: 'classic4', name: '经典商务 (蓝白)' },
  { id: 'classic2', name: '清新活力 (薄荷绿)' },
  { id: 'classic3', name: '暖阳橙' },
  { id: 'classicBlue', name: '深海湛蓝' },
  { id: 'freshGreen', name: '自然青翠' },
  { id: 'romanticPurple', name: '浪漫紫' },
  { id: 'gold', name: '黑金尊贵' },
  { id: 'coffee', name: '雅致咖啡' },
  { id: 'avocado', name: '牛油果' },
  { id: 'dark', name: '极客暗色' },
  { id: 'dark2', name: '深夜霓虹 (深色)' },
  { id: 'blackGold', name: '暗夜黑金' },
  { id: 'default', name: '极简浅灰 (默认)' }
];

/**
 * Available structure layouts
 */
export const LAYOUTS = [
  { id: 'logicalStructure', name: '逻辑结构图' },
  { id: 'mindMap', name: '思维导图 (双向)' },
  { id: 'organizationStructure', name: '组织结构图' },
  { id: 'catalogOrganization', name: '目录组织图' },
  { id: 'fishbone', name: '鱼骨图' },
  { id: 'timeline', name: '时间轴' },
];

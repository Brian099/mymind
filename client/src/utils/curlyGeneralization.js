import LogicalStructure from 'simple-mind-map/src/layouts/LogicalStructure.js';
import MindMapLayout from 'simple-mind-map/src/layouts/MindMap.js';
import CatalogOrganization from 'simple-mind-map/src/layouts/CatalogOrganization.js';
import OrganizationStructure from 'simple-mind-map/src/layouts/OrganizationStructure.js';
import Timeline from 'simple-mind-map/src/layouts/Timeline.js';
import VerticalTimeline from 'simple-mind-map/src/layouts/VerticalTimeline.js';
import Fishbone from 'simple-mind-map/src/layouts/Fishbone.js';
import Render from 'simple-mind-map/src/core/render/Render.js';
import MindMapNode from 'simple-mind-map/src/core/render/node/MindMapNode.js';
import Style from 'simple-mind-map/src/core/render/node/Style.js';
import { CONSTANTS } from 'simple-mind-map/src/constants/constant.js';
import { createUid } from 'simple-mind-map/src/utils/index.js';

/**
 * 每一组概要专属协调调色板（支持多组概要呈现不同高品质配色）
 */
export const GENERALIZATION_COLOR_PALETTE = [
  '#4f46e5', // Indigo (靛蓝)
  '#059669', // Emerald (翡翠绿)
  '#d97706', // Amber (琥珀金橙)
  '#dc2626', // Rose (活力绯红)
  '#7c3aed', // Violet (幽紫)
  '#0891b2', // Cyan (青蓝)
  '#db2777', // Pink (粉玫)
  '#2563eb', // Royal Blue (皇家蓝)
  '#16a34a', // Fresh Green (明新绿)
  '#ea580c'  // Orange (暖橘红)
];

/**
 * 获取指定概要组的独立线条颜色
 */
export function getGeneralizationGroupColor(layoutInstance, item, groupIndex = 0) {
  const genNode = item.generalizationNode;

  // 1. 单个概要节点自定义的线条颜色
  const customColor = genNode && (
    (genNode.getData && (genNode.getData('generalizationLineColor') || genNode.getData('lineColor'))) ||
    (genNode.nodeData && genNode.nodeData.data && (genNode.nodeData.data.generalizationLineColor || genNode.nodeData.data.lineColor))
  );
  if (customColor) return customColor;

  // 2. 所属分支（目标节点根节点）已有的分支线条颜色（如彩虹线条或自定义色）
  const targetRoots = item.range && item.node && item.node.children
    ? item.node.children.slice(item.range[0], item.range[1] + 1)
    : [item.node];
  const firstTarget = targetRoots && targetRoots[0];
  const branchColor = firstTarget && (
    (firstTarget.getData && firstTarget.getData('lineColor')) ||
    (firstTarget.nodeData && firstTarget.nodeData.data && firstTarget.nodeData.data.lineColor)
  );
  if (branchColor) return branchColor;

  // 3. 按照导图树中概要分组出现顺序，依次循环分配调色板颜色
  const mindMap = layoutInstance.mindMap;
  if (mindMap && mindMap.renderer && mindMap.renderer.root) {
    const targetUid = genNode && genNode.uid;
    let foundIndex = -1;
    let counter = 0;
    function walk(node) {
      if (!node || foundIndex !== -1) return;
      const genList = node._generalizationList || [];
      for (const g of genList) {
        if (g.generalizationNode && g.generalizationNode.uid === targetUid) {
          foundIndex = counter;
          return;
        }
        counter++;
      }
      if (node.children) {
        node.children.forEach(walk);
      }
    }
    walk(mindMap.renderer.root);
    if (foundIndex !== -1) {
      return GENERALIZATION_COLOR_PALETTE[foundIndex % GENERALIZATION_COLOR_PALETTE.length];
    }
  }

  // 4. UID 散列兜底方案
  const uid = (genNode && genNode.uid) || String(groupIndex);
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash << 5) - hash + uid.charCodeAt(i);
    hash |= 0;
  }
  return GENERALIZATION_COLOR_PALETTE[Math.abs(hash) % GENERALIZATION_COLOR_PALETTE.length];
}

/**
 * 判断当前概要应该渲染哪种样式 ('bracket' 大括号样式 或 'line' 连线样式)
 */
export function getGeneralizationStyle(layoutInstance, item) {
  const genNode = item.generalizationNode;
  const nodeStyle = genNode && (
    (genNode.getData && genNode.getData('generalizationStyle')) ||
    (genNode.nodeData && genNode.nodeData.data && genNode.nodeData.data.generalizationStyle)
  );
  if (nodeStyle === 'line' || nodeStyle === 'bracket') {
    return nodeStyle;
  }
  const themeConfig = (layoutInstance.mindMap && layoutInstance.mindMap.themeConfig) || {};
  if (themeConfig.generalizationStyle === 'line' || themeConfig.generalizationStyle === 'bracket') {
    return themeConfig.generalizationStyle;
  }
  // 默认使用连线样式 (或大括号样式)
  return 'line';
}

/**
 * 递归收集目标范围内的叶子节点（若分支已展开，则收集所有末端叶子节点；若未展开或无子节点，则该分支本身作为末端）
 */
function collectLeafNodes(targetRoots) {
  const leafNodes = [];
  let maxNodeRight = -Infinity;
  let minNodeLeft = Infinity;
  let maxNodeBottom = -Infinity;

  function collect(n) {
    if (!n) return;
    if (typeof n.left === 'number' && typeof n.width === 'number') {
      const r = n.left + n.width;
      if (r > maxNodeRight) maxNodeRight = r;
      if (n.left < minNodeLeft) minNodeLeft = n.left;
    }
    if (typeof n.top === 'number' && typeof n.height === 'number') {
      const b = n.top + n.height;
      if (b > maxNodeBottom) maxNodeBottom = b;
    }
    const isExpanded = n.getData && n.getData('expand') !== false;
    if (isExpanded && n.children && n.children.length > 0) {
      n.children.forEach(collect);
    } else {
      leafNodes.push(n);
    }
  }

  targetRoots.forEach(collect);

  if (leafNodes.length === 0) {
    leafNodes.push(...targetRoots);
  }

  return { leafNodes, maxNodeRight, minNodeLeft, maxNodeBottom };
}

/**
 * 1. 水平方向连线汇聚样式（像根节点分支连线一样，平滑三次贝塞尔曲线直接汇聚到概要文本框）
 */
export function renderHorizontalLineGeneralization(layoutInstance, item, isLeft = false, groupColor) {
  const boundaries = layoutInstance.getNodeGeneralizationRenderBoundaries(item, 'h');
  const { top, bottom, left, right, generalizationNodeMargin } = boundaries;

  const targetRoots = item.range && item.node && item.node.children
    ? item.node.children.slice(item.range[0], item.range[1] + 1)
    : [item.node];

  let { leafNodes, maxNodeRight, minNodeLeft } = collectLeafNodes(targetRoots);

  if (maxNodeRight === -Infinity) maxNodeRight = right;
  if (minNodeLeft === Infinity) minNodeLeft = left;

  const genMargin = Math.max(38, generalizationNodeMargin || 38);
  const genNode = item.generalizationNode;

  // 定位概要文本框：垂直居中于整个涵盖范围，水平放置在所有参与叶子节点的右侧（或左侧）
  genNode.top = top + (bottom - top - genNode.height) / 2;
  genNode.left = isLeft
    ? minNodeLeft - genMargin - genNode.width
    : maxNodeRight + genMargin;

  // 连线汇聚目标点：概要文本框边缘中点
  const targetX = isLeft ? genNode.left + genNode.width : genNode.left;
  const targetY = genNode.top + genNode.height / 2;

  // 为每个参与的叶子节点计算平滑三次贝塞尔曲线
  let pathsD = '';
  leafNodes.forEach(leaf => {
    const startX = isLeft ? leaf.left : (leaf.left + leaf.width);
    const startY = leaf.top + leaf.height / 2;

    const dx = targetX - startX;
    // 控制点：起点水平切出，终点水平切入
    const cx1 = startX + dx * 0.5;
    const cy1 = startY;
    const cx2 = startX + dx * 0.5;
    const cy2 = targetY;

    pathsD += `M ${startX.toFixed(1)},${startY.toFixed(1)} C ${cx1.toFixed(1)},${cy1.toFixed(1)} ${cx2.toFixed(1)},${cy2.toFixed(1)} ${targetX.toFixed(1)},${targetY.toFixed(1)} `;
  });

  const finalPath = layoutInstance.transformPath ? layoutInstance.transformPath(pathsD) : pathsD;
  item.generalizationLine.plot(finalPath);

  // 设置线条颜色与粗细
  const themeConfig = (layoutInstance.mindMap && layoutInstance.mindMap.themeConfig) || {};
  const strokeWidth = themeConfig.generalizationLineWidth || 2;
  const strokeColor = groupColor || themeConfig.generalizationLineColor || themeConfig.lineColor || '#64748b';

  item.generalizationLine._customGroupColor = strokeColor;
  item.generalizationLine.stroke({
    width: strokeWidth,
    color: strokeColor,
    linecap: 'round'
  }).fill({ color: 'none' });

  // 连线样式下无需辅助虚线
  if (item.generalizationDashedLine) {
    item.generalizationDashedLine.plot('');
    item.generalizationDashedLine.hide();
  }

  // 挂载生命周期清理
  hookDashedLineLifecycle(item);

  // 递归排版概要节点自身所带的子主题（Tab 键追加的主题）
  layoutGeneralizationSubtree(layoutInstance, item, isLeft);
}

/**
 * 2. 纵向结构连线汇聚样式（自上而下汇聚到下方概要文本框）
 */
export function renderVerticalLineGeneralization(layoutInstance, item, groupColor) {
  const boundaries = layoutInstance.getNodeGeneralizationRenderBoundaries(item, 'v');
  const { top, bottom, left, right, generalizationNodeMargin } = boundaries;

  const targetRoots = item.range && item.node && item.node.children
    ? item.node.children.slice(item.range[0], item.range[1] + 1)
    : [item.node];

  let { leafNodes, maxNodeBottom } = collectLeafNodes(targetRoots);
  if (maxNodeBottom === -Infinity) maxNodeBottom = bottom;

  const genMargin = Math.max(38, generalizationNodeMargin || 38);
  const genNode = item.generalizationNode;

  genNode.top = maxNodeBottom + genMargin;
  genNode.left = left + (right - left - genNode.width) / 2;

  const targetX = genNode.left + genNode.width / 2;
  const targetY = genNode.top;

  let pathsD = '';
  leafNodes.forEach(leaf => {
    const startX = leaf.left + leaf.width / 2;
    const startY = leaf.top + leaf.height;

    const dy = targetY - startY;
    const cx1 = startX;
    const cy1 = startY + dy * 0.5;
    const cx2 = targetX;
    const cy2 = startY + dy * 0.5;

    pathsD += `M ${startX.toFixed(1)},${startY.toFixed(1)} C ${cx1.toFixed(1)},${cy1.toFixed(1)} ${cx2.toFixed(1)},${cy2.toFixed(1)} ${targetX.toFixed(1)},${targetY.toFixed(1)} `;
  });

  const finalPath = layoutInstance.transformPath ? layoutInstance.transformPath(pathsD) : pathsD;
  item.generalizationLine.plot(finalPath);

  const themeConfig = (layoutInstance.mindMap && layoutInstance.mindMap.themeConfig) || {};
  const strokeWidth = themeConfig.generalizationLineWidth || 2;
  const strokeColor = groupColor || themeConfig.generalizationLineColor || themeConfig.lineColor || '#64748b';

  item.generalizationLine._customGroupColor = strokeColor;
  item.generalizationLine.stroke({
    width: strokeWidth,
    color: strokeColor,
    linecap: 'round'
  }).fill({ color: 'none' });

  if (item.generalizationDashedLine) {
    item.generalizationDashedLine.plot('');
    item.generalizationDashedLine.hide();
  }

  hookDashedLineLifecycle(item);

  layoutGeneralizationVerticalSubtree(layoutInstance, item);
}

/**
 * 辅助虚线与线条生命周期钩子绑定
 */
function hookDashedLineLifecycle(item) {
  if (item.generalizationLine && !item.generalizationLine._dashedHooked) {
    item.generalizationLine._dashedHooked = true;
    const origRemove = item.generalizationLine.remove.bind(item.generalizationLine);
    item.generalizationLine.remove = function () {
      if (item.generalizationDashedLine) {
        item.generalizationDashedLine.remove();
        item.generalizationDashedLine = null;
      }
      return origRemove();
    };
    const origHide = item.generalizationLine.hide.bind(item.generalizationLine);
    item.generalizationLine.hide = function () {
      if (item.generalizationDashedLine) item.generalizationDashedLine.hide();
      return origHide();
    };
    const origShow = item.generalizationLine.show.bind(item.generalizationLine);
    item.generalizationLine.show = function () {
      if (item.generalizationDashedLine) item.generalizationDashedLine.show();
      return origShow();
    };
  }
}

/**
 * 3. 水平方向经典大括号 '}' 或 '{' 渲染
 */
export function renderHorizontalCurlyGeneralization(layoutInstance, item, isLeft = false, groupColor) {
  const boundaries = layoutInstance.getNodeGeneralizationRenderBoundaries(item, 'h');
  const { top, bottom, left, right, generalizationLineMargin } = boundaries;

  const margin = generalizationLineMargin !== undefined ? generalizationLineMargin : 6;

  const x0 = isLeft ? left - margin : right + margin;
  const y1 = top;
  const y2 = bottom;
  const H = Math.max(y2 - y1, 14);
  const ym = y1 + H / 2;

  const dir = isLeft ? -1 : 1;
  const r = Math.min(8, Math.max(4, Math.floor(H / 6)));
  const tipW = r;

  const xSpine = x0 + r * dir;
  const xTip = x0 + (r + tipW) * dir;

  const path = `M ${x0},${y1} Q ${xSpine},${y1} ${xSpine},${y1 + r} L ${xSpine},${ym - r} Q ${xSpine},${ym} ${xTip},${ym} Q ${xSpine},${ym} ${xSpine},${ym + r} L ${xSpine},${y2 - r} Q ${xSpine},${y2} ${x0},${y2}`;

  const finalPath = layoutInstance.transformPath ? layoutInstance.transformPath(path) : path;
  item.generalizationLine.plot(finalPath);

  const tipToNodeGap = 10;
  const totalOffset = Math.abs(xTip - x0) + tipToNodeGap;
  item.generalizationNode.left = isLeft
    ? x0 - totalOffset - item.generalizationNode.width
    : x0 + totalOffset;
  item.generalizationNode.top = top + (bottom - top - item.generalizationNode.height) / 2;

  // 设定大括号线条颜色
  const themeConfig = (layoutInstance.mindMap && layoutInstance.mindMap.themeConfig) || {};
  const strokeWidth = themeConfig.generalizationLineWidth || 2;
  const strokeColor = groupColor || themeConfig.generalizationLineColor || themeConfig.lineColor || '#64748b';

  item.generalizationLine._customGroupColor = strokeColor;
  item.generalizationLine.stroke({
    width: strokeWidth,
    color: strokeColor,
    linecap: 'round'
  }).fill({ color: 'none' });

  // 远端叶子节点辅助虚线
  const targetRoots = item.range && item.node && item.node.children
    ? item.node.children.slice(item.range[0], item.range[1] + 1)
    : [item.node];

  const { leafNodes, maxNodeRight, minNodeLeft } = collectLeafNodes(targetRoots);

  let dashedD = '';
  const sw = 2;
  const dashLen = 3;
  const pitch = 8;
  const minGapForDashed = 16;

  leafNodes.forEach(leaf => {
    const leafY = leaf.top + leaf.height / 2;
    if (leafY < y1 - 8 || leafY > y2 + 8) return;

    if (isLeft) {
      const leafLeft = leaf.left;
      const xStart = leafLeft - 6;
      const xTarget = minNodeLeft;
      const totalDist = xStart - xTarget;
      if (totalDist >= minGapForDashed) {
        const startX = xStart - sw / 2;
        const targetX = xTarget + sw / 2;
        const D = startX - targetX;
        const count = Math.max(2, Math.round(D / pitch));
        const step = (D - dashLen) / (count - 1);
        for (let i = 0; i < count; i++) {
          const segEnd = startX - i * step;
          const segStart = segEnd - dashLen;
          dashedD += `M ${segStart.toFixed(1)},${leafY} L ${segEnd.toFixed(1)},${leafY} `;
        }
      }
    } else {
      const leafRight = leaf.left + leaf.width;
      const xStart = leafRight + 6;
      const xTarget = maxNodeRight;
      const totalDist = xTarget - xStart;
      if (totalDist >= minGapForDashed) {
        const startX = xStart + sw / 2;
        const targetX = xTarget - sw / 2;
        const D = targetX - startX;
        const count = Math.max(2, Math.round(D / pitch));
        const step = (D - dashLen) / (count - 1);
        for (let i = 0; i < count; i++) {
          const segStart = startX + i * step;
          const segEnd = segStart + dashLen;
          dashedD += `M ${segStart.toFixed(1)},${leafY} L ${segEnd.toFixed(1)},${leafY} `;
        }
      }
    }
  });

  if (!item.generalizationDashedLine) {
    const parentSvg = item.generalizationLine.parent && item.generalizationLine.parent();
    if (parentSvg && parentSvg.path) {
      item.generalizationDashedLine = parentSvg.path();
      if (item.generalizationDashedLine.backward) {
        item.generalizationDashedLine.backward();
      }
    }
  }

  hookDashedLineLifecycle(item);

  if (item.generalizationDashedLine) {
    if (dashedD) {
      const finalDashed = layoutInstance.transformPath ? layoutInstance.transformPath(dashedD) : dashedD;
      item.generalizationDashedLine.plot(finalDashed);
      item.generalizationDashedLine.stroke({
        width: sw,
        color: strokeColor,
        linecap: 'round'
      }).fill({ color: 'none' }).opacity(0.65);
      item.generalizationDashedLine.show();
    } else {
      item.generalizationDashedLine.plot('');
      item.generalizationDashedLine.hide();
    }
  }

  layoutGeneralizationSubtree(layoutInstance, item, isLeft);
}

/**
 * 4. 纵向结构经典大括号 '⏟' 渲染
 */
export function renderVerticalCurlyGeneralization(layoutInstance, item, groupColor) {
  const boundaries = layoutInstance.getNodeGeneralizationRenderBoundaries(item, 'v');
  const { bottom, left, right, generalizationLineMargin } = boundaries;

  const margin = generalizationLineMargin !== undefined ? generalizationLineMargin : 6;

  const y0 = bottom + margin;
  const x1 = left;
  const x2 = right;
  const W = Math.max(x2 - x1, 14);
  const xm = x1 + W / 2;

  const r = Math.min(8, Math.max(4, Math.floor(W / 6)));
  const tipH = r;

  const ySpine = y0 + r;
  const yTip = y0 + r + tipH;

  const path = `M ${x1},${y0} Q ${x1},${ySpine} ${x1 + r},${ySpine} L ${xm - r},${ySpine} Q ${xm},${ySpine} ${xm},${yTip} Q ${xm},${ySpine} ${xm + r},${ySpine} L ${x2 - r},${ySpine} Q ${x2},${ySpine} ${x2},${y0}`;

  const finalPath = layoutInstance.transformPath ? layoutInstance.transformPath(path) : path;
  item.generalizationLine.plot(finalPath);

  const tipToNodeGap = 10;
  item.generalizationNode.top = yTip + tipToNodeGap;
  item.generalizationNode.left = left + (right - left - item.generalizationNode.width) / 2;

  const themeConfig = (layoutInstance.mindMap && layoutInstance.mindMap.themeConfig) || {};
  const strokeWidth = themeConfig.generalizationLineWidth || 2;
  const strokeColor = groupColor || themeConfig.generalizationLineColor || themeConfig.lineColor || '#64748b';

  item.generalizationLine._customGroupColor = strokeColor;
  item.generalizationLine.stroke({
    width: strokeWidth,
    color: strokeColor,
    linecap: 'round'
  }).fill({ color: 'none' });

  // 辅助虚线
  const targetRoots = item.range && item.node && item.node.children
    ? item.node.children.slice(item.range[0], item.range[1] + 1)
    : [item.node];

  const { leafNodes, maxNodeBottom } = collectLeafNodes(targetRoots);

  let dashedD = '';
  const minGapForDashed = 16;
  const sw = 2;
  const dashLen = 3;
  const pitch = 8;

  leafNodes.forEach(leaf => {
    const leafX = leaf.left + leaf.width / 2;
    if (leafX < x1 - 8 || leafX > x2 + 8) return;
    const yStart = leaf.top + leaf.height + 6;
    const yTarget = maxNodeBottom;
    const totalDist = yTarget - yStart;
    if (totalDist >= minGapForDashed) {
      const startY = yStart + sw / 2;
      const targetY = yTarget - sw / 2;
      const D = targetY - startY;
      const count = Math.max(2, Math.round(D / pitch));
      const step = (D - dashLen) / (count - 1);
      for (let i = 0; i < count; i++) {
        const segStart = startY + i * step;
        const segEnd = segStart + dashLen;
        dashedD += `M ${leafX},${segStart.toFixed(1)} L ${leafX},${segEnd.toFixed(1)} `;
      }
    }
  });

  if (!item.generalizationDashedLine) {
    const parentSvg = item.generalizationLine.parent && item.generalizationLine.parent();
    if (parentSvg && parentSvg.path) {
      item.generalizationDashedLine = parentSvg.path();
      if (item.generalizationDashedLine.backward) {
        item.generalizationDashedLine.backward();
      }
    }
  }

  hookDashedLineLifecycle(item);

  if (item.generalizationDashedLine) {
    if (dashedD) {
      const finalDashed = layoutInstance.transformPath ? layoutInstance.transformPath(dashedD) : dashedD;
      item.generalizationDashedLine.plot(finalDashed);
      item.generalizationDashedLine.stroke({
        width: sw,
        color: strokeColor,
        linecap: 'round'
      }).fill({ color: 'none' }).opacity(0.65);
      item.generalizationDashedLine.show();
    } else {
      item.generalizationDashedLine.plot('');
      item.generalizationDashedLine.hide();
    }
  }

  layoutGeneralizationVerticalSubtree(layoutInstance, item);
}

/**
 * 统一分发渲染函数：根据选项决定使用「连线样式」还是「大括号样式」，并分配各组专属色
 */
export function renderHorizontalGeneralization(layoutInstance, item, isLeft = false, groupIndex = 0) {
  const groupColor = getGeneralizationGroupColor(layoutInstance, item, groupIndex);
  const style = getGeneralizationStyle(layoutInstance, item);
  if (style === 'line') {
    renderHorizontalLineGeneralization(layoutInstance, item, isLeft, groupColor);
  } else {
    renderHorizontalCurlyGeneralization(layoutInstance, item, isLeft, groupColor);
  }
}

export function renderVerticalGeneralization(layoutInstance, item, groupIndex = 0) {
  const groupColor = getGeneralizationGroupColor(layoutInstance, item, groupIndex);
  const style = getGeneralizationStyle(layoutInstance, item);
  if (style === 'line') {
    renderVerticalLineGeneralization(layoutInstance, item, groupColor);
  } else {
    renderVerticalCurlyGeneralization(layoutInstance, item, groupColor);
  }
}

// 缓存管理，防止循环引用
const generalizationNodeCache = new Map();

/**
 * 水平布局：排版并同步概要节点的子主题树
 */
export function layoutGeneralizationSubtree(layoutInstance, item, isLeft = false) {
  const genNode = item.generalizationNode;
  if (!genNode) return;

  const itemData = (genNode.nodeData && genNode.nodeData.data) || item;
  if (!itemData) return;

  const childrenData = (itemData && itemData.children) || (genNode.nodeData && genNode.nodeData.children) || [];

  if (itemData) {
    itemData.children = childrenData;
  }
  if (!genNode.nodeData) genNode.nodeData = { data: itemData };
  genNode.nodeData.children = childrenData;

  if (!childrenData || childrenData.length === 0) {
    if (genNode.children && genNode.children.length > 0) {
      genNode.children.forEach(c => {
        if (c.uid) generalizationNodeCache.delete(c.uid);
        if (c.destroy) c.destroy();
        else if (c.remove) c.remove();
        if (layoutInstance.renderer) layoutInstance.renderer.removeNodeFromActiveList(c);
      });
      genNode.children = [];
    }
    if (genNode._lines && genNode._lines.length > 0) {
      genNode._lines.forEach(l => l.remove());
      genNode._lines = [];
    }
    return;
  }

  const MindMapNodeClass = genNode.constructor;

  function syncNodes(parentNode, dataList, layerIndex) {
    if (!parentNode.children) parentNode.children = [];
    const oldChildren = parentNode.children.slice();
    const newChildren = [];

    dataList.forEach(childData => {
      if (!childData.data) childData.data = {};
      const uid = childData.data.uid || createUid();
      childData.data.uid = uid;

      let childNode = generalizationNodeCache.get(uid);
      if (!childNode || childNode.parent !== parentNode) {
        childNode = new MindMapNodeClass({
          data: childData,
          uid: uid,
          renderer: layoutInstance.renderer,
          mindMap: layoutInstance.mindMap,
          draw: layoutInstance.draw,
          layerIndex: layerIndex,
          isRoot: false,
          parent: parentNode
        });
        generalizationNodeCache.set(uid, childNode);
      } else {
        childNode.layerIndex = layerIndex;
        childNode.parent = parentNode;
        childNode.nodeData = childData;
      }

      if (layoutInstance.cacheNode) {
        layoutInstance.cacheNode(uid, childNode);
      }
      if (layoutInstance.renderer && layoutInstance.renderer.nodeCache) {
        layoutInstance.renderer.nodeCache[uid] = childNode;
      }

      newChildren.push(childNode);
      childNode.getSize();

      if (childData.children && childData.children.length > 0 && childData.data.expand !== false) {
        syncNodes(childNode, childData.children, layerIndex + 1);
      } else {
        if (childNode.children && childNode.children.length > 0) {
          childNode.children.forEach(c => {
            if (c.uid) generalizationNodeCache.delete(c.uid);
            if (c.destroy) c.destroy();
            else if (c.remove) c.remove();
            if (layoutInstance.renderer) layoutInstance.renderer.removeNodeFromActiveList(c);
          });
        }
        childNode.children = [];
      }
    });

    oldChildren.forEach(oldChild => {
      if (!newChildren.includes(oldChild)) {
        if (oldChild.uid) generalizationNodeCache.delete(oldChild.uid);
        if (oldChild.destroy) oldChild.destroy();
        else if (oldChild.remove) oldChild.remove();
        if (layoutInstance.renderer) layoutInstance.renderer.removeNodeFromActiveList(oldChild);
      }
    });

    parentNode.children = newChildren;
  }

  const baseLayer = (item.node && item.node.layerIndex) ? item.node.layerIndex + 1 : 1;
  syncNodes(genNode, childrenData, baseLayer + 1);

  function computeSubtreeHeights(node, marginY) {
    if (!node.children || node.children.length === 0 || node.getData('expand') === false) {
      node._areaHeight = node.height;
      return node.height;
    }
    let totalH = 0;
    node.children.forEach(c => {
      totalH += computeSubtreeHeights(c, marginY);
    });
    totalH += (node.children.length - 1) * marginY;
    node._areaHeight = Math.max(node.height, totalH);
    return node._areaHeight;
  }

  const marginY = layoutInstance.getMarginY ? layoutInstance.getMarginY(baseLayer + 1) : 10;
  computeSubtreeHeights(genNode, marginY);

  function positionNodes(node) {
    if (!node.children || node.children.length === 0 || node.getData('expand') === false) return;
    const lIdx = node.layerIndex || 2;
    const mX = layoutInstance.getMarginX ? layoutInstance.getMarginX(lIdx + 1) : 20;
    const mY = layoutInstance.getMarginY ? layoutInstance.getMarginY(lIdx + 1) : 10;

    const centerY = node.top + node.height / 2;
    const totalChildHeight = node.children.reduce((acc, c) => acc + c._areaHeight, 0) + (node.children.length - 1) * mY;
    let startTop = centerY - totalChildHeight / 2;

    node.children.forEach(child => {
      child.left = isLeft
        ? node.left - child.width - mX
        : node.left + node.width + mX;
      child.top = startTop + (child._areaHeight - child.height) / 2;
      startTop += child._areaHeight + mY;
      positionNodes(child);
    });
  }

  positionNodes(genNode);

  function renderSubtree(node) {
    if (!node.children || node.children.length === 0 || node.getData('expand') === false) return;
    node.children.forEach(child => {
      child.render(() => {}, true);
      renderSubtree(child);
    });
  }
  renderSubtree(genNode);

  if (genNode.renderLine) {
    genNode.renderLine(true);
  }
}

/**
 * 纵向布局：排版并同步概要节点的子主题树
 */
export function layoutGeneralizationVerticalSubtree(layoutInstance, item) {
  const genNode = item.generalizationNode;
  if (!genNode) return;

  const itemData = (genNode.nodeData && genNode.nodeData.data) || item;
  if (!itemData) return;

  const childrenData = (itemData && itemData.children) || (genNode.nodeData && genNode.nodeData.children) || [];

  if (itemData) {
    itemData.children = childrenData;
  }
  if (!genNode.nodeData) genNode.nodeData = { data: itemData };
  genNode.nodeData.children = childrenData;

  if (!childrenData || childrenData.length === 0) {
    if (genNode.children && genNode.children.length > 0) {
      genNode.children.forEach(c => {
        if (c.uid) generalizationNodeCache.delete(c.uid);
        if (c.destroy) c.destroy();
        else if (c.remove) c.remove();
        if (layoutInstance.renderer) layoutInstance.renderer.removeNodeFromActiveList(c);
      });
      genNode.children = [];
    }
    if (genNode._lines && genNode._lines.length > 0) {
      genNode._lines.forEach(l => l.remove());
      genNode._lines = [];
    }
    return;
  }

  const MindMapNodeClass = genNode.constructor;

  function syncNodes(parentNode, dataList, layerIndex) {
    if (!parentNode.children) parentNode.children = [];
    const oldChildren = parentNode.children.slice();
    const newChildren = [];

    dataList.forEach(childData => {
      if (!childData.data) childData.data = {};
      const uid = childData.data.uid || createUid();
      childData.data.uid = uid;

      let childNode = generalizationNodeCache.get(uid);
      if (!childNode || childNode.parent !== parentNode) {
        childNode = new MindMapNodeClass({
          data: childData,
          uid: uid,
          renderer: layoutInstance.renderer,
          mindMap: layoutInstance.mindMap,
          draw: layoutInstance.draw,
          layerIndex: layerIndex,
          isRoot: false,
          parent: parentNode
        });
        generalizationNodeCache.set(uid, childNode);
      } else {
        childNode.layerIndex = layerIndex;
        childNode.parent = parentNode;
        childNode.nodeData = childData;
      }

      if (layoutInstance.cacheNode) {
        layoutInstance.cacheNode(uid, childNode);
      }
      if (layoutInstance.renderer && layoutInstance.renderer.nodeCache) {
        layoutInstance.renderer.nodeCache[uid] = childNode;
      }

      newChildren.push(childNode);
      childNode.getSize();

      if (childData.children && childData.children.length > 0 && childData.data.expand !== false) {
        syncNodes(childNode, childData.children, layerIndex + 1);
      } else {
        if (childNode.children && childNode.children.length > 0) {
          childNode.children.forEach(c => {
            if (c.uid) generalizationNodeCache.delete(c.uid);
            if (c.destroy) c.destroy();
            else if (c.remove) c.remove();
            if (layoutInstance.renderer) layoutInstance.renderer.removeNodeFromActiveList(c);
          });
        }
        childNode.children = [];
      }
    });

    oldChildren.forEach(oldChild => {
      if (!newChildren.includes(oldChild)) {
        if (oldChild.uid) generalizationNodeCache.delete(oldChild.uid);
        if (oldChild.destroy) oldChild.destroy();
        else if (oldChild.remove) oldChild.remove();
        if (layoutInstance.renderer) layoutInstance.renderer.removeNodeFromActiveList(oldChild);
      }
    });

    parentNode.children = newChildren;
  }

  const baseLayer = (item.node && item.node.layerIndex) ? item.node.layerIndex + 1 : 1;
  syncNodes(genNode, childrenData, baseLayer + 1);

  function computeSubtreeWidths(node, marginX) {
    if (!node.children || node.children.length === 0 || node.getData('expand') === false) {
      node._areaWidth = node.width;
      return node.width;
    }
    let totalW = 0;
    node.children.forEach(c => {
      totalW += computeSubtreeWidths(c, marginX);
    });
    totalW += (node.children.length - 1) * marginX;
    node._areaWidth = Math.max(node.width, totalW);
    return node._areaWidth;
  }

  const marginX = layoutInstance.getMarginX ? layoutInstance.getMarginX(baseLayer + 1) : 20;
  computeSubtreeWidths(genNode, marginX);

  function positionNodes(node) {
    if (!node.children || node.children.length === 0 || node.getData('expand') === false) return;
    const lIdx = node.layerIndex || 2;
    const mX = layoutInstance.getMarginX ? layoutInstance.getMarginX(lIdx + 1) : 20;
    const mY = layoutInstance.getMarginY ? layoutInstance.getMarginY(lIdx + 1) : 10;

    const centerX = node.left + node.width / 2;
    const totalChildWidth = node.children.reduce((acc, c) => acc + c._areaWidth, 0) + (node.children.length - 1) * mX;
    let startLeft = centerX - totalChildWidth / 2;

    node.children.forEach(child => {
      child.top = node.top + node.height + mY;
      child.left = startLeft + (child._areaWidth - child.width) / 2;
      startLeft += child._areaWidth + mX;
      positionNodes(child);
    });
  }

  positionNodes(genNode);

  function renderSubtree(node) {
    if (!node.children || node.children.length === 0 || node.getData('expand') === false) return;
    node.children.forEach(child => {
      child.render(() => {}, true);
      renderSubtree(child);
    });
  }
  renderSubtree(genNode);

  if (genNode.renderLine) {
    genNode.renderLine(true);
  }
}

/**
 * 补丁支持：概要节点插入子节点、查找以及保持各组专属颜色
 */
let isPatched = false;
export function patchGeneralizationChildSupport() {
  if (isPatched) return;
  isPatched = true;

  // 1. 样式补丁：确保 simple-mind-map 刷新节点样式时保留各概要组的专属线条颜色
  if (Style && Style.prototype) {
    const origGeneralizationLine = Style.prototype.generalizationLine;
    Style.prototype.generalizationLine = function (line) {
      if (origGeneralizationLine) {
        origGeneralizationLine.call(this, line);
      }
      if (line && line._customGroupColor) {
        line.stroke({ color: line._customGroupColor });
      }
    };
  }

  // 2. Render 补丁：支持选中概要节点直接 Tab 插入子主题，以及根据 uid 查找概要子树节点
  if (Render && Render.prototype) {
    const origInsertChildNode = Render.prototype.insertChildNode;
    Render.prototype.insertChildNode = function (openEdit = true, appointNodes, appointData, appointChildren = []) {
      const list = (appointNodes && appointNodes.length > 0) ? appointNodes : this.activeNodeList;
      const genNodes = list.filter(node => node.isGeneralization);
      const regularNodes = list.filter(node => !node.isGeneralization);

      if (genNodes.length > 0) {
        const isRichText = this.hasRichTextPlugin();
        const { focusNewNode, inserting } = this.getNewNodeBehavior(openEdit, list.length > 1);
        const params = {
          expand: true,
          richText: isRichText,
          isActive: focusNewNode
        };
        if (isRichText) params.resetRichText = true;

        genNodes.forEach(genNode => {
          const itemData = (genNode.nodeData && genNode.nodeData.data) || genNode.nodeData;
          if (!itemData) return;
          if (!itemData.children) itemData.children = [];
          if (!genNode.nodeData.children) genNode.nodeData.children = itemData.children;

          const text = this.mindMap.opt.defaultInsertBelowSecondLevelNodeText || '分支主题';
          const newUid = createUid();
          const newChild = {
            inserting,
            data: {
              text,
              uid: newUid,
              ...params,
              ...(appointData || {})
            },
            children: []
          };
          itemData.children.push(newChild);
          genNode.setData({ expand: true });
        });

        if (focusNewNode) {
          this.clearActiveNodeList();
        }
        this.mindMap.render();
      }

      if (regularNodes.length > 0) {
        return origInsertChildNode.call(this, openEdit, regularNodes, appointData, appointChildren);
      }
    };

    const origFindNodeByUid = Render.prototype.findNodeByUid;
    Render.prototype.findNodeByUid = function (uid) {
      const direct = origFindNodeByUid.call(this, uid);
      if (direct) return direct;
      if (generalizationNodeCache.has(uid)) {
        return generalizationNodeCache.get(uid);
      }
      return null;
    };
  }

  // 3. 节点快捷创建子节点按钮适配
  if (MindMapNode && MindMapNode.prototype) {
    const origShowQuick = MindMapNode.prototype.showQuickCreateChildBtn;
    if (origShowQuick) {
      MindMapNode.prototype.showQuickCreateChildBtn = function () {
        if (this.isGeneralization) {
          if (this.getChildrenLength() > 0) return;
          const origIsGen = this.isGeneralization;
          this.isGeneralization = false;
          try {
            origShowQuick.call(this);
          } finally {
            this.isGeneralization = origIsGen;
          }
          return;
        }
        return origShowQuick.call(this);
      };
    }
  }
}

/**
 * 安装概要渲染器（全面拦截各大布局结构的 renderGeneralization，支持多组分色与大括号/连线样式切换）
 */
export function setupCurlyGeneralization() {
  patchGeneralizationChildSupport();

  // 1. LogicalStructure (逻辑结构图)
  if (LogicalStructure && LogicalStructure.prototype) {
    LogicalStructure.prototype.renderGeneralization = function (list) {
      list.forEach((item, index) => {
        renderHorizontalGeneralization(this, item, !!this.isUseLeft, index);
      });
    };
  }

  // 2. MindMap (思维导图双向)
  if (MindMapLayout && MindMapLayout.prototype) {
    MindMapLayout.prototype.renderGeneralization = function (list) {
      list.forEach((item, index) => {
        const isLeft = item.node && (item.node.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT || item.node.dir === 'left');
        renderHorizontalGeneralization(this, item, isLeft, index);
      });
    };
  }

  // 3. CatalogOrganization (目录组织图)
  if (CatalogOrganization && CatalogOrganization.prototype) {
    CatalogOrganization.prototype.renderGeneralization = function (list) {
      list.forEach((item, index) => {
        renderHorizontalGeneralization(this, item, false, index);
      });
    };
  }

  // 4. Timeline (时间轴)
  if (Timeline && Timeline.prototype) {
    Timeline.prototype.renderGeneralization = function (list) {
      list.forEach((item, index) => {
        renderHorizontalGeneralization(this, item, false, index);
      });
    };
  }

  // 5. VerticalTimeline (竖向时间轴)
  if (VerticalTimeline && VerticalTimeline.prototype) {
    VerticalTimeline.prototype.renderGeneralization = function (list) {
      list.forEach((item, index) => {
        const isLeft = item.node && item.node.dir === 'left';
        renderHorizontalGeneralization(this, item, isLeft, index);
      });
    };
  }

  // 6. Fishbone (鱼骨图)
  if (Fishbone && Fishbone.prototype) {
    Fishbone.prototype.renderGeneralization = function (list) {
      list.forEach((item, index) => {
        renderHorizontalGeneralization(this, item, false, index);
      });
    };
  }

  // 7. OrganizationStructure (组织结构图 - 纵向)
  if (OrganizationStructure && OrganizationStructure.prototype) {
    OrganizationStructure.prototype.renderGeneralization = function (list) {
      list.forEach((item, index) => {
        renderVerticalGeneralization(this, item, index);
      });
    };
  }
}

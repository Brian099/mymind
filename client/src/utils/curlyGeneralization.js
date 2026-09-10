import LogicalStructure from 'simple-mind-map/src/layouts/LogicalStructure.js';
import MindMapLayout from 'simple-mind-map/src/layouts/MindMap.js';
import CatalogOrganization from 'simple-mind-map/src/layouts/CatalogOrganization.js';
import OrganizationStructure from 'simple-mind-map/src/layouts/OrganizationStructure.js';
import Timeline from 'simple-mind-map/src/layouts/Timeline.js';
import VerticalTimeline from 'simple-mind-map/src/layouts/VerticalTimeline.js';
import Fishbone from 'simple-mind-map/src/layouts/Fishbone.js';
import Render from 'simple-mind-map/src/core/render/Render.js';
import MindMapNode from 'simple-mind-map/src/core/render/node/MindMapNode.js';
import { CONSTANTS } from 'simple-mind-map/src/constants/constant.js';
import { createUid } from 'simple-mind-map/src/utils/index.js';

/**
 * Render elegant mathematical curly bracket '}' (or '{') for horizontal layouts,
 * with supplementary dashed connector lines from distant leaf nodes to the bracket spine.
 * 
 * Geometry:
 * (x0, y1)  ╭─ (xSpine, y1 + r)
 *           │
 *           │  (spine at xSpine)
 *           │
 *           ╰─╮
 *             ├─► (xTip, ym)  --- Sharp peak pointing to summary node
 *           ╭─╯
 *           │
 *           │  (spine at xSpine)
 *           │
 * (x0, y2)  ╰─ (xSpine, y2 - r)
 */
export function renderHorizontalCurlyGeneralization(layoutInstance, item, isLeft = false) {
  const boundaries = layoutInstance.getNodeGeneralizationRenderBoundaries(item, 'h');
  const { top, bottom, left, right, generalizationLineMargin, generalizationNodeMargin } = boundaries;

  const margin = generalizationLineMargin !== undefined ? generalizationLineMargin : 6;

  // x0: anchor coordinate closest to nodes
  const x0 = isLeft ? left - margin : right + margin;
  const y1 = top;
  const y2 = bottom;
  const H = Math.max(y2 - y1, 14);
  const ym = y1 + H / 2;

  // Direction: +1 points right (summary on right), -1 points left (summary on left)
  const dir = isLeft ? -1 : 1;

  // Adaptive radius and tip depth
  const r = Math.min(8, Math.max(4, Math.floor(H / 6)));
  const tipW = r; // tip extends r pixels beyond spine

  const xSpine = x0 + r * dir;
  const xTip = x0 + (r + tipW) * dir;

  // SVG path with 4 quadratic beziers and 2 straight line segments for seamless curvature
  const path = `M ${x0},${y1} Q ${xSpine},${y1} ${xSpine},${y1 + r} L ${xSpine},${ym - r} Q ${xSpine},${ym} ${xTip},${ym} Q ${xSpine},${ym} ${xSpine},${ym + r} L ${xSpine},${y2 - r} Q ${xSpine},${y2} ${x0},${y2}`;

  const finalPath = layoutInstance.transformPath ? layoutInstance.transformPath(path) : path;
  item.generalizationLine.plot(finalPath);

  // Position the summary node centered at ym with a comfortable 10px gap from the tip
  const tipToNodeGap = 10;
  const totalOffset = Math.abs(xTip - x0) + tipToNodeGap;
  item.generalizationNode.left = isLeft
    ? x0 - totalOffset - item.generalizationNode.width
    : x0 + totalOffset;
  item.generalizationNode.top = top + (bottom - top - item.generalizationNode.height) / 2;

  // -------------------------------------------------------------
  // Supplementary Dashed Guide Lines for Distant Leaf Nodes
  // -------------------------------------------------------------
  const targetRoots = item.range && item.node && item.node.children
    ? item.node.children.slice(item.range[0], item.range[1] + 1)
    : [item.node];

  let maxNodeRight = -Infinity;
  let minNodeLeft = Infinity;

  const leafNodes = [];
  function collectNodes(n) {
    if (!n) return;
    if (typeof n.left === 'number' && typeof n.width === 'number') {
      const r = n.left + n.width;
      if (r > maxNodeRight) maxNodeRight = r;
      if (n.left < minNodeLeft) minNodeLeft = n.left;
    }
    const isExpanded = n.getData && n.getData('expand') !== false;
    if (isExpanded && n.children && n.children.length > 0) {
      n.children.forEach(collectNodes);
    } else {
      leafNodes.push(n);
    }
  }
  targetRoots.forEach(collectNodes);

  if (maxNodeRight === -Infinity) maxNodeRight = right;
  if (minNodeLeft === Infinity) minNodeLeft = left;

  let dashedD = '';
  const minGapForDashed = 16;
  const sw = 2;        // stroke width
  const dashLen = 3;   // dash segment length
  const pitch = 8;     // desired spacing pitch

  leafNodes.forEach(leaf => {
    const leafY = leaf.top + leaf.height / 2;
    // Only consider leaves within the vertical bracket range
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
        // Visual bounds: left edge starts at xStart, right edge of the last dash aligns exactly with xTarget
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

  // Ensure dashed path element exists
  if (!item.generalizationDashedLine) {
    const parentSvg = item.generalizationLine.parent && item.generalizationLine.parent();
    if (parentSvg && parentSvg.path) {
      item.generalizationDashedLine = parentSvg.path();
      if (item.generalizationDashedLine.backward) {
        item.generalizationDashedLine.backward();
      }
    }
  }

  // Hook lifecycle (hide, show, remove) onto generalizationLine
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

  if (item.generalizationDashedLine) {
    if (dashedD) {
      const finalDashed = layoutInstance.transformPath ? layoutInstance.transformPath(dashedD) : dashedD;
      item.generalizationDashedLine.plot(finalDashed);
      const themeConfig = (layoutInstance.mindMap && layoutInstance.mindMap.themeConfig) || {};
      const lineColor = themeConfig.generalizationLineColor || themeConfig.lineColor || '#64748b';
      item.generalizationDashedLine.stroke({
        width: sw,
        color: lineColor,
        linecap: 'round'
      }).fill({ color: 'none' }).opacity(0.65);
      item.generalizationDashedLine.show();
    } else {
      item.generalizationDashedLine.plot('');
      item.generalizationDashedLine.hide();
    }
  }

  // -------------------------------------------------------------
  // Layout and render child subtopics attached to generalization node
  // -------------------------------------------------------------
  layoutGeneralizationSubtree(layoutInstance, item, isLeft);
}

// Cache to track node instances without modifying the serialized node data (avoids circular references)
const generalizationNodeCache = new Map();

/**
 * Layout and synchronize subtopics (children) of a generalization node (horizontal)
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

  // Render and layout child node SVG elements
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
 * Layout and synchronize subtopics of a generalization node (vertical)
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

  // Render and layout child node SVG elements
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
 * Patch simple-mind-map to enable inserting and finding children of generalization nodes
 */
let isPatched = false;
export function patchGeneralizationChildSupport() {
  if (isPatched) return;
  isPatched = true;

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
 * Render downward curly bracket '⏟' for vertical organization structure,
 * with supplementary dashed connector lines from distant leaf nodes.
 */
export function renderVerticalCurlyGeneralization(layoutInstance, item) {
  const boundaries = layoutInstance.getNodeGeneralizationRenderBoundaries(item, 'v');
  const { bottom, left, right, generalizationLineMargin, generalizationNodeMargin } = boundaries;

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

  // Supplementary dashed lines
  const targetRoots = item.range && item.node && item.node.children
    ? item.node.children.slice(item.range[0], item.range[1] + 1)
    : [item.node];

  let maxNodeBottom = -Infinity;
  const leafNodes = [];
  function collectNodes(n) {
    if (!n) return;
    if (typeof n.top === 'number' && typeof n.height === 'number') {
      const b = n.top + n.height;
      if (b > maxNodeBottom) maxNodeBottom = b;
    }
    const isExpanded = n.getData && n.getData('expand') !== false;
    if (isExpanded && n.children && n.children.length > 0) {
      n.children.forEach(collectNodes);
    } else {
      leafNodes.push(n);
    }
  }
  targetRoots.forEach(collectNodes);

  if (maxNodeBottom === -Infinity) maxNodeBottom = bottom;

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

  if (item.generalizationDashedLine) {
    if (dashedD) {
      const finalDashed = layoutInstance.transformPath ? layoutInstance.transformPath(dashedD) : dashedD;
      item.generalizationDashedLine.plot(finalDashed);
      const themeConfig = (layoutInstance.mindMap && layoutInstance.mindMap.themeConfig) || {};
      const lineColor = themeConfig.generalizationLineColor || themeConfig.lineColor || '#64748b';
      item.generalizationDashedLine.stroke({
        width: sw,
        color: lineColor,
        linecap: 'round'
      }).fill({ color: 'none' }).opacity(0.65);
      item.generalizationDashedLine.show();
    } else {
      item.generalizationDashedLine.plot('');
      item.generalizationDashedLine.hide();
    }
  }

  // Layout and render child subtopics attached to vertical generalization node
  layoutGeneralizationVerticalSubtree(layoutInstance, item);
}

/**
 * Install the curly bracket generalization renderer into simple-mind-map layouts
 */
export function setupCurlyGeneralization() {
  patchGeneralizationChildSupport();

  // 1. LogicalStructure (逻辑结构图)
  if (LogicalStructure && LogicalStructure.prototype) {
    LogicalStructure.prototype.renderGeneralization = function (list) {
      list.forEach(item => {
        renderHorizontalCurlyGeneralization(this, item, !!this.isUseLeft);
      });
    };
  }

  // 2. MindMap (思维导图双向)
  if (MindMapLayout && MindMapLayout.prototype) {
    MindMapLayout.prototype.renderGeneralization = function (list) {
      list.forEach(item => {
        const isLeft = item.node && (item.node.dir === CONSTANTS.LAYOUT_GROW_DIR.LEFT || item.node.dir === 'left');
        renderHorizontalCurlyGeneralization(this, item, isLeft);
      });
    };
  }

  // 3. CatalogOrganization (目录组织图)
  if (CatalogOrganization && CatalogOrganization.prototype) {
    CatalogOrganization.prototype.renderGeneralization = function (list) {
      list.forEach(item => {
        renderHorizontalCurlyGeneralization(this, item, false);
      });
    };
  }

  // 4. Timeline (时间轴)
  if (Timeline && Timeline.prototype) {
    Timeline.prototype.renderGeneralization = function (list) {
      list.forEach(item => {
        renderHorizontalCurlyGeneralization(this, item, false);
      });
    };
  }

  // 5. VerticalTimeline (竖向时间轴)
  if (VerticalTimeline && VerticalTimeline.prototype) {
    VerticalTimeline.prototype.renderGeneralization = function (list) {
      list.forEach(item => {
        const isLeft = item.node && item.node.dir === 'left';
        renderHorizontalCurlyGeneralization(this, item, isLeft);
      });
    };
  }

  // 6. Fishbone (鱼骨图)
  if (Fishbone && Fishbone.prototype) {
    Fishbone.prototype.renderGeneralization = function (list) {
      list.forEach(item => {
        renderHorizontalCurlyGeneralization(this, item, false);
      });
    };
  }

  // 7. OrganizationStructure (组织结构图 - 纵向)
  if (OrganizationStructure && OrganizationStructure.prototype) {
    OrganizationStructure.prototype.renderGeneralization = function (list) {
      list.forEach(item => {
        renderVerticalCurlyGeneralization(this, item);
      });
    };
  }
}

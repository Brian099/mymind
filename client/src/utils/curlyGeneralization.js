import LogicalStructure from 'simple-mind-map/src/layouts/LogicalStructure.js';
import MindMapLayout from 'simple-mind-map/src/layouts/MindMap.js';
import CatalogOrganization from 'simple-mind-map/src/layouts/CatalogOrganization.js';
import OrganizationStructure from 'simple-mind-map/src/layouts/OrganizationStructure.js';
import Timeline from 'simple-mind-map/src/layouts/Timeline.js';
import VerticalTimeline from 'simple-mind-map/src/layouts/VerticalTimeline.js';
import Fishbone from 'simple-mind-map/src/layouts/Fishbone.js';
import { CONSTANTS } from 'simple-mind-map/src/constants/constant.js';

/**
 * Render elegant mathematical curly bracket '}' (or '{') for horizontal layouts
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

  // SVG path with 4 quadratic beziers and 2 straight line segments for seamless C1 curvature
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
}

/**
 * Render downward curly bracket '⏟' for vertical organization structure
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
}

/**
 * Install the curly bracket generalization renderer into simple-mind-map layouts
 */
export function setupCurlyGeneralization() {
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

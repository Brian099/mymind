import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. [Authenticated] Get share settings for a mindmap
router.get('/config/:mindmapId', authenticateToken, (req, res) => {
  try {
    const { mindmapId } = req.params;
    
    // Verify user owns the mindmap
    const mindmap = db.prepare('SELECT id, title FROM mindmaps WHERE id = ? AND user_id = ?')
      .get(mindmapId, req.user.id);
    if (!mindmap) {
      return res.status(404).json({ error: '思维导图不存在或无权操作' });
    }

    const share = db.prepare('SELECT share_id, is_enabled, password, created_at FROM shares WHERE mindmap_id = ?')
      .get(mindmapId);

    return res.json({
      mindmapId,
      title: mindmap.title,
      share: share || null
    });
  } catch (err) {
    console.error('Get share config error:', err);
    return res.status(500).json({ error: '获取分享配置失败' });
  }
});

// 2. [Authenticated] Update or create share config
router.post('/config/:mindmapId', authenticateToken, (req, res) => {
  try {
    const { mindmapId } = req.params;
    const { is_enabled, password } = req.body;

    // Verify user owns the mindmap
    const mindmap = db.prepare('SELECT id FROM mindmaps WHERE id = ? AND user_id = ?')
      .get(mindmapId, req.user.id);
    if (!mindmap) {
      return res.status(404).json({ error: '思维导图不存在或无权操作' });
    }

    let share = db.prepare('SELECT * FROM shares WHERE mindmap_id = ?').get(mindmapId);

    const sharePassword = password && password.trim() ? password.trim() : null;
    const enabled = is_enabled ? 1 : 0;

    if (!share) {
      // Create new share record with 8-character compact UUID or standard UUID
      const shareId = uuidv4().replace(/-/g, '').slice(0, 12);
      db.prepare(`
        INSERT INTO shares (share_id, mindmap_id, is_enabled, password)
        VALUES (?, ?, ?, ?)
      `).run(shareId, mindmapId, enabled, sharePassword);

      share = { share_id: shareId, mindmap_id: mindmapId, is_enabled: enabled, password: sharePassword };
    } else {
      db.prepare(`
        UPDATE shares
        SET is_enabled = ?, password = ?
        WHERE mindmap_id = ?
      `).run(enabled, sharePassword, mindmapId);

      share.is_enabled = enabled;
      share.password = sharePassword;
    }

    return res.json({
      message: '分享设置已更新',
      share
    });
  } catch (err) {
    console.error('Update share config error:', err);
    return res.status(500).json({ error: '更新分享设置失败' });
  }
});

// 3. [Public - No Login Required] Access shared mindmap by shareId
router.get('/public/:shareId', (req, res) => {
  try {
    const { shareId } = req.params;
    const providedPassword = req.query.password || req.headers['x-share-password'];

    const share = db.prepare(`
      SELECT s.share_id, s.is_enabled, s.password,
             m.id as mindmap_id, m.title, m.description, m.content, m.updated_at,
             u.username as author
      FROM shares s
      JOIN mindmaps m ON s.mindmap_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE s.share_id = ?
    `).get(shareId);

    if (!share) {
      return res.status(404).json({ error: '分享链接不存在或已失效' });
    }

    if (!share.is_enabled) {
      return res.status(403).json({ error: '该思维导图已关闭分享' });
    }

    // Check password protection
    if (share.password) {
      if (!providedPassword) {
        return res.status(200).json({
          is_protected: true,
          title: share.title,
          author: share.author,
          message: '该分享受密码保护，请输入访问密码'
        });
      }

      if (providedPassword !== share.password) {
        return res.status(401).json({
          is_protected: true,
          error: '访问密码错误，请重新输入'
        });
      }
    }

    // Parse content JSON safely
    let content = share.content;
    try {
      content = JSON.parse(share.content);
    } catch {
      // keep raw
    }

    return res.json({
      is_protected: false,
      title: share.title,
      description: share.description,
      author: share.author,
      updated_at: share.updated_at,
      content
    });
  } catch (err) {
    console.error('Public share access error:', err);
    return res.status(500).json({ error: '加载分享思维导图失败' });
  }
});

export default router;

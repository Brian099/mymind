import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all mindmaps routes
router.use(authenticateToken);

// 1. Get all mindmaps for the current user
router.get('/', (req, res) => {
  try {
    const { search, sort } = req.query;
    let query = `
      SELECT m.id, m.title, m.description, m.created_at, m.updated_at,
             s.share_id, s.is_enabled as is_shared, s.password IS NOT NULL as has_share_password
      FROM mindmaps m
      LEFT JOIN shares s ON m.id = s.mindmap_id
      WHERE m.user_id = ?
    `;
    const params = [req.user.id];

    if (search && search.trim()) {
      query += ` AND (m.title LIKE ? OR m.description LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (sort === 'created') {
      query += ` ORDER BY m.created_at DESC`;
    } else {
      query += ` ORDER BY m.updated_at DESC`;
    }

    const mindmaps = db.prepare(query).all(...params);
    return res.json({ mindmaps });
  } catch (err) {
    console.error('Fetch mindmaps error:', err);
    return res.status(500).json({ error: '获取思维导图列表失败' });
  }
});

// 2. Create a new mindmap
router.post('/', (req, res) => {
  try {
    const { title, description, content } = req.body;
    const mindmapTitle = (title && title.trim()) || '新建思维导图';
    const mindmapId = uuidv4();

    // Default template data if content is not provided
    const defaultData = {
      root: {
        data: {
          text: mindmapTitle
        },
        children: [
          { data: { text: '主要分支 1' }, children: [] },
          { data: { text: '主要分支 2' }, children: [] },
          { data: { text: '主要分支 3' }, children: [] }
        ]
      },
      theme: {
        template: 'classic4',
        config: {}
      },
      layout: 'logicalStructure'
    };

    const finalContent = typeof content === 'string' ? content : JSON.stringify(content || defaultData);

    db.prepare(`
      INSERT INTO mindmaps (id, user_id, title, description, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(mindmapId, req.user.id, mindmapTitle, description || '', finalContent);

    const created = db.prepare('SELECT id, title, description, created_at, updated_at FROM mindmaps WHERE id = ?').get(mindmapId);
    return res.status(201).json({ message: '创建成功', mindmap: created });
  } catch (err) {
    console.error('Create mindmap error:', err);
    return res.status(500).json({ error: '创建思维导图失败' });
  }
});

// 3. Get single mindmap details (including content)
router.get('/:id', (req, res) => {
  try {
    const mindmap = db.prepare(`
      SELECT m.*, s.share_id, s.is_enabled as is_shared, s.password as share_password
      FROM mindmaps m
      LEFT JOIN shares s ON m.id = s.mindmap_id
      WHERE m.id = ? AND m.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!mindmap) {
      return res.status(404).json({ error: '思维导图不存在或无权访问' });
    }

    // Parse content JSON safely
    try {
      mindmap.content = JSON.parse(mindmap.content);
    } catch {
      // keep raw string if parsing fails
    }

    return res.json({ mindmap });
  } catch (err) {
    console.error('Get mindmap error:', err);
    return res.status(500).json({ error: '获取思维导图详情失败' });
  }
});

// 4. Update mindmap (save content, title, description)
router.put('/:id', (req, res) => {
  try {
    const { title, description, content } = req.body;
    
    // Check ownership
    const existing = db.prepare('SELECT id FROM mindmaps WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({ error: '思维导图不存在或无权访问' });
    }

    let finalContent = null;
    if (content !== undefined) {
      finalContent = typeof content === 'string' ? content : JSON.stringify(content);
    }

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (finalContent !== null) {
      updates.push('content = ?');
      params.push(finalContent);
    }

    updates.push("updated_at = datetime('now', 'localtime')");
    params.push(req.params.id, req.user.id);

    db.prepare(`
      UPDATE mindmaps
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).run(...params);

    return res.json({ message: '保存成功' });
  } catch (err) {
    console.error('Update mindmap error:', err);
    return res.status(500).json({ error: '保存思维导图失败' });
  }
});

// 5. Duplicate a mindmap
router.post('/:id/duplicate', (req, res) => {
  try {
    const source = db.prepare('SELECT * FROM mindmaps WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!source) {
      return res.status(404).json({ error: '原脑图不存在' });
    }

    const newId = uuidv4();
    const newTitle = `${source.title} (副本)`;

    db.prepare(`
      INSERT INTO mindmaps (id, user_id, title, description, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(newId, req.user.id, newTitle, source.description, source.content);

    return res.status(201).json({ message: '复制成功', newId });
  } catch (err) {
    console.error('Duplicate mindmap error:', err);
    return res.status(500).json({ error: '复制思维导图失败' });
  }
});

// 6. Delete mindmap
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM mindmaps WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: '思维导图不存在或无权删除' });
    }

    return res.json({ message: '删除成功' });
  } catch (err) {
    console.error('Delete mindmap error:', err);
    return res.status(500).json({ error: '删除思维导图失败' });
  }
});

export default router;

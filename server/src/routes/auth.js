import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: '用户名长度需在 3 到 30 个字符之间' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度不能少于 6 位' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (existingUser) {
      return res.status(409).json({ error: '该用户名已被注册' });
    }

    // Hash password & insert
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)')
      .run(userId, username.trim(), passwordHash);

    // Create a default welcome mindmap for new users
    const defaultMindmapId = uuidv4();
    const defaultData = {
      root: {
        data: {
          text: '欢迎使用思维导图'
        },
        children: [
          {
            data: { text: '✨ 功能特性' },
            children: [
              { data: { text: '支持多种结构与主题' } },
              { data: { text: '支持快捷键操作' } },
              { data: { text: '支持免登录只读分享' } }
            ]
          },
          {
            data: { text: '🚀 快捷键提示' },
            children: [
              { data: { text: 'Tab 键：添加子节点' } },
              { data: { text: 'Enter 键：添加同级节点' } },
              { data: { text: 'Delete 键：删除节点' } }
            ]
          },
          {
            data: { text: '💾 数据存储' },
            children: [
              { data: { text: '自动保存到服务端持久化' } },
              { data: { text: '支持导出 XMind / 图片 / Markdown' } }
            ]
          }
        ]
      },
      theme: {
        template: 'classic4',
        config: {}
      },
      layout: 'logicalStructure'
    };

    db.prepare(`
      INSERT INTO mindmaps (id, user_id, title, description, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      defaultMindmapId,
      userId,
      '欢迎使用思维导图',
      '这是一份新手入门引导脑图，帮助你快速上手。',
      JSON.stringify(defaultData)
    );

    const token = generateToken({ id: userId, username: username.trim() });
    return res.status(201).json({
      message: '注册成功',
      token,
      user: { id: userId, username: username.trim() }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = generateToken({ id: user.id, username: user.username });
    return res.json({
      message: '登录成功',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

// Current user profile
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  return res.json({ user });
});

export default router;

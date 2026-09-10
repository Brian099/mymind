<template>
  <div class="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden select-none">
    <!-- Header for Share Visitor -->
    <header class="h-14 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 shadow-2xs">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="font-bold text-sm sm:text-base text-slate-800 truncate">
              {{ title || '分享思维导图' }}
            </h1>
            <span class="px-2 py-0.5 rounded-md text-3xs font-medium bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              只读模式
            </span>
          </div>
          <p v-if="author" class="text-xs text-slate-400 truncate">
            由 @{{ author }} 分享 · 更新于 {{ formatDate(updatedAt) }}
          </p>
        </div>
      </div>

      <!-- Right: Viewer Controls (Zoom, Fit, Export Image) -->
      <div class="flex items-center gap-2 shrink-0">
        <div class="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            @click="zoomIn"
            class="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="放大"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button
            @click="zoomOut"
            class="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="缩小"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button
            @click="fitView"
            class="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer text-xs shadow-2xs"
            title="居中适应画布"
          >
            适应居中
          </button>
        </div>

        <button
          @click="exportImage"
          class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
          title="保存图片到本地"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span class="hidden sm:inline">导出图片</span>
        </button>
      </div>
    </header>

    <!-- Canvas Area -->
    <div class="flex-1 w-full h-full relative overflow-hidden bg-slate-50">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/80 z-20">
        <div class="flex flex-col items-center gap-2">
          <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span class="text-xs text-slate-500">正在加载思维导图...</span>
        </div>
      </div>

      <div ref="mindMapContainer" class="w-full h-full"></div>
    </div>

    <!-- Password Protected Modal Dialog -->
    <div v-if="isProtected && !isUnlocked" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
        <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h3 class="font-bold text-lg text-slate-900 mb-1">受密码保护的思维导图</h3>
        <p class="text-xs text-slate-500 mb-5">请输入创建者设置的访问密码进行浏览</p>

        <form @submit.prevent="verifyPassword" class="space-y-4">
          <input
            v-model="inputPassword"
            type="password"
            required
            placeholder="请输入访问密码"
            class="w-full text-center tracking-widest text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div v-if="passwordError" class="text-xs text-rose-500 font-medium">
            {{ passwordError }}
          </div>

          <button
            type="submit"
            :disabled="verifying"
            class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {{ verifying ? '验证中...' : '解锁浏览' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import MindMap from 'simple-mind-map';
import Themes from 'simple-mind-map-plugin-themes';
import ExportPlugin from 'simple-mind-map/src/plugins/Export.js';
import { setupCurlyGeneralization } from '../utils/curlyGeneralization';
import api from '../api';

Themes.init(MindMap);
setupCurlyGeneralization();
MindMap.usePlugin(ExportPlugin);

const route = useRoute();
const shareId = route.params.shareId;

const mindMapContainer = ref(null);
let mindMapInstance = null;

const loading = ref(true);
const title = ref('');
const author = ref('');
const updatedAt = ref('');
const isProtected = ref(false);
const isUnlocked = ref(false);
const inputPassword = ref('');
const passwordError = ref('');
const verifying = ref(false);

const loadShare = async (pwd = '') => {
  loading.value = true;
  passwordError.value = '';
  try {
    const res = await api.get(`/share/public/${shareId}`, {
      params: pwd ? { password: pwd } : {}
    });

    if (res.data.is_protected) {
      isProtected.value = true;
      title.value = res.data.title || '';
      author.value = res.data.author || '';
      return;
    }

    isProtected.value = false;
    isUnlocked.value = true;
    title.value = res.data.title;
    author.value = res.data.author;
    updatedAt.value = res.data.updated_at;

    let content = res.data.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        content = null;
      }
    }

    initReadonlyMindMap(content || {
      root: { data: { text: res.data.title }, children: [] },
      theme: { template: 'classic4' },
      layout: 'logicalStructure'
    });
  } catch (err) {
    if (err.response?.status === 401) {
      isProtected.value = true;
      passwordError.value = '密码错误，请重新输入';
    } else {
      alert(err.response?.data?.error || '加载分享思维导图失败');
    }
  } finally {
    loading.value = false;
    verifying.value = false;
  }
};

const verifyPassword = async () => {
  if (!inputPassword.value) return;
  verifying.value = true;
  await loadShare(inputPassword.value);
};

const initReadonlyMindMap = (data) => {
  if (!mindMapContainer.value) return;

  const rootNode = data.root ? data.root : (data.data ? data : { data: { text: title.value || '中心主题' }, children: [] });
  const layout = data.layout || 'logicalStructure';
  const theme = data.theme?.template || 'classic4';

  mindMapInstance = new MindMap({
    el: mindMapContainer.value,
    data: rootNode,
    layout: layout,
    theme: theme,
    readonly: true, // Read-only mode!
  });

  if (data.theme?.config) {
    try {
      mindMapInstance.setThemeConfig(data.theme.config);
    } catch (e) {
      console.warn('Set theme config error', e);
    }
  }

  if (data.view) {
    try {
      mindMapInstance.view.setTransformData(data.view);
    } catch (e) {
      console.warn('Set view transform error', e);
    }
  }

  setTimeout(() => {
    mindMapInstance.view.fit();
  }, 100);
};

const zoomIn = () => {
  if (!mindMapInstance) return;
  mindMapInstance.view.enlarge();
};

const zoomOut = () => {
  if (!mindMapInstance) return;
  mindMapInstance.view.narrow();
};

const fitView = () => {
  if (!mindMapInstance) return;
  mindMapInstance.view.fit();
};

const exportImage = async () => {
  if (!mindMapInstance) return;
  try {
    await mindMapInstance.export('png', true, title.value || '思维导图');
  } catch (err) {
    console.error('Export image error:', err);
    alert('导出图片失败');
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

onMounted(() => {
  loadShare();
});

onBeforeUnmount(() => {
  if (mindMapInstance) {
    mindMapInstance.destroy();
  }
});
</script>

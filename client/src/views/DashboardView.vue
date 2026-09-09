<template>
  <div class="min-h-screen bg-slate-50 flex flex-col">
    <!-- Top Navigation Header -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </div>
          <div>
            <h1 class="font-bold text-lg text-slate-900 tracking-tight leading-tight">OpenMindMap</h1>
            <p class="text-xs text-slate-400">自建多用户思维导图平台</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <!-- User Profile info -->
          <div class="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-semibold text-xs flex items-center justify-center shadow-inner">
              {{ authStore.user?.username?.slice(0, 1).toUpperCase() || 'U' }}
            </div>
            <span class="text-sm font-medium text-slate-700 hidden sm:inline">{{ authStore.user?.username }}</span>
            <button
              @click="handleLogout"
              title="退出登录"
              class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Toolbar & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 tracking-tight">我的思维导图</h2>
          <p class="text-sm text-slate-500 mt-1">共管理 {{ mindmaps.length }} 份导图文件，随时随地云端编辑与分享</p>
        </div>

        <div class="flex items-center flex-wrap gap-3">
          <!-- Search input -->
          <div class="relative">
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              v-model="searchQuery"
              @input="fetchMindmaps"
              type="text"
              placeholder="搜索思维导图..."
              class="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-60 shadow-2xs"
            />
          </div>

          <!-- Import Button -->
          <button
            @click="isImportModalOpen = true"
            class="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-medium transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <svg class="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span>导入文件</span>
          </button>

          <!-- Create Button -->
          <button
            @click="openCreateModal"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>新建脑图</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        <div v-for="i in 6" :key="i" class="h-48 bg-slate-200 rounded-2xl"></div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="mindmaps.length === 0"
        class="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center my-8 max-w-md mx-auto"
      >
        <div class="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </div>
        <h3 class="text-base font-semibold text-slate-800">还没有任何思维导图</h3>
        <p class="text-xs text-slate-500 mt-1 mb-6">点击下方按钮新建或导入已有脑图开始创作</p>
        <button
          @click="openCreateModal"
          class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-md transition-colors cursor-pointer"
        >
          立即新建第一份脑图
        </button>
      </div>

      <!-- Mindmaps Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="map in mindmaps"
          :key="map.id"
          class="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden"
        >
          <!-- Card Header & Status -->
          <div class="p-5 flex-1 cursor-pointer" @click="goToEditor(map.id)">
            <div class="flex items-start justify-between gap-3 mb-2">
              <h3 class="font-semibold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {{ map.title }}
              </h3>
              <!-- Share Badge -->
              <span
                v-if="map.is_shared"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
                title="公开分享已开启"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                已分享
              </span>
            </div>

            <p class="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
              {{ map.description || '暂无描述' }}
            </p>

            <div class="mt-4 flex items-center text-xs text-slate-400 gap-1">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>最后更新: {{ formatDate(map.updated_at) }}</span>
            </div>
          </div>

          <!-- Card Actions Footer -->
          <div class="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <button
              @click="goToEditor(map.id)"
              class="font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <span>进入画布</span>
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            <div class="flex items-center gap-1">
              <button
                @click.stop="openShare(map.id)"
                class="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
                title="分享链接设置"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </button>

              <button
                @click.stop="duplicateMindmap(map.id)"
                class="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-slate-800"
                title="创建副本"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>

              <button
                @click.stop="confirmDelete(map)"
                class="p-1.5 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-rose-600"
                title="删除脑图"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Mindmap Modal -->
    <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <h3 class="font-semibold text-lg text-slate-900 mb-4">新建思维导图</h3>
        <form @submit.prevent="handleCreate" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">脑图标题</label>
            <input
              v-model="newTitle"
              type="text"
              required
              placeholder="请输入脑图标题"
              class="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">描述 (可选)</label>
            <textarea
              v-model="newDescription"
              rows="3"
              placeholder="简要说明此脑图的主题或用途"
              class="w-full text-sm px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>
          <div class="pt-2 flex justify-end gap-2">
            <button
              type="button"
              @click="isCreateModalOpen = false"
              class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="!newTitle.trim() || isCreating"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <svg v-if="isCreating" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ isCreating ? '正在创建...' : '立即创建' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modals -->
    <ShareModal
      :isOpen="isShareModalOpen"
      :mindmapId="currentShareMindmapId"
      @close="closeShareModal"
    />

    <ImportModal
      :isOpen="isImportModalOpen"
      @close="isImportModalOpen = false"
      @imported="handleImported"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '../api';
import ShareModal from '../components/ShareModal.vue';
import ImportModal from '../components/ImportModal.vue';

const router = useRouter();
const authStore = useAuthStore();

const mindmaps = ref([]);
const loading = ref(true);
const searchQuery = ref('');

// Modals state
const isCreateModalOpen = ref(false);
const newTitle = ref('新建思维导图');
const newDescription = ref('');
const isCreating = ref(false);

const isShareModalOpen = ref(false);
const currentShareMindmapId = ref('');

const isImportModalOpen = ref(false);

const fetchMindmaps = async () => {
  try {
    const res = await api.get('/mindmaps', {
      params: { search: searchQuery.value }
    });
    mindmaps.value = res.data.mindmaps || [];
  } catch (err) {
    console.error('Failed to load mindmaps', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchMindmaps();
});

const openCreateModal = () => {
  newTitle.value = '新建思维导图';
  newDescription.value = '';
  isCreateModalOpen.value = true;
};

const handleCreate = async () => {
  if (!newTitle.value.trim() || isCreating.value) return;
  isCreating.value = true;
  try {
    const res = await api.post('/mindmaps', {
      title: newTitle.value.trim(),
      description: newDescription.value.trim()
    });
    isCreateModalOpen.value = false;
    const createdId = res.data?.mindmap?.id;
    if (createdId) {
      await router.push(`/mindmap/${createdId}`);
    } else {
      await fetchMindmaps();
    }
  } catch (err) {
    console.error('Failed to create mindmap', err);
    const msg = err.response?.data?.error || err.message || '创建思维导图失败';
    alert('创建失败: ' + msg);
  } finally {
    isCreating.value = false;
  }
};

const handleImported = async ({ title, data }) => {
  try {
    const res = await api.post('/mindmaps', {
      title,
      description: '导入自文件',
      content: data
    });
    const createdId = res.data?.mindmap?.id;
    if (createdId) {
      router.push(`/mindmap/${createdId}`);
    } else {
      fetchMindmaps();
    }
  } catch (err) {
    console.error('Failed to import mindmap', err);
    alert('导入脑图失败: ' + (err.response?.data?.error || err.message));
  }
};

const goToEditor = (id) => {
  router.push(`/mindmap/${id}`);
};

const openShare = (id) => {
  currentShareMindmapId.value = id;
  isShareModalOpen.value = true;
};

const closeShareModal = () => {
  isShareModalOpen.value = false;
  fetchMindmaps();
};

const duplicateMindmap = async (id) => {
  try {
    await api.post(`/mindmaps/${id}/duplicate`);
    fetchMindmaps();
  } catch (err) {
    console.error('Failed to duplicate mindmap', err);
  }
};

const confirmDelete = async (map) => {
  if (confirm(`确定要删除思维导图「${map.title}」吗？此操作无法撤销。`)) {
    try {
      await api.delete(`/mindmaps/${map.id}`);
      fetchMindmaps();
    } catch (err) {
      console.error('Failed to delete mindmap', err);
    }
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-slate-800 relative animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <h3 class="font-semibold text-lg text-slate-900">导入思维导图</h3>
        </div>
        <button @click="close" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="py-4 space-y-4">
        <!-- Tabs for File Upload or Markdown text -->
        <div class="flex border-b border-slate-200">
          <button
            @click="activeTab = 'file'"
            :class="['pb-2 px-3 text-sm font-medium border-b-2 cursor-pointer transition-colors', activeTab === 'file' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700']"
          >
            文件上传 (.json / .smm / .md)
          </button>
          <button
            @click="activeTab = 'markdown'"
            :class="['pb-2 px-3 text-sm font-medium border-b-2 cursor-pointer transition-colors', activeTab === 'markdown' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700']"
          >
            粘贴 Markdown 大纲
          </button>
        </div>

        <div v-if="activeTab === 'file'">
          <div
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
            :class="['border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all', isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50']"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".json,.smm,.md,.txt"
              @change="handleFileSelect"
              class="hidden"
            />
            <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            </div>
            <div class="font-medium text-sm text-slate-800">点击上传或将文件拖曳至此</div>
            <div class="text-xs text-slate-400 mt-1">支持 JSON、SMM 原生格式及 Markdown 文本文件</div>
          </div>
        </div>

        <div v-else class="space-y-3">
          <textarea
            v-model="rawMarkdown"
            rows="7"
            placeholder="# 中心主题&#10;## 分支 1&#10;### 子分支 1.1&#10;## 分支 2&#10;  - 详细要点 A&#10;  - 详细要点 B"
            class="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>
          <div class="text-xs text-slate-500">提示：支持使用 # 号标题或列表缩进方式的大纲文本。</div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span v-if="error" class="text-xs text-rose-500">{{ error }}</span>
        <div class="flex gap-2 ml-auto">
          <button
            @click="close"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            v-if="activeTab === 'markdown'"
            @click="importMarkdown"
            :disabled="!rawMarkdown.trim()"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            解析导入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { markdownToMindMap } from '../utils/mindmapHelper';

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(['close', 'imported']);

const activeTab = ref('file');
const isDragging = ref(false);
const fileInput = ref(null);
const rawMarkdown = ref('');
const error = ref('');

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleDrop = (e) => {
  isDragging.value = false;
  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    processFile(files[0]);
  }
};

const handleFileSelect = (e) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    processFile(files[0]);
  }
};

const processFile = (file) => {
  error.value = '';
  const reader = new FileReader();
  const filename = file.name;

  reader.onload = (e) => {
    try {
      const content = e.target.result;
      if (filename.endsWith('.json') || filename.endsWith('.smm')) {
        const parsed = JSON.parse(content);
        emit('imported', { title: filename.replace(/\.(json|smm)$/i, ''), data: parsed });
        close();
      } else if (filename.endsWith('.md') || filename.endsWith('.txt')) {
        const title = filename.replace(/\.(md|txt)$/i, '');
        const parsed = markdownToMindMap(content, title);
        emit('imported', { title, data: parsed });
        close();
      } else {
        error.value = '暂不支持该格式，请上传 .json, .smm 或 .md 文件';
      }
    } catch {
      error.value = '文件解析失败，请检查文件格式是否有效';
    }
  };

  reader.readAsText(file);
};

const importMarkdown = () => {
  if (!rawMarkdown.value.trim()) return;
  try {
    const parsed = markdownToMindMap(rawMarkdown.value);
    const title = parsed.root?.data?.text || '导入的思维导图';
    emit('imported', { title, data: parsed });
    rawMarkdown.value = '';
    close();
  } catch {
    error.value = 'Markdown 转换失败';
  }
};

const close = () => {
  error.value = '';
  emit('close');
};
</script>

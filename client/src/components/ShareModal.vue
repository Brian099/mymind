<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-800 relative animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </div>
          <h3 class="font-semibold text-lg text-slate-900">分享思维导图</h3>
        </div>
        <button @click="close" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="py-4 space-y-4">
        <!-- Enable Share Switch -->
        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <div class="font-medium text-sm text-slate-900">公开链接访问</div>
            <div class="text-xs text-slate-500">开启后任何人可通过专属链接免登录只读查看</div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="isEnabled" @change="saveConfig" class="sr-only peer">
            <div class="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div v-if="isEnabled" class="space-y-4 pt-1">
          <!-- Share Link Display -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">专属分享链接</label>
            <div class="flex items-center gap-2">
              <input
                type="text"
                readonly
                :value="shareUrl"
                class="w-full text-xs font-mono px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 select-all focus:outline-none"
              />
              <button
                @click="copyLink"
                class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-medium rounded-lg shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <svg v-if="copied" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>{{ copied ? '已复制' : '复制' }}</span>
              </button>
            </div>
          </div>

          <!-- Password Protection -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">访问密码保护 (可选)</label>
            <div class="flex items-center gap-2">
              <input
                v-model="password"
                type="text"
                placeholder="留空表示免密码直接查看"
                class="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                @click="saveConfig"
                class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg shrink-0 transition-colors cursor-pointer"
              >
                更新密码
              </button>
            </div>
          </div>

          <!-- Open in new tab -->
          <div class="pt-2 flex justify-end">
            <a
              :href="shareUrl"
              target="_blank"
              class="text-xs text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1 hover:underline"
            >
              <span>在新标签页打开预览</span>
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex justify-end">
        <button
          @click="close"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
        >
          完成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import api from '../api';

const props = defineProps({
  isOpen: Boolean,
  mindmapId: String,
});

const emit = defineEmits(['close']);

const isEnabled = ref(false);
const password = ref('');
const shareId = ref('');
const copied = ref(false);

const shareUrl = computed(() => {
  if (!shareId.value) return '';
  return `${window.location.origin}/share/${shareId.value}`;
});

watch(() => props.isOpen, async (val) => {
  if (val && props.mindmapId) {
    try {
      const res = await api.get(`/share/config/${props.mindmapId}`);
      if (res.data.share) {
        isEnabled.value = !!res.data.share.is_enabled;
        password.value = res.data.share.password || '';
        shareId.value = res.data.share.share_id || '';
      } else {
        isEnabled.value = false;
        password.value = '';
        shareId.value = '';
      }
    } catch (err) {
      console.error('Failed to load share settings', err);
    }
  }
});

const saveConfig = async () => {
  if (!props.mindmapId) return;
  try {
    const res = await api.post(`/share/config/${props.mindmapId}`, {
      is_enabled: isEnabled.value,
      password: password.value,
    });
    if (res.data.share) {
      shareId.value = res.data.share.share_id;
    }
  } catch (err) {
    console.error('Failed to save share settings', err);
  }
};

const copyLink = async () => {
  if (!shareUrl.value) return;
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = shareUrl.value;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};

const close = () => {
  emit('close');
};
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden select-none">
    <!-- Top Main Header -->
    <header class="h-13 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30 shrink-0 shadow-2xs">
      <!-- Left: Back & Title -->
      <div class="flex items-center gap-3 min-w-0">
        <button
          @click="goBack"
          class="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="返回工作台"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>

        <div class="flex items-center gap-2 min-w-0">
          <input
            v-model="title"
            @blur="handleTitleBlur"
            @keydown.enter="$event.target.blur()"
            type="text"
            class="font-semibold text-base text-slate-800 hover:bg-slate-50 focus:bg-white px-2 py-1 rounded-lg border border-transparent focus:border-indigo-400 focus:outline-none transition-all truncate max-w-xs sm:max-w-md"
            title="点击修改标题"
          />

          <!-- Save Status Badge -->
          <div class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/60 shrink-0">
            <span
              :class="[
                'w-2 h-2 rounded-full transition-colors',
                saveStatus === 'saving' ? 'bg-indigo-500 animate-pulse' :
                saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-500'
              ]"
            ></span>
            <span class="text-slate-500 font-medium">
              {{ saveStatus === 'saving' ? '正在保存...' : saveStatus === 'saved' ? '已自动保存' : '有未保存修改' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Action Buttons (Share, Export, Manual Save) -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Manual Save Button -->
        <button
          @click="saveMindMap"
          :disabled="saveStatus === 'saving'"
          class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
          title="手动保存 (Ctrl+S)"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span class="hidden sm:inline">保存</span>
        </button>

        <!-- Export Dropdown -->
        <div class="relative">
          <button
            @click="isExportMenuOpen = !isExportMenuOpen"
            class="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <svg class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>导出</span>
            <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          <!-- Export Menu Dropdown -->
          <div
            v-if="isExportMenuOpen"
            @click="isExportMenuOpen = false"
            class="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100"
          >
            <button @click="handleExport('png')" class="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>导出为 PNG 高清图片</span>
            </button>
            <button @click="handleExport('svg')" class="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
              <span class="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>导出为 SVG 矢量图</span>
            </button>
            <button @click="handleExport('pdf')" class="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
              <span class="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>导出为 PDF 文档</span>
            </button>
            <div class="h-px bg-slate-100 my-1"></div>
            <button @click="handleExport('md')" class="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
              <span class="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>导出为 Markdown 大纲</span>
            </button>
            <button @click="handleExport('json')" class="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 cursor-pointer">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>导出为 JSON 原生数据</span>
            </button>
          </div>
        </div>

        <!-- Share Button -->
        <button
          @click="isShareModalOpen = true"
          class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span>分享</span>
        </button>
      </div>
    </header>

    <!-- Full 15-Tool Classic Secondary Bar (Identical to reference screenshot) -->
    <div class="relative min-h-[64px] bg-white border-b border-slate-200/80 px-3 flex items-center justify-between z-20 shrink-0 select-none shadow-2xs gap-3">
      <!-- 15 Tools Group matching user screenshot with horizontal scroll on small screens -->
      <div class="flex items-center gap-0.5 sm:gap-1 overflow-x-auto py-1">
        <!-- 1. 回退 (Undo) -->
        <button
          @click="execNodeCommand('BACK')"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="回退 (Ctrl+Z)"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">回退</span>
        </button>

        <!-- 2. 前进 (Redo) -->
        <button
          @click="execNodeCommand('FORWARD')"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="前进 (Ctrl+Y)"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">前进</span>
        </button>

        <!-- 3. 格式刷 (Painter) -->
        <button
          @click="startPainter"
          :class="[
            'flex flex-col items-center justify-center px-1.5 py-1 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]',
            isPainterActive ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-700'
          ]"
          title="格式刷：先选中带样式的节点，点击后刷到其他节点"
        >
          <div :class="[
            'w-7 h-7 flex items-center justify-center rounded-lg border shadow-2xs transition-colors',
            isPainterActive ? 'border-indigo-500 bg-indigo-100/60 text-indigo-600 animate-pulse' : 'border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600'
          ]">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">格式刷</span>
        </button>

        <!-- 增加独立主题 (Add Independent Theme) -->
        <button
          @click="createFloatingTopic"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="增加独立主题：在画布上创建不连接中心节点的独立分支树（双击画布空白处也可就地创建）"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="11" height="8" rx="2"/><path d="M18 11v6"/><path d="M15 14h6"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">独立主题</span>
        </button>

        <!-- 4. 同级节点 (Sibling Node) -->
        <button
          @click="execNodeCommand('INSERT_NODE')"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="同级节点 (快捷键 Enter)"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 6.5h4"/><path d="M10 6.5v11h4"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">同级节点</span>
        </button>

        <!-- 5. 子节点 (Child Node) -->
        <button
          @click="execNodeCommand('INSERT_CHILD_NODE')"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="子节点 (快捷键 Tab)"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="8" height="7" rx="1.5"/><rect x="10" y="12" width="11" height="9" rx="1.5"/><path d="M7 10v4a2 2 0 0 0 2 2h1"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">子节点</span>
        </button>

        <!-- 6. 删除节点 (Delete Node) -->
        <button
          @click="execNodeCommand('REMOVE_NODE')"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-rose-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="删除节点 (快捷键 Delete)"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-rose-400 group-hover:text-rose-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-rose-600">删除节点</span>
        </button>

        <div class="h-8 w-px bg-slate-200/70 mx-0.5"></div>

        <!-- 7. 图片 (Image) -->
        <button
          @click="openImageModal"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="插入/修改节点图片"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">图片</span>
        </button>

        <!-- 8. 图标 (Icon) -->
        <button
          @click="openIconModal"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="设置节点图标/优先级"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">图标</span>
        </button>

        <!-- 9. 超链接 (Hyperlink) -->
        <button
          @click="openHyperlinkModal"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="设置节点超链接"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">超链接</span>
        </button>

        <!-- 10. 备注 (Note) -->
        <button
          @click="openNoteModal"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="设置节点详细备注"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">备注</span>
        </button>

        <!-- 11. 标签 (Tag) -->
        <button
          @click="openTagModal"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="设置节点标签"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">标签</span>
        </button>

        <!-- 12. 概要 (Generalization) -->
        <button
          @click="addGeneralization"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="添加概要：选中一个或多个同级节点"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">概要</span>
        </button>

        <!-- 13. 关联线 (Associative Line) -->
        <button
          @click="createAssociativeLine"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="关联线：选中起始节点，点击后连接到目标节点"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M5 8.5c0 4 6 5 7 7s5 2.5 7 2.5"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">关联线</span>
        </button>

        <!-- 14. 公式 (Formula) -->
        <button
          @click="openFormulaModal"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="插入数学公式 (LaTeX / KaTeX)"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 4H6l7 7-7 7h12"/><path d="m19 16 3 3"/><path d="m22 16-3 3"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">公式</span>
        </button>

        <!-- 15. 外框 (Outer Frame) -->
        <button
          @click="addOuterFrame"
          class="flex flex-col items-center justify-center px-1.5 py-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer select-none group min-w-[50px]"
          title="外框：选中子节点添加外框圈定"
        >
          <div class="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200/90 bg-white group-hover:border-indigo-400 group-hover:text-indigo-600 shadow-2xs transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="2" width="20" height="20" rx="3" stroke-dasharray="3 3"/><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </div>
          <span class="text-[11px] font-medium mt-1 text-slate-600 group-hover:text-slate-900">外框</span>
        </button>
      </div>

      <!-- Right Controls: Auto Align, Layout, Theme & Canvas Controls -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- 自动对齐 (Auto Align) Toggle Button -->
        <button
          @click="toggleAutoAlign"
          :class="[
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer border select-none',
            isAutoAlign
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium shadow-2xs'
              : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200/70'
          ]"
          title="自动对齐：开启时，将任意分支拖拽到较远空白处时将自动附带子节点并整齐排版成为新的独立主题"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="isAutoAlign ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'"></span>
          <span>自动对齐: {{ isAutoAlign ? '开' : '关' }}</span>
        </button>

        <!-- 一键整理布局 / 自动对齐 -->
        <button
          @click="resetLayoutAndAlign"
          class="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="一键整理布局 / 自动对齐所有节点"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
        </button>

        <div class="h-5 w-px bg-slate-200 mx-0.5"></div>

        <!-- Structure Layout Selector (结构: 逻辑结构图/思维导图/...) -->
        <div class="relative">
          <div class="flex items-center gap-1.5 text-xs">
            <span class="text-slate-400 hidden xl:inline">结构:</span>
            <button
              @click="toggleLayoutMenu"
              class="bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-700 py-1 px-2.5 rounded-lg flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
              title="切换思维导图布局结构"
            >
              <span class="font-medium text-slate-800">{{ currentLayoutName }}</span>
              <svg
                class="w-3 h-3 text-slate-400 transition-transform duration-200"
                :class="{ 'rotate-180': isLayoutMenuOpen }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>

          <!-- Backdrop to close on outside click -->
          <div
            v-if="isLayoutMenuOpen"
            @click="isLayoutMenuOpen = false"
            class="fixed inset-0 z-40"
          ></div>

          <!-- Structure Dropdown Menu -->
          <div
            v-if="isLayoutMenuOpen"
            class="absolute left-0 sm:right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 px-3 z-50 text-xs text-slate-700 space-y-1 animate-in fade-in zoom-in-95 duration-100"
          >
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-1">布局结构</span>
            <div class="space-y-1">
              <button
                v-for="item in LAYOUTS"
                :key="item.id"
                @click="selectLayout(item.id)"
                :class="[
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer text-left',
                  currentLayout === item.id
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-700 font-semibold shadow-2xs'
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                ]"
              >
                <div class="flex items-center gap-2">
                  <!-- Layout Icon -->
                  <svg v-if="item.id === 'logicalStructure'" class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 12h5m0 0v-5h9m-9 5v5h9"/>
                  </svg>
                  <svg v-else-if="item.id === 'mindMap'" class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 12h-4m0-4H3m5 8H3m8-4h4m0-4h5m-5 8h5"/>
                  </svg>
                  <svg v-else-if="item.id === 'organizationStructure'" class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 4v4m0 0H6v4m6-4h6v4"/>
                  </svg>
                  <svg v-else-if="item.id === 'catalogOrganization'" class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 6h16M4 12h12M4 18h8"/>
                  </svg>
                  <svg v-else-if="item.id === 'fishbone'" class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12h18M7 7l4 5-4 5M14 7l4 5-4 5"/>
                  </svg>
                  <svg v-else-if="item.id === 'timeline'" class="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 12h18M7 8v8M12 8v8M17 8v8"/>
                  </svg>
                  <span class="text-xs">{{ item.name }}</span>
                </div>
                <svg v-if="currentLayout === item.id" class="w-4 h-4 text-indigo-600 shrink-0 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Theme Selector (主题: 经典商务/雅致咖啡/...) -->
        <div class="relative">
          <div class="flex items-center gap-1.5 text-xs">
            <span class="text-slate-400 hidden xl:inline">主题:</span>
            <button
              @click="toggleThemeMenu"
              class="bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-700 py-1 px-2.5 rounded-lg flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
              title="切换思维导图主题配色"
            >
              <span class="font-medium text-slate-800">{{ currentThemeName }}</span>
              <svg
                class="w-3 h-3 text-slate-400 transition-transform duration-200"
                :class="{ 'rotate-180': isThemeMenuOpen }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>

          <!-- Backdrop to close on outside click -->
          <div
            v-if="isThemeMenuOpen"
            @click="isThemeMenuOpen = false"
            class="fixed inset-0 z-40"
          ></div>

          <!-- Theme Dropdown Menu -->
          <div
            v-if="isThemeMenuOpen"
            class="absolute left-0 sm:right-0 top-full mt-2 w-64 max-h-[380px] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 px-3 z-50 text-xs text-slate-700 space-y-1 animate-in fade-in zoom-in-95 duration-100"
          >
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-1">主题预设</span>
            <div class="space-y-1">
              <button
                v-for="item in THEMES"
                :key="item.id"
                @click="selectTheme(item.id)"
                :class="[
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer text-left',
                  currentTheme === item.id
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-700 font-semibold shadow-2xs'
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                ]"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-2xs shrink-0"
                    :style="{ backgroundColor: getThemeColorPreview(item.id) }"
                  ></span>
                  <span class="text-xs truncate">{{ item.name }}</span>
                </div>
                <svg v-if="currentTheme === item.id" class="w-4 h-4 text-indigo-600 shrink-0 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Line Style Selector (风格: 曲线/折线/直线) -->
        <div class="relative">
          <div class="flex items-center gap-1.5 text-xs">
            <span class="text-slate-400 hidden xl:inline">风格:</span>
            <button
              @click="toggleLineStyleMenu"
              class="bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-700 py-1 px-2.5 rounded-lg flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
              title="设置连线风格（曲线/折线/直线）"
            >
              <span class="font-medium text-slate-800">{{ currentLineStyleName }}</span>
              <svg
                class="w-3 h-3 text-slate-400 transition-transform duration-200"
                :class="{ 'rotate-180': isLineStyleMenuOpen }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>

          <!-- Backdrop to close on outside click -->
          <div
            v-if="isLineStyleMenuOpen"
            @click="isLineStyleMenuOpen = false"
            class="fixed inset-0 z-40"
          ></div>

          <!-- Line Style Dropdown Menu (matching user screenshot) -->
          <div
            v-if="isLineStyleMenuOpen"
            class="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 px-3.5 z-50 text-xs text-slate-700 space-y-3 animate-in fade-in zoom-in-95 duration-100"
          >
            <!-- 3 Visual Style Options -->
            <div>
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-1">连线风格</span>
              <div class="space-y-1">
                <!-- 折线 (straight) -->
                <button
                  @click="changeLineStyle('straight')"
                  :class="[
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer',
                    currentLineStyle === 'straight'
                      ? 'border-indigo-500 bg-indigo-50/70 text-indigo-700 font-semibold shadow-2xs'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                  ]"
                >
                  <span class="text-xs">折线 (直角)</span>
                  <svg class="w-7 h-7" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M 6 20 H 20 V 9 H 34 M 20 20 V 31 H 34" />
                  </svg>
                </button>

                <!-- 曲线 (curve) -->
                <button
                  @click="changeLineStyle('curve')"
                  :class="[
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer',
                    currentLineStyle === 'curve'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-700 font-semibold shadow-2xs'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                  ]"
                >
                  <span class="text-xs">曲线 (圆润)</span>
                  <svg class="w-7 h-7 text-blue-500" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <path d="M 6 20 C 14 20 18 9 34 9 M 6 20 C 14 20 18 31 34 31" />
                  </svg>
                </button>

                <!-- 直线 (direct) -->
                <button
                  @click="changeLineStyle('direct')"
                  :class="[
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer',
                    currentLineStyle === 'direct'
                      ? 'border-indigo-500 bg-indigo-50/70 text-indigo-700 font-semibold shadow-2xs'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                  ]"
                >
                  <span class="text-xs">直线 (直连)</span>
                  <svg class="w-7 h-7" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <path d="M 6 20 L 34 9 M 6 20 L 34 31" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Advanced Toggles matching user screenshot -->
            <div class="pt-2 border-t border-slate-100 space-y-2 px-1">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  v-model="rootLineKeepSame"
                  @change="toggleRootLineKeepSame"
                  class="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span class="text-[11px] text-slate-600">根节点连线保持一致</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  v-model="nodeUseLineStyle"
                  @change="toggleNodeUseLineStyle"
                  class="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span class="text-[11px] text-slate-600">节点仅底边横线</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  v-model="isRainbowLines"
                  @change="toggleRainbowLines"
                  class="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span class="text-[11px] text-slate-600 flex items-center gap-1.5">
                  <span>彩虹线条</span>
                  <span class="text-[9px] px-1 py-0.2 bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-500 text-white rounded font-bold">新</span>
                </span>
              </label>
            </div>

            <!-- 概要样式 (Generalization Style) -->
            <div class="pt-2.5 border-t border-slate-100">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-1">概要样式</span>
              <div class="grid grid-cols-2 gap-1.5">
                <!-- 大括号样式 (bracket) -->
                <button
                  @click="changeGeneralizationStyle('bracket')"
                  :class="[
                    'flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer text-center group',
                    currentGeneralizationStyle === 'bracket'
                      ? 'border-indigo-500 bg-indigo-50/80 text-indigo-700 font-semibold shadow-2xs'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                  ]"
                  title="大括号样式：虚线引导线 + 经典大括弧"
                >
                  <svg class="w-6 h-6 mb-1 text-current" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M 12 6 Q 16 6 16 10 L 16 13 Q 16 16 19 16 Q 16 16 16 19 L 16 22 Q 16 26 12 26" />
                    <rect x="22" y="11.5" width="7" height="9" rx="2" />
                    <line x1="3" y1="9" x2="8" y2="9" stroke-dasharray="1.5 1.5" opacity="0.6"/>
                    <line x1="3" y1="23" x2="8" y2="23" stroke-dasharray="1.5 1.5" opacity="0.6"/>
                  </svg>
                  <span class="text-[11px]">大括号样式</span>
                </button>

                <!-- 连线样式 (line) -->
                <button
                  @click="changeGeneralizationStyle('line')"
                  :class="[
                    'flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all cursor-pointer text-center group',
                    currentGeneralizationStyle === 'line'
                      ? 'border-indigo-500 bg-indigo-50/80 text-indigo-700 font-semibold shadow-2xs'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                  ]"
                  title="连线样式：多节点平滑曲线汇聚到概要文本框（各组专属颜色）"
                >
                  <svg class="w-6 h-6 mb-1 text-current" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                    <path d="M 6 8 C 14 8 15 16 22 16" />
                    <path d="M 6 16 L 22 16" />
                    <path d="M 6 24 C 14 24 15 16 22 16" />
                    <rect x="22" y="11.5" width="7" height="9" rx="2" />
                  </svg>
                  <span class="text-[11px]">连线样式</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="h-6 w-px bg-slate-200 mx-0.5"></div>

        <!-- Zoom / Fit Canvas -->
        <div class="flex items-center gap-1">
          <button
            @click="zoomIn"
            class="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="放大画布"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button
            @click="zoomOut"
            class="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="缩小画布"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <button
            @click="fitView"
            class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer text-xs font-medium"
            title="居中适应画布"
          >
            适应
          </button>
        </div>
      </div>
    </div>

    <!-- Main Canvas Viewport -->
    <div class="flex-1 w-full h-full relative overflow-hidden bg-slate-50">
      <div ref="mindMapContainer" @dblclick="handleCanvasDblClick" class="w-full h-full"></div>

      <!-- Floating Notification / Status Toast -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-2 opacity-0 scale-95"
        enter-to-class="translate-y-0 opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100 scale-100"
        leave-to-class="translate-y-2 opacity-0 scale-95"
      >
        <div
          v-if="toast.show"
          :class="[
            'absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl shadow-lg border text-xs font-medium flex items-center gap-2 backdrop-blur-md',
            toast.type === 'warning' ? 'bg-amber-50/95 text-amber-800 border-amber-200/80 shadow-amber-500/10' :
            toast.type === 'success' ? 'bg-emerald-50/95 text-emerald-800 border-emerald-200/80 shadow-emerald-500/10' :
            'bg-slate-900/90 text-white border-slate-700 shadow-slate-900/20'
          ]"
        >
          <span>{{ toast.message }}</span>
          <button @click="toast.show = false" class="text-slate-400 hover:text-slate-200 ml-1">✕</button>
        </div>
      </transition>
    </div>

    <!-- Share Modal -->
    <ShareModal
      :isOpen="isShareModalOpen"
      :mindmapId="mindmapId"
      @close="isShareModalOpen = false"
    />

    <!-- 7. Image Modal -->
    <div v-if="isImageModalOpen" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
            <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">🖼️</span>
            <span>节点图片设置</span>
          </h3>
          <button @click="isImageModalOpen = false" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <div class="py-4 space-y-4">
          <!-- Upload local file -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">本地上传图片</label>
            <input
              type="file"
              accept="image/*"
              @change="handleLocalImageUpload"
              class="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
          </div>

          <!-- Or enter URL -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">或输入图片网络链接 (URL)</label>
            <input
              v-model="currentImage"
              type="url"
              placeholder="https://example.com/pic.jpg"
              class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <!-- Preview if any -->
          <div v-if="currentImage" class="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <img :src="currentImage" class="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 bg-white" alt="预览" />
            <div class="min-w-0 text-xs text-slate-500 space-y-1">
              <p class="font-medium text-slate-700">图片预览</p>
              <p class="text-[11px] truncate">点击确定即可插入节点</p>
            </div>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">图片提示文本 (可选)</label>
            <input
              v-model="currentImageTitle"
              type="text"
              placeholder="鼠标悬停提示文本"
              class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <button
            v-if="hasExistingImage"
            @click="removeImage"
            type="button"
            class="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1.5 rounded-lg hover:bg-rose-50"
          >
            移除现有图片
          </button>
          <div v-else></div>

          <div class="flex items-center gap-2">
            <button
              @click="isImageModalOpen = false"
              type="button"
              class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              @click="confirmImage"
              type="button"
              class="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
            >
              确定插入
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 8. Icon Modal -->
    <div v-if="isIconModalOpen" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
            <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">😀</span>
            <span>节点图标与优先级</span>
          </h3>
          <button @click="isIconModalOpen = false" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <!-- Category Tabs -->
        <div class="flex gap-2 pt-3 pb-2 border-b border-slate-100 text-xs">
          <button
            v-for="cat in iconCategories"
            :key="cat.type"
            @click="activeIconTab = cat.type"
            :class="[
              'px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer',
              activeIconTab === cat.type ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            ]"
          >
            {{ cat.name }}
          </button>
        </div>

        <!-- Icon Grid -->
        <div class="py-4 max-h-64 overflow-y-auto">
          <div class="grid grid-cols-6 sm:grid-cols-8 gap-2.5">
            <button
              v-for="item in currentCategoryIcons"
              :key="item.key"
              @click="toggleIcon(item.key)"
              :class="[
                'p-2.5 rounded-2xl border flex items-center justify-center transition-all cursor-pointer hover:scale-110',
                currentNodeIcons.includes(item.key)
                  ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-400/40'
                  : 'border-slate-100 hover:border-indigo-300 hover:bg-slate-50'
              ]"
              :title="item.key"
            >
              <div v-html="item.icon" class="w-6 h-6 flex items-center justify-center"></div>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            @click="clearNodeIcons"
            class="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1.5 rounded-lg hover:bg-rose-50"
          >
            清空节点图标
          </button>
          <button
            @click="isIconModalOpen = false"
            class="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20"
          >
            完成
          </button>
        </div>
      </div>
    </div>

    <!-- 9. Hyperlink Modal -->
    <div v-if="isHyperlinkModalOpen" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
            <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">🔗</span>
            <span>节点超链接设置</span>
          </h3>
          <button @click="isHyperlinkModalOpen = false" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <div class="py-4 space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">跳转网址 (URL)</label>
            <input
              v-model="hyperlinkUrl"
              type="text"
              placeholder="https://example.com"
              class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">提示文本 (Tooltip，可选)</label>
            <input
              v-model="hyperlinkTitle"
              type="text"
              placeholder="链接显示名称或说明"
              class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            @click="removeHyperlink"
            class="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1.5 rounded-lg hover:bg-rose-50"
          >
            移除链接
          </button>
          <div class="flex items-center gap-2">
            <button
              @click="isHyperlinkModalOpen = false"
              class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              取消
            </button>
            <button
              @click="confirmHyperlink"
              class="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20"
            >
              保存链接
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 10. Note Modal -->
    <div v-if="isNoteModalOpen" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
            <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">📝</span>
            <span>编辑节点备注</span>
          </h3>
          <button @click="isNoteModalOpen = false" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <div class="py-4">
          <textarea
            v-model="noteContent"
            rows="6"
            placeholder="支持多行备注文本记录，悬停或点击节点图标可查看..."
            class="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
          ></textarea>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            @click="clearNote"
            class="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1.5 rounded-lg hover:bg-rose-50"
          >
            清空备注
          </button>
          <div class="flex items-center gap-2">
            <button
              @click="isNoteModalOpen = false"
              class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              取消
            </button>
            <button
              @click="confirmNote"
              class="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20"
            >
              保存备注
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 11. Tag Modal -->
    <div v-if="isTagModalOpen" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
            <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">🏷️</span>
            <span>设置节点标签</span>
          </h3>
          <button @click="isTagModalOpen = false" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <div class="py-4 space-y-3.5">
          <!-- Existing tags -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-2">当前标签</label>
            <div class="flex flex-wrap gap-2 min-h-[36px] p-2.5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span
                v-for="(tag, idx) in nodeTags"
                :key="idx"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-indigo-500 text-white font-medium shadow-2xs"
              >
                <span>{{ tag }}</span>
                <button @click="removeTag(idx)" class="hover:text-indigo-200 ml-0.5">✕</button>
              </span>
              <span v-if="nodeTags.length === 0" class="text-xs text-slate-400 py-0.5">暂无标签</span>
            </div>
          </div>

          <!-- Add new tag -->
          <div class="flex gap-2">
            <input
              v-model="newTagInput"
              @keydown.enter.prevent="addTag()"
              type="text"
              placeholder="输入标签名称后回车"
              class="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              @click="addTag()"
              class="px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-xl"
            >
              添加
            </button>
          </div>

          <!-- Quick tag suggestions -->
          <div>
            <span class="text-[11px] text-slate-400 mb-1.5 block">快捷推荐:</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="p in ['重要', '紧急', '待办', '已完成', '跟进中', '重点关注']"
                :key="p"
                @click="addTag(p)"
                class="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg text-xs transition-colors"
              >
                + {{ p }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            @click="isTagModalOpen = false"
            class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            取消
          </button>
          <button
            @click="confirmTags"
            class="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20"
          >
            保存标签
          </button>
        </div>
      </div>
    </div>

    <!-- 14. Formula Modal -->
    <div v-if="isFormulaModalOpen" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
            <span class="p-2 bg-indigo-50 text-indigo-600 rounded-xl">∑</span>
            <span>插入数学公式 (LaTeX)</span>
          </h3>
          <button @click="isFormulaModalOpen = false" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <div class="py-4 space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5">LaTeX 公式代码</label>
            <textarea
              v-model="formulaInput"
              rows="3"
              placeholder="例如: E = mc^2 或 x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono resize-none"
            ></textarea>
          </div>

          <!-- Quick formula templates -->
          <div>
            <span class="text-[11px] text-slate-400 mb-1.5 block">常用模板:</span>
            <div class="flex flex-wrap gap-1.5 text-xs">
              <button
                @click="formulaInput = 'E = mc^2'"
                class="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg"
              >
                E=mc²
              </button>
              <button
                @click="formulaInput = '\\frac{a}{b}'"
                class="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg font-mono"
              >
                \frac{a}{b}
              </button>
              <button
                @click="formulaInput = '\\sqrt{x}'"
                class="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg font-mono"
              >
                \sqrt{x}
              </button>
              <button
                @click="formulaInput = '\\sum_{i=1}^{n} x_i'"
                class="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg font-mono"
              >
                \sum x_i
              </button>
              <button
                @click="formulaInput = '\\int_{a}^{b} f(x)dx'"
                class="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg font-mono"
              >
                \int f(x)
              </button>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            @click="isFormulaModalOpen = false"
            class="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            取消
          </button>
          <button
            @click="confirmFormula"
            class="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20"
          >
            插入公式
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MindMap from 'simple-mind-map';
import Themes from 'simple-mind-map-plugin-themes';
import ExportPlugin from 'simple-mind-map/src/plugins/Export.js';
import DragPlugin from 'simple-mind-map/src/plugins/Drag.js';
import SelectPlugin from 'simple-mind-map/src/plugins/Select.js';
import AssociativeLinePlugin from 'simple-mind-map/src/plugins/AssociativeLine.js';
import OuterFramePlugin from 'simple-mind-map/src/plugins/OuterFrame.js';
import PainterPlugin from 'simple-mind-map/src/plugins/Painter.js';
import RichTextPlugin from 'simple-mind-map/src/plugins/RichText.js';
import FormulaPlugin from 'simple-mind-map/src/plugins/Formula.js';
import NodeImgAdjustPlugin from 'simple-mind-map/src/plugins/NodeImgAdjust.js';
import RainbowLinesPlugin from 'simple-mind-map/src/plugins/RainbowLines.js';
import icons from 'simple-mind-map/src/svg/icons.js';
import 'katex/dist/katex.min.css';
import api from '../api';
import { THEMES, LAYOUTS } from '../utils/mindmapHelper';
import { setupCurlyGeneralization } from '../utils/curlyGeneralization';
import ShareModal from '../components/ShareModal.vue';

// Initialize full theme preset library
Themes.init(MindMap);

// Initialize mathematical curly bracket '}' generalization line style
setupCurlyGeneralization();

// Register plugins for full capabilities
MindMap.usePlugin(ExportPlugin);
MindMap.usePlugin(DragPlugin);
MindMap.usePlugin(SelectPlugin);
MindMap.usePlugin(AssociativeLinePlugin);
MindMap.usePlugin(OuterFramePlugin);
MindMap.usePlugin(PainterPlugin);
MindMap.usePlugin(RichTextPlugin);
MindMap.usePlugin(FormulaPlugin);
MindMap.usePlugin(NodeImgAdjustPlugin);
MindMap.usePlugin(RainbowLinesPlugin);

const route = useRoute();
const router = useRouter();
const mindmapId = route.params.id;

const mindMapContainer = ref(null);
let mindMapInstance = null;

const title = ref('思维导图');
const description = ref('');
const currentTheme = ref('classic4');
const currentLayout = ref('logicalStructure');
const saveStatus = ref('saved'); // 'saved', 'saving', 'unsaved'
const isExportMenuOpen = ref(false);
const isShareModalOpen = ref(false);
const isPainterActive = ref(false);

// Auto-align & Floating Topic states
const isAutoAlign = ref(true);

const toggleAutoAlign = () => {
  isAutoAlign.value = !isAutoAlign.value;
  showToast(
    isAutoAlign.value
      ? '已开启【自动对齐】：拖拽任意分支至空白区域将自动附带子节点并整齐排版为独立新主题'
      : '已关闭【自动对齐】：节点拖拽为普通自由偏移模式',
    'info'
  );
};

const clearChildrenCustomPositions = (node) => {
  if (!node || !node.children) return;
  node.children.forEach(child => {
    mindMapInstance.execCommand('SET_NODE_DATA', child, {
      customLeft: undefined,
      customTop: undefined
    });
    clearChildrenCustomPositions(child);
  });
};

const createFloatingTopicAt = (canvasX, canvasY, text = '独立主题') => {
  if (!mindMapInstance) return;
  const root = mindMapInstance.renderer.root;
  if (!root) return;
  mindMapInstance.execCommand('INSERT_CHILD_NODE', false, [root], {
    text: text,
    customLeft: canvasX,
    customTop: canvasY,
    isFloating: true,
    fontSize: 18,
    fontWeight: 'bold'
  });
  mindMapInstance.render();
  showToast('已新建独立主题，可自由拖拽或按 Tab 添加子分支', 'success');
  triggerAutoSave();
};

const createFloatingTopic = () => {
  if (!mindMapInstance) return;
  const transform = mindMapInstance.draw.transform();
  const width = mindMapInstance.width;
  const height = mindMapInstance.height;
  const canvasCenterX = (width / 2 - transform.translateX) / transform.scaleX;
  const canvasCenterY = (height / 2 - transform.translateY) / transform.scaleY;
  createFloatingTopicAt(canvasCenterX + (Math.random() * 80 - 40), canvasCenterY + 120, '独立新主题');
};

const handleCanvasDblClick = (e) => {
  if (
    e.target.closest('.smm-node') ||
    e.target.closest('button') ||
    e.target.closest('input') ||
    e.target.closest('select')
  ) {
    return;
  }
  if (!mindMapInstance) return;
  const { x, y } = mindMapInstance.toPos(e.clientX, e.clientY);
  const transform = mindMapInstance.draw.transform();
  const canvasX = (x - transform.translateX) / transform.scaleX;
  const canvasY = (y - transform.translateY) / transform.scaleY;
  createFloatingTopicAt(canvasX, canvasY, '独立主题');
};

const resetLayoutAndAlign = () => {
  if (!mindMapInstance) return;
  mindMapInstance.renderer.resetLayout();
  showToast('已一键自动对齐并整理布局', 'success');
  triggerAutoSave();
};

// Dropdown menus states & handlers (布局结构 / 主题预设 / 连线风格)
const isLayoutMenuOpen = ref(false);
const isThemeMenuOpen = ref(false);
const isLineStyleMenuOpen = ref(false);

const toggleLayoutMenu = () => {
  isLayoutMenuOpen.value = !isLayoutMenuOpen.value;
  if (isLayoutMenuOpen.value) {
    isThemeMenuOpen.value = false;
    isLineStyleMenuOpen.value = false;
  }
};

const toggleThemeMenu = () => {
  isThemeMenuOpen.value = !isThemeMenuOpen.value;
  if (isThemeMenuOpen.value) {
    isLayoutMenuOpen.value = false;
    isLineStyleMenuOpen.value = false;
  }
};

const toggleLineStyleMenu = () => {
  isLineStyleMenuOpen.value = !isLineStyleMenuOpen.value;
  if (isLineStyleMenuOpen.value) {
    isLayoutMenuOpen.value = false;
    isThemeMenuOpen.value = false;
  }
};

const currentLayoutName = computed(() => {
  const item = LAYOUTS.find(l => l.id === currentLayout.value);
  return item ? item.name : '逻辑结构图';
});

const currentThemeName = computed(() => {
  const item = THEMES.find(t => (t.id || t.value) === currentTheme.value);
  return item ? item.name : '经典商务';
});

const selectLayout = (layoutId) => {
  currentLayout.value = layoutId;
  changeLayout();
  isLayoutMenuOpen.value = false;
  showToast(`已切换布局为【${currentLayoutName.value}】`, 'info');
};

const selectTheme = (themeId) => {
  currentTheme.value = themeId;
  changeTheme();
  isThemeMenuOpen.value = false;
  showToast(`已切换主题为【${currentThemeName.value}】`, 'info');
};

const getThemeColorPreview = (id) => {
  const map = {
    classic4: '#2563eb',
    classic2: '#10b981',
    classic3: '#f97316',
    classicBlue: '#0284c7',
    freshGreen: '#16a34a',
    romanticPurple: '#9333ea',
    gold: '#ca8a04',
    coffee: '#854d0e',
    avocado: '#84cc16',
    dark: '#334155',
    dark2: '#0f172a',
    blackGold: '#1e293b',
    default: '#64748b'
  };
  return map[id] || '#6366f1';
};

// Line Style states (曲线 / 折线 / 直线)
const currentLineStyle = ref('straight');
const rootLineKeepSame = ref(true);
const nodeUseLineStyle = ref(false);
const isRainbowLines = ref(false);

// Generalization Style states ('line' 连线样式 / 'bracket' 大括号样式)
const currentGeneralizationStyle = ref('line');

const currentLineStyleName = computed(() => {
  if (currentLineStyle.value === 'curve') return '曲线';
  if (currentLineStyle.value === 'direct') return '直线';
  return '折线';
});

const applyThemeCardStyles = () => {
  if (!mindMapInstance) return;
  const currentConfig = mindMapInstance.getCustomThemeConfig() || {};
  const themeName = currentTheme.value;
  const themeItem = THEMES.find(t => (t.id || t.value) === themeName);
  const isDark = themeItem ? themeItem.dark : false;

  const bg = currentConfig.backgroundColor || mindMapInstance.getThemeConfig('backgroundColor') || '#ffffff';
  const lineColor = currentConfig.lineColor || mindMapInstance.getThemeConfig('lineColor') || (isDark ? '#94a3b8' : '#334155');

  const rootConfig = {
    ...(mindMapInstance.getThemeConfig('root') || {}),
    ...(currentConfig.root || {})
  };
  const secondConfig = {
    ...(mindMapInstance.getThemeConfig('second') || {}),
    ...(currentConfig.second || {})
  };
  const nodeConfig = {
    ...(mindMapInstance.getThemeConfig('node') || {}),
    ...(currentConfig.node || {})
  };

  // 1. Root: ensure background fill, border, radius, padding
  if (!rootConfig.borderWidth || rootConfig.borderWidth <= 0) rootConfig.borderWidth = 2;
  if (!rootConfig.borderColor || rootConfig.borderColor === 'transparent') {
    rootConfig.borderColor = lineColor;
  }
  if (!rootConfig.borderRadius) rootConfig.borderRadius = 10;
  if (!rootConfig.paddingX) rootConfig.paddingX = 20;
  if (!rootConfig.paddingY) rootConfig.paddingY = 10;

  // 2. Second level: ensure background fill, border, radius, padding
  if (!secondConfig.fillColor || secondConfig.fillColor === 'transparent') {
    secondConfig.fillColor = isDark ? '#1e293b' : '#ffffff';
  }
  if (!secondConfig.borderColor || secondConfig.borderColor === 'transparent') {
    secondConfig.borderColor = lineColor;
  }
  if (!secondConfig.borderWidth || secondConfig.borderWidth <= 0) secondConfig.borderWidth = 1.5;
  if (!secondConfig.borderRadius) secondConfig.borderRadius = 8;
  if (!secondConfig.paddingX) secondConfig.paddingX = 14;
  if (!secondConfig.paddingY) secondConfig.paddingY = 6;

  // 3. Level 3 and all deeper nodes: ensure card fill, border, radius, padding (拒绝只有文字!)
  if (!nodeConfig.fillColor || nodeConfig.fillColor === 'transparent') {
    nodeConfig.fillColor = isDark ? '#1e293b' : '#ffffff';
  }
  if (!nodeConfig.borderColor || nodeConfig.borderColor === 'transparent') {
    nodeConfig.borderColor = secondConfig.borderColor || lineColor || (isDark ? '#475569' : '#cbd5e1');
  }
  if (!nodeConfig.borderWidth || nodeConfig.borderWidth <= 0) nodeConfig.borderWidth = 1;
  if (!nodeConfig.borderRadius) nodeConfig.borderRadius = 6;
  if (!nodeConfig.paddingX || nodeConfig.paddingX < 10) nodeConfig.paddingX = 12;
  if (!nodeConfig.paddingY || nodeConfig.paddingY < 4) nodeConfig.paddingY = 5;
  if (!nodeConfig.color) nodeConfig.color = isDark ? '#f1f5f9' : '#1e293b';

  // Remove any level-specific lineStyle so global themeConfig.lineStyle takes effect
  delete rootConfig.lineStyle;
  delete secondConfig.lineStyle;
  delete nodeConfig.lineStyle;

  const updatedConfig = {
    ...currentConfig,
    lineStyle: currentLineStyle.value,
    generalizationStyle: currentGeneralizationStyle.value,
    nodeUseLineStyle: false,
    rootLineKeepSameInCurve: rootLineKeepSame.value,
    rootLineStartPositionKeepSameInCurve: rootLineKeepSame.value,
    generalizationLineWidth: 2,
    generalizationLineMargin: 6,
    generalizationNodeMargin: 28,
    root: rootConfig,
    second: secondConfig,
    node: nodeConfig
  };

  mindMapInstance.setThemeConfig(updatedConfig);
  mindMapInstance.reRender();
};

const changeGeneralizationStyle = (style) => {
  currentGeneralizationStyle.value = style;
  if (!mindMapInstance) return;
  const activeNode = getActiveNode();
  if (activeNode && activeNode.isGeneralization) {
    activeNode.setData({ generalizationStyle: style });
  }
  applyThemeCardStyles();
  triggerAutoSave();
  showToast(`已切换概要样式为【${style === 'line' ? '连线样式' : '大括号样式'}】`, 'success');
};

const changeLineStyle = (style) => {
  currentLineStyle.value = style;
  isLineStyleMenuOpen.value = false;
  if (!mindMapInstance) return;

  // Clear any individual node lineStyle overrides across the tree
  const clearNodeLineStyle = (node) => {
    if (!node) return;
    if (node.getData && node.getData('lineStyle') !== undefined) {
      node.setData({ lineStyle: undefined });
    }
    if (node.nodeData && node.nodeData.data && node.nodeData.data.lineStyle !== undefined) {
      delete node.nodeData.data.lineStyle;
    }
    if (node.children && node.children.length) {
      node.children.forEach(clearNodeLineStyle);
    }
  };
  clearNodeLineStyle(mindMapInstance.renderer.root);

  applyThemeCardStyles();
  triggerAutoSave();
  showToast(`已切换为【${style === 'curve' ? '曲线' : style === 'straight' ? '折线' : '直线'}】风格`, 'success');
};

const toggleRootLineKeepSame = () => {
  if (!mindMapInstance) return;
  applyThemeCardStyles();
  triggerAutoSave();
};

const toggleNodeUseLineStyle = () => {
  if (!mindMapInstance) return;
  nodeUseLineStyle.value = false;
  applyThemeCardStyles();
  showToast('所有节点均已保持卡片底纹与描边形态', 'info');
  triggerAutoSave();
};

const toggleRainbowLines = () => {
  if (!mindMapInstance || !mindMapInstance.rainbowLines) return;
  mindMapInstance.rainbowLines.updateRainLinesConfig({ open: isRainbowLines.value });
  triggerAutoSave();
  showToast(isRainbowLines.value ? '已开启彩虹分枝线条' : '已关闭彩虹分枝线条', 'info');
};

// Toast banner helper
const toast = ref({
  show: false,
  message: '',
  type: 'info',
  timer: null
});

const showToast = (message, type = 'info') => {
  if (toast.value.timer) clearTimeout(toast.value.timer);
  toast.value = {
    show: true,
    message,
    type,
    timer: setTimeout(() => {
      toast.value.show = false;
    }, 3500)
  };
};

// Helper: Active Node extraction
const getActiveNode = () => {
  if (!mindMapInstance) return null;
  const list = mindMapInstance.renderer.activeNodeList;
  return list && list.length > 0 ? list[0] : null;
};

const getActiveNodeList = () => {
  if (!mindMapInstance) return [];
  return mindMapInstance.renderer.activeNodeList || [];
};

// ============================================
// 15 Tool Dialog States & Handlers
// ============================================

// 3. 格式刷 (Painter)
const startPainter = () => {
  const node = getActiveNode();
  if (!node) {
    showToast('请先选中一个带样式的节点作为模板', 'warning');
    return;
  }
  isPainterActive.value = true;
  mindMapInstance.painter.startPainter();
  showToast('格式刷已激活：请点击目标节点应用样式', 'info');
};

// 7. 图片 (Image) Modal
const isImageModalOpen = ref(false);
const currentImage = ref('');
const currentImageTitle = ref('');
const currentImageWidth = ref(120);
const currentImageHeight = ref(120);
const hasExistingImage = ref(false);

const openImageModal = () => {
  const node = getActiveNode();
  if (!node) {
    showToast('请先选中需要添加图片的节点', 'warning');
    return;
  }
  const img = node.getData('image') || '';
  currentImage.value = img;
  hasExistingImage.value = !!img;
  currentImageTitle.value = node.getData('imageTitle') || '';
  const size = node.getData('imageSize') || {};
  currentImageWidth.value = size.width || 120;
  currentImageHeight.value = size.height || 120;
  isImageModalOpen.value = true;
};

const handleLocalImageUpload = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    currentImage.value = evt.target.result;
  };
  reader.readAsDataURL(file);
};

const confirmImage = () => {
  const node = getActiveNode();
  if (!node) return;
  if (!currentImage.value) {
    showToast('请上传或输入图片链接', 'warning');
    return;
  }
  mindMapInstance.execCommand('SET_NODE_IMAGE', node, {
    url: currentImage.value,
    title: currentImageTitle.value,
    width: currentImageWidth.value || 120,
    height: currentImageHeight.value || 120,
    custom: false
  });
  isImageModalOpen.value = false;
  showToast('图片已设置', 'success');
};

const removeImage = () => {
  const node = getActiveNode();
  if (!node) return;
  mindMapInstance.execCommand('SET_NODE_IMAGE', node, { url: '', title: '', width: 0, height: 0 });
  isImageModalOpen.value = false;
  showToast('已移除节点图片', 'success');
};

// 8. 图标 (Icon) Modal
const isIconModalOpen = ref(false);
const activeIconTab = ref('priority');
const currentNodeIcons = ref([]);

const iconCategories = [
  { type: 'priority', name: '优先级' },
  { type: 'progress', name: '进度' },
  { type: 'sign', name: '标记' },
  { type: 'expression', name: '表情' }
];

const currentCategoryIcons = computed(() => {
  const cat = icons.nodeIconList.find(c => c.type === activeIconTab.value);
  if (!cat) return [];
  return cat.list.map(item => ({
    key: `${cat.type}_${item.name}`,
    icon: item.icon
  }));
});

const openIconModal = () => {
  const node = getActiveNode();
  if (!node) {
    showToast('请先选中需要设置图标的节点', 'warning');
    return;
  }
  currentNodeIcons.value = [...(node.getData('icon') || [])];
  isIconModalOpen.value = true;
};

const toggleIcon = (iconKey) => {
  const node = getActiveNode();
  if (!node) return;
  let cur = [...(node.getData('icon') || [])];
  const idx = cur.indexOf(iconKey);
  if (idx !== -1) {
    cur.splice(idx, 1);
  } else {
    // If priority or progress, only one per category typically
    const catPrefix = iconKey.split('_')[0] + '_';
    if (['priority_', 'progress_'].some(p => iconKey.startsWith(p))) {
      cur = cur.filter(k => !k.startsWith(catPrefix));
    }
    cur.push(iconKey);
  }
  mindMapInstance.execCommand('SET_NODE_ICON', node, cur);
  currentNodeIcons.value = cur;
};

const clearNodeIcons = () => {
  const node = getActiveNode();
  if (!node) return;
  mindMapInstance.execCommand('SET_NODE_ICON', node, []);
  currentNodeIcons.value = [];
  showToast('已清空节点图标', 'success');
};

// 9. 超链接 (Hyperlink) Modal
const isHyperlinkModalOpen = ref(false);
const hyperlinkUrl = ref('');
const hyperlinkTitle = ref('');

const openHyperlinkModal = () => {
  const node = getActiveNode();
  if (!node) {
    showToast('请先选中需要设置超链接的节点', 'warning');
    return;
  }
  hyperlinkUrl.value = node.getData('hyperlink') || '';
  hyperlinkTitle.value = node.getData('hyperlinkTitle') || '';
  isHyperlinkModalOpen.value = true;
};

const confirmHyperlink = () => {
  const node = getActiveNode();
  if (!node) return;
  let url = hyperlinkUrl.value.trim();
  if (url && !/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  mindMapInstance.execCommand('SET_NODE_HYPERLINK', node, url, hyperlinkTitle.value.trim());
  isHyperlinkModalOpen.value = false;
  showToast('超链接已更新', 'success');
};

const removeHyperlink = () => {
  const node = getActiveNode();
  if (!node) return;
  mindMapInstance.execCommand('SET_NODE_HYPERLINK', node, '', '');
  isHyperlinkModalOpen.value = false;
  showToast('已移除超链接', 'success');
};

// 10. 备注 (Note) Modal
const isNoteModalOpen = ref(false);
const noteContent = ref('');

const openNoteModal = () => {
  const node = getActiveNode();
  if (!node) {
    showToast('请先选中需要设置备注的节点', 'warning');
    return;
  }
  noteContent.value = node.getData('note') || '';
  isNoteModalOpen.value = true;
};

const confirmNote = () => {
  const node = getActiveNode();
  if (!node) return;
  mindMapInstance.execCommand('SET_NODE_NOTE', node, noteContent.value);
  isNoteModalOpen.value = false;
  showToast('备注已保存', 'success');
};

const clearNote = () => {
  const node = getActiveNode();
  if (!node) return;
  mindMapInstance.execCommand('SET_NODE_NOTE', node, '');
  noteContent.value = '';
  isNoteModalOpen.value = false;
  showToast('已清空备注', 'success');
};

// 11. 标签 (Tag) Modal
const isTagModalOpen = ref(false);
const nodeTags = ref([]);
const newTagInput = ref('');

const openTagModal = () => {
  const node = getActiveNode();
  if (!node) {
    showToast('请先选中需要设置标签的节点', 'warning');
    return;
  }
  nodeTags.value = [...(node.getData('tag') || [])];
  newTagInput.value = '';
  isTagModalOpen.value = true;
};

const addTag = (tagName) => {
  const val = (tagName || newTagInput.value).trim();
  if (!val) return;
  if (!nodeTags.value.includes(val)) {
    nodeTags.value.push(val);
  }
  newTagInput.value = '';
};

const removeTag = (index) => {
  nodeTags.value.splice(index, 1);
};

const confirmTags = () => {
  const node = getActiveNode();
  if (!node) return;
  if (newTagInput.value.trim()) {
    addTag();
  }
  mindMapInstance.execCommand('SET_NODE_TAG', node, [...nodeTags.value]);
  isTagModalOpen.value = false;
  showToast('标签已更新', 'success');
};

// 12. 概要 (Generalization)
const addGeneralization = () => {
  const list = getActiveNodeList();
  const validNodes = list.filter(n => !n.isRoot && !n.isGeneralization);
  if (validNodes.length === 0) {
    showToast('请先在画布中选中子节点（可按住Ctrl多选多个同级节点）以创建概要', 'warning');
    return;
  }
  mindMapInstance.execCommand('ADD_GENERALIZATION', { text: '概要' });
  showToast('已添加概要', 'success');
};

// 13. 关联线 (Associative Line)
const createAssociativeLine = () => {
  const node = getActiveNode();
  if (!node) {
    showToast('请先点击选中关联线的【起始节点】', 'warning');
    return;
  }
  mindMapInstance.associativeLine.createLineFromActiveNode();
  showToast('🔗 关联线创建中：请点击目标节点完成连接', 'info');
};

// 14. 公式 (Formula) Modal
const isFormulaModalOpen = ref(false);
const formulaInput = ref('E = mc^2');

const openFormulaModal = () => {
  const node = getActiveNode();
  if (!node) {
    showToast('请先选中需要插入公式的节点', 'warning');
    return;
  }
  formulaInput.value = 'E = mc^2';
  isFormulaModalOpen.value = true;
};

const confirmFormula = () => {
  const node = getActiveNode();
  if (!node) return;
  const f = formulaInput.value.trim();
  if (!f) {
    showToast('请输入公式内容', 'warning');
    return;
  }
  mindMapInstance.execCommand('INSERT_FORMULA', f, [node]);
  isFormulaModalOpen.value = false;
  showToast('公式已插入到节点', 'success');
};

// 15. 外框 (Outer Frame)
const addOuterFrame = () => {
  const list = getActiveNodeList();
  const validNodes = list.filter(n => !n.isRoot && !n.isGeneralization);
  if (validNodes.length === 0) {
    showToast('请先选中子节点（按住Ctrl可多选）再添加外框', 'warning');
    return;
  }
  mindMapInstance.execCommand('ADD_OUTER_FRAME');
  showToast('已添加外框', 'success');
};

// General Node Commands
const execNodeCommand = (cmd, ...args) => {
  if (!mindMapInstance) return;
  if (cmd === 'UNDO' || cmd === 'BACK') {
    mindMapInstance.execCommand('BACK', ...args);
    return;
  }
  if (cmd === 'REDO' || cmd === 'FORWARD') {
    mindMapInstance.execCommand('FORWARD', ...args);
    return;
  }
  mindMapInstance.execCommand(cmd, ...args);
};

// ============================================
// Canvas Loading, Auto-save & Init
// ============================================

let saveTimer = null;

const loadMindMapData = async () => {
  let mapRecord;
  try {
    const res = await api.get(`/mindmaps/${mindmapId}`);
    mapRecord = res.data.mindmap;
  } catch (err) {
    console.error('Failed to load mindmap from server', err);
    alert(err.response?.data?.error || '加载思维导图失败或无权访问');
    router.push('/dashboard');
    return;
  }

  try {
    title.value = mapRecord.title;
    description.value = mapRecord.description || '';

    let content = mapRecord.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        content = null;
      }
    }

    const initialData = content || {
      root: { data: { text: mapRecord.title }, children: [] },
      theme: { template: 'classic4', config: {} },
      layout: 'logicalStructure'
    };

    const cleanLegacyNodeStyles = (node) => {
      if (!node) return;
      if (node.data) {
        if (node.data.lineWidth === 0) delete node.data.lineWidth;
        if (node.data.lineColor === 'transparent') delete node.data.lineColor;
        if (node.data.fillColor === 'transparent') delete node.data.fillColor;
        if (node.data.borderColor === 'transparent') delete node.data.borderColor;
        if (node.data.borderWidth === 0) delete node.data.borderWidth;
        delete node.data.lineStyle;
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(cleanLegacyNodeStyles);
      }
    };
    if (initialData.root) cleanLegacyNodeStyles(initialData.root);
    else cleanLegacyNodeStyles(initialData);

    if (initialData.layout) currentLayout.value = initialData.layout;
    if (initialData.theme?.template) currentTheme.value = initialData.theme.template;

    initMindMap(initialData);
  } catch (err) {
    console.error('Failed to initialize canvas', err);
    alert('初始化思维导图画布异常: ' + (err.message || '未知错误'));
  }
};

const initMindMap = (data) => {
  if (!mindMapContainer.value) return;

  const rootNode = data.root ? data.root : (data.data ? data : { data: { text: title.value || '中心主题' }, children: [] });
  const layout = data.layout || currentLayout.value || 'logicalStructure';
  const theme = data.theme?.template || currentTheme.value || 'classic4';

  currentLayout.value = layout;
  currentTheme.value = theme;

  mindMapInstance = new MindMap({
    el: mindMapContainer.value,
    data: rootNode,
    layout: layout,
    theme: theme,
    readonly: false,
    enableFreeDrag: true,
    enableInheritAncestorLineStyle: false,
    beforeDragEnd: (info) => handleBeforeDragEnd(info),
    customHandleLine: (ctx, line) => {
      // If line belongs to an independent floating theme under root, hide connecting line
      if (ctx && ctx.isRoot) {
        const index = ctx._lines ? ctx._lines.indexOf(line) : -1;
        if (index !== -1 && ctx.children && ctx.children[index]) {
          const childNode = ctx.children[index];
          if (childNode.getData('isFloating')) {
            line.hide();
            return;
          }
        }
      }
      // Ensure connecting lines for normal nodes and sub-branches are visible
      line.show();
    }
  });

  window.mindMap = mindMapInstance;

  // Helper: recursively clear custom positions to restore automatic tree alignment
  const clearNodeCustomPositions = (targetNode, includeSelf = true) => {
    if (!targetNode) return;
    const resetOne = (n) => {
      n.customLeft = undefined;
      n.customTop = undefined;
      if (n.nodeData && n.nodeData.data) {
        delete n.nodeData.data.customLeft;
        delete n.nodeData.data.customTop;
      }
      if (typeof n.getData === 'function') {
        const d = n.getData();
        if (d) {
          delete d.customLeft;
          delete d.customTop;
        }
      }
      try {
        mindMapInstance.execCommand('SET_NODE_DATA', n, {
          customLeft: undefined,
          customTop: undefined
        });
        mindMapInstance.execCommand('SET_NODE_CUSTOM_POSITION', n, undefined, undefined);
      } catch (e) {
        // ignore command wrap error if any
      }
    };

    const walk = (n, isRootOfWalk) => {
      if (!isRootOfWalk || includeSelf) {
        resetOne(n);
      }
      if (n.children && n.children.length > 0) {
        n.children.forEach(child => walk(child, false));
      }
    };
    walk(targetNode, true);
  };

  let currentDraggingNode = null;
  let dragInitialPos = null;

  mindMapInstance.on('node_mousedown', (node) => {
    if (node && !node.isRoot) {
      currentDraggingNode = node;
      dragInitialPos = {
        left: node.left,
        top: node.top
      };
    }
  });

  mindMapInstance.on('node_dragging', (node) => {
    if (!currentDraggingNode && node) {
      currentDraggingNode = node;
    }
    if (!dragInitialPos && node) {
      dragInitialPos = {
        left: node.left,
        top: node.top
      };
    }
  });

  // Intercept drag end before Drag plugin assigns custom coordinates:
  // If drag distance does not exceed 3.5x threshold, cancel drag and snap back to origin immediately!
  const handleBeforeDragEnd = async ({ overlapNodeUid, prevNodeUid, nextNodeUid, beingDragNodeList }) => {
    if (!isAutoAlign.value) return false;

    // Reparenting or sibling reordering: let standard tree logic proceed
    if (overlapNodeUid || prevNodeUid || nextNodeUid) return false;

    const draggedNode = beingDragNodeList?.[0] || currentDraggingNode;
    if (!draggedNode || draggedNode.isRoot) return false;

    const parent = draggedNode.parent;
    if (!parent) return false;

    // If already an independent floating theme, user is just moving it around
    if (parent.isRoot && draggedNode.getData('isFloating')) {
      return false;
    }

    const drag = mindMapInstance.drag;
    let dropX, dropY;
    if (drag && drag.clone) {
      const cloneT = drag.clone.transform();
      dropX = cloneT.translateX;
      dropY = cloneT.translateY;
    } else if (drag && drag.drawTransform) {
      const { scaleX, scaleY, translateX, translateY } = drag.drawTransform;
      dropX = (drag.mouseMoveX - drag.offsetX - translateX) / scaleX;
      dropY = (drag.mouseMoveY - drag.offsetY - translateY) / scaleY;
    } else {
      dropX = draggedNode.left;
      dropY = draggedNode.top;
    }

    // Determine parent anchor point
    let parentConnX = parent.left + parent.width;
    let parentConnY = parent.top + parent.height / 2;
    if (parent.isRoot) {
      const isRight = dropX >= parent.left + parent.width / 2;
      parentConnX = isRight ? (parent.left + parent.width) : parent.left;
    }

    const initialPos = dragInitialPos;
    const childInitCenterX = initialPos ? initialPos.left : draggedNode.left;
    const childInitCenterY = (initialPos ? initialPos.top : draggedNode.top) + draggedNode.height / 2;

    const origLineDist = Math.hypot(childInitCenterX - parentConnX, childInitCenterY - parentConnY);
    const baseLineLength = Math.max(origLineDist, 60);

    // Required threshold: 3.5 times original line length
    const DRAG_DETACH_MULTIPLIER = 3.5;
    const thresholdDist = Math.max(baseLineLength * DRAG_DETACH_MULTIPLIER, 200);

    const displacement = initialPos
      ? Math.hypot(dropX - initialPos.left, dropY - initialPos.top)
      : Math.hypot(dropX - parentConnX, dropY - parentConnY);
    const distToParent = Math.hypot(dropX - parentConnX, (dropY + draggedNode.height / 2) - parentConnY);

    const isFarEnough = displacement >= thresholdDist || distToParent >= thresholdDist;

    if (!isFarEnough) {
      // 1. Cancel the drag completely so Drag plugin never assigns custom coordinates
      showToast(`未达到脱离阈值（需拖出原连线 ${DRAG_DETACH_MULTIPLIER} 倍距离），已自动对齐回到原位`, 'info');
      setTimeout(() => {
        clearNodeCustomPositions(draggedNode, true);
        mindMapInstance.render();
      }, 0);
      return true; // CANCEL DRAG!
    } else {
      // 2. Far enough: detach into new independent theme
      if (!parent.isRoot) {
        mindMapInstance.execCommand('MOVE_NODE_TO', draggedNode, mindMapInstance.renderer.root);
      }
      mindMapInstance.execCommand('SET_NODE_CUSTOM_POSITION', draggedNode, dropX, dropY);
      mindMapInstance.execCommand('SET_NODE_DATA', draggedNode, {
        isFloating: true,
        fontSize: 18,
        fontWeight: 'bold'
      });
      clearNodeCustomPositions(draggedNode, false);
      mindMapInstance.render();
      showToast(`【自动对齐】拖拽距离超出原有连线 ${DRAG_DETACH_MULTIPLIER} 倍，已转为独立新主题`, 'success');
      triggerAutoSave();
      return true; // We handled the detach manually
    }
  };

  // Wire beforeDragEnd to options
  mindMapInstance.opt.beforeDragEnd = handleBeforeDragEnd;

  if (data.theme?.config) {
    try {
      const config = { ...data.theme.config };
      if (config.rootLineKeepSameInCurve !== undefined) {
        config.rootLineStartPositionKeepSameInCurve = config.rootLineKeepSameInCurve;
        rootLineKeepSame.value = config.rootLineKeepSameInCurve;
      } else {
        config.rootLineKeepSameInCurve = true;
        config.rootLineStartPositionKeepSameInCurve = true;
        rootLineKeepSame.value = true;
      }
      mindMapInstance.setThemeConfig(config);
      if (config.lineStyle) {
        currentLineStyle.value = config.lineStyle;
      } else {
        currentLineStyle.value = mindMapInstance.getThemeConfig('lineStyle') || 'straight';
      }
      if (config.generalizationStyle) {
        currentGeneralizationStyle.value = config.generalizationStyle;
      } else {
        currentGeneralizationStyle.value = mindMapInstance.getThemeConfig('generalizationStyle') || 'line';
      }
      if (config.nodeUseLineStyle !== undefined) {
        nodeUseLineStyle.value = config.nodeUseLineStyle;
      }
    } catch (e) {
      console.warn('Set theme config error', e);
    }
  } else {
    currentLineStyle.value = mindMapInstance.getThemeConfig('lineStyle') || 'straight';
    const currentConfig = mindMapInstance.getCustomThemeConfig() || {};
    mindMapInstance.setThemeConfig({
      ...currentConfig,
      rootLineKeepSameInCurve: true,
      rootLineStartPositionKeepSameInCurve: true
    });
  }

  if (data.view) {
    try {
      mindMapInstance.view.setTransformData(data.view);
    } catch (e) {
      console.warn('Set view transform error', e);
    }
  }

  applyThemeCardStyles();

  mindMapInstance.on('data_change', () => {
    saveStatus.value = 'unsaved';
    triggerAutoSave();
  });

  mindMapInstance.on('painter_end', () => {
    isPainterActive.value = false;
  });

  window.addEventListener('keydown', handleGlobalKeydown);
};

const handleGlobalKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveMindMap();
  }
};

const triggerAutoSave = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveMindMap();
  }, 2500);
};

const saveMindMap = async () => {
  if (!mindMapInstance) return;
  saveStatus.value = 'saving';
  try {
    const fullData = mindMapInstance.getData(true);
    await api.put(`/mindmaps/${mindmapId}`, {
      title: title.value,
      description: description.value,
      content: fullData
    });
    saveStatus.value = 'saved';
  } catch (err) {
    console.error('Save mindmap failed', err);
    saveStatus.value = 'unsaved';
  }
};

const handleTitleBlur = () => {
  if (!title.value.trim()) {
    title.value = '未命名思维导图';
  }
  saveMindMap();
};

const changeLayout = () => {
  if (!mindMapInstance) return;
  mindMapInstance.setLayout(currentLayout.value);
  triggerAutoSave();
};

const changeTheme = () => {
  if (!mindMapInstance) return;
  mindMapInstance.setTheme(currentTheme.value);
  applyThemeCardStyles();
  triggerAutoSave();
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

const handleExport = async (type) => {
  isExportMenuOpen.value = false;
  if (!mindMapInstance) return;

  const exportName = title.value || '思维导图';
  try {
    if (type === 'json') {
      const data = mindMapInstance.getData(true);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportName}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      await mindMapInstance.export(type, true, exportName);
    }
  } catch (err) {
    console.error('Export error:', err);
    alert('导出失败，请稍后重试');
  }
};

const goBack = async () => {
  if (saveStatus.value === 'unsaved') {
    await saveMindMap();
  }
  router.push('/dashboard');
};

onMounted(() => {
  loadMindMapData();
});

onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer);
  window.removeEventListener('keydown', handleGlobalKeydown);
  if (mindMapInstance) {
    mindMapInstance.destroy();
  }
});
</script>

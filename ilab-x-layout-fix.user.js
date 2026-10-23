// ==UserScript==
// @name         iLab-X 学习页布局修复
// @name:en      iLab-X Learn Page Layout Fix
// @namespace    ilabx-layout-fix
// @version      1.0.0
// @description  修复 ilab-x（实验空间）资源学习页布局：底部巨大空白框、正文容器写死 620/828px 高度、“上一个/下一个”按钮被顶出可视区、窄窗口/竖屏出现横向滚动条。适配 Chrome / Edge / 360 等浏览器。
// @description:en  Fix ilab-x resource-learn pages: giant blank box under content, fixed-height (620/828px) content area, prev/next buttons pushed off-screen, and horizontal scrollbar on narrow windows.
// @author       Gordon
// @match        *://*.ilab-x.com/*
// @run-at       document-start
// @noframes
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  var STYLE_ID = 'ilx-layout-fix-style';
  var STORE_KEY = 'ilx-layout-fix-enabled';

  /* =====================================================================
   * 修复样式
   * 作用域统一挂在 .class-learn-sum-info（资源学习页主容器）之下，
   * 只影响学习页，不碰站内其它页面（课程详情、弹窗视频等）。
   * 所有规则用 !important —— 这样连页面 JS 运行时写进 style 属性的
   * 固定高度（如 height: 620px）也会被覆盖，无需和 JS 抢时机。
   * =================================================================== */
  var CSS = [
    /* ---------- 1. 内容区高度自适应（消灭底部巨大白框） ----------
     * 原页面把正文容器高度写死：
     *   - 页面 JS 会给正文外层 div 内联 style="height: 620px"
     *   - CSS 里 .other-class { height: 828px }
     * 正文（.rich-text-out，height:100%）被迫撑满固定高度，
     * 文字读完剩下的就是巨大空白。现改为 height:auto：
     * 正文多高容器就多高；超出可视高度时由滚动容器滚动。
     */
    '.class-learn-sum-info .right-content-info > div,',
    '.class-learn-sum-info .other-class,',
    '.class-learn-sum-info .medium-box,',
    '.class-learn-sum-info .rich-text-out,',
    '.class-learn-sum-info .rich-text-info {',
    '    height: auto !important;',
    '    min-height: 0 !important;',
    '}',

    /* 滚动容器 .right-content-info 原来写死 height: calc(100% - 60px)，
     * 改为 flex 弹性子项，正好占满剩余可用高度（自动吸收其它固定条）。 */
    '.class-learn-sum-info .right-content-info {',
    '    flex: 1 1 auto !important;',
    '    height: auto !important;',
    '    min-height: 0 !important;',
    '}',

    /* ---------- 2. 「上一个 / 下一个」按钮栏常驻可视区底部 ----------
     * 底部按钮栏（含“标记完成 / 上一个 / 下一个”）是滚动容器的
     * 最后一个子元素，原来被固定高度的大盒子顶出屏幕。
     * position:sticky + bottom:0：
     *   - 正文短 → 按钮栏吸附在可视区底边（正好在下方框内）；
     *   - 正文长 → 滚动到最底时按钮栏自然出现在底部。
     * :last-child 兜底：若某些资源类型把标题栏也放进该容器，
     * 只吸附最后一个，避免把顶部标题栏错误地钉到底部。
     */
    '.class-learn-sum-info .right-content-info > .right-content-title-info:last-child {',
    '    position: sticky !important;',
    '    bottom: 0 !important;',
    '    z-index: 20 !important;',
    '    background: #ffffff !important;',
    '    border-top: 0.5px solid #e2e2e2 !important;',
    '    flex-shrink: 0 !important;',
    '}',

    /* ---------- 3. 窄窗口 / 竖屏 / 分屏适配 ----------
     * 原页面：min-width 1200px / 1400px + 左栏固定 400px + 右栏
     * min-width 400~600px，窄窗口必然横向滚动。
     * 现解除各层 min-width；左栏按视口比例收缩（最窄 180px，
     * 宽屏时仍是 400px，观感不变）。
     */
    '.class-learn-sum-info {',
    '    min-width: 0 !important;',
    '    overflow-x: hidden !important;',
    '}',
    '.class-learn-sum-info .class-learn-info,',
    '.class-learn-sum-info .class-learn-small-info {',
    '    min-width: 0 !important;',
    '}',
    '.class-learn-sum-info .class-learn-left-info {',
    '    width: clamp(180px, 32vw, 400px) !important;',
    '    flex: 0 0 auto !important;',
    '}',
    '.class-learn-sum-info .class-learn-left-small-info {',
    '    flex: 0 0 auto !important;',
    '}',
    '.class-learn-sum-info .class-learn-right-info,',
    '.class-learn-sum-info .class-learn-right-small-info {',
    '    width: auto !important;',
    '    min-width: 0 !important;',
    '    flex: 1 1 auto !important;',
    '}',

    /* 极窄窗口（< 700px，手机/竖屏）下进一步压缩左栏，
     * 优先保证正文与按钮栏可用。 */
    '@media (max-width: 700px) {',
    '    .class-learn-sum-info .class-learn-left-info {',
    '        width: 34vw !important;',
    '    }',
    '}',

    /* ---------- 4. 细节修补 ----------
     * 顶部 60px 标题栏里的任务名（.ellipsis-info）在窄窗口下
     * 允许收缩省略，避免把“上一个/下一个”按钮挤出屏幕。 */
    '.class-learn-sum-info .right-content-title-next-info {',
    '    min-width: 0 !important;',
    '}',
    '.class-learn-sum-info .right-content-title-next-info > div:first-child {',
    '    min-width: 0 !important;',
    '    overflow: hidden !important;',
    '}'
  ].join('\n');

  /* 注入 <style>（document-start 阶段 head 可能尚未生成，
   * 先挂到 documentElement，效果相同；SPA 路由切换不会移除它） */
  function injectStyle() {
    var el = document.getElementById(STYLE_ID);
    if (el) return el;
    el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    (document.head || document.documentElement).appendChild(el);
    return el;
  }

  /* ---------- 开关（油猴菜单里随时切换，状态存 localStorage） ---------- */
  function isEnabled() {
    try {
      return window.localStorage.getItem(STORE_KEY) !== '0';
    } catch (e) {
      return true;
    }
  }

  function setEnabled(on) {
    try {
      window.localStorage.setItem(STORE_KEY, on ? '1' : '0');
    } catch (e) { /* 隐私模式下忽略 */ }
    apply();
  }

  function apply() {
    var el = document.getElementById(STYLE_ID);
    if (el) el.disabled = !isEnabled();
  }

  injectStyle();
  apply();

  /* head 就绪后再确认一次（document-start 时可能挂在 documentElement 上） */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      var el = document.getElementById(STYLE_ID);
      if (el && !document.head.contains(el)) {
        document.head.appendChild(el); // 挪进 head，便于 DevTools 里查看
      }
      apply();
    }, { once: true });
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('布局修复：开 / 关', function () {
      setEnabled(!isEnabled());
    });
  }
})();

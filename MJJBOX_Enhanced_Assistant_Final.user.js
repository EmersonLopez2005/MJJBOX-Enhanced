// ==UserScript==
// @name         MJJBOX 增强助手
// @namespace    http://tampermonkey.net/
// @version      2.8
// @description  整合等级查看器与自定义背景、字体等美化功能，新增点赞质量隐藏门槛检测
// @author       MJJBOX
// @match        https://mjjbox.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// ==/UserScript==

(() => {
  'use strict';
  if (window !== window.top) return;

  console.log('🚀 MJJBOX 增强助手启动');

  /* ========== 配置管理系统 ========== */
  const defaultConfig = {
    background: {
      enabled: false,
      imageUrl: '',
      mode: 'cover',
      opacity: 0.8,
      blur: 0,
      overlayColor: '#000000',
      overlayOpacity: 0.3
    },
    font: {
      enabled: false,
      family: 'inherit',
      size: 'inherit',
      weight: 'inherit',
      color: 'inherit',
      lineHeight: 'inherit'
    },
    theme: {
      enabled: false,
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      accentColor: '#28a745',
      borderRadius: '8px'
    }
  };

  let currentConfig = JSON.parse(JSON.stringify(defaultConfig));

  // 使用GM_setValue/GM_getValue进行配置存储
  const saveConfig = () => {
    try {
      console.log('💾 开始保存配置:', currentConfig);
      GM_setValue('mjjbox_bg_enabled', currentConfig.background.enabled);
      GM_setValue('mjjbox_bg_url', currentConfig.background.imageUrl);
      GM_setValue('mjjbox_bg_mode', currentConfig.background.mode);
      GM_setValue('mjjbox_bg_opacity', currentConfig.background.opacity);
      GM_setValue('mjjbox_bg_blur', currentConfig.background.blur);
      GM_setValue('mjjbox_bg_overlay_color', currentConfig.background.overlayColor);
      GM_setValue('mjjbox_bg_overlay_opacity', currentConfig.background.overlayOpacity);

      GM_setValue('mjjbox_font_enabled', currentConfig.font.enabled);
      GM_setValue('mjjbox_font_family', currentConfig.font.family);
      GM_setValue('mjjbox_font_size', currentConfig.font.size);
      GM_setValue('mjjbox_font_weight', currentConfig.font.weight);
      GM_setValue('mjjbox_font_color', currentConfig.font.color);
      GM_setValue('mjjbox_font_line_height', currentConfig.font.lineHeight);

      GM_setValue('mjjbox_theme_enabled', currentConfig.theme.enabled);
      GM_setValue('mjjbox_theme_primary', currentConfig.theme.primaryColor);
      GM_setValue('mjjbox_theme_secondary', currentConfig.theme.secondaryColor);
      GM_setValue('mjjbox_theme_accent', currentConfig.theme.accentColor);
      GM_setValue('mjjbox_theme_radius', currentConfig.theme.borderRadius);

      console.log('✅ 配置保存成功');
      return true;
    } catch (e) {
      console.error('❌ 保存配置失败:', e);
      return false;
    }
  };

  const loadConfig = () => {
    try {
      console.log('📖 开始加载配置...');

      currentConfig.background.enabled = GM_getValue('mjjbox_bg_enabled', false);
      currentConfig.background.imageUrl = GM_getValue('mjjbox_bg_url', '');
      currentConfig.background.mode = GM_getValue('mjjbox_bg_mode', 'cover');
      currentConfig.background.opacity = GM_getValue('mjjbox_bg_opacity', 0.8);
      currentConfig.background.blur = GM_getValue('mjjbox_bg_blur', 0);
      currentConfig.background.overlayColor = GM_getValue('mjjbox_bg_overlay_color', '#000000');
      currentConfig.background.overlayOpacity = GM_getValue('mjjbox_bg_overlay_opacity', 0.3);

      currentConfig.font.enabled = GM_getValue('mjjbox_font_enabled', false);
      currentConfig.font.family = GM_getValue('mjjbox_font_family', 'inherit');
      currentConfig.font.size = GM_getValue('mjjbox_font_size', 'inherit');
      currentConfig.font.weight = GM_getValue('mjjbox_font_weight', 'inherit');
      currentConfig.font.color = GM_getValue('mjjbox_font_color', 'inherit');
      currentConfig.font.lineHeight = GM_getValue('mjjbox_font_line_height', 'inherit');

      currentConfig.theme.enabled = GM_getValue('mjjbox_theme_enabled', false);
      currentConfig.theme.primaryColor = GM_getValue('mjjbox_theme_primary', '#007bff');
      currentConfig.theme.secondaryColor = GM_getValue('mjjbox_theme_secondary', '#6c757d');
      currentConfig.theme.accentColor = GM_getValue('mjjbox_theme_accent', '#28a745');
      currentConfig.theme.borderRadius = GM_getValue('mjjbox_theme_radius', '8px');

      console.log('✅ 配置加载成功:', currentConfig);
      return true;
    } catch (e) {
      console.error('❌ 加载配置失败:', e);
      return false;
    }
  };

  const clearConfig = () => {
    try {
      console.log('🗑️ 开始清除配置...');
      GM_deleteValue('mjjbox_bg_enabled');
      GM_deleteValue('mjjbox_bg_url');
      GM_deleteValue('mjjbox_bg_mode');
      GM_deleteValue('mjjbox_bg_opacity');
      GM_deleteValue('mjjbox_bg_blur');
      GM_deleteValue('mjjbox_bg_overlay_color');
      GM_deleteValue('mjjbox_bg_overlay_opacity');

      GM_deleteValue('mjjbox_font_enabled');
      GM_deleteValue('mjjbox_font_family');
      GM_deleteValue('mjjbox_font_size');
      GM_deleteValue('mjjbox_font_weight');
      GM_deleteValue('mjjbox_font_color');
      GM_deleteValue('mjjbox_font_line_height');

      GM_deleteValue('mjjbox_theme_enabled');
      GM_deleteValue('mjjbox_theme_primary');
      GM_deleteValue('mjjbox_theme_secondary');
      GM_deleteValue('mjjbox_theme_accent');
      GM_deleteValue('mjjbox_theme_radius');

      console.log('✅ 配置清除成功');
      return true;
    } catch (e) {
      console.error('❌ 清除配置失败:', e);
      return false;
    }
  };

  /* ========== 样式应用系统 ========== */
  const applyCustomStyles = () => {
    console.log('🎨 开始应用自定义样式...');

    // 移除旧样式
    const oldStyle = document.getElementById('mjjbox-custom-styles');
    if (oldStyle) {
      oldStyle.remove();
      console.log('🗑️ 移除旧样式');
    }

    let customCSS = `
      /* 抖音美好体字体加载 */
      @font-face {
        font-family: 'DouyinSans';
        src: url('https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/douyinsans/1.0.0/DouyinSans-Regular.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;

    // 背景样式
    if (currentConfig.background.enabled && currentConfig.background.imageUrl) {
      console.log('🖼️ 应用背景样式:', currentConfig.background);
      const bg = currentConfig.background;
      customCSS += `
        body {
          background-image: url('${bg.imageUrl}') !important;
          background-size: ${bg.mode} !important;
          background-repeat: ${bg.mode === 'repeat' ? 'repeat' : 'no-repeat'} !important;
          background-position: center !important;
          background-attachment: fixed !important;
        }
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${bg.overlayColor} !important;
          opacity: ${bg.overlayOpacity} !important;
          backdrop-filter: blur(${bg.blur}px);
          z-index: 1;
          pointer-events: none;
        }

        /* 确保内容在遮罩层之上 */
        .ember-application, #main-outlet, body > * {
          position: relative;
          z-index: 2;
        }
        .ember-application {
          background: rgba(255, 255, 255, ${1 - bg.opacity}) !important;
        }
      `;
    }

    // 字体样式
    if (currentConfig.font.enabled) {
      console.log('✏️ 应用字体样式:', currentConfig.font);
      const font = currentConfig.font;
      const fontFamily = font.family !== 'inherit' ? font.family : '';
      const fontSize = font.size !== 'inherit' ? font.size : '';
      const fontWeight = font.weight !== 'inherit' ? font.weight : '';
      const fontColor = font.color !== 'inherit' ? font.color : '';
      const lineHeight = font.lineHeight !== 'inherit' ? font.lineHeight : '';

      customCSS += `
        /* 强制字体样式应用 */
        * {
          ${fontFamily ? `font-family: ${fontFamily} !important;` : ''}
          ${fontSize ? `font-size: ${fontSize} !important;` : ''}
          ${fontWeight ? `font-weight: ${fontWeight} !important;` : ''}
          ${fontColor ? `color: ${fontColor} !important;` : ''}
          ${lineHeight ? `line-height: ${lineHeight} !important;` : ''}
        }

        body, .ember-application, #main-outlet, .topic-post, .cooked,
        p, div, span, a, h1, h2, h3, h4, h5, h6, .btn, .form-control,
        .topic-list-item, .topic-title, .post-content {
          ${fontFamily ? `font-family: ${fontFamily} !important;` : ''}
          ${fontSize ? `font-size: ${fontSize} !important;` : ''}
          ${fontWeight ? `font-weight: ${fontWeight} !important;` : ''}
          ${fontColor ? `color: ${fontColor} !important;` : ''}
          ${lineHeight ? `line-height: ${lineHeight} !important;` : ''}
        }
      `;
    }

    // 主题样式
    if (currentConfig.theme.enabled) {
      console.log('🎨 应用主题样式:', currentConfig.theme);
      const theme = currentConfig.theme;
      customCSS += `
        /* 强制应用主题样式 - 使用通用选择器 */

        /* 所有按钮 */
        button, .btn, input[type="button"], input[type="submit"] {
          background-color: ${theme.primaryColor} !important;
          border-color: ${theme.primaryColor} !important;
          color: #fff !important;
          border-radius: ${theme.borderRadius} !important;
        }

        /* 所有链接 */
        a {
          color: ${theme.primaryColor} !important;
        }

        /* 悬停效果 - 更精确的选择器 */
        button:hover, .btn:hover,
        a:hover:not([href^="#"]):not([href=""]),
        .topic-list-item:hover, .latest-topic-list-item:hover,
        .menu-item:hover, .nav-item:hover {
          background-color: ${theme.accentColor}30 !important;
          transition: background-color 0.2s ease !important;
        }

        /* 避免过度应用悬停效果 */
        body:hover, html:hover, .ember-application:hover {
          background-color: transparent !important;
        }

        /* 表单元素 */
        input, textarea, select {
          border-color: ${theme.secondaryColor} !important;
          border-radius: ${theme.borderRadius} !important;
        }

        input:focus, textarea:focus, select:focus {
          border-color: ${theme.primaryColor} !important;
          box-shadow: 0 0 0 2px ${theme.primaryColor}30 !important;
        }

        /* 卡片和容器 */
        .card, .panel, .box, .container {
          border-radius: ${theme.borderRadius} !important;
          border-color: ${theme.secondaryColor} !important;
        }

        /* 导航和菜单项 */
        .nav a, .menu a, .navbar a {
          color: ${theme.primaryColor} !important;
        }

        .nav a:hover, .menu a:hover, .navbar a:hover,
        .nav .active a, .menu .active a {
          background-color: ${theme.primaryColor} !important;
          color: #fff !important;
        }

        /* 标签和徽章 */
        .tag, .badge, .label {
          background-color: ${theme.accentColor} !important;
          color: #fff !important;
          border-radius: ${theme.borderRadius} !important;
        }

        /* 页面装饰 - 顶部主题色条（可选） */
        body::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, ${theme.primaryColor}, ${theme.accentColor});
          z-index: 9999;
          pointer-events: none;
          opacity: 0.8;
        }

        /* 强制覆盖所有可能的按钮样式 */
        * {
          --primary-color: ${theme.primaryColor} !important;
          --secondary-color: ${theme.secondaryColor} !important;
          --accent-color: ${theme.accentColor} !important;
          --border-radius: ${theme.borderRadius} !important;
        }

        /* 使用属性选择器强制应用 */
        [class*="btn"], [class*="button"], [class*="link"] {
          background-color: ${theme.primaryColor} !important;
          border-color: ${theme.primaryColor} !important;
          color: #fff !important;
        }

        [class*="btn"]:hover, [class*="button"]:hover {
          background-color: ${theme.accentColor} !important;
        }
      `;
    }

    if (customCSS.trim()) {
      GM_addStyle(customCSS);
      console.log('✅ 自定义样式已应用');
    } else {
      console.log('⚠️ 没有自定义样式需要应用');
    }
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
      '0, 0, 0';
  };

  /* ========== 等级名称（与官方同步） ========== */
  const levelNames = {
    0: '青铜会员',
    1: '白银会员',
    2: '黄金会员',
    3: '钻石会员',
    4: '星曜会员'
  };

  /* ========== 官方默认晋级条件（完全同步） ========== */
  const levelRequirements = {
    1: {
      topics_entered: 5,
      posts_read: 30,
      time_read: 10 * 60
    },
    2: {
      days_visited: 15,
      topics_entered: 20,
      posts_read: 100,
      time_read: 60 * 60,
      posts_created: 1,
      likes_received: 1,
      likes_given: 1,
      has_avatar: true,
      has_bio: true
    },
    3: {
      days_visited_in_100: 50,
      topics_entered: 200,
      posts_read: 500,
      posts_created_in_100: 10,
      likes_received: 20,
      likes_given: 30,
      flagged_posts_ratio: 0.05
    },
    4: {
      manual_promotion: true
    }
  };

  /* ========== 基础样式 ========== */
  const baseStyles = `
    .mjjbox-level-badge {
      position: fixed; top: 20px; right: 20px;
      width: 60px; height: 60px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; color: #fff;
      cursor: pointer; z-index: 9999;
      box-shadow: 0 4px 20px rgba(0,0,0,.25);
      transition: transform .3s,box-shadow .3s;
      border: 3px solid #fff;
    }
    .mjjbox-level-badge:hover { transform: scale(1.12); box-shadow: 0 8px 30px rgba(0,0,0,.35); }
    .mjjbox-level-badge.level-0 { background: linear-gradient(135deg,#9ca3af 0%,#6b7280 100%); }
    .mjjbox-level-badge.level-1 { background: linear-gradient(135deg,#10b981 0%,#059669 100%); }
    .mjjbox-level-badge.level-2 { background: linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%); }
    .mjjbox-level-badge.level-3 { background: linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%); }
    .mjjbox-level-badge.level-4 { background: linear-gradient(135deg,#f59e0b 0%,#d97706 100%); }

    .mjjbox-settings-btn {
      position: fixed; top: 90px; right: 20px;
      width: 50px; height: 50px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 2px solid #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; z-index: 9998;
      box-shadow: 0 4px 15px rgba(0,0,0,.2);
      transition: all .3s;
      color: #fff; font-size: 18px;
    }
    .mjjbox-settings-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(0,0,0,.3);
    }

    .mjjbox-modal {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.6); z-index: 10000;
      opacity: 0; visibility: hidden;
      transition: opacity .35s,visibility .35s;
    }
    .mjjbox-modal.show { opacity: 1; visibility: visible; }

    .mjjbox-modal-content {
      position: absolute;
      background: #ffffff;
      border: 1px solid #e1e5e9;
      border-radius: 16px;
      max-width: 90vw; max-height: 85vh;
      padding: 28px 30px 36px;
      box-shadow: 0 20px 60px rgba(0,0,0,.15);
      overflow-y: auto;
      transform: scale(.92) translateY(-30px);
      transition: transform .35s;
    }
    .mjjbox-modal.show .mjjbox-modal-content { transform: scale(1) translateY(0); }

    .mjjbox-close-btn {
      position: absolute; top: 12px; right: 16px;
      background: none; border: none;
      font-size: 28px; cursor: pointer; color: #666;
      transition: color .2s;
    }
    .mjjbox-close-btn:hover { color: #000; }

    .mjjbox-level-modal-content { width: 420px; }
    .mjjbox-level-header { text-align: center; margin-bottom: 24px; }
    .mjjbox-level-title { margin: 0; font-size: 24px; font-weight: 700; color: #000; }
    .mjjbox-level-subtitle, .mjjbox-level-score { margin: 4px 0 0; font-size: 15px; color: #666; }

    .mjjbox-progress-section h3 { margin: 0 0 18px; font-size: 17px; color: #000; }
    .mjjbox-progress-item { margin-bottom: 14px; }
    .mjjbox-progress-label { display: block; font-weight: 600; margin-bottom: 6px; color: #000; }
    .mjjbox-progress-bar-container { display: flex; align-items: center; gap: 12px; }
    .mjjbox-progress-bar { flex: 1; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
    .mjjbox-progress-fill { height: 100%; background: linear-gradient(90deg,#10b981 0%,#34d399 100%); transition: width .4s; }
    .mjjbox-progress-fill.incomplete { background: linear-gradient(90deg,#f87171 0%,#fca5a5 100%); }
    .mjjbox-progress-required, .mjjbox-progress-tooltip { font-size: 13px; color: #666; }
    .mjjbox-progress-undone { color: #ef4444; }
    .mjjbox-progress-done { color: #10b981; }

    .mjjbox-settings-modal-content { width: 500px; }
    .mjjbox-settings-header { text-align: center; margin-bottom: 24px; }
    .mjjbox-settings-title { margin: 0; font-size: 22px; font-weight: 700; color: #000; }
    .mjjbox-settings-subtitle { margin: 8px 0 0; font-size: 14px; color: #666; }

    .mjjbox-settings-tabs {
      display: flex; margin-bottom: 20px; border-bottom: 2px solid #f0f0f0;
    }
    .mjjbox-settings-tab {
      flex: 1; padding: 12px; text-align: center; cursor: pointer;
      background: none; border: none; font-size: 14px; font-weight: 600;
      color: #666; transition: all .2s;
      border-bottom: 2px solid transparent;
    }
    .mjjbox-settings-tab.active {
      color: #007bff; border-bottom-color: #007bff;
    }
    .mjjbox-settings-tab:hover { color: #007bff; }

    .mjjbox-settings-content { min-height: 300px; }
    .mjjbox-settings-panel { display: none; }
    .mjjbox-settings-panel.active { display: block; }

    .mjjbox-form-group {
      margin-bottom: 20px;
    }
    .mjjbox-form-label {
      display: block; margin-bottom: 8px; font-weight: 600; color: #333;
    }
    .mjjbox-form-control {
      width: 100%; padding: 10px 12px; border: 2px solid #e1e5e9;
      border-radius: 6px; font-size: 14px; transition: border-color .2s;
    }
    .mjjbox-form-control:focus {
      outline: none; border-color: #007bff;
    }
    .mjjbox-form-check {
      display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
    }
    .mjjbox-form-check input[type="checkbox"] {
      width: 18px; height: 18px;
    }
    .mjjbox-form-check label {
      margin: 0; font-weight: 500; color: #333; cursor: pointer;
    }

    .mjjbox-form-row {
      display: flex; gap: 12px;
    }
    .mjjbox-form-col {
      flex: 1;
    }

    .mjjbox-btn {
      padding: 10px 20px; border: none; border-radius: 6px;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: all .2s;
    }
    .mjjbox-btn-primary {
      background: #007bff; color: #fff;
    }
    .mjjbox-btn-primary:hover {
      background: #0056b3;
    }
    .mjjbox-btn-secondary {
      background: #6c757d; color: #fff;
    }
    .mjjbox-btn-secondary:hover {
      background: #545b62;
    }
    .mjjbox-btn-danger {
      background: #dc3545; color: #fff;
    }
    .mjjbox-btn-danger:hover {
      background: #c82333;
    }

    .mjjbox-settings-actions {
      display: flex; gap: 12px; justify-content: flex-end;
      margin-top: 24px; padding-top: 20px;
      border-top: 1px solid #e1e5e9;
    }

    .mjjbox-color-preview {
      width: 30px; height: 30px; border-radius: 4px;
      border: 2px solid #ddd; display: inline-block;
      vertical-align: middle; margin-left: 8px;
    }

    .mjjbox-file-input-wrapper {
      position: relative; display: inline-block;
    }
    .mjjbox-file-input {
      position: absolute; opacity: 0; width: 100%; height: 100%;
      cursor: pointer;
    }
    .mjjbox-file-input-label {
      display: inline-block; padding: 8px 16px;
      background: #f8f9fa; border: 2px dashed #dee2e6;
      border-radius: 6px; cursor: pointer; transition: all .2s;
    }
    .mjjbox-file-input-label:hover {
      background: #e9ecef; border-color: #007bff;
    }

    .mjjbox-notification {
      position: fixed; top: 90px; right: 24px;
      padding: 12px 18px; border-radius: 8px;
      color: #fff; font-weight: 600; z-index: 10001;
      opacity: 0; transform: translateX(120%);
      transition: all .3s;
    }
    .mjjbox-notification.success { background: #10b981; }
    .mjjbox-notification.error { background: #ef4444; }
    .mjjbox-notification.info { background: #007bff; }
    .mjjbox-notification.show { opacity: 1; transform: translateX(0); }
  `;

  /* ========== 通用工具函数 ========== */
  const getCurrentUsername = () => {
    try {
      if (typeof Discourse !== 'undefined' && Discourse.User && Discourse.User.current()) {
        return Discourse.User.current()?.username || null;
      }
    } catch (e) {
      console.error('获取用户名失败:', e);
    }
    return null;
  };

  const showNotification = (msg, type = 'info', dur = 3000) => {
    console.log(`📢 通知: ${msg}`);

    // 移除旧通知
    const oldNotification = document.querySelector('.mjjbox-notification');
    if (oldNotification) {
      oldNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `mjjbox-notification ${type}`;
    notification.textContent = msg;
    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // 隐藏动画
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, dur);
  };

  /* ========== 等级徽章系统 ========== */
  const createLevelBadge = () => {
    const badge = document.createElement('div');
    badge.className = 'mjjbox-level-badge';
    badge.textContent = 'LV ?';
    badge.title = '点击查看等级进度';
    badge.addEventListener('click', fetchUserLevel);
    document.body.appendChild(badge);
    return badge;
  };

  const updateLevelBadge = (level, username) => {
    const badge = document.querySelector('.mjjbox-level-badge');
    if (!badge) return;
    badge.textContent = `LV ${level}`;
    badge.className = `mjjbox-level-badge level-${level}`;
    badge.title = `${username} - ${levelNames[level] || '未知等级'}（点击查看详情）`;
  };

  /* ========== 设置按钮 ========== */
  const createSettingsButton = () => {
    const btn = document.createElement('div');
    btn.className = 'mjjbox-settings-btn';
    btn.innerHTML = '⚙️';
    btn.title = '打开设置面板';
    btn.addEventListener('click', openSettingsModal);
    document.body.appendChild(btn);
    return btn;
  };

  /* ========== 数据获取（等级查看器） ========== */
  const fetchUserLevel = () => {
    const username = getCurrentUsername();
    if (!username) return showNotification('❌ 无法获取当前用户名', 'error');

    let summaryData = null;
    let userData = null;
    let done = 0;
    const checkDone = () => { done++; if (done === 2) processUserData(summaryData, userData, username); };

    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://mjjbox.com/u/${username}/summary.json`,
      timeout: 15000,
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      onload: resp => { if (resp.status === 200) { try { summaryData = JSON.parse(resp.responseText); } catch {} } checkDone(); },
      onerror: checkDone
    });
    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://mjjbox.com/u/${username}.json`,
      timeout: 15000,
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      onload: resp => { if (resp.status === 200) { try { userData = JSON.parse(resp.responseText); } catch {} } checkDone(); },
      onerror: checkDone
    });
  };

  const processUserData = (summaryData, userData, username) => {
    if (!summaryData || !userData) return showNotification('❌ 获取用户数据失败', 'error');

    const user = userData.user || summaryData.users?.[0];
    const userSummary = summaryData.user_summary;

    if (user && typeof user.trust_level === 'number') {
      const level = user.trust_level;
      updateLevelBadge(level, username);
      showNotification(`✅ 等级信息获取成功：LV${level} ${levelNames[level]}`, 'success', 2000);
      const modal = createLevelModal({ level, username, userData: { user, userSummary, gamification_score: user.gamification_score || 0 } });
      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('show'), 10);
    } else {
      showNotification('❌ 无法解析用户等级信息', 'error');
    }
  };

  /* ========== 点赞质量条款检查（隐藏门槛） ========== */
  const LIKE_QUALITY = {
    // 官方隐藏阈值
    minReceivers: 6,        // 收到赞必须来自 ≥6 个不同用户
    minGivingDays: 8,       // 送出赞必须分布在 ≥8 个不同天
    minGivingGapHours: 24,  // 同一自然天内的点赞全部视为 1 天
  };

  /**
   * 获取过去 100 天的点赞原始记录（公开接口，无需权限）
   * 返回 Promise<{
   *    received: Array<{username, created_at}>,
   *    given:    Array<{created_at}>
   * }>
   */
  async function fetchLikeRawRecords(username) {
    console.log('🔍 开始获取点赞记录，用户名:', username);

    const fetchPage = async (url) => {
      console.log('📡 请求URL:', url);
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: url,
          timeout: 15000,
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          onload: (resp) => {
            console.log('📡 响应状态:', resp.status, resp.statusText);
            if (resp.status === 200) {
              try {
                const data = JSON.parse(resp.responseText);
                console.log('📊 响应数据结构:', Object.keys(data));
                console.log('📊 响应数据示例:', resp.responseText.substring(0, 500));
                resolve(data);
              } catch (e) {
                console.error('❌ JSON解析失败:', e, resp.responseText?.substring(0, 500));
                reject(new Error('JSON解析失败'));
              }
            } else {
              console.error(`❌ HTTP错误 ${resp.status}:`, resp.responseText?.substring(0, 200));
              reject(new Error(`HTTP ${resp.status}: ${resp.statusText}`));
            }
          },
          onerror: (error) => {
            console.error('❌ 网络请求失败:', error);
            reject(new Error('网络错误'));
          }
        });
      });
    };

    // 1. 收到的赞 - 使用正确的API路径
    const received = [];
    const receivedUrls = [
      `/user_actions.json?username=${username}&filter=2&offset=0`, // filter=2 是 likes_received
      `/user_actions.json?username=${username}&offset=0`, // 获取所有，然后过滤
    ];

    for (const baseUrl of receivedUrls) {
      try {
        console.log('🔍 尝试获取收到赞:', baseUrl);
        const json = await fetchPage(baseUrl);

        // 尝试多种可能的数据结构
        let actions = json?.user_actions || json?.actions || json?.data || json?.user?.user_actions || [];

        if (actions.length > 0) {
          console.log('📝 收到赞示例数据:', actions[0]);
          console.log('📝 数据字段:', Object.keys(actions[0]));

          // 检查所有action_type
          const actionTypes = [...new Set(actions.map(it => it.action_type))];
          console.log('📊 所有action_type:', actionTypes);

          // 显示前几条记录的详细信息
          actions.slice(0, 3).forEach((item, index) => {
            console.log(`📋 记录${index + 1}: action_type=${item.action_type}, acting_username=${item.acting_username}, target_username=${item.target_username}, username=${item.username}`);
          });

          // 对于收到赞 (action_type=2)，acting_username 是点赞者
          const allLikes = actions.filter(it => it.action_type === 2);
          console.log(`📊 总共找到 ${allLikes.length} 条收到赞记录 (action_type=2)`);

          const pageData = allLikes.map(it => {
            const likerUsername = it.acting_username; // 点赞者用户名
            const targetUsername = it.target_username; // 被点赞者用户名
            console.log(`🔍 收到赞记录: 点赞者=${likerUsername}, 目标用户=${targetUsername}, 当前用户=${username}, 是否自己=${likerUsername === username}`);

            return {
              username: likerUsername,
              created_at: it.created_at || it.date,
              raw: it
            };
          }).filter(item => {
            // 确保点赞者不是自己
            const isValid = item.username && item.username !== username;
            console.log(`🔍 过滤结果: 点赞者=${item.username}, 是否有效=${isValid}`);
            return isValid;
          });

          received.push(...pageData);
          console.log(`✅ 成功获取 ${pageData.length} 条收到赞记录`);
          break; // 成功获取就跳出循环
        } else {
          console.log('⚠️ 该API返回空数据');
        }
      } catch (e) {
        console.warn(`❌ 获取收到赞失败 ${baseUrl}:`, e.message);
        continue; // 尝试下一个URL
      }
    }

    // 2. 送出的赞 - 使用正确的API路径
    const given = [];
    const givenUrls = [
      `/user_actions.json?username=${username}&filter=1&offset=0`, // filter=1 是 likes_given
      `/user_actions.json?username=${username}&offset=0`, // 获取所有，然后过滤
    ];

    for (const baseUrl of givenUrls) {
      try {
        console.log('🔍 尝试获取送出赞:', baseUrl);
        const json = await fetchPage(baseUrl);

        let actions = json?.user_actions || json?.actions || json?.data || json?.user?.user_actions || [];

        if (actions.length > 0) {
          console.log('📝 送出赞示例数据:', actions[0]);
          console.log('📝 数据字段:', Object.keys(actions[0]));

          // 过滤送出赞 (action_type=1)
          const allGiven = actions.filter(it => it.action_type === 1);
          console.log(`📊 总共找到 ${allGiven.length} 条送出赞记录 (action_type=1)`);

          const pageData = allGiven.map(it => ({
            created_at: it.created_at || it.date,
            raw: it
          }));

          given.push(...pageData);
          console.log(`✅ 成功获取 ${pageData.length} 条送出赞记录`);
          break;
        } else {
          console.log('⚠️ 该API返回空数据');
        }
      } catch (e) {
        console.warn(`❌ 获取送出赞失败 ${baseUrl}:`, e.message);
        continue;
      }
    }

    console.log(`📊 最终结果: 收到赞 ${received.length} 条, 送出赞 ${given.length} 条`);

    // 如果API都失败，记录详细错误信息
    if (received.length === 0 && given.length === 0) {
      console.error('❌ 所有API路径都失败，可能的原因:');
      console.error('1. 需要登录状态才能访问API');
      console.error('2. mjjbox.com 的API路径与标准Discourse不同');
      console.error('3. 存在CORS跨域限制');
      console.error('4. API需要特殊的认证头或参数');
      console.error('请检查浏览器控制台的网络请求，看看实际的API响应');
    }

    return { received, given };
  }

  /**
   * 计算点赞质量结果
   * 返回 {receivedOk, givingOk, receiverSet, givingDays}
   */
  function calcLikeQuality({ received, given }, currentUsername = null) {
    console.log('🧮 开始计算点赞质量...');
    console.log('📊 原始数据 - 收到赞:', received?.length, '条, 送出赞:', given?.length, '条');
    console.log('👤 当前用户名:', currentUsername);

    // 过滤收到赞的用户名（排除自己和无效用户名）
    const allReceivedUsernames = received.map(it => it.username);
    console.log('👥 所有收到赞用户名:', allReceivedUsernames.slice(0, 10));

    const validUsernames = received
      .map(it => it.username)
      .filter(username => {
        const isValid = username &&
                        username.trim() !== '' &&
                        username !== currentUsername;
        if (!isValid && username) {
          console.log('❌ 过滤掉用户名:', username, '原因:', username === currentUsername ? '是自己' : '无效');
        }
        return isValid;
      });

    console.log('✅ 有效收到赞用户名:', validUsernames);
    const receiverSet = new Set(validUsernames);
    console.log('👥 去重后的点赞来源用户:', Array.from(receiverSet));

    // 详细分析送出赞的日期
    console.log('🔍 详细分析送出赞数据...');
    console.log('📊 送出赞原始数据总数:', given.length);

    // 显示前10条送出赞的详细信息
    given.slice(0, 10).forEach((item, index) => {
      console.log(`📋 送出赞${index + 1}:`, {
        created_at: item.created_at,
        raw: item.raw ? Object.keys(item.raw) : 'no raw data'
      });
    });

    const allGivenDates = given.map(it => it.created_at);
    console.log('📅 所有送出赞日期 (前20条):', allGivenDates.slice(0, 20));

    const validDates = given
      .map((it, index) => {
        try {
          if (!it.created_at) {
            console.log(`❌ 第${index + 1}条记录缺少created_at:`, it);
            return null;
          }
          const date = new Date(it.created_at).toISOString().slice(0, 10);
          if (index < 5) {
            console.log(`✅ 第${index + 1}条日期解析: ${it.created_at} -> ${date}`);
          }
          return date;
        } catch (e) {
          console.warn(`❌ 第${index + 1}条日期解析失败:`, it.created_at, e);
          return null;
        }
      })
      .filter(Boolean);

    console.log('✅ 有效送出赞日期总数:', validDates.length);
    console.log('📅 所有有效日期 (前20条):', validDates.slice(0, 20));

    const givingDaysSet = new Set(validDates);
    const sortedDays = Array.from(givingDaysSet).sort();
    console.log('📅 去重后的送出赞日期 (全部):', sortedDays);
    console.log('📊 送出赞分布统计:');
    sortedDays.forEach(day => {
      const count = validDates.filter(d => d === day).length;
      console.log(`  ${day}: ${count}次点赞`);
    });

    const result = {
      receivedOk: receiverSet.size >= LIKE_QUALITY.minReceivers,
      givingOk: givingDaysSet.size >= LIKE_QUALITY.minGivingDays,
      receiverSet: receiverSet.size,
      givingDays: givingDaysSet.size,
    };

    console.log('📊 点赞质量计算结果:', result);
    return result;
  }

  /* ========== 等级进度计算 ========== */
  const calculateLevelProgress = (currentLevel, userData) => {
    if (!userData?.userSummary) return { items: [], achievedCount: 0, totalCount: 0 };
    const us = userData.userSummary;
    const u = userData.user;
    const next = currentLevel + 1;
    const req = levelRequirements[next];
    if (!req) return { items: [{ label: '升级方式', current: '联系管理员', required: '手动提升', isMet: false }], achievedCount: 0, totalCount: 1 };

    const items = [];
    let achieved = 0;
    const add = (label, current, required, isTime = false) => {
      const met = current >= required;
      items.push({ label, current, required, isMet: met, percentage: Math.min((current / required) * 100, 100), isTime });
      if (met) achieved++;
    };

    const daysVisited100 = us.days_visited || 0;

    if (req.topics_entered !== undefined) add('阅读主题数', us.topics_entered || 0, req.topics_entered);
    if (req.posts_read !== undefined) add('阅读帖子数', us.posts_read_count || 0, req.posts_read);
    if (req.time_read !== undefined) add('总阅读时间（分钟）', Math.floor((us.time_read || 0) / 60), Math.floor(req.time_read / 60), true);
    if (req.days_visited !== undefined) add('累计访问天数', us.days_visited || 0, req.days_visited);
    if (req.days_visited_in_100 !== undefined) add('过去100天内访问天数', daysVisited100, req.days_visited_in_100);
    if (req.posts_created !== undefined) add('累计发帖数', us.topic_count || 0, req.posts_created);
    if (req.posts_created_in_100 !== undefined) add('过去100天内发帖/回复数', (us.topic_count || 0) + (us.post_count || 0), req.posts_created_in_100);
    if (req.likes_received !== undefined) add('收到赞数', us.likes_received || 0, req.likes_received);
    if (req.likes_given !== undefined) add('送出赞数', us.likes_given || 0, req.likes_given);

    if (req.has_avatar !== undefined) {
      const has = !!(u.avatar_template && !u.avatar_template.includes('letter_avatar') && !u.avatar_template.includes('system_avatar'));
      items.push({ label: '已上传头像', current: has ? '已上传' : '未上传', required: '已上传', isMet: has, isBoolean: true });
      if (has) achieved++;
    }
    if (req.has_bio !== undefined) {
      const has = !!(u.bio_raw && u.bio_raw.trim());
      items.push({ label: '已填写基本资料', current: has ? '已填写' : '未填写', required: '已填写', isMet: has, isBoolean: true });
      if (has) achieved++;
    }

    if (req.flagged_posts_ratio !== undefined) {
      const flaggedRatio = 0;
      items.push({ label: '被举报/隐藏帖子比例', current: `${(flaggedRatio * 100).toFixed(1)}%`, required: `${(req.flagged_posts_ratio * 100).toFixed(0)}% 以内`, isMet: flaggedRatio <= req.flagged_posts_ratio });
      if (flaggedRatio <= req.flagged_posts_ratio) achieved++;
    }

    items.sort((a, b) => (a.isMet ? 1 : -1));
    return { items, achievedCount: achieved, totalCount: items.length };
  };

  /* ========== 等级查看器模态框 ========== */
  const createLevelModal = ({ level, username, userData }) => {
    const modal = document.createElement('div');
    modal.className = 'mjjbox-modal';

    const progress = calculateLevelProgress(level, userData);
    const currentName = levelNames[level] || '未知等级';

    const content = document.createElement('div');
    content.className = 'mjjbox-modal-content mjjbox-level-modal-content';

    const badgeRect = document.querySelector('.mjjbox-level-badge').getBoundingClientRect();
    let top = badgeRect.bottom + 18;
    let right = window.innerWidth - badgeRect.right;
    if (top + 500 > window.innerHeight) top = badgeRect.top - 500 - 18;
    if (right - 420 < 0) right = 10;
    content.style.top = `${top}px`;
    content.style.right = `${right}px`;

    content.innerHTML = `
      <button class="mjjbox-close-btn">&times;</button>
      <div class="mjjbox-level-header">
        <h2 class="mjjbox-level-title">${username}</h2>
        <p class="mjjbox-level-subtitle">当前等级：LV${level} ${currentName}</p>
        <p class="mjjbox-level-score">当前积分：${userData.gamification_score}</p>
      </div>
      <div class="mjjbox-progress-section" id="progress-section">
        <h3>${level >= 4 ? '已达到最高等级' : `晋级到 LV${level + 1} ${levelNames[level + 1]} 的进度（${progress.achievedCount}/${progress.totalCount}）`}</h3>
        <div id="like-quality-loading" style="text-align:center;padding:10px;color:#666;font-size:14px;">
          🔍 正在检查点赞质量条款（隐藏门槛）...
        </div>
        ${progress.items.map(item => {
          const cur = item.isTime ? `${item.current} 分钟` : item.current;
          const need = item.isTime ? `${item.required} 分钟` : item.required;
          const met = item.isMet;
          const icon = met ? '✅' : '❌';
          return `
            <div class="mjjbox-progress-item">
              <span class="mjjbox-progress-label">${item.label}</span>
              <div class="mjjbox-progress-bar-container">
                <div class="mjjbox-progress-bar">
                  <div class="mjjbox-progress-fill ${met ? '' : 'incomplete'}" style="width: ${item.percentage || 0}%"></div>
                </div>
                <span class="mjjbox-progress-required ${met ? '' : 'mjjbox-progress-undone'}">
                  需要：${item.isBoolean ? item.required : need} ${icon}
                </span>
              </div>
              <div class="mjjbox-progress-tooltip">
                当前：<span class="${met ? 'mjjbox-progress-done' : 'mjjbox-progress-undone'}">
                  ${item.isBoolean ? item.current : cur} ${icon}
                </span>
              </div>
            </div>`;
        }).join('')}
        ${progress.items.length === 0 ? '<div style="text-align:center;padding:20px;color:#666;">🎉 恭喜！您已达到最高等级！</div>' : ''}
        <div id="upgrade-suggestion" style="margin-top:16px;padding:12px;background:#f8f9fa;border-radius:6px;font-size:13px;color:#666;display:none;">
        </div>
      </div>
    `;

    modal.appendChild(content);
    setupModalEvents(modal);

    // 异步检查点赞质量条款（仅对LV2用户且有晋级需求时检查）
    if (level === 2 && progress.items.length > 0) {
      checkLikeQuality(username, content, progress);
    } else {
      // 移除加载提示
      const loadingDiv = content.querySelector('#like-quality-loading');
      if (loadingDiv) loadingDiv.remove();
    }

    return modal;
  };

  /* ========== 点赞质量检查函数 ========== */
  const checkLikeQuality = async (username, content, progress) => {
    try {
      console.log('🔍 开始检查点赞质量条款...');
      const likeRaw = await fetchLikeRawRecords(username);
      const likeQ = calcLikeQuality(likeRaw, username);

      console.log('📊 点赞质量检查结果:', {
        receiverCount: likeQ.receiverSet,
        givingDays: likeQ.givingDays,
        receivedOk: likeQ.receivedOk,
        givingOk: likeQ.givingOk
      });

      // 正常显示检查结果
      const likeQualityHtml = `
          <div class="mjjbox-progress-item" style="border-left: 3px solid #ff6b6b; padding-left: 12px; background: #fff5f5;">
            <span class="mjjbox-progress-label">🔍 点赞质量（隐藏门槛）</span>
            <div class="mjjbox-progress-bar-container">
              <div class="mjjbox-progress-bar">
                <div class="mjjbox-progress-fill ${likeQ.receivedOk ? '' : 'incomplete'}" style="width: ${Math.min(100, (likeQ.receiverSet / LIKE_QUALITY.minReceivers) * 100)}%"></div>
              </div>
              <span class="mjjbox-progress-required ${likeQ.receivedOk ? 'mjjbox-progress-done' : 'mjjbox-progress-undone'}">
                收到赞来自 ≥${LIKE_QUALITY.minReceivers} 人 ${likeQ.receivedOk ? '✅' : '❌'}
              </span>
            </div>
            <div class="mjjbox-progress-tooltip">
              当前：<span class="${likeQ.receivedOk ? 'mjjbox-progress-done' : 'mjjbox-progress-undone'}">${likeQ.receiverSet} 人 ${likeQ.receivedOk ? '✅' : '❌'}</span>
            </div>
          </div>

          <div class="mjjbox-progress-item" style="border-left: 3px solid #ff6b6b; padding-left: 12px; background: #fff5f5;">
            <span class="mjjbox-progress-label">📅 送出赞分布天数</span>
            <div class="mjjbox-progress-bar-container">
              <div class="mjjbox-progress-bar">
                <div class="mjjbox-progress-fill ${likeQ.givingOk ? '' : 'incomplete'}" style="width: ${Math.min(100, (likeQ.givingDays / LIKE_QUALITY.minGivingDays) * 100)}%"></div>
              </div>
              <span class="mjjbox-progress-required ${likeQ.givingOk ? 'mjjbox-progress-done' : 'mjjbox-progress-undone'}">
                分布在 ≥${LIKE_QUALITY.minGivingDays} 天 ${likeQ.givingOk ? '✅' : '❌'}
              </span>
            </div>
            <div class="mjjbox-progress-tooltip">
              当前：<span class="${likeQ.givingOk ? 'mjjbox-progress-done' : 'mjjbox-progress-undone'}">${likeQ.givingDays} 天 ${likeQ.givingOk ? '✅' : '❌'}</span>
            </div>
          </div>`;

      // 移除加载提示
      const loadingDiv = content.querySelector('#like-quality-loading');
      if (loadingDiv) loadingDiv.remove();

      // 把新增 HTML 插到进度列表最前面
      const section = content.querySelector('.mjjbox-progress-section');
      const firstItem = section.querySelector('.mjjbox-progress-item');
      if (firstItem) {
        firstItem.insertAdjacentHTML('beforebegin', likeQualityHtml);
      } else {
        const h3 = section.querySelector('h3');
        if (h3) {
          h3.insertAdjacentHTML('afterend', likeQualityHtml);
        }
      }

      // 生成升级建议
      generateUpgradeSuggestion(content, progress, likeQ);

    } catch (e) {
      console.error('❌ 点赞质量检查异常:', e);
      const loadingDiv = content.querySelector('#like-quality-loading');
      if (loadingDiv) {
        loadingDiv.innerHTML = `⚠️ 点赞质量检查失败: ${e.message}<br><small style="color:#999;">请查看浏览器控制台获取详细信息</small>`;
        loadingDiv.style.color = '#f56565';
      }
    }
  };

  /* ========== 升级建议生成 ========== */
  const generateUpgradeSuggestion = (content, progress, likeQ) => {
    const suggestionDiv = content.querySelector('#upgrade-suggestion');
    if (!suggestionDiv) return;

    const allBasicMet = progress.achievedCount === progress.totalCount;
    const allLikeQualityMet = likeQ.receivedOk && likeQ.givingOk;

    let suggestion = '';
    let bgColor = '#f8f9fa';
    let textColor = '#666';

    if (allBasicMet && allLikeQualityMet) {
      // 所有条件都满足但仍未晋级
      suggestion = `
        <div style="color: #e53e3e; font-weight: 600; margin-bottom: 8px;">⚠️ 所有条件已满足，但仍无法晋级</div>
        <div style="margin-bottom: 6px;"><strong>可能原因：</strong></div>
        <div>• 管理员启用了「等级锁定」插件（Trust Level Locks）</div>
        <div>• 系统未刷新等级状态，尝试重新登录或发帖触发</div>
        <div>• 存在被隐藏的帖子影响了举报比例</div>
        <div style="margin-top: 8px; color: #3182ce;"><strong>建议：</strong>私信管理员确认是否启用等级锁定</div>
      `;
      bgColor = '#fed7d7';
      textColor = '#742a2a';
    } else if (allBasicMet && !allLikeQualityMet) {
      // 基础条件满足但点赞质量不达标
      const issues = [];
      if (!likeQ.receivedOk) {
        issues.push(`收到赞来源不够分散（需要${LIKE_QUALITY.minReceivers}人，当前${likeQ.receiverSet}人）`);
      }
      if (!likeQ.givingOk) {
        issues.push(`送出赞时间分布不够（需要${LIKE_QUALITY.minGivingDays}天，当前${likeQ.givingDays}天）`);
      }

      suggestion = `
        <div style="color: #d69e2e; font-weight: 600; margin-bottom: 8px;">🔍 发现隐藏门槛问题</div>
        <div style="margin-bottom: 6px;"><strong>问题：</strong></div>
        ${issues.map(issue => `<div>• ${issue}</div>`).join('')}
        <div style="margin-top: 8px; color: #3182ce;"><strong>建议：</strong></div>
        <div>• 与更多不同用户互动，获得分散的点赞</div>
        <div>• 每天适量点赞，避免集中在少数几天</div>
        <div>• 暂停点赞3天后重新登录触发系统重评</div>
      `;
      bgColor = '#faf089';
      textColor = '#744210';
    } else {
      // 基础条件未满足
      const unmetItems = progress.items.filter(item => !item.isMet);
      if (unmetItems.length > 0) {
        suggestion = `
          <div style="color: #3182ce; font-weight: 600; margin-bottom: 8px;">📋 还需完成以下基础条件</div>
          ${unmetItems.slice(0, 3).map(item => {
            const cur = item.isTime ? `${item.current} 分钟` : item.current;
            const need = item.isTime ? `${item.required} 分钟` : item.required;
            const diff = item.isTime ?
              `还需 ${item.required - item.current} 分钟` :
              `还需 ${item.required - item.current}`;
            return `<div>• ${item.label}：${cur}/${need} ${item.isBoolean ? '' : `(${diff})`}</div>`;
          }).join('')}
          ${unmetItems.length > 3 ? `<div>• 还有 ${unmetItems.length - 3} 项条件...</div>` : ''}
        `;
        bgColor = '#e6fffa';
        textColor = '#234e52';
      }
    }

    if (suggestion) {
      suggestionDiv.innerHTML = suggestion;
      suggestionDiv.style.backgroundColor = bgColor;
      suggestionDiv.style.color = textColor;
      suggestionDiv.style.display = 'block';
    }
  };

  /* ========== 设置面板 ========== */
  const openSettingsModal = () => {
    console.log('🔧 打开设置面板');
    const modal = createSettingsModal();
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
  };

  const createSettingsModal = () => {
    const modal = document.createElement('div');
    modal.className = 'mjjbox-modal';

    const content = document.createElement('div');
    content.className = 'mjjbox-modal-content mjjbox-settings-modal-content';
    content.style.top = '50%';
    content.style.left = '50%';
    content.style.transform = 'translate(-50%, -50%)';

    content.innerHTML = `
      <button class="mjjbox-close-btn">&times;</button>
      <div class="mjjbox-settings-header">
        <h2 class="mjjbox-settings-title">MJJBOX 增强设置</h2>
        <p class="mjjbox-settings-subtitle">自定义您的论坛外观和体验</p>
      </div>

      <div class="mjjbox-settings-tabs">
        <button class="mjjbox-settings-tab active" data-tab="background">背景设置</button>
        <button class="mjjbox-settings-tab" data-tab="font">字体设置</button>
        <button class="mjjbox-settings-tab" data-tab="theme">主题设置</button>
        <button class="mjjbox-settings-tab" data-tab="about">关于</button>
      </div>

      <div class="mjjbox-settings-content">
        <!-- 背景设置面板 -->
        <div class="mjjbox-settings-panel active" id="background-panel">
          <div class="mjjbox-form-check">
            <input type="checkbox" id="bg-enabled" ${currentConfig.background.enabled ? 'checked' : ''}>
            <label for="bg-enabled">启用自定义背景</label>
          </div>

          <div class="mjjbox-form-group">
            <label class="mjjbox-form-label">背景图片URL</label>
            <input type="url" class="mjjbox-form-control" id="bg-url" value="${currentConfig.background.imageUrl}" placeholder="https://example.com/image.jpg">
          </div>

          <div class="mjjbox-form-group">
            <label class="mjjbox-form-label">本地图片上传</label>
            <div class="mjjbox-file-input-wrapper">
              <input type="file" class="mjjbox-file-input" id="bg-file" accept="image/*">
              <label for="bg-file" class="mjjbox-file-input-label">📁 选择本地图片</label>
            </div>
          </div>

          <div class="mjjbox-form-row">
            <div class="mjjbox-form-col">
              <label class="mjjbox-form-label">显示模式</label>
              <select class="mjjbox-form-control" id="bg-mode">
                <option value="cover" ${currentConfig.background.mode === 'cover' ? 'selected' : ''}>覆盖</option>
                <option value="contain" ${currentConfig.background.mode === 'contain' ? 'selected' : ''}>包含</option>
                <option value="repeat" ${currentConfig.background.mode === 'repeat' ? 'selected' : ''}>平铺</option>
                <option value="no-repeat" ${currentConfig.background.mode === 'no-repeat' ? 'selected' : ''}>不重复</option>
              </select>
            </div>
            <div class="mjjbox-form-col">
              <label class="mjjbox-form-label">透明度 (${currentConfig.background.opacity})</label>
              <input type="range" class="mjjbox-form-control" id="bg-opacity" min="0" max="1" step="0.1" value="${currentConfig.background.opacity}">
            </div>
          </div>

          <div class="mjjbox-form-row">
            <div class="mjjbox-form-col">
              <label class="mjjbox-form-label">模糊程度 (${currentConfig.background.blur}px)</label>
              <input type="range" class="mjjbox-form-control" id="bg-blur" min="0" max="20" step="1" value="${currentConfig.background.blur}">
            </div>
            <div class="mjjbox-form-col">
              <label class="mjjbox-form-label">遮罩透明度 (${currentConfig.background.overlayOpacity})</label>
              <input type="range" class="mjjbox-form-control" id="bg-overlay-opacity" min="0" max="1" step="0.1" value="${currentConfig.background.overlayOpacity}">
            </div>
          </div>

          <div class="mjjbox-form-group">
            <label class="mjjbox-form-label">遮罩颜色</label>
            <input type="color" class="mjjbox-form-control" id="bg-overlay-color" value="${currentConfig.background.overlayColor}">
            <span class="mjjbox-color-preview" style="background-color: ${currentConfig.background.overlayColor}"></span>
          </div>
        </div>

        <!-- 字体设置面板 -->
        <div class="mjjbox-settings-panel" id="font-panel">
          <div class="mjjbox-form-check">
            <input type="checkbox" id="font-enabled" ${currentConfig.font.enabled ? 'checked' : ''}>
            <label for="font-enabled">启用自定义字体</label>
          </div>

          <div class="mjjbox-form-group">
            <label class="mjjbox-form-label">字体族</label>
            <select class="mjjbox-form-control" id="font-family">
              <option value="inherit" ${currentConfig.font.family === 'inherit' ? 'selected' : ''}>默认</option>
              <option value="'Microsoft YaHei', sans-serif" ${currentConfig.font.family === "'Microsoft YaHei', sans-serif" ? 'selected' : ''}>微软雅黑</option>
              <option value="'PingFang SC', sans-serif" ${currentConfig.font.family === "'PingFang SC', sans-serif" ? 'selected' : ''}>苹方</option>
              <option value="'Source Han Sans', sans-serif" ${currentConfig.font.family === "'Source Han Sans', sans-serif" ? 'selected' : ''}>思源黑体</option>
              <option value="'Noto Sans CJK SC', sans-serif" ${currentConfig.font.family === "'Noto Sans CJK SC', sans-serif" ? 'selected' : ''}>Noto Sans</option>
              <option value="'DouyinSans', 'Microsoft YaHei', sans-serif" ${currentConfig.font.family === "'DouyinSans', 'Microsoft YaHei', sans-serif" ? 'selected' : ''}>抖音美好体</option>
              <option value="Georgia, serif" ${currentConfig.font.family === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
              <option value="'Times New Roman', serif" ${currentConfig.font.family === "'Times New Roman', serif" ? 'selected' : ''}>Times New Roman</option>
              <option value="'Courier New', monospace" ${currentConfig.font.family === "'Courier New', monospace" ? 'selected' : ''}>Courier New</option>
            </select>
          </div>

          <div class="mjjbox-form-row">
            <div class="mjjbox-form-col">
              <label class="mjjbox-form-label">字体大小</label>
              <select class="mjjbox-form-control" id="font-size">
                <option value="inherit" ${currentConfig.font.size === 'inherit' ? 'selected' : ''}>默认</option>
                <option value="12px" ${currentConfig.font.size === '12px' ? 'selected' : ''}>12px</option>
                <option value="14px" ${currentConfig.font.size === '14px' ? 'selected' : ''}>14px</option>
                <option value="16px" ${currentConfig.font.size === '16px' ? 'selected' : ''}>16px</option>
                <option value="18px" ${currentConfig.font.size === '18px' ? 'selected' : ''}>18px</option>
                <option value="20px" ${currentConfig.font.size === '20px' ? 'selected' : ''}>20px</option>
              </select>
            </div>
            <div class="mjjbox-form-col">
              <label class="mjjbox-form-label">字体粗细</label>
              <select class="mjjbox-form-control" id="font-weight">
                <option value="inherit" ${currentConfig.font.weight === 'inherit' ? 'selected' : ''}>默认</option>
                <option value="300" ${currentConfig.font.weight === '300' ? 'selected' : ''}>细体</option>
                <option value="400" ${currentConfig.font.weight === '400' ? 'selected' : ''}>正常</option>
                <option value="500" ${currentConfig.font.weight === '500' ? 'selected' : ''}>中等</option>
                <option value="600" ${currentConfig.font.weight === '600' ? 'selected' : ''}>半粗</option>
                <option value="700" ${currentConfig.font.weight === '700' ? 'selected' : ''}>粗体</option>
              </select>
            </div>
          </div>

          <div class="mjjbox-form-row">
            <div class="mjjbox-form-col">
              <label class="mjjbox-form-label">字体颜色</label>
              <input type="color" class="mjjbox-form-control" id="font-color" value="${currentConfig.font.color === 'inherit' ? '#333333' : currentConfig.font.color}">
              <span class="mjjbox-color-preview" style="background-color: ${currentConfig.font.color === 'inherit' ? '#333333' : currentConfig.font.color}"></span>
            </div>
            <div class="mjjbox-form-col">
              <label class="mjjbox-form-label">行高</label>
              <select class="mjjbox-form-control" id="font-line-height">
                <option value="inherit" ${currentConfig.font.lineHeight === 'inherit' ? 'selected' : ''}>默认</option>
                <option value="1.2" ${currentConfig.font.lineHeight === '1.2' ? 'selected' : ''}>1.2</option>
                <option value="1.4" ${currentConfig.font.lineHeight === '1.4' ? 'selected' : ''}>1.4</option>
                <option value="1.6" ${currentConfig.font.lineHeight === '1.6' ? 'selected' : ''}>1.6</option>
                <option value="1.8" ${currentConfig.font.lineHeight === '1.8' ? 'selected' : ''}>1.8</option>
                <option value="2.0" ${currentConfig.font.lineHeight === '2.0' ? 'selected' : ''}>2.0</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 主题设置面板 -->
        <div class="mjjbox-settings-panel" id="theme-panel">
          <div class="mjjbox-form-check">
            <input type="checkbox" id="theme-enabled" ${currentConfig.theme.enabled ? 'checked' : ''}>
            <label for="theme-enabled">启用自定义主题</label>
          </div>

          <div class="mjjbox-form-row">
            <div class="mjjbox-form-col">
              <label class="mjjbox-form-label">主色调</label>
              <input type="color" class="mjjbox-form-control" id="theme-primary" value="${currentConfig.theme.primaryColor}">
              <span class="mjjbox-color-preview" style="background-color: ${currentConfig.theme.primaryColor}"></span>
            </div>
            <div class="mjjbox-form-col">
              <label class="mjjbox-form-label">次要色</label>
              <input type="color" class="mjjbox-form-control" id="theme-secondary" value="${currentConfig.theme.secondaryColor}">
              <span class="mjjbox-color-preview" style="background-color: ${currentConfig.theme.secondaryColor}"></span>
            </div>
          </div>

          <div class="mjjbox-form-row">
            <div class="mjjbox-form-col">
              <label class="mjjbox-form-label">强调色</label>
              <input type="color" class="mjjbox-form-control" id="theme-accent" value="${currentConfig.theme.accentColor}">
              <span class="mjjbox-color-preview" style="background-color: ${currentConfig.theme.accentColor}"></span>
            </div>
            <div class="mjjbox-form-col">
              <label class="mjjbox-form-label">圆角大小</label>
              <select class="mjjbox-form-control" id="theme-radius">
                <option value="0px" ${currentConfig.theme.borderRadius === '0px' ? 'selected' : ''}>无圆角</option>
                <option value="4px" ${currentConfig.theme.borderRadius === '4px' ? 'selected' : ''}>小圆角</option>
                <option value="8px" ${currentConfig.theme.borderRadius === '8px' ? 'selected' : ''}>中圆角</option>
                <option value="12px" ${currentConfig.theme.borderRadius === '12px' ? 'selected' : ''}>大圆角</option>
                <option value="20px" ${currentConfig.theme.borderRadius === '20px' ? 'selected' : ''}>超大圆角</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 关于面板 -->
        <div class="mjjbox-settings-panel" id="about-panel">
          <div style="text-align: center; padding: 20px;">
            <h3 style="color: #333; margin-bottom: 16px;">MJJBOX 增强助手 v2.7</h3>
            <p style="color: #666; margin-bottom: 20px;">整合等级查看器与自定义美化功能</p>

            <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
              <h4 style="color: #333; margin-bottom: 12px;">功能特性：</h4>
              <ul style="color: #666; margin: 0; padding-left: 20px;">
                <li>🎯 等级进度查看器（完整官方条件）</li>
                <li>🖼️ 自定义背景图片</li>
                <li>✏️ 字体样式自定义</li>
                <li>🎨 主题色彩调整</li>
                <li>💾 配置自动保存</li>
                <li>📱 响应式设计</li>
              </ul>
            </div>

            <div style="background: #e3f2fd; padding: 12px; border-radius: 6px; color: #1565c0; font-size: 14px;">
              💡 提示：所有设置会自动保存到Tampermonkey存储
            </div>
          </div>
        </div>
      </div>

      <div class="mjjbox-settings-actions">
        <button class="mjjbox-btn mjjbox-btn-danger" id="reset-btn">重置设置</button>
        <button class="mjjbox-btn mjjbox-btn-secondary" id="preview-btn">预览效果</button>
        <button class="mjjbox-btn mjjbox-btn-primary" id="save-btn">保存设置</button>
      </div>
    `;

    modal.appendChild(content);
    setupModalEvents(modal);
    setupSettingsEvents(content);
    return modal;
  };

  /* ========== 设置面板事件处理 ========== */
  const setupSettingsEvents = (content) => {
    console.log('🔧 设置事件绑定');

    // 标签页切换
    const tabs = content.querySelectorAll('.mjjbox-settings-tab');
    const panels = content.querySelectorAll('.mjjbox-settings-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        console.log('切换标签页:', tab.dataset.tab);
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPanel = content.querySelector(`#${tab.dataset.tab}-panel`);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // 文件上传处理
    const fileInput = content.querySelector('#bg-file');
    if (fileInput) {
      fileInput.addEventListener('change', handleFileUpload);
    }

    // 颜色预览更新
    const colorInputs = content.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const preview = e.target.nextElementSibling;
        if (preview && preview.classList.contains('mjjbox-color-preview')) {
          preview.style.backgroundColor = e.target.value;
        }
      });
    });

    // 滑块值显示更新
    const rangeInputs = content.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const label = e.target.previousElementSibling;
        if (label) {
          const baseText = label.textContent.split(' (')[0];
          const unit = e.target.id.includes('opacity') ? '' : (e.target.id.includes('blur') ? 'px' : '');
          label.textContent = `${baseText} (${e.target.value}${unit})`;
        }
      });
    });

    // 按钮事件绑定
    const saveBtn = content.querySelector('#save-btn');
    const resetBtn = content.querySelector('#reset-btn');
    const previewBtn = content.querySelector('#preview-btn');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        console.log('🔧 点击保存按钮');
        saveSettings();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        console.log('🔧 点击重置按钮');
        resetSettings();
      });
    }

    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        console.log('🔧 点击预览按钮');
        previewChanges();
      });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('❌ 请选择图片文件', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const urlInput = document.querySelector('#bg-url');
      if (urlInput) {
        urlInput.value = event.target.result;
        showNotification('✅ 图片已加载', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const previewChanges = () => {
    console.log('👀 开始预览更改');

    // 收集当前设置
    const tempConfig = { ...currentConfig };

    // 背景设置
    const bgEnabled = document.querySelector('#bg-enabled');
    const bgUrl = document.querySelector('#bg-url');
    const bgMode = document.querySelector('#bg-mode');
    const bgOpacity = document.querySelector('#bg-opacity');
    const bgBlur = document.querySelector('#bg-blur');
    const bgOverlayOpacity = document.querySelector('#bg-overlay-opacity');
    const bgOverlayColor = document.querySelector('#bg-overlay-color');

    if (bgEnabled) tempConfig.background.enabled = bgEnabled.checked;
    if (bgUrl) tempConfig.background.imageUrl = bgUrl.value;
    if (bgMode) tempConfig.background.mode = bgMode.value;
    if (bgOpacity) tempConfig.background.opacity = parseFloat(bgOpacity.value);
    if (bgBlur) tempConfig.background.blur = parseInt(bgBlur.value);
    if (bgOverlayOpacity) tempConfig.background.overlayOpacity = parseFloat(bgOverlayOpacity.value);
    if (bgOverlayColor) tempConfig.background.overlayColor = bgOverlayColor.value;

    // 字体设置
    const fontEnabled = document.querySelector('#font-enabled');
    const fontFamily = document.querySelector('#font-family');
    const fontSize = document.querySelector('#font-size');
    const fontWeight = document.querySelector('#font-weight');
    const fontColor = document.querySelector('#font-color');
    const fontLineHeight = document.querySelector('#font-line-height');

    if (fontEnabled) tempConfig.font.enabled = fontEnabled.checked;
    if (fontFamily) tempConfig.font.family = fontFamily.value;
    if (fontSize) tempConfig.font.size = fontSize.value;
    if (fontWeight) tempConfig.font.weight = fontWeight.value;
    if (fontColor) {
      const colorValue = fontColor.value;
      tempConfig.font.color = (colorValue && colorValue !== '#333333') ? colorValue : 'inherit';
    }
    if (fontLineHeight) tempConfig.font.lineHeight = fontLineHeight.value;

    // 主题设置
    const themeEnabled = document.querySelector('#theme-enabled');
    const themePrimary = document.querySelector('#theme-primary');
    const themeSecondary = document.querySelector('#theme-secondary');
    const themeAccent = document.querySelector('#theme-accent');
    const themeRadius = document.querySelector('#theme-radius');

    if (themeEnabled) tempConfig.theme.enabled = themeEnabled.checked;
    if (themePrimary) tempConfig.theme.primaryColor = themePrimary.value;
    if (themeSecondary) tempConfig.theme.secondaryColor = themeSecondary.value;
    if (themeAccent) tempConfig.theme.accentColor = themeAccent.value;
    if (themeRadius) tempConfig.theme.borderRadius = themeRadius.value;

    // 临时应用样式
    const oldConfig = { ...currentConfig };
    currentConfig = tempConfig;
    applyCustomStyles();
    currentConfig = oldConfig;

    showNotification('👀 预览效果已应用（临时）', 'info');
  };

  const saveSettings = () => {
    console.log('💾 开始保存设置');

    // 收集所有设置
    const bgEnabled = document.querySelector('#bg-enabled');
    const bgUrl = document.querySelector('#bg-url');
    const bgMode = document.querySelector('#bg-mode');
    const bgOpacity = document.querySelector('#bg-opacity');
    const bgBlur = document.querySelector('#bg-blur');
    const bgOverlayOpacity = document.querySelector('#bg-overlay-opacity');
    const bgOverlayColor = document.querySelector('#bg-overlay-color');

    const fontEnabled = document.querySelector('#font-enabled');
    const fontFamily = document.querySelector('#font-family');
    const fontSize = document.querySelector('#font-size');
    const fontWeight = document.querySelector('#font-weight');
    const fontColor = document.querySelector('#font-color');
    const fontLineHeight = document.querySelector('#font-line-height');

    const themeEnabled = document.querySelector('#theme-enabled');
    const themePrimary = document.querySelector('#theme-primary');
    const themeSecondary = document.querySelector('#theme-secondary');
    const themeAccent = document.querySelector('#theme-accent');
    const themeRadius = document.querySelector('#theme-radius');

    // 更新配置对象
    if (bgEnabled) currentConfig.background.enabled = bgEnabled.checked;
    if (bgUrl) currentConfig.background.imageUrl = bgUrl.value;
    if (bgMode) currentConfig.background.mode = bgMode.value;
    if (bgOpacity) currentConfig.background.opacity = parseFloat(bgOpacity.value);
    if (bgBlur) currentConfig.background.blur = parseInt(bgBlur.value);
    if (bgOverlayOpacity) currentConfig.background.overlayOpacity = parseFloat(bgOverlayOpacity.value);
    if (bgOverlayColor) currentConfig.background.overlayColor = bgOverlayColor.value;

    if (fontEnabled) currentConfig.font.enabled = fontEnabled.checked;
    if (fontFamily) currentConfig.font.family = fontFamily.value;
    if (fontSize) currentConfig.font.size = fontSize.value;
    if (fontWeight) currentConfig.font.weight = fontWeight.value;
    if (fontColor) {
      const colorValue = fontColor.value;
      currentConfig.font.color = (colorValue && colorValue !== '#333333') ? colorValue : 'inherit';
    }
    if (fontLineHeight) currentConfig.font.lineHeight = fontLineHeight.value;

    if (themeEnabled) currentConfig.theme.enabled = themeEnabled.checked;
    if (themePrimary) currentConfig.theme.primaryColor = themePrimary.value;
    if (themeSecondary) currentConfig.theme.secondaryColor = themeSecondary.value;
    if (themeAccent) currentConfig.theme.accentColor = themeAccent.value;
    if (themeRadius) currentConfig.theme.borderRadius = themeRadius.value;

    // 保存到GM存储
    if (!saveConfig()) {
      showNotification('❌ 保存失败', 'error');
      return;
    }

    // 立即应用样式
    applyCustomStyles();

    // 关闭模态框
    const modal = document.querySelector('.mjjbox-modal.show');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }

    showNotification('✅ 设置已保存并应用', 'success');
  };

  const resetSettings = () => {
    console.log('🔄 开始重置设置');

    if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
      // 重置配置对象
      currentConfig = JSON.parse(JSON.stringify(defaultConfig));

      // 清除GM存储
      if (!clearConfig()) {
        showNotification('❌ 重置失败', 'error');
        return;
      }

      // 立即应用重置后的样式
      applyCustomStyles();

      const modal = document.querySelector('.mjjbox-modal.show');
      if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
      }

      showNotification('✅ 设置已重置', 'success');

      // 延迟刷新页面以完全重置
      setTimeout(() => {
        location.reload();
      }, 1500);
    }
  };

  /* ========== 模态框通用事件处理 ========== */
  const setupModalEvents = (modal) => {
    const closeBtn = modal.querySelector('.mjjbox-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
      }
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  };

  /* ========== 初始化 ========== */
  const init = () => {
    console.log('🚀 MJJBOX 增强助手开始初始化...');

    // 应用基础样式
    GM_addStyle(baseStyles);

    // 加载配置
    loadConfig();

    // 创建UI元素
    createLevelBadge();
    createSettingsButton();

    // 应用自定义样式
    setTimeout(() => {
      applyCustomStyles();
      console.log('✅ 初始化完成');
    }, 1000);

    // 定期重新应用样式，确保样式持续生效
    setInterval(() => {
      if (currentConfig.background.enabled || currentConfig.font.enabled || currentConfig.theme.enabled) {
        applyCustomStyles();
      }
    }, 5000);
  };

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

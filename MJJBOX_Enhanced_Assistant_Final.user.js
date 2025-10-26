// ==UserScript==
// @name         MJJBOX增强助手
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  完整版本 + 科技风格主题 + 详细等级查看 + 动态升级条件 + TL3快捷入口
// @author       Exia
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

  console.log('🚀 MJJBOX增强助手启动 v2.1');

  /* ========== 全局变量 ========== */
  let currentUserId = null;
  let currentUsername = null;

  /* ========== 等级名称（与官方同步） ========== */
  const levelNames = {
    0: '青铜会员',
    1: '白银会员',
    2: '黄金会员',
    3: '钻石会员',
    4: '星曜会员'
  };

  /* ========== 官方默认晋级条件（作为备份） ========== */
  const defaultLevelRequirements = {
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

  let levelRequirements = { ...defaultLevelRequirements };

  /* ========== 动态获取升级条件 ========== */
  const fetchLevelRequirements = async () => {
    try {
      console.log('🔄 尝试动态获取升级条件配置...');

      // 先检查缓存（24小时有效）
      const cachedConfig = GM_getValue('mjjbox_level_requirements');
      const cachedTime = GM_getValue('mjjbox_level_requirements_time');

      if (cachedConfig && cachedTime) {
        const now = Date.now();
        const cacheAge = now - cachedTime;
        const oneDay = 24 * 60 * 60 * 1000;

        if (cacheAge < oneDay) {
          console.log('✅ 使用缓存的升级条件配置');
          levelRequirements = JSON.parse(cachedConfig);
          return levelRequirements;
        }
      }

      // 尝试从站点设置获取
      const siteSettings = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: 'https://mjjbox.com/admin/site_settings.json?filter_names=tl1_requires_topics_entered,tl1_requires_read_posts,tl1_requires_time_spent_mins,tl2_requires_topics_entered,tl2_requires_read_posts,tl2_requires_time_spent_mins,tl2_requires_days_visited,tl2_requires_likes_received,tl2_requires_likes_given,tl2_requires_topic_reply_count,tl3_requires_days_visited,tl3_requires_topics_replied_to,tl3_requires_topics_viewed,tl3_requires_posts_read,tl3_requires_topics_viewed_all_time,tl3_requires_posts_read_all_time,tl3_requires_max_flagged_posts,tl3_requires_likes_given,tl3_requires_likes_received,tl3_requires_max_flagged_by_users_time_window',
          timeout: 10000,
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          onload: (resp) => {
            if (resp.status === 200) {
              try {
                const data = JSON.parse(resp.responseText);
                resolve(data);
              } catch (e) {
                reject(e);
              }
            } else {
              reject(new Error(`HTTP ${resp.status}`));
            }
          },
          onerror: reject,
          ontimeout: reject
        });
      });

      if (siteSettings && siteSettings.site_settings) {
        console.log('✅ 成功获取站点设置');

        const settings = siteSettings.site_settings;
        const newRequirements = { ...defaultLevelRequirements };

        // 解析 TL1 要求
        settings.forEach(setting => {
          if (setting.setting === 'tl1_requires_topics_entered') {
            newRequirements[1].topics_entered = setting.value;
          } else if (setting.setting === 'tl1_requires_read_posts') {
            newRequirements[1].posts_read = setting.value;
          } else if (setting.setting === 'tl1_requires_time_spent_mins') {
            newRequirements[1].time_read = setting.value * 60;
          }
          // TL2 要求
          else if (setting.setting === 'tl2_requires_topics_entered') {
            newRequirements[2].topics_entered = setting.value;
          } else if (setting.setting === 'tl2_requires_read_posts') {
            newRequirements[2].posts_read = setting.value;
          } else if (setting.setting === 'tl2_requires_time_spent_mins') {
            newRequirements[2].time_read = setting.value * 60;
          } else if (setting.setting === 'tl2_requires_days_visited') {
            newRequirements[2].days_visited = setting.value;
          } else if (setting.setting === 'tl2_requires_likes_received') {
            newRequirements[2].likes_received = setting.value;
          } else if (setting.setting === 'tl2_requires_likes_given') {
            newRequirements[2].likes_given = setting.value;
          } else if (setting.setting === 'tl2_requires_topic_reply_count') {
            newRequirements[2].posts_created = setting.value;
          }
          // TL3 要求
          else if (setting.setting === 'tl3_requires_days_visited') {
            newRequirements[3].days_visited_in_100 = setting.value;
          } else if (setting.setting === 'tl3_requires_topics_viewed') {
            newRequirements[3].topics_entered = setting.value;
          } else if (setting.setting === 'tl3_requires_posts_read') {
            newRequirements[3].posts_read = setting.value;
          } else if (setting.setting === 'tl3_requires_topics_replied_to') {
            newRequirements[3].posts_created_in_100 = setting.value;
          } else if (setting.setting === 'tl3_requires_likes_received') {
            newRequirements[3].likes_received = setting.value;
          } else if (setting.setting === 'tl3_requires_likes_given') {
            newRequirements[3].likes_given = setting.value;
          }
        });

        levelRequirements = newRequirements;

        // 缓存配置
        GM_setValue('mjjbox_level_requirements', JSON.stringify(newRequirements));
        GM_setValue('mjjbox_level_requirements_time', Date.now());

        console.log('✅ 动态升级条件已更新并缓存:', levelRequirements);
        return levelRequirements;
      }

    } catch (error) {
      console.log('⚠️ 动态获取升级条件失败，使用默认配置:', error.message);
    }

    return levelRequirements;
  };

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
      style: 'tech',
      primaryColor: '#00d4ff',
      secondaryColor: '#1a1a2e',
      accentColor: '#ff6b6b',
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
      GM_setValue('mjjbox_theme_style', currentConfig.theme.style);
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
      currentConfig.theme.style = GM_getValue('mjjbox_theme_style', 'tech');
      currentConfig.theme.primaryColor = GM_getValue('mjjbox_theme_primary', '#00d4ff');
      currentConfig.theme.secondaryColor = GM_getValue('mjjbox_theme_secondary', '#1a1a2e');
      currentConfig.theme.accentColor = GM_getValue('mjjbox_theme_accent', '#ff6b6b');
      currentConfig.theme.borderRadius = GM_getValue('mjjbox_theme_radius', '8px');

      console.log('✅ 配置加载完成:', currentConfig);
      return true;
    } catch (e) {
      console.error('❌ 加载配置失败:', e);
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
      /* 🎨 字体加载 */
      @font-face {
        font-family: 'DouyinSans';
        src: url('https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/douyinsans/1.0.0/DouyinSans-Regular.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: 'JetBrains Mono';
        src: url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
        font-display: swap;
      }
    `;

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
        body:not(.mjjbox-modal) .ember-application,
        body:not(.mjjbox-modal) #main-outlet,
        body:not(.mjjbox-modal) .topic-post,
        body:not(.mjjbox-modal) .cooked {
          ${fontFamily ? `font-family: ${fontFamily} !important;` : ''}
          ${fontSize ? `font-size: ${fontSize} !important;` : ''}
          ${fontWeight ? `font-weight: ${fontWeight} !important;` : ''}
          ${fontColor ? `color: ${fontColor} !important;` : ''}
          ${lineHeight ? `line-height: ${lineHeight} !important;` : ''}
        }

        .mjjbox-level-panel,
        .mjjbox-modal,
        .mjjbox-notification,
        .mjjbox-floating-btn {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          color: #495057 !important;
        }
      `;
    }

    // 主题样式
    if (currentConfig.theme.enabled) {
      console.log('🎨 应用主题样式:', currentConfig.theme);
      const theme = currentConfig.theme;

      if (theme.style === 'tech') {
        // 科技风格主题
        customCSS += `
          /* 🚀 科技风格主题 */
          :root {
            --tech-primary: ${theme.primaryColor};
            --tech-secondary: ${theme.secondaryColor};
            --tech-accent: ${theme.accentColor};
            --tech-radius: ${theme.borderRadius};
          }

          /* 整体背景 - 根据是否有自定义背景决定 */
        `;

        // 根据是否启用自定义背景来决定科技风格的背景
        if (!currentConfig.background.enabled || !currentConfig.background.imageUrl) {
          // 没有自定义背景时，使用科技风格背景
          customCSS += `
          body, .ember-application {
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%) !important;
            color: #e0e6ed !important;
          }
          `;
        } else {
          // 有自定义背景时，确保不覆盖背景图片
          customCSS += `
          body {
            color: #e0e6ed !important;
          }
          .ember-application {
            background: transparent !important;
            color: #e0e6ed !important;
          }
          `;
        }

        customCSS += `

          /* 导航栏科技化 */
          .d-header {
            background: linear-gradient(90deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%) !important;
            backdrop-filter: blur(10px) !important;
            border-bottom: 2px solid var(--tech-primary) !important;
            box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3) !important;
          }

          /* 链接和按钮 */
          a, .btn, button {
            color: var(--tech-primary) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }

          a:hover, .btn:hover, button:hover {
            color: #ffffff !important;
            text-shadow: 0 0 10px var(--tech-primary) !important;
            transform: translateY(-1px) !important;
          }

          /* 主要按钮 */
          .btn-primary, .btn-default {
            background: linear-gradient(45deg, var(--tech-primary), var(--tech-accent)) !important;
            border: 1px solid var(--tech-primary) !important;
            border-radius: var(--tech-radius) !important;
            box-shadow: 0 4px 15px rgba(0, 212, 255, 0.4) !important;
            position: relative !important;
            overflow: hidden !important;
          }

          .btn-primary::before, .btn-default::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
          }

          .btn-primary:hover::before, .btn-default:hover::before {
            left: 100%;
          }

          /* 主题列表 */
          .topic-list-item, .latest-topic-list-item {
            background: rgba(26, 26, 46, 0.6) !important;
            border: 1px solid rgba(0, 212, 255, 0.2) !important;
            border-radius: var(--tech-radius) !important;
            margin-bottom: 8px !important;
            transition: all 0.3s ease !important;
            backdrop-filter: blur(5px) !important;
          }

          .topic-list-item:hover, .latest-topic-list-item:hover {
            background: rgba(0, 212, 255, 0.1) !important;
            border-color: var(--tech-primary) !important;
            transform: translateX(5px) !important;
            box-shadow: 0 5px 20px rgba(0, 212, 255, 0.3) !important;
          }

          /* 输入框 */
          input, textarea, select {
            background: rgba(26, 26, 46, 0.8) !important;
            border: 1px solid rgba(0, 212, 255, 0.3) !important;
            border-radius: var(--tech-radius) !important;
            color: #e0e6ed !important;
            transition: all 0.3s ease !important;
          }

          input:focus, textarea:focus, select:focus {
            border-color: var(--tech-primary) !important;
            box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.2) !important;
            background: rgba(26, 26, 46, 0.9) !important;
          }

          /* 帖子内容区域 */
          .topic-post {
            background: rgba(26, 26, 46, 0.7) !important;
            border: 1px solid rgba(0, 212, 255, 0.2) !important;
            border-radius: var(--tech-radius) !important;
            backdrop-filter: blur(10px) !important;
          }

          /* 代码块科技化 */
          pre, code {
            background: rgba(12, 12, 12, 0.9) !important;
            border: 1px solid var(--tech-primary) !important;
            border-radius: var(--tech-radius) !important;
            color: var(--tech-primary) !important;
            font-family: 'JetBrains Mono', 'Courier New', monospace !important;
          }

          /* 侧边栏 */
          .sidebar-section, .widget-box {
            background: rgba(26, 26, 46, 0.8) !important;
            border: 1px solid rgba(0, 212, 255, 0.2) !important;
            border-radius: var(--tech-radius) !important;
            backdrop-filter: blur(10px) !important;
          }

          /* 滚动条科技化 */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }

          ::-webkit-scrollbar-track {
            background: rgba(26, 26, 46, 0.5);
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, var(--tech-primary), var(--tech-accent));
            border-radius: 4px;
            box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
          }

          ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(45deg, var(--tech-accent), var(--tech-primary));
          }

          /* 通知和提示 */
          .alert, .notification {
            background: rgba(26, 26, 46, 0.9) !important;
            border: 1px solid var(--tech-primary) !important;
            border-radius: var(--tech-radius) !important;
            color: #e0e6ed !important;
            backdrop-filter: blur(10px) !important;
          }

          /* 加载动画 */
          .loading-container {
            background: rgba(26, 26, 46, 0.9) !important;
          }

          .spinner {
            border-color: var(--tech-primary) transparent var(--tech-primary) transparent !important;
          }

          /* 表格 */
          table {
            background: rgba(26, 26, 46, 0.8) !important;
            border: 1px solid rgba(0, 212, 255, 0.2) !important;
            border-radius: var(--tech-radius) !important;
          }

          th, td {
            border-color: rgba(0, 212, 255, 0.2) !important;
            color: #e0e6ed !important;
          }

          th {
            background: rgba(0, 212, 255, 0.1) !important;
          }

          /* 标签 */
          .discourse-tag, .badge {
            background: linear-gradient(45deg, var(--tech-primary), var(--tech-accent)) !important;
            color: #ffffff !important;
            border-radius: var(--tech-radius) !important;
            border: none !important;
            text-shadow: 0 0 5px rgba(0, 0, 0, 0.5) !important;
          }
        `;
      } else {
        // 原有的普通主题样式
        customCSS += `
          button, .btn, input[type="button"], input[type="submit"] {
            background-color: ${theme.primaryColor} !important;
            border-color: ${theme.primaryColor} !important;
            color: #fff !important;
            border-radius: ${theme.borderRadius} !important;
          }

          a {
            color: ${theme.primaryColor} !important;
          }

          button:hover, .btn:hover,
          a:hover:not([href^="#"]):not([href=""]),
          .topic-list-item:hover, .latest-topic-list-item:hover {
            background-color: ${theme.accentColor}30 !important;
            transition: background-color 0.2s ease !important;
          }

          input, textarea, select {
            border-color: ${theme.secondaryColor} !important;
            border-radius: ${theme.borderRadius} !important;
          }

          input:focus, textarea:focus, select:focus {
            border-color: ${theme.primaryColor} !important;
            box-shadow: 0 0 0 2px ${theme.primaryColor}30 !important;
          }
        `;
      }
    }

    // 背景样式 - 在主题样式之后应用，确保不被覆盖
    if (currentConfig.background.enabled && currentConfig.background.imageUrl) {
      console.log('🖼️ 应用背景样式:', currentConfig.background);
      const bg = currentConfig.background;
      customCSS += `
        /* 🖼️ 自定义背景样式 - 最高优先级 */
        html, body {
          background-image: url('${bg.imageUrl}') !important;
          background-size: ${bg.mode} !important;
          background-repeat: ${bg.mode === 'repeat' ? 'repeat' : 'no-repeat'} !important;
          background-position: center !important;
          background-attachment: fixed !important;
          min-height: 100vh !important;
        }

        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: ${bg.overlayColor} !important;
          opacity: ${bg.overlayOpacity} !important;
          backdrop-filter: blur(${bg.blur}px) !important;
          z-index: 1;
          pointer-events: none;
        }

        .ember-application, #main-outlet, body > *, .d-header {
          position: relative;
          z-index: 2;
        }

        .ember-application {
          background: rgba(255, 255, 255, ${1 - bg.opacity}) !important;
          min-height: 100vh !important;
        }

        /* 确保背景图片不被主题覆盖 */
        body {
          background-image: url('${bg.imageUrl}') !important;
          background-size: ${bg.mode} !important;
          background-repeat: ${bg.mode === 'repeat' ? 'repeat' : 'no-repeat'} !important;
          background-position: center !important;
          background-attachment: fixed !important;
        }
      `;
    }

    if (customCSS.trim()) {
      const styleElement = document.createElement('style');
      styleElement.id = 'mjjbox-custom-styles';
      styleElement.textContent = customCSS;
      document.head.appendChild(styleElement);
      console.log('✅ 自定义样式已应用');
    } else {
      console.log('⚠️ 没有自定义样式需要应用');
    }
  };

  /* ========== 用户数据获取 ========== */
  const getCurrentUsername = () => {
    try {
      if (typeof Discourse !== 'undefined' && Discourse.User && Discourse.User.current()) {
        return Discourse.User.current()?.username || null;
      }

      const pathMatch = window.location.pathname.match(/\/u\/([^\/]+)/);
      if (pathMatch) {
        return pathMatch[1];
      }

      const userElement = document.querySelector('.current-user .username, .header-dropdown-toggle .username, [data-user-card]');
      if (userElement) {
        return userElement.textContent.trim().replace('@', '');
      }
    } catch (e) {
      console.error('获取用户名失败:', e);
    }

    return null;
  };

  const fetchUserData = async (username) => {
    if (!username) {
      throw new Error('用户名不能为空');
    }

    console.log('🔍 开始获取用户数据:', username);

    try {
      console.log('🔑 尝试管理员API获取官方数据');

      const publicData = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://mjjbox.com/u/${username}.json`,
          timeout: 10000,
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          onload: (resp) => {
            if (resp.status === 200) {
              try {
                const data = JSON.parse(resp.responseText);
                console.log('✅ 获取用户ID成功');
                resolve(data);
              } catch (e) {
                reject(e);
              }
            } else {
              reject(new Error(`HTTP ${resp.status}`));
            }
          },
          onerror: reject
        });
      });

      const userId = publicData.user?.id;
      if (!userId) {
        throw new Error('无法获取用户ID');
      }

      // 保存用户信息到全局变量
      currentUserId = userId;
      currentUsername = username;

      console.log('🔍 用户ID:', userId);

      const adminData = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: `https://mjjbox.com/admin/users/${userId}.json`,
          timeout: 10000,
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          onload: (resp) => {
            if (resp.status === 200) {
              try {
                const data = JSON.parse(resp.responseText);
                console.log('✅ 管理员API响应成功');
                resolve(data);
              } catch (e) {
                reject(e);
              }
            } else {
              reject(new Error(`HTTP ${resp.status}`));
            }
          },
          onerror: reject
        });
      });

      const tl3Requirements = adminData.tl3_requirements;
      const officialReadingDays = tl3Requirements?.days_visited || 0;

      console.log('🎯 管理员API获取成功，官方阅读天数:', officialReadingDays);

      try {
        const summaryResponse = await new Promise((resolve, reject) => {
          GM_xmlhttpRequest({
            method: 'GET',
            url: `https://mjjbox.com/u/${username}/summary.json`,
            timeout: 10000,
            headers: {
              Accept: 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            onload: resolve,
            onerror: reject
          });
        });

        const summaryData = JSON.parse(summaryResponse.responseText);
        console.log('📊 Summary数据获取成功:', summaryData);

        return {
          source: 'admin_api',
          data: adminData,
          summaryData: summaryData,
          tl3_requirements: tl3Requirements,
          officialReadingDays: officialReadingDays
        };

      } catch (summaryError) {
        console.log('⚠️ Summary数据获取失败:', summaryError);
        return {
          source: 'admin_api',
          data: adminData,
          summaryData: null,
          tl3_requirements: tl3Requirements,
          officialReadingDays: officialReadingDays
        };
      }

    } catch (adminError) {
      console.log('⚠️ 管理员API失败，尝试公开API:', adminError.message);
    }

    // 备用方案：使用公开API
    try {
      console.log('📡 请求公开用户API和summary API');

      const [publicData, summaryData] = await Promise.all([
        new Promise((resolve, reject) => {
          GM_xmlhttpRequest({
            method: 'GET',
            url: `https://mjjbox.com/u/${username}.json`,
            timeout: 10000,
            headers: {
              Accept: 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            onload: (resp) => {
              if (resp.status === 200) {
                try {
                  const data = JSON.parse(resp.responseText);
                  console.log('✅ 公开API响应成功');
                  resolve(data);
                } catch (e) {
                  reject(e);
                }
              } else {
                reject(new Error(`HTTP ${resp.status}`));
              }
            },
            onerror: reject
          });
        }),
        new Promise((resolve, reject) => {
          GM_xmlhttpRequest({
            method: 'GET',
            url: `https://mjjbox.com/u/${username}/summary.json`,
            timeout: 10000,
            headers: {
              Accept: 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            onload: (resp) => {
              if (resp.status === 200) {
                try {
                  const data = JSON.parse(resp.responseText);
                  console.log('✅ Summary API响应成功');
                  resolve(data);
                } catch (e) {
                  reject(e);
                }
              } else {
                reject(new Error(`HTTP ${resp.status}`));
              }
            },
            onerror: reject
          });
        })
      ]);

      const user = publicData.user || summaryData.users?.[0];
      const userSummary = summaryData.user_summary;

      // 保存用户信息到全局变量
      if (user?.id) {
        currentUserId = user.id;
        currentUsername = username;
      }

      console.log('📊 原始用户数据:', { user, userSummary });

      const mergedData = {
        user: user,
        userSummary: userSummary
      };

      console.log('📊 合并后的用户数据:', mergedData);

      return {
        source: 'public_api',
        data: mergedData,
        tl3_requirements: null,
        officialReadingDays: 0
      };

    } catch (publicError) {
      console.error('❌ 所有API都失败了:', publicError);
      throw new Error('无法获取用户数据');
    }
  };

  /* ========== 等级进度计算（整合两个版本） ========== */
  const calculateLevelProgress = (userData) => {
    console.log('📊 开始计算等级进度，数据源:', userData.source);

    const user = userData.data.user || userData.data;
    const userSummary = userData.data.userSummary;
    const tl3Req = userData.tl3_requirements;

    const officialReadingDays = userData.officialReadingDays;
    console.log('🎯 官方阅读天数:', officialReadingDays);

    const trustLevel = user?.trust_level || 0;
    const daysVisited = userSummary?.days_visited || user?.days_visited || 0;
    const postsRead = userSummary?.posts_read_count || user?.posts_read_count || 0;
    const topicsEntered = userSummary?.topics_entered || user?.topics_entered || 0;
    const postCount = userSummary?.post_count || user?.post_count || 0;
    const topicCount = userSummary?.topic_count || user?.topic_count || 0;
    const timeRead = userSummary?.time_read || user?.time_read || 0;

    // 多数据源获取赞数据
    let likesGiven = 0;
    let likesReceived = 0;

    const summaryData = userData.summaryData;
    if (summaryData?.user_summary) {
      likesGiven = summaryData.user_summary.likes_given || 0;
      likesReceived = summaryData.user_summary.likes_received || 0;
      console.log('🎯 从summaryData.user_summary获取赞数据:', { likesGiven, likesReceived });
    }

    if ((likesGiven === 0 && likesReceived === 0) && tl3Req) {
      likesGiven = tl3Req.likes_given || 0;
      likesReceived = tl3Req.likes_received || 0;
      console.log('🎯 从tl3_requirements获取赞数据:', { likesGiven, likesReceived });
    }

    if ((likesGiven === 0 && likesReceived === 0) && userSummary) {
      likesGiven = userSummary.likes_given || 0;
      likesReceived = userSummary.likes_received || 0;
      console.log('📊 从userSummary获取赞数据:', { likesGiven, likesReceived });
    }

    if ((likesGiven === 0 && likesReceived === 0) && user) {
      likesGiven = user.likes_given || 0;
      likesReceived = user.likes_received || 0;
      console.log('📊 从user获取赞数据:', { likesGiven, likesReceived });
    }

    console.log('📊 用户基础数据:', {
      trustLevel, daysVisited, postsRead, topicsEntered,
      postCount, topicCount, timeRead, likesGiven, likesReceived, officialReadingDays
    });

    const targetLevel = Math.min(trustLevel + 1, 4);
    const req = levelRequirements[targetLevel];

    if (!req) {
      return {
        currentLevel: trustLevel,
        targetLevel,
        progress: [],
        canLevelUp: trustLevel >= 4,
        gamificationScore: user?.gamification_score || 0
      };
    }

    const progress = [];

    const add = (name, current, required, isHidden = false, isTime = false, isBoolean = false) => {
      const percentage = required > 0 ? Math.min((current / required) * 100, 100) : 100;
      const item = {
        name,
        current,
        required,
        percentage: Math.round(percentage),
        completed: isBoolean ? current : current >= required,
        isHidden,
        isTime,
        isBoolean
      };
      progress.push(item);
      console.log(`📊 ${name}: ${current}/${required} (${item.percentage}%)`);
    };

    // 根据目标等级添加条件
    if (req.topics_entered !== undefined) add('阅读主题数', topicsEntered, req.topics_entered);
    if (req.posts_read !== undefined) add('阅读帖子数', postsRead, req.posts_read);
    if (req.time_read !== undefined) add('总阅读时间（分钟）', Math.floor(timeRead / 60), Math.floor(req.time_read / 60), false, true);
    if (req.days_visited !== undefined) add('累计访问天数', daysVisited, req.days_visited);
    if (req.days_visited_in_100 !== undefined) {
      if (officialReadingDays > 0) {
        add('过去100天内访问天数', officialReadingDays, req.days_visited_in_100, true);
      } else {
        const item = {
          name: '过去100天内访问天数',
          current: '需要权限',
          required: req.days_visited_in_100,
          percentage: 0,
          completed: false,
          isHidden: true,
          needsPermission: true
        };
        progress.push(item);
      }
    }
    if (req.posts_created !== undefined) add('累计发帖数', topicCount, req.posts_created);
    if (req.posts_created_in_100 !== undefined) add('过去100天内发帖/回复数', topicCount + postCount, req.posts_created_in_100);
    if (req.likes_received !== undefined) add('收到赞数', likesReceived, req.likes_received);
    if (req.likes_given !== undefined) add('送出赞数', likesGiven, req.likes_given);

    // 头像和个人简介检查
    if (req.has_avatar !== undefined) {
      const hasAvatar = !!(user.avatar_template && !user.avatar_template.includes('letter_avatar') && !user.avatar_template.includes('system_avatar'));
      add('已上传头像', hasAvatar ? '已上传' : '未上传', '已上传', false, false, true);
    }
    if (req.has_bio !== undefined) {
      const hasBio = !!(user.bio_raw && user.bio_raw.trim());
      add('已填写基本资料', hasBio ? '已填写' : '未填写', '已填写', false, false, true);
    }

    // 被举报比例
    if (req.flagged_posts_ratio !== undefined) {
      const flaggedRatio = 0; // 暂无API数据
      add('被举报/隐藏帖子比例', `${(flaggedRatio * 100).toFixed(1)}%`, `${(req.flagged_posts_ratio * 100).toFixed(0)}% 以内`, false, false, true);
    }

    // 手动提升
    if (req.manual_promotion) {
      const item = {
        name: '升级方式',
        current: '联系管理员',
        required: '手动提升',
        percentage: 0,
        completed: false,
        isManual: true
      };
      progress.push(item);
    }

    const canLevelUp = progress.every(item => item.completed);

    console.log('📊 等级进度计算完成:', {
      currentLevel: trustLevel,
      targetLevel,
      canLevelUp,
      progressCount: progress.length,
      completedCount: progress.filter(p => p.completed).length
    });

    return {
      currentLevel: trustLevel,
      targetLevel,
      progress,
      canLevelUp,
      gamificationScore: user?.gamification_score || 0
    };
  };

  /* ========== UI 组件 ========== */
  let panel = null;
  let isLoading = false;

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `mjjbox-notification mjjbox-notification-${type}`;
    notification.textContent = message;

    const style = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-weight: 500;
      z-index: 10001;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      max-width: 300px;
      word-wrap: break-word;
    `;

    const colors = {
      success: 'background: linear-gradient(45deg, #00d4ff, #00ff88);',
      error: 'background: linear-gradient(45deg, #ff6b6b, #ff8e8e);',
      warning: 'background: linear-gradient(45deg, #ffc107, #ffeb3b); color: #212529;',
      info: 'background: linear-gradient(45deg, #00d4ff, #0099cc);'
    };

    notification.style.cssText = style + (colors[type] || colors.info);
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  };

  const openTL3RequirementsPage = () => {
    if (!currentUserId || !currentUsername) {
      showNotification('⚠️ 请先加载用户数据', 'warning');
      return;
    }

    const url = `https://mjjbox.com/admin/users/${currentUserId}/${currentUsername}/tl3_requirements`;
    console.log('🔗 打开TL3要求页面:', url);
    window.open(url, '_blank');
  };

  const createLevelPanel = () => {
    if (panel) return panel;

    panel = document.createElement('div');
    panel.className = 'mjjbox-level-panel';
    panel.innerHTML = `
      <div class="mjjbox-panel-header">
        <span class="mjjbox-panel-title">🚀 等级进度</span>
        <div class="mjjbox-panel-controls">
          <button class="mjjbox-btn mjjbox-btn-tl3" title="查看TL3详细要求">📊</button>
          <button class="mjjbox-btn mjjbox-btn-settings" title="个性化设置">⚙️</button>
          <button class="mjjbox-btn mjjbox-btn-refresh" title="刷新数据">🔄</button>
          <button class="mjjbox-btn mjjbox-btn-close" title="关闭面板">✕</button>
        </div>
      </div>
      <div class="mjjbox-panel-content">
        <div class="mjjbox-loading">正在加载用户数据...</div>
      </div>
    `;

    // 添加科技风格样式
    GM_addStyle(`
      .mjjbox-level-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 380px;
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%) !important;
        border: 2px solid #00d4ff !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 32px rgba(0, 212, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
        z-index: 10000 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
        color: #ffffff !important;
        backdrop-filter: blur(20px) !important;
      }

      .mjjbox-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: linear-gradient(90deg, rgba(0, 212, 255, 0.2) 0%, rgba(255, 107, 107, 0.2) 100%);
        border-bottom: 1px solid rgba(0, 212, 255, 0.3);
        border-radius: 10px 10px 0 0;
      }

      .mjjbox-panel-title {
        font-weight: 700 !important;
        color: #00d4ff !important;
        text-shadow: 0 0 10px rgba(0, 212, 255, 0.5) !important;
        font-size: 16px !important;
      }

      .mjjbox-panel-controls {
        display: flex;
        gap: 8px;
      }

      .mjjbox-btn {
        background: rgba(0, 212, 255, 0.2) !important;
        border: 1px solid rgba(0, 212, 255, 0.4) !important;
        padding: 6px 10px !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        color: #ffffff !important;
      }

      .mjjbox-btn:hover {
        background: rgba(0, 212, 255, 0.4);
        border-color: #00d4ff;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
      }

      .mjjbox-btn-tl3 {
        background: linear-gradient(45deg, rgba(0, 212, 255, 0.3), rgba(0, 153, 204, 0.3)) !important;
        border: 1px solid rgba(0, 212, 255, 0.5) !important;
      }

      .mjjbox-btn-tl3:hover {
        background: linear-gradient(45deg, rgba(0, 212, 255, 0.5), rgba(0, 153, 204, 0.5)) !important;
        box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4) !important;
      }

      .mjjbox-panel-content {
        padding: 20px;
        max-height: 500px;
        overflow-y: auto;
      }

      .mjjbox-loading {
        text-align: center !important;
        color: #ffffff !important;
        padding: 30px !important;
        font-size: 16px !important;
      }

      .mjjbox-level-info {
        margin-bottom: 20px;
        padding: 16px;
        background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(255, 107, 107, 0.1) 100%);
        border-radius: 8px;
        border: 1px solid rgba(0, 212, 255, 0.3);
        position: relative;
        overflow: hidden;
      }

      .mjjbox-level-info::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        animation: shimmer 2s infinite;
      }

      @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
      }

      .mjjbox-progress-item {
        margin-bottom: 16px;
        padding: 12px;
        background: rgba(26, 26, 46, 0.6);
        border-radius: 8px;
        border-left: 3px solid #00ff88;
        transition: all 0.3s ease;
        position: relative;
      }

      .mjjbox-progress-item:hover {
        background: rgba(26, 26, 46, 0.8);
        transform: translateX(5px);
      }

      .mjjbox-progress-item.incomplete {
        border-left-color: #ff6b6b;
      }

      .mjjbox-progress-item.hidden {
        background: rgba(255, 193, 7, 0.1);
        border-left-color: #ffc107;
      }

      .mjjbox-progress-item.needs-permission {
        background: rgba(255, 107, 107, 0.1);
        border-left-color: #ff6b6b;
      }

      .mjjbox-progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .mjjbox-progress-name {
        font-weight: 600 !important;
        color: #ffffff !important;
      }

      .mjjbox-progress-value {
        font-size: 12px !important;
        color: #00d4ff !important;
        font-weight: 500 !important;
      }

      .mjjbox-progress-bar {
        height: 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }

      .mjjbox-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ff88, #00d4ff);
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .mjjbox-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: progress-shine 1.5s infinite;
      }

      @keyframes progress-shine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .mjjbox-progress-item.incomplete .mjjbox-progress-fill {
        background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
      }

      .mjjbox-progress-item.hidden .mjjbox-progress-fill {
        background: linear-gradient(90deg, #ffc107, #ffeb3b);
      }

      .mjjbox-progress-item.needs-permission .mjjbox-progress-fill {
        background: linear-gradient(90deg, #ff6b6b, #dc3545);
      }

      .mjjbox-data-source {
        margin-top: 16px !important;
        padding: 12px !important;
        background: rgba(0, 255, 136, 0.1) !important;
        border: 1px solid rgba(0, 255, 136, 0.3) !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        color: #00ff88 !important;
      }

      .mjjbox-hidden-conditions {
        margin-top: 16px !important;
        padding: 12px !important;
        background: rgba(255, 193, 7, 0.1) !important;
        border: 1px solid rgba(255, 193, 7, 0.3) !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        color: #ffc107 !important;
      }

      .mjjbox-permission-notice {
        margin-top: 8px !important;
        padding: 10px !important;
        background: rgba(255, 107, 107, 0.1) !important;
        border: 1px solid rgba(255, 107, 107, 0.3) !important;
        border-radius: 6px !important;
        font-size: 11px !important;
        color: #ff6b6b !important;
      }

      /* 滚动条样式 */
      .mjjbox-panel-content::-webkit-scrollbar {
        width: 6px;
      }

      .mjjbox-panel-content::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }

      .mjjbox-panel-content::-webkit-scrollbar-thumb {
        background: linear-gradient(45deg, #00d4ff, #00ff88);
        border-radius: 3px;
      }

      .mjjbox-panel-content::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(45deg, #00ff88, #00d4ff);
      }
    `);

    // 绑定事件
    panel.querySelector('.mjjbox-btn-close').addEventListener('click', () => {
      panel.remove();
      panel = null;
    });

    panel.querySelector('.mjjbox-btn-refresh').addEventListener('click', () => {
      fetchUserLevel();
    });

    panel.querySelector('.mjjbox-btn-settings').addEventListener('click', () => {
      showSettingsModal();
    });

    panel.querySelector('.mjjbox-btn-tl3').addEventListener('click', () => {
      openTL3RequirementsPage();
    });

    document.body.appendChild(panel);
    return panel;
  };

  const updateLevelPanel = (levelData) => {
    if (!panel) return;

    const content = panel.querySelector('.mjjbox-panel-content');
    const { currentLevel, targetLevel, progress, canLevelUp, gamificationScore } = levelData;

    let html = `
      <div class="mjjbox-level-info" style="color: #ffffff !important;">
        <div style="color: #ffffff !important;"><strong style="color: #ffffff !important;">当前等级:</strong> LV${currentLevel} ${levelNames[currentLevel] || '未知等级'}</div>
        <div style="color: #ffffff !important;"><strong style="color: #ffffff !important;">目标等级:</strong> LV${targetLevel} ${levelNames[targetLevel] || '未知等级'}</div>
        <div style="color: #ffffff !important;"><strong style="color: #ffffff !important;">当前积分:</strong> ${gamificationScore}</div>
        <div style="color: #ffffff !important;"><strong style="color: #ffffff !important;">升级状态:</strong> ${canLevelUp ? '✅ 可以升级' : '⏳ 需要完成更多条件'}</div>
      </div>
    `;

    if (progress.length > 0) {
      html += '<div class="mjjbox-progress-list">';

      progress.forEach(item => {
        let className = `mjjbox-progress-item ${item.completed ? 'complete' : 'incomplete'}`;
        if (item.isHidden) {
          className += ' hidden';
        }
        if (item.needsPermission) {
          className += ' needs-permission';
        }

        let currentDisplay = item.current;
        let requiredDisplay = item.required;

        if (item.isTime) {
          currentDisplay = `${item.current} 分钟`;
          requiredDisplay = `${item.required} 分钟`;
        }

        html += `
          <div class="${className}">
            <div class="mjjbox-progress-header">
              <span class="mjjbox-progress-name">${item.isHidden ? '🔒 ' : ''}${item.name}</span>
              <span class="mjjbox-progress-value">${currentDisplay}/${requiredDisplay}</span>
            </div>
            <div class="mjjbox-progress-bar">
              <div class="mjjbox-progress-fill" style="width: ${item.percentage || 0}%"></div>
            </div>
            ${item.needsPermission ? `
              <div class="mjjbox-permission-notice">
                ⚠️ 需要${item.required}，你还没达到<br>
                💡 此数据需要管理员权限才能查看真实值
              </div>
            ` : ''}
          </div>
        `;
      });

      html += '</div>';
    }

    // 添加数据来源说明
    const hasOfficialData = progress.some(item => item.isHidden && !item.needsPermission && typeof item.current === 'number' && item.current > 0);
    if (hasOfficialData) {
      html += `
        <div class="mjjbox-data-source">
          ✅ 使用官方数据源（动态获取）
        </div>
      `;
    }

    // 添加隐藏条件说明
    const hiddenItems = progress.filter(item => item.isHidden);
    if (hiddenItems.length > 0) {
      html += `
        <div class="mjjbox-hidden-conditions">
          🔒 <strong>隐藏条件说明:</strong><br>
          ${hiddenItems.map(item => {
            if (item.needsPermission) {
              return `• ${item.name}: 需要权限查看真实数据`;
            } else {
              const current = item.isTime ? `${item.current} 分钟` : item.current;
              const required = item.isTime ? `${item.required} 分钟` : item.required;
              return `• ${item.name}: ${current}/${required} (${item.percentage}%)`;
            }
          }).join('<br>')}
        </div>
      `;
    }

    content.innerHTML = html;
  };

  const fetchUserLevel = async () => {
    if (isLoading) return;
    isLoading = true;

    try {
      // 先尝试获取动态升级条件
      await fetchLevelRequirements();

      const username = getCurrentUsername();
      if (!username) {
        throw new Error('无法获取当前用户名');
      }

      console.log('🔍 获取用户等级数据:', username);

      if (!panel) createLevelPanel();

      const content = panel.querySelector('.mjjbox-panel-content');
      content.innerHTML = '<div class="mjjbox-loading">🚀 正在加载用户数据...</div>';

      const userData = await fetchUserData(username);
      const levelData = calculateLevelProgress(userData);

      updateLevelPanel(levelData);

    } catch (error) {
      console.error('❌ 获取用户等级失败:', error);
      if (panel) {
        const content = panel.querySelector('.mjjbox-panel-content');
        content.innerHTML = `<div class="mjjbox-loading" style="color: #ff6b6b;">❌ ${error.message}</div>`;
      }
      showNotification(`获取数据失败: ${error.message}`, 'error');
    } finally {
      isLoading = false;
    }
  };

  /* ========== 设置面板 ========== */
  const showSettingsModal = () => {
    const existingModal = document.querySelector('.mjjbox-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'mjjbox-modal';
    modal.innerHTML = `
      <div class="mjjbox-modal-backdrop"></div>
      <div class="mjjbox-modal-content">
        <div class="mjjbox-modal-header">
          <h3>🎨 个性化设置</h3>
          <button class="mjjbox-modal-close">✕</button>
        </div>
        <div class="mjjbox-modal-body">
          <div class="mjjbox-settings-tabs">
            <button class="mjjbox-settings-tab active" data-tab="background">背景设置</button>
            <button class="mjjbox-settings-tab" data-tab="font">字体设置</button>
            <button class="mjjbox-settings-tab" data-tab="theme">主题设置</button>
          </div>

          <div class="mjjbox-settings-content">
            <!-- 背景设置面板 -->
            <div class="mjjbox-settings-panel active" id="background-panel">
              <div class="mjjbox-form-group">
                <label class="mjjbox-checkbox">
                  <input type="checkbox" id="bg-enabled" ${currentConfig.background.enabled ? 'checked' : ''}>
                  <span>启用自定义背景</span>
                </label>
              </div>

              <div class="mjjbox-form-group">
                <label class="mjjbox-form-label">背景图片URL</label>
                <input type="text" class="mjjbox-form-control" id="bg-url" value="${currentConfig.background.imageUrl}" placeholder="输入图片URL或上传文件">
                <input type="file" id="bg-file" accept="image/*" style="margin-top: 8px;">
              </div>

              <div class="mjjbox-form-group">
                <label class="mjjbox-form-label">显示模式</label>
                <select class="mjjbox-form-control" id="bg-mode">
                  <option value="cover" ${currentConfig.background.mode === 'cover' ? 'selected' : ''}>覆盖</option>
                  <option value="contain" ${currentConfig.background.mode === 'contain' ? 'selected' : ''}>包含</option>
                  <option value="repeat" ${currentConfig.background.mode === 'repeat' ? 'selected' : ''}>重复</option>
                </select>
              </div>

              <div class="mjjbox-form-group">
                <label class="mjjbox-form-label">透明度: <span id="opacity-value">${currentConfig.background.opacity}</span></label>
                <input type="range" class="mjjbox-form-control" id="bg-opacity" min="0" max="1" step="0.1" value="${currentConfig.background.opacity}">
              </div>

              <div class="mjjbox-form-group">
                <label class="mjjbox-form-label">模糊度: <span id="blur-value">${currentConfig.background.blur}px</span></label>
                <input type="range" class="mjjbox-form-control" id="bg-blur" min="0" max="20" value="${currentConfig.background.blur}">
              </div>
            </div>

            <!-- 字体设置面板 -->
            <div class="mjjbox-settings-panel" id="font-panel">
              <div class="mjjbox-form-group">
                <label class="mjjbox-checkbox">
                  <input type="checkbox" id="font-enabled" ${currentConfig.font.enabled ? 'checked' : ''}>
                  <span>启用自定义字体</span>
                </label>
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
                  <option value="'JetBrains Mono', monospace" ${currentConfig.font.family === "'JetBrains Mono', monospace" ? 'selected' : ''}>JetBrains Mono</option>
                  <option value="Georgia, serif" ${currentConfig.font.family === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
                  <option value="'Times New Roman', serif" ${currentConfig.font.family === "'Times New Roman', serif" ? 'selected' : ''}>Times New Roman</option>
                  <option value="'Courier New', monospace" ${currentConfig.font.family === "'Courier New', monospace" ? 'selected' : ''}>Courier New</option>
                </select>
              </div>

              <div class="mjjbox-form-group">
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

              <div class="mjjbox-form-group">
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

              <div class="mjjbox-form-group">
                <label class="mjjbox-form-label">字体颜色</label>
                <input type="color" class="mjjbox-form-control" id="font-color" value="${currentConfig.font.color !== 'inherit' ? currentConfig.font.color : '#333333'}">
              </div>
            </div>

            <!-- 主题设置面板 -->
            <div class="mjjbox-settings-panel" id="theme-panel">
              <div class="mjjbox-form-group">
                <label class="mjjbox-checkbox">
                  <input type="checkbox" id="theme-enabled" ${currentConfig.theme.enabled ? 'checked' : ''}>
                  <span>启用自定义主题</span>
                </label>
              </div>

              <div class="mjjbox-form-group">
                <label class="mjjbox-form-label">主题风格</label>
                <select class="mjjbox-form-control" id="theme-style">
                  <option value="tech" ${currentConfig.theme.style === 'tech' ? 'selected' : ''}>🚀 科技风格</option>
                  <option value="normal" ${currentConfig.theme.style === 'normal' ? 'selected' : ''}>📝 普通风格</option>
                </select>
              </div>

              <div class="mjjbox-form-group">
                <label class="mjjbox-form-label">主色调</label>
                <input type="color" class="mjjbox-form-control" id="theme-primary" value="${currentConfig.theme.primaryColor}">
              </div>

              <div class="mjjbox-form-group">
                <label class="mjjbox-form-label">辅助色</label>
                <input type="color" class="mjjbox-form-control" id="theme-secondary" value="${currentConfig.theme.secondaryColor}">
              </div>

              <div class="mjjbox-form-group">
                <label class="mjjbox-form-label">强调色</label>
                <input type="color" class="mjjbox-form-control" id="theme-accent" value="${currentConfig.theme.accentColor}">
              </div>

              <div class="mjjbox-form-group">
                <label class="mjjbox-form-label">圆角大小</label>
                <select class="mjjbox-form-control" id="theme-radius">
                  <option value="0px" ${currentConfig.theme.borderRadius === '0px' ? 'selected' : ''}>无圆角</option>
                  <option value="4px" ${currentConfig.theme.borderRadius === '4px' ? 'selected' : ''}>小圆角</option>
                  <option value="8px" ${currentConfig.theme.borderRadius === '8px' ? 'selected' : ''}>中圆角</option>
                  <option value="12px" ${currentConfig.theme.borderRadius === '12px' ? 'selected' : ''}>大圆角</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div class="mjjbox-modal-footer">
          <button class="mjjbox-btn mjjbox-btn-secondary" id="preview-btn">预览</button>
          <button class="mjjbox-btn mjjbox-btn-secondary" id="reset-btn">重置</button>
          <button class="mjjbox-btn mjjbox-btn-primary" id="save-btn">保存</button>
        </div>
      </div>
    `;

    // 添加科技风格模态框样式
    GM_addStyle(`
      .mjjbox-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10001;
        opacity: 0;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .mjjbox-modal.show {
        opacity: 1;
      }

      .mjjbox-modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
      }

      .mjjbox-modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 700px;
        max-height: 85vh;
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(22, 33, 62, 0.95) 100%);
        border: 2px solid #00d4ff;
        border-radius: 16px;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #e0e6ed;
        box-shadow: 0 20px 60px rgba(0, 212, 255, 0.3);
      }

      .mjjbox-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        background: linear-gradient(90deg, rgba(0, 212, 255, 0.2) 0%, rgba(255, 107, 107, 0.2) 100%);
        border-bottom: 1px solid rgba(0, 212, 255, 0.3);
      }

      .mjjbox-modal-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #00d4ff;
        text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
      }

      .mjjbox-modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        color: #00d4ff;
        transition: all 0.3s ease;
      }

      .mjjbox-modal-close:hover {
        color: #ff6b6b;
        transform: rotate(90deg);
      }

      .mjjbox-modal-body {
        padding: 0;
        max-height: 60vh;
        overflow-y: auto;
      }

      .mjjbox-settings-tabs {
        display: flex;
        background: rgba(0, 0, 0, 0.3);
        border-bottom: 1px solid rgba(0, 212, 255, 0.3);
      }

      .mjjbox-settings-tab {
        flex: 1;
        padding: 16px 20px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        color: #a0a6b0;
        transition: all 0.3s ease;
        position: relative;
      }

      .mjjbox-settings-tab.active {
        background: rgba(0, 212, 255, 0.2);
        color: #00d4ff;
        font-weight: 600;
      }

      .mjjbox-settings-tab.active::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #00d4ff, #00ff88);
      }

      .mjjbox-settings-tab:hover {
        background: rgba(0, 212, 255, 0.1);
        color: #00d4ff;
      }

      .mjjbox-settings-content {
        padding: 24px;
      }

      .mjjbox-settings-panel {
        display: none;
      }

      .mjjbox-settings-panel.active {
        display: block;
      }

      .mjjbox-form-group {
        margin-bottom: 20px;
      }

      .mjjbox-form-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #e0e6ed;
      }

      .mjjbox-form-control {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid rgba(0, 212, 255, 0.3);
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.3s ease;
        background: rgba(26, 26, 46, 0.8);
        color: #e0e6ed;
      }

      .mjjbox-form-control:focus {
        outline: none;
        border-color: #00d4ff;
        box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.2);
        background: rgba(26, 26, 46, 0.9);
      }

      .mjjbox-checkbox {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-weight: normal;
      }

      .mjjbox-checkbox input {
        margin-right: 12px;
        width: auto;
        transform: scale(1.2);
      }

      .mjjbox-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px 24px;
        background: rgba(0, 0, 0, 0.3);
        border-top: 1px solid rgba(0, 212, 255, 0.3);
      }

      .mjjbox-btn {
        padding: 12px 24px;
        border: 1px solid transparent;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .mjjbox-btn-primary {
        background: linear-gradient(45deg, #00d4ff, #00ff88);
        color: #1a1a2e;
        border-color: #00d4ff;
      }

      .mjjbox-btn-primary:hover {
        background: linear-gradient(45deg, #00ff88, #00d4ff);
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 212, 255, 0.4);
      }

      .mjjbox-btn-secondary {
        background: rgba(0, 212, 255, 0.2);
        color: #00d4ff;
        border-color: rgba(0, 212, 255, 0.4);
      }

      .mjjbox-btn-secondary:hover {
        background: rgba(0, 212, 255, 0.4);
        border-color: #00d4ff;
        transform: translateY(-2px);
      }

      /* 滚动条样式 */
      .mjjbox-modal-body::-webkit-scrollbar {
        width: 8px;
      }

      .mjjbox-modal-body::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 4px;
      }

      .mjjbox-modal-body::-webkit-scrollbar-thumb {
        background: linear-gradient(45deg, #00d4ff, #00ff88);
        border-radius: 4px;
      }

      .mjjbox-modal-body::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(45deg, #00ff88, #00d4ff);
      }
    `);

    document.body.appendChild(modal);

    setTimeout(() => modal.classList.add('show'), 10);

    setupModalEvents(modal);
  };

  const setupModalEvents = (modal) => {
    const closeModal = () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.mjjbox-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.mjjbox-modal-backdrop').addEventListener('click', closeModal);

    // 标签页切换
    const tabs = modal.querySelectorAll('.mjjbox-settings-tab');
    const panels = modal.querySelectorAll('.mjjbox-settings-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;

        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        modal.querySelector(`#${targetTab}-panel`).classList.add('active');
      });
    });

    // 实时更新显示值
    const opacitySlider = modal.querySelector('#bg-opacity');
    const opacityValue = modal.querySelector('#opacity-value');
    if (opacitySlider && opacityValue) {
      opacitySlider.addEventListener('input', (e) => {
        opacityValue.textContent = e.target.value;
      });
    }

    const blurSlider = modal.querySelector('#bg-blur');
    const blurValue = modal.querySelector('#blur-value');
    if (blurSlider && blurValue) {
      blurSlider.addEventListener('input', (e) => {
        blurValue.textContent = e.target.value + 'px';
      });
    }

    // 文件上传
    const fileInput = modal.querySelector('#bg-file');
    if (fileInput) {
      fileInput.addEventListener('change', handleFileUpload);
    }

    // 按钮事件
    const saveBtn = modal.querySelector('#save-btn');
    const resetBtn = modal.querySelector('#reset-btn');
    const previewBtn = modal.querySelector('#preview-btn');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        saveSettings(modal);
        closeModal();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetSettings(modal);
      });
    }

    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        previewChanges(modal);
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

  const previewChanges = (modal) => {
    console.log('👀 开始预览更改');

    const tempConfig = { ...currentConfig };

    // 收集设置
    const bgEnabled = modal.querySelector('#bg-enabled');
    const bgUrl = modal.querySelector('#bg-url');
    const bgMode = modal.querySelector('#bg-mode');
    const bgOpacity = modal.querySelector('#bg-opacity');
    const bgBlur = modal.querySelector('#bg-blur');

    if (bgEnabled) tempConfig.background.enabled = bgEnabled.checked;
    if (bgUrl) tempConfig.background.imageUrl = bgUrl.value;
    if (bgMode) tempConfig.background.mode = bgMode.value;
    if (bgOpacity) tempConfig.background.opacity = parseFloat(bgOpacity.value);
    if (bgBlur) tempConfig.background.blur = parseInt(bgBlur.value);

    const fontEnabled = modal.querySelector('#font-enabled');
    const fontFamily = modal.querySelector('#font-family');
    const fontSize = modal.querySelector('#font-size');
    const fontWeight = modal.querySelector('#font-weight');
    const fontColor = modal.querySelector('#font-color');

    if (fontEnabled) tempConfig.font.enabled = fontEnabled.checked;
    if (fontFamily) tempConfig.font.family = fontFamily.value;
    if (fontSize) tempConfig.font.size = fontSize.value;
    if (fontWeight) tempConfig.font.weight = fontWeight.value;
    if (fontColor) {
      const colorValue = fontColor.value;
      tempConfig.font.color = (colorValue && colorValue !== '#333333') ? colorValue : 'inherit';
    }

    const themeEnabled = modal.querySelector('#theme-enabled');
    const themeStyle = modal.querySelector('#theme-style');
    const themePrimary = modal.querySelector('#theme-primary');
    const themeSecondary = modal.querySelector('#theme-secondary');
    const themeAccent = modal.querySelector('#theme-accent');
    const themeRadius = modal.querySelector('#theme-radius');

    if (themeEnabled) tempConfig.theme.enabled = themeEnabled.checked;
    if (themeStyle) tempConfig.theme.style = themeStyle.value;
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

  const saveSettings = (modal) => {
    console.log('💾 开始保存设置');

    // 收集所有设置
    const bgEnabled = modal.querySelector('#bg-enabled');
    const bgUrl = modal.querySelector('#bg-url');
    const bgMode = modal.querySelector('#bg-mode');
    const bgOpacity = modal.querySelector('#bg-opacity');
    const bgBlur = modal.querySelector('#bg-blur');

    const fontEnabled = modal.querySelector('#font-enabled');
    const fontFamily = modal.querySelector('#font-family');
    const fontSize = modal.querySelector('#font-size');
    const fontWeight = modal.querySelector('#font-weight');
    const fontColor = modal.querySelector('#font-color');

    const themeEnabled = modal.querySelector('#theme-enabled');
    const themeStyle = modal.querySelector('#theme-style');
    const themePrimary = modal.querySelector('#theme-primary');
    const themeSecondary = modal.querySelector('#theme-secondary');
    const themeAccent = modal.querySelector('#theme-accent');
    const themeRadius = modal.querySelector('#theme-radius');

    // 更新配置对象
    if (bgEnabled) currentConfig.background.enabled = bgEnabled.checked;
    if (bgUrl) currentConfig.background.imageUrl = bgUrl.value;
    if (bgMode) currentConfig.background.mode = bgMode.value;
    if (bgOpacity) currentConfig.background.opacity = parseFloat(bgOpacity.value);
    if (bgBlur) currentConfig.background.blur = parseInt(bgBlur.value);

    if (fontEnabled) currentConfig.font.enabled = fontEnabled.checked;
    if (fontFamily) currentConfig.font.family = fontFamily.value;
    if (fontSize) currentConfig.font.size = fontSize.value;
    if (fontWeight) currentConfig.font.weight = fontWeight.value;
    if (fontColor) {
      const colorValue = fontColor.value;
      currentConfig.font.color = (colorValue && colorValue !== '#333333') ? colorValue : 'inherit';
    }

    if (themeEnabled) currentConfig.theme.enabled = themeEnabled.checked;
    if (themeStyle) currentConfig.theme.style = themeStyle.value;
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

    showNotification('✅ 设置已保存并应用', 'success');
  };

  const resetSettings = (modal) => {
    console.log('🔄 开始重置设置');

    // 重置配置
    currentConfig = JSON.parse(JSON.stringify(defaultConfig));

    // 清除GM存储
    const keys = [
      'mjjbox_bg_enabled', 'mjjbox_bg_url', 'mjjbox_bg_mode', 'mjjbox_bg_opacity', 'mjjbox_bg_blur', 'mjjbox_bg_overlay_color', 'mjjbox_bg_overlay_opacity',
      'mjjbox_font_enabled', 'mjjbox_font_family', 'mjjbox_font_size', 'mjjbox_font_weight', 'mjjbox_font_color', 'mjjbox_font_line_height',
      'mjjbox_theme_enabled', 'mjjbox_theme_style', 'mjjbox_theme_primary', 'mjjbox_theme_secondary', 'mjjbox_theme_accent', 'mjjbox_theme_radius'
    ];

    keys.forEach(key => GM_deleteValue(key));

    // 重新应用样式
    applyCustomStyles();

    // 更新表单
    const bgEnabled = modal.querySelector('#bg-enabled');
    const bgUrl = modal.querySelector('#bg-url');
    const fontEnabled = modal.querySelector('#font-enabled');
    const fontFamily = modal.querySelector('#font-family');
    const themeEnabled = modal.querySelector('#theme-enabled');
    const themeStyle = modal.querySelector('#theme-style');

    if (bgEnabled) bgEnabled.checked = false;
    if (bgUrl) bgUrl.value = '';
    if (fontEnabled) fontEnabled.checked = false;
    if (fontFamily) fontFamily.value = 'inherit';
    if (themeEnabled) themeEnabled.checked = false;
    if (themeStyle) themeStyle.value = 'tech';

    showNotification('✅ 设置已重置', 'success');
  };

  /* ========== 主入口 ========== */
  const createFloatingButton = () => {
    const button = document.createElement('div');
    button.className = 'mjjbox-floating-btn';
    button.innerHTML = '🚀';
    button.title = 'MJJBOX增强助手';

    GM_addStyle(`
      .mjjbox-floating-btn {
        position: fixed;
        top: 20px;
        right: 80px;
        width: 60px;
        height: 60px;
        background: linear-gradient(45deg, #00d4ff, #00ff88);
        color: #1a1a2e;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 24px;
        box-shadow: 0 8px 32px rgba(0, 212, 255, 0.4);
        z-index: 9999;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        border: 2px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
      }

      .mjjbox-floating-btn:hover {
        background: linear-gradient(45deg, #00ff88, #ff6b6b);
        transform: scale(1.15) rotate(5deg);
        box-shadow: 0 12px 40px rgba(0, 212, 255, 0.6);
      }

      .mjjbox-floating-btn:active {
        transform: scale(0.95) rotate(-5deg);
      }

      .mjjbox-floating-btn::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: linear-gradient(45deg, #00d4ff, #00ff88, #ff6b6b, #00d4ff);
        border-radius: 50%;
        z-index: -1;
        animation: rotate 3s linear infinite;
        opacity: 0.7;
      }

      @keyframes rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `);

    button.addEventListener('click', fetchUserLevel);
    document.body.appendChild(button);
  };

  /* ========== 初始化 ========== */
  const init = () => {
    console.log('🚀 MJJBOX增强助手初始化');

    // 加载配置
    loadConfig();

    // 应用自定义样式
    applyCustomStyles();

    // 创建浮动按钮
    createFloatingButton();

    console.log('✅ MJJBOX增强助手初始化完成');
  };

  // 等待页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

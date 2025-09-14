// ==UserScript==
// @name         MJJBOX 增强助手
// @namespace    http://tampermonkey.net/
// @version      3.8
// @description  完整版本 + 隐藏条件提示
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

  console.log('🚀 MJJBOX 增强助手启动 v3.8');

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
      /* 🎨 抖音美好体字体加载 */
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
        /* 字体样式应用 - 避免影响脚本UI */
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

        /* 确保脚本UI不受影响 */
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
      customCSS += `
        /* 强制应用主题样式 */
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
      // 🎯 使用2.7版本的方法：Discourse API
      if (typeof Discourse !== 'undefined' && Discourse.User && Discourse.User.current()) {
        return Discourse.User.current()?.username || null;
      }

      // 备用方法：从URL路径获取
      const pathMatch = window.location.pathname.match(/\/u\/([^\/]+)/);
      if (pathMatch) {
        return pathMatch[1];
      }

      // 备用方法：从DOM元素获取
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

    // 🎯 优先尝试管理员API获取官方数据
    try {
      console.log('🔑 尝试管理员API获取官方数据');

      // 🎯 先获取用户ID，然后用ID访问管理员API
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

      // 🎯 从管理员API获取官方阅读天数
      const tl3Requirements = adminData.tl3_requirements;
      const officialReadingDays = tl3Requirements?.days_visited || 0;

      console.log('🎯 管理员API获取成功，官方阅读天数:', officialReadingDays);
      console.log('🔍 完整的tl3_requirements数据:', tl3Requirements);
      console.log('🔍 完整的adminData数据:', adminData);

      // 🔍 详细分析赞数据的位置
      console.log('🔍 赞数据分析:');
      console.log('  - tl3_requirements.likes_given:', tl3Requirements?.likes_given);
      console.log('  - tl3_requirements.likes_received:', tl3Requirements?.likes_received);
      console.log('  - adminData.likes_given:', adminData?.likes_given);
      console.log('  - adminData.likes_received:', adminData?.likes_received);
      console.log('  - adminData.user?.likes_given:', adminData?.user?.likes_given);
      console.log('  - adminData.user?.likes_received:', adminData?.user?.likes_received);

      // 🔍 查找所有可能包含赞数据的字段
      const findLikesData = (obj, path = '') => {
        if (!obj || typeof obj !== 'object') return;

        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const currentPath = path ? `${path}.${key}` : key;

          if (key.includes('like') || key.includes('Like')) {
            console.log(`  - 发现赞相关字段 ${currentPath}:`, value);
          }

          if (typeof value === 'object' && value !== null) {
            findLikesData(value, currentPath);
          }
        });
      };

      console.log('🔍 搜索所有赞相关字段:');
      findLikesData(adminData);

      // 🎯 同时获取公开API的summary数据作为备用
      console.log('🔍 同时获取summary数据作为赞数据备用源');
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

        // 将summary数据也加入到返回结果中
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

      return {
        source: 'admin_api',
        data: adminData,
        tl3_requirements: tl3Requirements,
        officialReadingDays: officialReadingDays
      };

    } catch (adminError) {
      console.log('⚠️ 管理员API失败，尝试公开API:', adminError.message);
    }

    // 备用方案：使用公开API + summary API获取完整数据
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

      // 🎯 参考2.7版本的数据处理方式
      const user = publicData.user || summaryData.users?.[0];
      const userSummary = summaryData.user_summary;

      console.log('📊 原始用户数据:', { user, userSummary });

      // 合并数据，确保获取到完整的用户统计信息
      const mergedData = {
        user: user,
        userSummary: userSummary
      };

      console.log('📊 合并后的用户数据:', mergedData);

      return {
        source: 'public_api',
        data: mergedData,
        tl3_requirements: null,
        officialReadingDays: 0 // 公开API没有官方数据
      };

    } catch (publicError) {
      console.error('❌ 所有API都失败了:', publicError);
      throw new Error('无法获取用户数据');
    }
  };

  /* ========== 等级进度计算 ========== */
  const calculateLevelProgress = (userData) => {
    console.log('📊 开始计算等级进度，数据源:', userData.source);

    const user = userData.data.user || userData.data;
    const userSummary = userData.data.userSummary;
    const tl3Req = userData.tl3_requirements;

    // 🎯 使用官方阅读天数数据
    const officialReadingDays = userData.officialReadingDays;
    console.log('🎯 官方阅读天数:', officialReadingDays);

    // 🎯 参考2.7版本的数据获取方式
    const trustLevel = user?.trust_level || 0;
    const daysVisited = userSummary?.days_visited || user?.days_visited || 0;
    const postsRead = userSummary?.posts_read_count || user?.posts_read_count || 0;
    const topicsEntered = userSummary?.topics_entered || user?.topics_entered || 0;
    const postCount = userSummary?.post_count || user?.post_count || 0;

    // 🎯 关键修复：多数据源获取赞数据
    let likesGiven = 0;
    let likesReceived = 0;

    // 🎯 优先从 summaryData 获取（如果有的话）
    const summaryData = userData.summaryData;
    if (summaryData?.user_summary) {
      likesGiven = summaryData.user_summary.likes_given || 0;
      likesReceived = summaryData.user_summary.likes_received || 0;
      console.log('🎯 从summaryData.user_summary获取赞数据:', { likesGiven, likesReceived });
    }

    // 如果summary数据为0或不存在，尝试从tl3_requirements获取
    if ((likesGiven === 0 && likesReceived === 0) && tl3Req) {
      likesGiven = tl3Req.likes_given || 0;
      likesReceived = tl3Req.likes_received || 0;
      console.log('🎯 从tl3_requirements获取赞数据:', { likesGiven, likesReceived });
    }

    // 如果还是0，尝试从userSummary获取
    if ((likesGiven === 0 && likesReceived === 0) && userSummary) {
      likesGiven = userSummary.likes_given || 0;
      likesReceived = userSummary.likes_received || 0;
      console.log('📊 从userSummary获取赞数据:', { likesGiven, likesReceived });
    }

    // 最后备用：从user获取
    if ((likesGiven === 0 && likesReceived === 0) && user) {
      likesGiven = user.likes_given || 0;
      likesReceived = user.likes_received || 0;
      console.log('📊 从user获取赞数据:', { likesGiven, likesReceived });
    }

    // 🔍 输出最终的赞数据结果
    console.log('🎯 最终赞数据结果:', {
      likesGiven,
      likesReceived,
      dataSource: summaryData ? 'summary' : (tl3Req ? 'tl3_requirements' : (userSummary ? 'userSummary' : 'user'))
    });

    console.log('📊 用户基础数据:', {
      trustLevel, daysVisited, postsRead, topicsEntered,
      postCount, likesGiven, likesReceived, officialReadingDays
    });

    // 2025年9月15日最新等级要求
    const requirements = {
      1: { daysVisited: 1, topicsEntered: 5, postsRead: 30, timeOnSite: 10 },
      2: { daysVisited: 15, topicsEntered: 20, postsRead: 100, timeOnSite: 60, likesReceived: 1, likesGiven: 1, topicsRepliedTo: 3 },
      3: {
        daysVisited: 50,
        topicsEntered: 25,
        postsRead: 25,
        timeOnSite: 60,
        likesReceived: 20,
        likesGiven: 30,
        topicsRepliedTo: 10,
        // 🎯 隐藏条件：帖子阅读唯一日期占比
        postsReadUniqueDays: 50  // 需要50天
      }
    };

    const targetLevel = Math.min(trustLevel + 1, 3);
    const req = requirements[targetLevel];

    if (!req) {
      return { currentLevel: trustLevel, targetLevel, progress: [], canLevelUp: trustLevel >= 3 };
    }

    const progress = [];

    // 基础条件
    const add = (name, current, required, isHidden = false) => {
      const percentage = required > 0 ? Math.min((current / required) * 100, 100) : 100;
      const item = {
        name,
        current,
        required,
        percentage: Math.round(percentage),
        completed: current >= required,
        isHidden
      };
      progress.push(item);
      console.log(`📊 ${name}: ${current}/${required} (${item.percentage}%)`);
    };

    add('访问天数', daysVisited, req.daysVisited);
    add('进入主题数', topicsEntered, req.topicsEntered);
    add('阅读帖子数', postsRead, req.postsRead);

    if (req.likesReceived) add('获得赞数', likesReceived, req.likesReceived);
    if (req.likesGiven) add('给出赞数', likesGiven, req.likesGiven);
    if (req.topicsRepliedTo) add('回复主题数', postCount, req.topicsRepliedTo);

    // 🎯 隐藏条件：过去100天内阅读天数
    if (req.postsReadUniqueDays) {
      // 如果有官方数据，显示真实数据
      if (officialReadingDays > 0) {
        console.log('🎯 添加隐藏条件 - 官方阅读天数:', officialReadingDays);
        add('过去100天内阅读天数', officialReadingDays, req.postsReadUniqueDays, true);
      } else {
        // 普通用户显示权限提示
        console.log('🎯 添加隐藏条件 - 需要权限');
        const item = {
          name: '过去100天内阅读天数',
          current: '需要权限',
          required: req.postsReadUniqueDays,
          percentage: 0,
          completed: false,
          isHidden: true,
          needsPermission: true
        };
        progress.push(item);
      }
    }

    const canLevelUp = progress.every(item => item.completed);

    console.log('📊 等级进度计算完成:', {
      currentLevel: trustLevel,
      targetLevel,
      canLevelUp,
      progressCount: progress.length,
      completedCount: progress.filter(p => p.completed).length
    });

    return { currentLevel: trustLevel, targetLevel, progress, canLevelUp };
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
      success: 'background: #28a745;',
      error: 'background: #dc3545;',
      warning: 'background: #ffc107; color: #212529;',
      info: 'background: #17a2b8;'
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

  const createLevelPanel = () => {
    if (panel) return panel;

    panel = document.createElement('div');
    panel.className = 'mjjbox-level-panel';
    panel.innerHTML = `
      <div class="mjjbox-panel-header">
        <span class="mjjbox-panel-title">📊 等级进度</span>
        <div class="mjjbox-panel-controls">
          <button class="mjjbox-btn mjjbox-btn-settings" title="个性化设置">⚙️</button>
          <button class="mjjbox-btn mjjbox-btn-refresh" title="刷新数据">🔄</button>
          <button class="mjjbox-btn mjjbox-btn-close" title="关闭面板">✕</button>
        </div>
      </div>
      <div class="mjjbox-panel-content">
        <div class="mjjbox-loading">正在加载用户数据...</div>
      </div>
    `;

    // 添加样式
    GM_addStyle(`
      .mjjbox-level-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }

      .mjjbox-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        border-radius: 8px 8px 0 0;
      }

      .mjjbox-panel-title {
        font-weight: 600;
        color: #495057;
      }

      .mjjbox-panel-controls {
        display: flex;
        gap: 4px;
      }

      .mjjbox-btn {
        background: none;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s;
      }

      .mjjbox-btn:hover {
        background: rgba(0,0,0,0.1);
      }

      .mjjbox-panel-content {
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;
      }

      .mjjbox-loading {
        text-align: center;
        color: #6c757d;
        padding: 20px;
      }

      .mjjbox-level-info {
        margin-bottom: 16px;
        padding: 12px;
        background: #e3f2fd;
        border-radius: 6px;
        border-left: 4px solid #2196f3;
      }

      .mjjbox-progress-item {
        margin-bottom: 12px;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;
        border-left: 3px solid #28a745;
      }

      .mjjbox-progress-item.incomplete {
        border-left-color: #ffc107;
      }

      .mjjbox-progress-item.hidden {
        background: #fff3cd;
        border-left-color: #ff6b6b;
      }

      .mjjbox-progress-item.needs-permission {
        background: #f8d7da;
        border-left-color: #dc3545;
      }

      .mjjbox-progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .mjjbox-progress-name {
        font-weight: 500;
        color: #495057;
      }

      .mjjbox-progress-value {
        font-size: 12px;
        color: #6c757d;
      }

      .mjjbox-progress-bar {
        height: 6px;
        background: #e9ecef;
        border-radius: 3px;
        overflow: hidden;
      }

      .mjjbox-progress-fill {
        height: 100%;
        background: #28a745;
        transition: width 0.3s ease;
      }

      .mjjbox-progress-item.incomplete .mjjbox-progress-fill {
        background: #ffc107;
      }

      .mjjbox-progress-item.hidden .mjjbox-progress-fill {
        background: #ff6b6b;
      }

      .mjjbox-progress-item.needs-permission .mjjbox-progress-fill {
        background: #dc3545;
      }

      .mjjbox-data-source {
        margin-top: 12px;
        padding: 8px;
        background: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 4px;
        font-size: 12px;
        color: #155724;
      }

      .mjjbox-hidden-conditions {
        margin-top: 12px;
        padding: 8px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        font-size: 12px;
        color: #856404;
      }

      .mjjbox-permission-notice {
        margin-top: 8px;
        padding: 8px;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        font-size: 12px;
        color: #721c24;
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

    document.body.appendChild(panel);
    return panel;
  };

  const updateLevelPanel = (levelData) => {
    if (!panel) return;

    const content = panel.querySelector('.mjjbox-panel-content');
    const { currentLevel, targetLevel, progress, canLevelUp } = levelData;

    let html = `
      <div class="mjjbox-level-info">
        <div><strong>当前等级:</strong> TL${currentLevel}</div>
        <div><strong>目标等级:</strong> TL${targetLevel}</div>
        <div><strong>升级状态:</strong> ${canLevelUp ? '✅ 可以升级' : '⏳ 需要完成更多条件'}</div>
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

        html += `
          <div class="${className}">
            <div class="mjjbox-progress-header">
              <span class="mjjbox-progress-name">${item.isHidden ? '🔒 ' : ''}${item.name}</span>
              <span class="mjjbox-progress-value">${item.current}/${item.required}</span>
            </div>
            <div class="mjjbox-progress-bar">
              <div class="mjjbox-progress-fill" style="width: ${item.percentage}%"></div>
            </div>
            ${item.needsPermission ? `
              <div class="mjjbox-permission-notice">
                ⚠️ 需要50%，你还没达到<br>
                💡 此数据需要管理员权限才能查看真实值
              </div>
            ` : ''}
          </div>
        `;
      });

      html += '</div>';
    }

    // 添加数据来源说明
    const hasOfficialData = progress.some(item => item.isHidden && !item.needsPermission && item.current > 0);
    if (hasOfficialData) {
      html += `
        <div class="mjjbox-data-source">
          ✅ 使用官方数据
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
              return `• ${item.name}: ${item.current}/${item.required} (${item.percentage}%)`;
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
      const username = getCurrentUsername();
      if (!username) {
        throw new Error('无法获取当前用户名');
      }

      console.log('🔍 获取用户等级数据:', username);

      if (!panel) createLevelPanel();

      const content = panel.querySelector('.mjjbox-panel-content');
      content.innerHTML = '<div class="mjjbox-loading">正在加载用户数据...</div>';

      const userData = await fetchUserData(username);
      const levelData = calculateLevelProgress(userData);

      updateLevelPanel(levelData);

    } catch (error) {
      console.error('❌ 获取用户等级失败:', error);
      if (panel) {
        const content = panel.querySelector('.mjjbox-panel-content');
        content.innerHTML = `<div class="mjjbox-loading" style="color: #dc3545;">❌ ${error.message}</div>`;
      }
      showNotification(`获取数据失败: ${error.message}`, 'error');
    } finally {
      isLoading = false;
    }
  };

  /* ========== 设置面板 ========== */
  const showSettingsModal = () => {
    // 移除已存在的模态框
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

    // 添加模态框样式
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
        background: rgba(0, 0, 0, 0.5);
      }

      .mjjbox-modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }

      .mjjbox-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
      }

      .mjjbox-modal-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #495057;
      }

      .mjjbox-modal-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        color: #6c757d;
      }

      .mjjbox-modal-close:hover {
        color: #495057;
      }

      .mjjbox-modal-body {
        padding: 0;
        max-height: 60vh;
        overflow-y: auto;
      }

      .mjjbox-settings-tabs {
        display: flex;
        background: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
      }

      .mjjbox-settings-tab {
        flex: 1;
        padding: 12px 16px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        color: #6c757d;
        transition: all 0.2s;
      }

      .mjjbox-settings-tab.active {
        background: white;
        color: #495057;
        font-weight: 500;
      }

      .mjjbox-settings-tab:hover {
        background: #e9ecef;
      }

      .mjjbox-settings-content {
        padding: 20px;
      }

      .mjjbox-settings-panel {
        display: none;
      }

      .mjjbox-settings-panel.active {
        display: block;
      }

      .mjjbox-form-group {
        margin-bottom: 16px;
      }

      .mjjbox-form-label {
        display: block;
        margin-bottom: 6px;
        font-weight: 500;
        color: #495057;
      }

      .mjjbox-form-control {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.2s;
      }

      .mjjbox-form-control:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      }

      .mjjbox-checkbox {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-weight: normal;
      }

      .mjjbox-checkbox input {
        margin-right: 8px;
        width: auto;
      }

      .mjjbox-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 16px 20px;
        background: #f8f9fa;
        border-top: 1px solid #dee2e6;
      }

      .mjjbox-btn {
        padding: 8px 16px;
        border: 1px solid transparent;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .mjjbox-btn-primary {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }

      .mjjbox-btn-primary:hover {
        background: #0056b3;
        border-color: #0056b3;
      }

      .mjjbox-btn-secondary {
        background: #6c757d;
        color: white;
        border-color: #6c757d;
      }

      .mjjbox-btn-secondary:hover {
        background: #545b62;
        border-color: #545b62;
      }
    `);

    document.body.appendChild(modal);

    // 显示模态框
    setTimeout(() => modal.classList.add('show'), 10);

    // 绑定事件
    setupModalEvents(modal);
  };

  const setupModalEvents = (modal) => {
    // 关闭模态框
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

    // 收集当前设置
    const tempConfig = { ...currentConfig };

    // 背景设置
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

    // 字体设置
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

    // 主题设置
    const themeEnabled = modal.querySelector('#theme-enabled');
    const themePrimary = modal.querySelector('#theme-primary');
    const themeSecondary = modal.querySelector('#theme-secondary');
    const themeAccent = modal.querySelector('#theme-accent');
    const themeRadius = modal.querySelector('#theme-radius');

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
    Object.keys(defaultConfig).forEach(category => {
      Object.keys(defaultConfig[category]).forEach(key => {
        GM_deleteValue(`mjjbox_${category.substring(0, 2)}_${key}`);
      });
    });

    // 重新应用样式
    applyCustomStyles();

    // 更新表单
    const bgEnabled = modal.querySelector('#bg-enabled');
    const bgUrl = modal.querySelector('#bg-url');
    const fontEnabled = modal.querySelector('#font-enabled');
    const fontFamily = modal.querySelector('#font-family');
    const themeEnabled = modal.querySelector('#theme-enabled');

    if (bgEnabled) bgEnabled.checked = false;
    if (bgUrl) bgUrl.value = '';
    if (fontEnabled) fontEnabled.checked = false;
    if (fontFamily) fontFamily.value = 'inherit';
    if (themeEnabled) themeEnabled.checked = false;

    showNotification('✅ 设置已重置', 'success');
  };

  /* ========== 主入口 ========== */
  const createFloatingButton = () => {
    const button = document.createElement('div');
    button.className = 'mjjbox-floating-btn';
    button.innerHTML = '📊';
    button.title = 'MJJBOX 等级助手';

    GM_addStyle(`
      .mjjbox-floating-btn {
        position: fixed;
        top: 20px;
        right: 80px;
        width: 50px;
        height: 50px;
        background: #007bff;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        transition: all 0.3s ease;
        user-select: none;
      }

      .mjjbox-floating-btn:hover {
        background: #0056b3;
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }

      .mjjbox-floating-btn:active {
        transform: scale(0.95);
      }
    `);

    button.addEventListener('click', fetchUserLevel);
    document.body.appendChild(button);
  };

  /* ========== 初始化 ========== */
  const init = () => {
    console.log('🚀 MJJBOX 增强助手初始化');

    // 加载配置
    loadConfig();

    // 应用自定义样式
    applyCustomStyles();

    // 创建浮动按钮
    createFloatingButton();

    console.log('✅ MJJBOX 增强助手初始化完成');
  };

  // 等待页面加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// ==UserScript==
// @name         MJJBOX真实自动点赞脚本
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  真正有效的MJJBOX自动点赞脚本 - 自动打开帖子并点赞
// @author       CodeBuddy
// @match        https://mjjbox.com/*
// @match        https://www.mjjbox.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 配置选项
    const CONFIG = {
        enabled: GM_getValue('autoLikeEnabled', false),
        minDelay: GM_getValue('minDelay', 3000),
        maxDelay: GM_getValue('maxDelay', 8000),
        maxLikesPerSession: GM_getValue('maxLikesPerSession', 15),
        likeProb: GM_getValue('likeProb', 0.9),
        likeComments: GM_getValue('likeComments', true),
        maxCommentsPerPost: GM_getValue('maxCommentsPerPost', 5),
        returnDelay: GM_getValue('returnDelay', 2000)
    };

    // 统计数据
    let stats = {
        totalLikes: GM_getValue('totalLikes', 0),
        todayLikes: GM_getValue('todayLikes', 0),
        lastDate: GM_getValue('lastDate', new Date().toDateString()),
        sessionLikes: 0,
        postsProcessed: 0,
        commentsLiked: 0
    };

    // 检查是否是新的一天
    if (stats.lastDate !== new Date().toDateString()) {
        stats.todayLikes = 0;
        stats.lastDate = new Date().toDateString();
        GM_setValue('todayLikes', 0);
        GM_setValue('lastDate', stats.lastDate);
    }

    // 已处理的帖子和评论
    let processedPosts = new Set(GM_getValue('processedPosts', '').split(',').filter(id => id));
    let likedComments = new Set(GM_getValue('likedComments', '').split(',').filter(id => id));

    // 运行状态
    let isRunning = false;
    let currentPostQueue = [];
    let currentPostIndex = 0;
    let originalUrl = '';

    // 创建控制面板
    function createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'mjjbox-real-like-panel';
        panel.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; z-index: 9999;
                        background: #fff; border: 2px solid #e74c3c; border-radius: 8px;
                        padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        font-family: Arial, sans-serif; min-width: 300px;">
                <h3 style="margin: 0 0 10px 0; color: #e74c3c; font-size: 16px;">
                    💯 MJJBOX真实点赞 v4.0
                </h3>
                <div style="margin-bottom: 10px;">
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="enableAutoLike" ${CONFIG.enabled ? 'checked' : ''}>
                        <span style="margin-left: 5px;">启用自动点赞</span>
                    </label>
                </div>
                <div style="margin-bottom: 8px; font-size: 12px; background: #f8f9fa; padding: 8px; border-radius: 4px;">
                    <div><strong>统计信息:</strong></div>
                    <div>今日点赞: <span id="todayCount">${stats.todayLikes}</span></div>
                    <div>总计点赞: <span id="totalCount">${stats.totalLikes}</span></div>
                    <div>本次点赞: <span id="sessionCount">${stats.sessionLikes}</span></div>
                    <div>处理帖子: <span id="postsCount">${stats.postsProcessed}</span></div>
                    <div>评论点赞: <span id="commentsCount">${stats.commentsLiked}</span></div>
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 12px;">延时范围(秒):</label>
                    <input type="number" id="minDelay" value="${CONFIG.minDelay/1000}"
                           style="width: 40px; margin: 0 2px;" min="2" max="30">
                    -
                    <input type="number" id="maxDelay" value="${CONFIG.maxDelay/1000}"
                           style="width: 40px; margin: 0 2px;" min="3" max="60">
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: flex; align-items: center; cursor: pointer; font-size: 12px;">
                        <input type="checkbox" id="likeComments" ${CONFIG.likeComments ? 'checked' : ''}>
                        <span style="margin-left: 5px;">同时点赞评论</span>
                    </label>
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="font-size: 12px;">单次最大:</label>
                    <input type="number" id="maxLikes" value="${CONFIG.maxLikesPerSession}"
                           style="width: 50px;" min="1" max="50">
                    <span style="font-size: 11px;">个帖子</span>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="startLiking" style="background: #28a745; color: white;
                            border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                        开始真实点赞
                    </button>
                    <button id="stopLiking" style="background: #dc3545; color: white;
                            border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                        停止
                    </button>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="testMode" style="background: #17a2b8; color: white;
                            border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-right: 5px;">
                        测试模式
                    </button>
                    <button id="findPosts" style="background: #ffc107; color: black;
                            border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                        查找帖子
                    </button>
                </div>
                <div style="font-size: 11px; color: #666; line-height: 1.3; background: #f8f9fa; padding: 5px; border-radius: 3px;">
                    状态: <span id="status">待机中</span><br>
                    <span id="progress"></span>
                </div>
                <button id="togglePanel" style="position: absolute; top: 5px; right: 5px;
                        background: none; border: none; font-size: 16px; cursor: pointer;">
                    ➖
                </button>
            </div>
        `;
        document.body.appendChild(panel);

        // 绑定事件
        bindPanelEvents();
    }

    // 绑定面板事件
    function bindPanelEvents() {
        document.getElementById('enableAutoLike').addEventListener('change', function() {
            CONFIG.enabled = this.checked;
            GM_setValue('autoLikeEnabled', CONFIG.enabled);
        });

        document.getElementById('minDelay').addEventListener('change', function() {
            CONFIG.minDelay = parseInt(this.value) * 1000;
            GM_setValue('minDelay', CONFIG.minDelay);
        });

        document.getElementById('maxDelay').addEventListener('change', function() {
            CONFIG.maxDelay = parseInt(this.value) * 1000;
            GM_setValue('maxDelay', CONFIG.maxDelay);
        });

        document.getElementById('likeComments').addEventListener('change', function() {
            CONFIG.likeComments = this.checked;
            GM_setValue('likeComments', CONFIG.likeComments);
        });

        document.getElementById('maxLikes').addEventListener('change', function() {
            CONFIG.maxLikesPerSession = parseInt(this.value);
            GM_setValue('maxLikesPerSession', CONFIG.maxLikesPerSession);
        });

        document.getElementById('startLiking').addEventListener('click', startRealAutoLike);
        document.getElementById('stopLiking').addEventListener('click', stopAutoLike);
        document.getElementById('testMode').addEventListener('click', testMode);
        document.getElementById('findPosts').addEventListener('click', findAndShowPosts);

        document.getElementById('togglePanel').addEventListener('click', function() {
            const content = this.parentElement;
            const children = Array.from(content.children).filter(child => child !== this);
            const isHidden = children[0].style.display === 'none';

            children.forEach(child => {
                child.style.display = isHidden ? 'block' : 'none';
            });
            this.textContent = isHidden ? '➖' : '➕';
        });
    }

    // 更新状态
    function updateStatus(status) {
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = status;
        console.log(`🤖 [状态] ${status}`);
    }

    // 更新进度
    function updateProgress(current, total) {
        const progressEl = document.getElementById('progress');
        if (progressEl && total > 0) {
            progressEl.textContent = `进度: ${current}/${total}`;
        }
    }

    // 更新统计
    function updateStats() {
        const elements = {
            todayCount: stats.todayLikes,
            totalCount: stats.totalLikes,
            sessionCount: stats.sessionLikes,
            postsCount: stats.postsProcessed,
            commentsCount: stats.commentsLiked
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }

    // 查找帖子链接
    function findPostLinks() {
        const posts = [];

        console.log('🔍 开始查找帖子链接...');

        // 查找所有可能的帖子链接
        const allLinks = document.querySelectorAll('a');

        allLinks.forEach((link, index) => {
            const href = link.href || '';
            const text = link.textContent.trim();

            // 检查是否是帖子链接 - MJJBOX使用的URL格式
            if (href && href.includes('mjjbox.com/t/') && text && text.length > 5) {
                // 提取帖子ID
                const match = href.match(/\/t\/[^\/]+\/(\d+)/);
                const postId = match ? match[1] : href.split('/').pop();

                if (postId && !processedPosts.has(postId)) {
                    posts.push({
                        id: postId,
                        title: text,
                        url: href,
                        element: link
                    });
                    console.log(`✅ 找到帖子: ${text} - ${href}`);
                }
            }
        });

        console.log(`📋 总共找到 ${posts.length} 个新帖子`);
        return posts;
    }

    // 查找并显示帖子（调试用）
    function findAndShowPosts() {
        updateStatus('查找帖子中...');
        const posts = findPostLinks();

        if (posts.length > 0) {
            updateStatus(`找到 ${posts.length} 个帖子`);

            // 高亮显示找到的帖子链接
            posts.forEach((post, i) => {
                post.element.style.border = '2px solid #e74c3c';
                post.element.style.backgroundColor = '#fff3cd';

                setTimeout(() => {
                    post.element.style.border = '';
                    post.element.style.backgroundColor = '';
                }, 5000);
            });

            GM_notification({
                text: `找到 ${posts.length} 个帖子，已高亮显示`,
                timeout: 3000
            });
        } else {
            updateStatus('未找到新帖子');
            GM_notification({
                text: '当前页面未找到新的帖子链接',
                timeout: 3000
            });
        }
    }

    // 在帖子页面查找点赞按钮
    function findLikeButtonsInPost() {
        const buttons = [];

        // MJJBOX论坛的点赞按钮选择器 - 专门针对右下角的💗按钮
        const selectors = [
            // 右下角的心形按钮 - 最优先
            'button[title="赞"]',
            'button[aria-label="赞"]',
            'button[title="like"]',
            'button[aria-label="like"]',
            // 包含心形图标的按钮
            'button .d-icon-heart',
            'button .fa-heart',
            'button svg[class*="heart"]',
            // 帖子底部操作区域的按钮
            '.topic-footer-main-buttons button',
            '.topic-footer-buttons button',
            '.post-controls .actions button',
            '.post-menu-area button',
            // Discourse标准选择器
            '.discourse-reactions-reaction-button',
            'button[data-emoji-name="heart"]',
            // 通过父容器查找
            '.topic-footer button:has(.d-icon-heart)',
            '.post-controls button:has(.d-icon-heart)',
            // 更通用的选择器
            '.like-button',
            '.btn-like',
            '.heart-button',
            '.reaction-button'
        ];

        console.log('❤️ 在帖子页面查找点赞按钮...');

        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                console.log(`选择器 "${selector}": ${elements.length} 个元素`);

                elements.forEach(el => {
                    if (el.offsetParent !== null && !el.disabled && !el.classList.contains('liked')) {
                        const text = el.textContent || el.title || el.getAttribute('aria-label') || '';
                        const dataEmoji = el.getAttribute('data-emoji-name') || '';

                        // 检查是否是点赞按钮
                        if (text.includes('赞') || text.includes('like') || text.includes('❤') ||
                            dataEmoji === 'heart' || dataEmoji === '+1' ||
                            el.classList.contains('like') || el.classList.contains('heart')) {

                            buttons.push(el);
                            console.log(`✅ 找到点赞按钮: "${text}" (${dataEmoji})`);
                        }
                    }
                });
            } catch (e) {
                console.log(`选择器 "${selector}" 查询失败:`, e);
            }
        });

        // 如果没找到标准按钮，使用更精确的方法查找右下角的💗按钮
        if (buttons.length === 0) {
            console.log('🔍 使用精确方法查找右下角💗按钮...');

            // 查找所有按钮，重点关注右下角区域
            const allButtons = document.querySelectorAll('button, a[role="button"], .btn');

            allButtons.forEach(btn => {
                const text = btn.textContent || btn.title || btn.getAttribute('aria-label') || '';
                const classes = btn.className || '';
                const onclick = btn.getAttribute('onclick') || '';

                // 检查按钮位置 - 右下角的按钮通常在帖子底部
                const rect = btn.getBoundingClientRect();
                const isInRightArea = rect.right > window.innerWidth * 0.7; // 右侧70%区域

                // 检查是否包含心形图标
                const hasHeartIcon = btn.querySelector('.d-icon-heart, .fa-heart, svg[class*="heart"]');

                // 检查文本内容
                const isLikeButton = text.includes('赞') || text.includes('like') || text.includes('❤') ||
                                   text.includes('💗') || text.includes('♥') ||
                                   classes.includes('like') || classes.includes('heart') ||
                                   onclick.includes('like') || onclick.includes('heart');

                if ((isLikeButton || hasHeartIcon) &&
                    btn.offsetParent !== null &&
                    !text.includes('已赞') &&
                    !text.includes('取消') &&
                    !btn.classList.contains('liked') &&
                    !btn.disabled) {

                    buttons.push(btn);
                    console.log(`💖 找到按钮: "${text}" (位置: ${rect.right.toFixed(0)}, 有心形图标: ${!!hasHeartIcon})`);
                }
            });

            // 特别查找包含💗符号的元素
            const heartElements = document.querySelectorAll('*');
            heartElements.forEach(el => {
                if ((el.textContent === '💗' || el.innerHTML.includes('💗')) &&
                    (el.tagName === 'BUTTON' || el.closest('button'))) {
                    const button = el.tagName === 'BUTTON' ? el : el.closest('button');
                    if (button && !buttons.includes(button)) {
                        buttons.push(button);
                        console.log('💗 找到心形符号按钮');
                    }
                }
            });
        }

        console.log(`🎯 在帖子页面找到 ${buttons.length} 个点赞按钮`);
        return buttons;
    }

    // 执行点赞操作
    async function performLike(button, type = '帖子') {
        try {
            const text = button.textContent || button.title || button.getAttribute('aria-label') || '';
            console.log(`❤️ 准备点赞${type}: ${text}`);

            // 滚动到按钮位置
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await sleep(1000);

            // 记录点击前的状态
            const beforeClick = button.classList.contains('liked') || button.classList.contains('active');

            // 点击按钮
            button.click();

            // 等待响应
            await sleep(2000);

            // 检查点击后的状态
            const afterClick = button.classList.contains('liked') || button.classList.contains('active');

            // 判断是否成功
            const success = !beforeClick && afterClick;

            if (success) {
                // 更新统计
                stats.totalLikes++;
                stats.todayLikes++;
                stats.sessionLikes++;

                if (type === '评论') {
                    stats.commentsLiked++;
                }

                // 保存数据
                GM_setValue('totalLikes', stats.totalLikes);
                GM_setValue('todayLikes', stats.todayLikes);

                updateStats();

                console.log(`✅ ${type}点赞成功: ${text}`);
                return true;
            } else {
                console.log(`⚠️ ${type}点赞可能失败或已经点过赞`);
                return false;
            }
        } catch (error) {
            console.error(`❌ ${type}点赞失败:`, error);
            return false;
        }
    }

    // 处理单个帖子
    async function processPost(post) {
        try {
            updateStatus(`打开帖子: ${post.title.substring(0, 20)}...`);
            console.log(`📖 处理帖子: ${post.title}`);

            // 保存当前URL
            const returnUrl = window.location.href;

            // 跳转到帖子页面
            window.location.href = post.url;

            // 等待页面加载
            await sleep(CONFIG.returnDelay + 2000);

            // 检查是否成功跳转到帖子页面
            if (!window.location.href.includes('/t/')) {
                console.log('❌ 未能成功跳转到帖子页面');
                return false;
            }

            updateStatus('查找点赞按钮...');

            // 等待页面完全加载
            let attempts = 0;
            while (attempts < 10) {
                const likeButtons = findLikeButtonsInPost();

                if (likeButtons.length > 0) {
                    updateStatus(`找到 ${likeButtons.length} 个点赞按钮`);

                    // 点赞主帖
                    let mainPostLiked = false;
                    if (likeButtons.length > 0) {
                        mainPostLiked = await performLike(likeButtons[0], '帖子');
                        await randomDelay();
                    }

                    // 点赞评论（如果启用）
                    if (CONFIG.likeComments && likeButtons.length > 1) {
                        const commentsToLike = Math.min(
                            likeButtons.length - 1,
                            CONFIG.maxCommentsPerPost
                        );

                        for (let i = 1; i <= commentsToLike; i++) {
                            if (Math.random() < CONFIG.likeProb) {
                                await performLike(likeButtons[i], '评论');
                                await randomDelay();
                            }
                        }
                    }

                    // 标记帖子为已处理
                    processedPosts.add(post.id);
                    stats.postsProcessed++;

                    // 保存已处理的帖子
                    GM_setValue('processedPosts', Array.from(processedPosts).join(','));

                    updateStats();

                    // 返回原页面
                    updateStatus('返回列表页...');
                    window.location.href = returnUrl;
                    await sleep(CONFIG.returnDelay);

                    return true;
                }

                // 如果没找到按钮，等待一下再试
                await sleep(1000);
                attempts++;
            }

            console.log('❌ 未找到点赞按钮');

            // 返回原页面
            window.location.href = returnUrl;
            await sleep(CONFIG.returnDelay);

            return false;

        } catch (error) {
            console.error('❌ 处理帖子失败:', error);
            return false;
        }
    }

    // 睡眠函数
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 随机延时
    function randomDelay() {
        const delay = Math.random() * (CONFIG.maxDelay - CONFIG.minDelay) + CONFIG.minDelay;
        console.log(`⏰ 等待 ${(delay/1000).toFixed(1)} 秒...`);
        return sleep(delay);
    }

    // 开始真实自动点赞
    async function startRealAutoLike() {
        if (isRunning) return;

        isRunning = true;
        stats.sessionLikes = 0;
        stats.postsProcessed = 0;
        stats.commentsLiked = 0;
        updateStats();

        try {
            updateStatus('初始化真实点赞...');
            originalUrl = window.location.href;

            // 获取帖子列表
            currentPostQueue = findPostLinks();

            if (currentPostQueue.length === 0) {
                updateStatus('未找到可处理的帖子');
                GM_notification({
                    text: '当前页面未找到新的帖子，请刷新页面或换个页面试试',
                    timeout: 5000
                });
                isRunning = false;
                return;
            }

            const maxPosts = Math.min(currentPostQueue.length, CONFIG.maxLikesPerSession);
            console.log(`📊 准备处理 ${maxPosts} 个帖子`);

            GM_notification({
                text: `开始真实点赞！将处理 ${maxPosts} 个帖子`,
                timeout: 3000
            });

            // 逐个处理帖子
            for (let i = 0; i < maxPosts && isRunning; i++) {
                const post = currentPostQueue[i];
                updateProgress(i + 1, maxPosts);

                console.log(`📖 处理第 ${i + 1}/${maxPosts} 个帖子: ${post.title}`);

                const success = await processPost(post);

                if (success) {
                    console.log(`✅ 第 ${i + 1} 个帖子处理成功`);
                } else {
                    console.log(`❌ 第 ${i + 1} 个帖子处理失败`);
                }

                // 处理间隔
                if (i < maxPosts - 1) {
                    await randomDelay();
                }
            }

            updateStatus(`完成 - 处理了 ${stats.postsProcessed} 个帖子，点赞 ${stats.sessionLikes} 次`);
            GM_notification({
                text: `真实点赞完成！处理了 ${stats.postsProcessed} 个帖子，总共点赞 ${stats.sessionLikes} 次`,
                timeout: 8000
            });

        } catch (error) {
            console.error('❌ 真实自动点赞出错:', error);
            updateStatus('出现错误');
        } finally {
            isRunning = false;
        }
    }

    // 停止自动点赞
    function stopAutoLike() {
        isRunning = false;
        updateStatus('已停止');
        console.log('🛑 用户停止了自动点赞');

        // 如果不在原始页面，返回原始页面
        if (originalUrl && window.location.href !== originalUrl) {
            setTimeout(() => {
                window.location.href = originalUrl;
            }, 1000);
        }
    }

    // 测试模式
    function testMode() {
        updateStatus('测试模式运行中...');

        // 测试查找帖子
        const posts = findPostLinks();
        console.log('🧪 测试结果:');
        console.log(`找到帖子: ${posts.length} 个`);

        // 测试查找点赞按钮
        const buttons = findLikeButtonsInPost();
        console.log(`找到点赞按钮: ${buttons.length} 个`);

        updateStatus(`测试完成 - 帖子:${posts.length} 按钮:${buttons.length}`);

        GM_notification({
            text: `测试完成！找到 ${posts.length} 个帖子，${buttons.length} 个点赞按钮`,
            timeout: 5000
        });
    }

    // 注册菜单命令
    GM_registerMenuCommand('清除处理记录', function() {
        if (confirm('确定要清除所有处理记录吗？')) {
            processedPosts.clear();
            likedComments.clear();
            GM_setValue('processedPosts', '');
            GM_setValue('likedComments', '');
            GM_notification({
                text: '处理记录已清除',
                timeout: 2000
            });
        }
    });

    // 页面加载完成后初始化
    function init() {
        if (!window.location.hostname.includes('mjjbox.com')) {
            return;
        }

        console.log('🚀 MJJBOX真实自动点赞脚本 v4.0 已加载');
        console.log('📄 当前页面:', window.location.href);

        // 创建控制面板
        createControlPanel();

        // 如果启用了自动点赞，延时启动
        if (CONFIG.enabled) {
            setTimeout(() => {
                startRealAutoLike();
            }, 5000);
        }
    }

    // 等待页面完全加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 2000);
    }

})();
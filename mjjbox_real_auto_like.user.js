// ==UserScript==
// @name         MJJBOX精确自动点赞脚本
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  根据精确HTML结构优化的MJJBOX自动点赞脚本
// @author       MJJBOX
// @match        https://mjjbox.com/*
// @match        https://www.mjjbox.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_registerMenuCommand
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

    // 已处理的帖子
    let processedPosts = new Set(GM_getValue('processedPosts', '').split(',').filter(id => id));

    // 运行状态
    let isRunning = false;
    let currentPostQueue = [];
    let originalUrl = '';

    // 创建控制面板
    function createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'mjjbox-optimized-like-panel';
        panel.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; z-index: 9999; 
                        background: #fff; border: 2px solid #28a745; border-radius: 8px; 
                        padding: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                        font-family: Arial, sans-serif; min-width: 300px;">
                <h3 style="margin: 0 0 10px 0; color: #28a745; font-size: 16px;">
                    🎯 MJJBOX精确点赞 v5.0
                </h3>
                <div style="margin-bottom: 8px; font-size: 12px; background: #f8f9fa; padding: 8px; border-radius: 4px;">
                    <div><strong>统计信息:</strong></div>
                    <div>今日点赞: <span id="todayCount">${stats.todayLikes}</span></div>
                    <div>总计点赞: <span id="totalCount">${stats.totalLikes}</span></div>
                    <div>本次点赞: <span id="sessionCount">${stats.sessionLikes}</span></div>
                    <div>处理帖子: <span id="postsCount">${stats.postsProcessed}</span></div>
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
                    <label style="font-size: 12px;">单次最大:</label>
                    <input type="number" id="maxLikes" value="${CONFIG.maxLikesPerSession}" 
                           style="width: 50px;" min="1" max="50">
                    <span style="font-size: 11px;">个帖子</span>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="startLiking" style="background: #28a745; color: white; 
                            border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                        开始精确点赞
                    </button>
                    <button id="stopLiking" style="background: #dc3545; color: white; 
                            border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                        停止
                    </button>
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="testDiscourse" style="background: #17a2b8; color: white; 
                            border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; margin-right: 5px;">
                        测试Discourse按钮
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
        bindPanelEvents();
    }

    // 绑定面板事件
    function bindPanelEvents() {
        document.getElementById('minDelay').addEventListener('change', function() {
            CONFIG.minDelay = parseInt(this.value) * 1000;
            GM_setValue('minDelay', CONFIG.minDelay);
        });

        document.getElementById('maxDelay').addEventListener('change', function() {
            CONFIG.maxDelay = parseInt(this.value) * 1000;
            GM_setValue('maxDelay', CONFIG.maxDelay);
        });

        document.getElementById('maxLikes').addEventListener('change', function() {
            CONFIG.maxLikesPerSession = parseInt(this.value);
            GM_setValue('maxLikesPerSession', CONFIG.maxLikesPerSession);
        });

        document.getElementById('startLiking').addEventListener('click', startOptimizedAutoLike);
        document.getElementById('stopLiking').addEventListener('click', stopAutoLike);
        document.getElementById('testDiscourse').addEventListener('click', testDiscourseButtons);
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
        console.log(`🎯 [状态] ${status}`);
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
            postsCount: stats.postsProcessed
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
        
        const allLinks = document.querySelectorAll('a');
        
        allLinks.forEach((link, index) => {
            const href = link.href || '';
            const text = link.textContent.trim();
            
            // MJJBOX使用的URL格式: /t/xxx/xxx
            if (href && href.includes('mjjbox.com/t/') && text && text.length > 5) {
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
            
            posts.forEach((post, i) => {
                post.element.style.border = '2px solid #28a745';
                post.element.style.backgroundColor = '#d4edda';
                
                setTimeout(() => {
                    post.element.style.border = '';
                    post.element.style.backgroundColor = '';
                }, 5000);
            });
            

        } else {
            updateStatus('未找到新帖子');
        }
    }

    // 精确查找Discourse反应按钮
    function findDiscourseReactionButtons() {
        const buttons = [];
        
        console.log('🎯 精确查找Discourse反应按钮...');
        
        // 根据你提供的HTML结构，精确查找
        const preciseSelectors = [
            // 最精确的选择器 - 根据截图HTML结构
            '.discourse-reactions-actions .discourse-reactions-reaction-button',
            'div[class*="discourse-reactions-actions"] button[class*="discourse-reactions-reaction-button"]',
            '.actions .discourse-reactions-reaction-button',
            // 备用选择器
            'button.discourse-reactions-reaction-button',
            '.discourse-reactions-reaction-button[data-reaction-name]',
            'div.actions button[class*="discourse-reactions"]'
        ];

        preciseSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                console.log(`🔍 选择器 "${selector}": ${elements.length} 个元素`);
                
                elements.forEach(el => {
                    if (el.offsetParent !== null && !el.disabled && !buttons.includes(el)) {
                        buttons.push(el);
                        console.log(`✅ 找到Discourse反应按钮: ${el.className}`);
                        console.log(`   - 文本: "${el.textContent.trim()}"`);
                        console.log(`   - 标题: "${el.title || '无'}"`);
                        console.log(`   - 数据属性: ${el.getAttribute('data-reaction-name') || '无'}`);
                    }
                });
            } catch (e) {
                console.log(`❌ 选择器 "${selector}" 查询失败:`, e);
            }
        });

        // 如果还是没找到，尝试更通用的方法
        if (buttons.length === 0) {
            console.log('🔍 使用通用方法查找反应按钮...');
            
            // 查找所有包含"actions"的div
            const actionDivs = document.querySelectorAll('div[class*="actions"], .actions');
            actionDivs.forEach(div => {
                const divButtons = div.querySelectorAll('button');
                divButtons.forEach(btn => {
                    if (btn.offsetParent !== null && !btn.disabled && !buttons.includes(btn)) {
                        buttons.push(btn);
                        console.log(`🔧 从actions容器找到按钮: ${btn.className}`);
                    }
                });
            });
        }

        console.log(`🎯 总共找到 ${buttons.length} 个Discourse反应按钮`);
        return buttons;
    }

    // 测试Discourse按钮识别
    function testDiscourseButtons() {
        updateStatus('测试Discourse按钮识别...');
        const buttons = findDiscourseReactionButtons();
        
        if (buttons.length > 0) {
            updateStatus(`找到 ${buttons.length} 个Discourse按钮`);
            
            // 高亮显示找到的按钮
            buttons.forEach((btn, i) => {
                btn.style.border = '3px solid #28a745';
                btn.style.boxShadow = '0 0 10px #28a745';
                
                setTimeout(() => {
                    btn.style.border = '';
                    btn.style.boxShadow = '';
                }, 5000);
            });
            
        } else {
            updateStatus('未找到Discourse按钮');
        }
    }

    // 执行点赞操作
    async function performLike(button, type = '帖子') {
        try {
            const text = button.textContent.trim() || button.title || button.getAttribute('aria-label') || '';
            const className = button.className || '';
            console.log(`❤️ 准备点赞${type}: "${text}" (${className})`);
            
            // 滚动到按钮位置
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await sleep(1000);
            
            // 记录点击前的状态
            const beforeClasses = button.className;
            const beforeText = button.textContent;
            
            // 点击按钮
            button.click();
            console.log(`🖱️ 已点击按钮`);
            
            // 等待响应
            await sleep(3000);
            
            // 检查点击后的状态变化
            const afterClasses = button.className;
            const afterText = button.textContent;
            
            const hasStateChange = beforeClasses !== afterClasses || beforeText !== afterText;
            
            if (hasStateChange) {
                // 更新统计
                stats.totalLikes++;
                stats.todayLikes++;
                stats.sessionLikes++;
                
                // 保存数据
                GM_setValue('totalLikes', stats.totalLikes);
                GM_setValue('todayLikes', stats.todayLikes);
                
                updateStats();
                
                console.log(`✅ ${type}点赞成功！状态已改变`);
                console.log(`   - 前: ${beforeClasses} | ${beforeText}`);
                console.log(`   - 后: ${afterClasses} | ${afterText}`);
                return true;
            } else {
                console.log(`⚠️ ${type}点赞可能失败，状态未改变`);
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
            await sleep(CONFIG.returnDelay + 3000);
            
            // 检查是否成功跳转到帖子页面
            if (!window.location.href.includes('/t/')) {
                console.log('❌ 未能成功跳转到帖子页面');
                return false;
            }
            
            updateStatus('查找Discourse反应按钮...');
            
            // 等待页面完全加载并查找按钮
            let attempts = 0;
            let buttons = [];
            
            while (attempts < 15 && buttons.length === 0) {
                buttons = findDiscourseReactionButtons();
                
                if (buttons.length === 0) {
                    console.log(`⏳ 第 ${attempts + 1} 次尝试，等待页面加载...`);
                    await sleep(1000);
                    attempts++;
                }
            }
            
            if (buttons.length > 0) {
                updateStatus(`找到 ${buttons.length} 个反应按钮`);
                
                // 按顺序点赞按钮 - 通常点赞前几个按钮
                let successCount = 0;
                const maxButtons = Math.min(buttons.length, 3); // 最多点赞3个按钮
                
                for (let i = 0; i < maxButtons; i++) {
                    // 检查停止状态
                    if (!isRunning) {
                        console.log('🛑 检测到停止信号，停止点赞');
                        break;
                    }
                    
                    if (Math.random() < CONFIG.likeProb) {
                        const success = await performLike(buttons[i], i === 0 ? '帖子' : '评论');
                        if (success) successCount++;
                        
                        // 按钮间延时
                        if (i < maxButtons - 1) {
                            await sleep(1000 + Math.random() * 2000);
                        }
                    }
                }
                
                // 标记帖子为已处理
                processedPosts.add(post.id);
                stats.postsProcessed++;
                
                // 保存已处理的帖子
                GM_setValue('processedPosts', Array.from(processedPosts).join(','));
                
                updateStats();
                
                console.log(`✅ 帖子处理完成，成功点赞 ${successCount} 个按钮`);
                
                // 返回原页面
                updateStatus('返回列表页...');
                window.location.href = returnUrl;
                await sleep(CONFIG.returnDelay);
                
                return true;
            } else {
                console.log('❌ 未找到Discourse反应按钮');
                
                // 返回原页面
                window.location.href = returnUrl;
                await sleep(CONFIG.returnDelay);
                
                return false;
            }
            
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

    // 开始优化的自动点赞
    async function startOptimizedAutoLike() {
        if (isRunning) return;
        
        isRunning = true;
        stats.sessionLikes = 0;
        stats.postsProcessed = 0;
        updateStats();
        
        try {
            updateStatus('初始化精确点赞...');
            originalUrl = window.location.href;
            
            // 获取帖子列表
            currentPostQueue = findPostLinks();
            
            if (currentPostQueue.length === 0) {
                updateStatus('未找到可处理的帖子');
                console.log('⚠️ 当前页面未找到新的帖子，请刷新页面或换个页面试试');
                isRunning = false;
                return;
            }
            
            const maxPosts = Math.min(currentPostQueue.length, CONFIG.maxLikesPerSession);
            console.log(`📊 准备处理 ${maxPosts} 个帖子`);
            

            
            // 按顺序处理帖子
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
                
                // 检查停止状态
                if (!isRunning) {
                    console.log('🛑 检测到停止信号，立即退出');
                    break;
                }
                
                // 处理间隔
                if (i < maxPosts - 1) {
                    await randomDelay();
                }
            }
            
            updateStatus(`完成 - 处理了 ${stats.postsProcessed} 个帖子，点赞 ${stats.sessionLikes} 次`);
            console.log(`🎉 精确点赞完成！处理了 ${stats.postsProcessed} 个帖子，总共点赞 ${stats.sessionLikes} 次`);
            
        } catch (error) {
            console.error('❌ 精确自动点赞出错:', error);
            updateStatus('出现错误');
        } finally {
            isRunning = false;
        }
    }

    // 停止自动点赞 - 立即停止
    function stopAutoLike() {
        isRunning = false;
        updateStatus('正在停止...');
        console.log('🛑 用户停止了自动点赞');
        
        // 立即返回原始页面
        if (originalUrl && window.location.href !== originalUrl) {
            updateStatus('返回原页面...');
            window.location.href = originalUrl;
        } else {
            updateStatus('已停止');
        }
    }

    // 注册菜单命令
    GM_registerMenuCommand('清除处理记录', function() {
        if (confirm('确定要清除所有处理记录吗？')) {
            processedPosts.clear();
            GM_setValue('processedPosts', '');
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

        console.log('🚀 MJJBOX精确自动点赞脚本 v5.0 已加载');
        console.log('📄 当前页面:', window.location.href);
        
        // 创建控制面板
        createControlPanel();
        
        // 如果启用了自动点赞，延时启动
        if (CONFIG.enabled) {
            setTimeout(() => {
                startOptimizedAutoLike();
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

/**
 * ZenCode Chat Integration (Tawk.to)
 * 自定义聊天按钮与 Tawk 客服集成
 */

var Tawk_API = Tawk_API || {}, Tawk_LoadStart = new Date();

// Tawk.to 配置
var tawkSrc = 'https://embed.tawk.to/695a13d84cd6f0197d100eb3/1je3tr1ao';

// 加载 Tawk 脚本
(function () {
    var s1 = document.createElement("script"), s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = tawkSrc;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s0.parentNode.insertBefore(s1, s0);
})();

// Tawk 加载完成后
Tawk_API.onLoad = function () {
    // 隐藏默认挂件，显示自定义按钮
    Tawk_API.hideWidget();
    document.getElementById('zencode-chat-btn').classList.remove('hidden');
};

// 切换聊天窗口
function toggleChat() {
    Tawk_API.toggle();
}

// 聊天窗口关闭时
Tawk_API.onChatMinimized = function () {
    Tawk_API.hideWidget();
    document.getElementById('zencode-chat-btn').classList.remove('hidden');
};

// 聊天窗口打开时（可选：隐藏悬浮球）
Tawk_API.onChatMaximized = function () {
    // document.getElementById('zencode-chat-btn').classList.add('hidden');
};

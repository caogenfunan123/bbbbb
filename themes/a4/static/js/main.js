/* A4 Hugo 主题主脚本 */

(function () {
  'use strict';

  /* ===== 回到顶部按钮 ===== */
  function initReturnToTop() {
    if (!document.body.dataset.returnToTop) return;
    var btn = document.createElement('button');
    btn.className = 'return-to-top';
    btn.innerHTML = '↑';
    btn.setAttribute('aria-label', '回到顶部');
    document.body.appendChild(btn);

    var show = function () {
      if (window.scrollY > 300) { btn.classList.add('show'); }
      else { btn.classList.remove('show'); }
    };
    window.addEventListener('scroll', show, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    show();
  }

  /* ===== 暗色模式切换按钮（跟随系统偏好） ===== */
  function initDarkMode() {
    if (!document.body.dataset.darkMode) return;

    var btn = document.createElement('button');
    btn.className = 'dark-mode-toggle';
    btn.innerHTML = '🌙';
    btn.setAttribute('aria-label', '切换暗色模式');
    document.body.appendChild(btn);

    var storageKey = 'a4-dark-mode';
    var saved = localStorage.getItem(storageKey);
    var media = window.matchMedia('(prefers-color-scheme: dark)');

    function apply(dark) {
      var root = document.documentElement;
      if (dark) { root.classList.add('dark'); root.setAttribute('data-theme', 'dark'); }
      else { root.classList.remove('dark'); root.setAttribute('data-theme', 'light'); }
      btn.innerHTML = dark ? '☀️' : '🌙';
    }

    if (saved) {
      apply(saved === 'dark');
    } else {
      apply(media.matches);
    }

    btn.addEventListener('click', function () {
      var dark = document.documentElement.classList.toggle('dark');
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      localStorage.setItem(storageKey, dark ? 'dark' : 'light');
      btn.innerHTML = dark ? '☀️' : '🌙';
    });
  }

  /* ===== 顶部目录平滑滚动 & 高亮 ===== */
  function initToc() {
    var toc = document.querySelector('.top-toc ul, .left-toc-container .tocify');
    if (!toc) return;
    toc.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (id && id.charAt(0) === '#') {
          var target = document.querySelector(id);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', id);
          }
        }
      });
    });
  }

  /* ===== 代码块复制按钮 ===== */
  function initCodeCopy() {
    if (!document.body.dataset.codeCopy) return;
    document.querySelectorAll('.post-content pre, .post-md pre').forEach(function (pre) {
      var btn = document.createElement('button');
      btn.className = 'code-copy';
      btn.innerHTML = '复制';
      btn.setAttribute('aria-label', '复制代码');
      pre.style.position = 'relative';
      pre.appendChild(btn);
      btn.addEventListener('click', function () {
        var code = pre.querySelector('code');
        var text = code ? code.innerText : pre.innerText;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            btn.innerHTML = '✓';
            setTimeout(function () { btn.innerHTML = '复制'; }, 1500);
          });
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initReturnToTop();
    initDarkMode();
    initToc();
    initCodeCopy();
  });
})();

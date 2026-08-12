/* 一言（Hitokoto） */
(function () {
  var el = document.getElementById('hitokoto');
  if (!el) return;
  fetch('https://v1.hitokoto.cn/?c=i&c=d&c=k')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      el.textContent = data.hitokoto || '';
    })
    .catch(function () {
      el.textContent = '『让读者专注于阅读文字，写者专注于写作。』';
    });
})();

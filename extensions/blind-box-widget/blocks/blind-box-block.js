// Blind Box Widget — resize iframe to fit content
(function () {
  document.querySelectorAll('.blind-box-widget-block iframe').forEach(function (frame) {
    frame.addEventListener('load', function () {
      try {
        var h = frame.contentWindow.document.body.scrollHeight;
        if (h > 0) frame.style.height = h + 'px';
      } catch (e) {}
    });
  });
})();

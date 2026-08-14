(function () {
  var TOOL = (document.querySelector('meta[name="tool-id"]') || {}).content
  if (!TOOL) return

  // Get or create persistent anonymous UUID
  var uid = localStorage.getItem('diag_uid')
  if (!uid) {
    uid = crypto.randomUUID()
    localStorage.setItem('diag_uid', uid)
  }

  // Attach to all known export buttons (each HTML file has a subset of these)
  ;['exportBtn', 'downloadBtn', 'exportViewsBtn', 'downloadIsoFromPreviewBtn', 'downloadViewsFromPreviewBtn', 'exportPractice', 'exportCreator'].forEach(function (id) {
    var btn = document.getElementById(id)
    if (!btn) return
    btn.addEventListener('click', function () {
      fetch('/api/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid: uid, tool: TOOL }),
      }).catch(function () {}) // silent fail — never interrupt the user
    })
  })
})()

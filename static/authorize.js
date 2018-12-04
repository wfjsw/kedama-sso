
const progress = new mdc.linearProgress.MDCLinearProgress(document.getElementById('progress'))
const error_indicator = document.getElementById('error-indicator')

async function authorize() {
    error_indicator.style.display = 'none'
    progress.open()
    const btn = document.getElementById('authorize-btn')
    btn.disabled = true
    const req = await fetch('/sso/authorize', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        cache: 'no-cache'
    })
    const res = await req.json()
    progress.close()
    btn.disabled = false
    if (res.ok) {
        location.href = res.redirect
    } else {
        const { code, description } = res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

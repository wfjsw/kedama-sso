const submit_btn = document.getElementById('logout-btn')
const error_indicator = document.getElementById('error-indicator')
const progress = new mdc.linearProgress.MDCLinearProgress(document.getElementById('progress'))

async function doLogout() {
    error_indicator.style.display = 'none'
    submit_btn.disabled = true
    progress.open()
    const logout_body = {
        confirm: true
    }
    const logout_req = await fetch('/logout', {
        method: 'POST',
        body: JSON.stringify(logout_body),
        credentials: 'same-origin',
        cache: 'no-cache'
    })
    const logout_res = await logout_req.json()
    if (logout_res.ok) {
        const urlParams = new URLSearchParams(window.location.search)
        const redirect = urlParams.get('redirect')
        if (redirect) {
            location.href = redirect
        } else {
            location.href = '/'
        }
    } else {
        progress.close()
        submit_btn.disabled = false
        const { code, description } = logout_res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

submit_btn.addEventListener('click', doLogout)

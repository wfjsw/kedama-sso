const progress = new mdc.linearProgress.MDCLinearProgress(document.getElementById('progress'))
const error_indicator = document.getElementById('error-indicator')
const client_id = document.getElementById('client_id')
const app_name = document.getElementById('app_name')
const homepage_url = document.getElementById('homepage_url')
const callback_url = document.getElementById('callback_url')
const form = document.getElementById('editform')

async function revokeAllToken() {
    error_indicator.style.display = 'none'
    progress.open()
    const btn = document.getElementById('revoke-btn')
    btn.disabled = true
    const req = await fetch(`/oauthClient/client/${client_id.value}/purgeTokens`, {
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
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `成功。`
    } else {
        const { code, description } = res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}
async function resetClientSecret() {
    error_indicator.style.display = 'none'
    progress.open()
    const btn = document.getElementById('resetsecret-btn')
    btn.disabled = true
    const req = await fetch(`/oauthClient/client/${client_id.value}/resetSecret`, {
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
        location.reload()
    } else {
        const { code, description } = res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}
async function newClient() {
    if (!form.reportValidity()) return
    error_indicator.style.display = 'none'
    if (!app_name.value || !callback_url.value) return 
    progress.open()
    const btn = document.getElementById('save-btn')
    btn.disabled = true
    const body = {
        app_name: app_name.value,
        homepage_url: homepage_url.value,
        callback_url: callback_url.value
    }
    const req = await fetch('/oauthClient/client', {
        method: 'POST',
        body: JSON.stringify(body),
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        cache: 'no-cache'
    })
    const res = await req.json()
    if (res.ok) {
        const { client_id } = res.data
        location.href = `/editclient?client_id=${client_id}`
    } else {
        progress.close()
        const { code, description } = res
        btn.disabled = false
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}
async function saveChanges() {
    if (!form.reportValidity()) return
    error_indicator.style.display = 'none'
    if (!app_name.value || !callback_url.value) return
    progress.open()
    const btn = document.getElementById('save-btn')
    btn.disabled = true
    const body = {
        app_name: app_name.value,
        homepage_url: homepage_url.value,
        callback_url: callback_url.value
    }
    const req = await fetch(`/oauthClient/client/${client_id.value}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        cache: 'no-cache'
    })
    const res = await req.json()
    if (res.ok) {
        location.reload()
    } else {
        progress.close()
        const { code, description } = res
        btn.disabled = false
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}
async function deleteClient() {
    error_indicator.style.display = 'none'
    progress.open()
    const btn = document.getElementById('delete-btn')
    btn.disabled = true
    const req = await fetch(`/oauthClient/client/${client_id.value}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        cache: 'no-cache'
    })
    const res = await req.json()
    if (res.ok) {
        location.href = '/'
    } else {
        progress.close()
        const { code, description } = res
        btn.disabled = false
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

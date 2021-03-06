const progress = new mdc.linearProgress.MDCLinearProgress(document.getElementById('progress'))

function preChangePassword() {
    if (!document.getElementById('Fchangepwd').reportValidity()) return 
    document.getElementById('old_password').disabled = true
    document.getElementById('new_password').disabled = true
    document.getElementById('new_password_repeat').disabled = true
    document.getElementById('changepwd_submit').disabled = true
    progress.open()
    grecaptcha.execute(document.getElementById('changepwd_captcha').dataset.widgetid)
}

async function changePassword(token) {
    const old_password = document.getElementById('old_password').value
    const new_password = document.getElementById('new_password').value
    const new_password_repeat = document.getElementById('new_password_repeat').value
    if (!old_password || !new_password || !new_password_repeat || !token) return false
    const error_indicator = document.getElementById('changepwd-error')
    if (new_password !== new_password_repeat) {
        document.getElementById('Fchangepwd').reset()
        error_indicator.innerText = '两次输入的密码不一致。'
        error_indicator.display = 'inline-block'
        return
    }
    const changepwd_body = {
        old_password,
        new_password,
        'g-recaptcha-response': token
    }
    const changepwd_req = await fetch('/user/password', {
        method: 'PUT',
        body: JSON.stringify(changepwd_body),
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        cache: 'no-cache'
    })
    const changepwd_res = await changepwd_req.json()
    if (changepwd_res.ok) {
        return location.reload()
    } else {
        progress.close()
        document.getElementById('old_password').disabled = false
        document.getElementById('new_password').disabled = false
        document.getElementById('new_password_repeat').disabled = false
        document.getElementById('changepwd_submit').disabled = false
        const { code, description } = changepwd_res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

async function changeAppPassword() {
    if (!document.getElementById('Fchangeapppwd').reportValidity()) return
    const new_password = document.getElementById('new_app_password').value
    if (!new_password) return false
    const error_indicator = document.getElementById('changeapppwd-error')
    progress.open()
    const body = {
        new_password
    }
    const req = await fetch('/user/apppassword', {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        cache: 'no-cache'
    })
    const res = await req.json()
    if (res.ok) {
        return location.reload()
    } else {
        progress.close()
        const { code, description } = res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

async function deleteAppPassword() {
    const error_indicator = document.getElementById('changepwd-error')
    progress.open()
    const req = await fetch('/user/apppassword', {
        method: 'DELETE',
        credentials: 'same-origin',
        cache: 'no-cache'
    })
    const res = await req.json()
    if (res.ok) {
        return location.reload()
    } else {
        progress.close()
        const { code, description } = res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

function preBindBBS() {
    if (!document.getElementById('Fbind_bbs').reportValidity()) return
    document.getElementById('bbs_username').disabled = true
    document.getElementById('bbs_password').disabled = true
    document.getElementById('bindbbs_submit').disabled = true
    progress.open()
    grecaptcha.execute(document.getElementById('bindbbs_captcha').dataset.widgetid)
}

async function doBindBBS(token) {
    const username = document.getElementById('bbs_username').value
    const password = document.getElementById('bbs_password').value
    const error_indicator = document.getElementById('bbslogin-error')
    progress.open()
    const bindbbs_body = {
        username,
        password,
        'g-recaptcha-response': token
    }
    const bindbbs_req = await fetch('/binding/bbs', {
        method: 'POST',
        body: JSON.stringify(bindbbs_body),
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        cache: 'no-cache'
    })
    const bindbbs_res = await bindbbs_req.json()
    if (bindbbs_res.ok) {
        return location.reload()
    } else {
        progress.close()
        document.getElementById('bbs_username').disabled = false
        document.getElementById('bbs_password').disabled = false
        document.getElementById('bindbbs_submit').disabled = false
        const { code, description } = bindbbs_res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

async function doUnbindBBS() {
    const error_indicator = document.getElementById('bbslogin-error')
    progress.open()
    const unbind_req = await fetch('/binding/bbs', {
        method: 'DELETE',
        credentials: 'same-origin',
        cache: 'no-cache'
    })
    const unbind_res = await unbind_req.json()
    if (unbind_res.ok) {
        return location.reload()
    } else {
        progress.close()
        const { code, description } = unbind_res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

async function doUnbindMinecraft() {
    const error_indicator = document.getElementById('minecraft-error')

    progress.open()
    const unbind_req = await fetch('/binding/minecraft', {
        method: 'DELETE',
        credentials: 'same-origin',
        cache: 'no-cache'
    })
    const unbind_res = await unbind_req.json()
    if (unbind_res.ok) {
        return location.reload()
    } else {
        progress.close()
        const { code, description } = unbind_res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

// Bind by Telegram Widget
async function doBindTelegram(user) {
    const error_indicator = document.getElementById('telegram-error')
    progress.open()
    const bind_body = {
        payload: user
    }
    const bind_req = await fetch('/binding/telegram', {
        method: 'POST',
        body: JSON.stringify(bind_body),
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        cache: 'no-cache'
    })
    const bind_res = await bind_req.json()
    if (bind_res.ok) {
        return location.reload()
    } else {
        progress.close()
        const { code, description } = bind_res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

async function doUnbindTelegram() {
    const error_indicator = document.getElementById('telegram-error')

    progress.open()
    const unbind_req = await fetch('/binding/telegram', {
        method: 'DELETE',
        credentials: 'same-origin',
        cache: 'no-cache'
    })
    const unbind_res = await unbind_req.json()
    if (unbind_res.ok) {
        return location.reload()
    } else {
        progress.close()
        const { code, description } = unbind_res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

function preDeleteAccount() {
    if (!document.getElementById('Fdeleteaccount').reportValidity()) return
    if (!confirm('您确认要删除帐号吗？')) return
    document.getElementById('delete_confirm_password').disabled = true
    document.getElementById('deleteaccount_submit').disabled = true
    progress.open()
    grecaptcha.execute(document.getElementById('deleteaccount_captcha').dataset.widgetid)
}

async function deleteAccount(token) {
    const password = document.getElementById('delete_confirm_password').value
    if (!password || !token) return false
    const error_indicator = document.getElementById('deleteaccount-error')
    const body = {
        password,
        'g-recaptcha-response': token
    }
    const req = await fetch('/user/', {
        method: 'DELETE',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        cache: 'no-cache'
    })
    const res = await req.json()
    if (res.ok) {
        return location.reload()
    } else {
        progress.close()
        document.getElementById('delete_confirm_password').disabled = false
        document.getElementById('deleteaccount_submit').disabled = false
        document.getElementById('Fdeleteaccount').clear()
        const { code, description } = res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

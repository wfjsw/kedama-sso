const submit_btn = document.getElementById('login-btn')
const username_input = document.getElementById('username-input')
const password_input = document.getElementById('password-input')
const loginform = document.getElementById('loginform')
const error_indicator = document.getElementById('error-indicator')
const progress = new mdc.linearProgress.MDCLinearProgress(document.getElementById('progress'))
username_input.addEventListener('focusout', async () => {
    if (username_input.value.trim() === '') return false
    progress.open()
    submit_btn.disabled = true
    const stat = await fetch(`/checkUsername?username=${username_input.value}`)
    const data = await stat.json()
    submit_btn.disabled = false
    progress.close()
    password_input.style.display = 'inline-block'
    if (data.data) {
        submit_btn.innerText = '登录'
        submit_btn.style.backgroundColor = '#4CAF50'
    } else {
        submit_btn.innerText = '注册'
        submit_btn.style.backgroundColor = '#F44336'
    }
})
submit_btn.addEventListener('click', () => {
    if (!loginform.reportValidity()) return
    progress.open()
    username_input.disabled = true
    password_input.disabled = true
    submit_btn.disabled = true
})
async function doLogin(token) {
    if (!loginform.reportValidity()) return
    error_indicator.style.display = 'none'
    const username = username_input.value
    const password = password_input.value
    if (!username || !password) return false
    const stat = await fetch(`/checkUsername?username=${username_input.value}`)
    const { data: isUsed } = await stat.json()
    const login_body = {
        username,
        password,
        'g-recaptcha-response': token
    }
    const login_req = await fetch(isUsed ? '/login' : '/signup', {
        method: 'POST',
        body: JSON.stringify(login_body),
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        cache: 'no-cache'
    })
    const login_res = await login_req.json()
    if (login_res.ok) {
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
        username_input.disabled = false
        password_input.disabled = false
        const { code, description } = login_res
        error_indicator.style.display = 'inline-block'
        error_indicator.innerText = `错误 #${code}: ${description}`
    }
}

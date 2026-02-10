// src-tauri/src/infrastructure/router_audit/scripts.rs

// Scripts de inyeccion JavaScript para automatizar login y extraccion.
// Regla: mantener el JS aislado para que el auditor Rust sea legible y testeable.

pub struct ScriptArsenal;

impl ScriptArsenal {
    pub fn injection_login(user: &str, pass: &str) -> String {
        format!(
            r#"
            (function() {{
                var u = document.getElementById('name')
                  || document.querySelector("input[ng-model='username']")
                  || document.querySelector("input[id='user']");
                if(u) {{ u.value = '{}'; u.dispatchEvent(new Event('input', {{bubbles:true}})); u.dispatchEvent(new Event('change', {{bubbles:true}})); }}
                else {{ return "NO_USER"; }}

                var p = document.getElementById('password') || document.querySelector("input[type='password']");
                if(p) {{ p.value = '{}'; p.dispatchEvent(new Event('input', {{bubbles:true}})); p.dispatchEvent(new Event('change', {{bubbles:true}})); }}
                else {{ return "NO_PASS"; }}

                return "OK";
            }})()
        "#,
            user, pass
        )
    }

    pub fn injection_click_submit() -> &'static str {
        r#"
        var btn = document.querySelector(".submit button") || document.querySelector("button[type='submit']");
        if(btn) btn.click();
        else { var e = new KeyboardEvent('keydown', {bubbles:true, keyCode:13}); document.querySelector("input[type='password']").dispatchEvent(e); }
        "#
    }

    pub fn injection_extract_text() -> &'static str {
        "document.body.innerText"
    }
}


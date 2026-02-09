use std::process::Command;
// 👇 AFEGEIX AQUEST IMPORT
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub struct PingExecutor;

impl PingExecutor {
    pub fn is_alive(ip: &str) -> bool {
        let mut cmd = Command::new("ping");
        
        #[cfg(target_os = "windows")]
        {
            cmd.args(["-n", "1", "-w", "200", ip]);
            cmd.creation_flags(CREATE_NO_WINDOW);
        }
        
        #[cfg(not(target_os = "windows"))]
        cmd.args(["-c", "1", "-W", "1", ip]);

        match cmd.output() {
            Ok(output) => {
                let s = String::from_utf8_lossy(&output.stdout);
                output.status.success() 
                    && !s.contains("Unreachable") 
                    && !s.contains("inaccesible")
            }
            Err(_) => false,
        }
    }
}
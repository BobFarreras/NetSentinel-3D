pub struct VendorResolver;

impl VendorResolver {
    pub fn resolve(mac: &str) -> String {
        if mac == "00:00:00:00:00:00" { return "Unknown".to_string(); }
        
        // Netejem la MAC (treiem : i -)
        let clean = mac.replace(":", "").replace("-", "").to_uppercase();
        
        // Comprovem els primers 6 caràcters (OUI)
        if clean.len() < 6 { return "Invalid MAC".to_string(); }
        let oui = &clean[0..6];

        match oui {
            // 🍎 APPLE
            "B06EBF" | "F01898" | "D8305F" | "ACBC32" | "A4D18C" | "28CFE9" | "0017F2" | "001C4D" | "002332" | "002500" => "Apple Device".to_string(),
            
            // 📱 SAMSUNG
            "24F5AA" | "380195" | "508569" | "8425DB" | "A02195" | "BC20A4" | "C4731E" => "Samsung Mobile".to_string(),
            
            // 👲 XIAOMI / POCO
            "ACF7F3" | "146B9C" | "28D0EA" | "342E81" | "50EC50" | "6490C1" => "Xiaomi / Poco".to_string(),
            
            // 🌐 ROUTERS / XARXA
            "3C585D" | "001D6A" => "Technicolor (Router)".to_string(),
            "00E04C" | "E4F042" => "Realtek (Network Card)".to_string(),
            "48E7DA" | "000C43" => "Ralink/MediaTek (Wi-Fi)".to_string(),
            "B04E26" | "D807B6" => "TP-Link".to_string(),
            "C891F9" | "04D9F5" => "Asus Network".to_string(),
            
            // 🤖 IOT / SMART HOME
            "229D5C" | "2462AB" | "30AEA4" | "540F57" | "600194" => "Espressif (Smart Home/IoT)".to_string(),
            "B827EB" | "DCAM60" => "Raspberry Pi".to_string(),
            "001132" => "Synology NAS".to_string(),
            "50C7BF" => "TP-Link Smart Plug".to_string(),
            
            // 💻 PC Components
            "00E018" => "Asus Motherboard".to_string(),
            "00D861" => "MSI".to_string(),
            "1C1B0D" => "GigaByte".to_string(),
            "00147C" => "3Com".to_string(),

            // GENÈRIC (Si no el trobem)
            _ => {
                // Heurística simple: Apple fa servir adreces aleatòries localment, a vegades costa de trobar.
                "Generic Device".to_string()
            }
        }
    }
}
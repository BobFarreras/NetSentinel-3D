#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // CORRECCIÓ: Afegim '_lib' al final del nom
    netsentinel_rust_lib::run();
}
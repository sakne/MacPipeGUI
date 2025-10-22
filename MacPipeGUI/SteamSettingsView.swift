import SwiftUI

struct SteamSettingsView: View {
    @Binding var config: SteamConfig
    @State private var tempPassword: String = ""

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Steam Tools")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text("Configure paths to Steam command line tools. Requires steamcmd and ContentBuilder.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Content Builder Path")
                                .font(.headline)
                                .foregroundColor(.primary)
                            
                            HStack {
                                Image(systemName: "folder.fill")
                                    .foregroundColor(.accentColor)
                                TextField("e.g., /usr/steamworksSDK/tools/ContentBuilder", text: $config.builderPath)
                                    .textFieldStyle(.roundedBorder)
                                Button(action: {
                                    let panel = NSOpenPanel()
                                    panel.canChooseFiles = false
                                    panel.canChooseDirectories = true
                                    panel.allowsMultipleSelection = false
                                    panel.message = "Select ContentBuilder folder"
                                    if panel.runModal() == .OK {
                                        config.builderPath = panel.url?.path ?? ""
                                    }
                                }) {
                                    Image(systemName: "folder.badge.plus")
                                        .imageScale(.large)
                                }
                                .buttonStyle(.plain)
                                .help("Browse for folder")
                            }
                        }
                        .padding()
                        .background(Color(nsColor: .controlBackgroundColor))
                        .cornerRadius(10)
                    }
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Steam Login")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text("Your Steam credentials for deployment.")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        VStack(alignment: .leading, spacing: 16) {
                            // Username
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Username")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                HStack {
                                    Image(systemName: "person.fill")
                                        .foregroundColor(.accentColor)
                                    TextField("Steam username", text: $config.loginName)
                                        .textFieldStyle(.roundedBorder)
                                }
                            }
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Password")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                                
                                HStack {
                                    Image(systemName: "lock.fill")
                                        .foregroundColor(.accentColor)
                                    SecureField("Steam password", text: $tempPassword)
                                        .onChange(of: tempPassword) { oldValue, newValue in
                                            config.password = newValue
                                        }
                                        .textFieldStyle(.roundedBorder)
                                }
                            }
                            Toggle(isOn: $config.rememberPassword) {
                                HStack {
                                    Image(systemName: "key.fill")
                                        .foregroundColor(.accentColor)
                                    Text("Remember Password")
                                        .font(.headline)
                                }
                            }
                            .toggleStyle(.switch)
                            .onChange(of: config.rememberPassword) { oldValue, newValue in
                                if !newValue {
                                    config.password = nil
                                }
                            }
                        }
                        .padding()
                        .background(Color(nsColor: .controlBackgroundColor))
                        .cornerRadius(10)
                        
                        if !config.rememberPassword {
                            HStack(spacing: 8) {
                                Image(systemName: "info.circle.fill")
                                    .foregroundColor(.orange)
                                Text("Password will not be saved and must be entered each time.")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal, 8)
                        }
                    }
                    
                    Spacer().frame(height: 20)
                }
                .padding(24)
            }
        }
        .onAppear {
            if config.rememberPassword {
                tempPassword = config.password ?? ""
            }
        }
    }
}

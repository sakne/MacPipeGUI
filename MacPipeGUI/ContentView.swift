import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                // App icon and title
                HStack(spacing: 10) {
                    Image(nsImage: NSImage(named: "AppIcon") ?? NSImage())
                        .resizable()
                        .frame(width: 48, height: 48)
                        .cornerRadius(12)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text("MacPipe GUI")
                                .font(.title)
                                .fontWeight(.bold)
                            
                            Text("v\(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.accentColor.opacity(0.1))
                                .cornerRadius(4)
                        }
                        Text("Steam Content Deployment Tool for MacOS")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                // Made with love section
                VStack(spacing: 8) {
                    Text("Made with ❤️ by SakneDev")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    HStack(spacing: 8) {
                        SocialLinkButton(icon: "link", title: "My Game", url: "https://store.steampowered.com/app/3453530/Coffie_Simulator")
                        SocialLinkButton(icon: "envelope.fill", title: "Email", url: "mailto:onebaney@protonmail.com")
                        SocialLinkButton(icon: "globe", title: "GitHub", url: "https://github.com/sakne")
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(Color(nsColor: .controlBackgroundColor))
            .cornerRadius(20)
            
            Spacer().frame(height: 5)
            Divider()
            
            TabView {
                ProfilesView(appState: appState)
                    .tabItem { Label("Profiles", systemImage: "doc.text") }
                
                SteamSettingsView(config: $appState.config)
                    .tabItem { Label("Steam", systemImage: "gearshape") }
                
                BuildRunnerView(appState: appState)
                    .tabItem { Label("Build", systemImage: "hammer") }
            }
        }
        .frame(minWidth: 900, minHeight: 550)
        .padding()
    }
}

struct SocialLinkButton: View {
    let icon: String
    let title: String
    let url: String
    @State private var isHovered = false
    
    var body: some View {
        Button(action: {
            if let nsUrl = URL(string: url) {
                NSWorkspace.shared.open(nsUrl)
            }
        }) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.subheadline)
                Text(title)
                    .font(.subheadline)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(isHovered ? Color.accentColor.opacity(0.15) : Color.clear)
            .cornerRadius(6)
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(Color.accentColor.opacity(isHovered ? 0.6 : 0.3), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .onHover { hovering in
            isHovered = hovering
        }
        .help(title)
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}

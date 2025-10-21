import SwiftUI

struct ProfileEditorView: View {
    @Binding var profile: AppProfile

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "pencil.circle.fill")
                            .font(.title)
                            .foregroundColor(.accentColor)
                        Text("Edit Profile")
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                    
                    Text("Configure your Steam app deployment settings")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)
                
                VStack(alignment: .leading, spacing: 16) {
                    Text("App Information")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    VStack(alignment: .leading, spacing: 12) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("App Name")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            HStack {
                                Image(systemName: "app.fill")
                                    .foregroundColor(.accentColor)
                                TextField("e.g., My Game", text: $profile.appName)
                                    .textFieldStyle(.roundedBorder)
                            }
                        }
                        
                        VStack(alignment: .leading, spacing: 6) {
                            Text("App ID")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            HStack {
                                Image(systemName: "number")
                                    .foregroundColor(.accentColor)
                                TextField("e.g., 480", text: $profile.appID)
                                    .textFieldStyle(.roundedBorder)
                            }
                        }
                        
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Build Description")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            HStack(alignment: .top) {
                                Image(systemName: "text.alignleft")
                                    .foregroundColor(.accentColor)
                                    .padding(.top, 8)
                                TextField("Optional description", text: $profile.description, axis: .vertical)
                                    .textFieldStyle(.roundedBorder)
                                    .lineLimit(3...6)
                            }
                        }
                    }
                    .padding(16)
                    .background(Color(nsColor: .controlBackgroundColor))
                    .cornerRadius(12)
                }
                .padding(.horizontal, 24)
                
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Depots")
                                .font(.headline)
                                .foregroundColor(.primary)
                            Text("\(profile.depotProfiles.count) depot\(profile.depotProfiles.count == 1 ? "" : "s") configured")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        Button(action: {
                            profile.depotProfiles.append(DepotConfig(DepotName: "", DepotID: "", ContentRoot: ""))
                        }) {
                            HStack(spacing: 6) {
                                Image(systemName: "plus.circle.fill")
                                Text("Add Depot")
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.accentColor)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                    }
                    
                    if profile.depotProfiles.isEmpty {
                        VStack(spacing: 12) {
                            Image(systemName: "tray")
                                .font(.system(size: 40))
                                .foregroundColor(.secondary.opacity(0.5))
                            Text("No depots yet")
                                .font(.headline)
                                .foregroundColor(.secondary)
                            Text("Add a depot to start configuring your content")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 40)
                        .background(Color(nsColor: .controlBackgroundColor))
                        .cornerRadius(12)
                    } else {
                        VStack(spacing: 12) {
                            ForEach($profile.depotProfiles) { $depot in
                                DepotEditorCard(depot: $depot, onDelete: {
                                    if let index = profile.depotProfiles.firstIndex(where: { $0.id == depot.id }) {
                                        profile.depotProfiles.remove(at: index)
                                    }
                                })
                            }
                        }
                    }
                }
                .padding(.horizontal, 24)
                
                Spacer().frame(height: 20)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

struct DepotEditorCard: View {
    @Binding var depot: DepotConfig
    let onDelete: () -> Void
    @State private var isHovered = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                HStack(spacing: 8) {
                    Image(systemName: "cube.fill")
                        .foregroundColor(.accentColor)
                    Text(depot.DepotName.isEmpty ? "Unnamed Depot" : depot.DepotName)
                        .font(.headline)
                }
                
                Spacer()
                
                if isHovered {
                    Button(action: onDelete) {
                        Image(systemName: "trash.circle.fill")
                            .foregroundColor(.red)
                            .imageScale(.large)
                    }
                    .buttonStyle(.plain)
                    .help("Delete depot")
                }
            }
            
            Divider()

            VStack(alignment: .leading, spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Depot Name")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    TextField("e.g., Windows Content", text: $depot.DepotName)
                        .textFieldStyle(.roundedBorder)
                }
                VStack(alignment: .leading, spacing: 6) {
                    Text("Depot ID")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    TextField("e.g., 481", text: $depot.DepotID)
                        .textFieldStyle(.roundedBorder)
                }
                VStack(alignment: .leading, spacing: 6) {
                    Text("Content Root Path")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    HStack {
                        TextField("e.g., /path/to/content", text: $depot.ContentRoot)
                            .textFieldStyle(.roundedBorder)
                        Button(action: {
                            let panel = NSOpenPanel()
                            panel.canChooseFiles = false
                            panel.canChooseDirectories = true
                            panel.allowsMultipleSelection = false
                            if panel.runModal() == .OK {
                                depot.ContentRoot = panel.url?.path ?? ""
                            }
                        }) {
                            Image(systemName: "folder")
                        }
                        .help("Browse for folder")
                    }
                }
            }
        }
        .padding(16)
        .background(Color(nsColor: .controlBackgroundColor))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(isHovered ? Color.accentColor.opacity(0.3) : Color.clear, lineWidth: 1)
        )
        .onHover { hovering in
            isHovered = hovering
        }
    }
}

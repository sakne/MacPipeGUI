import SwiftUI

struct ProfilesView: View {
    @ObservedObject var appState: AppState
    @State private var searchText = ""

    var filteredProfiles: [AppProfile] {
        if searchText.isEmpty {
            return appState.profiles
        }
        return appState.profiles.filter { profile in
            profile.appName.localizedCaseInsensitiveContains(searchText) ||
            profile.appID.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        HSplitView {
            // Left Sidebar - Profile List
            VStack(spacing: 0) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "square.stack.3d.up.fill")
                            .font(.title2)
                            .foregroundColor(.accentColor)
                        Text("Profiles")
                            .font(.title2)
                            .fontWeight(.bold)
                    }
                    
                    Text("\(appState.profiles.count) profile\(appState.profiles.count == 1 ? "" : "s")")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 12)
                
                // Search Bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    TextField("Search profiles...", text: $searchText)
                        .textFieldStyle(.plain)
                    
                    if !searchText.isEmpty {
                        Button(action: { searchText = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.secondary)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(8)
                .background(Color(nsColor: .controlBackgroundColor))
                .cornerRadius(8)
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
                
                Divider()
                
                // Profile List
                ScrollView {
                    LazyVStack(spacing: 8) {
                        if filteredProfiles.isEmpty {
                            VStack(spacing: 12) {
                                Image(systemName: searchText.isEmpty ? "tray" : "magnifyingglass")
                                    .font(.system(size: 48))
                                    .foregroundColor(.secondary.opacity(0.5))
                                Text(searchText.isEmpty ? "No profiles yet" : "No matching profiles")
                                    .font(.headline)
                                    .foregroundColor(.secondary)
                                if searchText.isEmpty {
                                    Text("Create your first profile to get started")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.top, 60)
                        } else {
                            ForEach(filteredProfiles) { profile in
                                ProfileListItem(
                                    profile: profile,
                                    isSelected: appState.selectedProfile?.id == profile.id,
                                    onTap: {
                                        withAnimation(.easeInOut(duration: 0.2)) {
                                            appState.selectedProfile = profile
                                        }
                                    },
                                    onDelete: {
                                        deleteProfile(profile)
                                    }
                                )
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                }
                
                Divider()
                
                // New Profile Button
                Button(action: {
                    let newProfile = AppProfile(appName: "New App", appID: "", description: "", depotProfiles: [])
                    appState.profiles.append(newProfile)
                    appState.selectedProfile = newProfile
                }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("New Profile")
                            .fontWeight(.medium)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.accentColor)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
                .buttonStyle(.plain)
                .padding(12)
            }
            .frame(minWidth: 280, idealWidth: 320, maxWidth: 400)
            .background(Color(nsColor: .controlBackgroundColor).opacity(0.3))
            
            // Right Panel - Profile Editor
            VStack(spacing: 0) {
                if let selectedProfile = appState.selectedProfile,
                   let index = appState.profiles.firstIndex(where: { $0.id == selectedProfile.id }) {
                    ProfileEditorView(profile: $appState.profiles[index])
                } else {
                    // Empty State
                    VStack(spacing: 20) {
                        Image(systemName: "square.stack.3d.up.slash")
                            .font(.system(size: 64))
                            .foregroundColor(.secondary.opacity(0.5))
                        
                        VStack(spacing: 8) {
                            Text("No Profile Selected")
                                .font(.title2)
                                .fontWeight(.semibold)
                            
                            Text("Select a profile from the list or create a new one")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        
                        Button(action: {
                            let newProfile = AppProfile(appName: "New App", appID: "", description: "", depotProfiles: [])
                            appState.profiles.append(newProfile)
                            appState.selectedProfile = newProfile
                        }) {
                            HStack {
                                Image(systemName: "plus.circle.fill")
                                Text("Create Your First Profile")
                            }
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .background(Color.accentColor)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
        }
    }
    
    private func deleteProfile(_ profile: AppProfile) {
        if let index = appState.profiles.firstIndex(where: { $0.id == profile.id }) {
            appState.profiles.remove(at: index)
            if appState.selectedProfile?.id == profile.id {
                appState.selectedProfile = appState.profiles.first
            }
        }
    }
}

struct ProfileListItem: View {
    let profile: AppProfile
    let isSelected: Bool
    let onTap: () -> Void
    let onDelete: () -> Void
    @State private var isHovered = false
    
    var body: some View {
        HStack(spacing: 12) {
            // Icon
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(isSelected ? Color.white.opacity(0.2) : Color.accentColor.opacity(0.1))
                    .frame(width: 44, height: 44)
                
                Image(systemName: "app.fill")
                    .font(.title3)
                    .foregroundColor(isSelected ? .white : .accentColor)
            }
            
            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(profile.appName)
                    .font(.headline)
                    .foregroundColor(isSelected ? .white : .primary)
                    .lineLimit(1)
                
                HStack(spacing: 4) {
                    Text("App ID:")
                        .font(.caption2)
                        .foregroundColor(isSelected ? .white.opacity(0.7) : .secondary)
                    Text(profile.appID.isEmpty ? "Not set" : profile.appID)
                        .font(.caption)
                        .foregroundColor(isSelected ? .white.opacity(0.9) : .secondary)
                }
            }
            
            Spacer()
            
            // Delete button (shows on hover)
            if isHovered && !isSelected {
                Button(action: onDelete) {
                    Image(systemName: "trash")
                        .foregroundColor(.red)
                        .imageScale(.small)
                }
                .buttonStyle(.plain)
                .help("Delete profile")
            }
            
            // Selected indicator
            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.white)
                    .imageScale(.large)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(isSelected ? Color.accentColor : (isHovered ? Color(nsColor: .controlBackgroundColor) : Color.clear))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .strokeBorder(isSelected ? Color.accentColor.opacity(0.5) : Color.clear, lineWidth: 1)
        )
        .contentShape(Rectangle())
        .onTapGesture(perform: onTap)
        .onHover { hovering in
            isHovered = hovering
        }
    }
}

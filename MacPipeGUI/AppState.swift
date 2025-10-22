import Foundation
import Combine

@MainActor
final class AppState: ObservableObject {
    @Published var config = SteamConfig()
    @Published var profiles: [AppProfile] = []
    @Published var selectedProfileID: UUID? = nil
    
    var selectedProfile: AppProfile? {
        get { profiles.first(where: { $0.id == selectedProfileID }) }
        set {
            if let new = newValue, let idx = profiles.firstIndex(where: { $0.id == new.id }) {
                profiles[idx] = new
                selectedProfileID = new.id
            }
        }
    }
    
    init() {
        loadConfig()
        loadProfiles()
    }
    
    func loadConfig() {
        if let cfg = FileStorage.loadJSON(SteamConfig.self, from: FileStorage.configURL) {
            config = cfg
        }
    }
    
    func saveConfig() {
        FileStorage.saveJSON(config, to: FileStorage.configURL)
    }
    
    func loadProfiles() {
        profiles = []
        let urls = (try? FileManager.default.contentsOfDirectory(at: FileStorage.profilesFolder, includingPropertiesForKeys: nil)) ?? []
        for url in urls {
            if let profile = FileStorage.loadJSON(AppProfile.self, from: url) {
                profiles.append(profile)
            }
        }
        if selectedProfileID == nil { selectedProfileID = profiles.first?.id }
    }
    
    func saveProfile(_ profile: AppProfile) {
        let safeName = profile.appName.replacingOccurrences(of: "\\", with: "_")
                                                         let url = FileStorage.profilesFolder.appendingPathComponent("\(safeName).json")
                                                         FileStorage.saveJSON(profile, to: url)
                                                         loadProfiles()
    }
    
    func deleteProfile(_ profile: AppProfile) {
        let url = FileStorage.profilesFolder.appendingPathComponent("\(profile.appName).json")
        try? FileManager.default.removeItem(at: url)
        loadProfiles()
    }
    
    func saveAll() {
        saveConfig()
        if let p = selectedProfile { saveProfile(p) }
    }
}

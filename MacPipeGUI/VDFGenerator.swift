import Foundation

struct VDFGenerator {
    static func generateFiles(for profile: AppProfile, config: SteamConfig) -> URL? {
        // Use builder path instead of temp folder
        let builderURL = URL(fileURLWithPath: config.builderPath + "/scripts")
        try? FileManager.default.createDirectory(at: builderURL, withIntermediateDirectories: true)
        
        // Generate/update depot files
        for depot in profile.depotProfiles {
            let depotText = """
            "DepotBuild"
            {
            "DepotID" "\(depot.DepotID)"
            "ContentRoot" "\(depot.ContentRoot)"
            "FileMapping"
            {
            "LocalPath" "*"
            "DepotPath" "."
            "recursive" "1"
            }
            }
            """
            let depotPath = builderURL.appendingPathComponent("depot_\(depot.DepotID).vdf")
            
            // Only write if file doesn't exist or content has changed
            if !FileManager.default.fileExists(atPath: depotPath.path) ||
               (try? String(contentsOf: depotPath, encoding: .utf8)) != depotText {
                try? depotText.write(to: depotPath, atomically: true, encoding: .utf8)
            }
        }
        
        // Generate/update main app file
        let depotEntries = profile.depotProfiles.map { "\"\($0.DepotID)\" \"depot_\($0.DepotID).vdf\"" }.joined(separator: "\n ")
        let appText = """
"AppBuild"
{
"AppID" "\(profile.appID)"
"Desc" "\(profile.description)"
"BuildOutput" "\(config.builderPath)/output"
"ContentRoot" "\(config.builderPath)/content"
"Depots"
{
\(depotEntries)
}
}
"""
        let appPath = builderURL.appendingPathComponent("app_\(profile.appID).vdf")
        
        // Only write if file doesn't exist or content has changed
        if !FileManager.default.fileExists(atPath: appPath.path) ||
           (try? String(contentsOf: appPath, encoding: .utf8)) != appText {
            try? appText.write(to: appPath, atomically: true, encoding: .utf8)
        }
        
        return appPath
    }
}

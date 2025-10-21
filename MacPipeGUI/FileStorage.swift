import Foundation

struct FileStorage {
    static let baseFolder: URL = {
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let folder = appSupport.appendingPathComponent("SteamPipeGUI")
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder
    }()
    
    static var configURL: URL { baseFolder.appendingPathComponent("config.json") }
    static var profilesFolder: URL {
        let url = baseFolder.appendingPathComponent("profiles")
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }
    
    static func saveJSON<T: Encodable>(_ value: T, to url: URL) {
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            let data = try encoder.encode(value)
            try data.write(to: url)
        } catch {
            print("Failed to save JSON:", error)
        }
    }
    
    static func loadJSON<T: Decodable>(_ type: T.Type, from url: URL) -> T? {
        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode(type, from: data)
        } catch {
            print("Failed to load JSON:", error)
            return nil
        }
    }
}

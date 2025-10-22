import Foundation

struct AppProfile: Codable, Identifiable, Hashable {
    var id = UUID()
    var appName: String = "";
    var appID: String = "";
    var description : String = "";
    var depotProfiles: [DepotConfig] = [];
}

struct DepotConfig: Codable, Identifiable, Hashable {
    var id = UUID()
    var DepotName: String = "";
    var DepotID: String = "";
    var ContentRoot: String = "";
}

struct SteamConfig: Codable {
    var builderPath: String = ""
    var loginName: String = ""
    var rememberPassword: Bool = false
    
    var password: String? {
        get { KeychainHelper.loadPassword(account: loginName, service: "MacPipeGUI") }
        set {
            if let pw = newValue {
                KeychainHelper.savePassword(pw, account: loginName, service: "MacPipeGUI")
            } else {
                KeychainHelper.deletePassword(account: loginName, service: "MacPipeGUI")
            }
        }
    }
}

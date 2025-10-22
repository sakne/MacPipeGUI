import Foundation
import Security

struct KeychainHelper {
    static func savePassword(_ password: String, account: String, service: String) {
        guard let passwordData = password.data(using: .utf8) else { return }
        
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: account,
            kSecAttrService: service
        ]
        SecItemDelete(query as CFDictionary)
        
        let attributes: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: account,
            kSecAttrService: service,
            kSecValueData: passwordData
        ]
        let status = SecItemAdd(attributes as CFDictionary, nil)
        if status != errSecSuccess {
            print("Keychain save failed: \(status)")
        }
    }
    
    static func loadPassword(account: String, service: String) -> String? {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: account,
            kSecAttrService: service,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecSuccess, let data = result as? Data {
            return String(data: data, encoding: .utf8)
        } else {
            return nil
        }
    }
    
    static func deletePassword(account: String, service: String) {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: account,
            kSecAttrService: service
        ]
        SecItemDelete(query as CFDictionary)
    }
}

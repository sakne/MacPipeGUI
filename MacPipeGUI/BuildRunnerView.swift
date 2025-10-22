import SwiftUI
import UserNotifications

struct BuildRunnerView: View {
    @ObservedObject var appState: AppState
    @State private var isBuilding: Bool = false
    @State private var buildLog: String = ""
    @State private var process: Process?
    @State private var showConsole: Bool = false
    
    var config: SteamConfig {
        appState.config
    }
    
    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "hammer.fill")
                        .font(.title2)
                        .foregroundColor(.accentColor)
                    Text("Build Runner")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Spacer()
                    
                    if isBuilding {
                        HStack(spacing: 8) {
                            ProgressView()
                                .scaleEffect(0.8)
                            Text("Building...")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Text("Generate VDF files and deploy to Steam")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 24)
            .padding(.top, 20)
            .padding(.bottom, 16)
            
            Divider()
            
            if let profile = appState.selectedProfile {
                VStack(spacing: 20) {
                    HStack(spacing: 16) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.accentColor.opacity(0.1))
                                .frame(width: 60, height: 60)
                            
                            Image(systemName: "app.fill")
                                .font(.system(size: 30))
                                .foregroundColor(.accentColor)
                        }
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(profile.appName)
                                .font(.title3)
                                .fontWeight(.semibold)
                            
                            HStack(spacing: 4) {
                                Text("App ID:")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(profile.appID)
                                    .font(.caption)
                                    .foregroundColor(.primary)
                            }
                            
                            HStack(spacing: 4) {
                                Text("Depots:")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("\(profile.depotProfiles.count)")
                                    .font(.caption)
                                    .foregroundColor(.primary)
                            }
                        }
                        
                        Spacer()
                    }
                    .padding(20)
                    .background(Color(nsColor: .controlBackgroundColor))
                    .cornerRadius(12)
                    
                    if !showConsole {
                        VStack(spacing: 12) {
                            Button(action: {
                                testBuildLocally(profile: profile)
                            }) {
                                HStack(spacing: 10) {
                                    Image(systemName: "checkmark.shield.fill")
                                    Text("Test Build (Local)")
                                        .fontWeight(.semibold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color.orange)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                            }
                            .buttonStyle(.plain)
                            .disabled(isBuilding)
                            
                            Button(action: {
                                generateAndBuild(profile: profile)
                            }) {
                                HStack(spacing: 10) {
                                    Image(systemName: "play.fill")
                                    Text("Generate VDF Files & Deploy to Steam")
                                        .fontWeight(.semibold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color.accentColor)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                            }
                            .buttonStyle(.plain)
                            .disabled(isBuilding)
                        }
                    } else {
                        VStack(spacing: 12) {
                            HStack(spacing: 12) {
                                Button(action: {
                                    testBuildLocally(profile: profile)
                                }) {
                                    HStack(spacing: 8) {
                                        Image(systemName: "checkmark.shield.fill")
                                        Text("Test Build")
                                            .fontWeight(.medium)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 8)
                                    .background(Color.orange)
                                    .foregroundColor(.white)
                                    .cornerRadius(8)
                                }
                                .buttonStyle(.plain)
                                .disabled(isBuilding)
                                
                                Button(action: {
                                    generateAndBuild(profile: profile)
                                }) {
                                    HStack(spacing: 8) {
                                        Image(systemName: isBuilding ? "arrow.clockwise" : "play.fill")
                                        Text(isBuilding ? "Deploying..." : "Deploy to Steam")
                                            .fontWeight(.medium)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 8)
                                    .background(Color.accentColor)
                                    .foregroundColor(.white)
                                    .cornerRadius(8)
                                }
                                .buttonStyle(.plain)
                                .disabled(isBuilding)
                            }
                            
                            HStack(spacing: 12) {
                                if isBuilding {
                                    Button(action: {
                                        cancelBuild()
                                    }) {
                                        HStack(spacing: 8) {
                                            Image(systemName: "stop.fill")
                                            Text("Cancel Build")
                                                .fontWeight(.medium)
                                        }
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .background(Color.red)
                                        .foregroundColor(.white)
                                        .cornerRadius(8)
                                    }
                                    .buttonStyle(.plain)
                                }
                                
                                Button(action: {
                                    buildLog = ""
                                }) {
                                    HStack(spacing: 8) {
                                        Image(systemName: "trash")
                                        Text("Clear Console")
                                            .fontWeight(.medium)
                                    }
                                    .frame(maxWidth: isBuilding ? .infinity : .infinity)
                                    .padding(.vertical, 10)
                                    .background(Color(nsColor: .controlBackgroundColor))
                                    .foregroundColor(.primary)
                                    .cornerRadius(8)
                                }
                                .buttonStyle(.plain)
                                .disabled(isBuilding)
                                
                                if !isBuilding {
                                    Button(action: {
                                        showConsole = false
                                        buildLog = ""
                                    }) {
                                        HStack(spacing: 8) {
                                            Image(systemName: "xmark.circle")
                                            Text("Hide Console")
                                                .fontWeight(.medium)
                                        }
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .background(Color(nsColor: .controlBackgroundColor))
                                        .foregroundColor(.primary)
                                        .cornerRadius(8)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                    
                    if showConsole {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Image(systemName: "terminal.fill")
                                    .foregroundColor(.accentColor)
                                Text("Console Output")
                                    .font(.headline)
                                
                                Spacer()
                                
                                Button(action: {
                                    let pasteboard = NSPasteboard.general
                                    pasteboard.clearContents()
                                    pasteboard.setString(buildLog, forType: .string)
                                }) {
                                    HStack(spacing: 4) {
                                        Image(systemName: "doc.on.doc")
                                        Text("Copy")
                                            .font(.caption)
                                    }
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 4)
                                    .background(Color(nsColor: .controlBackgroundColor))
                                    .cornerRadius(6)
                                }
                                .buttonStyle(.plain)
                            }
                            
                            ScrollViewReader { proxy in
                                ScrollView {
                                    VStack(alignment: .leading, spacing: 0) {
                                        Text(buildLog.isEmpty ? "No output yet. Click 'Start Build' to begin..." : buildLog)
                                            .font(.system(.body, design: .monospaced))
                                            .foregroundColor(buildLog.isEmpty ? .secondary : .primary)
                                            .textSelection(.enabled)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                            .padding(12)
                                        
                                        Color.clear
                                            .frame(height: 1)
                                            .id("bottom")
                                    }
                                }
                                .frame(maxWidth: .infinity, minHeight: 150, maxHeight: 400)
                                .background(Color(nsColor: .textBackgroundColor))
                                .cornerRadius(12)
                                .onChange(of: buildLog) { oldValue, newValue in
                                    withAnimation {
                                        proxy.scrollTo("bottom", anchor: .bottom)
                                    }
                                }
                            }
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 20)
            } else {
                VStack(spacing: 20) {
                    Image(systemName: "square.stack.3d.up.slash")
                        .font(.system(size: 64))
                        .foregroundColor(.secondary.opacity(0.5))
                    
                    VStack(spacing: 8) {
                        Text("No Profile Selected")
                            .font(.title2)
                            .fontWeight(.semibold)
                        
                        Text("Please select a profile from the Profiles tab to start building")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }
    
    func testBuildLocally(profile: AppProfile) {
        showConsole = true
        buildLog = "🧪 Starting Local Test Build...\n\n"
        
        buildLog += "📋 Validating Profile Configuration:\n"
        buildLog += "   Profile Name: \(profile.appName)\n"
        buildLog += "   App ID: \(profile.appID.isEmpty ? "❌ MISSING" : "✅ \(profile.appID)")\n"
        
        if profile.appID.isEmpty {
            buildLog += "\n❌ Error: App ID is required\n"
            return
        }
        
        buildLog += "   Description: \(profile.description.isEmpty ? "(none)" : profile.description)\n"
        buildLog += "   Depots Count: \(profile.depotProfiles.count)\n\n"
        
        if profile.depotProfiles.isEmpty {
            buildLog += "⚠️ Warning: No depots configured\n\n"
        } else {
            buildLog += "📦 Validating Depots:\n"
            var hasErrors = false
            
            for (index, depot) in profile.depotProfiles.enumerated() {
                buildLog += "   Depot #\(index + 1):\n"
                buildLog += "      Name: \(depot.DepotName.isEmpty ? "⚠️ (unnamed)" : depot.DepotName)\n"
                buildLog += "      Depot ID: \(depot.DepotID.isEmpty ? "❌ MISSING" : "✅ \(depot.DepotID)")\n"
                buildLog += "      Content Root: \(depot.ContentRoot.isEmpty ? "❌ MISSING" : depot.ContentRoot)\n"
                
                if depot.DepotID.isEmpty || depot.ContentRoot.isEmpty {
                    hasErrors = true
                }
                
                // Check if content root exists
                if !depot.ContentRoot.isEmpty {
                    let fileManager = FileManager.default
                    if fileManager.fileExists(atPath: depot.ContentRoot) {
                        buildLog += "      Path Status: ✅ Exists\n"
                    } else {
                        buildLog += "      Path Status: ❌ Path not found\n"
                        hasErrors = true
                    }
                }
                buildLog += "\n"
            }
            
            if hasErrors {
                buildLog += "❌ Depot validation failed. Please fix the errors above.\n"
                return
            }
        }
        
        buildLog += "⚙️ Validating Steam Configuration:\n"
        buildLog += "   Builder Path: \(config.builderPath.isEmpty ? "❌ MISSING" : config.builderPath)\n"
        
        if !config.builderPath.isEmpty {
            let fileManager = FileManager.default
            let steamcmdPath = config.builderPath + "/builder_osx/steamcmd.sh"
            if fileManager.fileExists(atPath: steamcmdPath) {
                buildLog += "   SteamCMD: ✅ Found\n"
            } else {
                buildLog += "   SteamCMD: ⚠️ Not found at expected location\n"
            }
        }
        
        buildLog += "   Username: \(config.loginName.isEmpty ? "❌ MISSING" : "✅ \(config.loginName)")\n"
        buildLog += "   Password: \(config.password?.isEmpty ?? true ? "❌ NOT SET" : "✅ Set")\n\n"
        
        buildLog += "📝 Generating VDF Files...\n"
        
        if let vdfPath = VDFGenerator.generateFiles(for: profile, config: appState.config) {
            buildLog += "✅ VDF files generated successfully!\n"
            buildLog += "   Location: \(vdfPath.path)\n"
            buildLog += "   Files created:\n"
            buildLog += "      • app_\(profile.appID).vdf\n"
            
            for depot in profile.depotProfiles {
                buildLog += "      • depot_\(depot.DepotID).vdf\n"
            }
            
            buildLog += "\n📄 Preview of app_\(profile.appID).vdf:\n"
            buildLog += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            
            let appVDFPath = vdfPath.appendingPathComponent("app_\(profile.appID).vdf")
            if let vdfContent = try? String(contentsOf: appVDFPath, encoding: .utf8) {
                buildLog += vdfContent
                buildLog += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            }
            
            buildLog += "✅ Test Build Completed Successfully!\n"
            buildLog += "\n💡 Everything looks good! You can now:\n"
            buildLog += "   1. Review the generated VDF files above\n"
            buildLog += "   2. Click 'Deploy to Steam' to upload your build\n"
            buildLog += "   3. Make changes to your profile if needed\n"
        } else {
            buildLog += "❌ Failed to generate VDF files\n"
            buildLog += "   Check that the Content Builder path is correctly configured on Steam Tab\n"
        }
    }
    
    func generateAndBuild(profile: AppProfile) {
        showConsole = true
        buildLog += "📦 Generating VDF files for \(profile.appName)...\n"
        
        if let vdfPath = VDFGenerator.generateFiles(for: profile, config: appState.config) {
            buildLog += "VDF files generated successfully at: \(vdfPath.path)\n"
            buildLog += "   - app_\(profile.appID).vdf\n"
            for depot in profile.depotProfiles {
                buildLog += "   - depot_\(depot.DepotID).vdf\n"
            }
            buildLog += "\n"
            
            runBuild(for: profile)
        } else {
            buildLog += "Failed to generate VDF files\n"
        }
    }
    
    func cancelBuild() {
        if let process = process, process.isRunning {
            process.terminate()
            buildLog += "\n⚠️ Build cancelled by user\n"
            isBuilding = false
        }
    }
    
    func sendSteamGuardNotification() {
        let center = UNUserNotificationCenter.current()
        
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                let content = UNMutableNotificationContent()
                content.title = "Steam Guard Required"
                content.body = "Please accept login from your Steam Mobile App to continue the build process."
                content.sound = .defaultCritical
                content.categoryIdentifier = "STEAM_GUARD"
                
                let request = UNNotificationRequest(
                    identifier: UUID().uuidString,
                    content: content,
                    trigger: nil
                )
                
                center.add(request) { error in
                    if let error = error {
                        print("Error sending notification: \(error.localizedDescription)")
                    }
                }
            }
        }
    }
    
    func runBuild(for profile: AppProfile) {
        guard !isBuilding else { return }
        guard let password = config.password, !password.isEmpty else {
            buildLog += "❌ Error: Password is required to run the build.\nSet it in the Steam tab.\n"
            return
        }
        
        isBuilding = true
        buildLog += "Starting build for \(profile.appName) with AppID: \(profile.appID)...\n"

        let fileManager = FileManager.default
        var steamcmdPath: String?
        
        let possiblePaths = [
            config.builderPath + "/builder_osx/steamcmd.sh",
            config.builderPath + "/steamcmd.sh",
            config.builderPath + "/builder/steamcmd.sh",
            config.builderPath + "/tools/ContentBuilder/builder_osx/steamcmd.sh"
        ]
        
        for path in possiblePaths {
            if fileManager.fileExists(atPath: path) {
                steamcmdPath = path
                buildLog += "✅ Found SteamCMD at: \(path)\n"
                break
            }
        }
        
        guard let validSteamCmdPath = steamcmdPath else {
            buildLog += "❌ Error: Could not find steamcmd.sh\n\n"
            buildLog += "Searched in the following locations:\n"
            for path in possiblePaths {
                buildLog += "   • \(path)\n"
            }
            buildLog += "\n💡 Tips:\n"
            buildLog += "   1. Make sure you've downloaded the Steamworks SDK\n"
            buildLog += "   2. Set the Builder Path in the Steam tab to the ContentBuilder folder\n"
            buildLog += "   3. Common path: /path/to/sdk/tools/ContentBuilder\n"
            buildLog += "   4. The folder should contain 'builder_osx' subdirectory\n"
            isBuilding = false
            return
        }
        
        let process = Process()
        let pipe = Pipe()
        let errorPipe = Pipe()
        
        let executableURL = URL(fileURLWithPath: validSteamCmdPath)
        
        guard fileManager.fileExists(atPath: executableURL.path) else {
            buildLog += "❌ Error: File exists but cannot be accessed at: \(executableURL.path)\n"
            buildLog += "This might be a permissions issue.\n"
            isBuilding = false
            return
        }
        
        process.executableURL = executableURL
        process.arguments = ["+login", config.loginName, password, "+run_app_build", config.builderPath + "/scripts/app_\(profile.appID).vdf", "+quit"]
        
        var environment = ProcessInfo.processInfo.environment
        environment["NSUnbufferedIO"] = "YES"
        process.environment = environment
        
        process.standardOutput = pipe
        process.standardError = errorPipe
        
        var hasShownSteamGuardNotification = false
        
        pipe.fileHandleForReading.readabilityHandler = { handle in
            let data = handle.availableData
            if let output = String(data: data, encoding: .utf8), !output.isEmpty {
                DispatchQueue.main.async {
                    buildLog += output
                    
                    let lowercased = output.lowercased()
                    if !hasShownSteamGuardNotification && 
                       (lowercased.contains("please confirm the login") || 
                        lowercased.contains("waiting for confirmation")) {
                        hasShownSteamGuardNotification = true
                        sendSteamGuardNotification()
                    }
                }
            }
        }
        
        errorPipe.fileHandleForReading.readabilityHandler = { handle in
            let data = handle.availableData
            if let output = String(data: data, encoding: .utf8), !output.isEmpty {
                DispatchQueue.main.async {
                    buildLog += output
                    
                    let lowercased = output.lowercased()
                    if !hasShownSteamGuardNotification && 
                       (lowercased.contains("please confirm the login") || 
                        lowercased.contains("waiting for confirmation")) {
                        hasShownSteamGuardNotification = true
                        sendSteamGuardNotification()
                    }
                }
            }
        }
        
        process.terminationHandler = { process in
            DispatchQueue.main.async {
                isBuilding = false
                if process.terminationStatus == 0 {
                    buildLog += "\n✅ Build completed successfully!\n"
                } else {
                    buildLog += "\n❌ Build failed with exit code: \(process.terminationStatus)\n"
                    if buildLog.contains("CreateBoundSocket") || buildLog.contains("ERROR (No Connection)") {
                        buildLog += "\n⚠️ Network Connection Error Detected!\n"
                        buildLog += "This error usually occurs because of App Sandbox restrictions.\n\n"
                        buildLog += "To fix this:\n"
                        buildLog += "1. Clean your build (Product → Clean Build Folder in Xcode)\n"
                        buildLog += "2. Rebuild and run the app again\n"
                        buildLog += "3. Make sure the entitlements file is properly configured\n\n"
                        buildLog += "If the issue persists:\n"
                        buildLog += "• Check your internet connection\n"
                        buildLog += "• Verify the Content Builder path is correct\n"
                        buildLog += "• Try running SteamCMD manually from Terminal to verify it works\n"
                    }
                }
            }
        }
        
        do {
            try process.run()
            self.process = process
        } catch {
            buildLog += "Failed to start build process: \(error.localizedDescription)\n"
            isBuilding = false
        }
    }
        
}


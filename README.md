# MacPipe GUI
<p align="center">
  <strong>A modern macOS GUI for Steam Content Deployment</strong>
</p>

<p align="center">
  Simplify your Steam game deployment process with an intuitive interface for managing SteamPipe builds and VDF configurations.
</p>

---
<div align="center">
  <h3>Modern UI & More Controls</h3>
  <img src="https://raw.githubusercontent.com/sakne/MacPipeGUI/assets/screenshots/ImageSheet.png" alt="MacPipe GUI Screenshots" width="90%"/>
</div>

---

# Features

- **Profile Management**: Create and manage multiple app deployment profiles
- **VDF Generation**: Automatically generate app build and depot VDF files
- **Steam Integration**: Seamless integration with SteamCMD and ContentBuilder
- **Secure Credentials**: Optional keychain storage for Steam login credentials
- **Build Runner**: Execute builds directly from the GUI with real-time console output
- **Modern UI**: Clean, native macOS interface built with SwiftUI

---

# Getting Started

## Prerequisites

Before using MacPipe GUI, you need:

1. **Steamworks SDK**: Download from [Steamworks Partner Site](https://partner.steamgames.com/)
2. **SteamCMD**: The Steam command-line client
3. **ContentBuilder**: Located in the Steamworks SDK (`sdk/tools/ContentBuilder`)
4. **Xcode 15.0+** (for compilation)
5. **macOS 13.0+** (Ventura or later)

## Installation

### Option 1: Download Pre-built Binary (Recommended)
1. Download the latest release from the [Releases](../../releases) page
2. Open the DMG file and drag MacPipe GUI to your Applications folder
3. Launch the app

### Option 2: Build from Source
See the [Building from Source](#-building-from-source) section below.

---

# How to Use

## 1. Configure Steam Settings

> [!NOTE]
> Ensure you have your Steamworks SDK and ContentBuilder set up before proceeding.

First, set up your Steam tools and credentials:

1. Open MacPipe GUI
2. Go to the **Steam** tab
3. Configure the following:
   - **Content Builder Path**: Browse to your Steamworks SDK ContentBuilder folder
     - Example: `/Users/yourname/steamworks_sdk/tools/ContentBuilder`
   - **Steam Username**: Your Steam account username
   - **Steam Password**: Your Steam account password (optional, can be entered at build time)
   - Toggle **Remember Password** if you want to save credentials in the macOS Keychain

## 2. Create a Deployment Profile

Create a profile for your game or app:

1. Go to the **Profiles** tab
2. Click the **+** button to create a new profile
3. Fill in the required information:
   - **App Name**: Your game/app name
   - **App ID**: Your Steam App ID (from Steamworks)
   - **Description**: Build description
   
   **For each depot, add:**
   - **Depot Name**: Name of the depot
   - **Depot ID**: Your depot ID(s)
   - **Content Root**: Path to your build files

## 3. Run a Build

Deploy your content to Steam:

1. Select a profile from the list
2. Go to the **Build** tab
3. Review the build configuration
4. Click **Generate VDF Files** to create the necessary configuration files
5. Click **Run Build** to start the deployment process
6. Monitor the build progress in the console output

## 4. Managing Profiles

- **Edit**: Select a profile and click the edit icon to modify details
- **Delete**: Select a profile and click the trash icon to remove it
- **Search**: Use the search bar to filter profiles by name or App ID

---

# Building from Source

## Requirements

- macOS 13.0 (Ventura) or later
- Xcode 15.0 or later
- Swift 5.9 or later

## Build StepsMIT Non-Commercial License

1. **Clone the repository**
   ```bash
   git clone https://github.com/sakne/MacPipeGUI.git
   cd MacPipeGUI
   ```
   
2. **Open the project in Xcode**
   ```bash
   open MacPipeGUI.xcodeproj
   ```

3. **Configure signing** (if needed)
   - Select the project in the navigator
   - Go to **Signing & Capabilities**
   - Select your development team or use "Sign to Run Locally"

4. **Build the project**
   - Select **Product > Build** (⌘B)
   - Or select **Product > Run** (⌘R) to build and launch

5. **Create a release build** (optional)
   - Select **Product > Archive**
   - In the Organizer window, click **Distribute App**
   - Choose **Copy App** for a standalone .app file
   - Or choose **Developer ID** to notarize for distribution

## Build Configuration

The project uses the following configuration:
- **Minimum Deployment Target**: macOS 13.0
- **Architecture**: Universal (Apple Silicon + Intel)
- **Framework**: SwiftUI
- **Build System**: Xcode New Build System

---

# Configuration Files

MacPipe GUI stores data in the following locations:

- **Profiles**: `~/Library/Application Support/com.saknedev.MacPipeGUI/profiles.json`
- **Settings**: `~/Library/Application Support/com.saknedev.MacPipeGUI/config.json`
- **Credentials**: macOS Keychain (if "Remember Password" is enabled)
- **Generated VDF Files**: `{ContentBuilder}/scripts/` directory

---

# Troubleshooting

## Build Fails with "steamcmd not found"
- Ensure the ContentBuilder path is correctly set in Steam Settings
- Verify that `steamcmd.sh` exists in the builder directory

## Authentication Errors
- Check that your Steam username and password are correct
- If using Steam Guard, you may need to enter a 2FA code via terminal
- Try disabling "Remember Password" and entering credentials manually

## VDF Generation Issues
- Ensure all required fields in the profile are filled out
- Check that Content Root path exists and contains your build files
- Verify Depot ID matches your Steamworks configuration

## App Won't Launch
- Check that you're running macOS 13.0 or later
- If you built from source, ensure proper code signing
- Try right-clicking and selecting "Open" if Gatekeeper blocks the app

---

# Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

- Follow Swift naming conventions
- Write descriptive commit messages
- Test your changes thoroughly on both Intel and Apple Silicon Macs
- Update documentation for new features

---
# Support

If you find this tool helpful, please consider:
- Giving it a star ⭐ on GitHub
- Checking out my game [Coffie Simulator](https://store.steampowered.com/app/3453530/Coffie_Simulator) on Steam
- Sharing it with other developers

---

# License

This project is licensed under the **GPLv3** - see the [LICENSE](LICENSE) file for details.

---


<p align="center">Made with ❤️ by SakneDev</p>

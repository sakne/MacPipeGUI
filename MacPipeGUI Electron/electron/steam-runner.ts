import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { BrowserWindow, Notification } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { AppProfile, SteamConfig } from '../src/types';
import { VDFGenerator } from './vdf-generator';

export class SteamRunner {
    private static process: ChildProcessWithoutNullStreams | null = null;

    static async runBuild(
        window: BrowserWindow,
        profile: AppProfile,
        config: SteamConfig,
        password: string
    ) {
        if (this.process) {
            window.webContents.send('build-log', '⚠️ Build already in progress');
            return;
        }

        const valid = await this.validateSetup(config);
        if (!valid.valid) {
            window.webContents.send('build-log', `❌ Error: ${valid.message}`);
            return;
        }

        const steamCmdPath = valid.path!;

        // Step 1: Update SteamCMD first
        window.webContents.send('build-log', `🔄 Updating SteamCMD...`);
        const updateSuccess = await this.updateSteamCmd(window, steamCmdPath);
        if (!updateSuccess) {
            window.webContents.send('build-log', `❌ SteamCMD update failed. Aborting build.`);
            return;
        }
        window.webContents.send('build-log', `✅ SteamCMD is up to date!\n`);

        // Step 2: Run the actual build
        window.webContents.send('build-log', `🚀 Starting build for ${profile.appName}...`);
        window.webContents.send('build-log', `   SteamCMD: ${steamCmdPath}`);

        const args = [
            '+login', config.loginName, password,
            '+run_app_build', path.join(config.builderPath, 'scripts', `app_${profile.appID}.vdf`),
            '+quit'
        ];

        const unbufferedEnv = {
            ...process.env,
            PYTHONUNBUFFERED: '1',
            TERM: 'dumb',
            FORCE_COLOR: '0',
            NO_COLOR: '1'
        };

        // Find the logs directory - SteamCMD writes to console_log.txt
        const logsDir = path.join(config.builderPath, 'builder', 'logs');
        const consoleLogPath = path.join(logsDir, 'console_log.txt');

        // Track last read position for log file - start from current size to skip old content
        let lastLogPos = 0;
        try {
            if (fs.existsSync(consoleLogPath)) {
                const stats = fs.statSync(consoleLogPath);
                lastLogPos = stats.size; // Start from current end of file
            }
        } catch (e) {
        }
        let logWatchInterval: NodeJS.Timeout | null = null;

        const readNewLogContent = (filePath: string, lastPos: number): { content: string, newPos: number } => {
            try {
                if (!fs.existsSync(filePath)) {
                    return { content: '', newPos: lastPos };
                }
                const stats = fs.statSync(filePath);
                if (stats.size <= lastPos) {
                    return { content: '', newPos: lastPos };
                }
                const fd = fs.openSync(filePath, 'r');
                const buffer = Buffer.alloc(stats.size - lastPos);
                fs.readSync(fd, buffer, 0, buffer.length, lastPos);
                fs.closeSync(fd);
                return { content: buffer.toString('utf8'), newPos: stats.size };
            } catch (e) {
                return { content: '', newPos: lastPos };
            }
        };

        let lastProgressLine = '';
        let mobileAuthNotified = false;
        let emailPromptShown = false;
        let lastMessage = '';

        // Start watching log file every 200ms for real-time updates
        logWatchInterval = setInterval(() => {
            const logContent = readNewLogContent(consoleLogPath, lastLogPos);
            if (logContent.content) {
                lastLogPos = logContent.newPos;

                const lines = logContent.content.split('\n');
                const filteredLines: string[] = [];

                for (const line of lines) {
                    const trimmed = line.trim();

                    if (!trimmed || trimmed === '.' || trimmed === '..' || trimmed === '...') {
                        continue;
                    }

                    let withoutTimestamp = trimmed.replace(/^\[[\d\-\s:]+\]\s*/, '');

                    if (!withoutTimestamp || withoutTimestamp === '.') {
                        continue;
                    }

                    if (withoutTimestamp === lastMessage) {
                        continue;
                    }
                    lastMessage = withoutTimestamp;

                    const progressMatch = withoutTimestamp.match(/(\d+\.?\d*\s*[KMGT]?B.*\(\d+%\))/);
                    if (progressMatch) {
                        const progressPart = progressMatch[1];
                        if (progressPart !== lastProgressLine) {
                            lastProgressLine = progressPart;
                            filteredLines.push(`   📥 ${progressPart}`);
                        }
                        continue;
                    }

                    if (/^\.+$/.test(withoutTimestamp)) {
                        continue;
                    }

                    let formattedLine = withoutTimestamp;

                    if (/OK$/.test(formattedLine) || formattedLine.includes('...OK')) {
                        formattedLine = `✅ ${formattedLine.replace(/\.\.\.OK$/, '').replace(/OK$/, '').trim()}`;
                        if (formattedLine === '✅') continue; // Skip if nothing left
                    }
                    else if (formattedLine.includes('Loading') || formattedLine.includes('Logging')) {
                        formattedLine = `⏳ ${formattedLine}`;
                    }
                    else if (formattedLine.includes('Successfully finished') || formattedLine.includes('success')) {
                        formattedLine = `🎉 ${formattedLine}`;
                    }
                    else if (formattedLine.includes('Uploading')) {
                        formattedLine = `📤 ${formattedLine}`;
                    }
                    else if (formattedLine.includes('Building') || formattedLine.includes('Scanning')) {
                        formattedLine = `🔨 ${formattedLine}`;
                    }
                    else if (formattedLine.includes('Waiting for confirmation')) {
                        formattedLine = `⏳ ${formattedLine}`;
                    }
                    else if (formattedLine.includes('Steam Guard') || formattedLine.includes('mobile authenticator') || formattedLine.includes('confirm the login')) {
                        formattedLine = `🔐 ${formattedLine}`;
                    }
                    else if (formattedLine.includes('Error') || formattedLine.includes('ERROR') || formattedLine.includes('Failed')) {
                        formattedLine = `❌ ${formattedLine}`;
                    }
                    else if (formattedLine.includes('Unloading')) {
                        formattedLine = `🔄 ${formattedLine}`;
                    }

                    filteredLines.push(formattedLine);
                }

                if (filteredLines.length > 0) {
                    window.webContents.send('build-log', filteredLines.join('\n'));
                }

                const lowerOutput = logContent.content.toLowerCase();

                // Email Verification Code
                if (!emailPromptShown && (
                    lowerOutput.includes('enter the special access code') ||
                    lowerOutput.includes('steam guard code')
                )) {
                    emailPromptShown = true;
                    mobileAuthNotified = true;
                    window.webContents.send('steam-guard-request');

                    if (Notification.isSupported()) {
                        new Notification({
                            title: 'Steam Guard Required',
                            body: 'Please enter the code sent to your email.',
                            icon: undefined
                        }).show();
                    }
                }

                if (!mobileAuthNotified && (
                    lowerOutput.includes('steam mobile app') ||
                    lowerOutput.includes('confirm the login') ||
                    lowerOutput.includes('mobile authenticator') ||
                    lowerOutput.includes('waiting for confirmation')
                )) {
                    mobileAuthNotified = true;
                    if (Notification.isSupported()) {
                        new Notification({
                            title: 'Steam Mobile Confirmation Required',
                            body: 'Please confirm the login in your Steam Mobile app.',
                            icon: undefined
                        }).show();
                    }
                }
            }
        }, 200);

        this.process = spawn(steamCmdPath, args, {
            env: unbufferedEnv,
            windowsHide: true
        });

        const checkOutputForTriggers = (output: string) => {
            const lowerOutput = output.toLowerCase();

            // Email Verification Code
            if (!emailPromptShown && (
                lowerOutput.includes('enter the special access code') ||
                lowerOutput.includes('steam guard code') ||
                lowerOutput.includes('email address') && lowerOutput.includes('code')
            )) {
                emailPromptShown = true;
                mobileAuthNotified = true;
                window.webContents.send('steam-guard-request');

                if (Notification.isSupported()) {
                    new Notification({
                        title: 'Steam Guard Required',
                        body: 'Please enter the code sent to your email.',
                        icon: undefined
                    }).show();
                }
            }

            // Mobile Auth
            if (!mobileAuthNotified && (
                lowerOutput.includes('steam mobile app') ||
                lowerOutput.includes('confirm the login') ||
                lowerOutput.includes('mobile authenticator') ||
                lowerOutput.includes('waiting for confirmation')
            )) {
                mobileAuthNotified = true;
                if (Notification.isSupported()) {
                    new Notification({
                        title: 'Steam Mobile Confirmation Required',
                        body: 'Please confirm the login in your Steam Mobile app.',
                        icon: undefined
                    }).show();
                }
            }
            if (lowerOutput.includes("waiting for confirmation...ok")){
                window.webContents.send("build-log", `✅ Steam Guard authenticated!`);
                window.webContents.send("build-log", `Starting scan and upload...\n\n`);
            }
            if (lowerOutput.includes("building depot")){
                const depotMatch = lowerOutput.match(/building depot (\d+)/);
                const depotId = depotMatch ? depotMatch[1] : "?";
                window.webContents.send("build-log", `🤖 Scanning and uploading depot with ID ${depotId}...`);
            }
        };

        this.process.stdout.on('data', (data) => checkOutputForTriggers(data.toString()));
        this.process.stderr.on('data', (data) => checkOutputForTriggers(data.toString()));

        // mobileAuthNotified initialized above

        const proactiveNotifyTimeout = setTimeout(() => {
            if (!mobileAuthNotified && this.process) {
                mobileAuthNotified = true;
                window.webContents.send('build-log', `\n📱 If Steam requires authentication, please check your Steam Mobile app or email for a confirmation code.`);

                if (Notification.isSupported()) {
                    new Notification({
                        title: 'Steam Authentication',
                        body: 'Check your Steam Mobile app or email if login confirmation is required.',
                        icon: undefined
                    }).show();
                }
            }
        }, 5000);

        this.process.on('close', (code) => {
            clearTimeout(proactiveNotifyTimeout);
            if (logWatchInterval) {
                clearInterval(logWatchInterval);
            }
            this.process = null;
            window.webContents.send('build-complete', code);
            if (code === 0) {
                window.webContents.send('build-log', '✅ Build Completed Successfully!');
            } else {
                window.webContents.send('build-log', `❌ Build failed with exit code ${code}`);
            }
        });
    }

    static updateSteamCmd(window: BrowserWindow, steamCmdPath: string): Promise<boolean> {
        return new Promise((resolve) => {
            const updateProcess = spawn(steamCmdPath, ['+quit']);
            let hasError = false;
            let resolved = false;

            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    window.webContents.send('build-log', `   ⚠️ SteamCMD update timed out (30s). Proceeding anyway...`);
                    try {
                        updateProcess.kill();
                    } catch (e) { /* ignore */ }
                    resolve(true); // Proceed anyway
                }
            }, 30000);

            updateProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Update') || output.includes('download') || output.includes('Steam') || output.includes('Loading') || output.includes('%')) {
                    window.webContents.send('build-log', `   ${output.trim()}`);
                }
            });

            updateProcess.stderr.on('data', (data) => {
                window.webContents.send('build-log', `   ⚠️ ${data.toString().trim()}`);
                hasError = true;
            });

            updateProcess.on('close', (code) => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timeout);

                if (code === 0 && !hasError) {
                    resolve(true);
                } else if (code === 7) {
                    window.webContents.send('build-log', `   SteamCMD updated itself (exit code 7).`);
                    resolve(true);
                } else {
                    resolve(code === 0);
                }
            });

            updateProcess.on('error', (err) => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timeout);
                window.webContents.send('build-log', `   ❌ Failed to run SteamCMD: ${err.message}`);
                resolve(false);
            });
        });
    }

    static stopBuild() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }

    static writeInput(input: string) {
        if (this.process) {
            this.process.stdin.write(input + '\n');
        }
    }

    static async validateSetup(config: SteamConfig): Promise<{ valid: boolean, message: string, path?: string }> {
        const scriptName = process.platform === 'win32' ? 'steamcmd.exe' : 'steamcmd.sh';
        let steamCmdPath = path.join(config.builderPath, scriptName);

        if (!fs.existsSync(steamCmdPath)) {
            const alts = [
                path.join(config.builderPath, 'builder_osx', scriptName),
                path.join(config.builderPath, 'builder_linux', scriptName),
                path.join(config.builderPath, 'builder', scriptName),
            ];
            for (const alt of alts) {
                if (fs.existsSync(alt)) {
                    steamCmdPath = alt;
                    break;
                }
            }
        }

        if (!fs.existsSync(steamCmdPath)) {
            return { valid: false, message: `Could not find ${scriptName} in ${config.builderPath} (or inside builder/ folders)` };
        }

        const scriptsPath = path.join(config.builderPath, 'scripts');
        const contentPath = path.join(config.builderPath, 'content');

        if (!fs.existsSync(scriptsPath)) {
            return { valid: false, message: `Missing 'scripts' folder in ${config.builderPath}` };
        }
        if (!fs.existsSync(contentPath)) {
            return { valid: false, message: `Missing 'content' folder in ${config.builderPath}` };
        }

        return { valid: true, message: 'SteamCMD and folders found!', path: steamCmdPath };
    }

    static async testRun(
        window: BrowserWindow,
        profile: AppProfile,
        config: SteamConfig
    ) {
        const log = (msg: string) => {
            try {
                window.webContents.send('build-log', msg);
            } catch (e) {
                console.error('Failed to send build-log:', e);
            }
        };

        try {
            log(`🧪 Starting Local Test Build...\n`);
            log(`📋 Validating Profile Configuration:`);
            log(`   Profile Name: ${profile.appName}`);
            log(`   App ID: ${profile.appID ? `✅ ${profile.appID}` : "❌ MISSING"}`);

            if (!profile.appID) {
                log(`\n❌ Error: App ID is required\n`);
                return;
            }

            log(`   Description: ${profile.description || "(none)"}`);
            log(`   Depots Count: ${profile?.depotProfiles?.length || 0}\n`);

            if (!profile.depotProfiles || profile.depotProfiles.length === 0) {
                log(`⚠️ Warning: No depots configured\n`);
            } else {
                log(`📦 Validating Depots:`);
                let hasErrors = false;

                for (const [index, depot] of profile.depotProfiles.entries()) {
                    log(`   Depot #${index + 1}:`);
                    log(`      Name: ${depot.DepotName || "⚠️ (unnamed)"}`);
                    log(`      Depot ID: ${depot.DepotID ? `✅ ${depot.DepotID}` : "❌ MISSING"}`);
                    const root = depot.ContentRoot;
                    log(`      Content Root: ${root ? root : "❌ MISSING"}`);

                    if (!depot.DepotID || !root) {
                        hasErrors = true;
                    }

                    if (root) {
                        try {
                            if (fs.existsSync(root)) {
                                log(`      Path Status: ✅ Exists`);
                            } else {
                                log(`      Path Status: ❌ Path not found`);
                                hasErrors = true;
                            }
                        } catch (e) {
                            log(`      Path Status: ⚠️ Error checking path`);
                        }
                    }
                    log(``);
                }

                if (hasErrors) {
                    log(`❌ Depot validation failed. Please fix the errors above.\n`);
                    return;
                }
            }

            log(`⚙️ Validating Steam Configuration:`);
            const setup = await this.validateSetup(config);

            if (setup.valid) {
                log(`   SteamCMD: ✅ Found at ${setup.path}`);
            } else {
                log(`   SteamCMD: ❌ ${setup.message}`);
                log(`\n❌ Steam Configuration Invalid\n`);
                return;
            }

            log(`   Username: ${config.loginName ? `✅ ${config.loginName}` : "❌ MISSING"}`);
            log(`   Password: ${config.password ? "✅ Set" : "❌ NOT SET (Required for Deploy)"}\n`);

            log(`📝 Generating VDF Files...`);

            const vdfPath = await VDFGenerator.generateFiles(profile, config);
            if (vdfPath) {
                log(`✅ VDF files generated successfully!`);
                log(`   Main VDF: ${vdfPath}`);

                // vdfPath is the path to app_APPID.vdf
                const scriptsDir = path.dirname(vdfPath);

                log(`   Files created in: ${scriptsDir}`);
                log(`      • ${path.basename(vdfPath)}`);

                for (const depot of profile.depotProfiles) {
                    log(`      • depot_${depot.DepotID}.vdf`);
                }

                log(`\n📄 Preview of ${path.basename(vdfPath)}:`);
                log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

                if (fs.existsSync(vdfPath)) {
                    const content = fs.readFileSync(vdfPath, 'utf-8');
                    log(content);
                } else {
                    log(`(Could not read generated file)`);
                }

                log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
                log(`✅ Test Build Completed Successfully!`);
                log(`\n💡 Everything looks good! You can now:`);
                log(`   1. Review the generated VDF files above`);
                log(`   2. Click 'Deploy to Steam' to upload your build`);
                log(`   3. Make changes to your profile if needed`);
            } else {
                log(`❌ Failed to generate VDF files`);
            }

        } catch (e: any) {
            console.error('Test Run Error:', e);
            log(`\n❌ Critical Error: ${e.message}`);
        }
    }
}

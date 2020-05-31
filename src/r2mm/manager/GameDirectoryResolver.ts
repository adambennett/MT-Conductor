import R2Error from 'src/model/errors/R2Error';
import FileNotFoundError from 'src/model/errors/FileNotFoundError';
import VdfParseError from 'src/model/errors/Vdf/VdfParseError';

import * as child from 'child_process';
import * as vdf from '@node-steam/vdf';
import * as fs from 'fs-extra';
import * as path from 'path';
import { isUndefined } from 'util';
import ManagerSettings from './ManagerSettings';

const installDirectoryQuery = 'Get-ItemProperty -Path HKLM:\\SOFTWARE\\WOW6432Node\\Valve\\Steam -Name "InstallPath"';
const appManifest = 'appmanifest_632360.acf';

export default class GameDirectoryResolver {

    public static getSteamDirectory(): string | R2Error {
        const settings = new ManagerSettings();
        settings.load();
        if (settings.steamDirectory != null) {
            return settings.steamDirectory;
        }
        try {
            const queryResult: string = child.execSync(`powershell.exe "${installDirectoryQuery}"`).toString().trim();
            const installKeyValue = queryResult.split('\n');
            let installValue: string | undefined;
            installKeyValue.forEach((val: string) => {
                if (val.trim().startsWith('InstallPath')) {
                    installValue = val.substr(('InstallPath').length)
                        .trim()
                        // Remove colon
                        .substr(1)
                        .trim();
                }
            })
            if (isUndefined(installValue)) {
                const err = new Error();
                err.message = queryResult;
                throw err;
            }
            return installValue;
        } catch(e) {
            const err: Error = e;
            return new R2Error(
                'Unable to resolve steam install directory',
                err.message,
                'Try manually setting the Steam directory through the settings'
            )
        }
    }

    public static getDirectory(): R2Error | string {
        const settings = new ManagerSettings();
        settings.load();
        if (settings.riskOfRain2Directory != null) {
            return settings.riskOfRain2Directory;
        }
        try {
            const queryResult: string = child.execSync(`powershell.exe "${installDirectoryQuery}"`).toString().trim();
            const installKeyValue = queryResult.split('\n')[0].trim();
            // Remove key (InstallPath) from string
            const installValue = installKeyValue.substr(('InstallPath').length)
                .trim()
                // Remove colon
                .substr(1)
                .trim();
            const dir = this.findAppManifest(installValue);
            return dir;
        } catch(e) {
            const err: Error = e;
            return new R2Error(
                'Unable to resolve steam install directory',
                err.message,
                'Try manually locating the Risk of Rain 2 install directory through the settings'
            )
        }
    }

    private static findAppManifest(steamPath: string): R2Error | string {
        const steamapps = path.join(steamPath, 'steamapps');
        const locations: string[] = [steamapps];
        // Find all locations where games can be installed.
        try {
            const files = fs.readdirSync(steamapps);
            files.forEach((file: string) => {
                if (file.toLowerCase() === 'libraryfolders.vdf') {
                    try {
                        const parsedVdf: any = vdf.parse(fs.readFileSync(path.join(steamapps, file)).toString());
                        for (const key in parsedVdf.LibraryFolders) {
                            if (!isNaN(Number(key))) {
                                locations.push(
                                    path.join(parsedVdf.LibraryFolders[key], 'steamapps')
                                );
                            }
                        }
                    } catch(e) {
                        const err: Error = e;
                        // Need to throw when inside forEach.
                        throw new VdfParseError(
                            'Unable to parse libraryfolders.vdf',
                            err.message,
                            null
                        )
                    }
                }
            })
        } catch(e) {
            if (e instanceof R2Error) {
                return e;
            }
            const err: Error = e;
            return new FileNotFoundError(
                'Unable to read directory',
                err.message,
                null
            )
        }
        // Look through given directories for ${appManifest}
        let manifestLocation: string | null = null;
        try {
            locations.forEach((location: string) => {
                fs.readdirSync(location)
                    .forEach((file: string) => {
                        if (file.toLowerCase() === appManifest) {
                            manifestLocation = location;
                        }
                    });
            });
        } catch(e) {
            if (e instanceof R2Error) {
                return e;
            }
            const err: Error = e;
            return new R2Error(
                'An error occured whilst searching Steam library locations',
                err.message,
                null
            )
        }
        if (manifestLocation === null) {
            return new FileNotFoundError(
                'Unable to locate Monster Train Installation Directory',
                `Searched locations: ${locations}`,
                null
            )
        }
        // Game manifest found at ${manifestLocation}
        try {
            const manifestVdf: string = fs.readFileSync(path.join(manifestLocation, appManifest)).toString();
            const parsedVdf: any = vdf.parse(manifestVdf);
            const folderName = parsedVdf.AppState.installdir;
            const riskOfRain2Path = path.join(manifestLocation, 'common', folderName);
            if (fs.pathExistsSync(riskOfRain2Path)) {
                return riskOfRain2Path;
            } else {
                return new FileNotFoundError(
                    'Monster Train does not exist in Steam\'s specified location',
                    `Failed to find directory: ${riskOfRain2Path}`,
                    null
                )
            }
        } catch(e) {
            const err: Error = e;
            return new R2Error(
                `An error occured whilst locating the Monster Train install directory from manifest in ${manifestLocation}`,
                err.message,
                null
            )
        }
    }

}

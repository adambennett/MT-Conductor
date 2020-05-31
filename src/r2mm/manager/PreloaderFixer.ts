import GameDirectoryResolver from './GameDirectoryResolver';
import R2Error from 'src/model/errors/R2Error';
import fs from 'fs-extra';
import * as path from 'path';
import { spawnSync } from 'child_process';

export default class PreloaderFixer {

    public static fix(): R2Error | void {
        const dirResult = GameDirectoryResolver.getDirectory();
        if (dirResult instanceof R2Error) {
            return dirResult;
        }
        if (!fs.existsSync(path.join(dirResult, 'MonsterTrain.exe'))) {
            return new R2Error('Monster Train directory is invalid', 'could not find "MonsterTrain.exe"',
                'Set the Monster Train directory in the settings section');
        }
        try {
            fs.removeSync(path.join(dirResult, 'MonsterTrain_Data', 'Managed'));
        } catch(e) {
            const err: Error = e;
            return new R2Error('Failed to remove Managed directory', err.message, 'Try launching Conductor as an administrator');
        }
        try {
            spawnSync(`powershell`, ['start', 'steam://validate/1102190']);
        } catch(e) {
            const err: Error = e;
            return new R2Error('Failed to start steam://validate', err.message, null);
        }
    }
}

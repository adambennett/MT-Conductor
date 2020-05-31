import yaml from 'yaml';
import * as fs from 'fs-extra';
import * as path from 'path';

let resizeTimeout = undefined;

export default class Persist {

  static getSize(app, { defaultWidth, defaultHeight }) {
    const configFilePath = path.join(app.getPath('appData'), 'conductor-local', 'config', 'window-state.yml');
    if (fs.existsSync(configFilePath)) {
      try {
        const result = yaml.parse(fs.readFileSync(configFilePath).toString());
        return {
          width: result.windowWidth,
          height: result.windowHeight
        };
      } catch (e) {
        return {
          width: defaultWidth,
          height: defaultHeight
        };
      }
    }
    return {
      width: defaultWidth,
      height: defaultHeight
    };
  }

  static handle(window, app) {
    window.on('resize', () => {
      if (resizeTimeout != undefined) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(() => {
        const winSize = window.getSize();
        const yamlString = yaml.stringify({
          'windowWidth': winSize[0],
          'windowHeight': winSize[1]
        });
        const configPath = path.join(app.getPath('appData'), 'conductor-local', 'config');
        const configFilePath = path.join(configPath, 'window-state.yml');
        try {
          fs.ensureDirSync(configPath);
          fs.writeFileSync(configFilePath, yamlString);
        } catch (e) {
          // Do nothing
        }
      }, 100);
    });
  }

}

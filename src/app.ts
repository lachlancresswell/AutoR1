import * as fs from 'fs';
import * as App from './autor1'
import * as Logging from './logging';

const TEMPLATES = './templates.r2t';
const GROUP_NAME = 'AutoR1'
const SUFFIX = '_AUTO';

/**
 * Pads a filename with spaces to match the longest filename in the list
 * @param fileName
 * @param fileNames
 * @returns Padded file name
 */
const padFileName = (fileName: string, fileNames: string[]) => {
    const longestFileName = fileNames.reduce((a, b) => {
        return a.length > b.length ? a : b;
    });
    const padLength = longestFileName.length - fileName.length;
    return fileName + ' '.repeat(padLength);
}

/**
 * Creates a new path for the processed R1 project file
 * @param path
 * @returns New path
 */
const newAutoPath = (path: string) => path.substring(0, path.lastIndexOf('.')) + SUFFIX + '.dbpr';

Logging.createLogFile();

console.info('**AutoR1**');

if (!fs.existsSync(TEMPLATES)) {
    console.info(`Could not access ${TEMPLATES}`)
    process.exit(1);
}

const templates = new App.AutoR1TemplateFile(TEMPLATES);

let projectPaths: string[] = [];

fs.readdirSync('./').forEach(file => {
    if (file.endsWith('.dbpr') && !file.includes(SUFFIX)) {
        projectPaths.push(file);
    }
});

console.info(`Found ${projectPaths.length} projects in folder.`);

projectPaths.forEach((projectPath) => {
    const autoPath = newAutoPath(projectPath);

    fs.copyFileSync(projectPath, autoPath);

    try {

        process.stdout.write(`Processing ${padFileName(autoPath, projectPaths.map(newAutoPath))} | `);
        console.debug('Processing ' + autoPath);

        const projectFile = new App.AutoR1ProjectFile(autoPath);

        const existingGroupId = projectFile.getGroupIdFromName(GROUP_NAME)

        if (existingGroupId) {
            projectFile.clean(existingGroupId);
        }

        const parentId = projectFile.createGroup({ Name: GROUP_NAME });

        projectFile.createSubLRCGroups(parentId);
        process.stdout.write(`.`);
        projectFile.getSrcGrpInfo();
        process.stdout.write(`.`);
        projectFile.createAPGroup();
        process.stdout.write(`.`);
        projectFile.createMeterView(templates);
        process.stdout.write(`.`);
        projectFile.createMainView(templates);
        process.stdout.write(`.`);
        projectFile.createNavButtons(templates);
        process.stdout.write(`.`);
        projectFile.addSubCtoSubL();
        process.stdout.write(`.`);
        projectFile.createEqView(templates);
        process.stdout.write(`.`);
        projectFile.close();
        process.stdout.write(`completed\n`)
        console.debug('Completed\n');
    } catch (e) {
        fs.unlinkSync(autoPath);

        process.stdout.write(`${(e as Error).message}\n`);
        console.debug(`${(e as Error).message}\n`);
    }
})

templates.close();

process.exit(0)
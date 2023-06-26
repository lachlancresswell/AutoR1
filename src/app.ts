import { ProjectFile, TemplateFile } from './r1ts';
import * as fs from 'fs';
import * as App from './autor1'

const PROJECT_INIT_AP_START = './src/__tests__/Projects/test_init_AP.dbpr';
const TEMPLATES = './src/__tests__/Projects/templates.r2t';
let PROJECT_INIT_AP: string;

PROJECT_INIT_AP = PROJECT_INIT_AP_START + '_AUTO.dbpr';

try {
    fs.unlinkSync(PROJECT_INIT_AP);
} catch (e) {
    console.log(e);
}
fs.copyFileSync(PROJECT_INIT_AP_START, PROJECT_INIT_AP);

let project: ProjectFile;
try {
    project = new ProjectFile(PROJECT_INIT_AP);
} catch (e) {
    console.log(e);

    process.exit(1);
}

const templates = new TemplateFile(TEMPLATES);
const parentId = project.createGrp('Auto R1');
App.createSubLRCGroups(project, parentId);
project.getSrcGrpInfo();
App.configureApChannels(project);
App.createMeterView(project, templates);
App.createMasterView(project, templates);
App.createNavButtons(project, templates);
App.addSubCtoSubL(project);
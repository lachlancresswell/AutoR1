import { ProjectFile, TemplateFile } from '../../r1ts';
import * as fs from 'fs';
import * as Autor1 from '../../autor1'

const PROJECT_NO_INIT_START = './src/__tests__/Projects/test_no_init.dbpr';
const PROJECT_INIT_START = './src/__tests__/Projects/test_init.dbpr';
const PROJECT_INIT_AP_START = './src/__tests__/Projects/test_init_AP.dbpr';
const TEMPLATES_START = './src/__tests__/Projects/templates.r2t';
let PROJECT_NO_INIT: string;
let PROJECT_INIT: string;
let PROJECT_INIT_AP: string;
let TEMPLATES: string;

let i = 0;

// Create a new project file for each test
beforeEach(() => {
    PROJECT_INIT = PROJECT_INIT_START + i + '.test';
    PROJECT_INIT_AP = PROJECT_INIT_AP_START + i + '.test';
    PROJECT_NO_INIT = PROJECT_NO_INIT_START + i + '.test';
    TEMPLATES = TEMPLATES_START + i + '.test';

    fs.copyFileSync(PROJECT_NO_INIT_START, PROJECT_NO_INIT);
    fs.copyFileSync(PROJECT_INIT_START, PROJECT_INIT);
    fs.copyFileSync(PROJECT_INIT_AP_START, PROJECT_INIT_AP);
    fs.copyFileSync(TEMPLATES_START, TEMPLATES);
});

afterEach(() => {
    fs.unlinkSync(PROJECT_NO_INIT);
    fs.unlinkSync(PROJECT_INIT);
    fs.unlinkSync(PROJECT_INIT_AP);
    fs.unlinkSync(TEMPLATES);
});


describe('App', () => {
    let projectFile: ProjectFile;
    let templateFile: TemplateFile;

    beforeEach(() => {
        projectFile = new ProjectFile(PROJECT_INIT);
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('should create valid AUTO project', () => {
        const parentId = projectFile.createGrp('Auto R1');
        Autor1.createSubLRCGroups(projectFile, parentId);
        projectFile.getSrcGrpInfo();
        Autor1.configureApChannels(projectFile);
        Autor1.createMeterView(projectFile, templateFile);
        Autor1.createMasterView(projectFile, templateFile);
        Autor1.createNavButtons(projectFile, templateFile);
        Autor1.addSubCtoSubL(projectFile);
    });
});
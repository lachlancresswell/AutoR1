import { ProjectFile, TemplateFile } from '../../r1ts';
import * as fs from 'fs';

const PROJECT_NO_INIT_START = './src/__tests__/Projects/test_no_init.dbpr';
const PROJECT_INIT_START = './src/__tests__/Projects/test_init.dbpr';
const PROJECT_INIT_AP_START = './src/__tests__/Projects/test_init_AP.dbpr';
const TEMPLATES_START = './src/__tests__/Projects/templates.r2t';
const PROJECT_NO_EXIST = '/non/existent/path'
let PROJECT_NO_INIT: string;
let PROJECT_INIT: string;
let PROJECT_INIT_AP: string;
let TEMPLATES: string;

let i = 100;

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

describe('Methods', () => {
    let p: ProjectFile;
    beforeEach(() => {
        p = new ProjectFile(PROJECT_INIT);
    });

    it('Constructor throws with non-existing proejct', () => {
        expect(() => new ProjectFile(PROJECT_NO_EXIST)).toThrow('File does not exist');
    });

    it('Constructor throws with unintialised proejct', () => {
        jest.resetAllMocks()
        expect(() => new ProjectFile(PROJECT_NO_INIT)).toThrow('Project file is not initialised');
    });

    it('Next joinedId is determined', () => {
        expect(p!['jId']).not.toBe(-1);
    });

    it('Finds number of groups in project', () => {
        expect(p.getGroupCount()).toBe(283);
    });

    it('Finds source group IDs, skipping right groups', () => {
        const sourceGroupIds = p.getSourceGroupIds(true)
        expect(sourceGroupIds.length).toBe(12);
    });

    it('Finds source group IDs, including right groups', () => {
        const sourceGroupIds = p.getSourceGroupIds()
        expect(sourceGroupIds.length).toBe(17);
    });

    it('Finds name of a source group from a group ID', () => {
        const p = new ProjectFile(PROJECT_INIT)
        expect(p.getSourceGroupNameFromId(1)).toBe('Unused channels');
    });

    it('Finds ID of a source group from a source group name', () => {
        const p = new ProjectFile(PROJECT_INIT)
        expect(p.getSourceGroupIdFromName('Unused channels')).toBe(1);
    });

    it('Finds the highest group ID', () => {
        expect(p.getHighestGroupID()).toBe(283);
    });

    it('Finds a groups ID from its name', () => {
        expect(p.getGroupIdFromName('Master')).toBe(2);
    });

    it('Finds the ID of a view group from its name', () => {
        expect(p.getViewIdFromName('Overview')).toBe(1000);
    });

    it('Creates a new group', () => {
        const newId = p.createGrp('test');
        expect(p.getGroupIdFromName('test')).toBe(newId);
    });

    it('Removes a group', () => {
        const newId = p.createGrp('test');
        expect(p.getGroupIdFromName('test')).toBe(newId);
        p.deleteGroup(newId);
        expect(() => p.getGroupIdFromName('test')).toThrow('Could not find group');
    });

    it('Discovers all source groups, channel groups and related info from a project', () => {
        expect(p.sourceGroups.length).toBe(11);
        expect(p.sourceGroups[0].channelGroups.length).toBe(3); // Array two way tops
        expect(p.sourceGroups[1].channelGroups.length).toBe(3); // Array single channel tops
        expect(p.sourceGroups[2].channelGroups.length).toBe(3); // Array two way subs
        expect(p.sourceGroups[3].channelGroups.length).toBe(3); // Array single channel subs
        expect(p.sourceGroups[4].channelGroups.length).toBe(6); // Array flown mixed sub top
        expect(p.sourceGroups[5].channelGroups.length).toBe(1); // Array mono
        expect(p.sourceGroups[6].channelGroups.length).toBe(2); // Array ground stack mono
        expect(p.sourceGroups[7].channelGroups.length).toBe(1); // Point source
        expect(p.sourceGroups[8].channelGroups.length).toBe(1); // Point source sub
        expect(p.sourceGroups[9].channelGroups.length).toBe(2); // Point source mixed
        expect(p.sourceGroups[10].channelGroups.length).toBe(1); // SUB array LCR

    });
});

describe('Variables', () => {
    it('JoinedId is set on initial project load', () => {
        let p: ProjectFile;
        expect(() => p = new ProjectFile(PROJECT_INIT)).not.toThrow();
        expect(p!['jId']).not.toBe(-1);
    });
});

describe('insertTemplate', () => {
    let projectFile: ProjectFile;
    let templateFile: TemplateFile;

    beforeEach(() => {
        projectFile = new ProjectFile(PROJECT_INIT);
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('should insert a new template into the project file', () => {
        const posX = 100;
        const posY = 200;
        const targetId = 123;
        const targetChannel = 1;
        const width = 100;
        const height = 50;

        const template = templateFile.templates[1];
        const ViewId = 1000;
        const DisplayName = 'My Display Name';

        const oldJoinedId = projectFile.jId;
        projectFile.insertTemplate(template, ViewId, posX, posY, DisplayName, targetId, targetChannel, width, height);
        const newJoinedId = projectFile.jId;

        const controls = projectFile.findControlsByViewId(ViewId);
        expect(newJoinedId).toBeGreaterThan(oldJoinedId);
        const insertedControls = controls.filter((c) => c.JoinedId === oldJoinedId)

        const insertedControl = insertedControls[0];
        expect(insertedControl).toBeDefined();
        expect(insertedControl!.Type).toBe(template.controls![0].Type);
        expect(insertedControl!.PosX).toBe(posX);
        expect(insertedControl!.PosY).toBe(posY);
        expect(insertedControl!.Width).toBe(width);
        expect(insertedControl!.Height).toBe(height);
        expect(insertedControl!.TargetId).toBe(targetId);
        expect(insertedControl!.TargetChannel).toBe(targetChannel);
    });
});

describe('getTempSize', () => {
    let projectFile: ProjectFile;
    let templateFile: TemplateFile;

    beforeEach(() => {
        projectFile = new ProjectFile(PROJECT_INIT);
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('should return the size of the template', () => {
        const size = templateFile.getTempSize('Meters Group');
        expect(size.width).toBe(220);
        expect(size.height).toBe(214);
    });
});
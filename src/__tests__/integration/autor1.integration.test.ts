import { ProjectFile, TemplateFile } from '../../r1ts';
import * as fs from 'fs';
import * as AutoR1 from '../../autor1'

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

describe('findControlsByViewId', () => {
    let projectFile: ProjectFile;
    let templateFile: TemplateFile;

    beforeEach(() => {
        projectFile = new ProjectFile(PROJECT_INIT);
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('should return an array of controls', () => {
        const controls = projectFile.findControlsByViewId(1000);
        expect(controls.length).toBeGreaterThan(0);
    });

    it('should throw an error if there arent any controls found', () => {
        const viewId = 1;
        expect(() => projectFile.findControlsByViewId(viewId)).toThrow(`Could not find any controls with viewId ${viewId}`);
    });
});

describe('getApStatus', () => {
    let projectNoAP: ProjectFile;
    let projectAP: ProjectFile;

    beforeEach(() => {
        projectNoAP = new ProjectFile(PROJECT_INIT);
        projectAP = new ProjectFile(PROJECT_INIT_AP);
    });

    it('should return true if any source group has ArrayProcessingEnable set to true', () => {
        const result = AutoR1.getApStatus(projectAP);
        expect(result).toBe(true);
    });

    it('should return false if no source group has ArrayProcessingEnable set to true', () => {
        const result = AutoR1.getApStatus(projectNoAP);
        expect(result).toBe(false);
    });

    it('should throw an error if sourceGroups is not loaded', () => {
        projectNoAP.sourceGroups = [];
        expect(() => AutoR1.getApStatus(projectNoAP)).toThrow('SourceGroups not loaded');
    });
});

describe('createApChannelGroup', () => {
    let projectFileAP: ProjectFile;
    let projectFileNoAP: ProjectFile;

    beforeEach(() => {
        projectFileAP = new ProjectFile(PROJECT_INIT_AP);
        projectFileNoAP = new ProjectFile(PROJECT_INIT);
    });

    it('should create an AP group', () => {
        AutoR1.createApChannelGroup(projectFileAP);

        const apGroup = projectFileAP.getGroupIdFromName(AutoR1.AP_GROUP_TITLE);
        expect(apGroup).toBeDefined();
    });

    it('should throw an error if no AP channel groups are found', () => {
        expect(() => AutoR1.createApChannelGroup(projectFileNoAP)).toThrow('No AP channel groups found.');
    });
});

describe('getSrcGroupType', () => {
    let projectFile: ProjectFile;

    beforeEach(() => {
        projectFile = new ProjectFile(PROJECT_INIT);
    });

    it('should get source group type for when given a group name', () => {
        expect(AutoR1.getSrcGroupType(projectFile, '8 - Point source').SourceGroupType).toBe(2);
        expect(AutoR1.getSrcGroupType(projectFile, '8 - Point source').hasSUBsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, '8 - Point source').hasTOPsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, '8 - Point source').isLRGroup).toBe(false);
    });

    it('should return correct configuration for Unused channels', () => {
        // Unused channels
        expect(AutoR1.getSrcGroupType(projectFile, 1).SourceGroupType).toBe(5);
        expect(AutoR1.getSrcGroupType(projectFile, 1).hasSUBsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 1).hasTOPsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 1).isLRGroup).toBe(false);
    });

    it('should return correct configuration for Array two way TOPs', () => {
        expect(AutoR1.getSrcGroupType(projectFile, 2).SourceGroupType).toBe(1);
        expect(AutoR1.getSrcGroupType(projectFile, 2).hasSUBsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 2).hasTOPsGroup).toBe(true);
        expect(AutoR1.getSrcGroupType(projectFile, 2).isLRGroup).toBe(true);
    });

    it('should return correct configuration for Array single channel TOPs', () => {
        expect(AutoR1.getSrcGroupType(projectFile, 4).SourceGroupType).toBe(1);
        expect(AutoR1.getSrcGroupType(projectFile, 4).hasSUBsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 4).hasTOPsGroup).toBe(true);
        expect(AutoR1.getSrcGroupType(projectFile, 4).isLRGroup).toBe(true);
    });

    it('should return correct configuration for Point source', () => {
        expect(AutoR1.getSrcGroupType(projectFile, 6).SourceGroupType).toBe(2);
        expect(AutoR1.getSrcGroupType(projectFile, 6).hasSUBsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 6).hasTOPsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 6).isLRGroup).toBe(false);
    });

    it('should return correct configuration for SUB array LCR', () => {
        // note: SUB array does not have SUBs group
        expect(AutoR1.getSrcGroupType(projectFile, 7).SourceGroupType).toBe(3);
        expect(AutoR1.getSrcGroupType(projectFile, 7).hasSUBsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 7).hasTOPsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 7).isLRGroup).toBe(false);
    });

    it('should return correct configuration for Array two way subs LR', () => {
        expect(AutoR1.getSrcGroupType(projectFile, 8).SourceGroupType).toBe(1);
        expect(AutoR1.getSrcGroupType(projectFile, 8).hasSUBsGroup).toBe(true);
        expect(AutoR1.getSrcGroupType(projectFile, 8).hasTOPsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 8).isLRGroup).toBe(true);
    });

    it('should return correct configuration for Single channel SUBs LR', () => {
        expect(AutoR1.getSrcGroupType(projectFile, 12).SourceGroupType).toBe(1);
        expect(AutoR1.getSrcGroupType(projectFile, 12).hasSUBsGroup).toBe(true);
        expect(AutoR1.getSrcGroupType(projectFile, 12).hasTOPsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 12).isLRGroup).toBe(true);
    });

    it('should return correct configuration for Array SUBs TOPs LR', () => {
        expect(AutoR1.getSrcGroupType(projectFile, 14).SourceGroupType).toBe(1);
        expect(AutoR1.getSrcGroupType(projectFile, 14).hasSUBsGroup).toBe(true);
        expect(AutoR1.getSrcGroupType(projectFile, 14).hasTOPsGroup).toBe(true);
        expect(AutoR1.getSrcGroupType(projectFile, 14).isLRGroup).toBe(true);
    });

    it('should return correct configuration for Array mono TOPs', () => {
        expect(AutoR1.getSrcGroupType(projectFile, 16).SourceGroupType).toBe(1);
        expect(AutoR1.getSrcGroupType(projectFile, 16).hasSUBsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 16).hasTOPsGroup).toBe(true);
        expect(AutoR1.getSrcGroupType(projectFile, 16).isLRGroup).toBe(false);
    });

    it('should return correct configuration for Point source SUB', () => {
        expect(AutoR1.getSrcGroupType(projectFile, 18).SourceGroupType).toBe(2);
        expect(AutoR1.getSrcGroupType(projectFile, 18).hasSUBsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 18).hasTOPsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 18).isLRGroup).toBe(false);
    });

    it('should return correct configuration for Point source SUBs TOPs', () => {
        expect(AutoR1.getSrcGroupType(projectFile, 19).SourceGroupType).toBe(2);
        expect(AutoR1.getSrcGroupType(projectFile, 19).hasSUBsGroup).toBe(true);
        expect(AutoR1.getSrcGroupType(projectFile, 19).hasTOPsGroup).toBe(true);
        expect(AutoR1.getSrcGroupType(projectFile, 19).isLRGroup).toBe(false);
    });

    it('should return correct configuration for Array ground stack mono', () => {
        expect(AutoR1.getSrcGroupType(projectFile, 20).SourceGroupType).toBe(1);
        expect(AutoR1.getSrcGroupType(projectFile, 20).hasSUBsGroup).toBe(true);
        expect(AutoR1.getSrcGroupType(projectFile, 20).hasTOPsGroup).toBe(true);
        expect(AutoR1.getSrcGroupType(projectFile, 20).isLRGroup).toBe(false);
    });

    it('should return correct configuration for Group 1', () => {
        expect(AutoR1.getSrcGroupType(projectFile, 22).SourceGroupType).toBe(4);
        expect(AutoR1.getSrcGroupType(projectFile, 22).hasSUBsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 22).hasTOPsGroup).toBe(false);
        expect(AutoR1.getSrcGroupType(projectFile, 22).isLRGroup).toBe(false);
    });
});

describe('Methods', () => {
    let p: ProjectFile;

    beforeEach(() => {
        p = new ProjectFile(PROJECT_INIT);
    });


    it('Fails if sub L/C/R groups are not found', () => {
        expect(AutoR1.hasSubGroups(p)).toBe(0);
    });

    it('Finds status of ArrayProcessing', () => {
        expect(AutoR1.getApStatus(p)).toBe(false);
    });

    it('Finds SUB array group', () => {
        expect(AutoR1.getSubArrayGroups(p).length).toBe(3);
    })

    it('Creates SUBs L/C/R groups', () => {
        const pId = p.createGrp('TEST', 1);
        AutoR1.createSubLRCGroups(p, pId);
        expect(AutoR1.hasSubGroups(p)).toBe(3);
    });
});

describe('Templates', () => {
    it('Loads template file', () => {
        const t = new TemplateFile(TEMPLATES);
        expect(t.templates.length).toBeGreaterThan(0)
    })
});

describe('getTemplateWidthHeight', () => {
    let templateFile: TemplateFile;

    beforeEach(() => {
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('should return the correct size for an existing template', () => {
        const TEMPLATE_NAME = `Master Title`
        const size = AutoR1.getTemplateWidthHeight(templateFile, TEMPLATE_NAME);
        expect(size).toEqual({ width: 240, height: 42 });
    });

    it('should throw an error for a non-existing template', () => {
        const TEMPLATE_NAME = `NonExistingTemplate`
        expect(() => AutoR1.getTemplateWidthHeight(templateFile, TEMPLATE_NAME)).toThrow(`${TEMPLATE_NAME} template not found.`);
    });

    it('should throw and error for a template with no controls', () => {
        const TEMPLATE_NAME = `My templates`
        expect(() => AutoR1.getTemplateWidthHeight(templateFile, TEMPLATE_NAME)).toThrow(`${TEMPLATE_NAME} template controls not found.`);
    });
});

describe('getTemplateControlsFromName', () => {
    let templateFile: TemplateFile;

    beforeEach(() => {
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('should return the controls for an existing template', () => {
        const controls = AutoR1.getTemplateControlsFromName(templateFile, 'Master Title');
        expect(controls![0]).toHaveProperty('DisplayName')
    });

    it('should throw an error for a non-existing template', () => {
        const TEMPLATE_NAME = `NonExistingTemplate`
        expect(() => AutoR1.getTemplateControlsFromName(templateFile, TEMPLATE_NAME)).toThrow(`Template ${TEMPLATE_NAME} not found.`);
    });

    it('should throw an error for a template without any controls', () => {
        const TEMPLATE_NAME = `My templates`
        expect(() => AutoR1.getTemplateControlsFromName(templateFile, TEMPLATE_NAME)).toThrow(`Template ${TEMPLATE_NAME} does not contain any controls.`);
    });
});

describe('createNavButtons', () => {
    let projectFile: ProjectFile;
    let templateFile: TemplateFile;

    beforeEach(() => {
        projectFile = new ProjectFile(PROJECT_INIT);
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('should create a nav button for each view and lower all existing controls', () => {
        const oldJoinedId = projectFile.jId;
        const overviewViewId = projectFile.getViewIdFromName('Overview')
        const oldControls = projectFile.findControlsByViewId(overviewViewId);

        AutoR1.createNavButtons(projectFile, templateFile);

        const newControls = projectFile.findControlsByViewId(overviewViewId);

        expect(projectFile.jId).toBeGreaterThan(oldJoinedId);
        expect(newControls.length).toBe(oldControls.length + 1);
        oldControls.forEach((oldControl, index) => {
            const newControl = newControls[index];
            expect(newControl.PosY).toBe(oldControl.PosY + AutoR1.NAV_BUTTON_Y + AutoR1.NAV_BUTTON_SPACING);
        });
    });
});

describe('createMeterView', () => {
    let projectFile: ProjectFile;
    let templateFile: TemplateFile;

    beforeEach(() => {
        projectFile = new ProjectFile(PROJECT_INIT);
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('should create the meter view', () => {
        const oldJoinedId = projectFile.jId;
        const oldViewCount = projectFile.getAllViews().length;
        expect(projectFile.jId).toBe(136);

        AutoR1.createMeterView(projectFile, templateFile);

        const newViewCount = projectFile.getAllViews().length;

        expect(projectFile.jId).toBeGreaterThan(oldJoinedId);
        expect(newViewCount).toBe(oldViewCount + 1);
        expect(projectFile.getViewIdFromName(AutoR1.METER_WINDOW_TITLE)).toBeTruthy();
        expect(projectFile.jId).toBe(200);
    });
});

describe('clean', () => {
    let projectFile: ProjectFile;
    let templateFile: TemplateFile;

    beforeEach(() => {
        projectFile = new ProjectFile(PROJECT_INIT);
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('should remove all generated views and controls', () => {
        const oldViewCount = projectFile.getAllViews().length;
        const oldGroupCount = projectFile.getAllGroups().length;

        const oldGroups = projectFile.getAllGroups();

        AutoR1.createMeterView(projectFile, templateFile);
        const groupId = projectFile.createGrp('TEST', 1);
        AutoR1.createSubLRCGroups(projectFile, groupId);

        let newViewCount = projectFile.getAllViews().length;
        let newGroupCount = projectFile.getGroupCount();

        expect(newViewCount).toBe(oldViewCount + 1);
        expect(newGroupCount).toBeGreaterThan(oldGroupCount);

        AutoR1.clean(projectFile, groupId);

        newViewCount = projectFile.getAllViews().length;
        newGroupCount = projectFile.getGroupCount();

        expect(newViewCount).toBe(oldViewCount);
        expect(newGroupCount).toBe(oldGroupCount);

    });
});

describe('configureApChannels', () => {
    let projectFile: AutoR1.AutoR1Project;
    let templateFile: TemplateFile;

    beforeEach(() => {
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('should create a group containing all AP enabled sources', () => {
        projectFile = new AutoR1.AutoR1Project(PROJECT_INIT_AP);
        AutoR1.configureApChannels(projectFile);
        expect(projectFile.getAllGroups().filter((g) => g.Name === AutoR1.AP_GROUP_TITLE).length).toBe(1);
    });


    it('should not create a group if AP is not enabled for any sources', () => {
        projectFile = new ProjectFile(PROJECT_INIT);
        AutoR1.configureApChannels(projectFile);
        expect(projectFile.getAllGroups().filter((g) => g.Name === AutoR1.AP_GROUP_TITLE).length).toBe(0);
    });

    it('should populate the apGroupID var when AP group is made', () => {
        projectFile = new AutoR1.AutoR1Project(PROJECT_INIT_AP);

        expect(projectFile.apGroupID).toBeFalsy()
        AutoR1.configureApChannels(projectFile);
        expect(projectFile.apGroupID).toBeTruthy()
    });

    it('should not populate the apGroupID var if AP group is not made', () => {
        projectFile = new AutoR1.AutoR1Project(PROJECT_INIT);

        expect(projectFile.apGroupID).toBeFalsy()
        AutoR1.configureApChannels(projectFile);
        expect(projectFile.apGroupID).toBeFalsy()
    });
});

describe('createMasterView', () => {
    let projectFile: AutoR1.AutoR1Project;
    let templateFile: TemplateFile;

    beforeEach(() => {
        projectFile = new AutoR1.AutoR1Project(PROJECT_INIT_AP);
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('creates the master view', () => {
        AutoR1.createMasterView(projectFile, templateFile);
        expect(projectFile.getAllViews().filter(g => g.Name === AutoR1.MASTER_WINDOW_TITLE).length).toBe(1)
    })

    it('inserts the Master Title template', () => {
        AutoR1.createMasterView(projectFile, templateFile);
        const controls = projectFile.findControlsByViewId(projectFile.masterViewId);
        expect(controls.find((c) => c.DisplayName === 'Auto - Master')).toBeTruthy();
    })
})

describe('createSubLRCGroups', () => {
    let projectFile: AutoR1.AutoR1Project;
    let templateFile: TemplateFile;

    beforeEach(() => {
        projectFile = new AutoR1.AutoR1Project(PROJECT_INIT_AP);
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('creates the correct number of groups', () => {
        const groupId = projectFile.createGrp('TEST', 1);
        const oldGroupCount = projectFile.getGroupCount();

        AutoR1.createSubLRCGroups(projectFile, groupId);

        const newGroupCount = projectFile.getGroupCount();

        // 1 master group + 1 master sub group + 3 L/C/R groups + 4 sub L devices + 4 sub R devices + 1 sub C devices
        expect(newGroupCount).toBe(oldGroupCount + 14);
    });
});

describe('addSubCtoSubL', () => {
    let projectFile: AutoR1.AutoR1Project;
    let templateFile: TemplateFile;

    beforeEach(() => {
        projectFile = new AutoR1.AutoR1Project(PROJECT_INIT_AP);
        templateFile = new TemplateFile(TEMPLATES);
    });

    it('creates a new group', () => {
        const groupId = projectFile.createGrp('TEST', 1);
        const oldGroupCount = projectFile.getAllGroups().length;

        AutoR1.createSubLRCGroups(projectFile, groupId);
        projectFile.getSrcGrpInfo();
        AutoR1.addSubCtoSubL(projectFile);

        const newGroupCount = projectFile.getAllGroups().length;

        // 1 master group + 1 master sub group + 3 L/C/R groups + 4 sub L devices + 4 sub R devices + 1 sub C devices + 1 additional sub L device (sub C device)
        expect(newGroupCount).toBe(oldGroupCount + 15)
    });
});
// NOTE: Casts to any are used to access private methods

import { AutoR1ProjectFile, AutoR1TemplateFile } from '../../autor1';
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

// Create a new project file for each test
beforeEach(() => {
    PROJECT_INIT = PROJECT_INIT_START + '.test';
    PROJECT_INIT_AP = PROJECT_INIT_AP_START + '.test';
    PROJECT_NO_INIT = PROJECT_NO_INIT_START + '.test';
    TEMPLATES = TEMPLATES_START + '.test';

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

describe('getSrcGrpInfo', () => {
    let projectFile: AutoR1ProjectFile;

    beforeEach(() => {
        projectFile = new AutoR1ProjectFile(PROJECT_INIT);
    });

    it('should return the correct number of source groups', () => {
        projectFile.getSrcGrpInfo();
        expect(projectFile.sourceGroups.length).toBe(11);
    });

    it('should return the correct number of channels for a source group', () => {
        projectFile.getSrcGrpInfo();
        expect(projectFile.sourceGroups[1].channelGroups.length).toBe(3);
    })
});

describe('findControlsByViewId', () => {
    let projectFile: AutoR1ProjectFile;

    beforeEach(() => {
        projectFile = new AutoR1ProjectFile(PROJECT_INIT);
    });

    it('should return an array of controls', () => {
        const controls = projectFile.getControlsByViewId(1000);
        expect(controls.length).toBeGreaterThan(0);
    });

    it('should throw an error if there arent any controls found', () => {
        const viewId = 1;
        expect(() => projectFile.getControlsByViewId(viewId)).toThrow(`Could not find any controls with viewId ${viewId}`);
    });
});

describe('getApStatus', () => {
    let projectNoAP: AutoR1ProjectFile;
    let projectAP: AutoR1ProjectFile;

    beforeEach(() => {
        projectNoAP = new AutoR1ProjectFile(PROJECT_INIT);
        projectAP = new AutoR1ProjectFile(PROJECT_INIT_AP);
        projectAP.getSrcGrpInfo();
        projectNoAP.getSrcGrpInfo();
    });

    it('should return true if any source group has ArrayProcessingEnable set to true', () => {
        const result = projectAP.getApStatus();
        expect(result).toBe(true);
    });

    it('should return false if no source group has ArrayProcessingEnable set to true', () => {
        const result = projectNoAP.getApStatus();
        expect(result).toBe(false);
    });

    it('should throw an error if sourceGroups is not loaded', () => {
        projectNoAP.sourceGroups = [];
        expect(() => projectNoAP.getApStatus()).toThrow('SourceGroups not loaded');
    });
});

describe('createApChannelGroup', () => {
    let projectFileAP: AutoR1ProjectFile;
    let projectFileNoAP: AutoR1ProjectFile;

    beforeEach(() => {
        projectFileAP = new AutoR1ProjectFile(PROJECT_INIT_AP);
        projectFileNoAP = new AutoR1ProjectFile(PROJECT_INIT);
        projectFileAP.getSrcGrpInfo()
    });

    it('should create an AP group', () => {
        (projectFileAP as any).createAPGroup(1);

        const apGroup = projectFileAP.getGroupIdFromName(AutoR1.AP_GROUP_TITLE);
        expect(apGroup).toBeDefined();
    });

    it('should throw an error if no AP channel groups are found', () => {
        expect(() => (projectFileNoAP as any).createAPGroup()).toThrow('No AP channel groups found.');
    });
});

describe('Methods', () => {
    let p: AutoR1ProjectFile;

    beforeEach(() => {
        p = new AutoR1ProjectFile(PROJECT_INIT);
        p.getSrcGrpInfo();
    });


    it('Fails if sub L/C/R groups are not found', () => {
        expect((p as any).hasSubGroups()).toBe(0);
    });

    it('Finds status of ArrayProcessing', () => {
        expect((p as any).getApStatus()).toBe(false);
    });

    it('Finds SUB array group', () => {
        expect((p as any).getSubArrayGroups().length).toBe(3);
    })

    it('Creates SUBs L/C/R groups', () => {
        const pId = p.createGrp('TEST', 1);
        (p as any).createSubLRCGroups(pId);
        expect((p as any).hasSubGroups()).toBe(3);
    });
});

describe('Templates', () => {
    it('Loads template file', () => {
        const t = new AutoR1TemplateFile(TEMPLATES);
        expect(t.templates.length).toBeGreaterThan(0)
    })
});

describe('getTemplateWidthHeight', () => {
    let templateFile: AutoR1TemplateFile;

    beforeEach(() => {
        templateFile = new AutoR1TemplateFile(TEMPLATES);
    });

    it('should return the correct size for an existing template', () => {
        const TEMPLATE_NAME = `Main Title`
        const size = templateFile.getTemplateWidthHeight(TEMPLATE_NAME);
        expect(size).toEqual({ width: 240, height: 42 });
    });

    it('should throw an error for a non-existing template', () => {
        const TEMPLATE_NAME = `NonExistingTemplate`
        expect(() => templateFile.getTemplateWidthHeight(TEMPLATE_NAME)).toThrow(`${TEMPLATE_NAME} template not found.`);
    });

    it('should throw and error for a template with no controls', () => {
        const TEMPLATE_NAME = `My templates`
        expect(() => templateFile.getTemplateWidthHeight(TEMPLATE_NAME)).toThrow(`${TEMPLATE_NAME} template controls not found.`);
    });
});

describe('getTemplateControlsFromName', () => {
    let templateFile: AutoR1TemplateFile;

    beforeEach(() => {
        templateFile = new AutoR1TemplateFile(TEMPLATES);
    });

    it('should return the controls for an existing template', () => {
        const controls = templateFile.getTemplateControlsFromName('Main Title');
        expect(controls![0]).toHaveProperty('DisplayName')
    });

    it('should throw an error for a non-existing template', () => {
        const TEMPLATE_NAME = `NonExistingTemplate`
        expect(() => templateFile.getTemplateControlsFromName(TEMPLATE_NAME)).toThrow(`Template ${TEMPLATE_NAME} not found.`);
    });

    it('should throw an error for a template without any controls', () => {
        const TEMPLATE_NAME = `My templates`
        expect(() => templateFile.getTemplateControlsFromName(TEMPLATE_NAME)).toThrow(`Template ${TEMPLATE_NAME} does not contain any controls.`);
    });
});

describe('createNavButtons', () => {
    let projectFile: AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;

    beforeEach(() => {
        projectFile = new AutoR1ProjectFile(PROJECT_INIT);
        templateFile = new AutoR1TemplateFile(TEMPLATES);
    });

    it('should create a nav button for each view and lower all existing controls', () => {
        const oldJoinedId = projectFile.getHighestJoinedID();
        const overviewViewId = projectFile.getViewIdFromName('Overview')
        const oldControls = projectFile.getControlsByViewId(overviewViewId);

        projectFile.getSrcGrpInfo();
        projectFile.createMeterView(templateFile);
        projectFile.createMainView(templateFile);
        projectFile.createNavButtons(templateFile);

        const newControls = projectFile.getControlsByViewId(overviewViewId);

        expect(projectFile.getHighestJoinedID()).toBeGreaterThan(oldJoinedId);
        expect(newControls.length).toBe(oldControls.length + 2);
        oldControls.forEach((oldControl, index) => {
            const newControl = newControls[index];
            expect(newControl.PosY).toBe(oldControl.PosY + AutoR1.NAV_BUTTON_Y + AutoR1.NAV_BUTTON_SPACING);
        });
    });
});

describe('createMeterView', () => {
    let projectFile: AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;

    beforeEach(() => {
        projectFile = new AutoR1ProjectFile(PROJECT_INIT);
        templateFile = new AutoR1TemplateFile(TEMPLATES);

        projectFile.getSrcGrpInfo();
    });

    it('should create the meter view', () => {
        const oldJoinedId = projectFile.getHighestJoinedID();
        const oldViewCount = projectFile.getAllViews().length;
        expect(projectFile.getHighestJoinedID()).toBe(135);

        projectFile.createMeterView(templateFile);

        const newViewCount = projectFile.getAllViews().length;

        const nJid = projectFile.getHighestJoinedID()

        expect(projectFile.getHighestJoinedID()).toBeGreaterThan(oldJoinedId);
        expect(newViewCount).toBe(oldViewCount + 1);
        expect(projectFile.getViewIdFromName(AutoR1.METER_WINDOW_TITLE)).toBeTruthy();
        expect(projectFile.getHighestJoinedID()).toBe(238);
    });
});

describe('clean', () => {
    let projectFile: AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;

    beforeEach(() => {
        projectFile = new AutoR1ProjectFile(PROJECT_INIT);
        templateFile = new AutoR1TemplateFile(TEMPLATES);
        projectFile.getSrcGrpInfo();
    });

    it('should remove all generated views and controls', () => {
        const oldViewCount = projectFile.getAllViews().length;
        const oldGroupCount = projectFile.getAllGroups().length;
        const oldControlCount = projectFile.getAllControls().length;

        projectFile.createMeterView(templateFile);
        projectFile.createMainView(templateFile);
        const groupId = projectFile.createGrp('TEST', 1);
        projectFile.createSubLRCGroups(groupId);

        let newViewCount = projectFile.getAllViews().length;
        let newGroupCount = projectFile.getAllGroups().length;
        let newControlCount = projectFile.getAllControls().length;

        expect(newViewCount).toBe(oldViewCount + 2);
        expect(newGroupCount).toBeGreaterThan(oldGroupCount);
        expect(newControlCount).toBeGreaterThan(oldControlCount);

        projectFile.clean(groupId);

        newViewCount = projectFile.getAllViews().length;
        newGroupCount = projectFile.getAllGroups().length;
        newControlCount = projectFile.getAllControls().length;

        expect(newViewCount).toBe(oldViewCount);
        expect(newGroupCount).toBe(oldGroupCount);
        expect(newControlCount).toBe(oldControlCount);
    });
});

describe('configureApChannels', () => {
    let projectFile: AutoR1.AutoR1ProjectFile;

    it('should create a group containing all AP enabled sources', () => {
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP);
        projectFile.getSrcGrpInfo();
        projectFile.createAPGroup();
        expect(projectFile.getAllGroups().filter((g) => g.Name === AutoR1.AP_GROUP_TITLE).length).toBe(1);
    });

    it('should throw if AP is not enabled for any sources', () => {
        projectFile = new AutoR1ProjectFile(PROJECT_INIT);
        projectFile.getSrcGrpInfo();
        expect(() => projectFile.createAPGroup()).toThrow()
        expect(projectFile.getAllGroups().filter((g) => g.Name === AutoR1.AP_GROUP_TITLE).length).toBe(0);
    });

    it('should populate the apGroupID var when AP group is made', () => {
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP);
        projectFile.getSrcGrpInfo();
        expect(() => projectFile.getAPGroup()).toThrow()
        projectFile.createAPGroup();
        expect(projectFile.getAPGroup()).toBeTruthy()
    });
});

describe('createMainView', () => {
    let projectFile: AutoR1.AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;

    beforeEach(() => {
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP);
        templateFile = new AutoR1TemplateFile(TEMPLATES);
        projectFile.getSrcGrpInfo();
    });

    it('creates the main view', () => {
        projectFile.createMeterView(templateFile);
        projectFile.createMainView(templateFile);
        expect(projectFile.getAllViews().filter(g => g.Name === AutoR1.MAIN_WINDOW_TITLE).length).toBe(1)
    })

    it('inserts the Main Title template', () => {
        projectFile.createMeterView(templateFile);
        projectFile.createMainView(templateFile);
        const mainViewId = (projectFile as any).getMainView().ViewId;
        const controls = projectFile.getControlsByViewId(mainViewId);
        expect(controls.find((c) => c.DisplayName === 'Auto - Main')).toBeTruthy();
    })
})

describe('createSubLRCGroups', () => {
    let projectFile: AutoR1.AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;

    beforeEach(() => {
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP);
        templateFile = new AutoR1TemplateFile(TEMPLATES);
    });

    it('creates the correct number of groups', () => {
        const groupId = projectFile.createGrp('TEST', 1);
        const oldGroupCount = projectFile.getAllGroups().length;

        projectFile.createSubLRCGroups(groupId);

        const newGroupCount = projectFile.getAllGroups().length;

        // 1 main group + 1 main sub group + 3 L/C/R groups + 4 sub L devices + 4 sub R devices + 1 sub C devices
        expect(newGroupCount).toBe(oldGroupCount + 14);
    });
});

describe('addSubCtoSubL', () => {
    let projectFile: AutoR1.AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;

    beforeEach(() => {
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP);
        templateFile = new AutoR1TemplateFile(TEMPLATES);
    });

    it('creates a new group', () => {
        const groupId = projectFile.createGrp('TEST', 1);
        const oldGroupCount = projectFile.getAllGroups().length;

        projectFile.createSubLRCGroups(groupId);
        projectFile.getSrcGrpInfo();
        projectFile.addSubCtoSubL();

        const newGroupCount = projectFile.getAllGroups().length;

        // 1 main group + 1 main sub group + 3 L/C/R groups + 4 sub L devices + 4 sub R devices + 1 sub C devices + 1 additional sub L device (sub C device)
        expect(newGroupCount).toBe(oldGroupCount + 15)
    });
});

describe('group discover', () => {
    let projectFile: AutoR1.AutoR1ProjectFile;

    beforeEach(() => {
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP);
    });

    it('should not have assigned a main group for the main group', () => {
        projectFile.getSrcGrpInfo();
        expect(projectFile.sourceGroups[0].channelGroups[0].mainGroup).toBeFalsy()
    })

    it('should discover the left group', () => {
        projectFile.getSrcGrpInfo();
        expect(projectFile.sourceGroups[0].channelGroups[0].leftGroup).toBeTruthy()
    })

    it('should discover the right group', () => {
        projectFile.getSrcGrpInfo();
        expect(projectFile.sourceGroups[0].channelGroups[0].rightGroup).toBeTruthy()
    })

    it('should discover the main group for the left group', () => {
        projectFile.getSrcGrpInfo();

        expect(projectFile.sourceGroups[0].channelGroups[0].leftGroup!.mainGroup).toBeTruthy()
    })

    it('should discover the main group for the right group', () => {
        projectFile.getSrcGrpInfo();

        expect(projectFile.sourceGroups[0].channelGroups[0].rightGroup!.mainGroup).toBeTruthy()
    });
})
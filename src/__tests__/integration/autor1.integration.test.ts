// NOTE: Casts to any are used to access private methods

import { AutoR1ProjectFile, AutoR1Template, AutoR1TemplateFile } from '../../autor1';
import * as AutoR1 from '../../autor1'
import { Control } from '../../dbpr';
import { setupTest, cleanupTest, PROJECT_INIT, PROJECT_INIT_AP, TEMPLATES } from '../setupTests';

describe('getSrcGrpInfo', () => {
    let projectFile: AutoR1ProjectFile;
    let fileId: number;

    beforeAll(() => {
        fileId = setupTest();
        projectFile = new AutoR1ProjectFile(PROJECT_INIT + fileId);
        projectFile.getSrcGrpInfo();
    });

    afterAll(() => {
        projectFile.close();
        cleanupTest(fileId);
    })

    it('should return the correct number of source groups', () => {
        expect(projectFile.sourceGroups.length).toBe(11);
    });


    it('should return the correct number of channels for a source group', () => {
        expect(projectFile.sourceGroups[1].channelGroups.length).toBe(3);
    })

    it('Discovers all source groups, channel groups and related info from a project', () => {
        expect(projectFile.sourceGroups.length).toBe(11);
        expect(projectFile.sourceGroups[0].channelGroups.length).toBe(3); // Array two way tops
        expect(projectFile.sourceGroups[0].channelGroups[0].channels.length).toBeGreaterThan(0);

        expect(projectFile.sourceGroups[1].channelGroups.length).toBe(3); // Array single channel tops
        expect(projectFile.sourceGroups[1].channelGroups[0].channels.length).toBeGreaterThan(0);

        expect(projectFile.sourceGroups[2].channelGroups.length).toBe(3); // Array two way subs
        expect(projectFile.sourceGroups[2].channelGroups[0].channels.length).toBeGreaterThan(0);

        expect(projectFile.sourceGroups[3].channelGroups.length).toBe(3); // Array single channel subs
        expect(projectFile.sourceGroups[3].channelGroups[0].channels.length).toBeGreaterThan(0);

        expect(projectFile.sourceGroups[4].channelGroups.length).toBe(6); // Array flown mixed sub top
        expect(projectFile.sourceGroups[4].channelGroups[0].channels.length).toBeGreaterThan(0);

        expect(projectFile.sourceGroups[5].channelGroups.length).toBe(1); // Array mono
        expect(projectFile.sourceGroups[5].channelGroups[0].channels.length).toBeGreaterThan(0);

        expect(projectFile.sourceGroups[6].channelGroups.length).toBe(2); // Array ground stack mono
        expect(projectFile.sourceGroups[6].channelGroups[0].channels.length).toBeGreaterThan(0);

        expect(projectFile.sourceGroups[7].channelGroups.length).toBe(1); // Point source
        expect(projectFile.sourceGroups[7].channelGroups[0].channels.length).toBeGreaterThan(0);

        expect(projectFile.sourceGroups[8].channelGroups.length).toBe(1); // Point source sub
        expect(projectFile.sourceGroups[8].channelGroups[0].channels.length).toBeGreaterThan(0);

        expect(projectFile.sourceGroups[9].channelGroups.length).toBe(2); // Point source mixed
        expect(projectFile.sourceGroups[9].channelGroups[0].channels.length).toBeGreaterThan(0);

        expect(projectFile.sourceGroups[10].channelGroups.length).toBe(1); // SUB array LCR
        expect(projectFile.sourceGroups[10].channelGroups[0].channels.length).toBeGreaterThan(0);
    });
});

describe('findControlsByViewId', () => {
    let projectFile: AutoR1ProjectFile;
    let fileId: number;

    beforeAll(() => {
        fileId = setupTest();
        projectFile = new AutoR1ProjectFile(PROJECT_INIT + fileId);
        projectFile.getSrcGrpInfo();
    });

    afterAll(() => {
        projectFile.close();
        cleanupTest(fileId);
    })

    it('should return an array of controls', () => {
        const controls = projectFile.getControlsByViewId(1000);
        expect(controls.length).toBeGreaterThan(0);
    });

    it('should throw an error if there arent any controls found', () => {
        const viewId = 1;
        expect(() => projectFile.getControlsByViewId(viewId)).toThrow(`Could not find any controls with viewId ${viewId}`);
    });
});

// SLOW
describe('getMuteGroupID', () => {
    let projectFile: AutoR1ProjectFile;
    let fileId: number;

    beforeEach(() => {
        fileId = setupTest();
        projectFile = new AutoR1ProjectFile(PROJECT_INIT + fileId);
        projectFile.getSrcGrpInfo();
    });

    afterEach(() => {
        projectFile.close();
        cleanupTest(fileId);
    })

    it('should return undefined if mute group is not found', () => {
        // Act
        const rtn = projectFile.getMuteGroupID()

        // Assert
        expect(rtn).toBeFalsy();
    });

    it('should not throw if mute group is found', () => {
        // Arrange
        projectFile.createMainMuteGroup();
        projectFile.getAPGroup();

        // Assert
        expect(() => projectFile.getMuteGroupID()).not.toThrow();
    });

    it('should return mute group ID', () => {
        // Arrange
        projectFile.createMainMuteGroup();

        // Act
        const muteGroupId = projectFile.getMuteGroupID();

        // Assert
        expect(muteGroupId).toBeTruthy();
    });
});

describe('getFallbackGroupID', () => {
    let projectFile: AutoR1ProjectFile;
    let fileId: number;

    beforeEach(() => {
        fileId = setupTest();
        projectFile = new AutoR1ProjectFile(PROJECT_INIT + fileId);
        projectFile.getSrcGrpInfo();
    });

    afterEach(() => {
        projectFile.close();
        cleanupTest(fileId);
    })


    it('should return undefined if fallback group is not found', () => {
        // Act
        const rtn = projectFile.getFallbackGroupID()

        // Assert
        expect(rtn).toBeFalsy();
    });

    it('should not throw if fallback group is found', () => {
        // Arrange
        projectFile.createMainFallbackGroup();

        // Assert
        expect(() => projectFile.getFallbackGroupID()).not.toThrow();
    });

    it('should return fallback group ID', () => {
        // Arrange
        projectFile.createMainFallbackGroup();

        // Act
        const fallbackGroupId = projectFile.getFallbackGroupID();

        // Assert
        expect(fallbackGroupId).toBeTruthy();
    });
});

describe('getApStatus', () => {
    let projectFileNoAP: AutoR1ProjectFile;
    let projectFileAP: AutoR1ProjectFile;
    let fileId: number;

    beforeAll(() => {
        fileId = setupTest();
        projectFileNoAP = new AutoR1ProjectFile(PROJECT_INIT + fileId);
        projectFileAP = new AutoR1ProjectFile(PROJECT_INIT_AP + fileId);
        projectFileAP.getSrcGrpInfo();
        projectFileNoAP.getSrcGrpInfo();
    });

    afterAll(() => {
        projectFileAP.close();
        projectFileNoAP.close();
        cleanupTest(fileId);
    })


    it('should return true if any source group has ArrayProcessingEnable set to true', () => {
        const result = projectFileAP.getApStatus();
        expect(result).toBe(true);
    });

    it('should return false if no source group has ArrayProcessingEnable set to true', () => {
        const result = projectFileNoAP.getApStatus();
        expect(result).toBe(false);
    });

    it('should throw an error if sourceGroups is not loaded', () => {
        projectFileNoAP.sourceGroups = [];
        expect(() => projectFileNoAP.getApStatus()).toThrow('SourceGroups not loaded');
    });
});

describe('createApChannelGroup', () => {
    let projectFileAP: AutoR1ProjectFile;
    let projectFileNoAP: AutoR1ProjectFile;
    let fileId: number;

    beforeEach(() => {
        fileId = setupTest();
        projectFileAP = new AutoR1ProjectFile(PROJECT_INIT_AP + fileId);
        projectFileNoAP = new AutoR1ProjectFile(PROJECT_INIT + fileId);
        projectFileAP.getSrcGrpInfo()
    });

    afterEach(() => {
        projectFileAP.close();
        projectFileNoAP.close();
        cleanupTest(fileId);
    })

    it('should create an AP group', () => {
        (projectFileAP as any).createAPGroup(1);

        const apGroup = projectFileAP.getGroupIdFromName(AutoR1.AP_GROUP_TITLE);
        expect(apGroup).toBeDefined();
    });

    it('should throw an error if no AP channel groups are found', () => {
        expect(() => (projectFileNoAP as any).createAPGroup()).toThrow('No AP channel groups found.');
    });
});

// describe('Methods', () => {
//     let p: AutoR1ProjectFile;

//     beforeEach(() => {
//         p = new AutoR1ProjectFile(PROJECT_INIT+fileId);
//         p.getSrcGrpInfo();
//     });


//     it('Fails if sub L/C/R groups are not found', () => {
//         expect((p as any).hasSubGroups()).toBe(0);
//     });

//     it('Finds status of ArrayProcessing', () => {
//         expect((p as any).getApStatus()).toBe(false);
//     });

//     it('Finds SUB array group', () => {
//         expect((p as any).getSubArrayGroups().length).toBe(3);
//     })

//     it('Creates SUBs L/C/R groups', () => {
//         const pId = p.createGroup({ Name: 'TEST', ParentId: 1 });
//         (p as any).createSubLRCGroups(pId);
//         expect((p as any).hasSubGroups()).toBe(3);
//     });
// });

describe('Templates', () => {
    let fileId: number;

    beforeEach(() => {
        fileId = setupTest();
    });

    afterEach(() => {
        cleanupTest(fileId);
    });

    it('Loads template file', () => {
        const t = new AutoR1TemplateFile(TEMPLATES + fileId);
        expect(t.templates.length).toBeGreaterThan(0)
    })
});

describe('getTemplateWidthHeight', () => {
    let templateFile: AutoR1TemplateFile;
    let fileId: number;

    beforeAll(() => {
        fileId = setupTest();
        templateFile = new AutoR1TemplateFile(TEMPLATES + fileId);
    });

    afterAll(() => {
        cleanupTest(fileId);
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
    let fileId: number;

    beforeAll(() => {
        fileId = setupTest();
        templateFile = new AutoR1TemplateFile(TEMPLATES + fileId);
    });

    afterAll(() => {
        cleanupTest(fileId);
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
    let fileId: number;

    beforeAll(() => {
        fileId = setupTest();
        projectFile = new AutoR1ProjectFile(PROJECT_INIT + fileId);
        templateFile = new AutoR1TemplateFile(TEMPLATES + fileId);
    });

    afterAll(() => {
        projectFile.close();
        templateFile.close();
        cleanupTest(fileId);
    })

    it('should create a nav button for each view and lower all existing controls', () => {
        const oldJoinedId = projectFile.getHighestJoinedID();
        const overviewViewId = projectFile.getViewIdFromName('Overview')
        const oldControls = projectFile.getControlsByViewId(overviewViewId!);

        projectFile.getSrcGrpInfo();
        projectFile.createMeterView(templateFile);
        projectFile.createMainView(templateFile);
        projectFile.createNavButtons(templateFile);

        const newControls = projectFile.getControlsByViewId(overviewViewId!);

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
    let fileId: number;

    beforeAll(() => {
        fileId = setupTest();
        projectFile = new AutoR1ProjectFile(PROJECT_INIT + fileId);
        templateFile = new AutoR1TemplateFile(TEMPLATES + fileId);

        projectFile.getSrcGrpInfo();
    });

    afterAll(() => {
        projectFile.close();
        templateFile.close();
        cleanupTest(fileId);
    })

    it('should create the meter view', () => {
        const oldJoinedId = projectFile.getHighestJoinedID();
        const oldViewCount = projectFile.getAllRemoteViews().length;
        expect(projectFile.getHighestJoinedID()).toBe(135);

        projectFile.createMeterView(templateFile);

        const newViewCount = projectFile.getAllRemoteViews().length;

        const nJid = projectFile.getHighestJoinedID()

        expect(projectFile.getHighestJoinedID()).toBeGreaterThan(oldJoinedId);
        expect(newViewCount).toBe(oldViewCount + 1);
        expect(projectFile.getViewIdFromName(AutoR1.METER_WINDOW_TITLE)).toBeTruthy();
        expect(projectFile.getHighestJoinedID()).toBe(246);
    });
});

describe('clean', () => {
    let projectFile: AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;
    let fileId: number;

    beforeAll(() => {
        fileId = setupTest();
        projectFile = new AutoR1ProjectFile(PROJECT_INIT + fileId);
        templateFile = new AutoR1TemplateFile(TEMPLATES + fileId);
        projectFile.getSrcGrpInfo();
    });

    afterAll(() => {
        projectFile.close();
        templateFile.close();
        cleanupTest(fileId);
    });

    it('should remove all generated views and controls', () => {
        const oldViewCount = projectFile.getAllRemoteViews().length;
        const oldGroupCount = projectFile.getAllGroups().length;
        const oldControlCount = projectFile.getAllControls().length;

        projectFile.createMeterView(templateFile);
        projectFile.createMainView(templateFile);
        const groupId = projectFile.createGroup({ Name: 'TEST', ParentId: 1 });
        projectFile.createSubLRCGroups(groupId);

        let newViewCount = projectFile.getAllRemoteViews().length;
        let newGroupCount = projectFile.getAllGroups().length;
        let newControlCount = projectFile.getAllControls().length;

        expect(newViewCount).toBe(oldViewCount + 2);
        expect(newGroupCount).toBeGreaterThan(oldGroupCount);
        expect(newControlCount).toBeGreaterThan(oldControlCount);

        projectFile.clean(groupId);

        newViewCount = projectFile.getAllRemoteViews().length;
        newGroupCount = projectFile.getAllGroups().length;
        newControlCount = projectFile.getAllControls().length;

        expect(newViewCount).toBe(oldViewCount);
        expect(newGroupCount).toBe(oldGroupCount);
        expect(newControlCount).toBe(oldControlCount);
    });
});

describe('configureApChannels', () => {
    let projectFileAP: AutoR1.AutoR1ProjectFile;
    let projectFileNoAP: AutoR1.AutoR1ProjectFile;
    let fileId: number;

    beforeEach(() => {
        fileId = setupTest();
        projectFileAP = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP + fileId);
        projectFileNoAP = new AutoR1.AutoR1ProjectFile(PROJECT_INIT + fileId);
        projectFileAP.getSrcGrpInfo();
        projectFileNoAP.getSrcGrpInfo();
    });

    afterEach(() => {
        projectFileAP.close();
        projectFileNoAP.close();
        cleanupTest(fileId);
    });

    it('should create a group containing all AP enabled sources', () => {
        projectFileAP.createAPGroup();
        expect(projectFileAP.getAllGroups().filter((g) => g.Name === AutoR1.AP_GROUP_TITLE).length).toBe(1);
    });

    it('should throw if AP is not enabled for any sources', () => {
        expect(() => projectFileNoAP.createAPGroup()).toThrow()
        expect(projectFileAP.getAllGroups().filter((g) => g.Name === AutoR1.AP_GROUP_TITLE).length).toBe(0);
    });

    it('should populate the apGroupID var when AP group is made', () => {
        expect(projectFileAP.getAPGroup()).toBeFalsy();
        projectFileAP.createAPGroup();
        expect(projectFileAP.getAPGroup()).toBeTruthy()
    });
});

describe('createMainView', () => {
    let projectFile: AutoR1.AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;
    let fileId: number;

    beforeEach(() => {
        fileId = setupTest();
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP + fileId);
        templateFile = new AutoR1TemplateFile(TEMPLATES + fileId);
        projectFile.getSrcGrpInfo();
    });

    afterEach(() => {
        projectFile.close();
        templateFile.close();
        cleanupTest(fileId);
    });

    it('creates the main view', () => {
        projectFile.createMeterView(templateFile);
        projectFile.createMainView(templateFile);
        expect(projectFile.getAllRemoteViews().filter(g => g.Name === AutoR1.MAIN_WINDOW_TITLE).length).toBe(1)
    })

    it('inserts the Main Title template', () => {
        projectFile.createMeterView(templateFile);
        projectFile.createMainView(templateFile);
        const mainViewId = (projectFile as any).getMainView().ViewId;
        const controls = projectFile.getControlsByViewId(mainViewId);
        expect(controls.find((c) => c.DisplayName === 'Auto - Main')).toBeTruthy();
    })

    it('correctly assigns ViewId value', () => {
        projectFile.createMeterView(templateFile);

        let controls = projectFile.getAllControls();
        controls.forEach((c) => expect(c.ViewId).toBeTruthy());

        projectFile.createMainView(templateFile);
        controls = projectFile.getAllControls();
        controls.forEach((c) => expect(c.ViewId).toBeTruthy());
    })
})

describe('insertTemplate', () => {
    let projectFile: AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;
    let template: AutoR1Template;
    let fileId: number;
    let prevJoinedId: number;
    let JoinedId: number;
    let insertedControls: Control[];
    let insertedControl: Control;

    const posX = 100;
    const posY = 200;
    const TargetId = 123;
    const TargetChannel = 1;
    const Width = 100;
    const Height = 50;
    const ViewId = 1000;
    const DisplayName = 'My Display Name';

    beforeAll(() => {
        fileId = setupTest();
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP + fileId);
        templateFile = new AutoR1TemplateFile(TEMPLATES + fileId);
        projectFile.getSrcGrpInfo();

        template = templateFile.templates[1];

        prevJoinedId = projectFile.getHighestJoinedID();
        projectFile.insertTemplate(template, ViewId, posX, posY, { DisplayName, TargetId, TargetChannel, Width, Height });
        JoinedId = projectFile.getHighestJoinedID();

        insertedControls = projectFile.getControlsByViewId(ViewId);
        insertedControl = insertedControls.filter((c) => c.JoinedId === JoinedId)[0]
    });

    afterAll(() => {
        projectFile.close();
        templateFile.close();
        cleanupTest(fileId);
    });

    it('should cause the highest JoinedId to be incremented', () => {
        expect(projectFile.getHighestJoinedID()).toBeGreaterThan(prevJoinedId);
    })

    it('should cause insert a new control into the Control table', () => {
        expect(insertedControl).toBeDefined();
    })

    it('should correctly set the DisplayName of a new control', () => {
        expect(insertedControl!.DisplayName).toBe(DisplayName);
    })

    it('should correctly set the TargetId of a new control', () => {
        expect(insertedControl!.TargetId).toBe(TargetId);
    })

    it('should correctly set the TargetChannel of a new control', () => {
        expect(insertedControls!.find((control) => control.TargetChannel === TargetChannel)).toBeTruthy();
    })

    it('should correctly set the Width of a new control', () => {
        expect(insertedControl!.Width).toBe(Width);
    })

    it('should correctly set the Height of a new control', () => {
        expect(insertedControl!.Height).toBe(Height);
    })

    it('should correctly set the Type of a new control', () => {
        expect(insertedControl!.Type).toBe(template.controls![0].Type);
    })

    it('should correctly set the PosX of a new control', () => {
        expect(insertedControl!.PosX).toBe(posX);
    })

    it('should correctly set the PosY of a new control', () => {
        expect(insertedControl!.PosY).toBe(posY);
    })

    it('should correctly set the Width of a new control', () => {
        expect(insertedControl!.Width).toBe(Width);
    })

    it('should correctly set the Height of a new control', () => {
        expect(insertedControl!.Height).toBe(Height);
    })

    it('should correctly set the TargetId of a new control', () => {
        expect(insertedControl!.TargetId).toBe(TargetId);
    })
});

describe('createMainViewOverview', () => {
    let projectFile: AutoR1.AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;
    let fileId: number;

    beforeAll(() => {
        fileId = setupTest();
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP + fileId);
        templateFile = new AutoR1TemplateFile(TEMPLATES + fileId);
        projectFile.getSrcGrpInfo();
    });

    afterAll(() => {
        projectFile.close();
        templateFile.close();
        cleanupTest(fileId);
    });

    it('correctly assigns ViewId value', () => {
        projectFile.createMeterView(templateFile);
        (projectFile as any).createMainViewOverview(templateFile, 10, 10, 1500);
        let controls = projectFile.getAllControls();
        controls.forEach((c) => expect(c.ViewId).toBeTruthy());
    })
});


describe('createMainViewMeters', () => {
    let projectFile: AutoR1.AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;
    let fileId: number;

    beforeEach(() => {
        fileId = setupTest();
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP + fileId);
        templateFile = new AutoR1TemplateFile(TEMPLATES + fileId);
        projectFile.getSrcGrpInfo();
    });

    afterEach(() => {
        projectFile.close();
        templateFile.close();
        cleanupTest(fileId);
    });

    it('correctly assigns ViewId value', () => {
        const viewId = 1500
        projectFile.createMeterView(templateFile);
        (projectFile as any).createMainViewMeters(templateFile, 10, 10, viewId);
        let controls = projectFile.getAllControls();
        controls.forEach((c) => expect(c.ViewId).toBeTruthy());
    })
});

describe('createSubLRCGroups', () => {
    let projectFile: AutoR1.AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;
    let fileId: number;

    beforeEach(() => {
        fileId = setupTest();
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP + fileId);
        templateFile = new AutoR1TemplateFile(TEMPLATES + fileId);
    });

    afterEach(() => {
        projectFile.close();
        templateFile.close();
        cleanupTest(fileId);
    });

    it('creates the correct number of groups', () => {
        const groupId = projectFile.createGroup({ Name: 'TEST', ParentId: 1 });
        const oldGroupCount = projectFile.getAllGroups().length;

        projectFile.createSubLRCGroups(groupId);

        const newGroupCount = projectFile.getAllGroups().length;

        // 1 main group + 1 main sub group + 3 L/C/R groups + 4 sub L devices + 4 sub R devices + 1 sub C devices
        expect(newGroupCount).toBe(oldGroupCount + 14);
    });
});

describe('addSubCtoSubL', () => {
    let projectFile: AutoR1.AutoR1ProjectFile;
    let fileId: number;

    beforeEach(() => {
        fileId = setupTest();
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP + fileId);
    });

    afterEach(() => {
        projectFile.close();
        cleanupTest(fileId);
    });

    it('creates a new group', () => {
        const groupId = projectFile.createGroup({ Name: 'TEST', ParentId: 1 });
        const oldGroupCount = projectFile.getAllGroups().length;

        projectFile.createSubLRCGroups(groupId);
        projectFile.getSrcGrpInfo();
        projectFile.addSubCtoSubL();

        const newGroupCount = projectFile.getAllGroups().length;

        // 1 main group + 1 main sub group + 3 L/C/R groups + 4 sub L devices + 4 sub R devices + 1 sub C devices + 1 additional sub L device (sub C device)
        expect(newGroupCount).toBe(oldGroupCount + 15)
    });
});

describe('Crossover', () => {
    let projectFile: AutoR1.AutoR1ProjectFile;
    let fileId: number;

    beforeAll(() => {
        fileId = setupTest();
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP + fileId);
        projectFile.getSrcGrpInfo();
    });

    afterAll(() => {
        projectFile.close();
        cleanupTest(fileId);
    });

    it('should discover a CUT crossover', () => {
        expect(projectFile.sourceGroups[0].xover).toBe('CUT')
    })

    it('should discover an Infra crossover', () => {
        expect(projectFile.sourceGroups[2].xover).toBe('Infra')
    })

    it('should discover a 100Hz crossover', () => {
        expect(projectFile.sourceGroups[3].xover).toBe('100Hz')
    })
});

describe('group discover', () => {
    let projectFile: AutoR1.AutoR1ProjectFile;
    let fileId: number;

    beforeAll(() => {
        fileId = setupTest();
        projectFile = new AutoR1.AutoR1ProjectFile(PROJECT_INIT_AP + fileId);
        projectFile.getSrcGrpInfo();
    });

    afterAll(() => {
        projectFile.close();
        cleanupTest(fileId);
    });

    it('should not have assigned a main group for the main group', () => {
        expect(projectFile.sourceGroups[0].channelGroups[0].mainGroup).toBeFalsy()
    })

    it('should discover the left group', () => {
        expect(projectFile.sourceGroups[0].channelGroups[0].leftGroup).toBeTruthy()
    })

    it('should discover the right group', () => {
        expect(projectFile.sourceGroups[0].channelGroups[0].rightGroup).toBeTruthy()
    })

    it('should discover the main group for the left group', () => {
        expect(projectFile.sourceGroups[0].channelGroups[0].leftGroup!.mainGroup).toBeTruthy()
    })

    it('should discover the main group for the right group', () => {
        expect(projectFile.sourceGroups[0].channelGroups[0].rightGroup!.mainGroup).toBeTruthy()
    });
});
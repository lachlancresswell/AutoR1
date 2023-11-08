import { ActionTypes, Control, ProjectFile, TargetChannels, TargetPropertyType, TargetTypes, TemplateFile } from '../../dbpr'
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

let p: ProjectFile;
beforeEach(() => {
    p = new ProjectFile(PROJECT_INIT);
});

describe('Constructor', () => {
    it('Constructor throws with non-existing proejct', () => {
        expect(() => new ProjectFile(PROJECT_NO_EXIST)).toThrow('File does not exist');
    });

    it('Constructor throws with unintialised proejct', () => {
        expect(() => new ProjectFile(PROJECT_NO_INIT)).toThrow('Project file is not initialised');
    });
});

describe('getGroupIdFromName', () => {
    it('Finds a groups ID from its name', () => {
        expect(p.getGroupIdFromName('Master')).toBe(2);
    });
});

describe('getViewIdFromName', () => {
    it('Finds the ID of a view group from its name', () => {
        expect(p.getViewIdFromName('Overview')).toBe(1000);
    });
});

describe('getAllGroups', () => {
    it('Finds number of groups in project', () => {
        expect(p.getAllGroups().length).toBe(283);
    });
});

describe('createGroup', () => {
    it('Creates a new group', () => {
        const newId = p.createGroup({ Name: 'test' });
        expect(p.getGroupIdFromName('test')).toBe(newId);
    });
});

describe('addChannelToGroup', () => {
    it('Adds a channel to a group', () => {
        const newGroup = {
            Name: 'test',
            ParentId: 1,
            TargetId: 2,
            TargetChannel: 3
        };
        p.addChannelToGroup(newGroup);

        const insertedGroup = p.getAllGroups().find(g => g.Name === newGroup.Name);
        expect(insertedGroup).toBeTruthy();
        expect(insertedGroup?.Name).toEqual(newGroup.Name);
        expect(insertedGroup?.ParentId).toEqual(newGroup.ParentId);
        expect(insertedGroup?.TargetId).toEqual(newGroup.TargetId);
        expect(insertedGroup?.TargetChannel).toEqual(newGroup.TargetChannel);
    });
});

describe('deleteGroup', () => {
    it('Removes a group', () => {
        const newId = p.createGroup({ Name: 'test' });
        expect(p.getGroupIdFromName('test')).toBe(newId);
        p.deleteGroup(newId);
        expect(() => p.getGroupIdFromName('test')).toThrow('Could not find group');
    });
});

describe('getSourceGroupNameFromID', () => {
    it('Throws when SourceGroup cannot be found', () => {
        const p = new ProjectFile(PROJECT_INIT)
        expect(() => p.getSourceGroupNameFromID(10000)).toThrow();
    });

    it('Doesnt throw when SourceGroup is found', () => {
        const p = new ProjectFile(PROJECT_INIT)
        expect(() => p.getSourceGroupNameFromID(1)).not.toThrow();
    });

    it('Finds name of a source group from a group ID', () => {
        const p = new ProjectFile(PROJECT_INIT)
        expect(p.getSourceGroupNameFromID(1)).toBe('Unused channels');
    });
});

describe('getControlsByViewId', () => {
    it('Throws when View cannot be found', () => {
        expect(() => p.getControlsByViewId(1)).toThrow();
    });

    it('Doesnt throw when View is found', () => {
        expect(() => p.getControlsByViewId(1000)).not.toThrow();
    });

    it('Finds controls by view ID', () => {
        const controls = p.getControlsByViewId(1000);
        expect(controls.length).toBeGreaterThan(0);
    });
});

describe('getControlsByJoinedId', () => {
    it('Throws when JoinedId cannot be found', () => {
        expect(() => p.getControlsByJoinedId(10000)).toThrow();
    });

    it('Doesnt throw when JoinedId is found', () => {
        expect(() => p.getControlsByJoinedId(1)).not.toThrow();
    });

    it('Finds controls by JoinedId', () => {
        const controls = p.getControlsByJoinedId(1);
        expect(controls.length).toBeGreaterThan(0);
    });
});

describe('getSourceGroupIDFromName', () => {
    it('Throws when SourceGroup cannot be found', () => {
        const p = new ProjectFile(PROJECT_INIT)
        expect(() => p.getSourceGroupIDFromName('test')).toThrow();
    });

    it('Doesnt throw when SourceGroup is found', () => {
        const p = new ProjectFile(PROJECT_INIT)
        expect(() => p.getSourceGroupIDFromName('Unused channels')).not.toThrow();
    });

    it('Finds ID of a source group from a source group name', () => {
        const p = new ProjectFile(PROJECT_INIT)
        expect(p.getSourceGroupIDFromName('Unused channels')).toBe(1);
    });
});

describe('getHighestJoinedID', () => {
    it('Finds the highest control ID', () => {
        expect(p.getHighestJoinedID()).toBeGreaterThan(0);
    });
});

describe('getHighestGroupID', () => {
    it('Finds the highest group ID', () => {
        expect(p.getHighestGroupID()).toBeGreaterThan(0);
    });
});

describe('getAllRemoteViews', () => {
    it('Finds all remote views', () => {
        expect(p.getAllRemoteViews().length).toBeGreaterThan(0);
    });
});

describe('getAllControls', () => {
    it('Finds all controls', () => {
        expect(p.getAllControls().length).toBeGreaterThan(0);
    });
});

describe('getCanIdFromDeviceId', () => {
    it('Finds the CAN ID from a device ID', () => {
        expect(p.getCanIdFromDeviceId(1)).toBeTruthy();
    })
});

describe('insertControl', () => {
    let projectFile: ProjectFile;
    let control: Control;
    let loadedControl: Control;

    const JoinedId = 7777;

    beforeEach(() => {
        projectFile = new ProjectFile(PROJECT_INIT);
        control = {
            ControlId: 1,
            Type: 2,
            PosX: 3,
            PosY: 4,
            Width: 5,
            Height: 6,
            ViewId: 7,
            DisplayName: 'DisplayName',
            UniqueName: 'UniqueName',
            JoinedId,
            LimitMin: 9,
            LimitMax: 10,
            MainColor: 11,
            SubColor: 12,
            LabelColor: 13,
            LabelFont: 14,
            LabelAlignment: 15,
            LineThickness: 16,
            ThresholdValue: 17,
            Flags: 18,
            ActionType: ActionTypes.NAVIGATION,
            TargetType: TargetTypes.VIEW,
            TargetId: 19,
            TargetChannel: TargetChannels.CHANNEL_A,
            TargetProperty: TargetPropertyType.ARRAYPROCESSING_COMMENT,
            TargetRecord: 20,
            ConfirmOnMsg: 'ConfirmOnMsg',
            ConfirmOffMsg: 'ConfirmOffMsg',
            PictureIdDay: 21,
            PictureIdNight: 22,
            Font: 'Font',
            Alignment: 23,
            Dimension: new Uint8Array(1),
        };

        projectFile.insertControl(control);

        loadedControl = projectFile.getControlsByJoinedId(JoinedId)[0]
    });

    it('should insert a control into the project file', () => {
        expect(loadedControl).toBeTruthy();
    });

    it('should insert a control into the project file with the correct JoinedId', () => {
        expect(loadedControl.JoinedId).toBe(JoinedId);
    })

    it('should insert a control into the project file with the correct Font', () => {
        expect(loadedControl.Font).toBe(control.Font);
    })

    it('should insert a control into the project file with the correct PosX', () => {
        expect(loadedControl.PosX).toBe(control.PosX);
    })
});

describe('TemplateFile', () => {
    describe('Constructor', () => {
        it('Constructor throws with non-existing file', () => {
            expect(() => new TemplateFile(PROJECT_NO_EXIST)).toThrow('File does not exist');
        });

        it('Constructor doesnt throw with existing file', () => {
            expect(() => new TemplateFile(TEMPLATES)).not.toThrow();
        });
    });

    describe('getTemplateControlsByName', () => {
        it('Throws when template cannot be found', () => {
            const templates = new TemplateFile(TEMPLATES);

            expect(() => templates.getTemplateControlsByName('test')).toThrow();
        });

        it('Finds template controls from a given name', () => {
            const templates = new TemplateFile(TEMPLATES);

            expect(templates.getTemplateControlsByName('Main Title')).toBeTruthy();
        });
    });
});
import { ActionTypes, Control, ProjectFile, TargetChannels, TargetPropertyType, TargetTypes, TemplateFile } from '../../dbpr'
import { setupTest, cleanupTest, PROJECT_INIT, PROJECT_NO_EXIST, PROJECT_NO_INIT, TEMPLATES } from '../setupTests';

let projectFile: ProjectFile;
let fileId: number;

beforeEach(async () => {
    fileId = setupTest();
    projectFile = await ProjectFile.build(PROJECT_INIT + fileId);
});

afterEach(() => {
    projectFile.close();
    cleanupTest(fileId);
});

describe('Constructor', () => {
    it('Constructor throws with non-existing proejct', async () => await expect(async () => await ProjectFile.build(PROJECT_NO_EXIST)).rejects.toThrow('File does not exist'));

    it('Constructor throws with unintialised proejct', async () => {
        await expect(async () => await ProjectFile.build(PROJECT_NO_INIT + fileId)).rejects.toThrow();
    });

    it('Constructor does not throw with intialised proejct', () => {
        expect(async () => await ProjectFile.build(PROJECT_INIT + fileId)).not.toThrow();
    });
});

describe('Name of the group', () => {
    beforeEach(async () => {
        fileId = setupTest();
        projectFile = await ProjectFile.build(PROJECT_INIT + fileId);
    });

    afterEach(() => {
        // projectFile.close();
        // cleanupTest(fileId);
    });

    describe('getGroupIdFromName', () => {
        it('Finds a groups ID from its name', () => {
            expect(projectFile.getGroupIdFromName('Master')).toBe(2);
        });
    });

    describe('getViewIdFromName', () => {
        it('Finds the ID of a view group from its name', () => {
            expect(projectFile.getViewIdFromName('Overview')).toBe(1000);
        });
    });

    describe('getAllGroups', () => {
        it('Finds number of groups in project', () => {
            expect(projectFile.getAllGroups()!.length).toBe(283);
        });
    });

    describe('createGroup', () => {
        it('Returns the ID of the new group', () => {
            const newId = projectFile.createGroup({ Name: 'test' });
            expect(newId).toBeGreaterThan(0);
        });

        it('Adds a new group to the project', () => {
            const newId = projectFile.createGroup({ Name: 'test' });
            expect(projectFile.getGroupIdFromName('test')).toBe(newId);
        });

        it('Creates a group with a given Parent ID', () => {
            const Name = 'test';
            const ParentId = 777;

            const newId = projectFile.createGroup({ Name, ParentId });

            const group = projectFile.getAllGroups()?.find((g) => g.GroupId === newId);
            expect(group?.ParentId).toBe(ParentId);
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
            projectFile.addChannelToGroup(newGroup);

            const insertedGroup = projectFile.getAllGroups()!.find(g => g.Name === newGroup.Name);
            expect(insertedGroup).toBeTruthy();
            expect(insertedGroup?.Name).toEqual(newGroup.Name);
            expect(insertedGroup?.ParentId).toEqual(newGroup.ParentId);
            expect(insertedGroup?.TargetId).toEqual(newGroup.TargetId);
            expect(insertedGroup?.TargetChannel).toEqual(newGroup.TargetChannel);
        });
    });

    describe('deleteGroup', () => {
        it('Removes a group', () => {
            // Arrange
            const newId = projectFile.createGroup({ Name: 'test' });
            projectFile.deleteGroup(newId);

            // Act
            const rtn = projectFile.getGroupIdFromName('test');

            // Assert
            expect(rtn).toBeFalsy();
        });

        it('Recursively the children of a group', () => {
            // Arrange
            const newId = projectFile.createGroup({ Name: 'test1' });
            const childId1 = projectFile.createGroup({ Name: 'testChild1', ParentId: newId });
            const childId2 = projectFile.createGroup({ Name: 'testChild2', ParentId: newId });
            projectFile.createGroup({ Name: 'testChildOfChild', ParentId: childId1 });

            projectFile.deleteGroup(newId);

            // Act
            const rtn1 = projectFile.getGroupIdFromName('testChild1');
            const rtn2 = projectFile.getGroupIdFromName('testChild2');
            const rtn3 = projectFile.getGroupIdFromName('testChildOfChild');

            // Assert
            expect(rtn1).toBeFalsy();
            expect(rtn2).toBeFalsy();
            expect(rtn3).toBeFalsy();
        });
    });

    describe('getSourceGroupNameFromID', () => {
        it('Returns undefined when SourceGroup cannot be found', () => {
            expect(projectFile.getSourceGroupNameFromID(10000)).toBeFalsy();
        });

        it('Doesnt throw when SourceGroup is found', () => {
            expect(() => projectFile.getSourceGroupNameFromID(1)).not.toThrow();
        });

        it('Finds name of a source group from a group ID', () => {
            expect(projectFile.getSourceGroupNameFromID(1)).toBe('Unused channels');
        });
    });

    describe('getControlsByViewId', () => {
        it('Is falsy when View cannot be found', () => {
            expect(projectFile.getControlsByViewId(1)).toBeFalsy();
        });

        it('Is truthy when View is found', () => {
            expect(projectFile.getControlsByViewId(1000)).toBeTruthy();
        });

        it('Finds controls by view ID', () => {
            const controls = projectFile.getControlsByViewId(1000);
            expect(controls!.length).toBeGreaterThan(0);
        });
    });

    describe('getControlsByJoinedId', () => {
        it('Returns falsey if JoinedId cannot be found', () => {
            expect(projectFile.getControlsByJoinedId(10000)).toBeFalsy();
        });

        it('Returns object when JoinedId is found', () => {
            expect(projectFile.getControlsByJoinedId(1)).toBeInstanceOf(Object);
        });

        it('Finds controls by JoinedId', () => {
            const controls = projectFile.getControlsByJoinedId(1);
            expect(controls!.length).toBeGreaterThan(0);
        });
    });

    describe('getSourceGroupIDFromName', () => {
        it('Returns falsy when SourceGroup cannot be found', () => {
            expect(projectFile.getSourceGroupIDFromName('test')).toBeFalsy()
        });

        it('Doesnt throw when SourceGroup is found', () => {
            expect(() => projectFile.getSourceGroupIDFromName('Unused channels')).not.toThrow();
        });

        it('Finds ID of a source group from a source group name', () => {
            expect(projectFile.getSourceGroupIDFromName('Unused channels')).toBe(1);
        });
    });

    describe('getHighestJoinedID', () => {
        it('Finds the highest control ID', () => {
            expect(projectFile.getHighestJoinedID()).toBeGreaterThan(0);
        });
    });

    describe('getHighestGroupID', () => {
        it('Finds the highest group ID', () => {
            expect(projectFile.getHighestGroupID()).toBeGreaterThan(0);
        });
    });

    describe('getAllRemoteViews', () => {
        it('Finds all remote views', () => {
            expect(projectFile.getAllRemoteViews()!.length).toBeGreaterThan(0);
        });
    });

    describe('getAllControls', () => {
        it('Finds all controls', () => {
            expect(projectFile.getAllControls()!.length).toBeGreaterThan(0);
        });
    });

    describe('getCanIdFromDeviceId', () => {
        it('Finds the CAN ID from a device ID', () => {
            expect(projectFile.getCanIdFromDeviceId(1)).toBeTruthy();
        })
    });



    describe('insertControl', () => {
        let projectFile: ProjectFile;
        let control: Control;
        let loadedControl: Control;
        let fileId: number;
        let prevHighestJoinedId: number;
        let newHighestJoinedId: number;

        const JoinedId = 7777;

        beforeAll(async () => {
            fileId = setupTest();
            projectFile = await ProjectFile.build(PROJECT_INIT + fileId);
            prevHighestJoinedId = projectFile.getHighestJoinedID()!;
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

            newHighestJoinedId = projectFile.getHighestJoinedID()!;

            loadedControl = projectFile.getControlsByJoinedId(JoinedId)![0]
        });

        afterAll(() => {
            projectFile.close();
            cleanupTest(fileId);
        });

        it('should insert a control into the project file', () => {
            expect(loadedControl).toBeTruthy();
        });

        it('should increment global joinedid', () => {
            expect(projectFile.getHighestJoinedID()).toBe(JoinedId);
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
            // it('Constructor throws with non-existing file', () => {
            //     expect(async () => await TemplateFile.build(PROJECT_NO_EXIST)).toThrow('File does not exist');
            // });

            it('Constructor doesnt throw with existing file', () => {
                expect(async () => await TemplateFile.build(TEMPLATES + fileId)).not.toThrow();
            });
        });

        describe('getTemplateControlsByName', () => {
            it('Throws when template cannot be found', async () => {
                const templates = await TemplateFile.build(TEMPLATES + fileId);

                expect(() => templates.getTemplateControlsByName('test')).toThrow();
            });

            it('Finds template controls from a given name', async () => {
                const templates = await TemplateFile.build(TEMPLATES + fileId);

                expect(templates.getTemplateControlsByName('Main Title')).toBeTruthy();
            });
        });
    });
});
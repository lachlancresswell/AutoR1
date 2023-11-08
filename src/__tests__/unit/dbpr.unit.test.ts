import { SqlDbFile, ProjectFile, TemplateFile, Control, TargetPropertyType, MASTER_GROUP_ID, TargetChannels, R1GroupsType } from '../../dbpr';
import { existsSync } from 'fs';
import * as Database from 'better-sqlite3';

jest.mock('fs');
jest.mock('better-sqlite3');

describe('SqlDbFile', () => {
    const testDbPath = './test.db';

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('constructor', () => {
        it('should throw an error if the file does not exist', () => {
            expect(() => new SqlDbFile('./nonexistent.db')).toThrowError('File does not exist.');
        });

        it('should create a new database connection', () => {
            (existsSync as jest.Mock).mockReturnValue(true);
            const dbFile = new SqlDbFile(testDbPath);
            expect(dbFile.db).toBeInstanceOf(Database);
        });
    });

    describe('close', () => {
        it('should close the database connection', () => {
            (existsSync as jest.Mock).mockReturnValue(true);
            const dbFile = new SqlDbFile(testDbPath);
            dbFile.close();
            expect(Database.prototype.close).toHaveBeenCalled();
        });
    });
});


describe('ProjectFile', () => {
    let databaseObject: any;
    let prepare: jest.Mock;
    let run: jest.Mock;
    const GroupId = 1;
    const Name = 'test';
    const ViewId = 1;

    beforeEach(() => {
        jest.resetAllMocks();

        (existsSync as jest.Mock).mockReturnValue(true);
        run = jest.fn();
        prepare = jest.fn(() => {
            return {
                get: jest.fn(() => databaseObject),
                all: jest.fn(() => databaseObject),
                run
            }
        });

        (Database as any).mockImplementationOnce(() => {
            return {
                prepare
            }
        })
    });

    describe('constructor', () => {

        it('should throw an error if the project file does not exist', () => {
            jest.resetAllMocks();
            expect(() => new ProjectFile('test.db')).toThrowError('File does not exist');
        });

        it('it should not throw for an unintialised project', () => {
            (existsSync as jest.Mock).mockReturnValue(true);
            expect(() => new ProjectFile('test.db')).toThrow('Project file is not initialised');
        });

        it('should not throw an error if the project file is initialised', () => {
            databaseObject = { GROUP_ID: GroupId };
            expect(() => {
                new ProjectFile('test.db');
            }).not.toThrow();
        });
    });

    describe('deleteGroup', () => {
        it('should call to database for deletion', () => {
            databaseObject = [];
            const projectFile = new ProjectFile('test.db');
            projectFile.deleteGroup(GroupId);
            expect(prepare).toHaveBeenCalledWith('DELETE FROM Groups WHERE GroupId = ?');
        });

        it('should throw if group is not found', () => {
            databaseObject = { GROUP_ID: GroupId };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;
            expect(() => projectFile.deleteGroup(GroupId)).toThrow(`Could not find any groups with ParentID `);
        });
    });

    describe('createGroup', () => {
        it('should call to database for group creation', () => {
            // Arrange
            databaseObject = [];
            const projectFile = new ProjectFile('test.db');
            const groupObj = {
                Name: 'test',
                ParentId: 1,
                TargetId: 1,
                TargetChannel: TargetChannels.CHANNEL_A,
                Type: 1,
                Flags: 1
            };
            prepare.mockClear();

            // Act
            projectFile.createGroup(groupObj);

            // Assert
            expect(prepare).toHaveBeenCalledTimes(3);
        });

        it('should create group with passed parameters', () => {
            // Arrange
            databaseObject = [];
            const projectFile = new ProjectFile('test.db');
            const groupObj = {
                Name: 'test',
                ParentId: 1,
                TargetId: 2,
                TargetChannel: TargetChannels.CHANNEL_A,
                Type: 4,
                Flags: 5
            };
            run.mockClear();

            // Act
            projectFile.createGroup(groupObj);

            // Assert
            expect(run).toHaveBeenNthCalledWith(1, groupObj.Name, groupObj.ParentId, groupObj.TargetId, groupObj.TargetChannel, groupObj.Type, groupObj.Flags);
        });

        it('should set default values for optional parameters', () => {
            // Arrange
            databaseObject = [];
            const projectFile = new ProjectFile('test.db');
            const groupObj = { Name: 'test' };
            run.mockClear();

            // Act
            projectFile.createGroup(groupObj);

            // Assert
            expect(run).toHaveBeenNthCalledWith(1, groupObj.Name, MASTER_GROUP_ID, 0, TargetChannels.NONE, R1GroupsType.GROUP, 0);
        });
    });

    describe('addChannelToGroup', () => {
        it('should call to database for channel insertion', () => {
            // Arrange
            databaseObject = [];
            const projectFile = new ProjectFile('test.db');
            const groupObj = {
                Name: 'test',
                ParentId: 1,
                TargetId: 1,
                TargetChannel: TargetChannels.CHANNEL_A,
            };
            prepare.mockClear();

            // Act
            projectFile.addChannelToGroup(groupObj);

            // Assert
            expect(prepare).toHaveBeenCalledTimes(3);
        });

        it('should insert channel with passed parameters', () => {
            // Arrange
            databaseObject = [];
            const projectFile = new ProjectFile('test.db');
            const groupObj = {
                Name: 'test',
                ParentId: 1,
                TargetId: 2,
                TargetChannel: TargetChannels.CHANNEL_A,
            };
            run.mockClear();

            // Act
            projectFile.addChannelToGroup(groupObj);

            // Assert
            expect(run).toHaveBeenNthCalledWith(1, groupObj.Name, groupObj.ParentId, groupObj.TargetId, groupObj.TargetChannel, R1GroupsType.DEVICE, 0);
        });

        it('should set default values for optional parameters', () => {
            // Arrange
            databaseObject = [];
            const projectFile = new ProjectFile('test.db');
            const groupObj = {
                Name: 'test',
                ParentId: 1,
                TargetId: 2,
                TargetChannel: TargetChannels.CHANNEL_A,
            };
            run.mockClear();

            // Act
            projectFile.addChannelToGroup(groupObj);

            // Assert
            expect(run).toHaveBeenNthCalledWith(1,
                groupObj.Name,
                groupObj.ParentId,
                groupObj.TargetId,
                groupObj.TargetChannel,
                R1GroupsType.DEVICE,
                0);
        });
    });


    describe('getMasterGroupID', () => {
        it('should return the master group id', () => {
            databaseObject = { GroupId };
            const projectFile = new ProjectFile('test.db');
            expect(projectFile.getMasterGroupID()).toBe(GroupId);
        });

        it('should throw if master group is not found', () => {
            databaseObject = { GroupId: 1 };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;
            expect(() => projectFile.getMasterGroupID()).toThrow('Cannot find Master group');
        });
    });


    describe('getSourceGroupNameFromID', () => {
        it('should return the master group id', () => {
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            expect(projectFile.getSourceGroupNameFromID(GroupId)).toBe(Name);
        });

        it('should throw if master group is not found', () => {
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;
            expect(() => projectFile.getSourceGroupNameFromID(GroupId)).toThrow(`Could not find SourceGroup with id ${GroupId}`);
        });
    });


    describe('getControlsByViewId', () => {
        it('should return the master group id', () => {
            databaseObject = [{ Name }];
            const projectFile = new ProjectFile('test.db');
            expect(projectFile.getControlsByViewId(GroupId)).toBe(databaseObject);
        });

        it('should throw if master group is not found', () => {
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;
            expect(() => projectFile.getControlsByViewId(GroupId)).toThrow(`Could not find any controls with viewId ${GroupId}`);
        });
    });

    describe('getSourceGroupIDFromName', () => {
        it('should return the master group id', () => {
            const SourceGroupId = 1
            databaseObject = { SourceGroupId };
            const projectFile = new ProjectFile('test.db');
            expect(projectFile.getSourceGroupIDFromName(Name)).toBe(SourceGroupId);
        });

        it('should throw if master group is not found', () => {
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;
            expect(() => projectFile.getSourceGroupIDFromName(Name)).toThrow(`Could not find SourceGroup with name ${Name}`);
        });
    });

    describe('getHighestJoinedID', () => {
        it('should return the master group id', () => {
            const JoinedId = 1
            databaseObject = { JoinedId };
            const projectFile = new ProjectFile('test.db');
            expect(projectFile.getHighestJoinedID()).toBe(JoinedId);
        });

        it('should throw if master group is not found', () => {
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;
            expect(() => projectFile.getHighestJoinedID()).toThrow(`Views have not been generated. Please run initial setup in R1 first.`);
        });
    });

    describe('getHighestGroupID', () => {
        it('should return the master group id', () => {
            databaseObject = { 'max(GroupId)': GroupId };
            const projectFile = new ProjectFile('test.db');
            expect(projectFile.getHighestGroupID()).toBe(GroupId);
        });

        it('should throw if master group is not found', () => {
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;
            expect(() => projectFile.getHighestGroupID()).toThrow(`Could not find any groups.`);
        });
    });

    describe('getGroupIdFromName', () => {
        it('should return the master group id', () => {
            databaseObject = { GroupId };
            const projectFile = new ProjectFile('test.db');
            expect(projectFile.getGroupIdFromName(Name)).toBe(GroupId);
        });

        it('should throw if master group is not found', () => {
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;
            expect(() => projectFile.getGroupIdFromName(Name)).toThrow(`Could not find group with name ${Name}`);
        });
    });

    describe('getViewIdFromName', () => {
        it('should return the master group id', () => {
            databaseObject = { ViewId };
            const projectFile = new ProjectFile('test.db');
            expect(projectFile.getViewIdFromName(Name)).toBe(ViewId);
        });

        it('should throw if master group is not found', () => {
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;
            expect(() => projectFile.getViewIdFromName(Name)).toThrow(`Could not find view with name ${Name}`);
        });
    });

    describe('getAllViews', () => {
        it('should return the master group id', () => {
            databaseObject = { ViewId };
            const projectFile = new ProjectFile('test.db');
            expect(projectFile.getAllRemoteViews()).toBe(databaseObject);
        });

        it('should throw if master group is not found', () => {
            databaseObject = { test: 'test' };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;
            expect(() => projectFile.getAllRemoteViews()).toThrow(`Could not find any views`);
        });
    });

    describe('getAllGroups', () => {
        it('should return the master group id', () => {
            databaseObject = { ViewId };
            const projectFile = new ProjectFile('test.db');
            expect(projectFile.getAllGroups()).toBe(databaseObject);
        });

        it('should throw if master group is not found', () => {
            databaseObject = { test: 'test' };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;
            expect(() => projectFile.getAllGroups()).toThrow(`Could not find any groups`);
        });
    });

    describe('getAllControls', () => {
        it('should return the master group id', () => {
            databaseObject = { ViewId };
            const projectFile = new ProjectFile('test.db');
            expect(projectFile.getAllControls()).toBe(databaseObject);
        });

        it('should throw if no controls are found', () => {
            databaseObject = { ViewId };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;
            expect(() => projectFile.getAllControls()).toThrow(`Could not find any controls`);
        });
    });

    describe('insertControl', () => {
        it('should insert a control into the project', () => {
            databaseObject = { ViewId };
            const control: Control = {
                ControlId: 1727,
                Type: 4,
                PosX: 253,
                PosY: 56,
                Width: 100,
                Height: 24,
                ViewId: 1024,
                DisplayName: "CUT",
                UniqueName: null,
                JoinedId: 4,
                LimitMin: 0.0,
                LimitMax: 1.0,
                MainColor: 1,
                SubColor: 1,
                LabelColor: 0,
                LabelFont: 5,
                LabelAlignment: 64,
                LineThickness: 0,
                ThresholdValue: 0.0,
                Flags: 262,
                ActionType: 1,
                TargetType: 0,
                TargetId: 306,
                TargetChannel: -1,
                TargetProperty: TargetPropertyType.CONFIG_FILTER1,
                TargetRecord: 0,
                ConfirmOnMsg: null,
                ConfirmOffMsg: null,
                PictureIdDay: 0,
                PictureIdNight: 0,
                Font: "Arial,12,-1,5,50,0,0,0,0,0",
                Alignment: 132,
                Dimension: null
            };
            const projectFile = new ProjectFile('test.db');
            projectFile.insertControl(control);
            expect(prepare).toHaveBeenCalledTimes(2);
        })
    });
});

describe('TemplateFile', () => {
    let databaseObject: any;
    let templates: { JoinedId: number; }[] | undefined;

    beforeEach(() => {
        jest.resetAllMocks();

        (existsSync as jest.Mock).mockReturnValue(true);

        (Database as any).mockImplementationOnce(() => {
            return {
                prepare: jest.fn().mockImplementation(() => {
                    return {
                        all: jest.fn().mockReturnValue(templates),
                        get: jest.fn().mockReturnValue(templates)
                    }
                })
            }
        })
    });


    describe('constructor', () => {
        it('should log the number of templates found in the file', () => {
            templates = [{ JoinedId: 1 }, { JoinedId: 2 }, { JoinedId: 3 }];
            const logSpy = jest.spyOn(console, 'log').mockImplementation();
            new TemplateFile('test.db')
            expect(logSpy).toHaveBeenCalledWith('Found 3 templates in file.');
            logSpy.mockRestore();
        });

        it('should throw an error if no templates are found in the file', () => {
            templates = undefined;
            jest.spyOn(console, 'log').mockImplementation();
            expect(() => new TemplateFile('test.db')).toThrowError('Could not find any templates in file.');
        });
    });

    describe('getTemplateControlsByName', () => {
        it('should return an array of controls for a valid template name', () => {
            databaseObject = [{ ControlId: 1 }];
            templates = [{ JoinedId: 1 }, { JoinedId: 2 }, { JoinedId: 3 }];
            const templateFile = new TemplateFile('path/to/template.dbpr');
            const controls = templateFile.getTemplateControlsByName('MyTemplate');
            expect(Array.isArray(controls)).toBe(true);
            expect(controls.length).toBeGreaterThan(0);
        });

        it('should throw an error for an invalid template name', () => {
            databaseObject = [{ ControlId: 1 }];
            templates = [{ JoinedId: 1 }, { JoinedId: 2 }, { JoinedId: 3 }];
            const templateFile = new TemplateFile('path/to/template.dbpr');
            databaseObject = undefined;
            templates = undefined;
            expect(() => templateFile.getTemplateControlsByName('InvalidTemplate')).toThrowError('Template InvalidTemplate not found.');
        });
    });
});
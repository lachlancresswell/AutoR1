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
            // Arrange
            const p = './nonexistent.db';

            // Assert
            expect(() => new SqlDbFile(p)).toThrowError('File does not exist - ' + p);
        });

        it('should create a new database connection', () => {
            // Arrange
            (existsSync as jest.Mock).mockReturnValue(true);

            // Act
            const dbFile = new SqlDbFile(testDbPath);

            // Assert
            expect(dbFile.db).toBeInstanceOf(Database);
        });
    });

    describe('close', () => {
        it('should close the database connection', () => {
            // Arrange
            (existsSync as jest.Mock).mockReturnValue(true);

            // Act
            const dbFile = new SqlDbFile(testDbPath);
            dbFile.close();

            // Assert
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
            // Arrange
            jest.resetAllMocks();

            // Assert
            expect(() => new ProjectFile('test.db')).toThrowError('File does not exist');
        });

        it('it should not throw for an unintialised project', () => {
            // Arrange
            (existsSync as jest.Mock).mockReturnValue(true);

            // Assert
            expect(() => new ProjectFile('test.db')).toThrow('Project file is not initialised');
        });

        it('should not throw an error if the project file is initialised', () => {
            // Arrange
            databaseObject = { GROUP_ID: GroupId };

            // Assert
            expect(() => {
                new ProjectFile('test.db');
            }).not.toThrow();
        });
    });

    describe('deleteGroup', () => {
        it('should call to database for deletion', () => {
            // Arrange
            const projectFile = new ProjectFile('test.db');

            // Act
            projectFile.deleteGroup(GroupId);

            // Assert
            expect(prepare).toHaveBeenCalledWith('DELETE FROM Groups WHERE GroupId = ?');
        });

        it('should be called for each child group found', () => {
            // Arrange
            (Database as any).mockReset();

            /**
             * PARENT
             * - CHILD
             *  - CHILD
             * - CHILD
             */
            const groups = [{
                GroupId: 1,
                children: [{
                    GroupId: 2,
                    children: [{
                        GroupId: 4,
                        children: []
                    }]
                }, {
                    GroupId: 3,
                    children: []
                }]
            }]

            // Mock recursive from deleteGroup
            const prepare = jest.fn().mockReturnValue(({
                all: jest.fn()
                    .mockImplementationOnce(() => groups)
                    .mockImplementationOnce(() => groups[0].children)
                    .mockImplementationOnce(() => groups[0].children[0].children)
                    .mockImplementationOnce(() => groups[0].children[0].children[0].children)
                    .mockImplementationOnce(() => groups[0].children[1].children),
                run: jest.fn(),
                get: jest.fn().mockReturnValue({ GROUP_ID: GroupId })
            }));

            (Database as any).mockImplementation(() => {
                return {
                    prepare
                }
            });

            const projectFile = new ProjectFile('test.db');

            // Act
            projectFile.deleteGroup(GroupId);


            // Assert
            expect(prepare().all).toHaveBeenCalledTimes(5);
        })
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
            expect(run).toHaveBeenCalledTimes(1); // 1 insertion
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
            expect(run).toHaveBeenCalledTimes(1); // 1 insertion for 1 channel
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
            // Arrange
            databaseObject = { GroupId };

            // Act
            const projectFile = new ProjectFile('test.db');

            // Assert
            expect(projectFile.getMasterGroupID()).toBe(GroupId);
        });

        it('should throw if master group is not found', () => {
            // Arrange
            databaseObject = { GroupId: 1 };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;

            // Assert
            expect(() => projectFile.getMasterGroupID()).toThrow('Cannot find Master group');
        });
    });


    describe('getSourceGroupNameFromID', () => {
        it('should return the master group id', () => {
            // Arrange
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');

            // Act
            const rtn = projectFile.getSourceGroupNameFromID(GroupId);

            // Assert
            expect(rtn).toBe(Name);
        });

        it('should throw if master group is not found', () => {
            // Arrange
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;

            // Assert
            expect(() => projectFile.getSourceGroupNameFromID(GroupId)).toThrow(`Could not find SourceGroup with id ${GroupId}`);
        });
    });


    describe('getControlsByViewId', () => {
        it('should return the master group id', () => {
            // Arrange
            databaseObject = [{ Name }];
            const projectFile = new ProjectFile('test.db');

            // Assert
            expect(projectFile.getControlsByViewId(GroupId)).toBe(databaseObject);
        });

        it('should throw if master group is not found', () => {
            // Arrange
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;

            // Assert
            expect(() => projectFile.getControlsByViewId(GroupId)).toThrow(`Could not find any controls with viewId ${GroupId}`);
        });
    });

    describe('getSourceGroupIDFromName', () => {
        it('should return the master group id', () => {
            // Arrange
            const SourceGroupId = 1
            databaseObject = { SourceGroupId };
            const projectFile = new ProjectFile('test.db');

            // Act
            const rtn = projectFile.getSourceGroupIDFromName(Name);

            // Assert
            expect(rtn).toBe(SourceGroupId);
        });

        it('should throw if master group is not found', () => {
            // Arrange
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;

            // Assert
            expect(() => projectFile.getSourceGroupIDFromName(Name)).toThrow(`Could not find SourceGroup with name ${Name}`);
        });
    });

    describe('getHighestJoinedID', () => {
        it('should return the master group id', () => {
            // Arrange
            const JoinedId = 1
            databaseObject = { JoinedId };
            const projectFile = new ProjectFile('test.db');

            // Act
            const rtn = projectFile.getHighestJoinedID();

            // Assert
            expect(rtn).toBe(JoinedId);
        });

        it('should throw if master group is not found', () => {
            // Arrange
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;

            // Assert
            expect(() => projectFile.getHighestJoinedID()).toThrow(`Views have not been generated. Please run initial setup in R1 first.`);
        });
    });

    describe('getHighestGroupID', () => {
        it('should return the master group id', () => {
            // Arrange
            databaseObject = { 'max(GroupId)': GroupId };
            const projectFile = new ProjectFile('test.db');

            // Act
            const rtn = projectFile.getHighestGroupID();
            // Assert
            expect(rtn).toBe(GroupId);
        });

        it('should throw if master group is not found', () => {
            // Arrange
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;

            // Assert
            expect(() => projectFile.getHighestGroupID()).toThrow(`Could not find any groups.`);
        });
    });

    describe('getGroupIdFromName', () => {
        it('should return the master group id', () => {
            // Arrange
            databaseObject = { GroupId };
            const projectFile = new ProjectFile('test.db');
            // Act
            const rtn = projectFile.getGroupIdFromName(Name);

            // Assert
            expect(rtn).toBe(GroupId);
        });

        it('should return undefined if master group is not found', () => {
            // Arrange
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;

            // Act
            const rtn = projectFile.getGroupIdFromName(Name);

            // Assert
            expect(rtn).toBeFalsy();
        });
    });

    describe('getViewIdFromName', () => {
        it('should return the master group id', () => {
            // Arrange
            databaseObject = { ViewId };
            const projectFile = new ProjectFile('test.db');

            // Assert
            expect(projectFile.getViewIdFromName(Name)).toBe(ViewId);
        });

        it('should return undefined if master group is not found', () => {
            // Arrange
            databaseObject = { Name };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;

            // Act
            const rtn = projectFile.getViewIdFromName(Name)

            // Assert
            expect(rtn).toBeFalsy();
        });
    });

    describe('getAllViews', () => {
        it('should return the master group id', () => {
            // Arrange
            databaseObject = { ViewId };
            const projectFile = new ProjectFile('test.db');

            // Act
            const rtn = projectFile.getAllRemoteViews();

            // Assert
            expect(rtn).toBe(databaseObject);
        });

        it('should throw if master group is not found', () => {
            // Arrange
            databaseObject = { test: 'test' };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;

            // Assert
            expect(() => projectFile.getAllRemoteViews()).toThrow(`Could not find any views`);
        });
    });

    describe('getAllGroups', () => {
        it('should return the master group id', () => {
            // Arrange
            databaseObject = { ViewId };
            const projectFile = new ProjectFile('test.db');

            // Act 
            const rtn = projectFile.getAllGroups();

            // Assert
            expect(rtn).toBe(databaseObject);
        });

        it('should throw if master group is not found', () => {
            // Arrange
            databaseObject = { test: 'test' };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;

            // Assert
            expect(() => projectFile.getAllGroups()).toThrow(`Could not find any groups`);
        });
    });

    describe('getAllControls', () => {
        it('should return the master group id', () => {
            // Arrange
            databaseObject = { ViewId };
            const projectFile = new ProjectFile('test.db');

            // Act
            const rtn = projectFile.getAllControls();

            // Assert
            expect(rtn).toBe(databaseObject);
        });

        it('should throw if no controls are found', () => {
            // Arrange
            databaseObject = { ViewId };
            const projectFile = new ProjectFile('test.db');
            databaseObject = undefined;

            // Assert
            expect(() => projectFile.getAllControls()).toThrow(`Could not find any controls`);
        });
    });

    describe('insertControl', () => {
        it('should insert a control into the project', () => {
            // Arrange
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

            // Act
            projectFile.insertControl(control);

            // Assert
            expect(run).toHaveBeenCalledTimes(1); // 1 insertion for 1 control
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
            // Arrange
            templates = [{ JoinedId: 1 }, { JoinedId: 2 }, { JoinedId: 3 }];
            const logSpy = jest.spyOn(console, 'log').mockImplementation();

            // Act
            new TemplateFile('test.db')

            // Assert
            expect(logSpy).toHaveBeenCalledWith('Found 3 templates in file.');
            logSpy.mockRestore();
        });

        it('should throw an error if no templates are found in the file', () => {
            // Arrange
            templates = undefined;
            jest.spyOn(console, 'log').mockImplementation();

            // Assert
            expect(() => new TemplateFile('test.db')).toThrowError('Could not find any templates in file.');
        });
    });

    describe('getTemplateControlsByName', () => {
        it('should return an array of controls for a valid template name', () => {
            // Arrange
            databaseObject = [{ ControlId: 1 }];
            templates = [{ JoinedId: 1 }, { JoinedId: 2 }, { JoinedId: 3 }];
            const templateFile = new TemplateFile('path/to/template.dbpr');

            // Act
            const controls = templateFile.getTemplateControlsByName('MyTemplate');

            // Assert
            expect(Array.isArray(controls)).toBe(true);
            expect(controls.length).toBeGreaterThan(0);
        });

        it('should throw an error for an invalid template name', () => {
            // Arrange
            databaseObject = [{ ControlId: 1 }];
            templates = [{ JoinedId: 1 }, { JoinedId: 2 }, { JoinedId: 3 }];
            const templateFile = new TemplateFile('path/to/template.dbpr');
            databaseObject = undefined;
            templates = undefined;

            // Assert
            expect(() => templateFile.getTemplateControlsByName('InvalidTemplate')).toThrowError('Template InvalidTemplate not found.');
        });
    });
});
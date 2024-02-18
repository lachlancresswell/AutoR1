import { Control, MASTER_GROUP_ID, ProjectFile, R1GroupsType, Section, SqlDbFile, TargetChannels, TargetPropertyType, TemplateFile, getAllAsObjects } from '../../dbpr';
import SQLjs from 'sql.js';

jest.mock('sql.js');

const get = jest.fn();
const getAsObject = jest.fn();
const bind = jest.fn();
const step = jest.fn();
const run = jest.fn();
const free = jest.fn();
let prepare: jest.Mock;
let Database: jest.Mock;

const MasterGroupId = 1;

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

beforeEach(() => {
    jest.resetAllMocks();

    prepare = jest.fn(() => ({ get, getAsObject, bind, step, free, run }));
    Database = jest.fn(() => ({ prepare }));
    (SQLjs as unknown as jest.Mock).mockReturnValue({
        Database
    });
});

describe('getAllAsObjects', () => {
    it('should return an array of objects', () => {
        // Arrange
        const stmt = prepare();
        const array = [{ test: 'test1' }, { test: 'test2' }];
        step.mockReturnValueOnce(true)
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);
        getAsObject
            .mockReturnValueOnce(array[0])
            .mockReturnValueOnce(array[1]);

        // Act
        const rtn = getAllAsObjects(stmt, []);

        // Assert
        expect(rtn).toMatchObject(array);
    });
});

describe('SqlDbFile', () => {

    describe('Constructor', () => {
        it('should assign the passed db property', () => {
            // Arrange
            const db = 'db';

            // Act
            const dbFile = new SqlDbFile(db as any);

            // Assert
            expect(dbFile.db).toMatch(db);
        });
    });

    describe('Build', () => {
        it('should create a new database connection', async () => {
            // Act
            await SqlDbFile.build(true as any);

            // Assert
            expect(Database).toHaveBeenCalled();
        });

        it('should return a new SqlDbFile instance', async () => {
            // Act
            const dbFile = await SqlDbFile.build(true as any);

            // Assert
            expect(dbFile).toBeInstanceOf(SqlDbFile);
        });
    });

    describe('close', () => {
        it('should close the database connection', () => {
            // Arrange
            const db = {
                close: jest.fn()
            }
            const sqlFile = new SqlDbFile(db as any);

            // Act
            sqlFile.close();

            // Assert
            expect(db.close).toHaveBeenCalled();
        });
    });
});

describe('ProjectFile', () => {
    let projectFile: ProjectFile;
    beforeEach(async () => {
        getAsObject.mockReturnValueOnce({ GroupId: MasterGroupId })
        projectFile = await ProjectFile.build(true as any);
    });

    describe('Build', () => {
        it('should load a project file', async () => {
            // Arrange
            getAsObject.mockReturnValueOnce({ GroupId: 1 });

            // Act
            await ProjectFile.build(true as any);

            // Assert
            expect(prepare).toHaveBeenCalled();
        });

        it('throw if the project file has not been initialised', async () => {
            // Arrange
            getAsObject.mockReturnValueOnce(undefined);

            // Assert
            await expect(() => ProjectFile.build(true as any)).rejects.toThrowError();
        });
    });

    describe('getMasterGroupID', () => {

        it('should return the master group id', async () => {
            // Arrange
            const GroupId = 1;
            getAsObject
                .mockReturnValueOnce({ GroupId })
                .mockReturnValueOnce({ GroupId });

            // Act
            const masterGroupId = projectFile.getMasterGroupID()

            // Assert
            expect(masterGroupId).toBe(GroupId);
        });

        it('should log an error if the master group is not found', async () => {
            // Arrange
            getAsObject
                .mockReturnValueOnce({ GroupId: undefined })
            const errorSpy = jest.spyOn(console, 'error');

            // Act
            projectFile.getMasterGroupID();

            // Assert
            expect(errorSpy).toHaveBeenCalled();
        });
    });

    describe('getSourceGroupNameFromID', () => {

        it('should return the source group name from the id', async () => {
            // Arrange
            const GroupId = 1;
            const Name = 'test';
            getAsObject
                .mockReturnValueOnce({ Name });

            // Act
            const sourceGroupName = projectFile.getSourceGroupNameFromID(GroupId)

            // Assert
            expect(sourceGroupName).toBe(Name);
        });

        it('should return undefined if the source group is not found', async () => {
            // Arrange
            getAsObject
                .mockReturnValueOnce({ Name: undefined });

            // Act
            const sourceGroupName = projectFile.getSourceGroupNameFromID(10);

            // Assert
            expect(sourceGroupName).toBeUndefined();
        });
    });

    describe('getSourceGroupIDFromName', () => {
        it('should return the source group ID from the name', async () => {
            // Arrange
            const SourceGroupId = 2;
            getAsObject
                .mockReturnValueOnce({ SourceGroupId });

            // Act
            const sourceGroupName = projectFile.getSourceGroupIDFromName('Name')

            // Assert
            expect(sourceGroupName).toBe(SourceGroupId);
        });

        it('should return undefined if the source group is not found', async () => {
            // Arrange
            getAsObject
                .mockReturnValueOnce({ Name: undefined });

            // Act
            const sourceGroupName = projectFile.getSourceGroupIDFromName('name');

            // Assert
            expect(sourceGroupName).toBeUndefined();
        });
    });

    describe('getHighestJoinedID', () => {
        it('should return a JoinedId', async () => {
            // Arrange
            const JoinedId = 2;
            getAsObject
                .mockReturnValueOnce({ JoinedId });

            // Act
            const highestJoinedId = projectFile.getHighestJoinedID()

            // Assert
            expect(highestJoinedId).toBe(JoinedId);
        });

        it('should return undefined if a JoinedId is not found', async () => {
            // Arrange
            const JoinedId = undefined;
            getAsObject
                .mockReturnValueOnce({ JoinedId });

            // Act
            const highestJoinedId = projectFile.getHighestJoinedID()

            // Assert
            expect(highestJoinedId).toBeUndefined();
        });
    });

    describe('getHighestGroupID', () => {
        it('should return a JoinedId', async () => {
            // Arrange
            const GroupId = 2;
            getAsObject
                .mockReturnValueOnce({ 'max(GroupId)': GroupId });

            // Act
            const highestGroupId = projectFile.getHighestGroupID()

            // Assert
            expect(highestGroupId).toBe(GroupId);
        });

        it('should return undefined if a JoinedId is not found', async () => {
            // Arrange
            const GroupId = undefined;
            getAsObject
                .mockReturnValueOnce({ JoinedId: GroupId });

            // Act
            const highestGroupId = projectFile.getHighestGroupID()

            // Assert
            expect(highestGroupId).toBeUndefined();
        });
    });

    describe('getGroupIdFromName', () => {
        it('should return a GroupId', async () => {
            // Arrange
            const groupIds = [2, 3, 4];
            get.mockReturnValueOnce(groupIds);

            // Act
            const groupId = projectFile.getGroupIdFromName('name')

            // Assert
            expect(groupId).toBe(groupIds[0]);
        });

        it('should return undefined if a GroupId is not found', async () => {
            // Arrange
            const groupIds = undefined;
            get.mockReturnValueOnce(groupIds);

            // Act
            const groupId = projectFile.getGroupIdFromName('name')

            // Assert
            expect(groupId).toBeUndefined();
        });
    });

    describe('getViewIdFromName', () => {
        it('should return a ViewId', async () => {
            // Arrange
            const ViewId = 3;
            getAsObject
                .mockReturnValueOnce({ ViewId });

            // Act
            const viewId = projectFile.getViewIdFromName('name')

            // Assert
            expect(viewId).toBe(ViewId);
        });

        it('should return undefined if a ViewId is not found', async () => {
            // Arrange
            const ViewId = undefined;
            getAsObject
                .mockReturnValueOnce({ ViewId });

            // Act
            const viewId = projectFile.getViewIdFromName('name')

            // Assert
            expect(viewId).toBeUndefined();
        });
    });

    describe('getCanIdFromDeviceId', () => {
        it('should return a CanId with a prepended 0', async () => {
            // Arrange
            const RemoteIdSubnet = 3;
            const RemoteIdDevice = 4;
            getAsObject
                .mockReturnValueOnce({ RemoteIdSubnet, RemoteIdDevice });

            // Act
            const canId = projectFile.getCanIdFromDeviceId(1)

            // Assert
            expect(canId).toBe(`${RemoteIdSubnet}.0${RemoteIdDevice}`);
        });

        it('should return a CanId without a prepended 0', async () => {
            // Arrange
            const RemoteIdSubnet = 3;
            const RemoteIdDevice = 10;
            getAsObject
                .mockReturnValueOnce({ RemoteIdSubnet, RemoteIdDevice });

            // Act
            const canId = projectFile.getCanIdFromDeviceId(1)

            // Assert
            expect(canId).toBe(`${RemoteIdSubnet}.${RemoteIdDevice}`);
        });

        it('should return undefined if a ViewId is not found', async () => {
            // Arrange
            const RemoteIdSubnet = undefined;
            const RemoteIdDevice = undefined;
            getAsObject
                .mockReturnValueOnce({ RemoteIdSubnet, RemoteIdDevice });

            // Act
            const canId = projectFile.getCanIdFromDeviceId(1)

            // Assert
            expect(canId).toBeUndefined();
        });
    });

    describe('getControlsByViewId', () => {
        it('should return an array of controls', async () => {
            // Arrange
            const array = [{ control: 'test1' }, { control: 'test2' }];
            step.mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);
            getAsObject
                .mockReturnValueOnce(array[0])
                .mockReturnValueOnce(array[1]);

            // Act
            const controls = projectFile.getControlsByViewId(1)

            // Assert
            expect(controls).toStrictEqual(array);
        });

        it('should return undefined if a there arent any controls found', async () => {
            // Arrange
            step.mockReturnValueOnce(false);

            // Act
            const controls = projectFile.getControlsByViewId(1)

            // Assert
            expect(controls).toBeUndefined();
        });
    });

    describe('getControlsByJoinedId', () => {
        it('should return an array of controls', async () => {
            // Arrange
            const array = [{ control: 'test1' }, { control: 'test2' }];
            step.mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);
            getAsObject
                .mockReturnValueOnce(array[0])
                .mockReturnValueOnce(array[1]);

            // Act
            const controls = projectFile.getControlsByJoinedId(1)

            // Assert
            expect(controls).toStrictEqual(array);
        });

        it('should return undefined if there arent any controls found', async () => {
            // Arrange
            step.mockReturnValueOnce(false);

            // Act
            const controls = projectFile.getControlsByJoinedId(1)

            // Assert
            expect(controls).toBeUndefined();
        });
    });

    describe('getAllRemoteViews', () => {
        it('should return an array of views', async () => {
            // Arrange
            const array = [{ view: 'test1' }, { view: 'test2' }];
            step.mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);
            getAsObject
                .mockReturnValueOnce(array[0])
                .mockReturnValueOnce(array[1]);

            // Act
            const views = projectFile.getAllRemoteViews()

            // Assert
            expect(views).toStrictEqual(array);
        });

        it('should return undefined if there arent any views found', async () => {
            // Arrange
            step.mockReturnValueOnce(false);

            // Act
            const views = projectFile.getAllRemoteViews()

            // Assert
            expect(views).toBeUndefined();
        });
    });

    describe('getAllGroups', () => {
        it('should return an array of groups', async () => {
            // Arrange
            const array = [{ group: 'test1' }, { group: 'test2' }];
            step.mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);
            getAsObject
                .mockReturnValueOnce(array[0])
                .mockReturnValueOnce(array[1]);

            // Act
            const groups = projectFile.getAllGroups()

            // Assert
            expect(groups).toStrictEqual(array);
        });

        it('should return undefined if there arent any groups found', async () => {
            // Arrange
            step.mockReturnValueOnce(false);

            // Act
            const groups = projectFile.getAllGroups()

            // Assert
            expect(groups).toBeUndefined();
        });
    });

    describe('getAllControls', () => {
        it('should return an array of controls', async () => {
            // Arrange
            const array = [{ control: 'test1' }, { control: 'test2' }];
            step.mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);
            getAsObject
                .mockReturnValueOnce(array[0])
                .mockReturnValueOnce(array[1]);

            // Act
            const controls = projectFile.getAllControls()

            // Assert
            expect(controls).toStrictEqual(array);
        });

        it('should return undefined if there arent any groups found', async () => {
            // Arrange
            step.mockReturnValueOnce(false);

            // Act
            const controls = projectFile.getAllControls()

            // Assert
            expect(controls).toBeUndefined();
        });
    });

    describe('createGroup', () => {
        // it('should call to database for channel insertion', async () => {
        it('should return the new GroupId', async () => {
            // Arrange
            const GroupId = 1;
            const groupObj = {
                Name: 'test',
                ParentId: 1,
                TargetId: 1,
                TargetChannel: 1,
            };
            getAsObject.mockReturnValueOnce({ GroupId });

            // Act
            const newGroupId = projectFile.createGroup(groupObj);

            // Assert
            expect(newGroupId).toBe(GroupId);
            // expect(bind).toHaveBeenCalledWith(groupObj.Name, groupObj.ParentId, groupObj.TargetId, groupObj.TargetChannel, 1, 0);
        });

        it('should insert group into database with specified options', async () => {
            // Arrange
            const GroupId = 1;
            const Name = 'test';
            const ParentId = 2;
            const TargetId = 3;
            const TargetChannel = 4;
            const Type = 5;
            const Flags = 6;


            const groupObj = {
                Name,
                ParentId,
                TargetId,
                TargetChannel,
                Type,
                Flags
            };
            getAsObject.mockReturnValueOnce({ GroupId });

            // Act
            projectFile.createGroup(groupObj);

            // Assert
            expect(run).toHaveBeenCalledWith([Name, ParentId, TargetId, TargetChannel, Type, Flags]);
        });

        it('should insert group into database with default options', async () => {
            // Arrange
            const GroupId = 1;
            const Name = 'test';

            const groupObj = {
                Name
            };
            getAsObject.mockReturnValueOnce({ GroupId });

            // Act
            projectFile.createGroup(groupObj);

            // Assert
            expect(run).toHaveBeenCalledWith([Name, MASTER_GROUP_ID, 0, TargetChannels.NONE, R1GroupsType.GROUP, 0]);
        });

        it('should throw if the group is not found after insertion', async () => {
            // Arrange
            const GroupId = undefined;
            const Name = 'test';

            const groupObj = {
                Name
            };
            getAsObject.mockReturnValueOnce({ GroupId });

            // Assert
            expect(() => projectFile.createGroup(groupObj)).toThrowError();
        });
    });

    describe('addChannelToGroup', () => {
        it('should return the new GroupId', async () => {
            // Arrange
            const GroupId = 1;
            const groupObj = {
                Name: 'test',
                ParentId: 2,
                TargetId: 3,
                TargetChannel: 4,
                Flags: 5,
            };
            getAsObject.mockReturnValueOnce({ GroupId });

            // Act
            const newGroupId = projectFile.addChannelToGroup(groupObj);

            // Assert
            expect(newGroupId).toBe(GroupId);
        });

        it('should insert group into database with specified options', async () => {
            // Arrange
            const GroupId = 1;
            const Name = 'test';
            const ParentId = 2;
            const TargetId = 3;
            const TargetChannel = 4;
            const Flags = 6;


            const groupObj = {
                Name,
                ParentId,
                TargetId,
                TargetChannel,
                Flags
            };
            getAsObject.mockReturnValueOnce({ GroupId });

            // Act
            projectFile.addChannelToGroup(groupObj);

            // Assert
            expect(run).toHaveBeenCalledWith([Name, ParentId, TargetId, TargetChannel, R1GroupsType.DEVICE, Flags]);
        });

        it('should insert group into database with default options', async () => {
            // Arrange
            const GroupId = 1;
            const Name = 'test';
            const ParentId = 2;
            const TargetId = 3;
            const TargetChannel = 4;
            const Flags = 0;

            const groupObj = {
                Name,
                ParentId,
                TargetId,
                TargetChannel,
            };
            getAsObject.mockReturnValueOnce({ GroupId });

            // Act
            projectFile.addChannelToGroup(groupObj);

            // Assert
            expect(run).toHaveBeenCalledWith([Name, ParentId, TargetId, TargetChannel, R1GroupsType.DEVICE, Flags]);
        });
    });

    describe('deleteGroup', () => {
        it('should call to database for deletion', async () => {
            // Arrange
            const GroupId = 1;

            // Act
            projectFile.deleteGroup(GroupId);

            // Assert
            expect(run).toHaveBeenCalledWith([GroupId]);
        });

        it('should be called for each child group found', async () => {
            // Arrange
            const group5 = { GroupId: 5 };
            const group4 = {
                GroupId: 4,
                children: [group5]
            };
            const group3 = { GroupId: 3 };
            const group2 = {
                GroupId: 2,
                children: [group3, group4]
            };
            const group1 = {
                GroupId: 1,
                children: [group2]
            };

            // Mock recursive from deleteGroup
            step.mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(false);
            getAsObject
                .mockImplementationOnce(() => group1)
                .mockImplementationOnce(() => group1.children[0])
                .mockImplementationOnce(() => group1.children[0].children[0]) // group 2
                .mockImplementationOnce(() => group1.children[0].children[0]) // group 3
                .mockImplementationOnce(() => group1.children[0].children[1]) // group 4
                .mockImplementationOnce(() => []) // group 5
            run.mockReset();

            // Act
            projectFile.deleteGroup(group1.GroupId);

            // Assert
            // Once for each group
            expect(run).toHaveBeenCalledTimes(5);
        });
    });

    describe('insertControl', () => {
        it('should insert a new control', async () => {
            // Act
            projectFile.insertControl(control);

            // Assert
            expect(run).toHaveBeenCalledTimes(1);
        });

        it('should set Dimension to an empty string if it is null', async () => {
            // Act
            projectFile.insertControl(control);

            // Assert
            expect(run).toHaveBeenCalledWith([
                control.Type,
                control.PosX,
                control.PosY,
                control.Width,
                control.Height,
                control.ViewId,
                control.DisplayName,
                control.UniqueName,
                control.JoinedId,
                control.LimitMin,
                control.LimitMax,
                control.MainColor,
                control.SubColor,
                control.LabelColor,
                control.LabelFont,
                control.LabelAlignment,
                control.LineThickness,
                control.ThresholdValue,
                control.Flags,
                control.ActionType,
                control.TargetType,
                control.TargetId,
                control.TargetChannel,
                control.TargetProperty,
                control.TargetRecord,
                control.ConfirmOnMsg,
                control.ConfirmOffMsg,
                control.PictureIdDay,
                control.PictureIdNight,
                control.Font,
                control.Alignment,
                ' '
            ]);
        });
    });
});

describe('TemplateFile', () => {
    beforeEach(async () => {
        // getAsObject.mockReturnValueOnce({ GroupId: MasterGroupId })
    });

    describe('Build', () => {
        it('should load a template file with a template', async () => {
            // Arrange
            get.mockReturnValueOnce({ template: 1 });

            // Act
            await TemplateFile.build(true as any);

            // Assert
            expect(prepare).toHaveBeenCalled();
        });

        it('throws if there arent any templates in the file', async () => {
            // Arrange
            get.mockReturnValueOnce(undefined);

            // Assert
            await expect(() => TemplateFile.build(true as any)).rejects.toThrowError();
        });
    });

    describe('getTemplateControlsByName', () => {
        it('should get an array of controls from a template name', async () => {
            // Arrange
            const section: Section = {
                Id: 1,
                Name: 'template',
                ParentId: 2,
                JoinedId: 3,
                Description: 'Description'
            };

            get.mockReturnValueOnce({ template: 1 });
            const templateFile = await TemplateFile.build(true as any);
            getAsObject.mockReturnValueOnce(section);
            run.mockReturnValueOnce([control]);

            // Act
            const controls = templateFile.getTemplateControlsByName('template');

            // Assert
            expect(controls).toStrictEqual([control]);
        });

        it('should return undefined if a template isnt found', async () => {
            // Arrange
            const section = undefined;

            get.mockReturnValueOnce({ template: 1 });
            const templateFile = await TemplateFile.build(true as any);
            getAsObject.mockReturnValueOnce(section);

            // Act
            const controls = templateFile.getTemplateControlsByName('template');

            // Assert
            expect(controls).toBeUndefined();
        });
    });
});
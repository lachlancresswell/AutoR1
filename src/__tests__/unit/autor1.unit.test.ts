/* eslint-disable */
import { ChannelGroup, SourceGroup, AutoR1ProjectFile, Channel } from '../../autor1';
import * as DBPR from '../../dbpr';
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

beforeEach(() => {
    jest.resetAllMocks();

    prepare = jest.fn(() => ({ get, getAsObject, bind, step, free, run }));
    Database = jest.fn(() => ({ prepare }));
    (SQLjs as unknown as jest.Mock).mockReturnValue({
        Database
    });
});

const CONTROL = {
    ControlId: 1,
    Type: DBPR.ControlTypes.METER,
    PosX: 1,
    PosY: 1,
    Width: 1,
    Height: 1,
    ViewId: 1,
    DisplayName: null,
    UniqueName: null,
    JoinedId: 1,
    LimitMin: 1,
    LimitMax: 1,
    MainColor: 1,
    SubColor: 1,
    LabelColor: 1,
    LabelFont: 1,
    LabelAlignment: 1,
    LineThickness: 1,
    ThresholdValue: 1,
    Flags: 1,
    ActionType: 1,
    TargetType: DBPR.TargetTypes.CHANNEL,
    TargetId: 1,
    TargetChannel: DBPR.TargetChannels.CHANNEL_A,
    TargetProperty: null,
    TargetRecord: 1,
    ConfirmOnMsg: null,
    ConfirmOffMsg: null,
    PictureIdDay: 1,
    PictureIdNight: 1,
    Font: 'string',
    Alignment: 1,
    Dimension: null
}

describe('ChannelGroup', () => {
    describe('isLorR', () => {
        it('should return true for TYPE_SUBS_L', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS_L'
            });
            expect(group.isLorR()).toBe(true);
        });

        it('should return true for TYPE_SUBS_R', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS_R'
            });
            expect(group.isLorR()).toBe(true);
        });

        it('should return true for TYPE_SUBS_C', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS_C'
            });
            expect(group.isLorR()).toBe(true);
        });

        it('should return true for TYPE_TOPS_L', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_TOPS_L'
            });
            expect(group.isLorR()).toBe(true);
        });

        it('should return true for TYPE_TOPS_R', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_TOPS_R'
            });
            expect(group.isLorR()).toBe(true);
        });

        it('should return false for other types', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS'
            });
            expect(group.isLorR()).toBe(false);
        });
    });

    describe('hasLorR', () => {
        it('should return true for isLorR', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS_L'
            });
            expect(group.hasLorR()).toBe(true);
        });

        it('should return true for leftGroup', () => {
            const leftGroup = new ChannelGroup({
                groupId: 2,
                name: 'test2',
                channels: [],
                type: 'TYPE_SUBS_L'
            })

            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS'
            });

            group.leftGroup = leftGroup;

            expect(group.hasLorR()).toBe(true);
        });

        it('should return true for rightGroup', () => {
            const rightGroup = new ChannelGroup({
                groupId: 2,
                name: 'test2',
                channels: [],
                type: 'TYPE_SUBS_R'
            })

            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS'
            });

            group.rightGroup = rightGroup;

            expect(group.hasLorR()).toBe(true);
        });

        it('should return false for other types', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS'
            });
            expect(group.hasLorR()).toBe(false);
        });
    });

    describe('isRight', () => {
        it('should return true for TYPE_SUBS_R', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS_R'
            });
            expect(group.isRight()).toBe(true);
        });

        it('should return true for TYPE_TOPS_R', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_TOPS_R'
            });
            expect(group.isRight()).toBe(true);
        });

        it('should return false for other types', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS'
            });
            expect(group.isRight()).toBe(false);
        });
    });

    describe('isLeft', () => {
        it('should return true for TYPE_SUBS_L', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS_L'
            });
            expect(group.isLeft()).toBe(true);
        });

        it('should return true for TYPE_TOPS_L', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_TOPS_L'
            });
            expect(group.isLeft()).toBe(true);
        });

        it('should return false for other types', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS'
            });
            expect(group.isLeft()).toBe(false);
        });
    });

    describe('isSUBs', () => {
        it('should return true for TYPE_SUBS', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS'
            });
            expect(group.isSUBs()).toBe(true);
        });

        it('should return true for TYPE_SUBS_L', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS_L'
            });
            expect(group.isSUBs()).toBe(true);
        });

        it('should return true for TYPE_SUBS_R', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS_R'
            });
            expect(group.isSUBs()).toBe(true);
        });

        it('should return true for TYPE_SUBS_C', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS_C'
            });
            expect(group.isSUBs()).toBe(true);
        });

        it('should return true for TYPE_POINT_SUBS', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_POINT_SUBS'
            });
            expect(group.isSUBs()).toBe(true);
        });

        it('should return false for other types', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_TOPS'
            });
            expect(group.isSUBs()).toBe(false);
        });
    });

    describe('isTOPs', () => {
        it('should return true if the group is a TOPs group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_TOPS'
            });
            expect(group.isTOPs()).toBe(true);
        });

        it('should return true if the group is a Left TOPs group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_TOPS_L'
            });
            expect(group.isTOPs()).toBe(true);
        });

        it('should return true if the group is a Right TOPs group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_TOPS_R'
            });
            expect(group.isTOPs()).toBe(true);
        });

        it('should return true if the group is a Point Source TOPs group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_POINT_TOPS'
            });
            expect(group.isTOPs()).toBe(true);
        });

        it('should return false if the group is not a TOPs group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS'
            });
            expect(group.isTOPs()).toBe(false);
        });
    });

    describe('isPointSource', () => {
        it('should return true if the group is a Point Source group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_POINT_SUBS'
            });
            expect(group.isPointSource()).toBe(true);
        });

        it('should return true if the group is a Point Source TOPs group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_POINT_TOPS'
            });
            expect(group.isPointSource()).toBe(true);
        });

        it('should return false if the group is not a Point Source group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS'
            });
            expect(group.isPointSource()).toBe(false);
        });
    });

    describe('isAdditionalAmplifier', () => {
        it('should return true if the group is an Additional Amplifier group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_ADDITIONAL_AMPLIFIER'
            });
            expect(group.isAdditionalAmplifier()).toBe(true);
        });

        it('should return false if the group is not an Additional Amplifier group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS'
            });
            expect(group.isAdditionalAmplifier()).toBe(false);
        });
    });

    describe('hasCPL', () => {
        it('should return true if the group has a CPL', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_TOPS'
            });
            expect(group.hasCPL()).toBe(true);
        });

        it('should return true if the group is a Left TOPs group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_TOPS_L'
            });
            expect(group.hasCPL()).toBe(true);
        });

        it('should return true if the group is a Right TOPs group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_TOPS_R'
            });
            expect(group.hasCPL()).toBe(true);
        });

        it('should return true if the group is a Point Source TOPs group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_POINT_TOPS'
            });
            expect(group.hasCPL()).toBe(true);
        });

        it('should return true if the group is an Additional Amplifier group', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_ADDITIONAL_AMPLIFIER'
            });
            expect(group.hasCPL()).toBe(true);
        });

        it('should return false if the group does not have a CPL', () => {
            const group = new ChannelGroup({
                groupId: 1,
                name: 'test',
                channels: [],
                type: 'TYPE_SUBS'
            });
            expect(group.hasCPL()).toBe(false);
        });
    });

    describe('hasRelativeDelay', () => {
        const group = new ChannelGroup({
            groupId: 1,
            name: 'test',
            channels: [],
            type: 'TYPE_ADDITIONAL_AMPLIFIER'
        });

        const sourceGroup = {
            Type: DBPR.SourceGroupTypes.UNUSED_CHANNELS
        } as any;
        it('should return true if the group has a relative delay', () => {
            group.type = 'TYPE_SUBS'
            sourceGroup.Type = DBPR.SourceGroupTypes.POINT_SOURCE;
            expect(group.hasRelativeDelay(sourceGroup)).toBe(true);
        });

        it('should return true if the group is a Point Source TOPs group', () => {
            group.type = 'TYPE_POINT_TOPS'
            sourceGroup.Type = DBPR.SourceGroupTypes.POINT_SOURCE;
            expect(group.hasRelativeDelay(sourceGroup)).toBe(true);
        });

        it('should return true if the group is a Point Source SUBs group', () => {
            group.type = 'TYPE_POINT_SUBS'
            sourceGroup.Type = DBPR.SourceGroupTypes.POINT_SOURCE;
            expect(group.hasRelativeDelay(sourceGroup)).toBe(true);
        });

        it('should return false if the group does not have a relative delay', () => {
            group.type = 'TYPE_TOPS'
            sourceGroup.Type = DBPR.SourceGroupTypes.ARRAY;
            expect(group.hasRelativeDelay(sourceGroup)).toBe(false);
        });
    });
});


describe('SourceGroup', () => {
    let sourceGroup: SourceGroup;
    let channelGroup: ChannelGroup;
    const defaultRow: any = {
        SourceGroupId: 1,
        Type: DBPR.SourceGroupTypes.ARRAY,
        Name: 'test',
        OrderIndex: 1,
        RemarkableChangeDate: 0,
        NextSourceGroupId: 0,
        ArrayProcessingEnable: DBPR.ArrayProcessingFlag.DISABLED,
        ArraySightId: 0,
        ArraySightIdR: 0,
        LinkMode: 0,
        Symmetric: DBPR.SymmetricFlag.ENABLED,
        Mounting: DBPR.MountingFlag.FLOWN,
        RelativeDelay: null,
        System: '',
        ViewId: 0,
        xover: null,
    };

    beforeEach(() => {
        sourceGroup = new SourceGroup(defaultRow);

        channelGroup = new ChannelGroup({
            groupId: 1,
            name: 'group1',
            type: 'TYPE_SUBS_L',
            channels: []
        });
    })

    describe('constructor', () => {
        it('should assign common properties', () => {
            const newSourceGroup = new SourceGroup(defaultRow);

            expect(newSourceGroup.SourceGroupId).toBe(defaultRow.SourceGroupId);
            expect(newSourceGroup.Type).toBe(defaultRow.Type);
            expect(newSourceGroup.Name).toBe(defaultRow.Name);
            expect(newSourceGroup.OrderIndex).toBe(defaultRow.OrderIndex);
            expect(newSourceGroup.NextSourceGroupId).toBe(defaultRow.NextSourceGroupId);
            expect(newSourceGroup.ArrayProcessingEnable).toBe(defaultRow.ArrayProcessingEnable);
            expect(newSourceGroup.ArraySightId).toBe(defaultRow.ArraySightId);
            expect(newSourceGroup.ArraySightIdR).toBe(defaultRow.ArraySightIdR);
            expect(newSourceGroup.LinkMode).toBe(defaultRow.LinkMode);
            expect(newSourceGroup.Symmetric).toBe(defaultRow.Symmetric);
            expect(newSourceGroup.Mounting).toBe(defaultRow.Mounting);
            expect(newSourceGroup.RelativeDelay).toBe(defaultRow.RelativeDelay);
            expect(newSourceGroup.System).toBe(defaultRow.System);
            expect(newSourceGroup.ViewId).toBe(defaultRow.ViewId);
            expect(newSourceGroup.xover).toBe("CUT");
        });

        it('should assign Top Group properties', () => {
            const row = { ...defaultRow }
            const index = 0;

            row.TopGroupId = 101
            row.TopGroupName = 'TopGroupName'
            const newSourceGroup = new SourceGroup(row);

            expect(newSourceGroup.channelGroups[index].name).toBe(row.TopGroupName);
            expect(newSourceGroup.channelGroups[index].groupId).toBe(row.TopGroupId);
        });

        it('should assign Top Left properties', () => {
            const row = { ...defaultRow }
            const parentIndex = 0;
            const index = 1;

            row.TopGroupId = 101
            row.TopGroupName = 'TopGroupName'
            row.TopLeftGroupId = 103
            row.TopLeftGroupName = 'TopLeftGroupName'
            const newSourceGroup = new SourceGroup(row);

            expect(newSourceGroup.channelGroups[parentIndex].leftGroup?.name).toBe(row.TopLeftGroupName);
            expect(newSourceGroup.channelGroups[parentIndex].leftGroup?.groupId).toBe(row.TopLeftGroupId);

            expect(newSourceGroup.channelGroups[index].name).toBe(row.TopLeftGroupName);
            expect(newSourceGroup.channelGroups[index].groupId).toBe(row.TopLeftGroupId);
        });

        it('should assign Top Group Right properties', () => {
            const row = { ...defaultRow }
            const parentIndex = 0;
            const index = 2;

            row.TopGroupId = 101
            row.TopGroupName = 'TopGroupName'
            row.TopCGroupId = 102
            row.TopCGroupName = 'TopCGroupName'
            row.TopLeftGroupId = 103
            row.TopLeftGroupName = 'TopLeftGroupName'
            row.TopRightGroupId = 104
            row.TopRightGroupName = 'TopRightGroupName'
            const newSourceGroup = new SourceGroup(row);

            expect(newSourceGroup.channelGroups[parentIndex].rightGroup?.name).toBe(row.TopRightGroupName);
            expect(newSourceGroup.channelGroups[parentIndex].rightGroup?.groupId).toBe(row.TopRightGroupId);

            expect(newSourceGroup.channelGroups[index].name).toBe(row.TopRightGroupName);
            expect(newSourceGroup.channelGroups[index].groupId).toBe(row.TopRightGroupId);
        });

        it('should assign Sub Group properties', () => {
            const row = { ...defaultRow }
            const index = 0;

            row.SubGroupId = 101
            row.SubGroupName = 'SubGroupName'
            const newSourceGroup = new SourceGroup(row);

            expect(newSourceGroup.channelGroups[index].name).toBe(row.SubGroupName);
            expect(newSourceGroup.channelGroups[index].groupId).toBe(row.SubGroupId);
        });

        it('should assign Sub Group Left properties', () => {
            const row = { ...defaultRow }
            const parentIndex = 0;
            const index = 1;

            row.SubGroupId = 101
            row.SubGroupName = 'SubGroupName'
            row.SubCGroupId = 102
            row.SubCGroupName = 'SubCGroupName'
            row.SubLeftGroupId = 103
            row.SubLeftGroupName = 'SubLeftGroupName'
            const newSourceGroup = new SourceGroup(row);

            expect(newSourceGroup.channelGroups[parentIndex].leftGroup?.name).toBe(row.SubLeftGroupName);
            expect(newSourceGroup.channelGroups[parentIndex].leftGroup?.groupId).toBe(row.SubLeftGroupId);

            expect(newSourceGroup.channelGroups[index].name).toBe(row.SubLeftGroupName);
            expect(newSourceGroup.channelGroups[index].groupId).toBe(row.SubLeftGroupId);
        });

        it('should assign Sub Group Right properties', () => {
            const row = { ...defaultRow }
            const parentIndex = 0;
            const index = 2;

            row.SubGroupId = 101
            row.SubGroupName = 'SubGroupName'
            row.SubLeftGroupId = 103
            row.SubLeftGroupName = 'SubLeftGroupName'
            row.SubRightGroupId = 104
            row.SubRightGroupName = 'SubRightGroupName'
            const newSourceGroup = new SourceGroup(row);

            expect(newSourceGroup.channelGroups[parentIndex].rightGroup?.name).toBe(row.SubRightGroupName);
            expect(newSourceGroup.channelGroups[parentIndex].rightGroup?.groupId).toBe(row.SubRightGroupId);

            expect(newSourceGroup.channelGroups[index].name).toBe(row.SubRightGroupName);
            expect(newSourceGroup.channelGroups[index].groupId).toBe(row.SubRightGroupId);
        });

        it('should assign Point Source properties', () => {
            const row = { ...defaultRow }
            const index = 0;

            row.MainGroupId = 100
            row.MainGroupName = 'MainGroupName'
            const newSourceGroup = new SourceGroup(row);

            expect(newSourceGroup.channelGroups[index].name).toBe(row.MainGroupName);
            expect(newSourceGroup.channelGroups[index].groupId).toBe(row.MainGroupId);
        });
    });

    describe('isStereo', () => {
        it('should return true if the group has at least 3 channel groups', () => {
            sourceGroup.channelGroups.push(channelGroup);
            sourceGroup.channelGroups.push(channelGroup);
            sourceGroup.channelGroups.push(channelGroup);
            expect(sourceGroup.isStereo()).toBe(true);
        });

        it('should return false if the group has less than 3 channel groups', () => {
            sourceGroup.channelGroups.push(channelGroup);
            sourceGroup.channelGroups.push(channelGroup);
            expect(sourceGroup.isStereo()).toBe(false);
        });
    });

    describe('hasArrayProcessingEnabled', () => {
        it('should return true if ArrayProcessingEnable is set to ON', () => {
            sourceGroup.ArrayProcessingEnable = DBPR.ArrayProcessingFlag.ENABLED;
            expect(sourceGroup.hasArrayProcessingEnabled()).toBe(true);
        });

        it('should return false if ArrayProcessingEnable is set to OFF', () => {
            sourceGroup.ArrayProcessingEnable = DBPR.ArrayProcessingFlag.DISABLED;
            expect(sourceGroup.hasArrayProcessingEnabled()).toBe(false);
        });
    });

    describe('hasCPLv2', () => {
        it('should return true if the System is GSL, KSL, or XSL', () => {
            sourceGroup.System = 'GSL';
            expect(sourceGroup.hasCPLv2()).toBe(true);
            sourceGroup.System = 'KSL';
            expect(sourceGroup.hasCPLv2()).toBe(true);
            sourceGroup.System = 'XSL';
            expect(sourceGroup.hasCPLv2()).toBe(true);
        });

        it('should return false if the System is not GSL, KSL, or XSL', () => {
            sourceGroup.System = 'mixed';
            expect(sourceGroup.hasCPLv2()).toBe(false);
        });
    });

    describe('hasSUBs', () => {
        it('should return true if the System is has any SUB sources', () => {
            sourceGroup.channelGroups.push(channelGroup)
            sourceGroup.channelGroups[0].type = 'TYPE_SUBS'
            expect(sourceGroup.hasSUBs()).toBe(true);
        });

        it('should return false if the System does not have any SUB sources', () => {
            sourceGroup.channelGroups.push(channelGroup)
            sourceGroup.channelGroups[0].type = 'TYPE_POINT_TOPS'
            expect(sourceGroup.hasSUBs()).toBe(false);
        });
    });

    describe('haTOPs', () => {
        it('should return true if the System is has any TOP sources', () => {
            sourceGroup.channelGroups.push(channelGroup)
            sourceGroup.channelGroups[0].type = 'TYPE_POINT_TOPS'
            expect(sourceGroup.hasTOPs()).toBe(true);
        });

        it('should return false if the System does not have any TOP sources', () => {
            sourceGroup.channelGroups.push(channelGroup)
            sourceGroup.channelGroups[0].type = 'TYPE_SUBS'
            expect(sourceGroup.hasTOPs()).toBe(false);
        });
    });

    describe('hasLoadMatch', () => {
        it('should return true if the Type is not ADDITIONAL_AMPLIFIER', () => {
            sourceGroup.Type = DBPR.SourceGroupTypes.ARRAY;
            expect(sourceGroup.hasLoadMatch()).toBe(true);
            sourceGroup.Type = DBPR.SourceGroupTypes.POINT_SOURCE;
            expect(sourceGroup.hasLoadMatch()).toBe(true);
            sourceGroup.Type = DBPR.SourceGroupTypes.SUBARRAY;
            expect(sourceGroup.hasLoadMatch()).toBe(true);
        });

        it('should return false if the Type is ADDITIONAL_AMPLIFIER', () => {
            sourceGroup.Type = DBPR.SourceGroupTypes.ADDITIONAL_AMPLIFIER;
            expect(sourceGroup.hasLoadMatch()).toBe(false);
            sourceGroup.Type = DBPR.SourceGroupTypes.UNUSED_CHANNELS;
            expect(sourceGroup.hasLoadMatch()).toBe(false);
        });
    });

    describe('hasEQView', () => {
        it('should return true if the Type is not ADDITIONAL_AMPLIFIER or UNUSED_CHANNELS', () => {
            sourceGroup.Type = DBPR.SourceGroupTypes.ARRAY;
            expect(sourceGroup.hasEQView()).toBe(true);
            sourceGroup.Type = DBPR.SourceGroupTypes.POINT_SOURCE;
            expect(sourceGroup.hasEQView()).toBe(true);
            sourceGroup.Type = DBPR.SourceGroupTypes.SUBARRAY;
            expect(sourceGroup.hasEQView()).toBe(true);
        });

        it('should return false if the Type is ADDITIONAL_AMPLIFIER', () => {
            sourceGroup.Type = DBPR.SourceGroupTypes.ADDITIONAL_AMPLIFIER;
            expect(sourceGroup.hasEQView()).toBe(false);
            sourceGroup.Type = DBPR.SourceGroupTypes.UNUSED_CHANNELS;
            expect(sourceGroup.hasEQView()).toBe(false);
        });
    });
});

describe('AutoR1ProjectFile', () => {
    describe('Build', () => {
        it('should load a project file', async () => {
            // Arrange
            getAsObject.mockReturnValueOnce({ GroupId: 1 });

            // Act
            await AutoR1ProjectFile.build(true as any);

            // Assert
            expect(prepare).toHaveBeenCalled();
        });

        it('should set additions to true if any previous artifacts are found', async () => {
            // Arrange
            const View: DBPR.View = {
                ViewId: 1,
                Type: DBPR.ViewTypes.REMOTE_VIEW,
                Name: 'name',
                Icon: undefined,
                Flags: 2,
                HomeViewIndex: 3,
                NaviBarIndex: 4,
                HRes: 5,
                VRes: 6,
                ZoomLevel: 7,
                ScalingFactor: 8,
                ScalingPosX: 9,
                ScalingPosY: 10,
                ReferenceVenueObjectId: undefined,
            }

            getAsObject.mockReturnValueOnce({ GroupId: 1 })
                .mockReturnValueOnce(View);

            // Act
            const projectFile = await AutoR1ProjectFile.build(true as any);

            // Assert
            expect(projectFile.additions).toBeTruthy();
        });

        it('throw if the project file has not been initialised', async () => {
            // Arrange
            getAsObject.mockReturnValueOnce(undefined);

            // Assert
            await expect(() => AutoR1ProjectFile.build(true as any)).rejects.toThrowError();
        });
    });

    describe('getViewByName', () => {
        it('should return a View object', async () => {
            // Arrange
            const View: DBPR.View = {
                ViewId: 1,
                Type: DBPR.ViewTypes.UNKNOWN,
                Name: 'name',
                Icon: undefined,
                Flags: 2,
                HomeViewIndex: 3,
                NaviBarIndex: 4,
                HRes: 5,
                VRes: 6,
                ZoomLevel: 7,
                ScalingFactor: 8,
                ScalingPosX: 9,
                ScalingPosY: 10,
                ReferenceVenueObjectId: undefined,
            }
            getAsObject.mockReturnValueOnce({ GroupId: 1 });
            const projectFile = await AutoR1ProjectFile.build(true as any);

            getAsObject.mockReturnValueOnce(View);

            // Act
            const view = (projectFile as any).getViewByName('name');

            // Assert
            expect(view).toMatchObject(View);
        });

        it('should return undefined if the view does not exist', async () => {
            // Arrange
            const View = undefined;
            getAsObject.mockReturnValueOnce({ GroupId: 1 });
            const projectFile = await AutoR1ProjectFile.build(true as any);

            getAsObject.mockReturnValueOnce(View);

            // Act
            const view = (projectFile as any).getViewByName('name');

            // Assert
            expect(view).toBeUndefined();
        });

        it('should return undefined if the ViewId is undefined', async () => {
            // Arrange
            const View = { ViewId: undefined };
            getAsObject.mockReturnValueOnce({ GroupId: 1 });
            const projectFile = await AutoR1ProjectFile.build(true as any);

            getAsObject.mockReturnValueOnce(View);

            // Act
            const view = (projectFile as any).getViewByName('name');

            // Assert
            expect(view).toBeUndefined();
        });
    });

    describe('getMeterView', () => {
        it('should return a view object', async () => {
            // Arrange
            const View: DBPR.View = {
                ViewId: 1,
                Type: DBPR.ViewTypes.REMOTE_VIEW,
                Name: 'name',
                Icon: undefined,
                Flags: 2,
                HomeViewIndex: 3,
                NaviBarIndex: 4,
                HRes: 5,
                VRes: 6,
                ZoomLevel: 7,
                ScalingFactor: 8,
                ScalingPosX: 9,
                ScalingPosY: 10,
                ReferenceVenueObjectId: undefined,
            }
            getAsObject.mockReturnValueOnce({ GroupId: 1 });
            const projectFile = await AutoR1ProjectFile.build(true as any);

            getAsObject.mockReturnValueOnce(View);

            // Act
            const view = (projectFile as any).getMeterView();

            // Assert
            expect(view).toMatchObject(View);
        });
    });

    describe('getMainView', () => {
        it('should return a view object', async () => {
            // Arrange
            const View: DBPR.View = {
                ViewId: 1,
                Type: DBPR.ViewTypes.REMOTE_VIEW,
                Name: 'name',
                Icon: undefined,
                Flags: 2,
                HomeViewIndex: 3,
                NaviBarIndex: 4,
                HRes: 5,
                VRes: 6,
                ZoomLevel: 7,
                ScalingFactor: 8,
                ScalingPosX: 9,
                ScalingPosY: 10,
                ReferenceVenueObjectId: undefined,
            }
            getAsObject.mockReturnValueOnce({ GroupId: 1 });
            const projectFile = await AutoR1ProjectFile.build(true as any);

            getAsObject.mockReturnValueOnce(View);

            // Act
            const view = (projectFile as any).getMainView();

            // Assert
            expect(view).toMatchObject(View);
        });
    });

    describe('getEQView', () => {
        it('should return a view object', async () => {
            // Arrange
            const View: DBPR.View = {
                ViewId: 1,
                Type: DBPR.ViewTypes.REMOTE_VIEW,
                Name: 'name',
                Icon: undefined,
                Flags: 2,
                HomeViewIndex: 3,
                NaviBarIndex: 4,
                HRes: 5,
                VRes: 6,
                ZoomLevel: 7,
                ScalingFactor: 8,
                ScalingPosX: 9,
                ScalingPosY: 10,
                ReferenceVenueObjectId: undefined,
            }
            getAsObject.mockReturnValueOnce({ GroupId: 1 });
            const projectFile = await AutoR1ProjectFile.build(true as any);

            getAsObject.mockReturnValueOnce(View);

            // Act
            const view = (projectFile as any).getEQView();

            // Assert
            expect(view).toMatchObject(View);
        });
    });

    describe('getFallbackGroupID', () => {
        it('should return a GroupId', async () => {
            // Arrange
            const GroupId = 1;
            getAsObject.mockReturnValueOnce({ GroupId: 1 });
            const projectFile = await AutoR1ProjectFile.build(true as any);

            get.mockReturnValueOnce([GroupId]);

            // Act
            const groupId = (projectFile as any).getFallbackGroupID();

            // Assert
            expect(groupId).toBe(GroupId);
        });
    });

    describe('getMuteGroupID', () => {
        it('should return a GroupId', async () => {
            // Arrange
            const GroupId = 1;
            getAsObject.mockReturnValueOnce({ GroupId: 1 });
            const projectFile = await AutoR1ProjectFile.build(true as any);

            get.mockReturnValueOnce([GroupId]);

            // Act
            const groupId = (projectFile as any).getMuteGroupID();

            // Assert
            expect(groupId).toBe(GroupId);
        });
    });

    describe('getDsGroupID', () => {
        it('should return a GroupId', async () => {
            // Arrange
            const GroupId = 1;
            getAsObject.mockReturnValueOnce({ GroupId: 1 });
            const projectFile = await AutoR1ProjectFile.build(true as any);

            get.mockReturnValueOnce([GroupId]);

            // Act
            const groupId = (projectFile as any).getDsGroupID();

            // Assert
            expect(groupId).toBe(GroupId);
        });
    });

    describe('createSubLRCGroups', () => {
        let projectFile: AutoR1ProjectFile;
        beforeEach(async () => {
            getAsObject.mockReturnValueOnce({ GroupId: 1 });
            projectFile = await AutoR1ProjectFile.build(true as any);
        });

        it('should return early if a SUBarray group is not found', async () => {
            // Arrange
            const GroupId = 1;
            get.mockReturnValueOnce([GroupId]);

            const spy = jest.spyOn(console, 'warn');

            // Act
            (projectFile as any).createSubLRCGroups();

            // Assert
            expect(spy).toHaveBeenCalled();
        });

        it('should create a Left, Right, and Center group', async () => {
            // Arrange
            const Name = 'sub array';

            // Sub array group name
            getAsObject.mockReturnValueOnce({ Name });

            // Newly created parent sub group ID
            getAsObject.mockReturnValueOnce({ GroupId: 1 });

            // Newly created parent sub group ID
            getAsObject.mockReturnValueOnce({ 'max(GroupId)': 1 });

            // Newly created child sub group ID
            getAsObject.mockReturnValueOnce({ GroupId: 2 });

            // Newly created child sub group ID
            getAsObject.mockReturnValueOnce({ 'max(GroupId)': 1 });

            // start getSubArrayGroups
            step.mockReturnValueOnce(true);
            step.mockReturnValueOnce(false);
            const channel: Channel = {
                CabinetId: 1,
                GroupId: 2,
                Name: 'name',
                TargetChannel: 3,
                TargetId: 4,
            }
            getAsObject.mockReturnValueOnce(channel);
            // end

            // L, R or C group
            getAsObject.mockReturnValueOnce({ GroupId: 3 });

            // Child or L, R or C group
            getAsObject.mockReturnValueOnce({ GroupId: 4 });
            getAsObject.mockReturnValueOnce({ GroupId: 5 });

            // Act
            (projectFile as any).createSubLRCGroups();

            // Assert
            expect(run).toHaveBeenCalledTimes(4);
        });
    });
});

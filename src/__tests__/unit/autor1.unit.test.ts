import { ChannelGroup, SourceGroup, AutoR1Control, AutoR1Template } from '../../autor1';
import * as DBPR from '../../dbpr';

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

    beforeEach(() => {
        sourceGroup = new SourceGroup({
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
            xover: 'CUT',
            MainGroupId: -1,
            MainGroupName: '',
            SubGroupId: -1,
            SubGroupName: '',
            SubCGroupId: -1,
            SubCGroupName: '',
            SubLeftGroupId: -1,
            SubLeftGroupName: '',
            SubRightGroupId: -1,
            SubRightGroupName: '',
            TopGroupId: -1,
            TopGroupName: '',
            TopLeftGroupId: -1,
            TopLeftGroupName: '',
            TopRightGroupId: -1,
            TopRightGroupName: '',
        });

        channelGroup = new ChannelGroup({
            groupId: 1,
            name: 'group1',
            type: 'TYPE_SUBS_L',
            channels: []
        });
    })

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


describe('configureMainViewMeterTemplate', () => {
    let sourceGroup: SourceGroup;
    let channelGroup: ChannelGroup;
    let control: AutoR1Control;

    const joinedId = 1;
    const TargetChannel = 2
    const muteTargetId = 3
    const TargetId = 4
    const posX = 0
    const posY = 0
    const viewId = 1000;

    beforeEach(() => {
        sourceGroup = new SourceGroup({
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
            xover: 'CUT',
            MainGroupId: -1,
            MainGroupName: '',
            SubGroupId: -1,
            SubGroupName: '',
            SubCGroupId: -1,
            SubCGroupName: '',
            SubLeftGroupId: -1,
            SubLeftGroupName: '',
            SubRightGroupId: -1,
            SubRightGroupName: '',
            TopGroupId: -1,
            TopGroupName: '',
            TopLeftGroupId: -1,
            TopLeftGroupName: '',
            TopRightGroupId: -1,
            TopRightGroupName: '',
        });

        channelGroup = new ChannelGroup({
            groupId: 1,
            name: 'group1',
            type: 'TYPE_SUBS_L',
            channels: []
        });

        control = new AutoR1Control();
    })

    it('should set JoinedId and TargetID by default', () => {
        // Arrange

        // Act
        control.configureForMainView(joinedId, { TargetChannel, TargetId }, muteTargetId, sourceGroup, channelGroup, posX, posY, viewId);


        // Assert
        expect(control.JoinedId).toBe(joinedId);
        expect(control.TargetId).toBe(channelGroup.groupId);
    });

    it('should update the DisplayName if control is a CUT button', () => {
        // Arrange
        control.setDisplayName('CUT');
        sourceGroup.xover = 'xover' as any;

        // Act
        control.configureForMainView(joinedId, { TargetChannel, TargetId }, muteTargetId, sourceGroup, channelGroup, posX, posY, viewId);

        expect(control.DisplayName).toBe('xover');
    });

    it('should not update the DisplayName if control is not a CUT button', () => {
        // Arrange
        control.setDisplayName('test');

        // Act
        control.configureForMainView(joinedId, { TargetChannel, TargetId }, muteTargetId, sourceGroup, channelGroup, posX, posY, viewId);

        expect(control.DisplayName).toBe('test');
    });

    it('should update the TargetChannel if control is a Meter', () => {
        // Arrange
        control.setType(DBPR.ControlTypes.METER);

        // Act
        control.configureForMainView(joinedId, { TargetChannel, TargetId }, muteTargetId, sourceGroup, channelGroup, posX, posY, viewId);

        expect(control.TargetChannel).toBe(TargetChannel);
    });

    it('should not update the TargetChannel if control is not a', () => {
        // Arrange
        control.setType(DBPR.ControlTypes.DIGITAL);

        // Act
        control.configureForMainView(joinedId, { TargetChannel, TargetId }, muteTargetId, sourceGroup, channelGroup, posX, posY, viewId);

        expect(control.TargetChannel).not.toBe(TargetChannel);
    });

    it('should update the TargetId if control is a Mute Switch', () => {
        // Arrange
        control.setType(DBPR.ControlTypes.SWITCH);
        control.setTargetProperty(DBPR.TargetPropertyType.CONFIG_MUTE);

        // Act
        control.configureForMainView(joinedId, { TargetChannel, TargetId }, muteTargetId, sourceGroup, channelGroup, posX, posY, viewId);

        expect(control.TargetId).toBe(muteTargetId);
    });

    it('should not update the TargetId if control is not a Mute Switch', () => {
        // Arrange
        control.setType(DBPR.ControlTypes.DISPLAY);
        control.setTargetProperty(DBPR.TargetPropertyType.CHANNEL_ERROR);

        // Act
        control.configureForMainView(joinedId, { TargetChannel, TargetId }, muteTargetId, sourceGroup, channelGroup, posX, posY, viewId);

        expect(control.TargetId).not.toBe(muteTargetId);
    });
});


describe('AutoR1Template', () => {
    const control = new AutoR1Control();
    const section: DBPR.Section = {
        Id: 1,
        Name: 'testsection',
        ParentId: 2,
        JoinedId: 3,
        Description: 'description',
    }

    describe('constructor', () => {

        it('should create a new AutoR1Template and not throw', () => {
            expect(() => new AutoR1Template(section, [control])).not.toThrow();
        })

        it('it should set the section values', () => {
            const template = new AutoR1Template(section, [control]);
            expect(template.id).toBe(section.Id);
            expect(template.joinedId).toBe(section.JoinedId);
            expect(template.parentId).toBe(section.ParentId);
            expect(template.joinedId).toBe(section.JoinedId);
        })

        it('should load the provided controls', () => {
            const template = new AutoR1Template(section, [control]);
            expect(template.controls.length).toBeTruthy();
        })
    });

    describe('configureForMainView', () => {
        const control: DBPR.Control = {
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
            TargetProperty: DBPR.TargetPropertyType.CONFIG_FILTER1,
            TargetRecord: 0,
            ConfirmOnMsg: null,
            ConfirmOffMsg: null,
            PictureIdDay: 0,
            PictureIdNight: 0,
            Font: "Arial,12,-1,5,50,0,0,0,0,0",
            Alignment: 132,
            Dimension: null
        };

        const controls = [
            new AutoR1Control(),
            new AutoR1Control(),
            new AutoR1Control(),
            new AutoR1Control(),
        ]
    });
});
/* eslint-disable */
import {
	ChannelGroup,
	SourceGroup,
	AutoR1ProjectFile,
	AutoR1Control,
	TemplateOptions,
	AutoR1Template
} from '../../autor1';
import * as DBPR from '../../dbpr';
import SQLjs from 'sql.js';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('sql.js');

const get = vi.fn();
const getAsObject = vi.fn();
const bind = vi.fn();
const step = vi.fn();
const run = vi.fn();
const free = vi.fn();
let prepare: Mock;
let Database: Mock;

beforeEach(() => {
	vi.resetAllMocks();

	prepare = vi.fn(() => ({ get, getAsObject, bind, step, free, run }));
	Database = vi.fn(() => ({ prepare }));
	(SQLjs as unknown as Mock).mockReturnValue({
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
};

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
			});

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
			});

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
			group.type = 'TYPE_SUBS';
			sourceGroup.Type = DBPR.SourceGroupTypes.POINT_SOURCE;
			expect(group.hasRelativeDelay(sourceGroup)).toBe(true);
		});

		it('should return true if the group is a Point Source TOPs group', () => {
			group.type = 'TYPE_POINT_TOPS';
			sourceGroup.Type = DBPR.SourceGroupTypes.POINT_SOURCE;
			expect(group.hasRelativeDelay(sourceGroup)).toBe(true);
		});

		it('should return true if the group is a Point Source SUBs group', () => {
			group.type = 'TYPE_POINT_SUBS';
			sourceGroup.Type = DBPR.SourceGroupTypes.POINT_SOURCE;
			expect(group.hasRelativeDelay(sourceGroup)).toBe(true);
		});

		it('should return false if the group does not have a relative delay', () => {
			group.type = 'TYPE_TOPS';
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
		xover: null
	};

	beforeEach(() => {
		sourceGroup = new SourceGroup(defaultRow);

		channelGroup = new ChannelGroup({
			groupId: 1,
			name: 'group1',
			type: 'TYPE_SUBS_L',
			channels: []
		});
	});

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
			expect(newSourceGroup.xover).toBe('CUT');
		});

		it('should assign Top Group properties', () => {
			const row = { ...defaultRow };
			const index = 0;

			row.R1GroupsMasterTopsGroupId = 101;
			row.R1GroupsMasterTopsName = 'TopGroupName';
			const newSourceGroup = new SourceGroup(row);

			expect(newSourceGroup.channelGroups[index].name).toBe(row.R1GroupsMasterTopsName);
			expect(newSourceGroup.channelGroups[index].groupId).toBe(row.R1GroupsMasterTopsGroupId);
		});

		it('should assign Top Left properties', () => {
			const row = { ...defaultRow };
			const parentIndex = 0;
			const index = 1;

			row.R1GroupsMasterTopsGroupId = 101;
			row.R1GroupsMasterTopsName = 'TopGroupName';
			row.R1GroupsLeftRightTopsLGroupId = 103;
			row.R1GroupsLeftRightTopsLName = 'R1GroupsLeftRightTopsLName';
			const newSourceGroup = new SourceGroup(row);

			expect(newSourceGroup.channelGroups[parentIndex].leftGroup?.name).toBe(
				row.R1GroupsLeftRightTopsLName
			);
			expect(newSourceGroup.channelGroups[parentIndex].leftGroup?.groupId).toBe(
				row.R1GroupsLeftRightTopsLGroupId
			);

			expect(newSourceGroup.channelGroups[index].name).toBe(row.R1GroupsLeftRightTopsLName);
			expect(newSourceGroup.channelGroups[index].groupId).toBe(row.R1GroupsLeftRightTopsLGroupId);
		});

		it('should assign Top Group Right properties', () => {
			const row = { ...defaultRow };
			const parentIndex = 0;
			const index = 2;

			row.R1GroupsMasterTopsGroupId = 101;
			row.R1GroupsMasterTopsName = 'TopGroupName';
			row.R1GroupsLeftRightTopsLGroupId = 103;
			row.R1GroupsLeftRightTopsLName = 'R1GroupsLeftRightTopsLName';
			row.R1GroupsLeftRightTopsRGroupId = 104;
			row.R1GroupsLeftRightTopsRName = 'R1GroupsLeftRightTopsRName';
			const newSourceGroup = new SourceGroup(row);

			expect(newSourceGroup.channelGroups[parentIndex].rightGroup?.name).toBe(
				row.R1GroupsLeftRightTopsRName
			);
			expect(newSourceGroup.channelGroups[parentIndex].rightGroup?.groupId).toBe(
				row.R1GroupsLeftRightTopsRGroupId
			);

			expect(newSourceGroup.channelGroups[index].name).toBe(row.R1GroupsLeftRightTopsRName);
			expect(newSourceGroup.channelGroups[index].groupId).toBe(row.R1GroupsLeftRightTopsRGroupId);
		});

		it('should assign Sub Group properties', () => {
			const row = { ...defaultRow };
			const index = 0;

			row.R1GroupsMasterSubsGroupId = 101;
			row.R1GroupsMasterSubsName = 'R1GroupsMasterSubsName';
			const newSourceGroup = new SourceGroup(row);

			expect(newSourceGroup.channelGroups[index].groupId).toBe(row.R1GroupsMasterSubsGroupId);
			expect(newSourceGroup.channelGroups[index].name).toBe(row.R1GroupsMasterSubsName);
		});

		it('should assign Sub Group Left properties', () => {
			const row = { ...defaultRow };
			const parentIndex = 0;
			const index = 1;

			row.R1GroupsMasterSubsGroupId = 101;
			row.R1GroupsMasterSubsName = 'R1GroupsMasterSubsName';
			row.SubCGroupId = 102;
			row.SubCGroupName = 'SubCGroupName';
			row.R1GroupsLeftRightSubsLGroupId = 103;
			row.R1GroupsLeftRightSubsLName = 'AutoR1SubLeftGroupName';
			const newSourceGroup = new SourceGroup(row);

			expect(newSourceGroup.channelGroups[parentIndex].leftGroup?.name).toBe(
				row.R1GroupsLeftRightSubsLName
			);
			expect(newSourceGroup.channelGroups[parentIndex].leftGroup?.groupId).toBe(
				row.R1GroupsLeftRightSubsLGroupId
			);

			expect(newSourceGroup.channelGroups[index].name).toBe(row.R1GroupsLeftRightSubsLName);
			expect(newSourceGroup.channelGroups[index].groupId).toBe(row.R1GroupsLeftRightSubsLGroupId);
		});

		it('should assign Sub Group Right properties', () => {
			const row = { ...defaultRow };
			const parentIndex = 0;
			const index = 2;

			row.R1GroupsMasterSubsGroupId = 101;
			row.R1GroupsMasterSubsName = 'R1GroupsMasterSubsName';
			row.R1GroupsLeftRightSubsLGroupId = 103;
			row.R1GroupsLeftRightSubsLName = 'AutoR1SubLeftGroupName';
			row.R1GroupsLeftRightSubsRGroupId = 104;
			row.R1GroupsLeftRightSubsRName = 'SubRightGroupName';
			const newSourceGroup = new SourceGroup(row);

			expect(newSourceGroup.channelGroups[parentIndex].rightGroup?.name).toBe(
				row.R1GroupsLeftRightSubsRName
			);
			expect(newSourceGroup.channelGroups[parentIndex].rightGroup?.groupId).toBe(
				row.R1GroupsLeftRightSubsRGroupId
			);

			expect(newSourceGroup.channelGroups[index].name).toBe(row.R1GroupsLeftRightSubsRName);
			expect(newSourceGroup.channelGroups[index].groupId).toBe(row.R1GroupsLeftRightSubsRGroupId);
		});

		it('should assign Point Source properties', () => {
			const row = { ...defaultRow };
			const index = 0;

			row.R1GroupsMasterGroupId = 100;
			row.R1GroupsMasterName = 'MainGroupName';
			const newSourceGroup = new SourceGroup(row);

			expect(newSourceGroup.channelGroups[index].name).toBe(row.R1GroupsMasterName);
			expect(newSourceGroup.channelGroups[index].groupId).toBe(row.R1GroupsMasterGroupId);
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
			sourceGroup.channelGroups.push(channelGroup);
			sourceGroup.channelGroups[0].type = 'TYPE_SUBS';
			expect(sourceGroup.hasSUBs()).toBe(true);
		});

		it('should return false if the System does not have any SUB sources', () => {
			sourceGroup.channelGroups.push(channelGroup);
			sourceGroup.channelGroups[0].type = 'TYPE_POINT_TOPS';
			expect(sourceGroup.hasSUBs()).toBe(false);
		});
	});

	describe('haTOPs', () => {
		it('should return true if the System is has any TOP sources', () => {
			sourceGroup.channelGroups.push(channelGroup);
			sourceGroup.channelGroups[0].type = 'TYPE_POINT_TOPS';
			expect(sourceGroup.hasTOPs()).toBe(true);
		});

		it('should return false if the System does not have any TOP sources', () => {
			sourceGroup.channelGroups.push(channelGroup);
			sourceGroup.channelGroups[0].type = 'TYPE_SUBS';
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
				Icon: 'icon',
				Flags: 2,
				HomeViewIndex: 3,
				NaviBarIndex: 4,
				HRes: 5,
				VRes: 6,
				ZoomLevel: 7,
				ScalingFactor: 8,
				ScalingPosX: 9,
				ScalingPosY: 10,
				ReferenceVenueObjectId: undefined
			};

			getAsObject.mockReturnValueOnce({ GroupId: 1 }).mockReturnValueOnce(View);

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
				ReferenceVenueObjectId: undefined
			};
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
				ReferenceVenueObjectId: undefined
			};
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
				ReferenceVenueObjectId: undefined
			};
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
				ReferenceVenueObjectId: undefined
			};
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

			const spy = vi.spyOn(console, 'warn');

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
			// getAsObject.mockReturnValueOnce({ 'max(GroupId)': 1 });

			// Newly created child sub group ID
			getAsObject.mockReturnValueOnce({ GroupId: 2 });

			// Newly created child sub group ID
			getAsObject.mockReturnValueOnce({ 'max(GroupId)': 1 });

			// start getSubArrayGroups
			step.mockReturnValueOnce(true);
			step.mockReturnValueOnce(false);
			const channel = {
				CabinetId: 1,
				GroupId: 2,
				Name: 'name',
				TargetChannel: 3,
				TargetId: 4
			};
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
			expect(run).toHaveBeenCalledTimes(2);
		});
	});
});

describe('AutoR1Control.handleString', () => {
	let control: AutoR1Control;

	beforeEach(() => {
		control = new AutoR1Control({} as any);
	});

	it('passing in a TargetId and TargetChannel should update TargetId and TargetChannel', () => {
		const options: any = { TargetId: 123, TargetChannel: 456 };
		control.handleString(options);
		expect(control.TargetId).toBe(123);
		expect(control.TargetChannel).toBe(456);
	});

	it('should replace %SourceGroupName% in DisplayName', () => {
		control.DisplayName = 'Test %SourceGroupName%';
		const options: any = { sourceGroup: { Name: 'SourceGroup' } };
		control.handleString(options);
		expect(control.DisplayName).toBe('Test SourceGroup');
	});

	it('should replace %ChannelGroupName% in DisplayName', () => {
		control.DisplayName = 'Test %ChannelGroupName%';
		const options: any = { channelGroup: { name: 'ChannelGroup', type: 'TOPS' } };
		control.handleString(options);
		expect(control.DisplayName).toBe('Test ChannelGroup');
	});

	it('should replace %ChannelName% in DisplayName', () => {
		control.DisplayName = 'Test %ChannelName%';
		const options: any = { channel: { Name: 'Channel' } };
		control.handleString(options);
		expect(control.DisplayName).toBe('Test Channel');
	});

	it('should handle %SourceGroupPageTarget%', () => {
		control.DisplayName = 'Test %SourceGroupPageTarget%';
		const options: any = { sourceGroup: { ViewId: 789 } };
		control.handleString(options);
		expect(control.DisplayName).toBe('Test ');
		expect(control.TargetId).toBe(789);
	});

	it('should handle %EqPageTarget%', () => {
		control.DisplayName = 'Test %EqPageTarget%';
		const options: any = { sourceGroup: { ViewId: 789 } };
		control.handleString(options);
		expect(control.DisplayName).toBe('Test ');
		expect(control.TargetId).toBe(790);
	});

	it('should handle %Target_ChannelGroup% with channel number and without L/R', () => {
		control.DisplayName = 'Test %Target_ChannelGroup_1%';
		const options: any = {
			sourceGroup: {
				channelGroups: [
					{
						isLeft: () => false,
						isRight: () => false,
						channels: [{ TargetId: 111, TargetChannel: 222 }]
					}
				]
			}
		};
		control.handleString(options);
		expect(control.DisplayName).toBe('Test ');
		expect(control.TargetId).toBe(111);
		expect(control.TargetChannel).toBe(222);
	});

	it('should handle %Target_ChannelGroup% with channel number and L', () => {
		control.DisplayName = 'Test %Target_ChannelGroup_L_1%';
		const options: any = {
			sourceGroup: {
				channelGroups: [
					{
						isLeft: () => true,
						isRight: () => false,
						channels: [{ TargetId: 111, TargetChannel: 222 }]
					},
					{
						isLeft: () => false,
						isRight: () => true,
						channels: [{ TargetId: 333, TargetChannel: 444 }]
					}
				]
			}
		};
		control.handleString(options);
		expect(control.DisplayName).toBe('Test ');
		expect(control.TargetId).toBe(111);
		expect(control.TargetChannel).toBe(222);
	});

	it('should handle %Target_ChannelGroup% with channel number and R', () => {
		control.DisplayName = 'Test %Target_ChannelGroup_R_1%';
		const options: any = {
			sourceGroup: {
				channelGroups: [
					{
						isLeft: () => true,
						isRight: () => false,
						channels: [{ TargetId: 111, TargetChannel: 222 }]
					},
					{
						isLeft: () => false,
						isRight: () => true,
						channels: [{ TargetId: 333, TargetChannel: 444 }]
					}
				]
			}
		};
		control.handleString(options);
		expect(control.DisplayName).toBe('Test ');
		expect(control.TargetId).toBe(333);
		expect(control.TargetChannel).toBe(444);
	});
});

describe('AutoR1ProjectFile.insertTemplate', () => {
	let projectFile: AutoR1ProjectFile;
	let template: AutoR1Template;

	beforeEach(async () => {
		prepare = vi.fn(() => ({ get, getAsObject, bind, step, free, run }));
		Database = vi.fn(() => ({ prepare }));
		(SQLjs as unknown as Mock).mockReturnValue({
			Database
		});

		getAsObject.mockReturnValueOnce({ GroupId: 1 });

		projectFile = await AutoR1ProjectFile.build(true as any);
		template = new AutoR1Template({} as any, [], 100, 100);

		// Mock methods
		projectFile.getHighestJoinedID = vi.fn().mockReturnValue(10);
		projectFile.insertControl = vi.fn();
	});

	it('should insert template with default values', () => {
		const control = new AutoR1Control();
		template.controls = [control];

		projectFile.insertTemplate(template, 1);

		expect(projectFile.insertControl).toHaveBeenCalledWith(
			expect.objectContaining({
				PosX: 0,
				PosY: 0,
				JoinedId: 11,
				ViewId: 1
			})
		);
	});

	it('should insert template with custom position', () => {
		const control = new AutoR1Control();
		template.controls = [control];

		projectFile.insertTemplate(template, 1, 50, 60);

		expect(projectFile.insertControl).toHaveBeenCalledWith(
			expect.objectContaining({
				PosX: 50,
				PosY: 60,
				JoinedId: 11,
				ViewId: 1
			})
		);
	});

	it('should use provided joinedId', () => {
		const control = new AutoR1Control();
		template.controls = [control];
		const options: TemplateOptions = { joinedId: 20 };

		projectFile.insertTemplate(template, 1, 0, 0, options);

		expect(projectFile.insertControl).toHaveBeenCalledWith(
			expect.objectContaining({
				JoinedId: 20
			})
		);
	});

	it('should apply custom Width and Height', () => {
		const control = new AutoR1Control();
		control.Width = 100;
		control.Height = 100;
		template.controls = [control];
		const options: TemplateOptions = { Width: 200, Height: 300 };

		projectFile.insertTemplate(template, 1, 0, 0, options);

		expect(projectFile.insertControl).toHaveBeenCalledWith(
			expect.objectContaining({
				Width: 200,
				Height: 300
			})
		);
	});

	it('should handle %SourceGroupName% string', () => {
		const control = new AutoR1Control();
		control.DisplayName = '%SourceGroupName%';
		template.controls = [control];
		const options: any = { sourceGroup: { Name: 'TestGroup' } };

		projectFile.insertTemplate(template, 1, 0, 0, options);

		expect(projectFile.insertControl).toHaveBeenCalledWith(
			expect.objectContaining({
				DisplayName: 'TestGroup'
			})
		);
	});

	it('should handle $ChannelGroupName% string', () => {
		const control = new AutoR1Control();
		control.DisplayName = '%ChannelGroupName%';
		template.controls = [control];
		const options: any = {
			channelGroup: { name: 'TestGroup', type: 'TOPS' }
		};

		projectFile.insertTemplate(template, 1, 0, 0, options);

		expect(projectFile.insertControl).toHaveBeenCalledWith(
			expect.objectContaining({
				DisplayName: 'TestGroup'
			})
		);
	});

	it('should handle $ChannelName% string', () => {
		const control = new AutoR1Control();
		control.DisplayName = '%ChannelName%';
		template.controls = [control];
		const options: any = {
			channel: { Name: 'TestGroup' }
		};

		projectFile.insertTemplate(template, 1, 0, 0, options);

		expect(projectFile.insertControl).toHaveBeenCalledWith(
			expect.objectContaining({
				DisplayName: 'TestGroup'
			})
		);
	});

	it('should handle $SourceGroupPageTarget% string', () => {
		const control = new AutoR1Control();
		control.DisplayName = '%SourceGroupPageTarget%';
		template.controls = [control];
		const options: any = {
			sourceGroup: { ViewId: 1 }
		};

		projectFile.insertTemplate(template, 1, 0, 0, options);

		expect(projectFile.insertControl).toHaveBeenCalledWith(
			expect.objectContaining({
				TargetId: 1
			})
		);
	});

	it('should handle string options', () => {
		const control = new AutoR1Control();
		control.DisplayName = '%SourceGroupName%';
		template.controls = [control];
		const options: any = { sourceGroup: { Name: 'TestGroup' } };

		projectFile.insertTemplate(template, 1, 0, 0, options);

		expect(projectFile.insertControl).toHaveBeenCalledWith(
			expect.objectContaining({
				DisplayName: 'TestGroup'
			})
		);
	});

	it('CPL control should be skipped for sources which do not use CPL', () => {
		const control = new AutoR1Control();
		control.isVisible = () => false;
		template.controls = [control];
		const options: any = { sourceGroup: { Name: 'TestGroup' } };

		projectFile.insertTemplate(template, 1, 0, 0, options);

		expect(projectFile.insertControl).not.toHaveBeenCalled();
	});
});

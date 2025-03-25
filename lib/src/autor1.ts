import { type Database } from 'sql.js';
import * as dbpr from './dbpr';
import { build, type Group } from './dbpr';

export enum INPUT_GAIN_TYPE {
	ANALOG = 0,
	DIGITAL = 1
}

export const NAV_BUTTON_Y = 15;

export const METER_VIEW_STARTX = 15;
export const METER_VIEW_STARTY = 15;
export const METER_SPACING_X = 15;
export const METER_SPACING_Y = 15;
export const MAIN_VIEW_STARTX = 10;
export const MAIN_VIEW_STARTY = 10;
const PARENT_GROUP_TITLE = 'AUTO';
export const AP_GROUP_TITLE = 'AP';
export const METER_WINDOW_TITLE = 'AUTO - Meters';
export const MAIN_WINDOW_TITLE = 'AUTO - Main';
export const EQ_WINDOW_TITLE = 'AUTO - EQ';

export const NAV_BUTTON_SPACING = 20;

export const MAIN_GROUP_ID = 1;

export const FALLBACK_GROUP_TITLE = 'FALLBACK';
export const MUTE_GROUP_TITLE = 'MUTE';
export const DS_GROUP_TITLE = 'DS DATA';
export const EQ_GROUP_TITLE = 'EQ';

export enum AutoR1TemplateTitles {
	MAIN_OVERVIEW = 'Main Overview',
	MAIN_TITLE = 'Main Title',
	MAIN_DS10 = 'Main DS10',
	MAIN_FALLBACK = 'Main Fallback',
	MAIN_ARRAYSIGHT = 'Main ArraySight',
	MAIN_ARRAYSIGHT_LR = 'Main ArraySight LR',
	MAIN_ARRAYSIGHT_FRAME = 'Main ArraySight Frame',
	MAIN_EQ = 'Main EQ',
	GROUP = 'Group',
	GROUP_CPL2 = 'Group CPL2',
	GROUP_AP = 'Group AP',
	GROUP_LR = 'Group LR',
	GROUP_LR_AP = 'Group LR AP',
	GROUP_LR_CPL2 = 'Group LR CPL2',
	GROUP_AP_CPL2 = 'Group AP CPL2',
	GROUP_LR_AP_CPL2 = 'Group LR AP CPL2',
	METERS_TITLE = 'Meters Title',
	METERS_GROUP = 'Meters Group',
	METER = 'Meter',
	THC = 'THC',
	NAV_BUTTONS = 'Nav Button',
	EQ1 = 'EQ1',
	EQ1_TITLE = 'EQ1 Title',
	EQ2 = 'EQ2',
	EQ2_TITLE = 'EQ2 Title'
}

type ChannelGroupTypes =
	| 'TYPE_SUBS_C'
	| 'TYPE_SUBS_R'
	| 'TYPE_SUBS_L'
	| 'TYPE_SUBS'
	| 'TYPE_TOPS_L'
	| 'TYPE_TOPS_R'
	| 'TYPE_TOPS'
	| 'TYPE_POINT_TOPS'
	| 'TYPE_POINT_SUBS'
	| 'TYPE_ADDITIONAL_AMPLIFIER';

export interface TemplateOptions {
	DisplayName?: string;
	TargetId?: number;
	TargetChannel?: number;
	Width?: number;
	Height?: number;
	joinedId?: number;
	sourceGroup?: SourceGroup;
	channelGroup?: ChannelGroup;
	channel?: Group;
	sourceGroupType?: dbpr.SourceGroupTypes | ChannelGroupTypes;
	strings?: { sourceGroupName?: string; channelGroupName?: string };
}

interface ChannelGroupInterface {
	groupId: number;
	name: string;
	channels: Group[];
	type: ChannelGroupTypes;
	arraySightId?: number;
}

export interface ProjectOptions {
	main: boolean;
	meter: boolean;
	eq: boolean;
	arraySightControls: boolean;
	inputGainType: 0 | 1;
}

/**
 *
 * @param input String to extract values from.
 * @param matchString String inside the input to look for.
 * @returns Obejct containing L/R/TOPs/SUBs as a string if it is found with the matched string, the prefix and, the suffix.
 */
const extractFromTargetString = (
	input: string,
	matchString: string = 'Target_ChannelGroup'
): {
	lOrR: string;
	channelNumber: number | null;
	prefix: string;
	suffix: string;
} => {
	// Escape special regex characters in the matchString
	const escapedMatchString = matchString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

	// Updated regex to support 'TOP', 'SUB', or a single letter
	const regex = new RegExp(
		`^(.*)%${escapedMatchString}(?:_((?:TOPs|SUBs|[A-Z])))?(?:_(\\d+))?%(.*)$`
	);
	const match = input.match(regex);

	if (match) {
		return {
			prefix: match[1],
			lOrR: match[2],
			channelNumber: match[3] ? parseInt(match[3]) : null,
			suffix: match[4]
		};
	} else {
		throw new Error("Input string doesn't match the expected pattern");
	}
};

export class ChannelGroup implements ChannelGroupInterface {
	groupId: number;
	name: string;
	channels: Group[];
	type: ChannelGroupTypes;
	arraySightId?: number;
	mainGroup?: ChannelGroup;
	leftGroup?: ChannelGroup;
	rightGroup?: ChannelGroup;
	centreGroup?: ChannelGroup;
	removeFromMute = false;
	removeFromFallback = false;
	removeFromDs = false;
	removeFromEq = false;

	constructor(options: ChannelGroupInterface) {
		this.groupId = options.groupId;
		this.name = options.name;
		this.channels = options.channels;
		this.type = options.type;
		this.arraySightId = options.arraySightId;
	}

	/**
	 * Returns true if the group is a Left or Right member of a stereo pair
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const chGrp = srcGrp.channelGroups[0]
	 * chGrp.isLorR()
	 * // => true
	 */
	public isLorR() {
		return (
			this.type === 'TYPE_SUBS_L' ||
			this.type === 'TYPE_SUBS_R' ||
			this.type === 'TYPE_SUBS_C' ||
			this.type === 'TYPE_TOPS_L' ||
			this.type === 'TYPE_TOPS_R'
		);
	}

	/**
	 * Returns true if the group is part of a Left or Right stereo pair
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const chGrp = srcGrp.channelGroups[0]
	 * chGrp.hasLorR()
	 * // => true
	 */
	public hasLorR() {
		return this.isLorR() || !!this.leftGroup || !!this.rightGroup;
	}

	/**
	 * Returns true if the group is the Right member of a stereo pair
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const chGrp = srcGrp.channelGroups[0]
	 * chGrp.isRight()
	 * // => true
	 */
	public isRight() {
		return this.type === 'TYPE_SUBS_R' || this.type === 'TYPE_TOPS_R';
	}

	/**
	 * Returns true if the group is the Left member of a stereo pair
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const chGrp = srcGrp.channelGroups[0]
	 * chGrp.isLeft()
	 * // => true
	 */
	public isLeft() {
		return this.type === 'TYPE_SUBS_L' || this.type === 'TYPE_TOPS_L';
	}

	/**
	 * Returns true if the group is a SUB group
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const chGrp = srcGrp.channelGroups[0]
	 * chGrp.isSUBs()
	 * // => true
	 */
	public isSUBs() {
		return (
			this.type === 'TYPE_SUBS' ||
			this.type === 'TYPE_SUBS_L' ||
			this.type === 'TYPE_SUBS_R' ||
			this.type === 'TYPE_SUBS_C' ||
			this.type === 'TYPE_POINT_SUBS'
		);
	}

	/**
	 * Returns true if the group is a TOP group
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const chGrp = srcGrp.channelGroups[0]
	 * chGrp.isTOPs()
	 * // => true
	 */
	public isTOPs() {
		return (
			this.type === 'TYPE_TOPS' ||
			this.type === 'TYPE_TOPS_L' ||
			this.type === 'TYPE_TOPS_R' ||
			this.type === 'TYPE_POINT_TOPS'
		);
	}

	/**
	 * Returns true if the group is a Point Source group
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const chGrp = srcGrp.channelGroups[0]
	 * chGrp.isPointSource()
	 * // => true
	 */
	public isPointSource() {
		return this.type === 'TYPE_POINT_SUBS' || this.type === 'TYPE_POINT_TOPS';
	}

	/**
	 * Returns true if the group is an Additional Amplifier group
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const chGrp = srcGrp.channelGroups[0]
	 * chGrp.isAdditionalAmplifier()
	 * // => true
	 */
	public isAdditionalAmplifier() {
		return this.type === 'TYPE_ADDITIONAL_AMPLIFIER';
	}

	/**
	 * Returns true if the group is an has the CPL filter available
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const chGrp = srcGrp.channelGroups[0]
	 * chGrp.hasCPL()
	 * // => true
	 */
	public hasCPL() {
		return (
			this.type === 'TYPE_TOPS' ||
			this.type === 'TYPE_TOPS_L' ||
			this.type === 'TYPE_TOPS_R' ||
			this.type === 'TYPE_POINT_TOPS' ||
			this.type === 'TYPE_ADDITIONAL_AMPLIFIER'
		);
	}

	/**
	 * Returns true if the group has a relative delay control available by default
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const chGrp = srcGrp.channelGroups[0]
	 * chGrp.hasRelativeDelay()
	 * // => true
	 */
	public hasRelativeDelay(sourceGroup: SourceGroup) {
		return sourceGroup.Type !== dbpr.SourceGroupTypes.ARRAY;
	}
}

export interface AutoR1SourceGroupRow extends dbpr.SourceGroup {
	SourceGroupId: number;
	Type: dbpr.SourceGroupTypes;
	Name: string;
	NextSourceGroupId: number;
	ArrayProcessingEnable: dbpr.ArrayProcessingFlag;
	ArraySightId: number;
	ArraySightIdR: number;
	System: string;
	ViewId: number;
	ViewName: string;
	R1GroupsMasterGroupId: number;
	R1GroupsMasterParentId: number;
	R1GroupsMasterName: string;
	R1GroupsLeftRightGroupId: number;
	R1GroupsLeftRightParentId: number;
	R1GroupsLeftRightName: string;
	R1GroupsMasterTopsGroupId: number;
	R1GroupsMasterTopsParentId: number;
	R1GroupsMasterTopsName: string;
	R1GroupsMasterSubsGroupId: number;
	R1GroupsMasterSubsParentId: number;
	R1GroupsMasterSubsName: string;
	R1GroupsLeftRightTopsGroupId: number;
	R1GroupsLeftRightTopsParentId: number;
	R1GroupsLeftRightTopsName: string;
	R1GroupsLeftRightSubsGroupId: number;
	R1GroupsLeftRightSubsParentId: number;
	R1GroupsLeftRightSubsName: string;
	R1GroupsLeftRightTopsLGroupId: number;
	R1GroupsLeftRightTopsLParentId: number;
	R1GroupsLeftRightTopsLName: string;
	R1GroupsLeftRightTopsRGroupId: number;
	R1GroupsLeftRightTopsRParentId: number;
	R1GroupsLeftRightTopsRName: string;
	R1GroupsLeftRightSubsLGroupId: number;
	R1GroupsLeftRightSubsLParentId: number;
	R1GroupsLeftRightSubsLName: string;
	R1GroupsLeftRightSubsRGroupId: number;
	R1GroupsLeftRightSubsRParentId: number;
	R1GroupsLeftRightSubsRName: string;
	AutoR1SubCenterGroupId: number;
	AutoR1SubCenterName: string;
	AutoR1SubLeftGroupId: number;
	AutoR1SubLeftName: string;
	AutoR1SubRightGroupId: number;
	AutoR1SubRightName: string;
	SUBsCrossover: dbpr.Crossover;
}

/**
 * SourceGroup class
 *
 * @class SourceGroup
 * @constructor
 * @param row {SourceGroupRtn} The row returned from the database
 * @return {void}
 * @example
 *     let sourceGroup = new SourceGroup(row);
 *    sourceGroup.channelGroups.forEach((channelGroup) => {
 *       channelGroup.channels.forEach((channel) => {
 *          console.log(channel);
 *      });
 *  });
 */
export class SourceGroup implements dbpr.SourceGroup {
	SourceGroupId: number;
	Type: dbpr.SourceGroupTypes;
	Name: string;
	OrderIndex: number;
	RemarkableChangeDate: number;
	NextSourceGroupId: number;
	ArrayProcessingEnable: dbpr.ArrayProcessingFlag;
	ArraySightId: number;
	ArraySightIdR: number;
	LinkMode: number;
	Symmetric: dbpr.SymmetricFlag;
	Mounting: dbpr.MountingFlag;
	RelativeDelay: number | null;
	System: string;
	ViewId: number;
	xover: dbpr.Crossover;
	masterGroupId: number = -1;
	childGroupIds: number[] = [];
	mute: boolean = true;
	fallback: boolean = true;
	dsData: boolean = true;
	eq: boolean = true;

	channelGroups: ChannelGroup[] = [];
	childGroups: ChannelGroup[] = [];

	constructor(row: AutoR1SourceGroupRow) {
		this.ViewId = row.ViewId;
		this.Name = row.Name;
		this.OrderIndex = row.OrderIndex;
		this.SourceGroupId = row.SourceGroupId;
		this.NextSourceGroupId = row.NextSourceGroupId;
		this.Type = row.Type;
		this.ArrayProcessingEnable = row.ArrayProcessingEnable;
		this.ArraySightId = row.ArraySightId;
		this.ArraySightIdR = row.ArraySightIdR;
		this.LinkMode = row.LinkMode;
		this.Symmetric = row.Symmetric;
		this.Mounting = row.Mounting;
		this.RelativeDelay = row.RelativeDelay;
		this.System = row.System;
		this.RemarkableChangeDate = row.RemarkableChangeDate;
		this.xover = row.SUBsCrossover || 'CUT';

		row.R1GroupsMasterTopsGroupId;

		if (row.R1GroupsMasterTopsGroupId && row.R1GroupsMasterTopsName) {
			const mainGroup = new ChannelGroup({
				groupId: row.R1GroupsMasterTopsGroupId,
				name: row.R1GroupsMasterTopsName,
				type: 'TYPE_TOPS',
				channels: []
			});
			this.channelGroups.push(mainGroup);

			if (row.R1GroupsLeftRightTopsLGroupId && row.R1GroupsLeftRightTopsLName) {
				const leftGroup = new ChannelGroup({
					groupId: row.R1GroupsLeftRightTopsLGroupId,
					name: row.R1GroupsLeftRightTopsLName,
					type: 'TYPE_TOPS_L',
					channels: []
				});

				leftGroup.mainGroup = mainGroup;

				this.channelGroups.push(leftGroup);

				mainGroup.leftGroup = leftGroup;
			}
			if (row.R1GroupsLeftRightTopsRGroupId && row.R1GroupsLeftRightTopsRName) {
				const rightGroup = new ChannelGroup({
					groupId: row.R1GroupsLeftRightTopsRGroupId,
					name: row.R1GroupsLeftRightTopsRName,
					type: 'TYPE_TOPS_R',
					channels: []
				});

				rightGroup.mainGroup = mainGroup;

				this.channelGroups.push(rightGroup);

				mainGroup.rightGroup = rightGroup;
			}
		}

		if (row.R1GroupsMasterSubsGroupId && row.R1GroupsMasterSubsName) {
			const subGroup = new ChannelGroup({
				groupId: row.R1GroupsMasterSubsGroupId,
				name: row.R1GroupsMasterSubsName,
				type: 'TYPE_SUBS',
				channels: []
			});
			this.channelGroups.push(subGroup);
			let leftGroup: ChannelGroup;
			let rightGroup: ChannelGroup;

			if (row.R1GroupsLeftRightSubsLGroupId && row.R1GroupsLeftRightSubsLName) {
				leftGroup = new ChannelGroup({
					groupId: row.R1GroupsLeftRightSubsLGroupId,
					name: row.R1GroupsLeftRightSubsLName,
					type: 'TYPE_SUBS_L',
					channels: []
				});

				leftGroup.mainGroup = subGroup;

				this.channelGroups.push(leftGroup);

				subGroup.leftGroup = leftGroup;
			}
			if (row.R1GroupsLeftRightSubsRGroupId && row.R1GroupsLeftRightSubsRName) {
				rightGroup = new ChannelGroup({
					groupId: row.R1GroupsLeftRightSubsRGroupId,
					name: row.R1GroupsLeftRightSubsRName,
					type: 'TYPE_SUBS_R',
					channels: []
				});

				rightGroup.mainGroup = subGroup;

				this.channelGroups.push(rightGroup);

				subGroup.rightGroup = rightGroup;
			}
		}

		if (row.AutoR1SubLeftGroupId && row.AutoR1SubRightGroupId) {
			const subGroup = new ChannelGroup({
				groupId: row.R1GroupsMasterGroupId,
				name: row.R1GroupsMasterName,
				type: 'TYPE_SUBS',
				channels: []
			});
			this.channelGroups.push(subGroup);
			let leftGroup: ChannelGroup;
			let rightGroup: ChannelGroup;

			leftGroup = new ChannelGroup({
				groupId: row.AutoR1SubLeftGroupId,
				name: row.AutoR1SubLeftName,
				type: 'TYPE_SUBS_L',
				channels: []
			});

			leftGroup.mainGroup = subGroup;

			this.channelGroups.push(leftGroup);

			subGroup.leftGroup = leftGroup;

			rightGroup = new ChannelGroup({
				groupId: row.AutoR1SubRightGroupId,
				name: row.AutoR1SubRightName,
				type: 'TYPE_SUBS_R',
				channels: []
			});

			rightGroup.mainGroup = subGroup;

			this.channelGroups.push(rightGroup);

			subGroup.rightGroup = rightGroup;

			if (row.AutoR1SubCenterGroupId && row.AutoR1SubCenterName) {
				const centreGroup = new ChannelGroup({
					groupId: row.AutoR1SubCenterGroupId,
					name: row.AutoR1SubCenterName,
					type: 'TYPE_SUBS_C',
					channels: []
				});

				centreGroup.mainGroup = subGroup;
				centreGroup.leftGroup = subGroup;
				centreGroup.rightGroup = subGroup;

				this.channelGroups.push(centreGroup);

				subGroup.centreGroup = centreGroup;
			}
		}

		// Skip final group if subs or tops groups have been found, only use for point sources
		if (!this.channelGroups.length && row.R1GroupsMasterGroupId && row.R1GroupsMasterName) {
			const type: ChannelGroupTypes =
				this.System !== 'mixed'
					? this.System === 'SUBs'
						? 'TYPE_POINT_SUBS'
						: 'TYPE_POINT_TOPS'
					: 'TYPE_ADDITIONAL_AMPLIFIER';
			this.channelGroups.push(
				new ChannelGroup({
					groupId: row.R1GroupsMasterGroupId,
					name: row.R1GroupsMasterName,
					type,
					channels: []
				})
			);
		}
	}

	/**
	 * Determines if the source group is a stereo group
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const srcGrp = p.sourceGroups[0]
	 * srcGrp.isStereo()
	 * // => true
	 */
	public isStereo() {
		return this.channelGroups.length >= 3;
	}

	/**
	 * Determines if the source group has array processing enabled
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const srcGrp = p.sourceGroups[0]
	 * srcGrp.hasArrayProcessingEnabled()
	 * // => true
	 */
	public hasArrayProcessingEnabled() {
		return !!this.ArrayProcessingEnable;
	}

	/**
	 * Determines if the source group has a CPLv2 filter available
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const srcGrp = p.sourceGroups[0]
	 * srcGrp.hasCPLv2()
	 * // => true
	 */
	public hasCPLv2() {
		return (
			(this.System === 'GSL' || this.System === 'KSL' || this.System === 'XSL') &&
			this.Type === dbpr.SourceGroupTypes.ARRAY
		);
	}

	/**
	 * Determines if the source group has any SUBs associated
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const srcGrp = p.sourceGroups[0]
	 * srcGrp.hasSUBs()
	 * // => true
	 */
	public hasSUBs() {
		return !!this.channelGroups.find((chGrp) => chGrp.isSUBs());
	}

	/**
	 * Determines if the source group has any TOPs associated
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const srcGrp = p.sourceGroups[0]
	 * srcGrp.hasTOPs()
	 * // => true
	 */
	public hasTOPs() {
		return !!this.channelGroups.find((chGrp) => chGrp.isTOPs());
	}

	/**
	 * Determines if load match controls are available for this source group
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const srcGrp = p.sourceGroups[0]
	 * srcGrp.hasLoadMatch()
	 * // => true
	 */
	public hasLoadMatch() {
		return (
			this.Type !== dbpr.SourceGroupTypes.ADDITIONAL_AMPLIFIER &&
			this.Type !== dbpr.SourceGroupTypes.UNUSED_CHANNELS
		);
	}

	/**
	 * Determines if an EQ view will have been created for this source group
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * const srcGrp = p.sourceGroups[0]
	 * srcGrp.hasEQView()
	 * // => true
	 */
	public hasEQView() {
		return (
			this.Type !== dbpr.SourceGroupTypes.ADDITIONAL_AMPLIFIER &&
			this.Type !== dbpr.SourceGroupTypes.UNUSED_CHANNELS
		);
	}

	/**
	 * Returns true if the group has a relative delay control available by default
	 * @returns boolean
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.getSrcGrpInfo()
	 * srcGrp.hasRelativeDelay()
	 * // => true
	 */
	public hasRelativeDelay() {
		return this.Type !== dbpr.SourceGroupTypes.ARRAY;
	}

	public hasRelativeLevel() {
		return (
			(this.Type === dbpr.SourceGroupTypes.ARRAY && this.hasTOPs() && this.hasSUBs()) ||
			this.Type === dbpr.SourceGroupTypes.SUBARRAY ||
			this.Type === dbpr.SourceGroupTypes.POINT_SOURCE
		);
	}
}

class TemporaryTemplate {
	private _isLR = false;
	private _isAP = false;
	private _isCPL2 = false;
	private _name?: string;
	private _controls?: AutoR1Control[];

	setLR = (isLR: boolean) => (this._isLR = isLR);
	setAP = (isAP: boolean) => (this._isAP = isAP);
	setCPL2 = (isCPL2: boolean) => (this._isCPL2 = isCPL2);
	setName = (name: string) => (this._name = name);

	get isLR() {
		return this._isLR;
	}
	get isAP() {
		return this._isAP;
	}
	get isCPL2() {
		return this._isCPL2;
	}
	get name() {
		let name = this._name;
		if (this.isLR) name += ' LR';
		if (this.isAP) name += ' AP';
		if (this.isCPL2) name += ' CPL2';
		return name;
	}
	get controls() {
		return this._controls;
	}

	public load(templateFile: AutoR1TemplateFile) {
		if (!this.name) {
			throw new Error('Template name not set');
		}
		this._controls = templateFile.getTemplateControlsFromName(this.name);
	}
}

export class AutoR1ProjectFile extends dbpr.ProjectFile {
	public sourceGroups: SourceGroup[] = [];
	public additions: boolean = false;

	constructor(db: Database) {
		super(db);

		if (
			this.getMainView() ||
			this.getMeterView() ||
			this.getEQView() ||
			this.getFallbackGroupID() ||
			this.getMuteGroupID() ||
			this.getDsGroupID() ||
			this.getEqGroupID()
		) {
			this.additions = true;
		}
	}

	static build = (fb: Buffer) => build<AutoR1ProjectFile>(fb, (db) => new AutoR1ProjectFile(db));

	public getSrcGrpInfo = () => {
		this.db.exec(`PRAGMA case_sensitive_like=ON;`);

		if (this.sourceGroups.length) {
			console.warn('getSrcGrpInfo has already been called.');
			return;
		}

		const query = `
        SELECT SourceGroups.SourceGroupId, SourceGroups.Type, SourceGroups.Name, SourceGroups.NextSourceGroupId, SourceGroups.ArrayProcessingEnable, SourceGroups.ArraySightId, ArraySightIdR, SourceGroupsAdditionalData.System, 
		Views.ViewId, Views.Name,
		R1GroupsMaster.GroupId as R1GroupsMasterGroupId, R1GroupsMaster.ParentId as R1GroupsMasterParentId, R1GroupsMaster.Name as R1GroupsMasterName,
		R1GroupsLeftRight.GroupId as R1GroupsLeftRightGroupId, R1GroupsLeftRight.ParentId as R1GroupsLeftRightParentId, R1GroupsLeftRight.Name as R1GroupsLeftRightName,
		R1GroupsMasterTops.GroupId as R1GroupsMasterTopsGroupId, R1GroupsMasterTops.ParentId as R1GroupsMasterTopsParentId, R1GroupsMasterTops.Name as R1GroupsMasterTopsName,
		R1GroupsMasterSubs.GroupId as R1GroupsMasterSubsGroupId, R1GroupsMasterSubs.ParentId as R1GroupsMasterSubsParentId, R1GroupsMasterSubs.Name as R1GroupsMasterSubsName,
		R1GroupsLeftRightTops.GroupId as R1GroupsLeftRightTopsGroupId, R1GroupsLeftRightTops.ParentId as R1GroupsLeftRightTopsParentId, R1GroupsLeftRightTops.Name as R1GroupsLeftRightTopsName,
		R1GroupsLeftRightSubs.GroupId as R1GroupsLeftRightSubsGroupId, R1GroupsLeftRightSubs.ParentId as R1GroupsLeftRightSubsParentId, R1GroupsLeftRightSubs.Name as R1GroupsLeftRightSubsName,
		R1GroupsLeftRightTopsL.GroupId as R1GroupsLeftRightTopsLGroupId, R1GroupsLeftRightTopsL.ParentId as R1GroupsLeftRightTopsLParentId, R1GroupsLeftRightTopsL.Name as R1GroupsLeftRightTopsLName,
		R1GroupsLeftRightTopsR.GroupId as R1GroupsLeftRightTopsRGroupId, R1GroupsLeftRightTopsR.ParentId as R1GroupsLeftRightTopsRParentId, R1GroupsLeftRightTopsR.Name as R1GroupsLeftRightTopsRName,
		R1GroupsLeftRightSubsL.GroupId as R1GroupsLeftRightSubsLGroupId, R1GroupsLeftRightSubsL.ParentId as R1GroupsLeftRightSubsLParentId, R1GroupsLeftRightSubsL.Name as R1GroupsLeftRightSubsLName,
		R1GroupsLeftRightSubsR.GroupId as R1GroupsLeftRightSubsRGroupId, R1GroupsLeftRightSubsR.ParentId as R1GroupsLeftRightSubsRParentId, R1GroupsLeftRightSubsR.Name as R1GroupsLeftRightSubsRName,
		AutoR1SubsL.GroupId as AutoR1SubLeftGroupId, AutoR1SubsL.ParentId as AutoR1SubLeftParentId, AutoR1SubsL.Name as AutoR1SubLeftName,
		AutoR1SubsR.GroupId as AutoR1SubRightGroupId, AutoR1SubsR.ParentId as AutoR1SubRightParentId, AutoR1SubsR.Name as AutoR1SubRightName,
		AutoR1SubsC.GroupId as AutoR1SubCenterGroupId, AutoR1SubsC.ParentId as AutoR1SubCenterParentId, AutoR1SubsC.Name as AutoR1SubCenterName,
		CrossoverControls.DisplayName as SUBsCrossover
-- SELECT *
        FROM SourceGroups
        LEFT OUTER JOIN (SELECT ArraySightId as ArraySightIdR, SourceGroupId as SGid FROM SourceGroups) ON SourceGroups.NextSourceGroupId = SGid
        /* Combine additional source group data */
        JOIN SourceGroupsAdditionalData 
        ON SourceGroups.SourceGroupId = SourceGroupsAdditionalData.SourceGroupId
        /* Combine view info */
        JOIN Views
        ON Views.Name = SourceGroups.Name
		/* Skip second half of stereo pairs */
        AND SourceGroups.OrderIndex != -1
        /* R1 Master Sub Groups */
        LEFT OUTER JOIN  (SELECT GroupId, Name, ParentId FROM Groups WHERE ParentId = (SELECT GroupId FROM Groups WHERE Name == 'Master')) R1GroupsMaster
        ON SourceGroups.name = R1GroupsMaster.Name
        /* R1 Left/Right Sub Groups */
		LEFT OUTER JOIN  (SELECT GroupId, Name, ParentId FROM Groups WHERE ParentId = (SELECT GroupId FROM Groups WHERE Name == 'Left/Right')) R1GroupsLeftRight
        ON SourceGroups.name = R1GroupsLeftRight.Name
		/* Fetch TOPs and SUBs groups under Master group */
		LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% TOPs') R1GroupsMasterTops
		ON R1GroupsMasterTops.ParentId = R1GroupsMaster.GroupId
		LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% SUBs') R1GroupsMasterSubs
		ON R1GroupsMasterSubs.ParentId = R1GroupsMaster.GroupId
		/* Fetch TOPs and SUBs groups under Left/Right group */
		LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% TOPs') R1GroupsLeftRightTops
		ON R1GroupsLeftRightTops.ParentId = R1GroupsLeftRight.GroupId
		LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% SUBs') R1GroupsLeftRightSubs
		ON R1GroupsLeftRightSubs.ParentId = R1GroupsLeftRight.GroupId
		/* Fetch TOPs L/R and SUBs L/R groups under TOPs/SUBs group */
		LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% TOPs L') R1GroupsLeftRightTopsL
		ON R1GroupsLeftRightTopsL.ParentId = R1GroupsLeftRightTops.GroupId
		LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% TOPs R') R1GroupsLeftRightTopsR
		ON R1GroupsLeftRightTopsR.ParentId = R1GroupsLeftRightTops.GroupId
		LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% SUBs L') R1GroupsLeftRightSubsL
		ON R1GroupsLeftRightSubsL.ParentId = R1GroupsLeftRightSubs.GroupId
		LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% SUBs R') R1GroupsLeftRightSubsR
		ON R1GroupsLeftRightSubsR.ParentId = R1GroupsLeftRightSubs.GroupId
        /* Fetch L/R/C SUB groups we created earlier */
        LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE ParentId = (SELECT GroupId FROM Groups WHERE Name == 'Auto R1')  AND Name LIKE '% SUBs L' ) AutoR1SubsL
		ON SourceGroups.Type = 3
        LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE ParentId = (SELECT GroupId FROM Groups WHERE Name == 'Auto R1')  AND Name LIKE '% SUBs R' ) AutoR1SubsR
		ON SourceGroups.Type = 3
        LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE ParentId = (SELECT GroupId FROM Groups WHERE Name == 'Auto R1')  AND Name LIKE '% SUBs C' ) AutoR1SubsC
		ON SourceGroups.Type = 3
        /* Fetch crossover info for subs */
        LEFT OUTER JOIN (SELECT * FROM Controls WHERE DisplayName = '100Hz' OR DisplayName = 'Infra') CrossoverControls
        ON CrossoverControls.ViewId  = Views.ViewId
        /* Skip unused channels group */
        WHERE SourceGroups.name != 'Unused channels'
        ORDER BY SourceGroups.OrderIndex ASC`;

		const stmt = this.db.prepare(query);

		const rtn = dbpr.getAllAsObjects<AutoR1SourceGroupRow>(stmt);

		if (!rtn || !rtn.length) {
			throw new Error('Could not find any source groups');
		}

		for (const row of rtn) {
			this.sourceGroups.push(new SourceGroup(row));
		}

		const subQuery = `
            WITH RECURSIVE devs(GroupId, Name, ParentId, TargetId, TargetChannel, Type, Flags) AS (
                SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type, Groups.Flags FROM Groups WHERE Groups.ParentId = ?
                UNION
                SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type, Groups.Flags FROM Groups, devs WHERE Groups.ParentId = devs.GroupId
            )
            SELECT GroupId, devs.Name, TargetId, TargetChannel, CabinetsAdditionalData.Name, Cabinets.CabinetId FROM devs
            JOIN Cabinets
            ON devs.TargetId = Cabinets.DeviceId
            AND devs.TargetChannel = Cabinets.AmplifierChannel
            JOIN CabinetsAdditionalData
            ON Cabinets.CabinetId = CabinetsAdditionalData.CabinetId
            AND Linked = 0
            WHERE devs.type = 1
            ORDER BY devs.Name`;

		// Discover all channels of previously discovered groups
		this.sourceGroups.forEach((srcGrp) => {
			srcGrp.channelGroups.forEach((devGrp) => {
				const stmt = this.db.prepare(subQuery);

				const rtn = dbpr.getAllAsObjects<Group>(stmt, [devGrp.groupId]);
				for (const row of rtn) {
					devGrp.channels.push(row);
				}
				console.debug(`Assigned ${rtn.length} channels to ${devGrp.name}`);
			});
		});

		// Get groups from under the 'Master' default R1 group
		const masterGroupQuery = `SELECT SourceGroups.SourceGroupId, SourceGroups.Name, Groups.GroupId FROM SourceGroups
        JOIN Groups
         ON SourceGroups.name = Groups.Name 
         /* Keep discovered groups that have 'Master' as parent */
        AND ParentId = (SELECT GroupId FROM Groups WHERE Name = 'Master')
        /* Skip right side of stereo groups */
        AND OrderIndex != -1`;

		const masterGroupQueryStmt = this.db.prepare(masterGroupQuery);
		const masterSourceGroups = dbpr.getAllAsObjects<{
			SourceGroupId: number;
			Name: string;
			GroupId: number;
		}>(masterGroupQueryStmt);

		masterSourceGroups.forEach((mstrGrp) => {
			const sourceGroup = this.sourceGroups.find(
				(srcGrp) => srcGrp.SourceGroupId === mstrGrp.SourceGroupId
			);
			if (sourceGroup) {
				sourceGroup.masterGroupId = mstrGrp.GroupId;
			}
		});

		// Get child groups of above 'Master' groups
		const masterGroupId = this.getGroupIdFromName('Master');
		const childGroupQuery = `SELECT DISTINCT G.GroupId, G.ParentId,G.Name
        FROM Groups G
        JOIN (
            SELECT *
            FROM Groups G1
            JOIN SourceGroups SG ON G1.Name = SG.Name
            WHERE G1.ParentId = ?
        ) AS SubQuery ON G.ParentId = SubQuery.GroupId;`;

		const childGroupsStmt = this.db.prepare(childGroupQuery);
		const childGroups = dbpr.getAllAsObjects<{
			GroupId: number;
			Name: string;
			ParentId: number;
		}>(childGroupsStmt, [masterGroupId!]);

		childGroups.forEach((childGroup) => {
			const sourceGroup = this.sourceGroups.find(
				(srcGrp) => srcGrp.masterGroupId === childGroup.ParentId
			);
			if (sourceGroup) {
				sourceGroup.childGroupIds.push(childGroup.GroupId);

				let type: ChannelGroupTypes = 'TYPE_TOPS';

				if (childGroup.Name.endsWith('TOPs')) {
					type = 'TYPE_TOPS';
				} else if (childGroup.Name.endsWith('SUBs')) {
					type = 'TYPE_SUBS';
				}

				const group = new ChannelGroup({
					groupId: childGroup.GroupId,
					name: childGroup.Name,
					type,
					channels: []
				});

				sourceGroup.childGroups.push(group);
			}
		});
	};

	public insertTemplate = (
		template: AutoR1Template,
		ViewId: number,
		posX = 0,
		posY = 0,
		options?: TemplateOptions
	): void => {
		const { Width, Height } = options || {};
		let { joinedId } = options || {};

		// Increase global joined ID
		const highestJoinedId = this.getHighestJoinedID();
		if (!highestJoinedId) {
			throw new Error('Could not find a joined ID');
		}

		if (!joinedId) joinedId = highestJoinedId + 1;

		// Wrap in transaction to speed up insertion
		for (const templateControl of template.controls) {
			const control = Object.assign(new AutoR1Control(), templateControl);

			if (options?.sourceGroup && !control.isVisible(options?.sourceGroup)) {
				continue;
			}

			if (options) control.handleString(options);

			control.PosX = control.PosX + posX;
			control.PosY = control.PosY + posY;
			control.Width = Width ?? control.Width;
			control.Height = Height ?? control.Height;
			control.JoinedId = joinedId!;
			control.ViewId = ViewId;

			if (
				control.TargetProperty === dbpr.TargetPropertyType.CHANNEL_STATUS_MS_DELAY &&
				control.TargetType === dbpr.TargetTypes.GROUP
			) {
				control.Flags = options?.sourceGroup?.hasRelativeDelay()
					? dbpr.ControlFlags.RELATIVE
					: dbpr.ControlFlags.ABSOLUTE;
			}

			if (
				control.TargetProperty === dbpr.TargetPropertyType.CONFIG_POTI_LEVEL &&
				control.TargetType === dbpr.TargetTypes.GROUP
			) {
				control.Flags = options?.sourceGroup?.hasRelativeLevel()
					? dbpr.ControlFlags.RELATIVE
					: dbpr.ControlFlags.ABSOLUTE;
			}

			this.insertControl(control);
		}
	};

	/**
	 * Creates a new group and inserts all channels except those with the removeFromMute flag set
	 * @param parentGroupId Group id to create the group under
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.createMainGroup()
	 */
	public createMainMuteGroup(parentGroupId = MAIN_GROUP_ID): void {
		const group = {
			Name: MUTE_GROUP_TITLE,
			ParentId: parentGroupId
		};
		const ParentId = this.createGroup(group);

		this.sourceGroups
			.filter((srcGrp) => srcGrp.mute)
			.forEach((srcGrp) =>
				srcGrp.channelGroups.forEach((chGrp) =>
					chGrp.channels.forEach((ch) => this.addChannelToGroup({ ...ch, ParentId }))
				)
			);
	}

	/**
	 * Creates a new group and inserts all channels except those with the removeFromFallback flag set
	 * @param parentGroupId Group id to create the group under
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.createMainGroup()
	 */
	public createMainFallbackGroup(parentGroupId = MAIN_GROUP_ID): void {
		const ParentId = this.createGroup({
			Name: FALLBACK_GROUP_TITLE,
			ParentId: parentGroupId
		});

		this.sourceGroups
			.filter((srcGrp) => srcGrp.fallback)
			.forEach((srcGrp) =>
				srcGrp.channelGroups.forEach((chGrp) =>
					chGrp.channels.forEach((ch) => this.addChannelToGroup({ ...ch, ParentId }))
				)
			);
	}

	/**
	 * Creates a new group and inserts all channels except those with the removeFromDs flag set
	 * @param parentGroupId Group id to create the group under
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.createMainDsGroup()
	 */
	public createMainDsGroup(parentGroupId = MAIN_GROUP_ID): void {
		const ParentId = this.createGroup({
			Name: DS_GROUP_TITLE,
			ParentId: parentGroupId
		});

		this.sourceGroups
			.filter((srcGrp) => srcGrp.dsData)
			.forEach((srcGrp) =>
				srcGrp.channelGroups.forEach((chGrp) =>
					chGrp.channels.forEach((ch) => this.addChannelToGroup({ ...ch, ParentId }))
				)
			);
	}

	/**
	 * Creates a new group and inserts all channels except those with the removeFromEq flag set
	 * @param parentGroupId Group id to create the group under
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * p.createMainEqGroup()
	 */
	public createMainEqGroup(parentGroupId = MAIN_GROUP_ID): void {
		const ParentId = this.createGroup({
			Name: EQ_GROUP_TITLE,
			ParentId: parentGroupId
		});

		this.sourceGroups
			.filter((srcGrp) => srcGrp.eq)
			.forEach((srcGrp) =>
				srcGrp.channelGroups.forEach((chGrp) =>
					chGrp.channels.forEach((ch) => this.addChannelToGroup({ ...ch, ParentId }))
				)
			);
	}

	/**
	 * Get the ID of the mute group
	 * @returns GroupId of mute group
	 * @throws Will throw an error if the mute group cannot be found.
	 *
	 * @example
	 * const p = new ProjectFile('path/to/project.dbpr');
	 * const muteGroupId = p.getMainMuteGroupID();
	 * console.log(muteGroupId);
	 * // => 1
	 */
	public getMuteGroupID(): number | undefined {
		return this.getGroupIdFromName(MUTE_GROUP_TITLE);
	}

	/**
	 * Get the ID of the fallback group
	 * @returns GroupId of fallback group
	 * @throws Will throw an error if the fallback group cannot be found.
	 *
	 * @example
	 * const p = new ProjectFile('path/to/project.dbpr');
	 * const fallbackGroupId = p.getMainFallbackGroupID();
	 * console.log(fallbackGroupId);
	 * // => 1
	 */
	public getFallbackGroupID(): number | undefined {
		return this.getGroupIdFromName(FALLBACK_GROUP_TITLE);
	}

	/**
	 * Get the ID of the DS data group
	 * @returns GroupId of ds data group
	 * @throws Will throw an error if the ds data group cannot be found.
	 *
	 * @example
	 * const p = new ProjectFile('path/to/project.dbpr');
	 * const dsGroupId = p.getDsGroupID();
	 * console.log(dsGroupId);
	 * // => 1
	 */
	public getDsGroupID(): number | undefined {
		return this.getGroupIdFromName(DS_GROUP_TITLE);
	}

	/**
	 * Get the ID of the EQ data group
	 * @returns GroupId of ds data group
	 * @throws Will throw an error if the ds data group cannot be found.
	 *
	 * @example
	 * const p = new ProjectFile('path/to/project.dbpr');
	 * const eqGroupId = p.getEqGroupID();
	 * console.log(eqGroupId);
	 * // => 1
	 */
	public getEqGroupID(): number | undefined {
		return this.getGroupIdFromName(EQ_GROUP_TITLE);
	}

	/**
	 * Cleans the R1 project by deleting all custom views, their controls, and any custom groups.
	 * @param proj R1 project file
	 * @param parentGroupId Group id of the parent custom group
	 */
	public clean(parentGroupId = MAIN_GROUP_ID) {
		console.log('Cleaning R1 project.');

		const mainViewId = this.getViewIdFromName(MAIN_WINDOW_TITLE);

		// Remove anything to do with the AutoR1 Main view
		if (mainViewId) {
			this.removeNavButtons();

			const ctrlStmt = this.db.prepare('DELETE FROM Controls WHERE "ViewId" = ?');
			ctrlStmt.bind([mainViewId]);
			ctrlStmt.run();
			console.log(`Deleted ${MAIN_WINDOW_TITLE} controls.`);

			const viewStmt = this.db.prepare('DELETE FROM Views WHERE "Name" = ?');
			viewStmt.bind([MAIN_WINDOW_TITLE]);
			viewStmt.run();
			console.log(`Deleted ${MAIN_WINDOW_TITLE} view.`);
		}

		const meterViewId = this.getViewIdFromName(METER_WINDOW_TITLE);

		// Remove anything to do with the AutoR1 Meter view
		if (meterViewId) {
			const ctrlStmt = this.db.prepare('DELETE FROM Controls WHERE "ViewId" = ?');
			ctrlStmt.bind([meterViewId]);
			ctrlStmt.run();
			console.log(`Deleted ${METER_WINDOW_TITLE} view controls.`);

			const viewStmt = this.db.prepare('DELETE FROM Views WHERE "Name" = ?');
			viewStmt.bind([METER_WINDOW_TITLE]);
			viewStmt.run();
			console.log(`Deleted ${METER_WINDOW_TITLE} view.`);
		}

		const eqViewId = this.getViewIdFromName(EQ_WINDOW_TITLE);

		// Remove anything to do with the AutoR1 EQ view
		if (eqViewId) {
			const ctrlStmt = this.db.prepare('DELETE FROM Controls WHERE "ViewId" = ?');
			ctrlStmt.bind([eqViewId]);
			ctrlStmt.run();
			console.log(`Deleted ${EQ_WINDOW_TITLE} view controls.`);

			const viewStmt = this.db.prepare('DELETE FROM Views WHERE "Name" = ?');
			viewStmt.bind([EQ_WINDOW_TITLE]);
			viewStmt.run();
			console.log(`Deleted ${EQ_WINDOW_TITLE} view.`);
		}

		const subArrayNameStmt = this.db.prepare('SELECT Name FROM SourceGroups WHERE Type = ?');
		const subArrayName = subArrayNameStmt.getAsObject([dbpr.SourceGroupTypes.SUBARRAY]) as {
			Name: string;
		};

		if (subArrayName) {
			const getGroupIdStmt = this.db.prepare(
				'SELECT GroupId FROM Groups WHERE Name = ? AND ParentId = ?'
			);
			const groupId = getGroupIdStmt.getAsObject([subArrayName.Name, parentGroupId]) as {
				GroupId: number;
			};

			if (groupId && groupId.GroupId) {
				this.deleteGroup(groupId.GroupId);
			}
		}

		this.deleteGroup(parentGroupId);

		console.log(`Deleted ${PARENT_GROUP_TITLE} group.`);
	}

	/**
	 * Inserts view navigation buttons on all views
	 * @param templates AutoR1 template file containing the navigation button template
	 * @returns void
	 * @throws Will throw an error if the Nav Button template cannot be found.
	 * @throws Will throw an error if the Main or Meter views cannot be found.
	 */
	public createNavButtons(templates: AutoR1TemplateFile): void {
		const SPACING = 25;
		const POS_X = 15;

		const mainView = this.getMainView();
		const meterView = this.getMeterView();
		const eqView = this.getEQView();

		const views = this.getAllRemoteViews()!.filter(
			(v) =>
				v.ViewId !== mainView?.ViewId &&
				v.ViewId !== meterView?.ViewId &&
				v.ViewId !== eqView?.ViewId
		);
		const buttonWidth = templates.getTemplateWidthHeight(AutoR1TemplateTitles.NAV_BUTTONS).width;

		let standardPagesX = POS_X;
		let mainViewPosX = 230;
		const mainViewPosY = 20;
		let meterViewPosX = 230;
		const meterViewPosY = 20;
		let eqViewPosX = 230;
		const eqViewPosY = 20;

		const insertNavButton = (
			TargetId: number,
			sourceViewId: number,
			DisplayName: string,
			posX: number,
			posY: number
		) => {
			const navButtonTemplate = templates.getTemplateByName(AutoR1TemplateTitles.NAV_BUTTONS);

			const options: TemplateOptions = {
				DisplayName,
				TargetId,
				TargetChannel: dbpr.TargetChannels.NONE
			};

			this.insertTemplate(navButtonTemplate, sourceViewId, posX, posY, options);
		};

		const increaseControlPosYByAmount = this.db.prepare(
			'UPDATE Controls SET PosY = PosY + ? WHERE ViewId = ?'
		);

		const navButtonTemplate = templates.getTemplateByName(AutoR1TemplateTitles.NAV_BUTTONS);

		if (!navButtonTemplate) {
			throw new Error(`${AutoR1TemplateTitles.NAV_BUTTONS} template not found.`);
		}

		// Increase the Y position of all controls on the default pages to make space for the nav buttons
		if (mainView || meterView || eqView) {
			views.forEach((v) => {
				const vId = v.ViewId;

				if (vId !== mainView?.ViewId && vId !== meterView?.ViewId && vId !== eqView?.ViewId) {
					increaseControlPosYByAmount.run([NAV_BUTTON_Y + NAV_BUTTON_SPACING, vId]);
				}
			});
		}

		if (mainView) {
			views.forEach((v) => {
				insertNavButton(mainView.ViewId, v.ViewId, MAIN_WINDOW_TITLE, standardPagesX, NAV_BUTTON_Y);
			});

			standardPagesX += buttonWidth + SPACING;

			if (meterView) {
				insertNavButton(
					meterView.ViewId,
					mainView.ViewId,
					METER_WINDOW_TITLE,
					mainViewPosX,
					mainViewPosY
				);

				mainViewPosX += buttonWidth + SPACING;
			}

			if (eqView) {
				insertNavButton(
					eqView.ViewId,
					mainView.ViewId,
					EQ_WINDOW_TITLE,
					mainViewPosX,
					mainViewPosY
				);

				mainViewPosX += buttonWidth + SPACING;
			}
		}

		if (meterView) {
			views.forEach((v) => {
				insertNavButton(
					meterView.ViewId,
					v.ViewId,
					METER_WINDOW_TITLE,
					standardPagesX,
					NAV_BUTTON_Y
				);
			});

			standardPagesX += buttonWidth + SPACING;

			if (mainView) {
				insertNavButton(
					mainView.ViewId,
					meterView.ViewId,
					MAIN_WINDOW_TITLE,
					meterViewPosX,
					meterViewPosY
				);

				meterViewPosX += buttonWidth + SPACING;
			}

			if (eqView) {
				insertNavButton(
					eqView.ViewId,
					meterView.ViewId,
					EQ_WINDOW_TITLE,
					meterViewPosX,
					meterViewPosY
				);

				meterViewPosX += buttonWidth + SPACING;
			}
		}

		if (eqView) {
			views.forEach((v) => {
				insertNavButton(eqView.ViewId, v.ViewId, EQ_WINDOW_TITLE, standardPagesX, NAV_BUTTON_Y);
			});

			standardPagesX += buttonWidth + SPACING;

			if (mainView) {
				insertNavButton(mainView.ViewId, eqView.ViewId, MAIN_WINDOW_TITLE, eqViewPosX, eqViewPosY);

				eqViewPosX += buttonWidth + SPACING;
			}

			if (meterView) {
				insertNavButton(
					meterView.ViewId,
					eqView.ViewId,
					METER_WINDOW_TITLE,
					eqViewPosX,
					eqViewPosY
				);

				eqViewPosX += buttonWidth + SPACING;
			}
		}
	}

	/**
	 * Removes all nav buttons from the project and returns the controls to their original positions
	 * @param proj R1 project file
	 * @param mainViewId ViewId of the main view
	 */
	private removeNavButtons(): void {
		const getControlsStmt = () =>
			this.db.prepare(
				`SELECT ViewId FROM Controls WHERE "TargetId" = ? AND "TargetChannel" = ? AND "TargetType" = ?`
			);
		const deleteControlsStmt = () =>
			this.db.prepare(
				`DELETE FROM Controls WHERE "TargetId" = ? AND "TargetChannel" = ? AND "TargetType" = ?`
			);
		const updateControlsStmt = this.db.prepare(
			'UPDATE Controls SET PosY = PosY - ? WHERE ViewId = ?'
		);

		const mainView = this.getMainView();
		const meterView = this.getMeterView();
		const eqView = this.getEQView();

		let viewIdsWithNavButtons: number[] = [];

		if (mainView) {
			viewIdsWithNavButtons = dbpr
				.getAllAsObjects<{ ViewId: number }>(getControlsStmt(), [
					mainView.ViewId,
					dbpr.TargetChannels.NONE,
					dbpr.TargetTypes.VIEW
				])
				.map((c) => c.ViewId)
				.filter((vId) => vId !== mainView.ViewId);

			deleteControlsStmt().run([mainView.ViewId, dbpr.TargetChannels.NONE, dbpr.TargetTypes.VIEW]);
		}

		if (meterView) {
			viewIdsWithNavButtons = dbpr
				.getAllAsObjects<{ ViewId: number }>(getControlsStmt(), [
					meterView.ViewId,
					dbpr.TargetChannels.NONE,
					dbpr.TargetTypes.VIEW
				])
				.map((c) => c.ViewId)
				.filter((vId) => vId !== meterView.ViewId);

			deleteControlsStmt().run([meterView.ViewId, dbpr.TargetChannels.NONE, dbpr.TargetTypes.VIEW]);
		}

		if (eqView) {
			viewIdsWithNavButtons = dbpr
				.getAllAsObjects<{ ViewId: number }>(getControlsStmt(), [
					eqView.ViewId,
					dbpr.TargetChannels.NONE,
					dbpr.TargetTypes.VIEW
				])
				.map((c) => c.ViewId)
				.filter((vId) => vId !== eqView.ViewId);

			deleteControlsStmt().run([eqView.ViewId, dbpr.TargetChannels.NONE, dbpr.TargetTypes.VIEW]);
		}

		// Move all controls below the nav buttons back up
		viewIdsWithNavButtons.forEach((vId) => {
			updateControlsStmt.run([NAV_BUTTON_Y + 20, vId]);
		});
	}

	/**
	 * Inserts all AP channels into a dedicated AP group
	 * @param projectFile R1 project file
	 * @param parentGroupId Group id to create the AP group under
	 */
	public createAPGroup(parentGroupId = MAIN_GROUP_ID): boolean {
		const apChannelGroups: Group[] = [];

		for (const srcGrp of this.sourceGroups) {
			if (srcGrp.hasArrayProcessingEnabled()) {
				for (const chGrp of srcGrp.channelGroups) {
					if (chGrp.type === 'TYPE_TOPS') {
						apChannelGroups.push(...chGrp.channels);
					}
				}
			}
		}

		if (apChannelGroups.length < 1) {
			console.debug('No AP channel groups found.');

			return false;
		}

		this.createGroup({
			Name: AP_GROUP_TITLE,
			ParentId: parentGroupId
		});
		const apGroupId = this.getHighestGroupID()!;

		// Wrap in transaction to speed up insertion
		apChannelGroups.forEach((ch) => this.addChannelToGroup({ ...ch, ParentId: apGroupId }));

		return true;
	}

	public getAPGroup() {
		return this.getAllGroups()!.find((group) => group.Name === AP_GROUP_TITLE);
	}

	public getChannelMainGroupTotal(): number {
		let i = 0;
		for (const srcGrp of this.sourceGroups) {
			for (const chGrp of srcGrp.channelGroups) {
				if (!chGrp.isLorR()) {
					i += 1;
				}
			}
		}
		return i;
	}

	public getChannelMeterGroupTotal(): [number, number] {
		let i = 0;
		let j = 0;
		for (const srcGrp of this.sourceGroups) {
			let skip = 0;
			for (const chGrp of srcGrp.channelGroups) {
				if (skip) {
					skip = 0;
					continue;
				}
				if (chGrp.isRight()) {
					skip = 1;
				}
				i++;
				j = Math.max(j, chGrp.channels.length);
			}
		}
		return [i, j];
	}

	/**
	 * Finds all channels of the sub array and returns them in an array
	 * @returns Array of channels
	 */
	private getSubArrayGroups = () => {
		const subGroups: Group[][] = [];

		// Order allows a specific order type to be returned from the database, allowing devices to be
		// order from stage right to stage left across all groups
		const prefixes = ['L', 'R', 'C'];

		for (const prefix of prefixes) {
			const query = `
                WITH RECURSIVE
                devs(GroupId, Name, ParentId, TargetId, TargetChannel, Type) AS (
                    SELECT GroupId, Name, ParentId, TargetId, TargetChannel, Type FROM Groups WHERE Name = (SELECT Name FROM SourceGroups WHERE Type = 3)
                    UNION
                    SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type FROM Groups, devs WHERE Groups.ParentId = devs.GroupId
                )
                SELECT GroupId, devs.Name, TargetId, TargetChannel, Cabinets.CabinetId FROM devs
                JOIN Cabinets
                ON devs.TargetId = Cabinets.DeviceId
                AND devs.TargetChannel = Cabinets.AmplifierChannel
                JOIN CabinetsAdditionalData
                ON Cabinets.CabinetId = CabinetsAdditionalData.CabinetId
                WHERE Linked = 0
                /* Sub arrays always end with either L/C/R, two numbers, a dash and a further two numbers */
                AND devs.Name LIKE '% ${prefix}__%'`;

			const stmt = this.db.prepare(query);

			const rtn = dbpr.getAllAsObjects<Group>(stmt);

			if (rtn && rtn.length) {
				subGroups.push(rtn);
			}
		}

		return subGroups;
	};

	/**
	 * Creates discrete left, right and centre groups for sub arrays
	 * @param proj ProjectFile object
	 * @param parentGroupId ID of the parent group to add the sub groups to
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * createSubLRCGroups(p, 2)
	 */
	public createSubLRCGroups = (parentGroupId = MAIN_GROUP_ID): void => {
		const subArrayGroup = this.db
			.prepare(`SELECT Name FROM SourceGroups WHERE Type = ${dbpr.SourceGroupTypes.SUBARRAY}`)
			.getAsObject({}) as { Name: string };

		if (!subArrayGroup || !subArrayGroup.Name) {
			console.warn('No sub array group found');
			return;
		}

		const subArrayGroupName = subArrayGroup.Name;
		this.createGroup({
			Name: subArrayGroupName,
			ParentId: parentGroupId
		});
		let subGroupParentID = this.getHighestGroupID();

		this.createGroup({
			Name: `${subArrayGroupName} SUBs`,
			ParentId: subGroupParentID
		});
		subGroupParentID = this.getHighestGroupID();

		const suffix = [' SUBs L', ' SUBs R', ' SUBs C'];
		const subArrayGroups = this.getSubArrayGroups();

		// Wrap in transaction to speed up insertion
		for (const [idx, subArrayGroup] of subArrayGroups.entries()) {
			this.createGroup({
				Name: `${subArrayGroupName}${suffix[idx]}`,
				ParentId: subGroupParentID
			});
			const pId = this.getHighestGroupID()!;

			subArrayGroup.forEach((subDevices) =>
				this.addChannelToGroup({ ...subDevices, ParentId: pId })
			);
		}
	};

	public addSubCtoSubL = (): void => {
		let pId: number | undefined = undefined;
		for (const srcGrp of this.sourceGroups) {
			for (const chGrp of srcGrp.channelGroups) {
				if (chGrp.isSUBs() && chGrp.isLeft()) {
					pId = chGrp.groupId;
				}
			}
		}

		if (!pId) {
			console.debug('No sub left group found');
			return;
		}

		let success = false;

		for (const srcGrp of this.sourceGroups) {
			for (const chGrp of srcGrp.channelGroups) {
				if (chGrp.type === 'TYPE_SUBS_C') {
					for (const channel of chGrp.channels) {
						this.addChannelToGroup({
							...channel,
							ParentId: pId
						});
						success = true;
					}
				}
			}
		}

		if (!success) {
			console.debug('No sub centre group found');

			return;
		}
	};

	/**
	 * Determines if sub left, right and centre groups already exist.
	 * @param proj ProjectFile object
	 * @returns number of sub groups found e.g 2 for L/R, 3 for L/R/C
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * const rtn = hasSubGroups(p)
	 * console.log(rtn) // 0
	 */
	private hasSubGroups = (): number => {
		const stmt = this.db.prepare(
			`SELECT Name FROM SourceGroups WHERE Type = ${dbpr.SourceGroupTypes.SUBARRAY}`
		);
		const rtn = stmt.getAsObject({}) as { Name: string };
		let groupCount = 0;
		if (rtn) {
			const name = rtn.Name;
			const str = [' SUBs L', ' SUBs R', ' SUBs C'];
			for (const s of str) {
				const q = `SELECT * FROM Groups WHERE Name = ?`;
				const stmt = this.db.prepare(q);
				const rtn = stmt.getAsObject([`${name}${s}`]) as unknown as dbpr.Group;
				if (rtn && rtn.GroupId) {
					groupCount++;
				}
			}
		}
		return groupCount;
	};

	/**
	 * Finds if any source groups have ArrayProcessing enabled.
	 * @param proj ProjectFile object
	 * @returns true if AP is enabled, false if not
	 *
	 * @example
	 * const p = new ProjectFile(PROJECT_INIT)
	 * const rtn = getApStatus(p)
	 * console.log(rtn) // false
	 */
	public getApStatus = (): boolean => {
		if (!this.sourceGroups || this.sourceGroups.length === 0) {
			throw new Error('SourceGroups not loaded');
		}

		return this.sourceGroups.find((src) => src.hasArrayProcessingEnabled()) ? true : false;
	};

	/**
	 * Find the AutoR1 Main View row
	 * @returns View object or undefined
	 */
	private getMainView(): dbpr.View | undefined {
		return this.getViewByName(MAIN_WINDOW_TITLE);
	}

	/**
	 * Find the AutoR1 Meter View row
	 * @returns View object or undefined
	 */
	private getMeterView(): dbpr.View | undefined {
		return this.getViewByName(METER_WINDOW_TITLE);
	}

	/**
	 * Find the AutoR1 EQ View row
	 * @returns View object or undefined
	 */
	private getEQView(): dbpr.View | undefined {
		return this.getViewByName(EQ_WINDOW_TITLE);
	}

	/**
	 * Find a View row by name
	 * @returns View object or undefined
	 */
	private getViewByName(name: string): dbpr.View | undefined {
		const stmt = this.db.prepare(`SELECT * from Views WHERE Name = ?`);
		const view = stmt.getAsObject([name]) as unknown as dbpr.View;

		if (!view || !view.ViewId) {
			console.log(`Could not find view with name '${name}'`);

			return undefined;
		}

		return view;
	}

	/**
	 * Find a View row by id
	 * @returns View object or undefined
	 */
	private getViewById(id: number): dbpr.View | undefined {
		const stmt = this.db.prepare(`SELECT * from Views WHERE ViewId = ?`);
		const view = stmt.getAsObject([id]) as unknown as dbpr.View;

		if (!view || !view.ViewId) {
			console.log(`Could not find view with name '${name}'`);

			return undefined;
		}

		return view;
	}

	/**
	 * Create a view in the project
	 * @param title Title for the view
	 * @param HRes Horizontal size
	 * @param VRes Vertical size
	 * @returns ViewId of the new view
	 */
	public createView = (title = '', HRes = 1000, VRes = 1000) => {
		this.db
			.prepare(
				`INSERT INTO Views('Type','Name','Icon','Flags','HomeViewIndex','NaviBarIndex','HRes','VRes','ZoomLevel','ScalingFactor','ScalingPosX','ScalingPosY','ReferenceVenueObjectId') VALUES (1000,'${title}',NULL,4,NULL,-1,${HRes},${VRes},100,NULL,NULL,NULL,NULL);`
			)
			.run();
		const rtn = this.db.prepare(`SELECT max(ViewId) FROM Views`).getAsObject({}) as {
			'max(ViewId)': number;
		};
		const viewId = rtn['max(ViewId)'];

		return viewId;
	};

	/**
	 * Update the Name, HRes and VRes of a view.
	 * @param viewId ID of view to update
	 * @param values Values to update. All are optional.
	 */
	public updateView = (
		viewId: number,
		values: {
			[key: string]: string | number | undefined;
			Name?: string;
			HRes?: number;
			VRes?: number;
		}
	) => {
		Object.keys(values).forEach((key) => {
			const val = values[key];

			if (val) {
				const str = `UPDATE Views SET ${key} = ${val} WHERE ViewId = ${viewId}`;
				const stmt = this.db.prepare(str);
				stmt.run();
			}
		});
	};

	/**
	 * Gets the size of a view based on the furthest coordinates containing a control.
	 * @param viewId ID of view to evaluate.
	 * @returns The furthest coordinates containing a control.
	 */
	public getFurthestPointsFromView(viewId: number) {
		const str = `SELECT MAX(PosX + width) AS maxX, MAX(PosY + height) AS maxY FROM Controls WHERE ViewId = ${viewId}`;
		const stmt = this.db.prepare(str);
		const rtn = stmt.getAsObject({ viewId }) as { maxX: number; maxY: number };

		return rtn;
	}

	/**
	 * Inserts the AutoR1 Main View Overview template
	 * @param templateFile TemplateFile that contains templates for inserting
	 * @param posX X position to start inserting controls
	 * @param posY Y position to start inserting controls
	 * @param mainViewId ID of the main view
	 *
	 * @throws Will throw an error if the meter view cannot be found
	 */
	private createMainViewOverview(
		templateFile: AutoR1TemplateFile,
		posX: number,
		posY: number,
		mainViewId: number,
		inputGainType: 0 | 1
	) {
		const mainOverviewTemplate = templateFile.getTemplateWidthHeight(
			AutoR1TemplateTitles.MAIN_OVERVIEW
		);
		const mainFallbackTemplate = templateFile.getTemplateWidthHeight(
			AutoR1TemplateTitles.MAIN_FALLBACK
		);

		this.insertTemplate(
			templateFile.getTemplateByName(AutoR1TemplateTitles.MAIN_TITLE),
			mainViewId,
			posX,
			posY
		);
		posY +=
			templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.MAIN_TITLE).height + METER_SPACING_Y;

		const mainMainTemplateOptions: TemplateOptions = {
			TargetId: this.getMasterGroupID()
		};

		this.insertTemplate(
			templateFile.getTemplateByName(AutoR1TemplateTitles.MAIN_OVERVIEW),
			mainViewId,
			posX,
			posY,
			mainMainTemplateOptions
		);

		const fallbackGroupID = (() => {
			try {
				return this.getFallbackGroupID();
			} catch {
				return undefined;
			}
		})();

		this.insertTemplate(
			templateFile.getTemplateByName(AutoR1TemplateTitles.MAIN_FALLBACK),
			mainViewId,
			posX,
			posY + mainOverviewTemplate.height + 10,
			fallbackGroupID ? { TargetId: this.getFallbackGroupID() } : mainMainTemplateOptions
		);

		this.insertTemplate(
			templateFile.getTemplateByName(AutoR1TemplateTitles.MAIN_DS10),
			mainViewId,
			posX + mainFallbackTemplate.width + 10,
			posY + mainOverviewTemplate.height + 10,
			{ TargetId: this.getDsGroupID() }
		);

		posX += mainOverviewTemplate.width + METER_SPACING_X / 2;

		/**
		 * Configure the main mute switch
		 */
		const muteGroup = this.getMuteGroupID();
		if (muteGroup) {
			const mainMute = this.db
				.prepare(
					`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND Type = ${dbpr.ControlTypes.SWITCH} AND DisplayName = ?`
				)
				.getAsObject(['Mute']) as unknown as dbpr.Control;
			this.db.prepare(`DELETE FROM Controls WHERE ControlId = ${mainMute.ControlId}`).run();
			mainMute.TargetId = muteGroup;
			this.insertControl(mainMute);
		}

		/**
		 * Configure the fallback indicator
		 */
		const fallbackGroup = this.getFallbackGroupID();
		if (fallbackGroup) {
			const mainFallback = this.db
				.prepare(`SELECT * FROM Controls WHERE ViewId = ? AND Type = ? AND TargetProperty = ?`)
				.getAsObject([
					mainViewId,
					dbpr.ControlTypes.LED,
					dbpr.TargetPropertyType.STATUS_INPUT_FALLBACK_ACTIVE
				]) as unknown as dbpr.Control;
			this.db.prepare(`DELETE FROM Controls WHERE ControlId = ${mainFallback.ControlId}`).run();
			mainFallback.TargetId = fallbackGroup;
			this.insertControl(mainFallback);
		}

		/**
		 * Configure the DS data indicator
		 */
		const dsGroup = this.getDsGroupID();
		if (dsGroup) {
			const mainDs = this.db
				.prepare(`SELECT * FROM Controls WHERE ViewId = ? AND Type = ? AND TargetProperty = ?`)
				.getAsObject([
					mainViewId,
					dbpr.ControlTypes.LED,
					dbpr.TargetPropertyType.INPUT_DIGITAL_DS_DATA_PRI
				]) as unknown as dbpr.Control;
			this.db.prepare(`DELETE FROM Controls WHERE ControlId = ${mainDs.ControlId}`).run();
			mainDs.TargetId = dsGroup;
			this.insertControl(mainDs);
		}

		/**
		 * Configure the input gain type
		 */
		const inputGainTitleStmt = this.db.prepare(
			`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND Type = ${dbpr.ControlTypes.TEXT} AND DisplayName = ?`
		);
		const inputGainTitleControl = inputGainTitleStmt.getAsObject([
			'Analog'
		]) as unknown as dbpr.Control;
		this.db
			.prepare(`DELETE FROM Controls WHERE ControlId = ${inputGainTitleControl.ControlId}`)
			.run();
		const displayName = inputGainType ? 'Digital' : 'Analog';
		inputGainTitleControl.DisplayName = displayName;
		this.insertControl(inputGainTitleControl);

		const inputGainControlsStmt = this.db.prepare(
			`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND Type = ${dbpr.ControlTypes.DIGITAL} AND TargetProperty = ?`
		);
		const inputGainControls = dbpr.getAllAsObjects(inputGainControlsStmt, [
			dbpr.TargetPropertyType.INPUT_ANALOG_GAIN
		]) as dbpr.Control[];
		inputGainControls.forEach((control) => {
			this.db.prepare(`DELETE FROM Controls WHERE ControlId = ${control.ControlId}`).run();
			const targetProperty = inputGainType
				? dbpr.TargetPropertyType.INPUT_DIGITAL_GAIN
				: dbpr.TargetPropertyType.INPUT_ANALOG_GAIN;
			control.TargetProperty = targetProperty;
			this.insertControl(control);
		});

		const apGroupId = this.getAPGroup()?.GroupId;

		if (this.getApStatus()) {
			const thcTemplateOptions: TemplateOptions = {
				TargetId: apGroupId
			};
			this.insertTemplate(
				templateFile.getTemplateByName(AutoR1TemplateTitles.THC),
				mainViewId,
				posX,
				posY,
				thcTemplateOptions
			);
			posX +=
				templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.THC).width + METER_SPACING_X * 4;
		} else {
			posX += METER_SPACING_X * 4;
		}

		return { posX, posY };
	}
}

export class AutoR1Control implements dbpr.Control {
	ActionType = dbpr.ActionTypes.NONE;
	Alignment = -1;
	ConfirmOffMsg: string | null = null;
	ConfirmOnMsg: string | null = null;
	ControlId = -1;
	Dimension: Uint8Array | null = null;
	DisplayName: string | null = null;
	Flags = 0;
	Font = 'Arial,12,-1,5,50,0,0,0,0,0';
	Height = 0;
	JoinedId = 0;
	LabelAlignment = 1;
	LabelColor = 0;
	LabelFont = 5;
	LimitMax = 9999;
	LimitMin = 0;
	LineThickness = 0;
	MainColor = -1;
	PictureIdDay = 0;
	PictureIdNight = 0;
	PosX = 0;
	PosY = 0;
	SubColor = 1;
	TargetChannel = dbpr.TargetChannels.NONE;
	TargetId = -1;
	TargetProperty: dbpr.TargetPropertyType | null = null;
	TargetRecord = 0;
	TargetType = 0;
	ThresholdValue = 0.0;
	Type = dbpr.ControlTypes.LED;
	UniqueName: string | null = null;
	ViewId = -1;
	Width = 0;

	constructor(row?: Partial<dbpr.Control>) {
		if (row) {
			const {
				ViewId,
				Type,
				PosX,
				PosY,
				Width,
				Height,
				DisplayName,
				TargetId,
				TargetChannel,
				TargetProperty,
				ActionType,
				Alignment,
				ConfirmOffMsg,
				ConfirmOnMsg,
				ControlId,
				Dimension,
				Flags,
				Font,
				JoinedId,
				LabelAlignment,
				LabelColor,
				LabelFont,
				LimitMin,
				LimitMax,
				LineThickness,
				MainColor,
				PictureIdDay,
				PictureIdNight,
				SubColor,
				TargetRecord,
				TargetType,
				ThresholdValue,
				UniqueName
			} = row;
			this.ViewId = ViewId ?? this.ViewId;
			this.Type = Type ?? this.Type;
			this.PosX = PosX ?? this.PosX;
			this.PosY = PosY ?? this.PosY;
			this.Width = Width ?? this.Width;
			this.Height = Height ?? this.Height;
			this.DisplayName = DisplayName ?? this.DisplayName;
			this.TargetId = TargetId ?? this.TargetId;
			this.TargetChannel = TargetChannel ?? this.TargetChannel;
			this.ActionType = ActionType ?? this.ActionType;
			this.Alignment = Alignment ?? this.Alignment;
			this.ConfirmOffMsg = ConfirmOffMsg ?? this.ConfirmOffMsg;
			this.ConfirmOnMsg = ConfirmOnMsg ?? this.ConfirmOnMsg;
			this.ControlId = ControlId ?? this.ControlId;
			this.Dimension = Dimension ?? this.Dimension;
			this.Flags = Flags ?? this.Flags;
			this.Font = Font ?? this.Font;
			this.JoinedId = JoinedId ?? this.JoinedId;
			this.LabelAlignment = LabelAlignment ?? this.LabelAlignment;
			this.LabelColor = LabelColor ?? this.LabelColor;
			this.LabelFont = LabelFont ?? this.LabelFont;
			this.LimitMin = LimitMin ?? this.LimitMin;
			this.LimitMax = LimitMax ?? this.LimitMax;
			this.LineThickness = LineThickness ?? this.LineThickness;
			this.MainColor = MainColor ?? this.MainColor;
			this.PictureIdDay = PictureIdDay ?? this.PictureIdDay;
			this.PictureIdNight = PictureIdNight ?? this.PictureIdNight;
			this.SubColor = SubColor ?? this.SubColor;
			this.TargetProperty = TargetProperty ?? this.TargetProperty;
			this.TargetRecord = TargetRecord ?? this.TargetRecord;
			this.TargetType = TargetType ?? this.TargetType;
			this.ThresholdValue = ThresholdValue ?? this.ThresholdValue;
			this.UniqueName = UniqueName ?? this.UniqueName;
		}
	}

	public isCPL = (): boolean => {
		return this.DisplayName === 'CPL';
	};

	public isCUT = (): boolean => {
		return this.DisplayName === 'CUT';
	};

	public isViewEQButton = (): boolean => {
		return this.DisplayName === 'View EQ';
	};

	public targetsLoadMatchEnable() {
		return this.TargetProperty === dbpr.TargetPropertyType.CONFIG_LOAD_MATCH_ENABLE;
	}

	public targetsCPL() {
		return this.TargetProperty === dbpr.TargetPropertyType.CONFIG_FILTER3;
	}

	public isTypeDigital() {
		return this.Type === dbpr.ControlTypes.DIGITAL;
	}

	public isTypeMeter() {
		return this.Type === dbpr.ControlTypes.METER;
	}

	public isTypeFrame() {
		return this.Type === dbpr.ControlTypes.FRAME;
	}

	public isTypeEQ() {
		return this.Type === dbpr.ControlTypes.EQ;
	}

	public isTypeText() {
		return this.Type === dbpr.ControlTypes.TEXT;
	}

	public isTypeSwitch() {
		return this.Type === dbpr.ControlTypes.SWITCH;
	}

	public targetsDelay() {
		return this.TargetProperty === dbpr.TargetPropertyType.CHANNEL_STATUS_MS_DELAY;
	}

	public targetsLevel() {
		return this.TargetProperty === dbpr.TargetPropertyType.CONFIG_LEVEL;
	}

	private replaceDisplayName(pattern: string, replacement: string | undefined): void {
		if (this.DisplayName?.includes(pattern) && (replacement || replacement === '')) {
			this.DisplayName = this.DisplayName.replace(pattern, replacement);
		}
	}

	private displayNameIncludes(pattern: string) {
		const rtn = this.DisplayName?.includes(pattern) ?? false;
		if (rtn) this.replaceDisplayName(pattern, '');
		return rtn;
	}

	private deviceProperties = [
		dbpr.TargetPropertyType.INPUT_DIGITAL_TX_STREAM,
		dbpr.TargetPropertyType.INPUT_DIGITAL_DS_DATA_PRI,
		dbpr.TargetPropertyType.INPUT_DIGITAL_DS_DATA_SEC,
		dbpr.TargetPropertyType.INPUT_DIGITAL_SYNC,
		dbpr.TargetPropertyType.INPUT_DIGITAL_MODE,
		dbpr.TargetPropertyType.INPUT_DIGITAL_GAIN,
		dbpr.TargetPropertyType.INPUT_DIGITAL_SAMPLE_STATUS,
		dbpr.TargetPropertyType.STATUS_STATUS_TEXT
	];

	public handleString(options: TemplateOptions) {
		const { TargetId, TargetChannel, sourceGroup, channelGroup, channel } = options;

		this.TargetId = TargetId ?? this.TargetId;

		if (
			!this.TargetProperty ||
			(this.TargetProperty && !this.deviceProperties.includes(this.TargetProperty))
		) {
			this.TargetChannel = TargetChannel ?? this.TargetChannel;
		}

		const xover = channelGroup?.type.includes('TOPS') ? 'CUT' : sourceGroup?.xover;

		this.replaceDisplayName('%SourceGroupName%', sourceGroup?.Name);
		this.replaceDisplayName('%ChannelGroupName%', channelGroup?.name);
		this.replaceDisplayName('%ChannelName%', channel?.Name);
		this.replaceDisplayName('%xover%', xover);

		this.TargetId =
			(this.displayNameIncludes('%SourceGroupPageTarget%') && options.sourceGroup?.ViewId) ||
			this.TargetId;

		this.TargetId =
			(this.displayNameIncludes('%EqPageTarget%') &&
				options.sourceGroup?.ViewId &&
				options.sourceGroup?.ViewId + 1) ||
			this.TargetId;

		if (this.DisplayName?.includes('%Target_ChannelGroup') && options.sourceGroup) {
			const matches = extractFromTargetString(this.DisplayName, 'Target_ChannelGroup');
			this.DisplayName = matches.prefix + matches.suffix;

			const side =
				matches.lOrR === 'L'
					? options.sourceGroup.channelGroups.find((ch) => ch.isLeft())
					: matches.lOrR === 'R'
						? options.sourceGroup.channelGroups.find((ch) => ch.isRight())
						: matches.lOrR === 'TOPs'
							? options.sourceGroup.channelGroups.find((ch) => ch.isTOPs())
							: matches.lOrR === 'SUBs'
								? options.sourceGroup.channelGroups.find((ch) => ch.isSUBs())
								: undefined;

			if (matches.channelNumber && side) {
				this.TargetId = side.channels[matches.channelNumber - 1].TargetId || this.TargetId;
				this.TargetChannel =
					side.channels[matches.channelNumber - 1].TargetChannel || this.TargetChannel;
			} else if (matches.channelNumber) {
				this.TargetId =
					options.sourceGroup.channelGroups[0].channels[matches.channelNumber - 1].TargetId ||
					this.TargetId;
				this.TargetChannel =
					options.sourceGroup.channelGroups[0].channels[matches.channelNumber - 1].TargetChannel ||
					this.TargetChannel;
			} else {
				this.TargetId = side?.groupId || this.TargetId;
			}
		}
	}

	/**
	 * Determins whether a control will be displayed or not
	 * @param sourceGroup SourceGroup control will be associated with
	 * @returns True if will be visible, false if not
	 */
	public isVisible(sourceGroup: SourceGroup, channelGroup: ChannelGroup) {
		if (
			this.isTypeDigital() &&
			this.targetsCPL() &&
			(!channelGroup?.hasCPL() ||
				(!channelGroup && !sourceGroup.channelGroups.find((cg) => cg.hasCPL())))
		) {
			// Skip CPL
			return false;
		} else if (this.targetsLoadMatchEnable() && !sourceGroup.hasLoadMatch()) {
			// Skip Load Match Enable
			return false;
		} else if (this.isViewEQButton() && !sourceGroup.hasEQView()) {
			// Skip View EQ Switch for additional amplifier
			return false;
		} else {
			return true;
		}
	}
}

/**
 * Contains all controls and sections of a template
 * @param sections TemplateSection
 * @param controls ControlRow
 */
export class AutoR1Template {
	id: number;
	name: string;
	parentId: number;
	joinedId: number;
	controls: AutoR1Control[];
	width: number;
	height: number;

	constructor(sections: dbpr.Section, controls: dbpr.Control[], width: number, height: number) {
		this.id = sections.Id;
		this.name = sections.Name;
		this.parentId = sections.ParentId;
		this.joinedId = sections.JoinedId;
		this.width = width;
		this.height = height;

		this.controls = [];
		controls.forEach((control) => {
			this.controls.push(new AutoR1Control(control));
		});
	}

	public configureForMainView(
		joinedId: number,
		MeterChannel: number,
		muteTargetId: number,
		sourceGroup: SourceGroup,
		channelGroup: ChannelGroup,
		posX: number,
		posY: number,
		viewId: number
	) {
		this.controls?.forEach((control) => {
			control.JoinedId = joinedId;
			control.TargetId = channelGroup.groupId;

			// Update Infra/100hz button text
			if (control.isCUT()) {
				control.DisplayName = sourceGroup.xover;
			}

			// Meters, these require a TargetChannel
			if (control.isTypeMeter()) {
				control.TargetChannel = MeterChannel;
			} else if (control.isTypeSwitch()) {
				if (control.TargetProperty === dbpr.TargetPropertyType.CONFIG_MUTE) {
					// Mute
					control.TargetId = muteTargetId;
				}

				if (control.isViewEQButton()) {
					// ViewEQ Button
					control.TargetId = sourceGroup.ViewId + 1;
				}
			} else if (control.isTypeFrame()) {
				if (control.DisplayName) {
					control.DisplayName = channelGroup.name;
				}
			} else if (control.isTypeDigital()) {
				if (
					(control.targetsDelay() || control.targetsLevel()) &&
					(channelGroup.name.toLowerCase().includes('fill') ||
						channelGroup.type === 'TYPE_SUBS' ||
						channelGroup.type === 'TYPE_POINT_TOPS' ||
						channelGroup.type === 'TYPE_POINT_SUBS')
				) {
					// Set relative digital control
					control.Flags = dbpr.ControlFlags.RELATIVE;
					control.LimitMin = -9999.5;
					control.LimitMax = 9999;
				}
			}

			if (control.isVisible(sourceGroup)) {
				control.PosX = control.PosX + posX;
				control.PosY = control.PosY + posY;
				control.ViewId = viewId;
				control.ConfirmOffMsg = null;
				control.ConfirmOnMsg = null;
			}
		});
	}
}

export class AutoR1TemplateFile extends dbpr.TemplateFile {
	templates: AutoR1Template[] = [];

	constructor(db: Database) {
		super(db);

		const stmt = this.db.prepare(`SELECT * FROM 'main'.'Sections' ORDER BY JoinedId ASC`);
		const templates = dbpr.getAllAsObjects<dbpr.Section>(stmt);

		templates
			.filter((t) => t.JoinedId > 0)
			.forEach((template, index) => {
				const joinedId = template.JoinedId;
				const stmt = this.db.prepare(
					`SELECT * FROM Controls WHERE JoinedId = ${joinedId} ORDER BY PosX ASC`
				);
				const controls = dbpr.getAllAsObjects<dbpr.Control>(stmt);

				const { width, height } = this.getTemplateWidthHeight(template.Name);

				this.templates.push(new AutoR1Template(template, controls, width, height));
				console.debug(
					`Loaded template - ${index} / ${this.templates[this.templates.length - 1].name}`
				);
			});

		const autoR1TemplateTitles = Object.values(AutoR1TemplateTitles);
		const loadedTitles = this.templates.map((t) => t.name);
		loadedTitles.forEach((title) => {
			if (!autoR1TemplateTitles.includes(title as AutoR1TemplateTitles)) {
				throw new Error(`Template ${title} not found in template file.`);
			}
		});
	}

	static build = (fb: Buffer) => build<AutoR1TemplateFile>(fb, (db) => new AutoR1TemplateFile(db));

	/**
	 * Returns a template by name
	 * @param tempName Name of the template to get
	 * @returns Template object
	 */
	getTemplateByName(tempName: string): AutoR1Template {
		const template = this.templates.find((temp) => temp.name === tempName);
		if (!template) {
			throw new Error(`Template ${tempName} not found.`);
		}
		return template;
	}

	/**
	 * Takes an array of strings and returns the name of the template that matches
	 * closes. The first string in the array takes precedent for determining the
	 * matching template. The template which contains the most number of string is
	 * returned.
	 * @param strings An array of strings to search for.
	 * @returns Name of the closest matching template.
	 */
	getTemplateWithStrings(strings: string[]): AutoR1Template {
		function findBestMatch(candidates: string[], targetWords: string[]): string {
			const primaryTarget = targetWords[0];
			let bestMatch = '';
			let maxMatchCount = 0;
			let hasPrimaryTarget = false;

			for (const candidate of candidates) {
				const containsPrimaryTarget = candidate.includes(primaryTarget);
				const words = candidate.split(' ');
				const matchCount = targetWords.filter((target) => words.includes(target)).length;

				// If this candidate contains the primary target and we haven't found one before,
				// or if it contains the primary target and has a higher match count
				if (containsPrimaryTarget && (!hasPrimaryTarget || matchCount > maxMatchCount)) {
					maxMatchCount = matchCount;
					bestMatch = candidate;
					hasPrimaryTarget = true;
				}
				// If we haven't found any candidate with the primary target yet
				else if (!hasPrimaryTarget && matchCount > maxMatchCount) {
					maxMatchCount = matchCount;
					bestMatch = candidate;
				}
			}

			return bestMatch;
		}

		const names = this.templates.map((t) => t.name);

		const templateName = findBestMatch(names, strings);

		const template = this.templates.find((temp) => temp.name === templateName);
		if (!template) {
			throw new Error(`Template ${templateName} not found.`);
		}
		return template;
	}

	/**
	 * Returns the controls of a template by name
	 * @param templates File containing the templates
	 * @param tempName Name of the template to get the controls of
	 * @returns Array of controls
	 * @throws Error if the template doesn't exist
	 * @throws Error if the template doesn't have any controls
	 */
	public getTemplateControlsFromName(tempName: string): AutoR1Control[] {
		for (const t of this.templates) {
			if (t.name === tempName) {
				if (t.controls && t.controls.length) {
					// TODO: Need to create a deep copy, can this be done better?
					return t.controls.map((control) => new AutoR1Control(control));
				} else {
					throw new Error(`Template ${tempName} does not contain any controls.`);
				}
			}
		}

		throw new Error(`Template ${tempName} not found.`);
	}

	/**
	 * Returns the width and height of a template
	 * @param templateFile File containing the templates
	 * @param templateName Name of the template to get the size of
	 * @returns Object containing the width and height of the template
	 * @throws Error if the template doesn't exist
	 * @throws Error if the template doesn't have any controls
	 */
	public getTemplateWidthHeight(templateName: string): {
		width: number;
		height: number;
	} {
		const rtn = this.db
			.prepare(`SELECT JoinedId FROM 'main'.'Sections' WHERE Name = ?`)
			.getAsObject([templateName]) as { JoinedId: number };
		if (!rtn || !rtn.JoinedId) {
			throw new Error(`${templateName} template not found.`);
		}

		const jId = rtn.JoinedId;
		const stmt = this.db.prepare(
			`SELECT PosX, PosY, Width, Height FROM Controls WHERE JoinedId = ${jId} `
		);

		const templateControls = dbpr.getAllAsObjects<{
			PosX: number;
			PosY: number;
			Width: number;
			Height: number;
		}>(stmt);
		if (!templateControls.length) {
			throw new Error(`${templateName} template controls not found.`);
		}

		let maxWidth = 0;
		let maxHeight = 0;
		for (const row of templateControls) {
			const PosX = row.PosX;
			const PosY = row.PosY;
			const Width = row.Width;
			const Height = row.Height;
			if (PosX + Width > maxWidth) {
				maxWidth = PosX + Width;
			}
			if (PosY + Height > maxHeight) {
				maxHeight = PosY + Height;
			}
		}
		return { width: maxWidth, height: maxHeight };
	}
}

export interface TemplateDefinition {
	template?: string;
	x?: number;
	y?: number;
	advanceX?: boolean;
	advanceY?: boolean;
	channels?: TemplateDefinition[];
	sourceGroupsLR?: TemplateDefinition[];
}

export interface PageTemplate {
	paddingX: number;
	paddingY: number;
	insideOut: boolean;
	templates: TemplateDefinition[];
}

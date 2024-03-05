/* eslint-disable import/no-webpack-loader-syntax */
/* eslint-disable no-loop-func */
import { Database } from 'sql.js';
import * as dbpr from './dbpr';
import { build } from './dbpr';

// Required to let webpack 4 know it needs to copy the wasm file to our assets
// @ts-ignore
// import sqlWasm from "!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm";


const NAV_BUTTON_X = 270;
export const NAV_BUTTON_Y = 15;

const METER_VIEW_STARTX = 15;
const METER_VIEW_STARTY = 15;
export const METER_SPACING_X = 15;
export const METER_SPACING_Y = 15;
export const MAIN_VIEW_STARTX = 10;
export const MAIN_VIEW_STARTY = 10;
const PARENT_GROUP_TITLE = "AUTO";
export const AP_GROUP_TITLE = "AP";
export const METER_WINDOW_TITLE = "AUTO - Meters";
export const MAIN_WINDOW_TITLE = "AUTO - Main";
export const EQ_WINDOW_TITLE = "AUTO - EQ";

export const NAV_BUTTON_SPACING = 20;

export const MAIN_GROUP_ID = 1;

export const FALLBACK_GROUP_TITLE = 'FALLBACK';
export const MUTE_GROUP_TITLE = 'MUTE';
export const DS_GROUP_TITLE = 'DS DATA';

export enum AutoR1TemplateTitles {
    MAIN_OVERVIEW = 'Main Overview',
    MAIN_TITLE = "Main Title",
    MAIN_DS10 = "Main DS10",
    MAIN_FALLBACK = "Main Fallback",
    MAIN_ARRAYSIGHT = "Main ArraySight",
    MAIN_ARRAYSIGHT_LR = "Main ArraySight LR",
    MAIN_ARRAYSIGHT_FRAME = "Main ArraySight Frame",
    GROUP = "Group",
    GROUP_CPL2 = "Group CPL2",
    GROUP_AP = "Group AP",
    GROUP_LR = "Group LR",
    GROUP_LR_AP = "Group LR AP",
    GROUP_LR_CPL2 = "Group LR CPL2",
    GROUP_AP_CPL2 = "Group AP CPL2",
    GROUP_LR_AP_CPL2 = "Group LR AP CPL2",
    METERS_TITLE = "Meters Title",
    METERS_GROUP = "Meters Group",
    METER = "Meter",
    THC = "THC",
    NAV_BUTTONS = "Nav Button",
    EQ1 = "EQ1",
    EQ1_TITLE = "EQ1 Title",
    EQ2 = "EQ2",
    EQ2_TITLE = "EQ2 Title"
}

type ChannelGroupTypes = 'TYPE_SUBS_C' | 'TYPE_SUBS_R' | 'TYPE_SUBS_L' | 'TYPE_SUBS' | 'TYPE_TOPS_L' | 'TYPE_TOPS_R' | 'TYPE_TOPS' | 'TYPE_POINT_TOPS' | 'TYPE_POINT_SUBS' | 'TYPE_ADDITIONAL_AMPLIFIER';

interface TemplateOptions {
    DisplayName?: string,
    TargetId?: number,
    TargetChannel?: number,
    Width?: number,
    Height?: number,
    joinedId?: number,
    sourceGroupType?: dbpr.SourceGroupTypes;
}
export interface Channel {
    CabinetId: number;
    GroupId: number;
    Name: string;
    TargetChannel: number;
    TargetId: number;
}

interface ChannelGroupInterface {
    groupId: number;
    name: string;
    channels: Channel[];
    type: ChannelGroupTypes;
    arraySightId?: number;
}

export interface ProjectOptions {
    main: boolean;
    meter: boolean;
    eq: boolean;
    arraySightControls: boolean;
}

export class ChannelGroup implements ChannelGroupInterface {
    groupId: number;
    name: string;
    channels: Channel[];
    type: ChannelGroupTypes;
    arraySightId?: number;
    mainGroup?: ChannelGroup;
    leftGroup?: ChannelGroup;
    rightGroup?: ChannelGroup;
    centreGroup?: ChannelGroup;
    removeFromMute = false;
    removeFromFallback = false;
    removeFromDs = false;

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
        return this.type === 'TYPE_SUBS_L'
            || this.type === 'TYPE_SUBS_R'
            || this.type === 'TYPE_SUBS_C'
            || this.type === 'TYPE_TOPS_L'
            || this.type === 'TYPE_TOPS_R';
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
        return this.type === 'TYPE_SUBS'
            || this.type === 'TYPE_SUBS_L'
            || this.type === 'TYPE_SUBS_R'
            || this.type === 'TYPE_SUBS_C'
            || this.type === 'TYPE_POINT_SUBS';
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
        return this.type === 'TYPE_TOPS'
            || this.type === 'TYPE_TOPS_L'
            || this.type === 'TYPE_TOPS_R'
            || this.type === 'TYPE_POINT_TOPS';
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
        return this.type === 'TYPE_POINT_SUBS'
            || this.type === 'TYPE_POINT_TOPS';
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
        return this.type === 'TYPE_TOPS'
            || this.type === 'TYPE_TOPS_L'
            || this.type === 'TYPE_TOPS_R'
            || this.type === 'TYPE_POINT_TOPS'
            || this.type === 'TYPE_ADDITIONAL_AMPLIFIER'
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
        return sourceGroup.Type !== dbpr.SourceGroupTypes.ARRAY
    }
}

export interface AutoR1SourceGroupRow extends dbpr.SourceGroup {
    ArraySightIdR: number;
    MainGroupId: number;
    MainGroupName: string;
    NextSourceGroupId: number;
    SourceGroupId: number;
    SubGroupId: number;
    SubGroupName: string;
    SubCGroupId: number;
    SubCGroupName: string
    SubLeftGroupId: number;
    SubLeftGroupName: string;
    SubRightGroupId: number;
    SubRightGroupName: string;
    System: string;
    TopGroupId: number;
    TopGroupName: string;
    TopLeftGroupId: number;
    TopLeftGroupName: string;
    TopRightGroupId: number;
    TopRightGroupName: string;
    ViewId: number;
    xover: dbpr.Crossover | null;
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

    channelGroups: ChannelGroup[] = [];

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
        this.xover = row.xover || 'CUT';

        if (row.TopGroupId && row.TopGroupName) {
            const mainGroup = new ChannelGroup({ groupId: row.TopGroupId, name: row.TopGroupName, type: 'TYPE_TOPS', channels: [] })
            this.channelGroups.push(mainGroup)

            if (row.TopLeftGroupId && row.TopLeftGroupName) {
                const leftGroup = new ChannelGroup({ groupId: row.TopLeftGroupId, name: row.TopLeftGroupName, type: 'TYPE_TOPS_L', channels: [] });

                leftGroup.mainGroup = mainGroup;

                this.channelGroups.push(leftGroup);

                mainGroup.leftGroup = leftGroup;
            }
            if (row.TopRightGroupId && row.TopRightGroupName) {
                const rightGroup = new ChannelGroup({
                    groupId: row.TopRightGroupId,
                    name: row.TopRightGroupName,
                    type: 'TYPE_TOPS_R',
                    channels: []
                });

                rightGroup.mainGroup = mainGroup;

                this.channelGroups.push(rightGroup);

                mainGroup.rightGroup = rightGroup;
            }
        }

        if (row.SubGroupId && row.SubGroupName) {
            const subGroup = new ChannelGroup({ groupId: row.SubGroupId, name: row.SubGroupName, type: 'TYPE_SUBS', channels: [] });
            this.channelGroups.push(subGroup);
            let leftGroup: ChannelGroup;
            let rightGroup: ChannelGroup;

            if (row.SubLeftGroupId && row.SubLeftGroupName) {
                leftGroup = new ChannelGroup({ groupId: row.SubLeftGroupId, name: row.SubLeftGroupName, type: 'TYPE_SUBS_L', channels: [] });

                leftGroup.mainGroup = subGroup;

                this.channelGroups.push(leftGroup);

                subGroup.leftGroup = leftGroup;
            }
            if (row.SubRightGroupId && row.SubRightGroupName) {
                rightGroup = new ChannelGroup({ groupId: row.SubRightGroupId, name: row.SubRightGroupName, type: 'TYPE_SUBS_R', channels: [] });

                rightGroup.mainGroup = subGroup;

                this.channelGroups.push(rightGroup);

                subGroup.rightGroup = rightGroup;
            }
            if (row.SubCGroupId && row.SubCGroupName) {
                const centreGroup = new ChannelGroup({ groupId: row.SubCGroupId, name: row.SubCGroupName, type: 'TYPE_SUBS_C', channels: [] });

                centreGroup.mainGroup = subGroup;
                centreGroup.leftGroup = subGroup;
                centreGroup.rightGroup = subGroup;

                this.channelGroups.push(centreGroup);

                subGroup.centreGroup = centreGroup;
            }
        }

        // Skip final group if subs or tops groups have been found, only use for point sources
        if (!this.channelGroups.length && row.MainGroupId && row.MainGroupName) {
            const type: ChannelGroupTypes =
                this.System !== 'mixed' ?
                    this.System === 'SUBs' ?
                        'TYPE_POINT_SUBS' :
                        'TYPE_POINT_TOPS'
                    : 'TYPE_ADDITIONAL_AMPLIFIER';
            this.channelGroups.push(new ChannelGroup({ groupId: row.MainGroupId, name: row.MainGroupName, type, channels: [] }));
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
        return this.System === 'GSL' || this.System === 'KSL' || this.System === 'XSL' && this.Type === dbpr.SourceGroupTypes.ARRAY;
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
        return this.Type !== dbpr.SourceGroupTypes.ADDITIONAL_AMPLIFIER && this.Type !== dbpr.SourceGroupTypes.UNUSED_CHANNELS;
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
        return this.Type !== dbpr.SourceGroupTypes.ADDITIONAL_AMPLIFIER && this.Type !== dbpr.SourceGroupTypes.UNUSED_CHANNELS;
    }
}

class TemporaryTemplate {
    private _isLR = false;
    private _isAP = false;
    private _isCPL2 = false;
    private _name?: string;
    private _controls?: AutoR1Control[];

    setLR = (isLR: boolean) => this._isLR = isLR;
    setAP = (isAP: boolean) => this._isAP = isAP;
    setCPL2 = (isCPL2: boolean) => this._isCPL2 = isCPL2;
    setName = (name: string) => this._name = name;

    get isLR() { return this._isLR; }
    get isAP() { return this._isAP; }
    get isCPL2() { return this._isCPL2; }
    get name() {
        let name = this._name;
        if (this.isLR) name += ' LR';
        if (this.isAP) name += ' AP';
        if (this.isCPL2) name += ' CPL2';
        return name;
    }
    get controls() { return this._controls; }

    public load(templateFile: AutoR1TemplateFile) {
        if (!this.name) {
            throw (new Error('Template name not set'));
        }
        this._controls = templateFile.getTemplateControlsFromName(this.name);
    }
}


export class AutoR1ProjectFile extends dbpr.ProjectFile {
    public sourceGroups: SourceGroup[] = [];
    public additions: boolean = false;

    constructor(db: Database) {
        super(db);

        if (this.getMainView()
            || this.getMeterView()
            || this.getEQView()
            || this.getFallbackGroupID()
            || this.getMuteGroupID()
            || this.getDsGroupID()) {
            this.additions = true;
        }
    }

    static build = (fb: Buffer) => build<AutoR1ProjectFile>(fb, (db) => new AutoR1ProjectFile(db))

    public getSrcGrpInfo = () => {
        this.db.exec(`PRAGMA case_sensitive_like=ON;`);

        if (this.sourceGroups.length) {
            console.warn('getSrcGrpInfo has already been called.')
            return;
        }

        let query = `
        SELECT Views.ViewId, Views.Name, SourceGroups.SourceGroupId, NextSourceGroupId, SourceGroups.Type, ArrayProcessingEnable,
        ArraySightId, ArraySightIdR, System, mainGroup.GroupId as MainGroupId, mainGroup.Name as MainGroupName, topsGroup.GroupId as TopGroupId, topsGroup.Name as TopGroupName,
        topsLGroup.GroupId as TopLeftGroupId, topsLGroup.Name as TopLeftGroupName, topsRGroup.GroupId as TopRightGroupId, topsRGroup.Name as TopRightGroupName,
        subsGroup.GroupId as SubGroupId, subsGroup.Name as SubGroupName, subsLGroup.GroupId as SubLeftGroupId, subsLGroup.Name as SubLeftGroupName, subsRGroup.GroupId as
        SubRightGroupId, subsRGroup.Name as SubRightGroupName, subsCGroup.GroupId as SubCGroupId, subsCGroup.Name as SubCGroupName, i.DisplayName as xover
        FROM SourceGroups
        LEFT OUTER JOIN (SELECT ArraySightId as ArraySightIdR, SourceGroupId as SGid FROM SourceGroups) ON SourceGroups.NextSourceGroupId = SGid
        /* Combine additional source group data */
        JOIN SourceGroupsAdditionalData 
        ON SourceGroups.SourceGroupId = SourceGroupsAdditionalData.SourceGroupId
        /* Combine view info */
        JOIN Views
        ON Views.Name = SourceGroups.Name
        /* Combine R1 groups to Source Groups - We only have the name to go on here */
        JOIN Groups mainGroup
        ON SourceGroups.name = mainGroup.Name
        /* Fetch TOPs groups which may or may not have L/R subgroups */
        LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% TOPs') topsGroup
        ON topsGroup.ParentId = mainGroup.GroupId
        /* Fetch L/R TOP groups which will be under the main TOPs groups */
        LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% TOPs L' ) topsLGroup
        ON topsLGroup.ParentId  = topsGroup.GroupId
        LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% TOPs R' ) topsRGroup
        ON topsRGroup.ParentId  = topsGroup.GroupId
        /* Fetch the SUBs groups */
        LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% SUBs') subsGroup
        ON subsGroup.ParentId  = mainGroup.GroupId
        /* Fetch L/R/C SUB groups we created earlier */
        LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% SUBs L' ) subsLGroup
        ON subsLGroup.ParentId  = subsGroup.GroupId
        LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% SUBs R' ) subsRGroup
        ON subsRGroup.ParentId  = subsGroup.GroupId
        LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% SUBs C' ) subsCGroup
        /* Fetch crossover info for subs */
        ON subsCGroup.ParentId  = subsGroup.GroupId
        LEFT OUTER JOIN (SELECT * FROM Controls WHERE DisplayName = '100Hz' OR DisplayName = 'Infra') i
        ON i.ViewId  = Views.ViewId
        /* Skip unused channels group */
        WHERE SourceGroups.name != 'Unused channels'
        /* Skip second half of stereo pairs */
        AND OrderIndex != -1
        /* Skip duplicate groups in Main group _only for arrays_. We want L/R groups for arrays. */
        AND (SourceGroups.Type == 1 AND mainGroup.ParentId != (SELECT GroupId FROM Groups WHERE Name == 'Master'))
        /* Skip existing Sub array group in Main */
        OR (SourceGroups.Type == 3 AND mainGroup.ParentId != (SELECT GroupId FROM Groups WHERE Name == 'Master'))
        /* Get point source groups from Main group */
        OR (SourceGroups.Type == 2 AND mainGroup.ParentId == (SELECT GroupId FROM Groups WHERE Name == 'Master'))
        /* Device only groups */
        OR SourceGroups.Type == 4
        ORDER BY SourceGroups.OrderIndex ASC`;

        const stmt = this.db.prepare(query);

        let rtn = dbpr.getAllAsObjects<AutoR1SourceGroupRow>(stmt);

        if (!rtn || !rtn.length) {
            throw (new Error('Could not find any source groups'));
        }

        for (let row of rtn) {
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

                const rtn = dbpr.getAllAsObjects<Channel>(stmt, [devGrp.groupId])
                for (let row of rtn) {
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
        const masterSourceGroups = dbpr.getAllAsObjects<{ SourceGroupId: number, Name: string, GroupId: number }>(masterGroupQueryStmt);

        masterSourceGroups.forEach((mstrGrp) => {
            const sourceGroup = this.sourceGroups.find((srcGrp) => srcGrp.SourceGroupId === mstrGrp.SourceGroupId);
            if (sourceGroup) {
                sourceGroup.masterGroupId = mstrGrp.GroupId
            }
        });

        // Get child groups of above 'Master' groups
        const masterGroupId = this.getGroupIdFromName('Master')
        const childGroupQuery = `SELECT DISTINCT G.GroupId, G.ParentId,G.Name
        FROM Groups G
        JOIN (
            SELECT *
            FROM Groups G1
            JOIN SourceGroups SG ON G1.Name = SG.Name
            WHERE G1.ParentId = ?
        ) AS SubQuery ON G.ParentId = SubQuery.GroupId;`;

        const childGroupsStmt = this.db.prepare(childGroupQuery);
        const childGroups = dbpr.getAllAsObjects<{ GroupId: number, Name: string, ParentId: number }>(childGroupsStmt, [masterGroupId]);

        childGroups.forEach((childGroup) => {
            const sourceGroup = this.sourceGroups.find((srcGrp) => srcGrp.masterGroupId === childGroup.ParentId);
            if (sourceGroup) {
                sourceGroup.childGroupIds.push(childGroup.GroupId)
            }
        });
    }

    public insertTemplate = (
        template: AutoR1Template,
        ViewId: number,
        posX = 0,
        posY = 0,
        options?: TemplateOptions
    ): void => {
        let {
            DisplayName,
            TargetId,
            TargetChannel,
            Width,
            Height,
            joinedId,
        } = options || {};

        // Increase global joined ID
        const highestJoinedId = this.getHighestJoinedID();
        if (!highestJoinedId) {
            throw new Error("Could not find a joined ID");
        }

        if (!joinedId) joinedId = highestJoinedId + 1;

        if (!template.controls || template.controls.length < 1) {
            throw new Error("Template has no controls.");
        }

        // Wrap in transaction to speed up insertion
        for (const templateControl of template.controls) {
            const control = Object.assign(new AutoR1Control(), templateControl);

            // If item of type FRAME or BUTTON to swap views (TargetType is PAGE), 
            // and a DisplayName has been provided, and we are not dealing with a fallback/regular button,
            // then set the display name to the provided name
            if ((control.isTypeFrame()
                || (control.isTypeSwitch()
                    && control.TargetType === dbpr.TargetTypes.VIEW))
                && (control.DisplayName
                    && control.DisplayName !== "Fallback"
                    && control.DisplayName !== "Regular" && DisplayName)) {
                control.DisplayName = DisplayName;
            }

            // Set TargetChannel if required
            if (Object.values({ ...dbpr.TargetPropertyTypeChannel, ...dbpr.TargetPropertyDisplayChannel, ...dbpr.TargetPropertyLedChannel, ...dbpr.TargetPropertyMeterChannel, ...dbpr.TargetPropertySwitchChannel, ...dbpr.TargetPropertyDigitalChannel, ...dbpr.TargetPropertyDisplayChannel }).includes(control.TargetProperty as dbpr.TargetPropertyType) && TargetChannel) {
                control.TargetChannel = TargetChannel;

                // Convert the digital input to a read-only display control for delay setting on a flown array
                if (control.TargetProperty === dbpr.TargetPropertyType.CHANNEL_STATUS_MS_DELAY
                    && options?.sourceGroupType === dbpr.SourceGroupTypes.ARRAY) {
                    control.Type = dbpr.ControlTypes.DISPLAY;
                }
            }

            control.PosX = control.PosX + posX;
            control.PosY = control.PosY + posY;
            control.Width = Width || control.Width;
            control.Height = Height || control.Height;
            control.JoinedId = joinedId!;
            control.TargetId = TargetId || control.TargetId;
            control.ViewId = ViewId;

            this.insertControl(control)
        }
    }

    /**
     * Creates a new group and inserts all channels except those with the removeFromMute flag set
     * @param parentGroupId Group id to create the group under
     * 
     * @example
     * const p = new ProjectFile(PROJECT_INIT)
     * p.createMainGroup()
     */
    public createMainMuteGroup(ParentId = MAIN_GROUP_ID): void {
        const group = {
            Name: MUTE_GROUP_TITLE,
            ParentId
        }
        const mainGroup = this.createGroup(group);

        // Wrap in transaction to speed up insertion
        this.sourceGroups.forEach((srcGrp) => {
            srcGrp.channelGroups.forEach((chGrp) => {
                if (srcGrp.mute) {
                    chGrp.channels.forEach((ch) => {
                        this.addChannelToGroup({
                            Name: ch.Name,
                            ParentId: mainGroup,
                            TargetId: ch.TargetId,
                            TargetChannel: ch.TargetChannel,
                        })
                    });
                }
            });
        });
    };

    /**
     * Creates a new group and inserts all channels except those with the removeFromFallback flag set
     * @param parentGroupId Group id to create the group under
     * 
     * @example
     * const p = new ProjectFile(PROJECT_INIT)
     * p.createMainGroup()
     */
    public createMainFallbackGroup(parentGroupId = MAIN_GROUP_ID): void {
        const mainGroup = this.createGroup({
            Name: FALLBACK_GROUP_TITLE,
            ParentId: parentGroupId
        });

        // Wrap in transaction to speed up insertion
        this.sourceGroups.forEach((srcGrp) => {
            srcGrp.channelGroups.forEach((chGrp) => {
                if (srcGrp.fallback) {
                    chGrp.channels.forEach((ch) => {
                        this.addChannelToGroup({
                            Name: ch.Name,
                            ParentId: mainGroup,
                            TargetId: ch.TargetId,
                            TargetChannel: ch.TargetChannel,
                        })
                    });
                }
            });
        });
    };

    /**
     * Creates a new group and inserts all channels except those with the removeFromDs flag set
     * @param parentGroupId Group id to create the group under
     * 
     * @example
     * const p = new ProjectFile(PROJECT_INIT)
     * p.createMainDsGroup()
     */
    public createMainDsGroup(parentGroupId = MAIN_GROUP_ID): void {
        const mainGroup = this.createGroup({
            Name: DS_GROUP_TITLE,
            ParentId: parentGroupId
        });

        // Wrap in transaction to speed up insertion
        this.sourceGroups.forEach((srcGrp) => {
            srcGrp.channelGroups.forEach((chGrp) => {
                if (srcGrp.dsData) {
                    chGrp.channels.forEach((ch) => {
                        this.addChannelToGroup({
                            Name: ch.Name,
                            ParentId: mainGroup,
                            TargetId: ch.TargetId,
                            TargetChannel: ch.TargetChannel,
                        })
                    });
                }
            });
        });
    };

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
     * console.log(muteGroupId);
     * // => 1
     */
    public getDsGroupID(): number | undefined {
        return this.getGroupIdFromName(DS_GROUP_TITLE);
    }

    /**
    * Cleans the R1 project by deleting all custom views, their controls, and any custom groups.
    * @param proj R1 project file
    * @param parentGroupId Group id of the parent custom group
    */
    public clean(parentGroupId = MAIN_GROUP_ID) {
        console.log("Cleaning R1 project.");

        const mainViewId = this.getViewIdFromName(MAIN_WINDOW_TITLE);

        // Remove anything to do with the AutoR1 Main view
        if (mainViewId) {
            this.removeNavButtons();

            const ctrlStmt = this.db.prepare('DELETE FROM Controls WHERE "ViewId" = ?')
            ctrlStmt.bind([mainViewId])
            ctrlStmt.run();
            console.log(`Deleted ${MAIN_WINDOW_TITLE} controls.`);

            const viewStmt = this.db.prepare('DELETE FROM Views WHERE "Name" = ?')
            viewStmt.bind([MAIN_WINDOW_TITLE]);
            viewStmt.run();
            console.log(`Deleted ${MAIN_WINDOW_TITLE} view.`);
        }

        const meterViewId = this.getViewIdFromName(METER_WINDOW_TITLE);

        // Remove anything to do with the AutoR1 Meter view
        if (meterViewId) {
            const ctrlStmt = this.db.prepare('DELETE FROM Controls WHERE "ViewId" = ?')
            ctrlStmt.bind([meterViewId]);
            ctrlStmt.run();
            console.log(`Deleted ${METER_WINDOW_TITLE} view controls.`);

            const viewStmt = this.db.prepare('DELETE FROM Views WHERE "Name" = ?')
            viewStmt.bind([METER_WINDOW_TITLE]);
            viewStmt.run();
            console.log(`Deleted ${METER_WINDOW_TITLE} view.`);
        }

        const eqViewId = this.getViewIdFromName(EQ_WINDOW_TITLE);

        // Remove anything to do with the AutoR1 EQ view
        if (eqViewId) {
            const ctrlStmt = this.db.prepare('DELETE FROM Controls WHERE "ViewId" = ?')
            ctrlStmt.bind([eqViewId]);
            ctrlStmt.run();
            console.log(`Deleted ${EQ_WINDOW_TITLE} view controls.`);

            const viewStmt = this.db.prepare('DELETE FROM Views WHERE "Name" = ?')
            viewStmt.bind([EQ_WINDOW_TITLE]);
            viewStmt.run();
            console.log(`Deleted ${EQ_WINDOW_TITLE} view.`);
        }

        const subArrayNameStmt = this.db.prepare("SELECT Name FROM SourceGroups WHERE Type = ?");
        const subArrayName = subArrayNameStmt.getAsObject([dbpr.SourceGroupTypes.SUBARRAY]) as any as { Name: string }

        if (subArrayName) {
            const getGroupIdStmt = this.db.prepare('SELECT GroupId FROM Groups WHERE Name = ? AND ParentId = ?');
            const groupId = getGroupIdStmt.getAsObject([subArrayName.Name, parentGroupId]) as any as { GroupId: number };

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

        const views = this.getAllRemoteViews()!.filter(v => (v.ViewId !== mainView?.ViewId) && (v.ViewId !== meterView?.ViewId) && (v.ViewId !== eqView?.ViewId));
        const buttonWidth = templates.getTemplateWidthHeight(AutoR1TemplateTitles.NAV_BUTTONS).width

        let standardPagesX = POS_X;
        let mainViewPosX = 230;
        let mainViewPosY = 20;
        let meterViewPosX = 230;
        let meterViewPosY = 20;
        let eqViewPosX = 230;
        let eqViewPosY = 20;

        const insertNavButton = (TargetId: number, sourceViewId: number, DisplayName: string, posX: number, posY: number) => {
            const navButtonTemplate = templates.getTemplateByName('Nav Button');

            const options: TemplateOptions = {
                DisplayName,
                TargetId,
                TargetChannel: dbpr.TargetChannels.NONE
            }

            this.insertTemplate(
                navButtonTemplate,
                sourceViewId,
                posX,
                posY,
                options
            );
        };

        const increaseControlPosYByAmount = this.db.prepare('UPDATE Controls SET PosY = PosY + ? WHERE ViewId = ?');

        const navButtonTemplate = templates.getTemplateByName(AutoR1TemplateTitles.NAV_BUTTONS);

        if (!navButtonTemplate) {
            throw new Error(`${AutoR1TemplateTitles.NAV_BUTTONS} template not found.`);
        }

        // Increase the Y position of all controls on the default pages to make space for the nav buttons
        if (mainView || meterView || eqView) {
            views.forEach((v, i) => {
                const vId = v.ViewId

                if (vId !== mainView?.ViewId && vId !== meterView?.ViewId && vId !== eqView?.ViewId) {
                    increaseControlPosYByAmount.run([NAV_BUTTON_Y + NAV_BUTTON_SPACING, vId]);
                }
            });
        }

        if (mainView) {
            views.forEach((v, i) => {
                insertNavButton(mainView.ViewId, v.ViewId, MAIN_WINDOW_TITLE, standardPagesX, NAV_BUTTON_Y)
            });

            standardPagesX += buttonWidth + SPACING;

            if (meterView) {
                insertNavButton(meterView.ViewId, mainView.ViewId, METER_WINDOW_TITLE, mainViewPosX, mainViewPosY)

                mainViewPosX += buttonWidth + SPACING;
            }

            if (eqView) {
                insertNavButton(eqView.ViewId, mainView.ViewId, EQ_WINDOW_TITLE, mainViewPosX, mainViewPosY)

                mainViewPosX += buttonWidth + SPACING;
            }
        }

        if (meterView) {
            views.forEach((v, i) => {
                insertNavButton(meterView.ViewId, v.ViewId, METER_WINDOW_TITLE, standardPagesX, NAV_BUTTON_Y)
            });

            standardPagesX += buttonWidth + SPACING;

            if (mainView) {
                insertNavButton(mainView.ViewId, meterView.ViewId, MAIN_WINDOW_TITLE, meterViewPosX, meterViewPosY)

                meterViewPosX += buttonWidth + SPACING;
            }

            if (eqView) {
                insertNavButton(eqView.ViewId, meterView.ViewId, EQ_WINDOW_TITLE, meterViewPosX, meterViewPosY)

                meterViewPosX += buttonWidth + SPACING;
            }
        }

        if (eqView) {
            views.forEach((v, i) => {
                insertNavButton(eqView.ViewId, v.ViewId, EQ_WINDOW_TITLE, standardPagesX, NAV_BUTTON_Y)
            });

            standardPagesX += buttonWidth + SPACING;

            if (mainView) {
                insertNavButton(mainView.ViewId, eqView.ViewId, MAIN_WINDOW_TITLE, eqViewPosX, eqViewPosY)

                eqViewPosX += buttonWidth + SPACING;
            }

            if (meterView) {
                insertNavButton(meterView.ViewId, eqView.ViewId, METER_WINDOW_TITLE, eqViewPosX, eqViewPosY)

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
        const getControlsStmt = () => this.db.prepare(`SELECT ViewId FROM Controls WHERE "TargetId" = ? AND "TargetChannel" = ? AND "TargetType" = ?`);
        const deleteControlsStmt = () => this.db.prepare(`DELETE FROM Controls WHERE "TargetId" = ? AND "TargetChannel" = ? AND "TargetType" = ?`);
        const updateControlsStmt = this.db.prepare('UPDATE Controls SET PosY = PosY - ? WHERE ViewId = ?');

        const mainView = this.getMainView();
        const meterView = this.getMeterView();
        const eqView = this.getEQView();

        let viewIdsWithNavButtons: number[] = []

        if (mainView) {
            viewIdsWithNavButtons = dbpr.getAllAsObjects<{ ViewId: number }>(getControlsStmt(), [mainView.ViewId, dbpr.TargetChannels.NONE, dbpr.TargetTypes.VIEW]).map((c) => c.ViewId).filter((vId) => vId !== mainView.ViewId);

            deleteControlsStmt().run([mainView.ViewId, dbpr.TargetChannels.NONE, dbpr.TargetTypes.VIEW]);
        }

        if (meterView) {
            viewIdsWithNavButtons = dbpr.getAllAsObjects<{ ViewId: number }>(getControlsStmt(), [meterView.ViewId, dbpr.TargetChannels.NONE, dbpr.TargetTypes.VIEW]).map((c) => c.ViewId).filter((vId) => vId !== meterView.ViewId);

            deleteControlsStmt().run([meterView.ViewId, dbpr.TargetChannels.NONE, dbpr.TargetTypes.VIEW]);
        }

        if (eqView) {
            viewIdsWithNavButtons = dbpr.getAllAsObjects<{ ViewId: number }>(getControlsStmt(), [eqView.ViewId, dbpr.TargetChannels.NONE, dbpr.TargetTypes.VIEW]).map((c) => c.ViewId).filter((vId) => vId !== eqView.ViewId);

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
        const apChannelGroups: Channel[] = [];

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
            console.debug("No AP channel groups found.")

            return false;
        }

        this.createGroup({
            Name: AP_GROUP_TITLE,
            ParentId: parentGroupId
        });
        const apGroupId = this.getHighestGroupID()!;

        // Wrap in transaction to speed up insertion
        apChannelGroups.forEach((ch) => {
            this.addChannelToGroup({
                Name: ch.Name,
                ParentId: apGroupId,
                TargetId: ch.TargetId,
                TargetChannel: ch.TargetChannel,
            });
        });

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
        let subGroups: Channel[][] = [];

        // Order allows a specific order type to be returned from the database, allowing devices to be
        // order from stage right to stage left across all groups
        let prefixes = ["L", "R", "C"];

        for (let prefix of prefixes) {
            let query = `
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

            let rtn = dbpr.getAllAsObjects<Channel>(stmt);

            if (rtn && rtn.length) {
                subGroups.push(rtn);
            }
        }

        return subGroups;
    }

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
        const subArrayGroup = this.db.prepare(
            `SELECT Name FROM SourceGroups WHERE Type = ${dbpr.SourceGroupTypes.SUBARRAY}`
        ).getAsObject({}) as { Name: string };

        if (!subArrayGroup || !subArrayGroup.Name) {
            console.warn("No sub array group found");
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

        let suffix = [" SUBs L", " SUBs R", " SUBs C"];
        let subArrayGroups = this.getSubArrayGroups();

        // Wrap in transaction to speed up insertion
        for (const [idx, subArrayGroup] of subArrayGroups.entries()) {
            this.createGroup({
                Name: `${subArrayGroupName}${suffix[idx]}`, ParentId: subGroupParentID
            });
            let pId = this.getHighestGroupID()!;

            for (const subDevices of subArrayGroup) {
                this.addChannelToGroup({
                    Name: subDevices.Name,
                    ParentId: pId,
                    TargetId: subDevices.TargetId, TargetChannel: subDevices.TargetChannel,
                });
            }
        }
    }

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
            console.debug("No sub left group found");
            return;
        }

        let success = false;

        for (const srcGrp of this.sourceGroups) {
            for (const chGrp of srcGrp.channelGroups) {
                if (chGrp.type === 'TYPE_SUBS_C') {
                    for (const channel of chGrp.channels) {
                        this.addChannelToGroup({
                            Name: channel.Name,
                            ParentId: pId,
                            TargetId: channel.TargetId, TargetChannel: channel.TargetChannel,
                        });
                        success = true;
                    }
                }
            }
        }

        if (!success) {
            console.debug("No sub centre group found");

            return;
        }
    }

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
        let rtn = stmt.getAsObject({}) as { Name: string };
        let groupCount = 0;
        if (rtn) {
            let name = rtn.Name;
            let str = [" SUBs L", " SUBs R", " SUBs C"];
            for (const s of str) {
                let q = `SELECT * FROM Groups WHERE Name = ?`;
                const stmt = this.db.prepare(q);
                const rtn = stmt.getAsObject([`${name}${s}`]) as any as dbpr.Group;
                if (rtn && rtn.GroupId) {
                    groupCount++;
                }
            }
        }
        return groupCount;
    }

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
            throw new Error("SourceGroups not loaded");
        }

        return this.sourceGroups.find((src) => src.hasArrayProcessingEnabled()) ? true : false;
    }

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
        const view = stmt.getAsObject([name]) as any as dbpr.View;

        if (!view || !view.ViewId) {
            console.log(`Could not find view with name '${name}'`)

            return undefined;
        }

        return view;
    }

    /**
     * Creates the Meter vew and associated controls
     * @param templates AutoR1 template file containing the Meter view templates
     * @returns void
     */
    public createMeterView = (templates: AutoR1TemplateFile): void => {
        if (!this.sourceGroups.length) {
            throw (new Error("No source groups found."))
        }

        const metersTitleDimensions = templates.getTemplateWidthHeight(AutoR1TemplateTitles.METERS_TITLE);
        const titleH = metersTitleDimensions.height
        const metersGroupDimensions = templates.getTemplateWidthHeight(AutoR1TemplateTitles.METERS_GROUP);
        const meterGrpW = metersGroupDimensions.width;
        const meterGrpH = metersGroupDimensions.height;
        const { width: meterW, height: meterH } = templates.getTemplateWidthHeight(AutoR1TemplateTitles.METER);

        const spacingX = Math.max(meterW, meterGrpW) + METER_SPACING_X;
        const spacingY = meterH + METER_SPACING_Y;

        const HRes = (spacingX * this.getChannelMeterGroupTotal()[0]) + METER_SPACING_X;
        const VRes = titleH + meterGrpH + (spacingY * this.getChannelMeterGroupTotal()[1]) + 100;

        this.db.prepare(`INSERT INTO Views('Type','Name','Icon','Flags','HomeViewIndex','NaviBarIndex','HRes','VRes','ZoomLevel','ScalingFactor','ScalingPosX','ScalingPosY','ReferenceVenueObjectId') VALUES (1000,'${METER_WINDOW_TITLE}',NULL,4,NULL,-1,${HRes},${VRes},100,NULL,NULL,NULL,NULL);`).run();
        const rtn = this.db.prepare(`SELECT max(ViewId) FROM Views`).getAsObject({}) as { 'max(ViewId)': number };
        if (!rtn) {
            throw (Error(`Could not create Auto R1 Meter view`));
        }
        const meterViewId = rtn['max(ViewId)'];

        let posX = METER_VIEW_STARTX;
        let posY = METER_VIEW_STARTY;

        const navButtonTemplate = templates.getTemplateByName(AutoR1TemplateTitles.NAV_BUTTONS);

        const metersTitleTemplate = templates.getTemplateByName(AutoR1TemplateTitles.METERS_TITLE);

        this.insertTemplate(
            metersTitleTemplate,
            meterViewId,
            posX,
            posY,
        );
        posY += templates.getTemplateWidthHeight(AutoR1TemplateTitles.METERS_TITLE).height + METER_SPACING_Y;

        let startY = posY;

        const metersGroupTemplate = templates.getTemplateByName(AutoR1TemplateTitles.METERS_GROUP);

        const meterTemplate = templates.getTemplateByName(AutoR1TemplateTitles.METER);

        const metersGroupHeight = templates.getTemplateWidthHeight(AutoR1TemplateTitles.METERS_GROUP).height

        // Wrap in transaction to speed up insertion
        for (const srcGrp of this.sourceGroups) {
            srcGrp.channelGroups.forEach((chGrp) => {

                // Skip TOPs and SUBs group if L/R groups are present
                if (chGrp.hasLorR() && !chGrp.isLorR()) {
                    return;
                }

                const joinedId = this.getHighestJoinedID()! + 1;
                const metersGroupTemplateOptions: TemplateOptions = {
                    DisplayName: chGrp.name,
                    TargetId: chGrp.groupId,
                    joinedId
                }
                this.insertTemplate(
                    metersGroupTemplate,
                    meterViewId,
                    posX,
                    posY,
                    metersGroupTemplateOptions,
                );

                const navButtonTemplateOptions: TemplateOptions = {
                    DisplayName: chGrp.name,
                    TargetId: srcGrp.ViewId,
                    TargetChannel: dbpr.TargetChannels.NONE,
                    Width: meterW + 2, // R1 frames are to be 2px wider than expected
                    joinedId
                }
                this.insertTemplate(
                    navButtonTemplate,
                    meterViewId,
                    posX - 1, // R1 frames are to be 1px further to the left than expected
                    posY - 1, // R1 frames are to be 1px higher than expected
                    navButtonTemplateOptions
                )

                posY += metersGroupHeight + 10;

                for (const ch of chGrp.channels) {
                    const DisplayName = `${ch.Name} - ${this.getCanIdFromDeviceId(ch.TargetId)} - ${['', 'A', 'B', 'C', 'D'][ch.TargetChannel]}`;
                    const meterTemplateOptions: TemplateOptions = {
                        DisplayName,
                        TargetId: ch.TargetId,
                        TargetChannel: ch.TargetChannel,
                        sourceGroupType: srcGrp.Type
                    }
                    this.insertTemplate(
                        meterTemplate,
                        meterViewId,
                        posX,
                        posY,
                        meterTemplateOptions
                    );

                    posY += spacingY;
                }

                posX += spacingX;
                posY = startY;
            });
        }
    }

    /**
     * Creates the EQ vew and associated controls
     * @param templateFile AutoR1 template file containing the Meter view templates
     * @returns void
     */
    public createEqView(templateFile: AutoR1TemplateFile): void {
        const H_RES = 2840;
        const V_RES = 3500;
        const BUFFER = 10;
        const INITIAL_POS_X = 20;
        const ZOOM_LEVEL = 50;

        let posX = INITIAL_POS_X;
        let posY = 20;

        const { width: eqTemplateWidth, height: eqTemplateHeight } = templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.EQ1);

        const query = `INSERT INTO Views('Type','Name','Icon','Flags','HomeViewIndex','NaviBarIndex','HRes','VRes','ZoomLevel','ScalingFactor','ScalingPosX','ScalingPosY','ReferenceVenueObjectId') VALUES (1000,?,NULL,4,NULL,-1,?,?,?,NULL,NULL,NULL,NULL);`;

        this.db.prepare(query).run([EQ_WINDOW_TITLE, H_RES, V_RES, ZOOM_LEVEL]);
        const rtn = this.db.prepare(`SELECT max(ViewId) FROM Views`).getAsObject({}) as any as { 'max(ViewId)': number };
        if (!rtn) {
            throw (Error(`Could not create Auto R1 Meter view`));
        }
        const eqViewId = rtn['max(ViewId)'];

        let eqTemplate = templateFile.getTemplateByName(AutoR1TemplateTitles.EQ1);
        let eqTitleTemplate = templateFile.getTemplateByName(AutoR1TemplateTitles.EQ1_TITLE);
        for (let i = 0; i < 2; i += 1) {
            this.insertTemplate(
                eqTitleTemplate,
                eqViewId,
                posX,
                posY,
            );

            posY += eqTitleTemplate.height + BUFFER;

            const sourcesWithEqViews = this.sourceGroups.filter(sg => sg.hasEQView());
            let index = 0;
            sourcesWithEqViews.forEach((sourceGroup) => {
                let primaryChannelGroups = sourceGroup.channelGroups.filter(cg => !cg.mainGroup)

                // Point Sources with both SUBs and TOPs only get a single, combined EQ for some reason. Remove one of the channel groups to prevent doubling up.
                primaryChannelGroups = primaryChannelGroups.filter((cg) => {
                    if (sourceGroup.Type !== dbpr.SourceGroupTypes.POINT_SOURCE) {
                        return cg
                    } else {
                        if (sourceGroup.hasSUBs() && sourceGroup.hasTOPs()) {
                            if (cg.isSUBs()) {
                                return false
                            } else {
                                return cg;
                            }
                        } else {
                            return cg;
                        }
                    }
                })

                primaryChannelGroups.forEach((channelGroup) => {
                    let TargetId = -1;

                    // Array types have sub groups 
                    if (sourceGroup.Type === dbpr.SourceGroupTypes.ARRAY) {
                        // Array sources with both SUBs and TOPs need sub groups assigned correctly
                        if (channelGroup.isSUBs() && sourceGroup.hasTOPs()) {
                            TargetId = sourceGroup.childGroupIds[0];
                        } else if (channelGroup.isTOPs() && sourceGroup.hasSUBs()) {
                            TargetId = sourceGroup.childGroupIds[1];
                        } else {
                            // Array sources without both SUBs and TOPs only have a single sub group
                            TargetId = sourceGroup.childGroupIds[0];
                        }
                    } else {
                        // Point sources with SUBs and TOPs have sub groups
                        if (channelGroup.isSUBs() && sourceGroup.hasTOPs()) {
                            TargetId = sourceGroup.childGroupIds[0];
                        } else if (channelGroup.isTOPs() && sourceGroup.hasSUBs()) {
                            TargetId = sourceGroup.childGroupIds[1];
                        } else {
                            // SUBarrays, point sources without both SUBs and TOPs and additional amplifiers do not have sub groups
                            TargetId = sourceGroup.masterGroupId!;
                        }
                    }

                    const metersGroupTemplateOptions: TemplateOptions = {
                        DisplayName: channelGroup.name,
                        TargetId
                    }

                    this.insertTemplate(
                        eqTemplate,
                        eqViewId,
                        posX,
                        posY,
                        metersGroupTemplateOptions,
                    );

                    index += 1;
                    posX += BUFFER + eqTemplateWidth;
                    if (!(index % 5)) {
                        posX = INITIAL_POS_X;
                        posY += BUFFER + eqTemplateHeight;
                    }
                })
            })

            eqTemplate = templateFile.getTemplateByName(AutoR1TemplateTitles.EQ2);
            eqTitleTemplate = templateFile.getTemplateByName(AutoR1TemplateTitles.EQ2_TITLE);
            posX = INITIAL_POS_X;
            posY += BUFFER + eqTemplateHeight + 100;
        }

        const updateQuery = `UPDATE Views SET VRes = ? WHERE ViewId = ?`
        this.db.prepare(updateQuery).run([posY += BUFFER, eqViewId]);
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
    private createMainViewOverview(templateFile: AutoR1TemplateFile, posX: number, posY: number, mainViewId: number) {

        const mainOverviewTemplate = templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.MAIN_OVERVIEW);
        const mainFallbackTemplate = templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.MAIN_FALLBACK);

        this.insertTemplate(
            templateFile.getTemplateByName(AutoR1TemplateTitles.MAIN_TITLE),
            mainViewId,
            posX,
            posY,
        )
        posY += templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.MAIN_TITLE).height + METER_SPACING_Y;

        const mainMainTemplateOptions: TemplateOptions = {
            TargetId: this.getMasterGroupID()
        }

        this.insertTemplate(
            templateFile.getTemplateByName(AutoR1TemplateTitles.MAIN_OVERVIEW),
            mainViewId,
            posX,
            posY,
            mainMainTemplateOptions
        )

        const fallbackGroupID = (() => {
            try {
                return this.getFallbackGroupID()
            } catch {
                return undefined;
            }
        })()

        this.insertTemplate(
            templateFile.getTemplateByName(AutoR1TemplateTitles.MAIN_FALLBACK),
            mainViewId,
            posX,
            posY + mainOverviewTemplate.height + 10,
            fallbackGroupID ? { TargetId: this.getFallbackGroupID() } : mainMainTemplateOptions
        )

        this.insertTemplate(
            templateFile.getTemplateByName('Main DS10'),
            mainViewId,
            posX + mainFallbackTemplate.width + 10,
            posY + mainOverviewTemplate.height + 10,
            { TargetId: this.getDsGroupID() }
        )

        posX += mainOverviewTemplate.width + (METER_SPACING_X / 2);

        /**
         * Configure the main mute switch
         */
        const muteGroup = this.getAllGroups()!.find((group) => group.Name === MUTE_GROUP_TITLE);
        if (muteGroup) {
            const mainMute = this.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND Type = ${dbpr.ControlTypes.SWITCH} AND DisplayName = ?`).getAsObject(['Mute']) as any as dbpr.Control;
            this.db.prepare(`DELETE FROM Controls WHERE ControlId = ${mainMute.ControlId}`).run();
            mainMute.TargetId = muteGroup.GroupId;
            this.insertControl(mainMute);
        }

        /**
         * Configure the fallback indicator
         */
        const fallbackGroup = this.getAllGroups()!.find((group) => group.Name === FALLBACK_GROUP_TITLE);
        if (fallbackGroup) {
            const mainFallback = this.db.prepare(`SELECT * FROM Controls WHERE ViewId = ? AND Type = ? AND TargetProperty = ?`).getAsObject([mainViewId, dbpr.ControlTypes.LED, dbpr.TargetPropertyType.STATUS_INPUT_FALLBACK_ACTIVE]) as any as dbpr.Control;
            this.db.prepare(`DELETE FROM Controls WHERE ControlId = ${mainFallback.ControlId}`).run();
            mainFallback.TargetId = fallbackGroup.GroupId;
            this.insertControl(mainFallback);
        }

        /**
         * Configure the DS data indicator
         */
        // const dsGroup = this.getAllGroups()!.find((group) => group.Name === DS_GROUP_TITLE);
        // if (dsGroup) {
        //     const mainDs = this.db.prepare(`SELECT * FROM Controls WHERE ViewId = ? AND Type = ? AND TargetProperty = ?`).getAsObject([mainViewId, dbpr.ControlTypes.LED, dbpr.TargetPropertyType.INPUT_DIGITAL_DS_DATA_PRI]) as any as dbpr.Control;
        //     this.db.prepare(`DELETE FROM Controls WHERE ControlId = ${mainDs.ControlId}`).run();
        //     mainDs.TargetId = dsGroup.GroupId;
        //     this.insertControl(mainDs);
        // }

        const apGroupId = this.getAPGroup()?.GroupId;

        if (this.getApStatus()) {
            const thcTemplateOptions: TemplateOptions = {
                TargetId: apGroupId
            }
            this.insertTemplate(
                templateFile.getTemplateByName(AutoR1TemplateTitles.THC),
                mainViewId,
                posX,
                posY,
                thcTemplateOptions,
            )
            posX += templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.THC).width + (METER_SPACING_X * 4)
        } else {
            posX += METER_SPACING_X * 4;
        }

        return { posX, posY };
    }

    /**
     * Configure a template and it's controls to be inserted into the AutoR1 Main View view
     * @param templateFile Loaded .r2t template file
     * @param sourceGroup Source group to configure the template for
     * @param channelGroup Channel group to configure the template for
     * @param commonJoinedId Joined ID to use for all controls
     * @param posX X position to start inserting controls
     * @param posY Y position to start inserting controls
     * @param mainViewId ID of the main view
     * 
     * @example
     * const p = new ProjectFile(PROJECT_INIT)
     * createMainView(p, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, "SUBs L")
     */
    public static configureMainViewMeterTemplate(templateFile: AutoR1TemplateFile, sourceGroup: SourceGroup, channelGroup: ChannelGroup, commonJoinedId: number, posX: number, posY: number, mainViewId: number) {
        const template = new TemporaryTemplate();
        template.setName('Group');
        template.setLR(sourceGroup.isStereo());
        template.setAP(sourceGroup.hasArrayProcessingEnabled());
        template.setCPL2(sourceGroup.hasCPLv2());
        template.load(templateFile);

        if (!template.controls) {
            throw new Error(`Template ${template.name} does not have any controls.`);
        }

        const controls: AutoR1Control[] = [];

        let meterChannelIndex = 0;
        let muteChannelIndex = 0;
        template.controls.forEach((control) => {
            // Handle mono ChannelGroup
            let meterChannelGroup = channelGroup;
            if (channelGroup.leftGroup && muteChannelIndex === 0) {
                meterChannelGroup = channelGroup.leftGroup;
            } else if (channelGroup.rightGroup && meterChannelIndex === 1) {
                meterChannelGroup = channelGroup.rightGroup;
            }

            const meterTarget = {
                TargetId: meterChannelGroup.channels[0].TargetId,
                TargetChannel: meterChannelGroup.channels[0].TargetChannel
            };

            let muteGroup = channelGroup.groupId;
            if (channelGroup.leftGroup && muteChannelIndex === 0) {
                muteGroup = channelGroup.leftGroup.groupId
            } else if (channelGroup.rightGroup && muteChannelIndex === 1) {
                muteGroup = channelGroup.rightGroup.groupId;
            }

            const meterChannelCallback = () => meterChannelIndex += 1;
            const muteChannelCallback = () => muteChannelIndex += 1;

            if (control.isVisible(channelGroup, sourceGroup)) {
                control.configureForMainView(commonJoinedId, meterTarget, muteGroup, sourceGroup, channelGroup, posX, posY, mainViewId, meterChannelCallback, muteChannelCallback);

                if (control.isTypeSwitch() && control.TargetProperty === dbpr.TargetPropertyType.CONFIG_MUTE) {
                }

                controls.push(control);
            }
        });

        return controls;
    }

    /**
     * Inserts the meter portion of the Main view
     * @param templateFile Loaded .r2t template file
     * @param posX X position to start inserting controls
     * @param posY Y position to start inserting controls
     * @param mainViewId ID of the main view
     */
    private createMainViewMeters(templateFile: AutoR1TemplateFile, posX: number, posY: number, mainViewId: number, createArraySightControls = true) {
        const {
            height: arraySightTempHeight
        } = templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.MAIN_ARRAYSIGHT_FRAME);

        const {
            width: meterTempWidth
        } = templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.GROUP_LR_AP_CPL2);

        // Wrap in transaction to speed up insertion
        this.sourceGroups.forEach((sourceGroup, srcGrpIndex) => {
            sourceGroup.channelGroups.forEach((channelGroup, chGrpIndex) => {
                const commonJoinedId = this.getHighestJoinedID()! + 1;

                if (channelGroup.isLorR()) {  // TOP or SUB L/R/C Group
                    return;
                }

                const meterPosY = posY + arraySightTempHeight + 5;
                const controls = AutoR1ProjectFile.configureMainViewMeterTemplate(templateFile, sourceGroup, channelGroup, commonJoinedId, posX, meterPosY, mainViewId);

                controls.forEach((control) => this.insertControl(control));

                if (sourceGroup.ArraySightId && createArraySightControls) {
                    const joinedId = this.getHighestJoinedID()! + 1;

                    this.insertTemplate(
                        templateFile.getTemplateByName(AutoR1TemplateTitles.MAIN_ARRAYSIGHT_FRAME),
                        mainViewId,
                        posX,
                        posY,
                        { joinedId }
                    );

                    const ids = [sourceGroup.ArraySightId, sourceGroup.ArraySightIdR].filter((id) => id);

                    const arraySightTemplate = new TemporaryTemplate();
                    arraySightTemplate.setName(AutoR1TemplateTitles.MAIN_ARRAYSIGHT);
                    arraySightTemplate.setLR(!!sourceGroup.ArraySightIdR);
                    arraySightTemplate.load(templateFile);

                    ids.forEach((TargetId, i) => {
                        const arraySightTemplateOptions: TemplateOptions = {
                            TargetId,
                            joinedId
                        }
                        this.insertTemplate(
                            arraySightTemplate as any,
                            mainViewId,
                            posX + 4 + (i * 67),
                            posY + 3,
                            arraySightTemplateOptions
                        );
                    })
                }

                const navButtonTemplateOptions: TemplateOptions = {
                    DisplayName: channelGroup.name,
                    TargetId: sourceGroup.ViewId,
                    TargetChannel: dbpr.TargetChannels.NONE,
                    joinedId: commonJoinedId,
                    Width: templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.NAV_BUTTONS).width + 2, // R1 frames are to be 2px wider than expected
                }
                this.insertTemplate(
                    templateFile.getTemplateByName(AutoR1TemplateTitles.NAV_BUTTONS),
                    mainViewId,
                    posX - 1, // R1 frames are to be 1px further to the left than expected
                    meterPosY - 1, // R1 frames are to be 1px higher than expected
                    navButtonTemplateOptions
                )

                posX += meterTempWidth + METER_SPACING_X;
            });
        })
    }

    /**
     * Create the main AutoR1 view within the project
     * @param templateFile Loaded .r2t template file
     */
    public createMainView(templateFile: AutoR1TemplateFile, createArraySightControls = true) {
        // Get width + height of templates used
        const { width: mainTempWidth } = templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.MAIN_OVERVIEW);
        const { width: meterTempWidth } = templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.GROUP_LR_AP_CPL2);

        const METER_TEMP_BUFFER = 200;
        let posX = MAIN_VIEW_STARTX, posY = MAIN_VIEW_STARTY;

        const V_RES = 1200;
        const H_RES = (
            mainTempWidth
            + ((METER_SPACING_X + meterTempWidth) * this.getChannelMainGroupTotal())
            + METER_TEMP_BUFFER + 400
        );

        this.db.prepare(
            `INSERT INTO Views("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`
        ).run([1000, MAIN_WINDOW_TITLE, null, 4, null, -1, H_RES, V_RES, 100, null, null, null, null]);
        const rtn = this.db.prepare(
            'SELECT max(ViewId) FROM Views'
        ).getAsObject({}) as any as { 'max(ViewId)': number };

        const MAIN_VIEW_ID = rtn['max(ViewId)'];

        const { posX: overviewPosX } = this.createMainViewOverview(templateFile, posX, posY, MAIN_VIEW_ID);

        this.createMainViewMeters(templateFile, overviewPosX, 67, MAIN_VIEW_ID, createArraySightControls);
    }

    createAll = (templates: AutoR1TemplateFile, parentId: number, options: ProjectOptions = { main: true, meter: true, eq: true, arraySightControls: true }) => {

        this.createAPGroup(parentId);
        this.createMainFallbackGroup(parentId);
        this.createMainMuteGroup(parentId);
        this.createMainDsGroup(parentId);
        if (options.main) this.createMainView(templates, options.arraySightControls);
        if (options.meter) this.createMeterView(templates);
        if (options.eq) this.createEqView(templates);
        this.createNavButtons(templates);
        this.addSubCtoSubL();
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
    TargetChannel = dbpr.TargetChannels.NONE
    TargetId = -1;
    TargetProperty: dbpr.TargetPropertyType | null = null;
    TargetRecord = 0
    TargetType = 0;
    ThresholdValue = 0.0;
    Type = dbpr.ControlTypes.LED;
    UniqueName: string | null = null;
    ViewId = -1;
    Width = 0;

    constructor(row?: dbpr.Control) {
        if (row) {
            const { ViewId, Type, PosX, PosY, Width, Height, DisplayName, TargetId, TargetChannel, TargetProperty, ActionType, Alignment, ConfirmOffMsg, ConfirmOnMsg, ControlId, Dimension, Flags, Font, JoinedId, LabelAlignment, LabelColor, LabelFont, LimitMin, LimitMax, LineThickness, MainColor, PictureIdDay, PictureIdNight, SubColor, TargetRecord, TargetType, ThresholdValue, UniqueName } = row;
            this.ViewId = ViewId;
            this.Type = Type;
            this.PosX = PosX;
            this.PosY = PosY;
            this.Width = Width;
            this.Height = Height;
            this.DisplayName = DisplayName;
            this.TargetId = TargetId;
            this.TargetChannel = TargetChannel;
            this.ActionType = ActionType;
            this.Alignment = Alignment;
            this.ConfirmOffMsg = ConfirmOffMsg;
            this.ConfirmOnMsg = ConfirmOnMsg;
            this.ControlId = ControlId;
            this.Dimension = Dimension;
            this.Flags = Flags;
            this.Font = Font;
            this.JoinedId = JoinedId;
            this.LabelAlignment = LabelAlignment;
            this.LabelColor = LabelColor;
            this.LabelFont = LabelFont;
            this.LimitMin = LimitMin;
            this.LimitMax = LimitMax;
            this.LineThickness = LineThickness;
            this.MainColor = MainColor;
            this.PictureIdDay = PictureIdDay;
            this.PictureIdNight = PictureIdNight;
            this.SubColor = SubColor;
            this.TargetProperty = TargetProperty;
            this.TargetRecord = TargetRecord;
            this.TargetType = TargetType;
            this.ThresholdValue = ThresholdValue;
            this.UniqueName = UniqueName;
        }
    }

    public isCPL = (): boolean => {
        return this.DisplayName === 'CPL';
    }

    public isCUT = (): boolean => {
        return this.DisplayName === 'CUT';
    }

    public isViewEQButton = (): boolean => {
        return this.DisplayName === 'View EQ';
    }

    public targetsLoadMatchEnable() {
        return this.TargetProperty === dbpr.TargetPropertyType.CONFIG_LOAD_MATCH_ENABLE;
    }

    public targetsCPL() {
        return this.TargetProperty === dbpr.TargetPropertyType.CONFIG_FILTER3;
    }

    public isTypeDigital() {
        return this.Type === dbpr.ControlTypes.DIGITAL
    }

    public isTypeMeter() {
        return this.Type === dbpr.ControlTypes.METER;
    }

    public isTypeFrame() {
        return this.Type === dbpr.ControlTypes.FRAME;
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

    /**
     * Determins whether a control will be displayed or not
     * @param channelGroup ChannelGroup control will be associated with
     * @param sourceGroup SourceGroup control will be associated with
     * @returns True if will be visible, false if not
     */
    public isVisible(channelGroup: ChannelGroup, sourceGroup: SourceGroup) {
        if (this.isTypeDigital() && this.targetsCPL() && !channelGroup.hasCPL()
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

    public configureForMainView(joinedId: number, MeterChannel: {
        TargetId: number,
        TargetChannel: number
    }, muteTargetId: number, sourceGroup: SourceGroup, channelGroup: ChannelGroup, posX: number, posY: number, viewId: number, meterChannelCallback?: () => void, muteChannelCallback?: () => void) {
        this.JoinedId = joinedId
        this.TargetId = channelGroup.groupId

        // Update Infra/100hz button text
        if (this.isCUT()) {
            this.DisplayName = sourceGroup.xover
        }

        // Meters, these require a TargetChannel
        if (this.isTypeMeter()) {
            this.TargetId = MeterChannel.TargetId
            this.TargetChannel = MeterChannel.TargetChannel

            if (meterChannelCallback) meterChannelCallback();
        } else if (this.isTypeSwitch()) {
            if (this.TargetProperty === dbpr.TargetPropertyType.CONFIG_MUTE) {
                // Mute
                this.TargetId = muteTargetId

                if (muteChannelCallback) muteChannelCallback();
            }

            if (this.isViewEQButton()) {
                // ViewEQ Button
                this.TargetId = sourceGroup.ViewId + 1
            }
        } else if (this.isTypeFrame()) {
            if (this.DisplayName) {
                this.DisplayName = channelGroup.name
            }
        } else if (this.isTypeDigital()) {

            // Assign delay controls to default R1 groups
            if (this.targetsDelay()) {
                // Array types have sub groups 
                if (sourceGroup.Type === dbpr.SourceGroupTypes.ARRAY) {
                    // Array sources with both SUBs and TOPs need sub groups assigned correctly
                    if (channelGroup.isSUBs() && sourceGroup.hasTOPs()) {
                        this.TargetId = sourceGroup.childGroupIds[0];
                    } else if (channelGroup.isTOPs() && sourceGroup.hasSUBs()) {
                        this.TargetId = sourceGroup.childGroupIds[1];
                    } else {
                        // Array sources without both SUBs and TOPs only have a single sub group
                        this.TargetId = sourceGroup.childGroupIds[0];
                    }
                } else {
                    // Point sources with SUBs and TOPs have sub groups
                    if (channelGroup.isSUBs() && sourceGroup.hasTOPs()) {
                        this.TargetId = sourceGroup.childGroupIds[0];
                    } else if (channelGroup.isTOPs() && sourceGroup.hasSUBs()) {
                        this.TargetId = sourceGroup.childGroupIds[1];
                    } else {
                        // SUBarrays, point sources without both SUBs and TOPs and additional amplifiers do not have sub groups
                        this.TargetId = sourceGroup.masterGroupId!;
                    }
                }
            }

            if ((this.targetsDelay() || this.targetsLevel())
                && (
                    channelGroup.name.toLowerCase().includes('fill')
                    || channelGroup.hasRelativeDelay(sourceGroup)
                )) {
                // Set relative digital control
                this.Flags = dbpr.ControlFlags.RELATIVE
                this.LimitMin = -9999.5
                this.LimitMax = 9999
            }
        }

        if (this.isVisible(channelGroup, sourceGroup)) {
            this.PosX = this.PosX + posX
            this.PosY = this.PosY + posY
            this.ViewId = viewId
            this.ConfirmOffMsg = null
            this.ConfirmOnMsg = null
        }

        return this
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
        this.id = sections.Id
        this.name = sections.Name
        this.parentId = sections.ParentId
        this.joinedId = sections.JoinedId
        this.width = width;
        this.height = height;

        this.controls = [];
        controls.forEach((control) => {
            this.controls.push(new AutoR1Control(control));
        })
    }

    public configureForMainView(joinedId: number, MeterChannel: number, muteTargetId: number, sourceGroup: SourceGroup, channelGroup: ChannelGroup, posX: number, posY: number, viewId: number) {
        this.controls?.forEach((control) => {

            control.JoinedId = joinedId
            control.TargetId = channelGroup.groupId

            // Update Infra/100hz button text
            if (control.isCUT()) {
                control.DisplayName = sourceGroup.xover
            }

            // Meters, these require a TargetChannel
            if (control.isTypeMeter()) {
                control.TargetChannel = MeterChannel
            } else if (control.isTypeSwitch()) {
                if (control.TargetProperty === dbpr.TargetPropertyType.CONFIG_MUTE) {
                    // Mute
                    control.TargetId = muteTargetId
                }

                if (control.isViewEQButton()) {
                    // ViewEQ Button
                    control.TargetId = sourceGroup.ViewId + 1
                }
            } else if (control.isTypeFrame()) {
                if (control.DisplayName) {
                    control.DisplayName = channelGroup.name
                }
            } else if (control.isTypeDigital()) {
                if ((control.targetsDelay() || control.targetsLevel())
                    && (
                        channelGroup.name.toLowerCase().includes('fill')
                        || channelGroup.type === 'TYPE_SUBS'
                        || channelGroup.type === 'TYPE_POINT_TOPS'
                        || channelGroup.type === 'TYPE_POINT_SUBS'
                    )) {
                    // Set relative digital control
                    control.Flags = dbpr.ControlFlags.RELATIVE
                    control.LimitMin = -9999.5
                    control.LimitMax = 9999
                }
            }

            if (control.isVisible(channelGroup, sourceGroup)) {
                control.PosX = control.PosX + posX
                control.PosY = control.PosY + posY
                control.ViewId = viewId
                control.ConfirmOffMsg = null
                control.ConfirmOnMsg = null
            }
        })
    }
}

export class AutoR1TemplateFile extends dbpr.TemplateFile {
    templates: AutoR1Template[] = [];

    constructor(db: Database) {
        super(db);


        const stmt = this.db.prepare(`SELECT * FROM 'main'.'Sections' ORDER BY JoinedId ASC`);
        const templates = dbpr.getAllAsObjects<dbpr.Section>(stmt);

        templates.filter(t => t.JoinedId > 0).forEach((template, index) => {
            const joinedId = template.JoinedId;
            const stmt = this.db.prepare(`SELECT * FROM Controls WHERE JoinedId = ${joinedId} ORDER BY PosX ASC`);
            const controls = dbpr.getAllAsObjects<dbpr.Control>(stmt);

            const { width, height } = this.getTemplateWidthHeight(template.Name);

            this.templates.push(new AutoR1Template(template, controls, width, height));
            console.debug(`Loaded template - ${index} / ${this.templates[this.templates.length - 1].name}`);
        });
    }

    static build = (fb: Buffer) => build<AutoR1TemplateFile>(fb, (db) => new AutoR1TemplateFile(db))

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
                    throw (new Error(`Template ${tempName} does not contain any controls.`));
                }
            }
        }

        throw (new Error(`Template ${tempName} not found.`));
    }

    /**
     * Returns the width and height of a template
     * @param templateFile File containing the templates
     * @param templateName Name of the template to get the size of
     * @returns Object containing the width and height of the template
     * @throws Error if the template doesn't exist
     * @throws Error if the template doesn't have any controls
     */
    public getTemplateWidthHeight(templateName: string): { width: number, height: number } {

        let rtn = this.db.prepare(
            `SELECT JoinedId FROM 'main'.'Sections' WHERE Name = ?`
        ).getAsObject([templateName]) as { JoinedId: number };
        if (!rtn || !rtn.JoinedId) {
            throw (new Error(`${templateName} template not found.`));
        }

        let jId = rtn.JoinedId;
        const stmt = this.db.prepare(
            `SELECT PosX, PosY, Width, Height FROM Controls WHERE JoinedId = ${jId} `
        );

        const templateControls = dbpr.getAllAsObjects<{ PosX: number, PosY: number, Width: number, Height: number }>(stmt)
        if (!templateControls.length) {
            throw (new Error(`${templateName} template controls not found.`));
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
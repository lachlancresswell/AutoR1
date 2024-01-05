import * as dbpr from './dbpr';

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

export const NAV_BUTTON_SPACING = 20;

export const MAIN_GROUP_ID = 1;

export const FALLBACK_GROUP_TITLE = 'MAIN FALLBACK';
export const MUTE_GROUP_TITLE = 'MAIN MUTE';

export enum AutoR1TemplateTitles {
    MAIN_OVERVIEW = 'Main Overview',
    MAIN_TITLE = "Main Title",
    MAIN_FALLBACK = "Main Fallback",
    METERS_TITLE = "Meters Title",
    METERS_GROUP = "Meters Group",
    METER = "Meter",
    NAV_BUTTONS = "Nav Button",
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
interface Channel {
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
        return this.System === 'GSL' || this.System === 'KSL' || this.System === 'XSL';
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
            throw ('Template name not set');
        }
        this._controls = templateFile.getTemplateControlsFromName(this.name);
    }
}


export class AutoR1ProjectFile extends dbpr.ProjectFile {
    public sourceGroups: SourceGroup[] = [];

    constructor(f: string) {
        super(f);
    }

    public getSrcGrpInfo = () => {
        this.db.exec(`PRAGMA case_sensitive_like=ON;`);

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

        let rtn = stmt.all() as AutoR1SourceGroupRow[];

        if (!rtn || !rtn.length) {
            throw ('Could not find any source groups');
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

                const rtn = stmt.all(devGrp.groupId) as Channel[];
                for (let row of rtn) {
                    devGrp.channels.push(row);
                }
                console.log(`Assigned ${rtn.length} channels to ${devGrp.name}`);
            });
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
        if (!joinedId) joinedId = this.getHighestJoinedID() + 1;

        if (!template.controls || template.controls.length < 1) {
            throw new Error("Template has no controls.");
        }

        // Wrap in transaction to speed up insertion
        const transaction = this.db.transaction((templateControls: AutoR1Control[]) => {
            for (const templateControl of templateControls) {
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
        });

        transaction(template.controls);
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
        const transaction = this.db.transaction((sourceGroups: SourceGroup[]) => {
            sourceGroups.forEach((srcGrp) => {
                srcGrp.channelGroups.forEach((chGrp) => {
                    if (!chGrp.removeFromMute) {
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
        });
        transaction(this.sourceGroups)
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
        const transaction = this.db.transaction((sourceGroups: SourceGroup[]) => {
            sourceGroups.forEach((srcGrp) => {
                srcGrp.channelGroups.forEach((chGrp) => {
                    if (!chGrp.removeFromFallback) {
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
        });

        transaction(this.sourceGroups);
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
    * Cleans the R1 project by deleting all custom views, their controls, and any custom groups.
    * @param proj R1 project file
    * @param parentGroupId Group id of the parent custom group
    */
    public clean(parentGroupId = MAIN_GROUP_ID) {
        console.log("Cleaning R1 project.");

        try {
            const mainViewId = this.getViewIdFromName(MAIN_WINDOW_TITLE);

            this.db.prepare('DELETE FROM Controls WHERE "ViewId" = ?').run(mainViewId);
            console.log(`Deleted ${MAIN_WINDOW_TITLE} controls.`);

            this.db.prepare('DELETE FROM Views WHERE "Name" = ?').run(MAIN_WINDOW_TITLE);
            console.log(`Deleted ${MAIN_WINDOW_TITLE} view.`);

            this.removeNavButtons(mainViewId);
        } catch (error) {
            console.error(error);
        }

        try {
            const meterViewId = this.getViewIdFromName(METER_WINDOW_TITLE);

            this.db.prepare('DELETE FROM Controls WHERE "ViewId" = ?').run(meterViewId);
            console.log(`Deleted ${METER_WINDOW_TITLE} view controls.`);

            this.db.prepare('DELETE FROM Views WHERE "Name" = ?').run(METER_WINDOW_TITLE);
            console.log(`Deleted ${METER_WINDOW_TITLE} view.`);
        } catch (error) {
            console.error(error);
        }

        const subArrayNameStmt = this.db.prepare("SELECT Name FROM SourceGroups WHERE Type = ?");
        const subArrayName = subArrayNameStmt.get(dbpr.SourceGroupTypes.SUBARRAY) as { Name: string }

        if (subArrayName) {
            const getGroupIdStmt = this.db.prepare('SELECT GroupId FROM Groups WHERE Name = ? AND ParentId = ?');
            const groupId = getGroupIdStmt.get(subArrayName.Name, parentGroupId) as { GroupId: number };

            if (groupId) {
                this.deleteGroup(groupId.GroupId);
            }
        }

        this.deleteGroup(parentGroupId);

        console.log(`Deleted ${PARENT_GROUP_TITLE} group.`);
    }

    public createNavButtons(templates: AutoR1TemplateFile): void {
        const increaseControlPosYByAmount = this.db.prepare('UPDATE Controls SET PosY = PosY + ? WHERE ViewId = ?');
        const navButtonTemplate = templates.templates.find(template => template.name === AutoR1TemplateTitles.NAV_BUTTONS);
        const POS_X = 15;

        if (!navButtonTemplate) {
            throw new Error(`${AutoR1TemplateTitles.NAV_BUTTONS} template not found.`);
        }

        const mainView = this.getMainView();
        const meterView = this.getMeterView();

        if (!mainView || !meterView) {
            throw new Error("Main or Meter view not found.");
        }

        const mainViewId = mainView.ViewId;
        const meterViewId = meterView.ViewId;

        const spacing = 25;
        const views = this.getAllRemoteViews();
        const buttonWidth = templates.getTemplateWidthHeight(AutoR1TemplateTitles.NAV_BUTTONS).width

        const mainNavButtonTemplateOptions = {
            DisplayName: MAIN_WINDOW_TITLE,
            TargetId: mainViewId,
            TargetChannel: dbpr.TargetChannels.NONE,
        }

        const metersNavButtonTemplateOptions = {
            DisplayName: METER_WINDOW_TITLE,
            TargetId: meterViewId,
            TargetChannel: dbpr.TargetChannels.NONE,
        }

        views.forEach((v, i) => {
            const vId = v.ViewId

            if (vId !== mainViewId && vId !== meterViewId) {

                increaseControlPosYByAmount.run(NAV_BUTTON_Y + NAV_BUTTON_SPACING, vId);

                this.insertTemplate(
                    navButtonTemplate,
                    vId,
                    POS_X,
                    NAV_BUTTON_Y,
                    mainNavButtonTemplateOptions
                );

                this.insertTemplate(
                    navButtonTemplate,
                    vId,
                    POS_X + + buttonWidth + spacing,
                    NAV_BUTTON_Y,
                    metersNavButtonTemplateOptions
                );
            }
        });
    }

    private removeNavButtons(mainViewId: number): void {
        const getControlsStmt = this.db.prepare(`SELECT ViewId FROM Controls WHERE "TargetId" = ? AND "TargetChannel" = ?`);
        const updateControlsStmt = this.db.prepare('UPDATE Controls SET PosY = PosY - ? WHERE ViewId = ?');
        const deleteControlsStmt = this.db.prepare(`DELETE FROM Controls WHERE "TargetId" = ? AND "TargetChannel" = ?`);

        const meterViewId = this.getMeterView().ViewId;

        for (const vId of getControlsStmt.iterate(mainViewId, dbpr.TargetChannels.NONE)) {
            if (vId !== mainViewId && vId !== meterViewId) {
                updateControlsStmt.run(NAV_BUTTON_Y + 20, vId);
            }
        }

        deleteControlsStmt.run(mainViewId, dbpr.TargetChannels.NONE);
        console.log(`Deleted ${MAIN_WINDOW_TITLE} nav buttons.`);
    }

    /**
    * Inserts all AP channels into a dedicated AP group
    * @param projectFile R1 project file 
    * @param parentGroupId Group id to create the AP group under
    */
    public createAPGroup(parentGroupId = MAIN_GROUP_ID): void {
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
            throw (new Error("No AP channel groups found."))
        }

        this.createGroup({
            Name: AP_GROUP_TITLE,
            ParentId: parentGroupId
        });
        const apGroupId = this.getHighestGroupID();

        // Wrap in transaction to speed up insertion
        const transaction = this.db.transaction((apChannelGroups: Channel[]) => {
            apChannelGroups.forEach((ch) => {
                this.addChannelToGroup({
                    Name: ch.Name,
                    ParentId: apGroupId,
                    TargetId: ch.TargetId,
                    TargetChannel: ch.TargetChannel,
                });
            });
        })
        transaction(apChannelGroups);
    }

    public getAPGroup() {
        return this.getAllGroups().find((group) => group.Name === AP_GROUP_TITLE);
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

            let rtn = stmt.all() as Channel[]

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
        ).get() as { Name: string };

        if (!subArrayGroup) {
            throw new Error("No sub array group found");
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
        const transaction = this.db.transaction((subArrayGroups: IterableIterator<[number, Channel[]]>) => {
            for (const [idx, subArrayGroup] of subArrayGroups) {
                this.createGroup({
                    Name: `${subArrayGroupName}${suffix[idx]}`, ParentId: subGroupParentID
                });
                let pId = this.getHighestGroupID();

                for (const subDevices of subArrayGroup) {
                    this.addChannelToGroup({
                        Name: subDevices.Name,
                        ParentId: pId,
                        TargetId: subDevices.TargetId, TargetChannel: subDevices.TargetChannel,
                    });
                }
            }
        })
        transaction(subArrayGroups.entries());
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
            throw new Error("No sub left group found");
        }

        let success = false;

        for (const srcGrp of this.sourceGroups) {
            for (const chGrp of srcGrp.channelGroups) {
                if (chGrp.type == 'TYPE_SUBS_C') {
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
            throw new Error("No sub centre group found");
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
        let rtn = stmt.get() as { Name: string };
        let groupCount = 0;
        if (rtn) {
            let name = rtn.Name;
            let str = [" SUBs L", " SUBs R", " SUBs C"];
            for (const s of str) {
                let q = `SELECT * FROM Groups WHERE Name = '${name}${s}'`;
                const stmt = this.db.prepare(q);
                const rtn = stmt.get();
                if (rtn) {
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

    private getMainView() {
        const stmt = this.db.prepare(`SELECT * from Views WHERE Name = ?`);
        const view = stmt.get(MAIN_WINDOW_TITLE) as dbpr.View;

        if (!view) {
            console.log(`Could not find Auto R1 Meter view with name ${MAIN_WINDOW_TITLE}`);

            return undefined;
        }

        return view;
    }

    private getMeterView() {
        const stmt = this.db.prepare(`SELECT * from Views WHERE Name = ?`);
        const view = stmt.get(METER_WINDOW_TITLE) as dbpr.View;

        if (!view) {
            console.log(`Could not find Auto R1 Meter view with name ${METER_WINDOW_TITLE}`)

            return undefined;
        }

        return view;
    }

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
        const rtn = this.db.prepare(`SELECT max(ViewId) FROM Views`).get() as { 'max(ViewId)': number };
        if (!rtn) {
            throw (Error(`Could not create Auto R1 Meter view`));
        }
        const meterViewId = rtn['max(ViewId)'];

        let posX = METER_VIEW_STARTX;
        let posY = METER_VIEW_STARTY;

        const navButtonTemplate = templates.getTemplateByName(AutoR1TemplateTitles.NAV_BUTTONS);

        const navButtonOptions: TemplateOptions = {
            DisplayName: MAIN_WINDOW_TITLE,
            TargetId: meterViewId + 1,
            TargetChannel: dbpr.TargetChannels.NONE
        }
        this.insertTemplate(
            navButtonTemplate,
            meterViewId,
            NAV_BUTTON_X,
            posY + NAV_BUTTON_Y,
            navButtonOptions);

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
        const transaction = this.db.transaction((sourceGroups: SourceGroup[]) => {
            for (const srcGrp of sourceGroups) {
                srcGrp.channelGroups.forEach((chGrp) => {

                    // Skip TOPs and SUBs group if L/R groups are present
                    if (chGrp.hasLorR() && !chGrp.isLorR()) {
                        return;
                    }

                    const joinedId = this.getHighestJoinedID() + 1;
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
        });
        transaction(this.sourceGroups);
    }

    private createMainViewOverview(templateFile: AutoR1TemplateFile, posX: number, posY: number, mainViewId: number) {

        const mainOverviewTemplate = templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.MAIN_OVERVIEW);
        const mainFallbackTemplate = templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.MAIN_FALLBACK);

        const meterView = this.getMeterView();

        if (!meterView) {
            throw new Error("Meter view not found");
        }

        const navButtonTemplateOptions: TemplateOptions = {
            DisplayName: METER_WINDOW_TITLE,
            TargetId: meterView.ViewId,
            TargetChannel: dbpr.TargetChannels.NONE
        }
        this.insertTemplate(
            templateFile.getTemplateByName('Nav Button'),
            mainViewId,
            NAV_BUTTON_X,
            posY + NAV_BUTTON_Y,
            navButtonTemplateOptions
        );

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
            mainMainTemplateOptions
        )

        posX += mainOverviewTemplate.width + (METER_SPACING_X / 2);

        /**
         * Configure the main mute switch
         */
        const muteGroup = this.getAllGroups().find((group) => group.Name === MUTE_GROUP_TITLE);
        if (muteGroup) {
            const mainMute = this.db.prepare(`SELECT * FROM Controls WHERE ViewId = ${mainViewId} AND Type = ${dbpr.ControlTypes.SWITCH} AND DisplayName = ?`).get('Mute') as dbpr.Control;
            this.db.prepare(`DELETE FROM Controls WHERE ControlId = ${mainMute.ControlId}`).run();
            mainMute.TargetId = muteGroup.GroupId;
            this.insertControl(mainMute);
        }

        /**
         * Configure the fallback indicator
         */
        const fallbackGroup = this.getAllGroups().find((group) => group.Name === FALLBACK_GROUP_TITLE);
        if (fallbackGroup) {
            const mainFallback = this.db.prepare(`SELECT * FROM Controls WHERE ViewId = ? AND Type = ? AND TargetProperty = ?`).get(mainViewId, dbpr.ControlTypes.LED, dbpr.TargetPropertyType.STATUS_INPUT_FALLBACK_ACTIVE) as dbpr.Control;
            this.db.prepare(`DELETE FROM Controls WHERE ControlId = ${mainFallback.ControlId}`).run();
            mainFallback.TargetId = fallbackGroup.GroupId;
            this.insertControl(mainFallback);
        }

        const apGroupId = this.getAPGroup()?.GroupId;

        if (this.getApStatus()) {
            const thcTemplateOptions: TemplateOptions = {
                TargetId: apGroupId
            }
            this.insertTemplate(
                templateFile.getTemplateByName('THC'),
                mainViewId,
                posX,
                posY,
                thcTemplateOptions,
            )
            posX += templateFile.getTemplateWidthHeight('THC').width + (METER_SPACING_X * 4)
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

    private createMainViewMeters(templateFile: AutoR1TemplateFile, posX: number, posY: number, mainViewId: number) {
        const { width: arraySightTempWidth, height: arraySightTempHeight } = templateFile.getTemplateWidthHeight('Main ArraySight Frame');
        const { width: meterTempWidth, height: meterTempHeight } = templateFile.getTemplateWidthHeight('Group LR AP CPL2');

        // Wrap in transaction to speed up insertion
        const transaction = this.db.transaction((sourceGroups: SourceGroup[]) => {
            sourceGroups.forEach((sourceGroup, srcGrpIndex) => {
                sourceGroup.channelGroups.forEach((channelGroup, chGrpIndex) => {
                    const commonJoinedId = this.getHighestJoinedID() + 1;

                    if (channelGroup.isLorR()) {  // TOP or SUB L/R/C Group
                        return;
                    }

                    const controls = AutoR1ProjectFile.configureMainViewMeterTemplate(templateFile, sourceGroup, channelGroup, commonJoinedId, posX, posY, mainViewId);

                    controls.forEach((control) => this.insertControl(control));

                    if (sourceGroup.ArraySightId) {
                        const joinedId = this.getHighestJoinedID() + 1;

                        this.insertTemplate(
                            templateFile.getTemplateByName('Main ArraySight Frame'),
                            mainViewId,
                            posX,
                            posY - arraySightTempHeight - 10,
                            { joinedId }
                        );

                        const ids = [sourceGroup.ArraySightId, sourceGroup.ArraySightIdR].filter((id) => id);

                        const arraySightTemplate = new TemporaryTemplate();
                        arraySightTemplate.setName('Main ArraySight');
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
                                posX + 5 + (i * 67),
                                posY - arraySightTempHeight - 10 + 5,
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
                        posY - 1, // R1 frames are to be 1px higher than expected
                        navButtonTemplateOptions
                    )

                    posX += meterTempWidth + METER_SPACING_X;
                });
            })
        });
        transaction(this.sourceGroups);
    }

    /**
     * Create the main AutoR1 view within the project
     * @param templateFile Loaded .r2t template file
     */
    public createMainView(templateFile: AutoR1TemplateFile) {
        // Get width + height of templates used
        const { width: mainTempWidth, height: mainTempHeight } = templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.MAIN_OVERVIEW);
        const { width: mainFallbackWidth, height: mainFallbackHeight } = templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.MAIN_FALLBACK);
        const { width: _mainTitleTempWidth, height: mainTitleTempHeight } = templateFile.getTemplateWidthHeight(AutoR1TemplateTitles.MAIN_TITLE);
        const { width: meterTempWidth, height: meterTempHeight } = templateFile.getTemplateWidthHeight('Group LR AP CPL2');
        const { width: arraySightTempWidth, height: arraySightTempHeight } = templateFile.getTemplateWidthHeight('Main ArraySight Frame');

        const METER_TEMP_BUFFER = 200;
        let posX = MAIN_VIEW_STARTX, posY = MAIN_VIEW_STARTY;

        const HRes = (
            mainTempWidth
            + ((METER_SPACING_X + meterTempWidth) * this.getChannelMainGroupTotal())
            + METER_TEMP_BUFFER
        );

        const VRes = mainTitleTempHeight + Math.max(meterTempHeight, mainTempHeight + mainFallbackHeight) + 60 + posY;
        this.db.prepare(
            `INSERT INTO Views("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`
        ).run(1000, MAIN_WINDOW_TITLE, null, 4, null, -1, HRes, VRes, 100, null, null, null, null);
        const rtn = this.db.prepare(
            'SELECT max(ViewId) FROM Views'
        ).get() as { 'max(ViewId)': number };

        const mainViewId = rtn['max(ViewId)'];

        const { posX: overviewPosX, posY: overviewPosY } = this.createMainViewOverview(templateFile, posX, posY, mainViewId);

        const hasArraySight = this.sourceGroups.some(srcGrp => srcGrp.ArraySightId);
        let metersPosY = hasArraySight ? arraySightTempHeight - mainTitleTempHeight : overviewPosY;

        this.createMainViewMeters(templateFile, overviewPosX, metersPosY, mainViewId);
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

    constructor(sections: dbpr.Section, controls: dbpr.Control[]) {
        this.id = sections.Id
        this.name = sections.Name
        this.parentId = sections.ParentId
        this.joinedId = sections.JoinedId

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

    constructor(f: string) {
        super(f);

        const templates = this.db.prepare(`SELECT * FROM 'main'.'Sections' ORDER BY JoinedId ASC`).all() as dbpr.Section[];

        templates.forEach((template, index) => {
            const joinedId = template.JoinedId;
            const controls = this.db.prepare(`SELECT * FROM Controls WHERE JoinedId = ${joinedId} ORDER BY PosX ASC`).all() as dbpr.Control[];

            this.templates.push(new AutoR1Template(template, controls));
            console.log(`Loaded template - ${index} / ${this.templates[this.templates.length - 1].name}`);
        });
    }

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
                    throw (`Template ${tempName} does not contain any controls.`);
                }
            }
        }

        throw (`Template ${tempName} not found.`);
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
            `SELECT JoinedId FROM 'main'.'Sections' WHERE Name = '${templateName}'`
        ).get() as { JoinedId: number };
        if (!rtn) {
            throw (`${templateName} template not found.`);
        }

        let jId = rtn.JoinedId;
        const stmt = this.db.prepare(
            `SELECT PosX, PosY, Width, Height FROM Controls WHERE JoinedId = ${jId} `
        );

        const templateControls = stmt.all() as { PosX: number, PosY: number, Width: number, Height: number }[];
        if (!templateControls.length) {
            throw (`${templateName} template controls not found.`);
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
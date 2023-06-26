import { existsSync } from 'fs';
import * as Database from 'better-sqlite3';

export const SRC_TYPE_SUBARRAY = 3;

export const CTRL_FRAME = 12;
export const CTRL_METER = 7;
export const CTRL_BUTTON = 4;
export const CTRL_INPUT = 3;

const CONTROL_TYPE_FRAME = 12;
const CONTROL_TYPE_BUTTON = 4;
const CONTROL_TARGET_TYPE_PAGE = 5;

export const IPCONFIG_DEFAULT = [0, 0, 0, 0, 0, 0, 0, 0];

export const ARRAYCALC_SNAPSHOT = 1;  // Snapshot ID
export const INPUT_TYPES = ["A1", "A2", "A3", "A4", "D1", "D2", "D3", "D4"];
export const ipStr = [
    "Config_InputEnable1",
    "Config_InputEnable2",
    "Config_InputEnable3",
    "Config_InputEnable4",
    "Config_InputEnable5",
    "Config_InputEnable6",
    "Config_InputEnable7",
    "Config_InputEnable8",
];
export const TARGET_ID = 3;

export const DEVICE_PROPERTY_TYPES = [
    "Status_SmpsFrequency",
    "Status_MainsPowerPeak",
    "Status_SmpsVoltage",
    "Status_SmpsTemperature",
    "Status_LockMode",
    "Status_StatusText",
    "Status_PwrOk",
    "Settings_Buzzer",
    "Settings_DeviceName",
    "Settings_InputGainEnable",
    "Settings_LockCmd",
    "Settings_MCLEnable",
    "Settings_PwrOn",
    "Input_Analog_Gain",
    "Input_Digital_Gain",
    "Input_Digital_Mode",
    "Input_Digital_Sync",
    "Input_Digital_SampleStatus",
    "Input_Digital_DsDataPri",
    "Input_Digital_DsDataSec",
    "Input_Digital_TxStream",
    "Error_GnrlErr",
    "Error_SmpsTempOff",
    "Error_SmpsTempWarn",
];

export const SOURCEGROUPS_COL_SourceGroupId = 0;
export const SOURCEGROUPS_COL_Type = 1;
export const SOURCEGROUPS_COL_Name = 2;
export const SOURCEGROUPS_COL_OrderIndex = 3;
export const SOURCEGROUPS_COL_NextSourceGroupId = 5;
export const SOURCEGROUPS_COL_ArrayProcessingEnable = 6;
export const SOURCEGROUPS_TYPE_Array = 1;
export const SOURCEGROUPS_TYPE_PointSource = 2;
export const SOURCEGROUPS_TYPE_SUBarray = 3;
export const SOURCEGROUPS_TYPE_Device = 3;

export const CONTROLS_TargetType_Group = 0;
export const CONTROLS_TargetType_Device = 2;
export const CONTROLS_TargetType_View = 5;

type ChannelGroupTypes = 'TYPE_SUBS_C' | 'TYPE_SUBS_R' | 'TYPE_SUBS_L' | 'TYPE_SUBS' | 'TYPE_TOPS_L' | 'TYPE_TOPS_R' | 'TYPE_TOPS' | 'TYPE_POINT';

export class ChannelGroup {
    groupId: number;
    name: string;
    channels: Channel[] = [];
    type: ChannelGroupTypes;

    constructor(groupId: number, name: string, type: ChannelGroupTypes) {
        this.groupId = groupId;
        this.name = name;
        this.type = type;

        console.log(`Created channel group - ${this.groupId} / ${this.name} / ${this.type}`);
    }
}

interface SourceGroupRtn {
    ArrayProcessingEnable: number;
    ArraySightId: number;
    MasterGroupId: number;
    MasterGroupName: string;
    Name: string;
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
    Type: number;
    ViewId: number;
    xover: any;
}

class SourceGroup {
    ArrayProcessingEnable: number;
    ArraySightId: number;
    MasterGroupId: number;
    MasterGroupName: string;
    Name: string;
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
    Type: number;
    ViewId: number;
    xover: any;

    channelGroups: ChannelGroup[] = [];

    constructor(row: SourceGroupRtn) {
        this.ViewId = row.ViewId;
        this.Name = row.Name;
        this.SourceGroupId = row.SourceGroupId;
        this.NextSourceGroupId = row.NextSourceGroupId;
        this.Type = row.Type;
        this.ArrayProcessingEnable = row.ArrayProcessingEnable;
        this.ArraySightId = row.ArraySightId;
        this.System = row.System;
        this.MasterGroupId = row.MasterGroupId;
        this.MasterGroupName = row.MasterGroupName;
        this.TopGroupId = row.TopGroupId;
        this.TopGroupName = row.TopGroupName;
        this.TopLeftGroupId = row.TopLeftGroupId;
        this.TopLeftGroupName = row.TopLeftGroupName;
        this.TopRightGroupId = row.TopRightGroupId;
        this.TopRightGroupName = row.TopRightGroupName;
        this.SubGroupId = row.SubGroupId;
        this.SubGroupName = row.SubGroupName;
        this.SubLeftGroupId = row.SubLeftGroupId;
        this.SubLeftGroupName = row.SubLeftGroupName;
        this.SubRightGroupId = row.SubRightGroupId;
        this.SubRightGroupName = row.SubRightGroupName;
        this.SubCGroupId = row.SubCGroupId;
        this.SubCGroupName = row.SubCGroupName;
        this.xover = row.xover;

        if (this.TopGroupId && this.TopGroupName) {
            this.channelGroups.push(new ChannelGroup(this.TopGroupId, this.TopGroupName, 'TYPE_TOPS'));
        }
        if (this.TopLeftGroupId && this.TopLeftGroupName) {
            this.channelGroups.push(new ChannelGroup(this.TopLeftGroupId, this.TopLeftGroupName, 'TYPE_TOPS_L'));
        }
        if (this.TopRightGroupId && this.TopRightGroupName) {
            this.channelGroups.push(new ChannelGroup(this.TopRightGroupId, this.TopRightGroupName, 'TYPE_TOPS_R'));
        }
        if (this.SubGroupId && this.SubGroupName) {
            this.channelGroups.push(new ChannelGroup(this.SubGroupId, this.SubGroupName, 'TYPE_SUBS'));
        }
        if (this.SubLeftGroupId && this.SubLeftGroupName) {
            this.channelGroups.push(new ChannelGroup(this.SubLeftGroupId, this.SubLeftGroupName, 'TYPE_SUBS_L'));
        }
        if (this.SubRightGroupId && this.SubRightGroupName) {
            this.channelGroups.push(new ChannelGroup(this.SubRightGroupId, this.SubRightGroupName, 'TYPE_SUBS_R'));
        }
        if (this.SubCGroupId && this.SubCGroupName) {
            this.channelGroups.push(new ChannelGroup(this.SubCGroupId, this.SubCGroupName, 'TYPE_SUBS_C'));
        }

        // Skip final group if subs or tops groups have been found, only use for point sources
        if (!this.channelGroups.length && this.MasterGroupId && this.MasterGroupName) {
            this.channelGroups.push(new ChannelGroup(this.MasterGroupId, this.MasterGroupName, 'TYPE_POINT'));
        }
    }
}

interface ChannelRow {
    CabinetId: number;
    GroupId: number;
    Name: string;
    TargetChannel: number;
    TargetId: number;
}

export class Channel {
    GroupId: number;
    Name: string;
    TargetId: number;
    TargetChannel: number;
    Preset: string;
    CabinetId: number;

    constructor(row: ChannelRow) {
        this.GroupId = row.GroupId
        this.Name = row.Name
        this.TargetId = row.TargetId
        this.TargetChannel = row.TargetChannel
        this.CabinetId = row.CabinetId
        console.log(`Created channel - ${this.Name}`);
    }
}

export class SqlDbFile {
    private f: string;
    public db: Database.Database;

    /**
     * Load existing SQL database file
     * @param path - Path to database file
     * @throws Will throw an error if the file does not exist.
     */
    constructor(path: string) {
        if (!existsSync(path)) {
            throw new Error("File does not exist.");
        }

        this.f = path;
        this.db = new Database(this.f);
    }

    /**
     * Close the database connection. This can fail on Windows in some cases.
     */
    public close(): void {
        try {
            this.db.pragma('journal_mode = DELETE');
        } catch (err) {
            // Ignored
        }

        this.db.close();
    }
}

export class ProjectFile extends SqlDbFile {
    public mId: number = 0;
    public meterViewId: number = -1;
    public masterViewId: number = -1;
    public subArray: any[] = [];
    public jId: number = -1;
    public groups: any[] = [];
    public sourceGroups: SourceGroup[] = [];

    constructor(f: string) {
        super(f);  // Inherit from parent class
        try {
            this.mId = this.getMasterID();
        } catch (err) {
            throw (new Error("Project file is not initialised"));
        }
        this.getNextJoinedID();
    }

    /**
     * Get the number of groups in the project
     * @returns Number of groups
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const groupCount = p.getGroupCount();
     * console.log(groupCount);
     * // => 283
     */
    public getGroupCount(): number {
        const stmt = this.db.prepare('SELECT * FROM Groups');
        const data = stmt.all();
        return data.length;
    }

    /**
     * Determine if initial setup within R1 has been completed
     * @returns 1 if initial setup has been completed, 0 otherwise
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const isInitialised = p.isInitialised();
     * console.log(isInitialised);
     * // => 1
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const isInitialised = p.isInitialised();
     * console.log(isInitialised);
     * // => 0
     */
    public isInitialised(): number {
        const tableExistsStmt = this.db.prepare(`SELECT * FROM sqlite_master WHERE name =? and type='table'`);
        const groupTableExists = tableExistsStmt.get('Groups') !== undefined;
        const viewTableExists = tableExistsStmt.get('Views') !== undefined;
        if (!groupTableExists || !viewTableExists) {
            return 0;
        }

        const groupStmt = this.db.prepare(`SELECT * FROM Groups WHERE GroupId = 1 or ParentId = 1`);
        const groupData = groupStmt.all();
        if (!groupData || groupData.length < 3) {
            return 0;
        }
        return 1;
    }

    public deleteGroup(groupID: number): void {
        // Remove all children first
        const childrenStmt = this.db.prepare('SELECT GroupId FROM Groups WHERE ParentId = ?');
        const children = childrenStmt.all(groupID) as { GroupId: number }[];
        for (const child of children) {
            this.deleteGroup((child).GroupId);
        }

        // Delete group
        const deleteStmt = this.db.prepare('DELETE FROM Groups WHERE GroupId = ?');
        deleteStmt.run(groupID);
    }

    /**
     * Get the ID of the master group
     * @returns GroupId of master group
     * @throws Will throw an error if the master group cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const masterId = p.getMasterID();
     * console.log(masterId);
     * // => 1
     */
    public getMasterID(): number {
        const stmt = this.db.prepare("SELECT GroupId FROM Groups WHERE ParentId = 1 AND Name = 'Master'");
        const rtn = stmt.get() as { GroupId: number };
        if (!rtn) {
            throw new Error('Cannot find Master group');
        }
        return rtn.GroupId;
    }

    /**
     * Get all IDs of project source groups
     * @param skipRightGroups Whether to skip the right side of stereo groups
     * @returns Array of SourceGroupIds
     * @throws Will throw an error if no source groups can be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const sourceGroupIds = p.getSourceGroupIds();
     * console.log(sourceGroupIds);
     * // => [ 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 ]
     */
    public getSourceGroupIds(skipRightGroups: boolean = false): number[] {
        let query = "SELECT SourceGroupId from SourceGroups WHERE Name != 'Unused channels'";
        if (skipRightGroups) {
            query += " AND OrderIndex != -1";
        }

        const stmt = this.db.prepare(query);
        const sourceGroups = stmt.all() as { SourceGroupId: number }[];
        if (sourceGroups && sourceGroups.length > 0) {
            const array: number[] = [];
            for (const group of sourceGroups) {
                array.push(group.SourceGroupId);
            }
            return array;
        } else {
            throw new Error("Could not find any SourceGroups");
        }
    }

    /**
     * Get the name of a source group from its ID
     * @param id SourceGroupId
     * @returns Name of source group
     * @throws Will throw an error if the source group cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const sourceGroupName = p.getSourceGroupNameFromId(1);
     * console.log(sourceGroupName);
     * // => 'Unused channels'
     */
    public getSourceGroupNameFromId(id: number): string {
        const stmt = this.db.prepare('SELECT Name from SourceGroups WHERE SourceGroupId = ?');
        const rtn = stmt.get(id) as { Name: string };
        if (!rtn) {
            throw new Error(`Could not find SourceGroup with id ${id}`);
        }
        return rtn.Name;
    }

    public findControlsByViewId(viewId: number): ControlRow[] {
        const query = `SELECT * FROM Controls WHERE ViewId = ${viewId}`;
        const stmt = this.db.prepare(query);
        const rtn = stmt.all() as ControlRow[];

        if (rtn.length < 1) {
            throw new Error(`Could not find any controls with viewId ${viewId}`);
        }

        return rtn;
    }

    /**
     * Get the ID of a source group from its name
     * @param name Name of source group
     * @returns SourceGroupId
     * @throws Will throw an error if the source group cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const sourceGroupId = p.getSourceGroupIdFromName('Unused channels');
     * console.log(sourceGroupId);
     * // => 1
     */
    public getSourceGroupIdFromName(name: string): number {
        const stmt = this.db.prepare('SELECT SourceGroupId from SourceGroups WHERE Name = ?');
        const rtn = stmt.get(name) as { SourceGroupId: number };
        if (!rtn) {
            throw new Error(`Could not find SourceGroup with name ${name}`);
        }
        return rtn.SourceGroupId;
    }

    /**
     * Get the next valid JoinedId
     * @returns Next JoinedId
     * @throws Will throw an error if the next JoinedId cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const nextJoinedId = p.getNextJoinedID();
     * console.log(nextJoinedId);
     * // => 1
     */
    public getNextJoinedID(): void {
        const stmt = this.db.prepare('SELECT JoinedId from Controls ORDER BY JoinedId DESC LIMIT 1');
        const rtn = stmt.get() as { JoinedId: number };
        if (rtn) {
            this.jId = rtn.JoinedId + 1;
        } else {
            throw new Error("Views have not been generated. Please run initial setup in R1 first.");
        }
    }

    /**
     * Get the highest GroupId
     * @returns Highest GroupId
     * @throws Will throw an error if the highest GroupId cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const highestGroupId = p.getHighestGroupID();
     * console.log(highestGroupId);
     * // => 283
     */
    public getHighestGroupID(): number {
        const stmt = this.db.prepare('SELECT max(GroupId) FROM Groups');
        const rtn = stmt.get() as { 'max(GroupId)': number };
        return rtn['max(GroupId)'];
    }


    /**
     * Creates a new group with the given title and properties, and returns its GroupId.
     * @param title The name of the new group.
     * @param parentId The GroupId of the parent group. Defaults to 1 (the Master group).
     * @param targetId The target ID of the new group. Defaults to 0.
     * @param targetChannel The target channel of the new group. Defaults to -1.
     * @param type The type of the new group. Defaults to 0.
     * @param flags The flags of the new group. Defaults to 0.
     * @returns The GroupId of the newly created group.
     * @throws Will throw an error if the parent group does not exist.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const groupId = p.createGrp('New Group', 2, 0, -1, 0, 0);
     * console.log(groupId);
     * // => 284
     */
    public createGrp(title: string, parentId = 1, targetId = 0, targetChannel = -1, type = 0, flags = 0): number {
        if (parentId < 1) {
            throw new Error(`Parent with GroupID ${parentId} does not exist`);
        }

        let stmt: Database.Statement = this.db.prepare(
            `INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags)
             SELECT ?, ?, ?, ?, ?, ?`
        );
        stmt.run(title, parentId, targetId, targetChannel, type, flags);

        stmt = this.db.prepare('SELECT * FROM Groups ORDER BY GroupId DESC LIMIT 1;');
        const groupId = stmt.get() as {
            Flags: number,
            GroupId: number,
            Name: string,
            ParentId: number,
            TargetChannel: number,
            TargetId: number,
            Type: number,
        };

        // Get parent name for logging
        stmt = this.db.prepare('SELECT Name FROM Groups WHERE GroupId = ?');
        const pName = (stmt.get(parentId) as { Name: string }).Name;
        console.info(`Inserted ${title} under ${pName}`);

        return groupId.GroupId;
    }

    /**
     * Finds ID of a group from its name
     * @param name Name of group
     * @returns GroupId
     * @throws Will throw an error if the group cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const groupId = p.getGroupIdFromName('Master');
     * console.log(groupId);
     * // => 2
     */
    public getGroupIdFromName(name: string): number {
        const stmt = this.db.prepare('SELECT GroupId FROM Groups WHERE Name = ?');
        const rtn = stmt.all(name) as { GroupId: number }[]
        if (!rtn || rtn.length === 0) {
            throw new Error("Could not find group");
        }
        return rtn[0].GroupId
    }

    /**
     * Finds ID of a view from its name
     * @param name Name of view
     * @returns ViewId
     * @throws Will throw an error if the view cannot be found.
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const viewId = p.getViewIdFromName('Overview');
     * console.log(viewId);
     * // => 1000
     */
    public getViewIdFromName(name: string): number {
        const stmt = this.db.prepare('SELECT ViewId FROM Views WHERE Name = ?');
        const rtn = stmt.get(name) as { ViewId: number };
        if (!rtn) {
            throw new Error("View not found");
        }
        return rtn.ViewId;
    }

    public getSrcGrpInfo = () => {
        this.db.exec(`PRAGMA case_sensitive_like=ON;`);

        let query = `
            SELECT Views.ViewId, Views.Name, SourceGroups.SourceGroupId, NextSourceGroupId, SourceGroups.Type, ArrayProcessingEnable,
            ArraySightId, System, masterGroup.GroupId as MasterGroupId, masterGroup.Name as MasterGroupName, topsGroup.GroupId as TopGroupId, topsGroup.Name as TopGroupName,
            topsLGroup.GroupId as TopLeftGroupId, topsLGroup.Name as TopLeftGroupName, topsRGroup.GroupId as TopRightGroupId, topsRGroup.Name as TopRightGroupName,
            subsGroup.GroupId as SubGroupId, subsGroup.Name as SubGroupName, subsLGroup.GroupId as SubLeftGroupId, subsLGroup.Name as SubLeftGroupName, subsRGroup.GroupId as
            SubRightGroupId, subsRGroup.Name as SubRightGroupName, subsCGroup.GroupId as SubCGroupId, subsCGroup.Name as SubCGroupName, i.DisplayName as xover
            FROM SourceGroups
            /* Combine additional source group data */
            JOIN SourceGroupsAdditionalData 
            ON SourceGroups.SourceGroupId = SourceGroupsAdditionalData.SourceGroupId
            /* Combine view info */
            JOIN Views
            ON Views.Name = SourceGroups.Name
            /* Combine R1 groups to Source Groups - We only have the name to go on here */
            JOIN Groups masterGroup
            ON SourceGroups.name = masterGroup.Name
            /* Fetch TOPs groups which may or may not have L/R subgroups */
            LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% TOPs') topsGroup
            ON topsGroup.ParentId = masterGroup.GroupId
            /* Fetch L/R TOP groups which will be under the main TOPs groups */
            LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% TOPs L' ) topsLGroup
            ON topsLGroup.ParentId  = topsGroup.GroupId
            LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% TOPs R' ) topsRGroup
            ON topsRGroup.ParentId  = topsGroup.GroupId
            /* Fetch the SUBs groups */
            LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE '% SUBs') subsGroup
            ON subsGroup.ParentId  = masterGroup.GroupId
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
            /* Skip duplicate groups in Master group _only for arrays_. We want L/R groups for arrays. */
            AND (SourceGroups.Type == 1 AND masterGroup.ParentId != (SELECT GroupId FROM Groups WHERE Name == 'Master'))
            /* Skip existing Sub array group in Master */
            OR (SourceGroups.Type == 3 AND masterGroup.ParentId != (SELECT GroupId FROM Groups WHERE Name == 'Master'))
            /* Get point source groups from Master group */
            OR (SourceGroups.Type == 2 AND masterGroup.ParentId == (SELECT GroupId FROM Groups WHERE Name == 'Master'))
            /* Device only groups */
            OR SourceGroups.Type == 4
            ORDER BY SourceGroups.OrderIndex ASC`;

        const stmt = this.db.prepare(query);

        let rtn = stmt.all() as SourceGroupRtn[];

        for (let row of rtn) {
            this.sourceGroups.push(new SourceGroup(row));
        }

        // Discover all channels of previously discovered groups
        for (let idx = 0; idx < this.sourceGroups.length; idx++) {
            let srcGrp = this.sourceGroups[idx];
            for (let idy = 0; idy < srcGrp.channelGroups.length; idy++) {
                let devGrp = srcGrp.channelGroups[idy];

                let subQuery = `
                    WITH RECURSIVE devs(GroupId, Name, ParentId, TargetId, TargetChannel, Type, Flags) AS (
                        SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type, Groups.Flags FROM Groups WHERE Groups.ParentId = ${devGrp.groupId}
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
                    WHERE devs.type = 1`;

                const stmt = this.db.prepare(subQuery);

                const rtn = stmt.all() as ChannelRow[];

                for (let row of rtn) {
                    this.sourceGroups[idx].channelGroups[idy].channels.push(new Channel(row));
                }
                console.log(`Assigned ${rtn.length} channels to ${devGrp.name}`);
            }
        }
    }

    public insertTemplate = (
        template: Template,
        ViewId: number,
        posX = 0,
        posY = 0,
        DisplayName = '',
        TargetId?: number,
        TargetChannel?: number,
        Width?: number,
        Height?: number,
        TargetProperty: string | undefined = undefined,
        TargetRecord: number | undefined = undefined
    ): void => {
        // Increase global joined ID
        const joinedId = this.jId
        this.jId += 1;

        if (!template.controls || template.controls.length < 1) {
            throw new Error("Template has no controls.");
        }

        for (const templateControl of template.controls) {
            const control = Object.assign(new Control(), templateControl);

            // If item of type FRAME or BUTTON to swap views (TargetType is PAGE), 
            // and a DisplayName has been provided, and we are not dealing with a fallback/regular button,
            // then set the display name to the provided name
            if ((control.Type === CONTROL_TYPE_FRAME || (control.Type === CONTROL_TYPE_BUTTON && control.TargetType === CONTROL_TARGET_TYPE_PAGE))
                && (control.DisplayName && control.DisplayName !== "Fallback" && control.DisplayName !== "Regular")) {
                control.setDisplayName(DisplayName);
            }

            // If TargetProperty is of a particular type, and TargetChannel is not set, 
            // then set TargetChannel to 0
            if (control.TargetProperty && DEVICE_PROPERTY_TYPES.includes(control.TargetProperty)
                && (control.TargetChannel > -1)) {
                control.setTargetChannel(0);
            }

            const targetProperty = TargetProperty ? TargetProperty : control.TargetProperty;
            const targetRecord = TargetRecord ? TargetRecord : control.TargetRecord;
            const targetId = TargetId ? TargetId : control.TargetId;
            const targetChannel = TargetChannel ? TargetChannel : control.TargetChannel;
            const width = Width ? Width : control.Width;
            const height = Height ? Height : control.Height;

            const query = `
                            INSERT INTO Controls ('Type', 
                            'PosX', 
                            'PosY', 
                            'Width', 
                            'Height', 
                            'ViewId', 
                            'DisplayName', 
                            'JoinedId', 
                            'LimitMin',
                            'LimitMax', 
                            'MainColor', 
                            'SubColor', 
                            'LabelColor', 
                            'LabelFont', 
                            'LabelAlignment', 
                            'LineThickness', 
                            'ThresholdValue', 
                            'Flags', 
                            'ActionType', 
                            'TargetType', 
                            'TargetId', 
                            'TargetChannel', 
                            'TargetProperty', 
                            'TargetRecord', 
                            'ConfirmOnMsg', 
                            'ConfirmOffMsg', 
                            'PictureIdDay', 
                            'PictureIdNight', 
                            'Font', 
                            'Alignment', 
                            'Dimension') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ' ')`
            const insertStmt = this.db.prepare(query);

            insertStmt.run(
                control.Type.toString(),
                (control.PosX + posX).toString(),
                (control.PosY + posY).toString(),
                width.toString(),
                height.toString(),
                ViewId.toString(),
                control.DisplayName,
                joinedId?.toString(),
                control.LimitMin.toString(),
                control.LimitMax.toString(),
                control.MainColor.toString(),
                control.SubColor.toString(),
                control.LabelColor.toString(),
                control.LabelFont.toString(),
                control.LabelAlignment.toString(),
                control.LineThickness.toString(),
                control.ThresholdValue.toString(),
                control.Flags.toString(),
                control.ActionType.toString(),
                control.TargetType.toString(),
                targetId.toString(),
                targetChannel.toString(),
                targetProperty,
                targetRecord,
                control.ConfirmOnMsg?.toString(),
                control.ConfirmOffMsg?.toString(),
                control.PictureIdDay.toString(),
                control.PictureIdNight.toString()
            );
        }
    }


    /**
     * Get all views from the Views table
     * @returns Array of views
     * 
     * @example
     * const p = new ProjectFile('path/to/project.dbpr');
     * const views = p.getAllViews();
     * console.log(views);
     * // => [{ ViewId: 1, Type: 0, Name: 'Overview', Flags: 0, HomeViewIndex: 0, NaviBarIndex: 0, HRes: 1920, VRes: 1080, ZoomLevel: 1 }]
     */
    getAllViews() {
        const query = `SELECT * FROM Views`;
        const stmt = this.db.prepare(query);
        const rtn = stmt.all() as { ViewId: number, Type: number, Name: string, Flags: number, HomeViewIndex: number, NaviBarIndex: number, HRes: number, VRes: number, ZoomLevel: number }[];

        return rtn;
    }

    getAllGroups() {
        const query = `SELECT * FROM Groups`;
        const stmt = this.db.prepare(query);
        const rtn = stmt.all() as { GroupId: number, Name: string, ParentId: number, TargetId: number, TargetChannel: number, Type: number, Flags: number }[];

        return rtn;
    }


}

/**
 * Row from the Sections table in a template file
 */
interface SectionRow {
    Description: string;
    Id: number;
    JoinedId: number;
    Name: string;
    ParentId: number;
}

/**
 * Contains all controls and sections of a template
 * @param sections TemplateSection
 * @param controls ControlRow
 */
export class Template {
    id?: number;
    name?: string;
    parentId?: number;
    joinedId?: number;
    controls?: Control[];

    constructor(sections?: SectionRow, controls?: ControlRow[]) {
        this.id = sections?.Id
        this.name = sections?.Name
        this.parentId = sections?.ParentId
        this.joinedId = sections?.JoinedId

        this.controls = [];
        controls?.forEach((control) => {
            this.controls?.push(new Control(control));
        })
    }
}

export class TemplateFile extends SqlDbFile {
    templates: Template[] = [];

    constructor(f: string) {
        super(f);

        let templates: SectionRow[];

        try {
            templates = this.db.prepare(`SELECT * FROM 'main'.'Sections' ORDER BY JoinedId ASC`).all() as SectionRow[];
        } catch (error) {
            throw error;
        }

        console.log(`Found ${templates.length} templates in file.`);

        for (let idx = 0; idx < templates.length; idx++) {
            const temp = templates[idx];
            const joinedId = temp.JoinedId;
            const controls = this.db.prepare(`SELECT * FROM Controls WHERE JoinedId = ${joinedId} ORDER BY PosX ASC`).all() as ControlRow[];

            this.templates.push(new Template(temp, controls));
            console.log(`Loaded template - ${idx} / ${this.templates[this.templates.length - 1].name}`);
        }
    }

    getTempSize(tempName: string): { width: number, height: number } {

        const query = `SELECT JoinedId FROM 'main'.'Sections' WHERE Name = '${tempName}'`;
        const stmt = this.db.prepare(query);
        let jIdResult = stmt.all()[0] as { JoinedId: number };

        const jId = jIdResult.JoinedId;
        if (!jId) {
            throw new Error(`Existing joinedId not found for template ${tempName}.`);
        }

        const controlsQuery = `SELECT PosX, PosY, Width, Height FROM Controls WHERE JoinedId = ${jId}`;
        const controlsStmt = this.db.prepare(controlsQuery);
        let controlsResult = controlsStmt.all() as { PosX: number, PosY: number, Width: number, Height: number }[];
        const controls = controlsResult;
        if (!controls) {
            throw new Error(`No controls found for template ${tempName}.`);
        }

        let maxWidth = 0;
        let maxHeight = 0;
        for (const row of controls) {
            const { PosX, PosY, Width, Height } = row;
            if (PosX + Width > maxWidth) {
                maxWidth = PosX + Width;
            }
            if (PosY + Height > maxHeight) {
                maxHeight = PosY + Height;
            }
        }
        return { width: maxWidth, height: maxHeight };
    }

    getTemplateByName(tempName: string): Template {
        const template = this.templates.find((temp) => temp.name === tempName);
        if (!template) {
            throw new Error(`Template ${tempName} not found.`);
        }
        return template;
    }
}

/**
 * Row from the Controls table in a template file
 */
interface ControlRow {
    ActionType: number;
    Alignment: number;
    ConfirmOffMsg: string | null;
    ConfirmOnMsg: string | null;
    ControlId: number;
    Dimension: Uint8Array;
    DisplayName: string;
    Flags: number;
    Font: string;
    Height: number;
    JoinedId: number;
    LabelAlignment: number;
    LabelColor: number;
    LabelFont: number;
    LimitMax: number;
    LimitMin: number;
    LineThickness: number;
    MainColor: number;
    PictureIdDay: number;
    PictureIdNight: number;
    PosX: number;
    PosY: number;
    SubColor: number;
    TargetChannel: number;
    TargetId: number;
    TargetProperty: string | null;
    TargetRecord: number;
    TargetType: number;
    ThresholdValue: number;
    Type: number;
    UniqueName: string | null;
    ViewId: number;
    Width: number;
}

interface ControlBuilder {
    setDisplayName(val: string): void;
    setHeight(val: number): void;
    setViewId(val: number): void;
    setJoinedId(val: number): void;
    setPosX(val: number): void;
    setPosY(val: number): void;
    setType(val: number): void;
    setLimitMin(val: number): void
    setLimitMax(val: number): void
    setMainColor(val: number): void
    setSubColor(val: number): void
    setLabelColor(val: number): void
    setLabelFont(val: number): void
    setLabelAlignment(val: number): void
    setLineThickness(val: number): void
    setThresholdValue(val: number): void
    setFlags(val: number): void
    setActionType(val: number): void
    setTargetType(val: number): void
    setTargetId(val: number): void;
    setTargetProperty(val: string): void;
    setTargetChannel(val: number): void;
    setTargetRecord(val: number): void;
    setConfirmOnMsg(val: string): void;
    setConfirmOffMsg(val: string): void;
    setPictureIdDay(val: number): void;
    setPictureIdNight(val: number): void;
}

export class Control implements ControlBuilder {
    _ActionType: number;
    _Alignment: number;
    _ConfirmOffMsg: string | null;
    _ConfirmOnMsg: string | null;
    _ControlId: number;
    _Dimension: Uint8Array;
    _DisplayName: string;
    _Flags: number;
    _Font: string;
    _Height: number;
    _JoinedId: number;
    _LabelAlignment: number;
    _LabelColor: number;
    _LabelFont: number;
    _LimitMax: number;
    _LimitMin: number;
    _LineThickness: number;
    _MainColor: number;
    _PictureIdDay: number;
    _PictureIdNight: number;
    _PosX: number;
    _PosY: number;
    _SubColor: number;
    _TargetChannel: number;
    _TargetId: number;
    _TargetProperty: string | null;
    _TargetRecord: number;
    _TargetType: number;
    _ThresholdValue: number;
    _Type: number;
    _UniqueName: string | null;
    _ViewId: number;
    _Width: number;

    constructor(row?: ControlRow) {
        if (row) {
            const { ViewId, Type, PosX, PosY, Width, Height, DisplayName, TargetId, TargetChannel, TargetProperty, ActionType, Alignment, ConfirmOffMsg, ConfirmOnMsg, ControlId, Dimension, Flags, Font, JoinedId, LabelAlignment, LabelColor, LabelFont, LimitMin, LimitMax, LineThickness, MainColor, PictureIdDay, PictureIdNight, SubColor, TargetRecord, TargetType, ThresholdValue, UniqueName } = row;
            this.setType(Type);
            this.setPosX(PosX);
            this.setPosY(PosY);
            this.setWidth(Width);
            this.setHeight(Height);
            this.setDisplayName(DisplayName);
            this.setTargetId(TargetId);
            this.setTargetChannel(TargetChannel);
            this.setActionType(ActionType);
            this.setAlignment(Alignment);
            this.setConfirmOffMsg(ConfirmOffMsg);
            this.setConfirmOnMsg(ConfirmOnMsg);
            this.setControlId(ControlId);
            this.setDimension(Dimension);
            this.setFlags(Flags);
            this.setFont(Font);
            this.setJoinedId(JoinedId);
            this.setLabelAlignment(LabelAlignment);
            this.setLabelColor(LabelColor);
            this.setLabelFont(LabelFont);
            this.setLimitMin(LimitMin);
            this.setLimitMax(LimitMax);
            this.setLineThickness(LineThickness);
            this.setMainColor(MainColor);
            this.setPictureIdDay(PictureIdDay);
            this.setPictureIdNight(PictureIdNight);
            this.setSubColor(SubColor);
            this.setTargetProperty(TargetProperty);
            this.setTargetRecord(TargetRecord);
            this.setTargetType(TargetType);
            this.setThresholdValue(ThresholdValue);
            this.setUniqueName(UniqueName);
        }
    }

    get Alignment() {
        return this._Alignment;
    }

    public setAlignment(val: number) {
        this._Alignment = val;
        return this;
    }

    get ControlId() {
        return this._ControlId;
    }

    public setControlId(val: number) {
        this._ControlId = val;
        return this;
    }

    get Dimension() {
        return this._Dimension;
    }

    public setDimension(val: Uint8Array) {
        this._Dimension = val;
        return this;
    }

    get Font() {
        return this._Font;
    }

    public setFont(val: string) {
        this._Font = val;
        return this;
    }

    get UniqueName() {
        return this._UniqueName;
    }

    public setUniqueName(val: string | null) {
        this._UniqueName = val;
        return this;
    }

    get DisplayName() {
        return this._DisplayName;
    }
    public setDisplayName(val: string) {
        this._DisplayName = val;
        return this;
    }
    get Width() {
        return this._Width;
    }
    public setWidth(val: number) {
        this._Width = val;
        return this;
    }
    get Height() {
        return this._Height;
    }
    public setHeight(val: number) {
        this._Height = val;
        return this;
    }
    get ViewId() {
        return this._ViewId;
    }
    public setViewId(val: number) {
        this._ViewId = val;
        return this;
    }
    get JoinedId() {
        return this._JoinedId;
    }
    public setJoinedId(val: number) {
        this._JoinedId = val;
        return this;
    }
    get PosX() {
        return this._PosX;
    }
    public setPosX(val: number) {
        this._PosX = val;
        return this;
    }
    get PosY() {
        return this._PosY;
    }
    public setPosY(val: number) {
        this._PosY = val;
        return this;
    }
    get Type() {
        return this._Type;
    }
    public setType(val: number) {
        this._Type = val;
        return this;
    }
    get LimitMin() {
        return this._LimitMin;
    }
    public setLimitMin(val: number) {
        this._LimitMin = val;
        return this;
    }
    get LimitMax() {
        return this._LimitMax;
    }
    public setLimitMax(val: number) {
        this._LimitMax = val;
        return this;
    }
    get MainColor() {
        return this._MainColor;
    }
    public setMainColor(val: number) {
        this._MainColor = val;
        return this;
    }
    get SubColor() {
        return this._SubColor;
    }
    public setSubColor(val: number) {
        this._SubColor = val;
        return this;
    }
    get LabelColor() {
        return this._LabelColor;
    }
    public setLabelColor(val: number) {
        this._LabelColor = val;
        return this;
    }
    get LabelFont() {
        return this._LabelFont;
    }
    public setLabelFont(val: number) {
        this._LabelFont = val;
        return this;
    }
    get LabelAlignment() {
        return this._LabelAlignment;
    }
    public setLabelAlignment(val: number) {
        this._LabelAlignment = val;
        return this;
    }
    get LineThickness() {
        return this._LineThickness;
    }
    public setLineThickness(val: number) {
        this._LineThickness = val;
        return this;
    }
    get ThresholdValue() {
        return this._ThresholdValue;
    }
    public setThresholdValue(val: number) {
        this._ThresholdValue = val;
        return this;
    }
    get Flags() {
        return this._Flags;
    }
    public setFlags(val: number) {
        this._Flags = val;
        return this;
    }
    get ActionType() {
        return this._ActionType;
    }
    public setActionType(val: number) {
        this._ActionType = val;
        return this;
    }
    get TargetType() {
        return this._TargetType;
    }
    public setTargetType(val: number) {
        this._TargetType = val;
        return this;
    }
    get TargetId() {
        return this._TargetId;
    }
    public setTargetId(val: number) {
        this._TargetId = val;
        return this;
    }
    get TargetProperty() {
        return this._TargetProperty;
    }
    public setTargetProperty(val: string | null) {
        this._TargetProperty = val;
        return this;
    }
    get TargetChannel() {
        return this._TargetChannel;
    }
    public setTargetChannel(val: number) {
        this._TargetChannel = val;
        return this;
    }
    get TargetRecord() {
        return this._TargetRecord;
    }
    public setTargetRecord(val: number) {
        this._TargetRecord = val;
        return this;
    }
    get ConfirmOnMsg() {
        return this._ConfirmOnMsg;
    }
    public setConfirmOnMsg(val: string | null) {
        this._ConfirmOnMsg = val;
        return this;
    }
    get ConfirmOffMsg() {
        return this._ConfirmOffMsg;
    }
    public setConfirmOffMsg(val: string | null) {
        this._ConfirmOffMsg = val;
        return this;
    }
    get PictureIdDay() {
        return this._PictureIdDay;
    }
    public setPictureIdDay(val: number) {
        this._PictureIdDay = val;
        return this;
    }
    get PictureIdNight() {
        return this._PictureIdNight;
    }
    public setPictureIdNight(val: number) {
        this._PictureIdNight = val;
        return this;
    }
}
import * as dbpr from './dbpr';

const NAV_BUTTON_X = 270;
export const NAV_BUTTON_Y = 15;

const METER_VIEW_STARTX = 15;
const METER_VIEW_STARTY = 15;
const METER_SPACING_X = 15;
const METER_SPACING_Y = 15;

const PARENT_GROUP_TITLE = "AUTO";
export const AP_GROUP_TITLE = "AP";
export const METER_WINDOW_TITLE = "AUTO - Meters";
export const MAIN_WINDOW_TITLE = "AUTO - Main";

export const NAV_BUTTON_SPACING = 20;

export const MAIN_GROUP_ID = 2;

type ChannelGroupTypes = 'TYPE_SUBS_C' | 'TYPE_SUBS_R' | 'TYPE_SUBS_L' | 'TYPE_SUBS' | 'TYPE_TOPS_L' | 'TYPE_TOPS_R' | 'TYPE_TOPS' | 'TYPE_POINT';

interface TemplateOptions {
    DisplayName?: string,
    TargetId?: number,
    TargetChannel?: number,
    Width?: number,
    Height?: number,
    TargetProperty?: string,
    TargetRecord?: number,
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

interface ChannelGroup {
    groupId: number;
    name: string;
    channels: Channel[];
    type: ChannelGroupTypes;
}

interface AutoR1SourceGroup extends dbpr.SourceGroup {
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
    xover: string;
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
class SourceGroup implements AutoR1SourceGroup {
    SourceGroupId: number;
    Type: dbpr.SourceGroupTypes;
    Name: string;
    OrderIndex: number;
    RemarkableChangeDate: number;
    NextSourceGroupId: number;
    ArrayProcessingEnable: dbpr.ArrayProcessingFlag;
    ArraySightId: number;
    LinkMode: number;
    Symmetric: dbpr.SymmetricFlag;
    Mounting: dbpr.MountingFlag;
    RelativeDelay: number | null;

    MainGroupId: number;
    MainGroupName: string;
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
    xover: string;

    channelGroups: ChannelGroup[] = [];

    constructor(row: AutoR1SourceGroup) {
        this.ViewId = row.ViewId;
        this.Name = row.Name;
        this.SourceGroupId = row.SourceGroupId;
        this.NextSourceGroupId = row.NextSourceGroupId;
        this.Type = row.Type;
        this.ArrayProcessingEnable = row.ArrayProcessingEnable;
        this.ArraySightId = row.ArraySightId;
        this.System = row.System;
        this.MainGroupId = row.MainGroupId;
        this.MainGroupName = row.MainGroupName;
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
            this.channelGroups.push({ groupId: this.TopGroupId, name: this.TopGroupName, type: 'TYPE_TOPS', channels: [] });
        }
        if (this.TopLeftGroupId && this.TopLeftGroupName) {
            this.channelGroups.push({ groupId: this.TopLeftGroupId, name: this.TopLeftGroupName, type: 'TYPE_TOPS_L', channels: [] });
        }
        if (this.TopRightGroupId && this.TopRightGroupName) {
            this.channelGroups.push({ groupId: this.TopRightGroupId, name: this.TopRightGroupName, type: 'TYPE_TOPS_R', channels: [] });
        }
        if (this.SubGroupId && this.SubGroupName) {
            this.channelGroups.push({ groupId: this.SubGroupId, name: this.SubGroupName, type: 'TYPE_SUBS', channels: [] });
        }
        if (this.SubLeftGroupId && this.SubLeftGroupName) {
            this.channelGroups.push({ groupId: this.SubLeftGroupId, name: this.SubLeftGroupName, type: 'TYPE_SUBS_L', channels: [] });
        }
        if (this.SubRightGroupId && this.SubRightGroupName) {
            this.channelGroups.push({ groupId: this.SubRightGroupId, name: this.SubRightGroupName, type: 'TYPE_SUBS_R', channels: [] });
        }
        if (this.SubCGroupId && this.SubCGroupName) {
            this.channelGroups.push({ groupId: this.SubCGroupId, name: this.SubCGroupName, type: 'TYPE_SUBS_C', channels: [] });
        }

        // Skip final group if subs or tops groups have been found, only use for point sources
        if (!this.channelGroups.length && this.MainGroupId && this.MainGroupName) {
            this.channelGroups.push({ groupId: this.MainGroupId, name: this.MainGroupName, type: 'TYPE_POINT', channels: [] });
        }
    }
}


export class AutoR1ProjectFile extends dbpr.ProjectFile {
    public sourceGroups: SourceGroup[] = [];

    constructor(f: string) {
        super(f);
    }

    /**
     * Creates a new group with the given title and properties, and returns its GroupId.
     * @param title The name of the new group.
     * @param parentId The GroupId of the parent group. Defaults to 1 (the Main group).
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

        let stmt = this.db.prepare(
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


    public getSrcGrpInfo = () => {
        this.db.exec(`PRAGMA case_sensitive_like=ON;`);

        let query = `
            SELECT Views.ViewId, Views.Name, SourceGroups.SourceGroupId, NextSourceGroupId, SourceGroups.Type, ArrayProcessingEnable,
            ArraySightId, System, mainGroup.GroupId as MainGroupId, mainGroup.Name as MainGroupName, topsGroup.GroupId as TopGroupId, topsGroup.Name as TopGroupName,
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

        let rtn = stmt.all() as AutoR1SourceGroup[];

        for (let row of rtn) {
            this.sourceGroups.push(new SourceGroup(row));
        }

        // Discover all channels of previously discovered groups
        this.sourceGroups.forEach((srcGrp) => {
            srcGrp.channelGroups.forEach((devGrp) => {
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

                const rtn = stmt.all() as Channel[];

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
            TargetProperty,
            TargetRecord,
            joinedId,
        } = options || {};

        // Increase global joined ID
        if (!joinedId) joinedId = this.getHighestJoinedID() + 1;

        if (!template.controls || template.controls.length < 1) {
            throw new Error("Template has no controls.");
        }

        for (const templateControl of template.controls) {
            const control = Object.assign(new AutoR1Control(), templateControl);

            // If item of type FRAME or BUTTON to swap views (TargetType is PAGE), 
            // and a DisplayName has been provided, and we are not dealing with a fallback/regular button,
            // then set the display name to the provided name
            if ((control.Type === dbpr.ControlTypes.FRAME || (control.Type === dbpr.ControlTypes.SWITCH && control.TargetType === dbpr.TargetTypes.VIEW))
                && (control.DisplayName && control.DisplayName !== "Fallback" && control.DisplayName !== "Regular" && DisplayName)) {
                control.setDisplayName(DisplayName);
            }

            // If TargetProperty is set, and TargetChannel is not set, 
            // then set TargetChannel to 0
            if (Object.values(dbpr.TargetPropertyType).includes(control.TargetProperty as dbpr.TargetPropertyType)
                && (control.TargetChannel > -1)) {
                control.setTargetChannel(0);
            }

            if (control.TargetProperty === dbpr.TargetPropertyType.CHANNEL_STATUS_MS_DELAY
                && control.TargetChannel === -1 && TargetChannel) {
                control.setTargetChannel(TargetChannel);
                if (options?.sourceGroupType === dbpr.SourceGroupTypes.ARRAY) {
                    control.setType(dbpr.ControlTypes.DISPLAY);
                }
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
                            'Dimension') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ' ')`
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
                control.PictureIdNight.toString(),
                control.Font,
                control.Alignment,
            );
        }
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

    public getSrcGroupType(nameOrId: string | number) {
        let SourceGroupType = 0;
        let isLRGroup = false;
        let hasTOPsGroup = false;
        let hasSUBsGroup = false;
        let column = "";
        let name = "";

        if (typeof nameOrId === 'string') {
            column = "Name";
            name = nameOrId;
        }
        else if (typeof nameOrId === 'number') {
            column = "SourceGroupId";
            const getNameStmt = this.db.prepare(`SELECT Name FROM SourceGroups WHERE ${column} = ?`);
            const rtn = getNameStmt.get(nameOrId) as { Name: string };
            name = rtn.Name;
        }

        const getSourceStmt = this.db.prepare(`SELECT * FROM SourceGroups WHERE ${column} = ? ORDER BY NextSourceGroupId DESC`);
        const source = getSourceStmt.get(nameOrId) as {
            ArrayProcessingEnable: number;
            ArraySightId: number;
            LinkMode: number;
            Mounting: number;
            NextSourceGroupId: number;
            RelativeDelay: number;
            RemarkableChangeDate: number;
            SourceGroupId: number;
            Symmetric: number;
            Type: number;
        };

        if (source) {
            // SourceGroup Type
            SourceGroupType = source.Type
            // Left/Right
            if (source.NextSourceGroupId != 0) {
                isLRGroup = true;
            }
            // SUB array L/R/C
            else if (source.Type === dbpr.SourceGroupTypes.SUBARRAY && this.hasSubGroups() > 1) {
                isLRGroup = true;
            }
        }

        const getGroupsStmt = this.db.prepare(`SELECT Name FROM Groups WHERE Name LIKE ? OR Name LIKE ?`);
        const groups = getGroupsStmt.all(`${name} SUBs`, `${name} TOPs`) as { Name: string }[];

        if (groups && groups.some(group => group.Name.includes("TOPs"))) {
            hasTOPsGroup = true;
        }

        if (groups && groups.some(group => group.Name.includes("SUBs"))) {
            hasSUBsGroup = true;
        }

        return {
            SourceGroupType,
            isLRGroup,
            hasTOPsGroup,
            hasSUBsGroup
        };
    }

    public createNavButtons(templates: AutoR1TemplateFile): void {
        const getViewsStmt = this.db.prepare(`SELECT ViewId FROM Views WHERE Type = ?`);
        const increaseControlPosYByAmount = this.db.prepare('UPDATE Controls SET PosY = PosY + ? WHERE ViewId = ?');
        const navButtonTemplate = templates.templates.find(template => template.name === "Nav Button");
        const POS_X = 15;

        if (!navButtonTemplate) {
            throw new Error("Nav Button template not found.");
        }

        const mainViewId = this.getMainView().ViewId;
        const meterViewId = this.getMeterView().ViewId;

        const views = getViewsStmt.all(1000) as { ViewId: number }[];
        for (const vId of views.map(v => v.ViewId)) {
            if (vId !== mainViewId && vId !== meterViewId) {

                increaseControlPosYByAmount.run(NAV_BUTTON_Y + NAV_BUTTON_SPACING, vId);

                const mainNavButtonTemplateOptions = {
                    DisplayName: MAIN_WINDOW_TITLE,
                    TargetId: meterViewId + 1,
                    TargetChannel: dbpr.TargetChannels.NONE,
                }
                this.insertTemplate(
                    navButtonTemplate,
                    vId,
                    POS_X,
                    NAV_BUTTON_Y,
                    mainNavButtonTemplateOptions
                );

                const metersNavButtonTemplateOptions = {
                    DisplayName: METER_WINDOW_TITLE,
                    TargetId: meterViewId,
                    TargetChannel: dbpr.TargetChannels.NONE,
                }

                const buttonWidth = templates.getTemplateWidthHeight('Nav Button').width
                const spacing = 25;
                this.insertTemplate(
                    navButtonTemplate,
                    vId,
                    POS_X + + buttonWidth + spacing,
                    NAV_BUTTON_Y,
                    metersNavButtonTemplateOptions
                );
            }
        }
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
            if (srcGrp.ArrayProcessingEnable) {
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

        this.createGrp(AP_GROUP_TITLE, parentGroupId);
        const apGroupId = this.getHighestGroupID();

        const insertStmt = (ch: Channel) => this.db.prepare(
            'INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags) SELECT ?, ?, ?, ?, 1, 0'
        ).run(ch.Name, apGroupId, ch.TargetId, ch.TargetChannel);

        apChannelGroups.forEach(insertStmt);
    }

    public getAPGroup() {
        const stmt = this.db.prepare(
            `SELECT * FROM Groups WHERE Name = ?`
        )

        const rtn = stmt.get(AP_GROUP_TITLE) as dbpr.Group;

        if (!rtn) {
            throw (Error('No AP group found.'))
        }

        return rtn;
    }

    public getChannelMainGroupTotal(): number {
        let i = 0;
        for (const srcGrp of this.sourceGroups) {
            for (const chGrp of srcGrp.channelGroups) {
                if (chGrp.type === 'TYPE_SUBS'
                    || chGrp.type === 'TYPE_TOPS'
                    || chGrp.type === 'TYPE_POINT') {
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
                if (chGrp.type === 'TYPE_SUBS_R'
                    || chGrp.type === 'TYPE_TOPS_R') {
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
        let groupOption = [
            { prefix: "L", order: 'ASC' },
            { prefix: "R", order: 'ASC' },
            { prefix: "C", order: 'ASC' }
        ];

        for (let option of groupOption) {
            let query = `
                WITH RECURSIVE
                devs(GroupId, Name, ParentId, TargetId, TargetChannel, Type) AS (
                    SELECT GroupId, Name, ParentId, TargetId, TargetChannel, Type FROM Groups WHERE Name = (SELECT Name FROM SourceGroups WHERE Type = 3)
                    UNION
                    SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type FROM Groups, devs WHERE Groups.ParentId = devs.GroupId
                )
                SELECT GroupId, devs.Name, TargetId, TargetChannel, CabinetsAdditionalData.Name, Cabinets.CabinetId FROM devs
                JOIN Cabinets
                ON devs.TargetId = Cabinets.DeviceId
                AND devs.TargetChannel = Cabinets.AmplifierChannel
                JOIN CabinetsAdditionalData
                ON Cabinets.CabinetId = CabinetsAdditionalData.CabinetId
                WHERE Linked = 0
                /* Sub arrays always end with either L/C/R, two numbers, a dash and a further two numbers */
                AND devs.Name LIKE '% ${option.prefix}__%' ORDER BY GroupId ${option.order}`;

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
        this.createGrp(subArrayGroupName, parentGroupId);
        let subGroupParentID = this.getHighestGroupID();

        this.createGrp(`${subArrayGroupName} SUBs`, subGroupParentID);
        subGroupParentID = this.getHighestGroupID();

        let suffix = [" SUBs L", " SUBs R", " SUBs C"];
        let subArrayGroups = this.getSubArrayGroups();
        for (const [idx, subArrayGroup] of subArrayGroups.entries()) {
            this.createGrp(`${subArrayGroupName}${suffix[idx]}`, subGroupParentID);
            let pId = this.getHighestGroupID();

            for (const subDevices of subArrayGroup) {
                this.createGrp(subDevices.Name, pId, subDevices.TargetId, subDevices.TargetChannel, 1, 0);
            }
        }
    }

    public addSubCtoSubL = (): void => {
        let pId: number | undefined = undefined;
        for (const srcGrp of this.sourceGroups) {
            for (const chGrp of srcGrp.channelGroups) {
                if (chGrp.type == 'TYPE_SUBS_L') {
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
                        this.createGrp(
                            channel.Name, pId, channel.TargetId, channel.TargetChannel, 1, 0
                        );
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

        return this.sourceGroups.find((src) => src.ArrayProcessingEnable) ? true : false;
    }

    private getMainView() {
        const stmt = this.db.prepare(`SELECT * from Views WHERE Name = ?`);
        const view = stmt.get(MAIN_WINDOW_TITLE) as dbpr.View;

        if (!view) {
            throw (Error(`Could not find Auto R1 Meter view with name ${MAIN_WINDOW_TITLE}`))
        }

        return view;
    }

    private getMeterView() {
        const stmt = this.db.prepare(`SELECT * from Views WHERE Name = ?`);
        const view = stmt.get(METER_WINDOW_TITLE) as dbpr.View;

        if (!view) {
            throw (Error(`Could not find Auto R1 Meter view with name ${METER_WINDOW_TITLE}`))
        }

        return view;
    }

    const metersTitleDimensions = templates.getTemplateWidthHeight("Meters Title");
    const titleH = metersTitleDimensions.height
    const metersGroupDimensions = templates.getTemplateWidthHeight("Meters Group");
    const meterGrpW = metersGroupDimensions.width;
    const meterGrpH = metersGroupDimensions.height;
    const { width: meterW, height: meterH } = templates.getTemplateWidthHeight("Meter");

    const spacingX = Math.max(meterW, meterGrpW) + METER_SPACING_X;
    const spacingY = meterH + METER_SPACING_Y;

    const HRes = (spacingX * proj.getChannelMeterGroupTotal()[0]) + METER_SPACING_X;
    const VRes = titleH + meterGrpH + (spacingY * proj.getChannelMeterGroupTotal()[1]) + 100;

    proj.db.prepare(`INSERT INTO Views('Type','Name','Icon','Flags','HomeViewIndex','NaviBarIndex','HRes','VRes','ZoomLevel','ScalingFactor','ScalingPosX','ScalingPosY','ReferenceVenueObjectId') VALUES (1000,'${METER_WINDOW_TITLE}',NULL,4,NULL,-1,${HRes},${VRes},100,NULL,NULL,NULL,NULL);`).run();
    const rtn = proj.db.prepare(`SELECT max(ViewId) FROM Views`).get() as { 'max(ViewId)': number };
    if (rtn != null) {
        proj.meterViewId = rtn['max(ViewId)'];
    }

    let posX = METER_VIEW_STARTX;
    let posY = METER_VIEW_STARTY;

    const navButtonTemplate = templates.getTemplateByName("Nav Button");

    const navButtonOptions: TemplateOptions = {
        DisplayName: MAIN_WINDOW_TITLE,
        TargetId: proj.meterViewId + 1,
        TargetChannel: -1
    }
    proj.insertTemplate(
        navButtonTemplate,
        proj.meterViewId,
        NAV_BUTTON_X,
        posY + NAV_BUTTON_Y,
        navButtonOptions);

    const metersTitleTemplate = templates.getTemplateByName("Meters Title");

    proj.insertTemplate(
        metersTitleTemplate,
        proj.meterViewId,
        posX,
        posY,
    );
    posY += templates.getTemplateWidthHeight("Meters Title").height + METER_SPACING_Y;

    let startY = posY;

    const metersGroupTemplate = templates.getTemplateByName("Meters Group");

    const meterTemplate = templates.getTemplateByName("Meter");

    const metersGroupHeight = templates.getTemplateWidthHeight("Meters Group").height

    for (const srcGrp of proj.sourceGroups) {
        for (const [idx, chGrp] of srcGrp.channelGroups.entries()) {
            // Skip TOPs and SUBs group if L/R groups are present
            if ((chGrp.type === 'TYPE_SUBS' && srcGrp.Type === dbpr.SourceGroupTypes.SUBARRAY)
                || ((chGrp.type === 'TYPE_SUBS' || chGrp.type === 'TYPE_TOPS' || chGrp.type === 'TYPE_POINT')
                    && srcGrp.channelGroups.length > 1
                    && (idx === 0 || idx === 3))) {
                continue;
            }

            const joinedId = proj.getHighestJoinedID() + 1;
            const metersGroupTemplateOptions: TemplateOptions = {
                DisplayName: chGrp.name,
                TargetId: chGrp.groupId,
                joinedId
            }
            proj.insertTemplate(
                metersGroupTemplate,
                proj.meterViewId,
                posX,
                posY,
                metersGroupTemplateOptions,
            );

            const navButtonTemplateOptions: TemplateOptions = {
                DisplayName: chGrp.name,
                TargetId: srcGrp.ViewId,
                TargetChannel: -1,
                Width: meterW + 1, // R1 frames are to be 1px wider than expected
                joinedId
            }
            proj.insertTemplate(
                templates.getTemplateByName("Nav Button"),
                proj.meterViewId,
                posX - 1, // R1 frames are to be 1px further to the left than expected
                posY - 1, // R1 frames are to be 1px higher than expected
                navButtonTemplateOptions
            )

            posY += metersGroupHeight + 10;

            for (const ch of chGrp.channels) {
                const meterTemplateOptions: TemplateOptions = {
                    DisplayName: ch.Name,
                    TargetId: ch.TargetId,
                    TargetChannel: ch.TargetChannel,
                    sourceGroupType: srcGrp.Type
                }
                proj.insertTemplate(
                    meterTemplate,
                    proj.meterViewId,
                    posX,
                    posY,
                    meterTemplateOptions
                );

                posY += spacingY;
            }

            posX += spacingX;
            posY = startY;
        }
    }
}

export function createMainView(proj: AutoR1ProjectFile, templates: AutoR1TemplateFile) {

    // Get width + height of templates used
    const { width: mainTempWidth, height: mainTempHeight } = templates.getTemplateWidthHeight('Main Main');
    const { width: arraySightTempWidth, height: _ } = templates.getTemplateWidthHeight('Main ArraySight');
    const { width: _mainTitleTempWidth, height: mainTitleTempHeight } = templates.getTemplateWidthHeight('Main Title');
    const { width: meterTempWidth, height: meterTempHeight } = templates.getTemplateWidthHeight('Group LR AP CPL2');
    const meterTempBuffer = 200;

    const HRes = (
        mainTempWidth
        + arraySightTempWidth
        + ((METER_SPACING_X + meterTempWidth) * proj.getChannelMainGroupTotal())
        + meterTempBuffer
    );

    const VRes = mainTitleTempHeight + Math.max(meterTempHeight, mainTempHeight) + 60;
    proj.db.prepare(
        `INSERT INTO Views("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`
    ).run(1000, MAIN_WINDOW_TITLE, null, 4, null, -1, HRes, VRes, 100, null, null, null, null);
    const rtn = proj.db.prepare(
        'SELECT max(ViewId) FROM Views'
    ).get() as { 'max(ViewId)': number };

    proj.mainViewId = rtn['max(ViewId)'];

    let posX = 10, posY = 10;

    const navButtonTemplateOptions: TemplateOptions = {
        DisplayName: METER_WINDOW_TITLE,
        TargetId: proj.meterViewId,
        TargetChannel: -1
    }
    proj.insertTemplate(
        templates.getTemplateByName('Nav Button'),
        proj.mainViewId,
        NAV_BUTTON_X,
        posY + NAV_BUTTON_Y,
        navButtonTemplateOptions
    );

    proj.insertTemplate(
        templates.getTemplateByName('Main Title'),
        proj.mainViewId,
        posX,
        posY,
    )
    posY += templates.getTemplateWidthHeight("Main Title").height + METER_SPACING_Y;

    const mainMainTemplateOptions: TemplateOptions = {
        TargetId: proj.getMasterGroupID()
    }

    proj.insertTemplate(
        templates.getTemplateByName('Main Main'),
        proj.mainViewId,
        posX,
        posY,
        mainMainTemplateOptions
    )
    posX += templates.getTemplateWidthHeight("Main Main").width + (METER_SPACING_X / 2);

    const arraySightTemplateOptions: TemplateOptions = {
        TargetId: 0
    }
    proj.insertTemplate(
        templates.getTemplateByName('Main ArraySight'),
        proj.mainViewId,
        posX,
        posY,
        arraySightTemplateOptions
    );

    const { width: arraySightTempX, height: arraySightTempY } = templates.getTemplateWidthHeight("Main ArraySight");

    if (proj.getApStatus()) {
        const thcTemplateOptions: TemplateOptions = {
            TargetId: proj.apGroupID
        }
        proj.insertTemplate(
            templates.getTemplateByName('THC'),
            proj.mainViewId,
            posX,
            posY + arraySightTempY + (METER_SPACING_Y / 2),
            thcTemplateOptions,
        )
        posX += templates.getTemplateWidthHeight('THC').width + (METER_SPACING_X * 4)
    } else {
        posX += arraySightTempX + (METER_SPACING_X * 4);
    }

    let lrGroups: ChannelGroup[] = [];

    proj.sourceGroups.forEach((sourceGroup) => {
        for (let channelGroupIndex = 0; channelGroupIndex < sourceGroup.channelGroups.length; channelGroupIndex++) {
            const joinedId = proj.getHighestJoinedID() + 1;
            const channelGroup = sourceGroup.channelGroups[channelGroupIndex];

            if ([
                'TYPE_SUBS_L',
                'TYPE_SUBS_R',
                'TYPE_SUBS_C',
                'TYPE_TOPS_L',
                'TYPE_TOPS_R',
            ].find((s) => s === channelGroup.type)) {  // TOP or SUB L/R/C Group
                return;
            }

            let templateName = 'Group';
            if (sourceGroup.channelGroups.length >= 3) {  // Stereo groups
                lrGroups = [
                    sourceGroup.channelGroups[channelGroupIndex + 1],
                    sourceGroup.channelGroups[channelGroupIndex + 2],
                ];
                templateName += ' LR';
            }
            if (sourceGroup.ArrayProcessingEnable) {
                templateName += ' AP';
            }

            if (['GSL', 'KSL', 'XSL'].find((s) => s === sourceGroup.System)) {
                templateName += ' CPL2';
            }

            const templateControls = templates.getTemplateControlsFromName(templateName);
            let meterChannel = 0;  // Current channel of stereo pair
            let muteChannel = 0;

            for (const control of templateControls) {
                let {
                    Type: controlType,
                    DisplayName: displayName,
                    Flags: flag,
                    TargetChannel: targetChannel,
                    TargetProperty: targetProperty,
                } = control;

                let targetId = channelGroup.groupId;

                // Update Infra/100hz button text
                if (
                    (channelGroup.type < 'TYPE_TOPS' || channelGroup.type > 'TYPE_TOPS_R')
                    && displayName === 'CUT'
                    && sourceGroup.xover !== null
                ) {
                    displayName = sourceGroup.xover;
                    console.info(`${channelGroup.name} - Enabling ${sourceGroup.xover}`);
                }

                // Meters, these require a TargetChannel
                if (controlType === dbpr.ControlTypes.METER) {
                    if (templateName.includes('Group LR')) {
                        [targetId, targetChannel] = [
                            lrGroups[meterChannel].channels[0].TargetId,
                            lrGroups[meterChannel].channels[0].TargetChannel,
                        ];
                        meterChannel += 1;
                    } else {
                        targetId = channelGroup.channels[0].TargetId;
                        targetChannel = channelGroup.channels[0].TargetChannel;
                    }
                } else if (controlType === dbpr.ControlTypes.SWITCH) {
                    if (templateName.includes('Group LR') && targetProperty === dbpr.TargetPropertyType.CONFIG_MUTE) {  // Mute
                        targetId = lrGroups[muteChannel].groupId;
                        muteChannel += 1;
                    }

                    if (displayName === 'View EQ') {
                        targetId = sourceGroup.ViewId + 1;
                    }
                } else if (controlType === dbpr.ControlTypes.FRAME) {
                    if (displayName) {
                        displayName = channelGroup.name;
                    }
                } else if (controlType === dbpr.ControlTypes.METER) {
                    if (targetProperty === dbpr.TargetPropertyType.CHANNEL_STATUS_MS_DELAY && (
                        channelGroup.name.toLowerCase().includes('fill') || channelGroup.type > 'TYPE_TOPS_L'
                    )) {
                        flag = 14;
                        console.info(`${channelGroup.name} - Setting relative delay`);
                    }
                }

                const query = `INSERT INTO Controls ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", \
                    "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", \
                        "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                            ?, ?, ?, ?, ?, ?, ?, ?)`

                if (
                    controlType === dbpr.ControlTypes.DIGITAL
                    && targetProperty === dbpr.TargetPropertyType.CONFIG_FILTER3
                    && (['TYPE_POINT', 'TYPE_TOPS_L', 'TYPE_SUBS', 'TYPE_SUBS_L', 'TYPE_SUBS_R', 'TYPE_SUBS_C'].find((s) => s === channelGroup.type))
                    && sourceGroup.xover
                ) {
                    console.info(`${channelGroup.name} - Skipping CPL`)
                } else if (sourceGroup.Type === dbpr.SourceGroupTypes.ADDITIONAL_AMPLIFIER
                    && targetProperty === dbpr.TargetPropertyType.CONFIG_LOAD_MATCH_ENABLE
                ) {
                    console.info(`${channelGroup.name} - Skipping Load Match Enable`)
                } else if (sourceGroup.Type === dbpr.SourceGroupTypes.ADDITIONAL_AMPLIFIER
                    && displayName === 'View EQ'
                ) {
                    console.info(`${channelGroup.name} - Skipping View EQ Switch`)
                } else {
                    proj.db.prepare(query).run(
                        controlType, control.PosX + posX, control.PosY + posY, control.Width, control.Height, proj.mainViewId, displayName, joinedId, control.LimitMin, control.LimitMax, control.MainColor, control.SubColor, control.LabelColor, control.LabelFont, control.LabelAlignment, control.LineThickness, control.ThresholdValue, flag, control.ActionType, control.TargetType, targetId, targetChannel, targetProperty, control.TargetRecord, null, null, control.PictureIdDay, control.PictureIdNight, control.Font, control.Alignment, "");
                }

            }

            const navButtonTemplateOptions: TemplateOptions = {
                DisplayName: channelGroup.name,
                TargetId: sourceGroup.ViewId,
                TargetChannel: -1,
                joinedId,
                Width: templates.getTemplateWidthHeight('Nav Button').width + 1, // R1 frames are to be 1px wider than expected
            }
            proj.insertTemplate(
                templates.getTemplateByName("Nav Button"),
                proj.mainViewId,
                posX - 1, // R1 frames are to be 1px further to the left than expected
                posY - 1, // R1 frames are to be 1px higher than expected
                navButtonTemplateOptions
            )

            posX += meterTempWidth + METER_SPACING_X;
        }
    })
}

interface ControlBuilder {
    _ActionType: number;
    _Alignment: number;
    _ConfirmOffMsg: string | null;
    _ConfirmOnMsg: string | null;
    _ControlId: number;
    _Dimension: Uint8Array;
    _DisplayName: string | null;
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

    setDisplayName(val: string | null): void;
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

export class AutoR1Control implements ControlBuilder {
    _ActionType: number;
    _Alignment: number;
    _ConfirmOffMsg: string | null;
    _ConfirmOnMsg: string | null;
    _ControlId: number;
    _Dimension: Uint8Array;
    _DisplayName: string | null;
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

    constructor(row?: dbpr.Control) {
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
    public setDisplayName(val: string | null) {
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

/**
 * Contains all controls and sections of a template
 * @param sections TemplateSection
 * @param controls ControlRow
 */
export class AutoR1Template {
    id?: number;
    name?: string;
    parentId?: number;
    joinedId?: number;
    controls?: AutoR1Control[];

    constructor(sections?: dbpr.Section, controls?: dbpr.Control[]) {
        this.id = sections?.Id
        this.name = sections?.Name
        this.parentId = sections?.ParentId
        this.joinedId = sections?.JoinedId

        this.controls = [];
        controls?.forEach((control) => {
            this.controls?.push(new AutoR1Control(control));
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
    public getTemplateControlsFromName(tempName: string) {
        for (const t of this.templates) {
            if (t.name === tempName) {
                if (t.controls && t.controls.length) {
                    return t.controls;
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
            `SELECT PosX, PosY, Width, Height FROM Controls WHERE JoinedId = ${jId}`
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
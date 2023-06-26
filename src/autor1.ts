import * as r1 from './r1ts';

const NAV_BUTTON_X = 270;
export const NAV_BUTTON_Y = 15;

const METER_VIEW_STARTX = 15;
const METER_VIEW_STARTY = 15;
const METER_SPACING_X = 15;
const METER_SPACING_Y = 15;

const PARENT_GROUP_TITLE = "AUTO";
export const AP_GROUP_TITLE = "AP";
export const METER_WINDOW_TITLE = "AUTO - Meters";
export const MASTER_WINDOW_TITLE = "AUTO - Master";
const INPUT_SNAP_NAME = "IP Config";

export const NAV_BUTTON_SPACING = 20;

export const MASTER_GROUP_ID = 2;

export class AutoR1Project extends r1.ProjectFile {
    public parendID?: number;
    public apGroupID?: number;

    constructor(f: string) {
        super(f);
    }
}

export const getSrcGroupType = (proj: r1.ProjectFile, nameOrId: string | number) => {
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
        const getNameStmt = proj.db.prepare(`SELECT Name FROM SourceGroups WHERE ${column} = ?`);
        const rtn = getNameStmt.get(nameOrId) as { Name: string };
        name = rtn.Name;
    }

    const getSourceStmt = proj.db.prepare(`SELECT * FROM SourceGroups WHERE ${column} = ? ORDER BY NextSourceGroupId DESC`);
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
        else if (source.Type === r1.SOURCEGROUPS_TYPE_SUBarray && hasSubGroups(proj) > 1) {
            isLRGroup = true;
        }
    }

    const getGroupsStmt = proj.db.prepare(`SELECT Name FROM Groups WHERE Name LIKE ? OR Name LIKE ?`);
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

export function createNavButtons(proj: r1.ProjectFile, templates: r1.TemplateFile): void {
    const getViewsStmt = proj.db.prepare(`SELECT ViewId FROM Views WHERE Type = ?`);
    const increaseControlPosYByAmount = proj.db.prepare('UPDATE Controls SET PosY = PosY + ? WHERE ViewId = ?');
    const navButtonTemplate = templates.templates.find(template => template.name === "Nav Button");

    if (!navButtonTemplate) {
        throw new Error("Nav Button template not found.");
    }

    const views = getViewsStmt.all(1000) as { ViewId: number }[];
    for (const vId of views.map(v => v.ViewId)) {
        if (vId !== proj.masterViewId && vId !== proj.meterViewId) {

            increaseControlPosYByAmount.run(NAV_BUTTON_Y + NAV_BUTTON_SPACING, vId);

            proj.insertTemplate(
                navButtonTemplate,
                vId,
                15,
                NAV_BUTTON_Y,
                MASTER_WINDOW_TITLE,
                proj.meterViewId + 1,
                -1,
            );
        }
    }
}

function removeNavButtons(proj: r1.ProjectFile, masterViewId: number): void {
    const getControlsStmt = proj.db.prepare('SELECT ViewId FROM Controls WHERE "TargetId" = ? AND "TargetChannel" = -1');
    const updateControlsStmt = proj.db.prepare('UPDATE Controls SET PosY = PosY - ? WHERE ViewId = ?');
    const deleteControlsStmt = proj.db.prepare('DELETE FROM Controls WHERE "TargetId" = ? AND "TargetChannel" = -1');

    for (const vId of getControlsStmt.iterate(masterViewId)) {
        if (vId !== proj.masterViewId && vId !== proj.meterViewId) {
            updateControlsStmt.run(NAV_BUTTON_Y + 20, vId);
        }
    }

    deleteControlsStmt.run(masterViewId, -1);
    console.log(`Deleted ${MASTER_WINDOW_TITLE} nav buttons.`);
}

/**
 * Cleans the R1 project by deleting all custom views, their controls, and any custom groups.
 * @param proj R1 project file
 * @param parentGroupId Group id of the parent custom group
 */
export const clean = (proj: r1.ProjectFile, parentGroupId = MASTER_GROUP_ID) => {
    console.log("Cleaning R1 project.");

    try {
        const masterViewId = proj.getViewIdFromName(MASTER_WINDOW_TITLE);

        proj.db.prepare('DELETE FROM Controls WHERE "ViewId" = ?').run(masterViewId);
        console.log(`Deleted ${MASTER_WINDOW_TITLE} controls.`);

        proj.db.prepare('DELETE FROM Views WHERE "Name" = ?').run(MASTER_WINDOW_TITLE);
        console.log(`Deleted ${MASTER_WINDOW_TITLE} view.`);

        removeNavButtons(proj, masterViewId);
    } catch (error) {
        console.error(error);
    }

    try {
        const meterViewId = proj.getViewIdFromName(METER_WINDOW_TITLE);

        proj.db.prepare('DELETE FROM Controls WHERE "ViewId" = ?').run(meterViewId);
        console.log(`Deleted ${METER_WINDOW_TITLE} view controls.`);

        proj.db.prepare('DELETE FROM Views WHERE "Name" = ?').run(METER_WINDOW_TITLE);
        console.log(`Deleted ${METER_WINDOW_TITLE} view.`);
    } catch (error) {
        console.error(error);
    }

    const subArrayNameStmt = proj.db.prepare("SELECT Name FROM SourceGroups WHERE Type = ?");
    const subArrayName = subArrayNameStmt.get(r1.SOURCEGROUPS_TYPE_SUBarray) as { Name: string }

    if (subArrayName) {
        const getGroupIdStmt = proj.db.prepare('SELECT GroupId FROM Groups WHERE Name = ? AND ParentId = ?');
        const groupId = getGroupIdStmt.get(subArrayName.Name, parentGroupId) as { GroupId: number };

        if (groupId) {
            proj.deleteGroup(groupId.GroupId);
        }
    }

    proj.deleteGroup(parentGroupId);

    console.log(`Deleted ${PARENT_GROUP_TITLE} group.`);
}

/**
 * Inserts all AP channels into a dedicated AP group
 * @param projectFile R1 project file 
 * @param parentGroupId Group id to create the AP group under
 */
export const createApChannelGroup = (projectFile: r1.ProjectFile, parentGroupId = MASTER_GROUP_ID): void => {
    const apChannelGroups: any[] = [];

    for (const srcGrp of projectFile.sourceGroups) {
        if (srcGrp.ArrayProcessingEnable) {
            for (const chGrp of srcGrp.channelGroups) {
                if (chGrp.type === 'TYPE_TOPS') {
                    apChannelGroups.push(...chGrp.channels);
                }
            }
        }
    }

    if (apChannelGroups.length > 0) {
        projectFile.createGrp(AP_GROUP_TITLE, parentGroupId);
        const apGroupId = projectFile.getHighestGroupID();

        const insertStmt = projectFile.db.prepare(
            'INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags) SELECT ?, ?, ?, ?, 1, 0'
        );

        for (const ch of apChannelGroups) {
            insertStmt.run(ch.name, apGroupId, ch.targetId, ch.targetChannel);
        }
    } else {
        throw (new Error("No AP channel groups found."))
    }
}

/**
 * Returns the controls of a template by name
 * @param templates File containing the templates
 * @param tempName Name of the template to get the controls of
 * @returns Array of controls
 * @throws Error if the template doesn't exist
 * @throws Error if the template doesn't have any controls
 */
export const getTemplateControlsFromName = (templates: r1.TemplateFile, tempName: string) => {
    for (const t of templates.templates) {
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
export const getTemplateWidthHeight = (templateFile: r1.TemplateFile, templateName: string): any => {
    const stmt = templateFile.db.prepare(
        `SELECT JoinedId FROM 'main'.'Sections' WHERE Name = '${templateName}'`
    );
    let rtn = stmt.get() as { JoinedId: number };
    if (rtn) {
        let jId = rtn.JoinedId;
        const stmt = templateFile.db.prepare(
            `SELECT PosX, PosY, Width, Height FROM Controls WHERE JoinedId = ${jId}`
        );

        const templateControls = stmt.all() as { PosX: number, PosY: number, Width: number, Height: number }[];
        if (templateControls.length > 0) {
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
        } else {
            throw (`${templateName} template controls not found.`);
        }
    } else {
        throw (`${templateName} template not found.`);
    }
}

export const createMeterView = (proj: r1.ProjectFile, templates: r1.TemplateFile): void => {
    const metersTitleDimensions = templates.getTempSize("Meters Title");
    const titleH = metersTitleDimensions.height
    const metersGroupDimensions = templates.getTempSize("Meters Group");
    const meterGrpW = metersGroupDimensions.width;
    const meterGrpH = metersGroupDimensions.height;
    const meterDimensions = templates.getTempSize("Meter");
    const meterW = meterDimensions.width;
    const meterH = meterDimensions.height;

    const meterJoinedIDs = [];
    const spacingX = Math.max(meterW, meterGrpW) + METER_SPACING_X;
    const spacingY = meterH + METER_SPACING_Y;

    const HRes = (spacingX * getChannelMeterGroupTotal(proj)[0]) + METER_SPACING_X;
    const VRes = titleH + meterGrpH + (spacingY * getChannelMeterGroupTotal(proj)[1]) + 100;

    proj.db.prepare(`INSERT INTO Views('Type','Name','Icon','Flags','HomeViewIndex','NaviBarIndex','HRes','VRes','ZoomLevel','ScalingFactor','ScalingPosX','ScalingPosY','ReferenceVenueObjectId') VALUES (1000,'${METER_WINDOW_TITLE}',NULL,4,NULL,-1,${HRes},${VRes},100,NULL,NULL,NULL,NULL);`).run();
    const rtn = proj.db.prepare(`SELECT max(ViewId) FROM Views`).get() as { 'max(ViewId)': number };
    if (rtn != null) {
        proj.meterViewId = rtn['max(ViewId)'];
    }

    let posX = METER_VIEW_STARTX;
    let posY = METER_VIEW_STARTY;

    const template = templates.getTemplateByName("Nav Button");

    proj.insertTemplate(
        template,
        proj.meterViewId,
        NAV_BUTTON_X,
        posY + NAV_BUTTON_Y,
        MASTER_WINDOW_TITLE,
        proj.meterViewId + 1,
        -1);  // Use appropriate values

    const metersTitleTemplate = templates.getTemplateByName("Meters Title");

    proj.insertTemplate(
        metersTitleTemplate,
        proj.meterViewId,
        posX,
        posY,
    );
    posY += templates.getTempSize("Meters Title").height + METER_SPACING_Y;

    let startY = posY;

    const metersGroupTemplate = templates.getTemplateByName("Meters Group");

    const meterTemplate = templates.getTemplateByName("Meter");

    const metersGroupHeight = templates.getTempSize("Meters Group").height

    for (const srcGrp of proj.sourceGroups) {
        for (const [idx, chGrp] of srcGrp.channelGroups.entries()) {
            // Skip TOPs and SUBs group if L/R groups are present
            if ((chGrp.type === 'TYPE_SUBS' && srcGrp.Type === r1.SOURCEGROUPS_TYPE_SUBarray)
                || ((chGrp.type === 'TYPE_SUBS' || chGrp.type === 'TYPE_TOPS' || chGrp.type === 'TYPE_POINT')
                    && srcGrp.channelGroups.length > 1
                    && (idx === 0 || idx === 3))) {
                continue;
            }

            proj.insertTemplate(
                metersGroupTemplate,
                proj.meterViewId,
                posX,
                posY,
                chGrp.name,
                chGrp.groupId
            );

            posY += metersGroupHeight + 10;

            for (const ch of chGrp.channels) {
                proj.insertTemplate(
                    meterTemplate,
                    proj.meterViewId,
                    posX,
                    posY,
                    ch.Name,
                    ch.TargetId,
                    ch.TargetChannel
                );

                posY += spacingY;
            }

            posX += spacingX;
            posY = startY;
            proj.jId = proj.jId + 1;
        }
    }
}

function getChannelMasterGroupTotal(proj: r1.ProjectFile): number {
    let i = 0;
    for (const srcGrp of proj.sourceGroups) {
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

function getChannelMeterGroupTotal(proj: r1.ProjectFile): [number, number] {
    let i = 0;
    let j = 0;
    for (const srcGrp of proj.sourceGroups) {
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
 * TODO: Add description
 */
export const getSubArrayGroups = (proj: r1.ProjectFile) => {
    let subGroups: any[] = [];
    let str = ["L", "R", "C"];

    for (let s of str) {
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
            AND devs.Name LIKE '% ${s}__%'`;

        const stmt = proj.db.prepare(query);

        let rtn = stmt.all();

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
export const createSubLRCGroups = (proj: r1.ProjectFile, parentGroupId = MASTER_GROUP_ID): void => {
    const subArrayGroup = proj.db.prepare(
        `SELECT Name FROM SourceGroups WHERE Type = ${r1.SRC_TYPE_SUBARRAY}`
    ).get() as { Name: string };

    if (!subArrayGroup) {
        throw new Error("No sub array group found");
    }

    const subArrayGroupName = subArrayGroup.Name;
    proj.createGrp(subArrayGroupName, parentGroupId);
    let subGroupParentID = proj.getHighestGroupID();

    proj.createGrp(`${subArrayGroupName} SUBs`, subGroupParentID);
    subGroupParentID = proj.getHighestGroupID();

    let suffix = [" SUBs L", " SUBs R", " SUBs C"];
    let subArrayGroups = getSubArrayGroups(proj);
    for (const [idx, subArrayGroup] of subArrayGroups.entries()) {
        proj.createGrp(`${subArrayGroupName}${suffix[idx]}`, subGroupParentID);
        let pId = proj.getHighestGroupID();

        for (const subDevices of subArrayGroup) {
            proj.createGrp(subDevices.Name, pId, subDevices.TargetId, subDevices.TargetChannel, 1, 0);
        }
    }
}

export const addSubCtoSubL = (proj: r1.ProjectFile): void => {
    let pId: number | undefined = undefined;
    for (const srcGrp of proj.sourceGroups) {
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

    for (const srcGrp of proj.sourceGroups) {
        for (const chGrp of srcGrp.channelGroups) {
            if (chGrp.type == 'TYPE_SUBS_C') {
                for (const channel of chGrp.channels) {
                    proj.createGrp(
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
export const hasSubGroups = (proj: r1.ProjectFile): number => {
    const stmt = proj.db.prepare(
        `SELECT Name FROM SourceGroups WHERE Type = ${r1.SRC_TYPE_SUBARRAY}`
    );
    let rtn = stmt.get() as { Name: string };
    let groupCount = 0;
    if (rtn) {
        let name = rtn.Name;
        let str = [" SUBs L", " SUBs R", " SUBs C"];
        for (const s of str) {
            let q = `SELECT * FROM Groups WHERE Name = '${name}${s}'`;
            const stmt = proj.db.prepare(q);
            const rtn = stmt.get();
            if (rtn) {
                groupCount++;
            }
        }
    }
    return groupCount;
}

export const configureApChannels = (proj: AutoR1Project): void => {
    const apGroup: r1.Channel[] = [];
    for (const sourceGroupWithApEnabled of proj.sourceGroups.filter((g) => g.ArrayProcessingEnable)) {
        const topsChannelGroupsWithApEnabled = sourceGroupWithApEnabled.channelGroups.filter((g) => g.type === 'TYPE_TOPS')
        for (const topsChannelGroup of topsChannelGroupsWithApEnabled) {
            apGroup.push(...topsChannelGroup.channels);
        }
    }

    if (apGroup.length > 0) {
        proj.createGrp(AP_GROUP_TITLE, proj.parendID);
        proj.apGroupID = proj.getHighestGroupID();
        const stmt = proj.db.prepare(
            `INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags) VALUES (?, ?, ?, ?, 1, 0)`
        );
        for (const ch of apGroup) {
            stmt.run(ch.Name, proj.apGroupID, ch.TargetId, ch.TargetChannel);
        }
    }
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
export const getApStatus = (proj: r1.ProjectFile): boolean => {
    if (!proj.sourceGroups || proj.sourceGroups.length === 0) {
        throw new Error("SourceGroups not loaded");
    }

    return proj.sourceGroups.find((src) => src.ArrayProcessingEnable) ? true : false;
}

export const projectIsInitialised = (proj: r1.ProjectFile) => {
    let stmt = proj.db.prepare(`SELECT * FROM sqlite_master WHERE name ='Groups' and type='table`)
    const rtn = stmt.run()
    if (stmt.run()) {

    }
}

export const createMasterView = (proj: AutoR1Project, templates: r1.TemplateFile) => {
    // Get width + height of templates used
    const { width: masterTempWidth, height: masterTempHeight } = templates.getTempSize('Master Main');
    const { width: arraySightTempWidth, height: _ } = templates.getTempSize('Master ArraySight');
    const { width: _masterTitleTempWidth, height: masterTitleTempHeight } = templates.getTempSize('Master Title');
    const { width: meterTempWidth, height: meterTempHeight } = templates.getTempSize('Group LR AP CPL2');
    const meterTempBuffer = 200;

    const HRes = (
        masterTempWidth
        + arraySightTempWidth
        + ((METER_SPACING_X + meterTempWidth) * getChannelMasterGroupTotal(proj))
        + meterTempBuffer
    );

    const VRes = masterTitleTempHeight + Math.max(meterTempHeight, masterTempHeight) + 60;
    proj.db.prepare(
        `INSERT INTO Views("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`
    ).run(1000, MASTER_WINDOW_TITLE, null, 4, null, -1, HRes, VRes, 100, null, null, null, null);
    const rtn = proj.db.prepare(
        'SELECT max(ViewId) FROM Views'
    ).get() as { 'max(ViewId)': number };

    proj.masterViewId = rtn['max(ViewId)'];

    let posX = 10, posY = 10;

    proj.insertTemplate(
        templates.getTemplateByName('Nav Button'),
        proj.masterViewId,
        NAV_BUTTON_X,
        posY + NAV_BUTTON_Y,
        METER_WINDOW_TITLE,
        proj.meterViewId,
        -1,
    );

    proj.insertTemplate(
        templates.getTemplateByName('Master Title'),
        proj.masterViewId,
        posX,
        posY,
    )
    posY += templates.getTempSize("Master Title").height + METER_SPACING_Y;

    proj.insertTemplate(
        templates.getTemplateByName('Master Main'),
        proj.masterViewId,
        posX,
        posY,
        '',
        proj.mId,
    )
    posX += templates.getTempSize("Master Main").width + (METER_SPACING_X / 2);

    proj.insertTemplate(
        templates.getTemplateByName('Master ArraySight'),
        proj.masterViewId,
        posX,
        posY,
        undefined,
        0,
    );

    const { width: arraySightTempX, height: arraySightTempY } = templates.getTempSize("Master ArraySight");

    if (getApStatus(proj)) {
        proj.insertTemplate(
            templates.getTemplateByName('THC'),
            proj.masterViewId,
            posX,
            posY + arraySightTempY + (METER_SPACING_Y / 2),
            '',
            proj.apGroupID,
        )
        posX += templates.getTempSize('THC').width + (METER_SPACING_X * 4)
    } else {
        posX += arraySightTempX + (METER_SPACING_X * 4);
    }

    let lrGroups: r1.ChannelGroup[] = [];

    proj.sourceGroups.forEach((sourceGroup) => {
        for (let channelGroupIndex = 0; channelGroupIndex < sourceGroup.channelGroups.length; channelGroupIndex++) {
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

            if (['GSL', 'KSL'].find((s) => s === sourceGroup.System)) {
                templateName += ' CPL2';
            }

            const templateControls = getTemplateControlsFromName(templates, templateName);
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
                if (controlType === r1.CTRL_METER) {
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
                } else if (controlType === r1.CTRL_BUTTON) {
                    if (templateName.includes('Group LR') && targetProperty === 'Config_Mute') {  // Mute
                        targetId = lrGroups[muteChannel].groupId;
                        muteChannel += 1;
                    }

                    if (displayName === 'View EQ') {
                        targetId = sourceGroup.ViewId + 1;
                    }
                } else if (controlType === r1.CTRL_FRAME) {
                    if (displayName) {
                        displayName = channelGroup.name;
                    }
                } else if (controlType === r1.CTRL_INPUT) {
                    if (targetProperty === 'ChStatus_MsDelay' && (
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
                    controlType === r1.CTRL_INPUT
                    && targetProperty === 'Config_Filter3'
                    && (['TYPE_POINT', 'TYPE_TOPS_L', 'TYPE_SUBS', 'TYPE_SUBS_L', 'TYPE_SUBS_R', 'TYPE_SUBS_C'].find((s) => s === channelGroup.type))
                    && sourceGroup.xover
                ) {
                    console.info(`${channelGroup.name} - Skipping CPL`)
                } else {
                    proj.db.prepare(query).run(
                        controlType, control.PosX + posX, control.PosY + posY, control.Width, control.Height, proj.masterViewId, displayName, proj.jId, control.LimitMin, control.LimitMax, control.MainColor, control.SubColor, control.LabelColor, control.LabelFont, control.LabelAlignment, control.LineThickness, control.ThresholdValue, flag, control.ActionType, control.TargetType, targetId, targetChannel, targetProperty, control.TargetRecord, null, null, control.PictureIdDay, control.PictureIdNight, control.Font, control.Alignment, "");
                }

            }
            proj.insertTemplate(
                templates.getTemplateByName("Nav Button"),
                proj.masterViewId,
                posX,
                posY,
                channelGroup.name,
                sourceGroup.ViewId,
                -1,
            )

            posX += meterTempWidth + METER_SPACING_X;
        }
    })
}

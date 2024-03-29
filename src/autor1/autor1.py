import sqlite3
import logging
from abc import ABCMeta
import r1py.r1py as r1
import sys

log = logging.getLogger(__name__)
# log.addHandler(logging.StreamHandler(sys.stdout))

NAV_BUTTON_X = 270
NAV_BUTTON_Y = 15

METER_VIEW_STARTX = 15
METER_VIEW_STARTY = 15
METER_SPACING_X = 15
METER_SPACING_Y = 15

PARENT_GROUP_TITLE = "AUTO"
AP_GROUP_TITLE = "AP"
METER_WINDOW_TITLE = "AUTO - Meters"
MASTER_WINDOW_TITLE = "AUTO - Master"
INPUT_SNAP_NAME = "IP Config"

TYPE_SUBS_C = 7
TYPE_SUBS_R = 6
TYPE_SUBS_L = 5
TYPE_SUBS = 4
TYPE_TOPS_L = 3
TYPE_TOPS_R = 2
TYPE_TOPS = 1
TYPE_POINT = 0

##### Source groups are created in ArrayCalc ########
# Sections is table name from .r2t file
class Template:
    def __init__(self, sections, controls):
        if sections is not None:
            self.id, self.name, self.parentId, self.joinedId, _ = sections

        if controls is not None:
            self.controls = controls


### Load template file + templates within from .r2t file ###
# Sections table contains template overview info
class TemplateFile(r1.sqlDbFile):
    def __init__(self, f):
        super().__init__(f)  # Inherit from parent class
        self.templates = []

        try:
            self.cursor.execute('SELECT * FROM "main"."Sections" ORDER BY JoinedId ASC')
        except:
            raise

        templates = self.cursor.fetchall()

        log.info(f"Found {len(templates)} templates in file.")

        for idx, temp in enumerate(templates):
            joinedId = temp[3]
            self.cursor.execute(
                f"SELECT * FROM Controls WHERE JoinedId = {joinedId} ORDER BY PosX ASC"
            )  # Load controls
            controls = self.cursor.fetchall()

            self.templates.append(Template(temp, controls))
            log.info(f"Loaded template - {idx} / {self.templates[-1].name}")


def getSrcGroupType(proj, nameOrId):
    """Finds information of a given SourceGroup

    Args:
        proj (r1.ProjectFile): Project file to use
        nameOrId (string or int): SourceGroup name or SourceGroupId

    Returns:
        int: Four digit value - first digit is SourceGroup Type, second digit is 0 or 1 if L/R group, third digit is if contains a TOPs group, last digit is if contains a SUBs group
    """
    srcGrpType = 0
    column = ""
    name = ""
    if type(nameOrId) is str:
        column = "Name"
        name = nameOrId
    if type(nameOrId) is int:
        column = "SourceGroupId"
        proj.cursor.execute(
            f'SELECT Name FROM SourceGroups WHERE {column} = "{nameOrId}"'
        )
        name = proj.cursor.fetchone()[0]
    proj.cursor.execute(
        f'SELECT * FROM SourceGroups WHERE {column} = "{nameOrId}" ORDER BY NextSourceGroupId DESC'
    )
    source = proj.cursor.fetchone()
    if source is not None:
        # SourceGroup Type
        srcGrpType += source[r1.SOURCEGROUPS_COL_Type] * 1000

        # Left/Right
        if source[r1.SOURCEGROUPS_COL_NextSourceGroupId] != 0:
            srcGrpType += 100
        # SUB array L/R/C
        elif (
            source[r1.SOURCEGROUPS_COL_Type] is r1.SOURCEGROUPS_TYPE_SUBarray
            and hasSubGroups(proj) > 1
        ):
            srcGrpType += 100 * (hasSubGroups(proj) - 1)

    proj.cursor.execute(
        f'SELECT Name FROM Groups WHERE Name LIKE "{name + " SUBs"}" OR Name LIKE "{name + " TOPs"}"'
    )
    groups = proj.cursor.fetchall()
    if groups is not None and any("TOPs" in group[0] for group in groups):
        srcGrpType += 10

    if groups is not None and any("SUBs" in group[0] for group in groups):
        srcGrpType += 1

    return srcGrpType


class SourceGroup:
    def __init__(self, row):
        (
            self.viewId,
            self.name,
            self.srcId,
            self.nextSrcId,
            self.type,
            self.apEnable,
            self.asId,
            self.cabFamily,
            self.groupId,
            self.groupName,
            self.topGroupId,
            self.topGroupName,
            self.topLeftGroupId,
            self.topLeftGroupName,
            self.topRightGroupId,
            self.topRightGroupName,
            self.subGroupId,
            self.subGroupName,
            self.subLeftGroupId,
            self.subLeftGroupName,
            self.subRightGroupId,
            self.subRightGroupName,
            self.subCGroupId,
            self.subCGroupName,
            self.xover,
        ) = row
        self.channelGroups = []

        # Combine all returned sub groups into single array
        i = 14
        while i >= 0:
            grpId = row[8 + i]
            grpName = row[9 + i]
            if grpId is not None and grpName is not None:
                grpType = int(i / 2) if i > 0 else 0
                # i becomes channel type indicator
                self.channelGroups.append(ChannelGroup(grpId, grpName, grpType))

            i = i - 2
            # Skip final group if subs or tops groups have been found, only use for point sources
            if len(self.channelGroups) and i < 2:
                i = -1
                self.channelGroups = self.channelGroups[::-1]

        log.info(f"Created source group - {self.groupId} / {self.name}")


########## Created in R1, contain individual channels ########
class ChannelGroup:
    def __init__(self, groupId, name, type):
        self.groupId = groupId
        self.name = name
        self.channels = []
        self.type = type

        log.info(f"Created channel group - {self.groupId} / {self.name} / {self.type}")


###### An amplifier channel ########
class Channel:
    def __init__(self, row):
        (
            self.groupId,
            self.name,
            self.targetId,
            self.targetChannel,
            self.preset,
            self.cabId,
        ) = row
        log.info(f"Created channel - {self.name}")


def createNavButtons(proj, templates):
    """Insert navigation buttons into default views

    Args:
        proj (r1.ProjectFile): Project to insert views into
        templates (TemplateFile): Template file to pull Nav Button template from
    """
    proj.cursor.execute(f'SELECT ViewId FROM Views WHERE Type = "{1000}"')

    for vId in (
        row
        for row, in proj.cursor.fetchall()
        if row != proj.masterViewId and row != proj.meterViewId
    ):
        proj.cursor.execute(
            f"UPDATE Controls SET PosY = PosY + {NAV_BUTTON_Y+20} WHERE ViewId = {vId}"
        )
        __insertTemplate(
            proj,
            templates,
            "Nav Button",
            15,
            NAV_BUTTON_Y,
            vId,
            MASTER_WINDOW_TITLE,
            proj.meterViewId + 1,
            -1,
            proj.cursor,
            None,
            None,
            None,
            None,
            None,
        )


def removeNavButtons(proj, masterViewId):
    """Remove navigation buttons from default views

    Args:
        proj (r1.ProjectFile): Project to remove views from
        masterViewId (int): ViewID of master view
    """
    proj.cursor.execute(
        f'SELECT ViewId FROM Controls WHERE "TargetId" = "{masterViewId}" AND "TargetChannel" = -1'
    )

    for vId in (
        row
        for row, in proj.cursor.fetchall()
        if row != proj.masterViewId and row != proj.meterViewId
    ):
        proj.cursor.execute(
            f"UPDATE Controls SET PosY = PosY - {NAV_BUTTON_Y+20} WHERE ViewId = {vId}"
        )

    proj.cursor.execute(
        f'DELETE FROM Controls WHERE "TargetId" = "{masterViewId}" AND "TargetChannel" = -1'
    )
    log.info(f"Deleted {MASTER_WINDOW_TITLE} nav buttons.")


def clean(proj):
    """Removes all AutoR1 groups, views and controls

    Args:
        proj (r1.ProjectFile): Project file to clean
        masterViewId (int): ID of master view created by AutoR1
        meterViewId (int): ID of meter view created by AutoR1

    """
    log.info("Cleaning R1 project.")

    try:
        masterViewId = proj.getViewIdFromName(MASTER_WINDOW_TITLE)

        proj.cursor.execute(f'DELETE FROM Controls WHERE "ViewId" = "{masterViewId}"')
        log.info(f"Deleted {MASTER_WINDOW_TITLE} controls.")

        proj.cursor.execute(f'DELETE FROM Views WHERE "Name" = "{MASTER_WINDOW_TITLE}"')
        log.info(f"Deleted {MASTER_WINDOW_TITLE} view.")

        removeNavButtons(proj, masterViewId)
    except:
        pass

    try:
        meterViewId = proj.getViewIdFromName(METER_WINDOW_TITLE)
        proj.cursor.execute(f'DELETE FROM Controls WHERE "ViewId" = "{meterViewId}"')
        log.info(f"Deleted {METER_WINDOW_TITLE} view controls.")
        proj.cursor.execute(f'DELETE FROM Views WHERE "Name" = "{METER_WINDOW_TITLE}"')
        log.info(f"Deleted {METER_WINDOW_TITLE} view.")
    except:
        pass

    proj.cursor.execute(f"SELECT Name FROM SourceGroups WHERE Type = 3")
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        subArrayName = rtn[0]
        proj.cursor.execute(
            f'  SELECT GroupId FROM Groups WHERE Name = "{subArrayName}" AND ParentId = {proj.pId}'
        )
        pId = proj.cursor.fetchone()
        if pId is not None:
            proj.deleteGroup(pId[0])

    proj.cursor.execute(
        f'SELECT GroupId FROM Groups WHERE Name = "{PARENT_GROUP_TITLE}"'
    )
    group = proj.cursor.fetchone()
    if group is not None:
        pId = group[0]
        proj.deleteGroup(pId)
    log.info(f"Deleted {PARENT_GROUP_TITLE} group.")


def configureApChannels(proj):
    """Creates a master AP group of all channels TOPs with AP enabled.

    Args:
        proj (r1.ProjectFile): Project file to use
    """
    apGroup = []
    for srcGrp in (g for g in proj.sourceGroups if g.apEnable):
        for chGrp in (g for g in srcGrp.channelGroups if g.type == TYPE_TOPS):
            apGroup += chGrp.channels

    if len(apGroup) > 0:
        proj.createGrp(AP_GROUP_TITLE, proj.pId)
        proj.apGroupId = proj.getHighestGroupID()
        for ch in apGroup:
            proj.cursor.execute(
                f"  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags) "
                f'  SELECT "{ch.name}", {proj.apGroupId}, {ch.targetId}, {ch.targetChannel}, 1, 0'
            )


def __insertTemplate(
    proj,
    templates,
    tempName,
    posX,
    posY,
    viewId,
    displayName,
    targetId,
    targetChannel,
    cursor,
    width=None,
    height=None,
    joinedId=None,
    targetProp=None,
    targetRec=None,
):
    if joinedId is not None:
        jId = joinedId
    else:
        jId = proj.jId
        proj.jId = proj.jId + 1

    tempContents = __getTempControlsFromName(templates, tempName)

    for control in tempContents:
        tProp = targetProp
        tRec = targetRec
        tChannel = targetChannel
        tId = targetId
        w = width
        h = height
        dName = control[7]
        tType = control[21]

        if tId is None:
            tId = control[22]

        if tChannel is None:
            tChannel = control[23]

        if w is None:
            w = control[4]

        if height is None:
            h = control[5]

        # If item is a Frame or a button to swap views
        if (control[1] == 12) or (control[1] == 4 and tType == 5):
            if (
                (displayName is not None)
                and (dName != "Fallback")
                and (dName != "Regular")
            ):
                dName = displayName

        if dName is None:
            dName = ""

        if tProp is None:
            tProp = control[24]
        if tRec is None:
            tRec = control[25]

        for p in r1.DEV_PROP_TYPES:
            if tProp == p:
                if tChannel > -1:
                    tChannel = 0  # Dante + digital info require channel ID to be 0
                    break

        proj.cursor.execute(
            f'INSERT INTO Controls ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(control[1])}", "{str(control[2]+posX)}", "{str(control[3]+posY)}", "{str(w)}", "{str(h)}", "{str(viewId)}", "{dName}", "{str(jId)}", "{str(control[10])}", "{str(control[11])}", "{str(control[12])}", "{str(control[13])}", "{str(control[14])}", "{str(control[15])}", "{str(control[16])}", "{str(control[17])}", "{str(control[18])}", "{str(control[19])}", "{str(control[20])}", "{str(control[21])}", "{str(tId)}", "{str(tChannel)}", "{str(tProp)}", {tRec}, NULL, NULL, "{str(control[28])}", "{str(control[29])}", "{str(control[30])}", "{str(control[31])}", " ")'
        )

    return __getTempSize(templates, tempName)


def __getTempControlsFromName(templates, tempName):
    for t in templates.templates:
        if t.name == tempName:
            return t.controls
    return -1


def __getTempSize(templates, tempName):
    templates.cursor.execute(
        f'SELECT JoinedId FROM "main"."Sections" WHERE Name = "{tempName}"'
    )
    rtn = templates.cursor.fetchone()
    if rtn is not None:
        jId = rtn[0]
    else:
        log.info(f"{tempName} template not found.")
        return -1

    templates.cursor.execute(
        f"SELECT PosX, PosY, Width, Height FROM Controls WHERE JoinedId = {jId}"
    )
    rtn = templates.cursor.fetchall()
    if rtn is not None:
        maxWidth, maxHeight = 0, 0
        for row in rtn:
            PosX, PosY, Width, Height = row
            if PosX + Width > maxWidth:
                maxWidth = PosX + Width
            if PosY + Height > maxHeight:
                maxHeight = PosY + Height
        return [maxWidth, maxHeight]
    else:
        log.info(f"{tempName} template controls not found.")
        return -1


def createMeterView(proj, templates):
    # Get width + height of title to offset starting x + y
    _, titleH = __getTempSize(templates, "Meters Title")
    meterGrpW, meterGrpH = __getTempSize(templates, "Meters Group")
    meterW, meterH = __getTempSize(templates, "Meter")

    proj.meterJoinedIDs = []

    # Get height of metering frame to get x and y spacing for each meter
    spacingX = max(meterW, meterGrpW) + METER_SPACING_X
    spacingY = meterH + METER_SPACING_Y

    ####### CREATE VIEW #######
    HRes = (spacingX * getChannelMeterGroupTotal(proj)[0]) + METER_SPACING_X
    VRes = titleH + meterGrpH + (spacingY * getChannelMeterGroupTotal(proj)[1]) + 100
    proj.cursor.execute(
        f'INSERT INTO Views("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (1000,"{METER_WINDOW_TITLE}",NULL,4,NULL,-1,{HRes},{VRes},100,NULL,NULL,NULL,NULL);'
    )
    proj.cursor.execute(f"SELECT max(ViewId) FROM Views")
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        proj.meterViewId = rtn[0]

    ###### INSERT HEADER ######
    posX = METER_VIEW_STARTX
    posY = METER_VIEW_STARTY
    __insertTemplate(
        proj,
        templates,
        "Nav Button",
        NAV_BUTTON_X,
        posY + NAV_BUTTON_Y,
        proj.meterViewId,
        MASTER_WINDOW_TITLE,
        proj.meterViewId + 1,
        -1,
        proj.cursor,
        None,
        None,
        None,
        None,
        None,
    )
    posY += (
        __insertTemplate(
            proj,
            templates,
            "Meters Title",
            posX,
            posY,
            proj.meterViewId,
            None,
            None,
            None,
            proj.cursor,
            None,
            None,
            None,
            None,
            None,
        )[1]
        + METER_SPACING_Y
    )
    startY = posY

    for srcGrp in proj.sourceGroups:
        for idx, chGrp in enumerate(srcGrp.channelGroups):
            # Skip TOPs and SUBs group if L/R groups are present
            if (
                chGrp.type == TYPE_SUBS and srcGrp.type == r1.SOURCEGROUPS_TYPE_SUBarray
            ) or (
                chGrp.type <= TYPE_SUBS
                and len(srcGrp.channelGroups) > 2
                and (idx == 0 or idx == 3)
            ):
                continue

            dim = __insertTemplate(
                proj,
                templates,
                "Meters Group",
                posX,
                posY,
                proj.meterViewId,
                chGrp.name,
                chGrp.groupId,
                None,
                proj.cursor,
                None,
                None,
                None,
                None,
                None,
            )
            posY += dim[1] + 10

            for ch in chGrp.channels:
                __insertTemplate(
                    proj,
                    templates,
                    "Meter",
                    posX,
                    posY,
                    proj.meterViewId,
                    ch.name,
                    ch.targetId,
                    ch.targetChannel,
                    proj.cursor,
                    None,
                    None,
                    proj.jId,
                    None,
                    None,
                )
                posY += spacingY

            posX += spacingX
            posY = startY
            proj.meterJoinedIDs.append(proj.jId)
            proj.jId = proj.jId + 1


def getChannelMasterGroupTotal(proj):
    i = 0
    for srcGrp in proj.sourceGroups:
        for chGrp in srcGrp.channelGroups:
            if (
                chGrp.type == TYPE_SUBS
                or chGrp.type == TYPE_TOPS
                or chGrp.type == TYPE_POINT
            ):
                i += 1
    return i


def getChannelMeterGroupTotal(proj):
    i = 0
    j = 0
    for srcGrp in proj.sourceGroups:
        skip = 0
        for chGrp in srcGrp.channelGroups:
            if skip:
                skip = 0
                continue

            if chGrp.type == TYPE_SUBS_R or chGrp.type == TYPE_TOPS_R:
                skip = 1
            i += 1
            j = max(j, len(chGrp.channels))

    return [i, j]


def __getSubArrayGroup(proj):
    subGroups = []
    str = ["L", "R", "C"]
    for s in str:
        proj.cursor.execute(
            f" WITH RECURSIVE "
            f"   devs(GroupId, Name, ParentId, TargetId, TargetChannel, Type) AS ( "
            f"      SELECT GroupId, Name, ParentId, TargetId, TargetChannel, Type FROM Groups WHERE Name = (SELECT Name FROM SourceGroups WHERE Type = 3) "
            f"      UNION "
            f"      SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type FROM Groups, devs WHERE Groups.ParentId = devs.GroupId "
            f"   ) "
            f" SELECT GroupId, devs.Name, TargetId, TargetChannel, CabinetsAdditionalData.Name, Cabinets.CabinetId FROM devs "
            f" JOIN Cabinets "
            f" ON devs.TargetId = Cabinets.DeviceId "
            f" AND devs.TargetChannel = Cabinets.AmplifierChannel "
            f" JOIN CabinetsAdditionalData "
            f" ON Cabinets.CabinetId = CabinetsAdditionalData.CabinetId "
            f" WHERE Linked = 0 "
            f" /* Sub arrays always end with either L/C/R, two numbers, a dash and a further two numbers */"
            f' AND devs.Name LIKE "% {s}__%" '
        )
        rtn = proj.cursor.fetchall()
        if rtn is not None and len(rtn):
            subGroups.append(rtn)
    return subGroups


def createSubLRCGroups(proj):
    """Creates discrete left, right and centre groups for SUB array

    Args:
        proj (r1.ProjectFile): Project file to create groups in
    """
    proj.cursor.execute(
        f"SELECT Name FROM SourceGroups WHERE Type = {r1.SRC_TYPE_SUBARRAY}"
    )
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        name = rtn[0]
        proj.createGrp(name, proj.pId)
        mId = proj.getHighestGroupID()

        proj.createGrp(name + " SUBs", mId)
        mId = proj.getHighestGroupID()

        str = [" SUBs L", " SUBs R", " SUBs C"]
        subArrayGroups = __getSubArrayGroup(proj)
        for idx, subArrayGroup in enumerate(subArrayGroups):
            proj.createGrp(name + str[idx], mId)
            pId = proj.getHighestGroupID()

            for subDevs in subArrayGroup:
                proj.createGrp(subDevs[1], pId, subDevs[2], subDevs[3], 1, 0)


def addSubCtoSubL(proj):
    pId = -1
    for srcGrp in proj.sourceGroups:
        for chGrp in srcGrp.channelGroups:
            if chGrp.type == TYPE_SUBS_L:
                pId = chGrp.groupId

    for srcGrp in proj.sourceGroups:
        for chGrp in srcGrp.channelGroups:
            if chGrp.type == TYPE_SUBS_C:
                for channel in chGrp.channels:
                    proj.createGrp(
                        channel.name, pId, channel.targetId, channel.targetChannel, 1, 0
                    )


def hasSubGroups(proj):
    proj.cursor.execute(
        f"SELECT Name FROM SourceGroups WHERE Type = {r1.SRC_TYPE_SUBARRAY}"
    )
    rtn = proj.cursor.fetchone()
    groupCount = 0
    if rtn is not None:
        name = rtn[0]

        str = [" SUBs L", " SUBs R", " SUBs C"]
        for s in str:
            q = f'SELECT * FROM Groups WHERE Name = "{name + s}"'
            proj.cursor.execute(q)
            rtn = proj.cursor.fetchone()
            if rtn is not None:
                groupCount += 1
    return groupCount


def getApStatus(proj):
    """Find if any SourceGroups are using AP

    Args:
        proj (r1.ProjectFile): Project file to check

    Raises:
        RuntimeException: If initial SourceGroup discovery has not been performed
    Returns:
        int: 1 if any AP enabled SourceGroup found otherwise 0
    """
    if len(proj.sourceGroups) == 0 or proj.sourceGroups is None:
        raise RuntimeError("SourceGroups not loaded")
    for src in proj.sourceGroups:
        if src.apEnable:
            return 1
    return 0


def getSrcGrpInfo(proj):
    """Discovers all SourceGroups, Groups and channels

    Args:
        proj (r1.ProjectFile): Proj file to perform discovery on
    """
    proj.cursor.execute(f"PRAGMA case_sensitive_like=ON;")

    # Discover all SourceGroups, related R1 Groups and attributes
    proj.cursor.execute(
        f" SELECT Views.ViewId, Views.Name, SourceGroups.SourceGroupId, NextSourceGroupId, SourceGroups.Type, ArrayProcessingEnable,  "
        f" ArraySightId, System, masterGroup.GroupId as MasterGroupId, masterGroup.Name as MasterGroupName, topsGroup.GroupId as TopGroupId, topsGroup.Name as TopGroupName,  "
        f" topsLGroup.GroupId as TopLeftGroupId, topsLGroup.Name as TopLeftGroupName, topsRGroup.GroupId as TopRightGroupId, topsRGroup.Name as TopRightGroupName,  "
        f" subsGroup.GroupId as SubGroupId, subsGroup.Name as SubGroupName, subsLGroup.GroupId as SubLeftGroupId, subsLGroup.Name as SubLeftGroupName, subsRGroup.GroupId as "
        f" SubRightGroupId, subsRGroup.Name as SubRightGroupName, subsCGroup.GroupId as SubCGroupId, subsCGroup.Name as SubCGroupName, i.DisplayName as xover "
        f" FROM SourceGroups "
        f" /* Combine additional source group data */ "
        f" JOIN SourceGroupsAdditionalData  "
        f" ON SourceGroups.SourceGroupId = SourceGroupsAdditionalData.SourceGroupId "
        f" /* Combine view info */ "
        f" JOIN Views "
        f" ON Views.Name = SourceGroups.Name "
        f" /* Combine R1 groups to Source Groups - We only have the name to go on here */ "
        f" JOIN Groups masterGroup "
        f" ON SourceGroups.name = masterGroup.Name "
        f" /* Fetch TOPs groups which may or may not have L/R subgroups */ "
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs") topsGroup '
        f" ON topsGroup.ParentId = masterGroup.GroupId "
        f" /* Fetch L/R TOP groups which will be under the main TOPs groups */ "
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs L" ) topsLGroup '
        f" ON topsLGroup.ParentId  = topsGroup.GroupId "
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs R" ) topsRGroup '
        f" ON topsRGroup.ParentId  = topsGroup.GroupId "
        f" /* Fetch the SUBs groups */ "
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs") subsGroup '
        f" ON subsGroup.ParentId  = masterGroup.GroupId "
        f" /* Fetch L/R/C SUB groups we created earlier */ "
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs L" ) subsLGroup '
        f" ON subsLGroup.ParentId  = subsGroup.GroupId "
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs R" ) subsRGroup '
        f" ON subsRGroup.ParentId  = subsGroup.GroupId "
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs C" ) subsCGroup '
        f" /* Fetch crossover info for subs */ "
        f" ON subsCGroup.ParentId  = subsGroup.GroupId "
        f' LEFT OUTER JOIN (SELECT * FROM Controls WHERE DisplayName = "100Hz" OR DisplayName = "Infra") i '
        f" ON i.ViewId  = Views.ViewId "
        f" /* Skip unused channels group */ "
        f' WHERE SourceGroups.name != "Unused channels" '
        f" /* Skip second half of stereo pairs */"
        f" AND OrderIndex != -1 "
        f" /* Skip duplicate groups in Master group _only for arrays_. We want L/R groups for arrays. */ "
        f' AND (SourceGroups.Type == 1 AND masterGroup.ParentId != (SELECT GroupId FROM Groups WHERE Name == "Master"))  '
        f" /* Skip existing Sub array group in Master */ "
        f' OR (SourceGroups.Type == 3 AND masterGroup.ParentId != (SELECT GroupId FROM Groups WHERE Name == "Master"))  '
        f" /* Get point source groups from Master group */ "
        f' OR (SourceGroups.Type == 2 AND masterGroup.ParentId == (SELECT GroupId FROM Groups WHERE Name == "Master")) '
        f" /* Device only groups */"
        f" OR SourceGroups.Type == 4 "
        f"  ORDER BY SourceGroups.OrderIndex ASC "
    )

    rtn = proj.cursor.fetchall()

    for row in rtn:
        proj.sourceGroups.append(SourceGroup(row))

    # Discover all channels of previously discovered groups
    for idx, srcGrp in enumerate(proj.sourceGroups):
        for idy, devGrp in enumerate(srcGrp.channelGroups):
            proj.cursor.execute(
                f"  WITH RECURSIVE devs(GroupId, Name, ParentId, TargetId, TargetChannel, Type, Flags) AS ( "
                f"       SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type, Groups.Flags FROM Groups WHERE Groups.ParentId = {devGrp.groupId} "
                f"       UNION "
                f"       SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type, Groups.Flags FROM Groups, devs WHERE Groups.ParentId = devs.GroupId "
                f"   ) "
                f"    "
                f"  SELECT GroupId, devs.Name, TargetId, TargetChannel, CabinetsAdditionalData.Name, Cabinets.CabinetId FROM devs "
                f"  JOIN Cabinets "
                f"  ON devs.TargetId = Cabinets.DeviceId "
                f"  AND devs.TargetChannel = Cabinets.AmplifierChannel "
                f"  JOIN CabinetsAdditionalData "
                f"  ON Cabinets.CabinetId = CabinetsAdditionalData.CabinetId "
                f"  AND Linked = 0 "
                f"  WHERE devs.type = 1 "
            )
            rtn = proj.cursor.fetchall()

            for row in rtn:
                proj.sourceGroups[idx].channelGroups[idy].channels.append(Channel(row))
            log.info(f"Assigned {len(rtn)} channels to {devGrp.name}")


def getMainGroupCount(proj):
    groups = []
    for srcGrp in proj.sourceGroups:
        for chGrp in srcGrp.channelGroups:
            if (
                chGrp.type > TYPE_SUBS
                or chGrp.type == TYPE_TOPS_L
                or chGrp.type == TYPE_TOPS_R
            ):  # TOP or SUB L/R/C Group
                continue
            else:
                groups.append(chGrp)
    return len(groups)


def createMasterView(proj, templates):
    # Get width + height of templates used
    masterTempWidth, masterTempHeight = __getTempSize(templates, "Master Main")
    arraySightTempWidth, _ = __getTempSize(templates, "Master ArraySight")
    _, masterTitleTempHeight = __getTempSize(templates, "Master Title")
    meterTempWidth, meterTempHeight = __getTempSize(templates, "Group LR AP CPL2")
    meterTempBuffer = 200

    # For testing
    proj.masterJoinedIDs = []

    ####### CREATE VIEW #######
    HRes = (
        masterTempWidth
        + arraySightTempWidth
        + ((METER_SPACING_X + meterTempWidth) * getChannelMasterGroupTotal(proj))
        + meterTempBuffer
    )
    VRes = masterTitleTempHeight + max([meterTempHeight, masterTempHeight]) + 60
    proj.cursor.execute(
        f'INSERT INTO Views("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (1000,"{MASTER_WINDOW_TITLE}",NULL,4,NULL,-1,{HRes},{VRes},100,NULL,NULL,NULL,NULL);'
    )
    proj.cursor.execute(f"SELECT max(ViewId) FROM Views")
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        proj.masterViewId = rtn[0]

    posX, posY = 10, 10
    __insertTemplate(
        proj,
        templates,
        "Nav Button",
        NAV_BUTTON_X,
        posY + NAV_BUTTON_Y,
        proj.masterViewId,
        METER_WINDOW_TITLE,
        proj.meterViewId,
        -1,
        proj.cursor,
    )
    posY += (
        __insertTemplate(
            proj,
            templates,
            "Master Title",
            posX,
            posY,
            proj.masterViewId,
            None,
            None,
            None,
            proj.cursor,
        )[1]
        + METER_SPACING_Y
    )
    posX += (
        __insertTemplate(
            proj,
            templates,
            "Master Main",
            posX,
            posY,
            proj.masterViewId,
            None,
            proj.mId,
            None,
            proj.cursor,
        )[0]
        + (METER_SPACING_X / 2)
    )
    arraySightTempX, arraySightTempY = __insertTemplate(
        proj,
        templates,
        "Master ArraySight",
        posX,
        posY,
        proj.masterViewId,
        None,
        0,
        None,
        proj.cursor,
    )

    if getApStatus(proj):
        posX += (
            __insertTemplate(
                proj,
                templates,
                "THC",
                posX,
                posY + arraySightTempY + (METER_SPACING_Y / 2),
                proj.masterViewId,
                None,
                proj.apGroupId,
                None,
                proj.cursor,
            )[0]
            + (METER_SPACING_X * 4)
        )
    else:
        posX += arraySightTempX + (METER_SPACING_X * 4)

    for idy, srcGrp in enumerate(proj.sourceGroups):
        for idx, chGrp in enumerate(srcGrp.channelGroups):

            if chGrp.type in [
                TYPE_SUBS_L,
                TYPE_SUBS_R,
                TYPE_SUBS_C,
                TYPE_TOPS_L,
                TYPE_TOPS_R,
            ]:  # TOP or SUB L/R/C Group
                continue

            templateName = "Group"
            if len(srcGrp.channelGroups) >= 3:  # Stereo groups
                lrGroups = [
                    srcGrp.channelGroups[idx + 1],
                    srcGrp.channelGroups[idx + 2],
                ]
                templateName += " LR"
            if srcGrp.apEnable:
                templateName += " AP"
            if srcGrp.cabFamily in ["GSL", "KSL"]:
                templateName += " CPL2"

            tempContents = __getTempControlsFromName(templates, templateName)
            metCh = 0  # Current channel of stereo pair
            mutCh = 0

            for control in tempContents:
                (
                    _,
                    controlType,
                    _,
                    _,
                    _,
                    _,
                    _,
                    displayName,
                    _,
                    _,
                    _,
                    _,
                    _,
                    _,
                    _,
                    _,
                    _,
                    _,
                    _,
                    flag,
                    _,
                    _,
                    _,
                    targetChannel,
                    targetProperty,
                    *_,
                ) = control
                targetId = chGrp.groupId

                # Update Infra/100hz button text
                if (
                    (chGrp.type < TYPE_TOPS or chGrp.type > TYPE_TOPS_R)
                    and displayName == "CUT"
                    and srcGrp.xover is not None
                ):
                    displayName = srcGrp.xover
                    log.info(f"{chGrp.name} - Enabling {srcGrp.xover}")

                # Meters, these require a TargetChannel
                if controlType == r1.CTRL_METER:
                    if "Group LR" in templateName:
                        targetId, targetChannel = (
                            lrGroups[metCh].channels[0].targetId,
                            lrGroups[metCh].channels[0].targetChannel,
                        )
                        metCh += 1
                    else:
                        targetId = chGrp.channels[0].targetId
                        targetChannel = chGrp.channels[0].targetChannel

                elif controlType == r1.CTRL_BUTTON:
                    if "Group LR" in templateName and (
                        targetProperty == "Config_Mute"
                    ):  # Mute
                        targetId = lrGroups[mutCh].groupId
                        mutCh += 1

                    if displayName == "View EQ":
                        targetId = srcGrp.viewId + 1

                elif controlType == r1.CTRL_FRAME:
                    if displayName:
                        displayName = chGrp.name
                elif controlType == r1.CTRL_INPUT:
                    if targetProperty == "ChStatus_MsDelay" and (
                        "fill" in chGrp.name.lower() or chGrp.type > TYPE_TOPS_L
                    ):
                        flag = 14
                        log.info(f"{chGrp.name} - Setting relative delay")

                query = f'INSERT INTO Controls ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", \
                    "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", \
                        "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(controlType)}", \
                            "{str(control[2]+posX)}", "{str(control[3]+posY)}", "{str(control[4])}", "{str(control[5])}", "{str(proj.masterViewId)}", "{displayName if displayName else ""}", "{str(proj.jId)}", \
                                "{str(control[10])}", "{str(control[11])}", "{str(control[12])}", "{str(control[13])}", "{str(control[14])}", "{str(control[15])}", "{str(control[16])}", \
                                    "{str(control[17])}", "{str(control[18])}", "{str(flag)}", "{str(control[20])}", "{str(control[21])}", "{str(targetId)}", {str(targetChannel)}, \
                                        "{str(targetProperty)}", {control[25]}, NULL, NULL, "{str(control[28])}", "{str(control[29])}", "{str(control[30])}", "{str(control[31])}", "  ")'

                # Remove CPL if not supported by channel / if channel doesn't have infra, cut button becomes infra
                if (
                    controlType == r1.CTRL_INPUT
                    and targetProperty == "Config_Filter3"
                    and (chGrp.type < TYPE_TOPS or chGrp.type > TYPE_TOPS_R)
                    and srcGrp.xover is not None
                ):
                    log.info(f"{chGrp.name} - Skipping CPL")
                else:
                    proj.cursor.execute(query)

            proj.masterJoinedIDs.append((proj.jId, idy))

            __insertTemplate(
                proj,
                templates,
                "Nav Button",
                posX,
                posY,
                proj.masterViewId,
                chGrp.name,
                srcGrp.viewId,
                -1,
                proj.cursor,
            )

            posX += meterTempWidth + METER_SPACING_X

            proj.jId = proj.jId + 1

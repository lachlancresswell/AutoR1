import sqlite3
import logging
from abc import ABCMeta
import r1py as r1
import sys

log = logging.getLogger(__name__)
log.addHandler(logging.StreamHandler(sys.stdout))

NAV_BUTTON_X = 230
NAV_BUTTON_Y = 15

METER_VIEW_STARTX = 15
METER_VIEW_STARTY = 15
METER_SPACING_X = 15
METER_SPACING_Y = 15

PARENT_GROUP_TITLE = 'AUTO'
AP_GROUP_TITLE = 'AP'
METER_WINDOW_TITLE = "AUTO - Meters"
MASTER_WINDOW_TITLE = 'AUTO - Master'
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
            self.id = sections[0]
            self.name = sections[1]
            self.parentId = sections[2]
            self.joinedId = sections[3]

        if controls is not None:
            self.controls = controls


### Load template file + templates within from .r2t file ###
# Sections table contains template overview info
class TemplateFile(r1.sqlDbFile):
    def __init__(self, f):
        super().__init__(f)  # Inherit from parent class
        self.templates = []

        try:
            self.cursor.execute(
                'SELECT * FROM "main"."Sections" ORDER BY JoinedId ASC')
        except:
            raise

        templates = self.cursor.fetchall()

        log.info(f'Found {len(templates)} templates in file.')

        for idx, temp in enumerate(templates):
            joinedId = temp[3]
            self.cursor.execute(
                f'SELECT * FROM Controls WHERE JoinedId = {joinedId}')  # Load controls
            controls = self.cursor.fetchall()

            self.templates.append(Template(temp, controls))
            log.info(
                f'Loaded template - {idx} / {self.templates[-1].name}')


class SourceGroup:
    def __init__(self, row):
        self.viewId = row[0]
        self.name = row[1]
        self.srcId = row[2]
        self.nextSrcId = row[3]
        # Group is stereo if nextSrcId exists
        self.type = row[4]*10 if self.nextSrcId <= 0 else 40
        self.apEnable = row[5] if row[5] else 0
        self.asId = row[6]
        self.cabFamily = row[7]
        self.groupId = row[8]
        self.groupName = row[9]
        self.topGroupId = row[10]
        self.topGroupName = row[11]
        self.topLeftGroupId = row[12]
        self.topLeftGroupName = row[13]
        self.topRightGroupId = row[14]
        self.topRightGroupName = row[15]
        self.subGroupId = row[16]
        self.subGroupName = row[17]
        self.subLeftGroupId = row[18]
        self.subLeftGroupName = row[19]
        self.subRightGroupId = row[20]
        self.subRightGroupName = row[21]
        self.subCGroupId = row[22]
        self.subCGroupName = row[23]
        self.channelGroups = []
        self.LR = 1 if (row[12] is not None or row[14] is not None or row[18]
                        is not None or row[20] is not None or row[22] is not None) else 0
        self.xover = row[24]

        # Combine all returned sub groups into single array
        i = 14
        while(i >= 0):
            grpId = row[8+i]
            grpName = row[9+i]
            if(grpId is not None and grpName is not None):
                grpType = int(i/2) if i > 0 else 0
                # i becomes channel type indicator
                self.channelGroups.append(
                    ChannelGroup(grpId, grpName, grpType))

            i = i-2
            # Skip final group if subs or tops groups have been found, only use for point sources
            if len(self.channelGroups) and i <= 2:
                i = -1

        log.info(f'Created source group - {self.groupId} / {self.name}')


########## Created in R1, contain individual channels ########
class ChannelGroup:
    def __init__(self, groupId, name, type):
        self.groupId = groupId
        self.name = name
        self.channels = []
        self.type = type

        log.info(
            f'Created channel group - {self.groupId} / {self.name} / {self.type}')


###### An amplifier channel ########
class Channel:
    def __init__(self, row):
        self.groupId = row[0]
        self.name = row[1]
        self.targetId = row[2]
        self.targetChannel = row[3]
        self.preset = row[4]
        self.cabId = row[5]

        log.info(f'Created channel - {self.name}')


def createNavButtons(proj, templates):
    """Insert navigation buttons into default views

    Args:
        proj (r1.ProjectFile): Project to insert views into
        templates (TemplateFile): Template file to pull Nav Button template from
    """
    proj.cursor.execute(f'SELECT * FROM Views WHERE Type = "{1000}"')
    rtn = proj.cursor.fetchall()

    for row in rtn:
        vId = row[0]
        if vId != proj.masterViewId and vId != proj.meterViewId:
            proj.cursor.execute(
                f'UPDATE Controls SET PosY = PosY + {NAV_BUTTON_Y+20} WHERE ViewId = {vId}')
            __insertTemplate(proj, templates, 'Nav Button', 15, NAV_BUTTON_Y, vId, MASTER_WINDOW_TITLE,
                             proj.meterViewId+1, -1, proj.cursor, None, None, None, None, None)


def clean(proj):
    """Removes all AutoR1 groups, views and controls

    Args:
        proj (r1.ProjectFile): Project file to clean
        masterViewId (int): ID of master view created by AutoR1
        meterViewId (int): ID of meter view created by AutoR1

    """
    log.info('Cleaning R1 project.')

    masterViewId = proj.getViewIdFromName(MASTER_WINDOW_TITLE)
    meterViewId = proj.getViewIdFromName(METER_WINDOW_TITLE)

    proj.cursor.execute(
        f'DELETE FROM Controls WHERE "ViewId" = "{masterViewId}"')
    log.info(f'Deleted {MASTER_WINDOW_TITLE} view.')

    proj.cursor.execute(
        f'DELETE FROM Controls WHERE "ViewId" = "{meterViewId}"')
    log.info(f'Deleted {METER_WINDOW_TITLE} view controls.')

    proj.cursor.execute(
        f'DELETE FROM Controls WHERE "TargetId" = "{masterViewId}" AND "TargetChannel" = -1')
    log.info(f'Deleted {MASTER_WINDOW_TITLE} nav buttons.')

    proj.cursor.execute(
        f'DELETE FROM Views WHERE "Name" = "{MASTER_WINDOW_TITLE}"')
    log.info(f'Deleted {MASTER_WINDOW_TITLE} view.')

    proj.cursor.execute(
        f'DELETE FROM Views WHERE "Name" = "{METER_WINDOW_TITLE}"')
    log.info(f'Deleted {METER_WINDOW_TITLE} view.')

    proj.cursor.execute(f'SELECT Name FROM SourceGroups WHERE Type = 3')
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        subArrayName = rtn[0]
        proj.cursor.execute(
            f'  SELECT GroupId FROM Groups WHERE Name = "{subArrayName}" AND ParentId = {proj.pId}')
        pId = proj.cursor.fetchone()[0]
        proj.deleteGroup(pId)

    proj.cursor.execute(
        f'SELECT GroupId FROM Groups WHERE Name = "{PARENT_GROUP_TITLE}"')
    group = proj.cursor.fetchone()
    if group is not None:
        pId = group[0]
        proj.deleteGroup(pId)
    log.info(f'Deleted {PARENT_GROUP_TITLE} group.')


def configureApChannels(proj):
    apGroup = []
    for srcGrp in proj.sourceGroups:
        if srcGrp.apEnable:
            for chGrp in srcGrp.channelGroups:
                if chGrp.type == 1 or chGrp.type == 4:
                    apGroup += chGrp.channels

    proj.cursor.execute(
        f'  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags) '
        f'  SELECT "{AP_GROUP_TITLE}", {proj.pId}, 0, -1, 0, 0')
    proj.cursor.execute(f'SELECT max(GroupId) FROM Groups')
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        proj.apGroupId = rtn[0]
        for ch in apGroup:
            proj.cursor.execute(
                f'  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags) '
                f'  SELECT "{ch.name}", {proj.apGroupId}, {ch.targetId}, {ch.targetChannel}, 1, 0')


def __insertTemplate(proj, templates, tempName, posX, posY, viewId, displayName, targetId, targetChannel, cursor, width, height, joinedId, targetProp, targetRec):
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
            if (displayName is not None) and (dName != 'Fallback') and (dName != 'Regular'):
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
            f'INSERT INTO Controls ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(control[1])}", "{str(control[2]+posX)}", "{str(control[3]+posY)}", "{str(w)}", "{str(h)}", "{str(viewId)}", "{dName}", "{str(jId)}", "{str(control[10])}", "{str(control[11])}", "{str(control[12])}", "{str(control[13])}", "{str(control[14])}", "{str(control[15])}", "{str(control[16])}", "{str(control[17])}", "{str(control[18])}", "{str(control[19])}", "{str(control[20])}", "{str(control[21])}", "{str(tId)}", "{str(tChannel)}", "{str(tProp)}", {tRec}, NULL, NULL, "{str(control[28])}", "{str(control[29])}", "{str(control[30])}", "{str(control[31])}", " ")')

    return __getTempSize(templates, tempName)


def __getTempControlsFromName(templates, tempName):
    for t in templates.templates:
        if t.name == tempName:
            return t.controls
    return -1


def __getTempSize(templates, tempName):
    templates.cursor.execute(
        f'SELECT JoinedId FROM "main"."Sections" WHERE Name = "{tempName}"')
    rtn = templates.cursor.fetchone()
    if rtn is not None:
        jId = rtn[0]
    else:
        log.info(f'{tempName} template not found.')
        return -1

    templates.cursor.execute(
        f'SELECT PosX, PosY, Width, Height FROM Controls WHERE JoinedId = {jId}')
    rtn = templates.cursor.fetchall()
    if rtn is not None:
        w = 0
        h = 0
        for row in rtn:
            if row[0]+row[2] > w:
                w = row[0]+row[2]
            if row[1]+row[3] > h:
                h = row[1]+row[3]
        return [w, h]
    else:
        log.info(f'{tempName} template controls not found.')
        return -1


def createMeterView(proj, templates):
    # Get width + height of title to offset starting x + y
    rtn = __getTempSize(templates, "Meters Title")
    titleW = rtn[0]
    titleH = rtn[1]
    rtn = __getTempSize(templates, "Meters Group")
    meterGrpW = rtn[0]
    meterGrpH = rtn[1]
    rtn = __getTempSize(templates, "Meter")
    meterW = rtn[0]
    meterH = rtn[1]

    # Get height of metering frame to get x and y spacing for each meter
    spacingX = max(meterW, meterGrpW)+METER_SPACING_X
    spacingY = meterH+METER_SPACING_Y

    ####### CREATE VIEW #######
    HRes = (spacingX*getChannelMeterGroupTotal(proj)[0])+METER_SPACING_X
    VRes = titleH+meterGrpH+(spacingY*getChannelMeterGroupTotal(proj)[1])+100
    proj.cursor.execute(
        f'INSERT INTO Views("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (1000,"{METER_WINDOW_TITLE}",NULL,4,NULL,-1,{HRes},{VRes},100,NULL,NULL,NULL,NULL);')
    proj.cursor.execute(f'SELECT max(ViewId) FROM Views')
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        proj.meterViewId = rtn[0]

    ###### INSERT HEADER ######
    posX = METER_VIEW_STARTX
    posY = METER_VIEW_STARTY
    __insertTemplate(proj, templates, 'Nav Button', NAV_BUTTON_X, posY+NAV_BUTTON_Y, proj.meterViewId,
                     MASTER_WINDOW_TITLE, proj.meterViewId+1, -1, proj.cursor, None, None, None, None, None)
    posY += __insertTemplate(proj, templates, 'Meters Title', posX, posY, proj.meterViewId,
                             None, None, None, proj.cursor, None, None, None, None, None)[1]+METER_SPACING_Y
    startY = posY

    for srcGrp in proj.sourceGroups:
        subs = 0
        tops = 0
        for chGrp in srcGrp.channelGroups:
            if chGrp.type == 4 and subs:  # Skip sub parent group if SUBs L/R/C group exists
                continue
            if chGrp.type == 1 and tops:  # Skip top parent group if Tops L/R group exists
                continue
            dim = __insertTemplate(proj, templates, 'Meters Group', posX, posY, proj.meterViewId,
                                   chGrp.name, chGrp.groupId, None, proj.cursor, None, None, None, None, None)
            posY += dim[1]+10

            for ch in chGrp.channels:
                __insertTemplate(proj, templates, "Meter", posX, posY, proj.meterViewId, ch.name,
                                 ch.targetId, ch.targetChannel, proj.cursor, None, None, proj.jId, None, None)
                posY += spacingY

            if chGrp.type > 4:  # SUB L/R/C group
                subs = 1
            elif chGrp.type > 1 and chGrp.type < 4:  # TOP L/R group
                tops = 1

            posX += spacingX
            posY = startY
            proj.jId = proj.jId + 1


def getChannelMasterGroupTotal(proj):
    i = 0
    for srcGrp in proj.sourceGroups:
        for chGrp in srcGrp.channelGroups:
            if chGrp.type == TYPE_SUBS or chGrp.type == TYPE_TOPS or chGrp.type == TYPE_POINT:
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
            f' WITH RECURSIVE '
            f'   devs(GroupId, Name, ParentId, TargetId, TargetChannel, Type) AS ( '
            f'      SELECT GroupId, Name, ParentId, TargetId, TargetChannel, Type FROM Groups WHERE Name = (SELECT Name FROM SourceGroups WHERE Type = 3) '
            f'      UNION '
            f'      SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type FROM Groups, devs WHERE Groups.ParentId = devs.GroupId '
            f'   ) '
            f' SELECT GroupId, devs.Name, TargetId, TargetChannel, CabinetsAdditionalData.Name, Cabinets.CabinetId FROM devs '
            f' JOIN Cabinets '
            f' ON devs.TargetId = Cabinets.DeviceId '
            f' AND devs.TargetChannel = Cabinets.AmplifierChannel '
            f' JOIN CabinetsAdditionalData '
            f' ON Cabinets.CabinetId = CabinetsAdditionalData.CabinetId '
            f' WHERE Linked = 0 '
            f' /* Sub arrays always end with either L/C/R, two numbers, a dash and a further two numbers */'
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
        f'SELECT Name FROM SourceGroups WHERE Type = {r1.SRC_TYPE_SUBARRAY}')
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        name = rtn[0]
        proj.createGrp(name, proj.pId)
        proj.cursor.execute(f'SELECT max(GroupId) FROM Groups')
        rtn = proj.cursor.fetchone()
        if rtn is not None:
            mId = rtn[0]
            proj.createGrp(name + " SUBs", mId)
            proj.cursor.execute(f'SELECT max(GroupId) FROM Groups')
            rtn = proj.cursor.fetchone()
            if rtn is not None:
                mId = rtn[0]
        str = [" SUBs L", " SUBs R", " SUBs C"]
        subArrayGroups = __getSubArrayGroup(proj)
        for idx, subArrayGroup in enumerate(subArrayGroups):
            proj.createGrp(name+str[idx], mId)

            proj.cursor.execute(f'SELECT max(GroupId) FROM Groups')
            rtn = proj.cursor.fetchone()
            if rtn is not None:
                pId = rtn[0]
            for subDevs in subArrayGroup:
                proj.createGrp(
                    subDevs[1], pId, subDevs[2], subDevs[3], 1, 0)


def getApStatus(proj):
    """Find if any SourceGroups are using AP

    Args:
        proj (r1.ProjectFile): Project file to check

    Raises:
        RuntimeException: If initial SourceGroup discovery has not been performed
    Returns:
        int: 1 if any AP enabled SourceGroup found otherwise 0
    """
    if len(proj.sourceGroups) is 0 or proj.sourceGroups is None:
        raise RuntimeError('SourceGroups not loaded')
    for src in proj.sourceGroups:
        if src.apEnable:
            return 1
    return 0


def getSrcGrpInfo(proj):
    """Discovers all SourceGroups, Groups and channels

    Args:
        proj (r1.ProjectFile): Proj file to perform discovery on
    """
    proj.cursor.execute(f'PRAGMA case_sensitive_like=ON;')

    # Discover all SourceGroups, related R1 Groups and attributes
    proj.cursor.execute(
        f' SELECT Views.ViewId, Views.Name, SourceGroups.SourceGroupId, NextSourceGroupId, SourceGroups.Type, ArrayProcessingEnable,  '
        f' ArraySightId, System, masterGroup.GroupId as MasterGroupId, masterGroup.Name as MasterGroupName, topsGroup.GroupId as TopGroupId, topsGroup.Name as TopGroupName,  '
        f' topsLGroup.GroupId as TopLeftGroupId, topsLGroup.Name as TopLeftGroupName, topsRGroup.GroupId as TopRightGroupId, topsRGroup.Name as TopRightGroupName,  '
        f' subsGroup.GroupId as SubGroupId, subsGroup.Name as SubGroupName, subsLGroup.GroupId as SubLeftGroupId, subsLGroup.Name as SubLeftGroupName, subsRGroup.GroupId as '
        f' SubRightGroupId, subsRGroup.Name as SubRightGroupName, subsCGroup.GroupId as SubCGroupId, subsCGroup.Name as SubCGroupName, i.DisplayName as xover '
        f' FROM SourceGroups '
        f' /* Combine additional source group data */ '
        f' JOIN SourceGroupsAdditionalData  '
        f' ON SourceGroups.SourceGroupId = SourceGroupsAdditionalData.SourceGroupId '
        f' /* Combine view info */ '
        f' JOIN Views '
        f' ON Views.Name = SourceGroups.Name '
        f' /* Combine R1 groups to Source Groups - We only have the name to go on here */ '
        f' JOIN Groups masterGroup '
        f' ON SourceGroups.name = masterGroup.Name '
        f' /* Fetch TOPs groups which may or may not have L/R subgroups */ '
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs") topsGroup '
        f' ON topsGroup.ParentId = masterGroup.GroupId '
        f' /* Fetch L/R TOP groups which will be under the main TOPs groups */ '
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs L" ) topsLGroup '
        f' ON topsLGroup.ParentId  = topsGroup.GroupId '
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% TOPs R" ) topsRGroup '
        f' ON topsRGroup.ParentId  = topsGroup.GroupId '
        f' /* Fetch the SUBs groups */ '
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs") subsGroup '
        f' ON subsGroup.ParentId  = masterGroup.GroupId '
        f' /* Fetch L/R/C SUB groups we created earlier */ '
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs L" ) subsLGroup '
        f' ON subsLGroup.ParentId  = subsGroup.GroupId '
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs R" ) subsRGroup '
        f' ON subsRGroup.ParentId  = subsGroup.GroupId '
        f' LEFT OUTER JOIN (SELECT GroupId, Name, ParentId FROM Groups WHERE Name LIKE "% SUBs C" ) subsCGroup '
        f' /* Fetch crossover info for subs */ '
        f' ON subsCGroup.ParentId  = subsGroup.GroupId '
        f' LEFT OUTER JOIN (SELECT * FROM Controls WHERE DisplayName = "100Hz" OR DisplayName = "Infra") i '
        f' ON i.ViewId  = Views.ViewId '
        f' /* Skip unused channels group */ '
        f' WHERE SourceGroups.name != "Unused channels" '
        f' /* Skip duplicate groups in Master group _only for arrays_. We want L/R groups for arrays. */ '
        f' AND (SourceGroups.Type == 1 AND masterGroup.ParentId != (SELECT GroupId FROM Groups WHERE Name == "Master"))  '
        f' /* Skip existing Sub array group in Master */ '
        f' OR (SourceGroups.Type == 3 AND masterGroup.ParentId != (SELECT GroupId FROM Groups WHERE Name == "Master"))  '
        f' /* Get point source groups from Master group */ '
        f' OR (SourceGroups.Type == 2 AND masterGroup.ParentId == (SELECT GroupId FROM Groups WHERE Name == "Master")) '
        f'  ORDER BY SourceGroups.OrderIndex ASC '
    )

    rtn = proj.cursor.fetchall()

    for row in rtn:
        proj.sourceGroups.append(SourceGroup(row))

    # Discover all channels of previously discovered groups
    for idx, srcGrp in enumerate(proj.sourceGroups):
        for idy, devGrp in enumerate(srcGrp.channelGroups):
            proj.cursor.execute(
                f'  WITH RECURSIVE devs(GroupId, Name, ParentId, TargetId, TargetChannel, Type, Flags) AS ( '
                f'       SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type, Groups.Flags FROM Groups WHERE Groups.ParentId = {devGrp.groupId} '
                f'       UNION '
                f'       SELECT Groups.GroupId, Groups.Name, Groups.ParentId, Groups.TargetId, Groups.TargetChannel, Groups.Type, Groups.Flags FROM Groups, devs WHERE Groups.ParentId = devs.GroupId '
                f'   ) '
                f'    '
                f'  SELECT GroupId, devs.Name, TargetId, TargetChannel, CabinetsAdditionalData.Name, Cabinets.CabinetId FROM devs '
                f'  JOIN Cabinets '
                f'  ON devs.TargetId = Cabinets.DeviceId '
                f'  AND devs.TargetChannel = Cabinets.AmplifierChannel '
                f'  JOIN CabinetsAdditionalData '
                f'  ON Cabinets.CabinetId = CabinetsAdditionalData.CabinetId '
                f'  AND Linked = 0 '
                f'  WHERE devs.type = 1 '
            )
            rtn = proj.cursor.fetchall()

            for row in rtn:
                proj.sourceGroups[idx].channelGroups[idy].channels.append(
                    Channel(row))
            log.info(f'Assigned {len(rtn)} channels to {devGrp.name}')


def createMasterView(proj, templates):
    # Get width + height of templates used
    rtn = __getTempSize(templates, "Master Main")
    masterW = rtn[0]
    masterH = rtn[1]
    rtn = __getTempSize(templates, "Master ArraySight")
    asW = rtn[0]
    asH = rtn[1]
    rtn = __getTempSize(templates, "Master Title")
    titleW = rtn[0]
    titleH = rtn[1]
    rtn = __getTempSize(templates, "Group LR AP CPL2")
    meterW = rtn[0]
    meterH = rtn[1]

    ####### CREATE VIEW #######
    HRes = masterW + asW + ((METER_SPACING_X+meterW) *
                            getChannelMasterGroupTotal(proj)) + 200  # Last one is a buffer
    VRes = titleH + max([meterH, masterH]) + 60
    proj.cursor.execute(
        f'INSERT INTO Views("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (1000,"{MASTER_WINDOW_TITLE}",NULL,4,NULL,-1,{HRes},{VRes},100,NULL,NULL,NULL,NULL);')
    proj.cursor.execute(f'SELECT max(ViewId) FROM Views')
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        proj.masterViewId = rtn[0]

    posX = 10
    posY = 10
    __insertTemplate(proj, templates, 'Nav Button', NAV_BUTTON_X, posY+NAV_BUTTON_Y, proj.masterViewId,
                     METER_WINDOW_TITLE, proj.meterViewId, -1, proj.cursor, None, None, None, None, None)
    posY += __insertTemplate(proj, templates, 'Master Title', posX, posY, proj.masterViewId,
                             None, None, None, proj.cursor, None, None, None, None, None)[1]+METER_SPACING_Y
    posX += __insertTemplate(proj, templates, 'Master Main', posX, posY, proj.masterViewId,
                             None, proj.mId, None, proj.cursor, None, None, None, None, None)[0]+(METER_SPACING_X/2)
    asPos = __insertTemplate(proj, templates, 'Master ArraySight', posX, posY,
                             proj.masterViewId, None, 0, None, proj.cursor, None, None, None, None, None)

    if getApStatus(proj):
        posX += __insertTemplate(proj, templates, 'THC', posX, posY+asPos[1]+(
            METER_SPACING_Y/2), proj.masterViewId, None, proj.apGroupId, None, proj.cursor, None, None, None, None, None)[0]+(METER_SPACING_X*4)
    else:
        posX += asPos[0]+(METER_SPACING_X*4)

    for srcGrp in proj.sourceGroups:
        for idx, chGrp in enumerate(srcGrp.channelGroups):

            if chGrp.type > TYPE_SUBS or chGrp.type == TYPE_TOPS_L or chGrp.type == TYPE_TOPS_R:  # TOP or SUB L/R/C Group
                continue

            template = 'Group'
            if srcGrp.LR:  # Stereo groups
                subGroups = [srcGrp.channelGroups[idx-2],
                             srcGrp.channelGroups[idx-1]]
                template += ' LR'
            if srcGrp.apEnable:
                template += " AP"
            if ("GSL" in srcGrp.cabFamily) or ("KSL" in srcGrp.cabFamily):
                template += " CPL2"

            tempContents = __getTempControlsFromName(templates, template)
            metCh = 0  # Current channel of stereo pair
            mutCh = 0

            for control in tempContents:
                dName = control[7]
                tChannel = control[23]
                tId = chGrp.groupId
                flag = control[19]

                # Update Infra/100hz button text
                if (chGrp.type < TYPE_TOPS or chGrp.type > TYPE_TOPS_R) and dName == "CUT" and srcGrp.xover is not None:
                    dName = srcGrp.xover
                    log.info(f"{chGrp.name} - Enabling {srcGrp.xover}")

                if (control[1] == r1.CTRL_METER):  # Meters, these require a TargetChannel
                    tId = chGrp.channels[0].targetId
                    tChannel = chGrp.channels[0].targetChannel
                if 'Group LR' in template:
                    # Meters, these require a TargetChannel
                    if (control[1] == r1.CTRL_METER):
                        tId = subGroups[metCh].channels[0].targetId
                        tChannel = subGroups[metCh].channels[0].targetChannel
                        metCh += 1
                    if (control[1] == r1.CTRL_BUTTON) and (control[24] == "Config_Mute"):  # Mute
                        tId = subGroups[mutCh].groupId
                        mutCh += 1

                if (control[1] == r1.CTRL_BUTTON) and (control[7] == "View EQ"):  # EQ View
                    tId = srcGrp.viewId+1

                if control[1] == r1.CTRL_FRAME:
                    if control[7]:
                        dName = chGrp.name

                if dName is None:
                    dName = ""

                if control[1] == r1.CTRL_INPUT and control[24] == 'ChStatus_MsDelay' and ('fill' in chGrp.name.lower() or srcGrp.type > TYPE_TOPS_R):
                    flag = 14
                    log.info(f"{chGrp.name} - Setting relative delay")

                s = f'INSERT INTO Controls ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(control[1])}", "{str(control[2]+posX)}", "{str(control[3]+posY)}", "{str(control[4])}", "{str(control[5])}", "{str(proj.masterViewId)}", "{dName}", "{str(proj.jId)}", "{str(control[10])}", "{str(control[11])}", "{str(control[12])}", "{str(control[13])}", "{str(control[14])}", "{str(control[15])}", "{str(control[16])}", "{str(control[17])}", "{str(control[18])}", "{str(flag)}", "{str(control[20])}", "{str(control[21])}", "{str(tId)}", {str(tChannel)}, "{str(control[24])}", {control[25]}, NULL, NULL, "{str(control[28])}", "{str(control[29])}", "{str(control[30])}", "{str(control[31])}", "  ")'

                # Remove CPL if not supported by channel / if channel doesn't have infra, cut button becomes infra
                if control[1] == r1.CTRL_INPUT and control[24] == 'Config_Filter3':
                    if (chGrp.type < TYPE_TOPS or chGrp.type > TYPE_TOPS_R) and srcGrp.xover is not None:
                        s = ""
                        log.info(f"{chGrp.name} - Skipping CPL")

                proj.cursor.execute(s)

            __insertTemplate(proj, templates, 'Nav Button', posX, posY, proj.masterViewId,
                             chGrp.name, srcGrp.viewId, -1, proj.cursor, None, None, None, None, None)

            posX += meterW+METER_SPACING_X
            proj.jId = proj.jId + 1

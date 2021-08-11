import sqlite3
import logging
from abc import ABCMeta
import r1py as r1

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


def createNavButtons(proj, templates):
    proj.cursor.execute(f'SELECT * FROM Views WHERE Type = "{1000}"')
    rtn = proj.cursor.fetchall()

    for row in rtn:
        vId = row[0]
        if vId != proj.masterViewId and vId != proj.meterViewId:
            proj.cursor.execute(
                f'UPDATE Controls SET PosY = PosY + {NAV_BUTTON_Y+20} WHERE ViewId = {vId}')
            __insertTemplate(proj, templates, 'Nav Button', 15, NAV_BUTTON_Y, vId, MASTER_WINDOW_TITLE,
                             proj.meterViewId+1, -1, proj.cursor, None, None, None, None, None)


def clean(proj, masterViewId, meterViewId):
    logging.info('Cleaning R1 project.')

    proj.cursor.execute(
        f'DELETE FROM Controls WHERE "ViewId" = "{masterViewId}"')
    print(f'Deleted {MASTER_WINDOW_TITLE} view.')
    logging.info(f'Deleted {MASTER_WINDOW_TITLE} view.')
    proj.cursor.execute(
        f'DELETE FROM Controls WHERE "ViewId" = "{meterViewId}"')
    print(f'Deleted {METER_WINDOW_TITLE} view controls.')
    logging.info(f'Deleted {METER_WINDOW_TITLE} view controls.')

    proj.cursor.execute(
        f'DELETE FROM Controls WHERE "TargetId" = "{masterViewId}" AND "TargetChannel" = -1')
    print(f'Deleted {MASTER_WINDOW_TITLE} nav buttons.')
    logging.info(f'Deleted {MASTER_WINDOW_TITLE} nav buttons.')

    proj.cursor.execute(
        f'DELETE FROM Views WHERE "Name" = "{MASTER_WINDOW_TITLE}"')
    print(f'Deleted {MASTER_WINDOW_TITLE} view.')
    logging.info(f'Deleted {MASTER_WINDOW_TITLE} view.')

    proj.cursor.execute(
        f'DELETE FROM Views WHERE "Name" = "{METER_WINDOW_TITLE}"')
    print(f'Deleted {METER_WINDOW_TITLE} view.')
    logging.info(f'Deleted {METER_WINDOW_TITLE} view.')

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
    logging.info(f'Deleted {PARENT_GROUP_TITLE} group.')

    return proj


def configureApChannels(proj):
    if proj.apEnable:
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
        logging.info(f'{tempName} template not found.')
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
        logging.info(f'{tempName} template controls not found.')
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
    HRes = (spacingX*proj.getChannelMeterGroupTotal()[0])+METER_SPACING_X
    VRes = titleH+meterGrpH+(spacingY*proj.getChannelMeterGroupTotal()[1])+100
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
                            proj.getChannelMasterGroupTotal()) + 200  # Last one is a buffer
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

    if proj.apEnable:
        posX += __insertTemplate(proj, templates, 'THC', posX, posY+asPos[1]+(
            METER_SPACING_Y/2), proj.masterViewId, None, proj.apGroupId, None, proj.cursor, None, None, None, None, None)[0]+(METER_SPACING_X*4)
    else:
        posX += asPos[0]+(METER_SPACING_X*4)

    for srcGrp in proj.sourceGroups:
        for idx, chGrp in enumerate(srcGrp.channelGroups):

            if chGrp.type > r1.TYPE_SUBS or chGrp.type == r1.TYPE_TOPS_L or chGrp.type == r1.TYPE_TOPS_R:  # TOP or SUB L/R/C Group
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
                if (chGrp.type < r1.TYPE_TOPS or chGrp.type > r1.TYPE_TOPS_R) and dName == "CUT" and srcGrp.xover is not None:
                    dName = srcGrp.xover
                    logging.info(f"{chGrp.name} - Enabling {srcGrp.xover}")

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

                if control[1] == r1.CTRL_INPUT and control[24] == 'ChStatus_MsDelay' and ('fill' in chGrp.name.lower() or srcGrp.type > r1.TYPE_TOPS_R):
                    flag = 14
                    logging.info(f"{chGrp.name} - Setting relative delay")

                s = f'INSERT INTO Controls ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(control[1])}", "{str(control[2]+posX)}", "{str(control[3]+posY)}", "{str(control[4])}", "{str(control[5])}", "{str(proj.masterViewId)}", "{dName}", "{str(proj.jId)}", "{str(control[10])}", "{str(control[11])}", "{str(control[12])}", "{str(control[13])}", "{str(control[14])}", "{str(control[15])}", "{str(control[16])}", "{str(control[17])}", "{str(control[18])}", "{str(flag)}", "{str(control[20])}", "{str(control[21])}", "{str(tId)}", {str(tChannel)}, "{str(control[24])}", {control[25]}, NULL, NULL, "{str(control[28])}", "{str(control[29])}", "{str(control[30])}", "{str(control[31])}", "  ")'

                # Remove CPL if not supported by channel / if channel doesn't have infra, cut button becomes infra
                if control[1] == r1.CTRL_INPUT and control[24] == 'Config_Filter3':
                    if (chGrp.type < r1.TYPE_TOPS or chGrp.type > r1.TYPE_TOPS_R) and srcGrp.xover is not None:
                        s = ""
                        logging.info(f"{chGrp.name} - Skipping CPL")

                proj.cursor.execute(s)

            __insertTemplate(proj, templates, 'Nav Button', posX, posY, proj.masterViewId,
                             chGrp.name, srcGrp.viewId, -1, proj.cursor, None, None, None, None, None)

            posX += meterW+METER_SPACING_X
            proj.jId = proj.jId + 1

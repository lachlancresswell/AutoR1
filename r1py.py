import sqlite3
import logging

ARRAYCALC_SNAPSHOT = 1 #Snapshot ID
PARENT_GROUP_TITLE = 'AUTO'
INPUT_TYPES = ["A1", "A2", "A3", "A4", "D1", "D2", "D3", "D4"]
ipStr = ["Config_InputEnable1", "Config_InputEnable2", "Config_InputEnable3", "Config_InputEnable4", "Config_InputEnable5", "Config_InputEnable6", "Config_InputEnable7", "Config_InputEnable8"]
SUBARRAY_CTR_TEXT = 'Assign SUB Array C channel to L or R? (l/r)\n(default: l): '
TARGET_ID = 3
SUBGROUP = 0
GROUPID = 0
FB_OVERVIEW_POSX = 842
FB_OVERVIEW_POSY = 16
DS_STATUS_STARTX = FB_OVERVIEW_POSX
DS_STATUS_STARTY = 400
SUBARRAY_GROUP_TEXT = 'Create SUBarray LR group? (y/n)\n(default: y): '
METER_WINDOW_TITLE = "AUTO - Meters"
MASTER_WINDOW_TITLE = 'AUTO - Master'
NAV_BUTTON_X = 230
NAV_BUTTON_Y = 15


#LR group mute buttons
LR_MUTE_TEXT = ['Left', 'Right']
LR_MUTE_POSX = [700, 770]
LR_MUTE_POSY = 56

METER_VIEW_STARTX = 15
METER_VIEW_STARTY = 15
METER_SPACING_X = 15
METER_SPACING_Y = 15

#SUBarray LR group mute buttons
SUBLR_MUTE_TEXT = ['Left', 'Right']
SUBLR_MUTE_POSX = [96, 166]
SUBLR_MUTE_POSY = 230
#Sub group fallback display
SUBLR_FB_POSX = 365
SUBLR_FB_POSY = 16
#LR group fallback display
L_FB_POSX = 501
L_FB_POSY = 265
R_FB_POSX = 800
R_FB_POSY = 265
FILL_FB_POSX = 323
FILL_FB_POSY = 225

DEV_PROP_TYPES = [
'Status_SmpsFrequency'
,'Status_MainsPowerPeak'
,'Status_SmpsVoltage'
,'Status_SmpsTemperature'
,'Status_LockMode'
,'Status_StatusText'
,'Status_PwrOk'
,'Settings_Buzzer'
,'Settings_DeviceName'
,'Settings_InputGainEnable'
,'Settings_LockCmd'
,'Settings_MCLEnable'
,'Settings_PwrOn'
,'Input_Analog_Gain'
,'Input_Digital_Gain'
,'Input_Digital_Mode'
,'Input_Digital_Sync'
,'Input_Digital_SampleStatus'
,'Input_Digital_DsDataPri'
,'Input_Digital_DsDataSec'
,'Input_Digital_TxStream'
,'Error_GnrlErr'
,'Error_SmpsTempOff'
,'Error_SmpsTempWarn']


# Used for a template contained in a template file
class Template:
    def __init__(self, name):
        self.name = name
        self.joinedId = 0
        self.contents = []

class Channel:
    def __init__(self, targetId, targetChannel):
        self.targetId = targetId
        self.targetChannel = targetChannel
        self.inputEnable = []
        self.name = "name"

class Group:
    def __init__(self, groupId, name, ap, vId, type):
        self.groupId = groupId
        self.name = name
        self.viewId = None
        self.groupIdSt = []
        self.AP = ap
        self.viewId = vId
        self.type = type

        logging.info(f'Created group - {groupId} / {name}')

    @property
    def viewId(self):
        return self._viewId

    @viewId.setter
    def viewId(self, value):
        self._viewId = value


# Load template file + templates within
class TemplateFile:
    def __init__(self, f):
        self.f = f
        self.db = sqlite3.connect(f);
        self.cursor = self.db.cursor();
        self.templates = []
        logging.info('Loaded template - ' + f)

        self.cursor.execute('SELECT * FROM "main"."Sections" ORDER BY JoinedId ASC')
        rtn  = self.cursor.fetchall()

        self.cursor.execute(f'SELECT Name FROM "main"."Sections"')
        for r in self.cursor.fetchall():
            self.templates.append(Template(r[0]))
        for row in rtn:
            for i in range(len(self.templates)):
                if row[1] == self.templates[i].name:
                    self.templates[i].joinedId = row[3]
                    self.cursor.execute(f'SELECT * FROM "main"."Controls" WHERE JoinedId = {self.templates[i].joinedId}')
                    self.templates[i].contents = self.cursor.fetchall()

        logging.info(str(len(self.templates)) + ' templates loaded.')

    def close(self):
        self.db.commit()
        self.db.close()

def deleteGroup(proj, gId):
    proj.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE ParentId = {gId}')
    rtn = proj.cursor.fetchone();
    if rtn is not None:
        deleteGroup(proj, rtn[0])
    else:
        logging.info(f'Deleting group {gId}.')
        return proj.cursor.execute(f'DELETE FROM "main"."Groups" WHERE GroupId = {gId}')

# Load project file + get joined id for new entries
class ProjectFile:
    def __init__(self, f, templates):
        self.f = f
        self.db = sqlite3.connect(f);
        self.cursor = self.db.cursor();
        self.pId = 1;
        self.mId = 0;
        self.meterViewId = -1;
        self.clean()
        self.close()
        self.db = sqlite3.connect(f);
        self.cursor = self.db.cursor();
        logging.info('Loaded project - ' + f)

        # Set joinedId start
        self.cursor.execute('SELECT JoinedId from "main"."Controls" ORDER BY JoinedId DESC LIMIT 1')
        rtn = self.cursor.fetchone()
        if rtn is not None:
            self.jId = rtn[0] + 1
        else:
            logging.critical("Views have not been generated. Please run initial setup in R1 first.")
            sys.exit()

        #Load all channels. Pass any 'TargetProperty' in the SQL request
        # to retrieve every channel once in the query
        self.channels = []
        self.cursor.execute(f'SELECT TargetId, TargetNode FROM "main"."SnapshotValues" WHERE SnapshotId = {ARRAYCALC_SNAPSHOT} AND TargetProperty = "Config_InputEnable1" ORDER BY TargetId ASC')
        rtn = self.cursor.fetchall()
        for row in rtn:
            self.channels.append(Channel(row[0], row[1]))
        for i in range(len(self.channels)): # Find name for all channels
            self.cursor.execute(f'SELECT Name FROM "main"."AmplifierChannels" WHERE DeviceId = {self.channels[i].targetId} AND AmplifierChannel = {self.channels[i].targetChannel}')
            self.channels[i].name = self.cursor.fetchone()[0]

        logging.info(f'{len(self.channels)} channels loaded. First: {self.channels[0].name}  /  Last: {self.channels[-1].name}')


        #Get ip routing for each channel from ArrayCalc snapshot
        for c in self.channels:
            for s in ipStr:
                self.cursor.execute(f'SELECT * FROM "main"."SnapshotValues" WHERE SnapshotId = {ARRAYCALC_SNAPSHOT} AND TargetId = {c.targetId} AND TargetNode = {c.targetChannel} AND TargetProperty = "{s}" AND Value = 1 ORDER BY TargetId')
                rtn = self.cursor.fetchall()
                c.inputEnable.append(len(rtn));

        logging.info(f'Loaded input routing config for all channels')

        # Get id of Auto R1 groups
        rtn = getGroupIdFromName(self, PARENT_GROUP_TITLE)
        if rtn is not None:
            self.pId = rtn;
            logging.info(f'Found existing {PARENT_GROUP_TITLE} group.')
        else:
            logging.info(f'Could not find existing {PARENT_GROUP_TITLE} group.')
            self.pId = -1;

        # Find Master groupId
        self.cursor.execute('SELECT "GroupId" FROM "main"."Groups" ORDER BY "GroupId" ASC LIMIT 3')
        rtn = self.cursor.fetchall()
        if rtn is None:
            logging.critical('Cannot find Master group.')
        self.mId = rtn[1][0]
        self.groups = []

        # Find source group info
        self.cursor.execute(f'SELECT * FROM "main"."Groups" WHERE "ParentId" = {self.mId}')
        rtn = self.cursor.fetchall()
        #Cycle through every every source group (Main, Sides .etc which all exist under Master)
        for row in rtn:

            # Find if AP is enable for SourceGroups
            self.cursor.execute(f'SELECT ArrayProcessingEnable, Type FROM "main"."SourceGroups" WHERE "Name" = "{row[1]}"')
            rtn2 = self.cursor.fetchone()
            if rtn2 is not None:
                ap = rtn2[0]
                type = rtn2[1]
            else:
                ap = 0;
                type = 0;

            # Find view id for source
            self.cursor.execute(f'SELECT ViewId FROM "main"."Views" WHERE "Name" = "{row[1]}"')
            rtn2 = self.cursor.fetchone()
            if rtn2 is not None:
                vId = rtn2[0]
                self.groups.append(Group(row[0], row[1], ap, vId, type)) #First is GroupId, second is Name
            else:
                logging.error(f'Cannot find view for "{row[1]}"')

        # Determine stereo (Main L/R) and mono groups + get view ids
        for i in range(len(self.groups)):
            g = self.groups[i]

            self.groups[i].targetChannels = findDevicesInGroups(self.cursor, g.groupId)
            r = findGroupType(self.cursor, g.groupId)
            self.groups[i].srcType = r[0]
            self.groups[i].subGroupId = r[1]
            self.groups[i].topGroupId = r[2]

            self.cursor.execute(f'SELECT "ViewId" FROM "main"."Views" WHERE Name = "{self.groups[i].name}" ORDER BY ViewId ASC LIMIT 1;') # Get view IDs
            rtn = self.cursor.fetchone()
            if rtn is not None:
                self.groups[i].viewId = rtn[0]

            # Find any L/R or SUB L/R subgroups
            for g in [" TOPs L", " TOPs R", " SUBs L", " SUBs R"]:
                self.cursor.execute(f'SELECT * FROM "main"."Groups" WHERE "Name" = "{self.groups[i].name + g}"')
                rtn = self.cursor.fetchone()
                if rtn is not None:
                    self.groups[i].groupIdSt.append(Group(rtn[0], rtn[1], self.groups[i].AP, self.groups[i].viewId, self.groups[i].type))
                    self.groups[i].groupIdSt[-1].targetChannels = findDevicesInGroups(self.cursor, self.groups[i].groupIdSt[-1].groupId)
                    logging.info(f"Found {g} group for {self.groups[i].name} group.")

    def delete(self, table, param, match):
        self.cursor.execute(f'DELETE FROM "main"."{table}" WHERE "{param}" = "{match}"')

    def clean(self):
        self.cursor.execute(f'SELECT ViewId FROM "main"."Views" WHERE Name = "{MASTER_WINDOW_TITLE}"')
        rtn = self.cursor.fetchone()

        if rtn is not None:
            logging.info(f'Deleting existing {MASTER_WINDOW_TITLE} view.')
            self.delete("Views", "Name", MASTER_WINDOW_TITLE)
        self.cursor.execute(f'SELECT ViewId FROM "main"."Views" WHERE Name = "{METER_WINDOW_TITLE}"')
        rtn = self.cursor.fetchone()
        if rtn is not None:
            logging.info(f'Deleting existing {METER_WINDOW_TITLE} view.')
            self.delete("Views", "Name", METER_WINDOW_TITLE)

        self.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE Name = "{PARENT_GROUP_TITLE}"')
        rtn = self.cursor.fetchone()
        if rtn is not None:
            pId = rtn[0]
            logging.info(f'Deleting existing {PARENT_GROUP_TITLE} group.')
            deleteGroup(self, self.pId)

    def close(self):
        self.db.commit()
        self.db.close()

def getTempContents(templates, tempName):
    for t in templates.templates:
        if t.name == tempName:
            return t.contents
    return -1;

def getTempSize(templates, tempName):
    templates.cursor.execute(f'SELECT JoinedId FROM "main"."Sections" WHERE Name = "{tempName}"')
    rtn = templates.cursor.fetchone()
    if rtn is not None:
        jId = rtn[0]
    else:
        logging.info(f'{tempName} template not found.')
        return -1

    templates.cursor.execute(f'SELECT PosX, PosY, Width, Height FROM "main"."Controls" WHERE JoinedId = {jId}')
    rtn = templates.cursor.fetchall()
    if rtn is not None:
        w = 0
        h = 0
        for row in rtn:
            if row[0]+row[2] > w:
                w = row[0]+row[2]
            if row[1]+row[3] > h:
                h = row[1]+row[3]
        return [w,h]
    else:
        logging.info(f'{tempName} template controls not found.')
        return -1


def insertTemplate(proj, templates, tempName, posX, posY, viewId, displayName, targetId, targetChannel, cursor, width, height, joinedId, targetProp, targetRec):
    if joinedId is not None:
        jId = joinedId
    else:
        jId = proj.jId
        proj.jId = proj.jId + 1

    tempContents = getTempContents(templates, tempName)

    for row in tempContents:
        tProp = targetProp
        tRec = targetRec
        tChannel = targetChannel
        tId = targetId
        w = width
        h = height
        dName = row[7]
        tType = row[21]

        if tId is None:
            tId = row[22]

        if tChannel is None:
            tChannel = row[23]

        if w is None:
            w = row[4]

        if height is None:
            h = row[5]


        if (row[1] == 12) or (row[1] == 4 and tType == 5): # If item is a Frame or a button to swap views
            if (displayName is not None) and (dName != 'Fallback') and (dName != 'Regular'):
                dName = displayName

        if dName is None:
            dName = ""

        if tProp is None:
            tProp = row[24]
        if tRec is None:
            tRec = row[25]

        for p in DEV_PROP_TYPES:
            if tProp == p:
                if tChannel > -1:
                    tChannel = 0 #Dante + digital info require channel ID to be 0
                    break

        proj.cursor.execute(f'INSERT INTO "main"."Controls" ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(row[1])}", "{str(row[2]+posX)}", "{str(row[3]+posY)}", "{str(w)}", "{str(h)}", "{str(viewId)}", "{dName}", "{str(jId)}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(row[19])}", "{str(row[20])}", "{str(row[21])}", "{str(tId)}", "{str(tChannel)}", "{str(tProp)}", {tRec}, NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", " ")')

    return getTempSize(templates, tempName)
    #except:
    return tempContents


## Create 'Auto' group
# Create group if it does not already exist
def createParentGroup(proj):
    if proj.pId is -1:
        proj.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{PARENT_GROUP_TITLE}",1,0,-1,0,0);')
        proj.pId = getGroupIdFromName(proj, PARENT_GROUP_TITLE)
        logging.info(f'Created {PARENT_GROUP_TITLE} group with id {proj.pId}')

# Creates input relative groups + assign channels
def createIpGroups(proj):
    proj.ipGroupId = []
    if proj.pId is not -1:
        for s in INPUT_TYPES:
            # Create groups
            proj.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{s}",{proj.pId},0,-1,0,0);')
            gId = getGroupIdFromName(proj, s)
            proj.ipGroupId.append(gId)
            logging.info(f'Created {s} group with id {gId}')

        # Assign channels to their input group
        for c in proj.channels:
            for i in range(len(c.inputEnable)):
                if c.inputEnable[i] > 0:
                    proj.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{c.name}",{proj.ipGroupId[i]},{c.targetId},{c.targetChannel},1,0);')
    else:
        logging.error(f'{PARENT_GROUP_TITLE} group does not exist.')

def findDevicesInGroups(cursor, parentId):
    cursor.execute(f'SELECT * FROM "main"."Groups" WHERE ParentId = {parentId}')
    rtn = cursor.fetchall()
    ch = []
    for row in rtn:
        if row[TARGET_ID] == SUBGROUP: # If entry is not a device but a subgroup
            ch += findDevicesInGroups(cursor, row[GROUPID])
        else:
            for i in range(len(rtn)):
                rtn[i] = rtn[i]+(parentId,)
            return rtn
    return ch

# Find if group is a mix of sub + top cabinets
# Returns:
# 1 - Tops
# 2 - Subs
# 3 - Top/Subs
def findGroupType(cursor, parentId):
    cursor.execute(f'SELECT * FROM "main"."Groups" WHERE ParentId = {parentId}')
    rtn = cursor.fetchall()
    gr = [0,0,0] # Indexes: 0 - Group type, 1 - Sub GroupID if exists, 2 - Tops GroupId if exists
    mod = 0;
    for row in rtn:
        if row[TARGET_ID] == SUBGROUP: # If entry is not a device but a subgroup
            if (" TOPs" in row[1]):
                if gr[0] < 1:
                    gr[0] = 1;
                elif gr[0] > 1:
                    gr[0] = 3;
                gr[2] = row[0]
            if (" SUBs" in row[1]):
                if gr[0] < 1:
                    gr[0] = 2;
                elif gr[0] == 1:
                    gr[0] = 3;
                gr[1] = row[0]
    return gr


## Populate groups
# Auto-Find Group ids and names
def createSubLrGroups(proj):
    for i in range(len(proj.groups)):
        if proj.groups[i].type == 3: # Create LR groups for SUBarray
            SUBARRAY_GROUP_TITLE = proj.groups[i].name + " LR"

            groupL = []
            groupR = []
            proj.cursor.execute(f'SELECT Name FROM "main"."PatchIOChannels"')
            patchIO = proj.cursor.fetchall()

            for tc in proj.groups[i].targetChannels:
                proj.cursor.execute(f'SELECT Name FROM "main"."Groups" WHERE GroupId = {tc[7]}')
                rtn = proj.cursor.fetchone()[0]

                if "R" in rtn:
                    groupR.append(tc)
                elif "L" in rtn:
                    groupL.append(tc)
                elif "C" in rtn:
                    userIp = " "
                    while (userIp != "l") and (userIp != "r") and (userIp != ""):
                        userIp = input(SUBARRAY_CTR_TEXT)
                    if (userIp == "l") or (userIp == ""):
                        groupL.append(tc)
                    else:
                        groupR.append(tc)
            logging.info(f'{len(groupL)} L / {len(groupR)} R')

            if len(groupL) > 0 and len(groupR) > 0:
                ## Create SUBarray LR group
                # If group already exists, delete and then recreate with new device list
                proj.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE Name = "{SUBARRAY_GROUP_TITLE}" AND ParentId = "{proj.pId}"')
                rtn = proj.cursor.fetchone()
                if rtn is not None:
                    logging.info(f'Found existing SUBarray group')
                    pId = rtn[0]

                    proj.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE ParentId = "{pId}"') #Get L+R groups
                    rtn = proj.cursor.fetchall()

                proj.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{SUBARRAY_GROUP_TITLE}",{proj.pId},0,-1,0,0);')
                pId = getGroupIdFromName(proj, SUBARRAY_GROUP_TITLE)
                logging.info(f'Created {SUBARRAY_GROUP_TITLE} group with id {pId}')

                # Create sub L and R groups + assign channels
                gStr = [proj.groups[i].name+" L", proj.groups[i].name+" R"]
                g = groupL
                for s in gStr:
                    proj.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{s}",{pId},0,-1,0,0);')
                    logging.info(f'Created {s} group with id {pId}')
                    proj.cursor.execute(f'SELECT * FROM "main"."Groups" WHERE "Name" = "{s}"')
                    rtn = proj.cursor.fetchone()

                    for tc in g:
                        proj.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{tc[1]}",{rtn[0]},{tc[3]},{tc[4]},1,0);')

                    proj.groups[i].groupIdSt.append(Group(rtn[0], rtn[1], proj.groups[i].AP, proj.groups[i].viewId, proj.groups[i].type))
                    proj.groups[i].groupIdSt[-1].targetChannels = findDevicesInGroups(proj.cursor, proj.groups[i].groupIdSt[-1].groupId)

                    g = groupR


def createFbControls(proj, templates):
    # Find Overview viewId + add master fallback frame
    proj.cursor.execute(f'SELECT "ViewId" FROM "main"."Views" WHERE Name = "Overview";') # Get view IDs
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        proj.overviewId = rtn[0]
    else:
        logging.critical("Views have not been generated. Please run initial setup in R1 first.")
        sys.exit();

    proj.cursor.execute(f'SELECT "GroupId" FROM "main"."Groups" WHERE ParentId = "1" AND Name = "Master";') # Get view IDs
    proj.cursor.execute(f'UPDATE "main"."Views" SET HRes = {1200} WHERE ViewId = {proj.overviewId}')

    posX = DS_STATUS_STARTX
    posY = DS_STATUS_STARTY
    for i in range(len(INPUT_TYPES[6:])):
        w = insertTemplate(proj, templates, 'DS Status', posX, posY, proj.overviewId, INPUT_TYPES[4+i], proj.ipGroupId[4+i], -1, proj.cursor, None, None, None, None, i+1);
        posX += w[0]

    insertTemplate(proj, templates, "Fallback Overview", FB_OVERVIEW_POSX, FB_OVERVIEW_POSY, proj.overviewId, None, proj.mId, None, proj.cursor, None, None, None, None, None);

    for i in range(len(proj.groups)): # Determine stereo (Main L/R) and mono groups + get view ids

        # Delete input routing views
        dsplyNames = ["Input Routing"]
        proj.cursor.execute(f'SELECT "JoinedId" FROM "main"."Controls" WHERE DisplayName = "{dsplyNames}" AND ViewId = "{proj.groups[i].viewId}"')
        rtn = proj.cursor.fetchall()
        if rtn is not None:
            for row in rtn:
                proj.delete("Controls", "JoinedId", row[0])

        fbX = 0
        fbY = 0

        if (len(proj.groups[i].groupIdSt) > 0 and ((proj.groups[i].name.lower().find("sub") < 0) and (proj.groups[i].name.lower().find("array") < 0))): #LR group
            fbX = [L_FB_POSX, R_FB_POSX]
            fbY = [L_FB_POSY, R_FB_POSY]
            muteX = LR_MUTE_POSX
            muteY = LR_MUTE_POSY
            muteText = LR_MUTE_TEXT
            fbG = proj.groups[i].groupIdSt

            for j in range(len(muteText)):
                insertTemplate(proj, templates, 'Mute', muteX[j], muteY, proj.groups[i].viewId, muteText[j], proj.groups[i].groupIdSt[j].groupId, None, proj.cursor, None, None, None, None, None);
        elif(proj.groups[i].name.lower().find("sub") > -1) and (proj.groups[i].name.lower().find("array") > -1):#SUBarray group
            fbX = [SUBLR_FB_POSX]
            fbY = [SUBLR_FB_POSY]
            muteX = SUBLR_MUTE_POSX
            muteY = SUBLR_MUTE_POSY
            muteText = SUBLR_MUTE_TEXT
            fbG = [proj.groups[i]]

        else:
            fbX = [FILL_FB_POSX]
            fbY = [FILL_FB_POSY]
            fbG = [proj.groups[i]]

        for j in range(len(fbX)):
            insertTemplate(proj, templates, "Fallback", fbX[j], fbY[j], proj.groups[i].viewId, None, fbG[j].groupId, None, proj.cursor, None, None, None, None, None);

# Delete a view from project
def deleteView(proj, viewId):
    return proj.cursor.execute(f'DELETE FROM "main"."Views" WHERE ViewId = {viewId};')

# Delete a control from a view
def deleteControl(proj, viewId):
    return proj.cursor.execute(f'DELETE FROM "main"."Controls" WHERE ViewId = {viewId};')

# Find a view's id from its name
def getViewIdFromName(proj, name):
    proj.cursor.execute(f'SELECT ViewId FROM "main"."Views" WHERE Name = "{name}"')
    rtn = proj.cursor.fetchone()[0]
    return rtn

def createMeterView(proj, templates):
    ## Get width of meter frame
    templates.cursor.execute(f'SELECT Width, Height FROM "main"."Controls" WHERE DisplayName = "METERS_TITLE"')
    rtn = templates.cursor.fetchone()
    meterW = rtn[0]
    meterH = rtn[1]
    templates.cursor.execute(f'SELECT Height FROM "main"."Controls" WHERE DisplayName = "METERS_GROUP_TITLE"')
    rtn = templates.cursor.fetchone()
    groupH = rtn[0]
    spacingX = meterW+METER_SPACING_X
    spacingY = meterH+METER_SPACING_Y

    gCount = 0
    aCount = 1
    for g in proj.groups:
        gCount += 1;
        if len(g.groupIdSt) > 1:
            gCount += 1;
            for k in g.groupIdSt:
                if len(k.targetChannels) > aCount:
                    aCount = len(k.targetChannels)
        else:
            if len(g.targetChannels) > aCount:
                aCount = len(g.targetChannels)

    mWidth = (spacingX*(gCount+1))+METER_SPACING_X
    mHeight = (spacingY*aCount)+groupH+METER_SPACING_Y
    print(f'spacY - {spacingY}')
    print(f'height - {meterH}')
    print(aCount)
    print(gCount)
    print(len(proj.groups))
    for g in proj.groups:
        print(g.name)
        print(len(g.groupIdSt))
    print(meterW)
    print(mWidth)
    proj.cursor.execute(f'INSERT INTO "main"."Views"("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (1000,"{METER_WINDOW_TITLE}",NULL,4,NULL,-1,{mWidth},{mHeight},100,NULL,NULL,NULL,NULL);')
    proj.meterViewId = getViewIdFromName(proj, METER_WINDOW_TITLE)

    posX = METER_VIEW_STARTX
    posY = METER_VIEW_STARTY
    insertTemplate(proj, templates, 'Nav Button', NAV_BUTTON_X, posY+NAV_BUTTON_Y, proj.meterViewId, MASTER_WINDOW_TITLE, proj.meterViewId+1, -1, proj.cursor, None, None, None, None, None)
    posY += insertTemplate(proj, templates, 'Meters Title', posX, posY, proj.meterViewId, None, None, None, proj.cursor, None, None, None, None, None)[1]+METER_SPACING_Y
    startY = posY
    print(f'posY - {posY}')
    proj.cursor.execute(f'UPDATE "main"."Views" SET VRes = {posY+mHeight} WHERE ViewId = {proj.meterViewId}')

    groups2 = []
    for g in proj.groups:
        if len(g.groupIdSt) < 1:
            groups2.append(g)
        else:
            for sg in g.groupIdSt:
                groups2.append(sg)

    for g in groups2:

        dim = insertTemplate(proj, templates, 'Meters Group', posX, posY, proj.meterViewId, g.name, g.groupId, None, proj.cursor, None, None, None, None, None);

        posY += dim[1]+10

        for d in g.targetChannels:
            insertTemplate(proj, templates, "Meter", posX, posY, proj.meterViewId, d[1], d[3], d[4], proj.cursor, None, None, proj.jId, None, None);

            posY += spacingY
        posX += spacingX
        posY = startY
        proj.jId = proj.jId + 1

def getGroupIdFromName(proj, name):
    proj.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE Name = "{name}"')
    rtn = proj.cursor.fetchone()
    if rtn is not None:
        return rtn[0]
    else:
        return None

def createMasterView(proj, templates):
    ## Get width of widest control in master template
    rtn = getTempSize(templates, "Master Main")
    masterW = rtn[0]
    spacingX = masterW+METER_SPACING_X
    AsId = 0

    proj.cursor.execute(f'SELECT DeviceId FROM "main"."Devices" WHERE Model = "ArraySight"')
    AsId = proj.cursor.fetchone()
    if AsId is not None:
        proj.cursor.fetchone()[0]
    else:
        AsId = 0
        logging.info("Could not find ArraySight device.")

    ## Get width of widest control in ArraySight template
    rtn = getTempSize(templates, "Master ArraySight")
    asW = rtn[0]
    asH = rtn[1]
    spacingX += asW+METER_SPACING_X

    # Find count of mono and stereo groups
    gCount = 0
    gStCount = 0
    for g in proj.groups:
        if len(g.groupIdSt) > 1:
            gStCount += 1;
        else:
            gCount += 1;

    ## Get width of stereo group frame
    rtn = getTempSize(templates, "Group LR AP")
    meterW = rtn[0]
    meterH = rtn[1]
    spacingX += (meterW+METER_SPACING_X)*gStCount
    ## Get width of group frame
    rtn = getTempSize(templates, "Group AP")
    meterW = rtn[0]
    meterH = rtn[1]
    spacingX += (meterW+METER_SPACING_X)*gCount

    spacingX += METER_SPACING_X*4

    proj.cursor.execute(f'INSERT INTO "main"."Views"("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (1000,"{MASTER_WINDOW_TITLE}",NULL,4,NULL,-1,{(spacingX)+METER_SPACING_X},1000,100,NULL,NULL,NULL,NULL);')
    masterViewId = getViewIdFromName(proj, MASTER_WINDOW_TITLE)
    masterGroupId = getGroupIdFromName(proj, "Master")

    posX = 10
    posY = 10
    insertTemplate(proj, templates, 'Nav Button', NAV_BUTTON_X, posY+NAV_BUTTON_Y, masterViewId, METER_WINDOW_TITLE, proj.meterViewId, -1, proj.cursor, None, None, None, None, None)
    posY += insertTemplate(proj, templates, 'Master Title', posX, posY, masterViewId, None, None, None, proj.cursor, None, None, None, None, None)[1]+METER_SPACING_Y
    posX += insertTemplate(proj, templates, 'Master Main', posX, posY, masterViewId, None, masterGroupId, None, proj.cursor, None, None, None, None, None)[0]+METER_SPACING_X;

    posX += insertTemplate(proj, templates, 'Master ArraySight', posX, posY, masterViewId, None, AsId, None, proj.cursor, None, None, None, None, None)[0]+(METER_SPACING_X*4);

    for g in proj.groups:
        jId = proj.jId

        if g.AP > 0:
            if len(g.groupIdSt) > 0:
                template = 'Group LR AP'
            else:
                template = 'Group AP'
        else:
            if len(g.groupIdSt) > 0:
                template = 'Group LR'
            else:
                template = 'Group'


        tempContents = getTempContents(templates, template)
        metCh = 0
        mutCh = 0
        w = 0
        for row in tempContents:
            dName = row[7]
            tChannel = row[23]
            tId = g.groupId
            flag = row[19]

            if g.topGroupId is 0 and dName == "CUT":
                dName = 'Infra'
                logging.info(f"{g.name} - Enabling Infra")

            if (row[1] == 12): #Get frame Width
                w = row[4]
            if (row[1] == 7): #Meters, these require a TargetChannel
                tId = g.targetChannels[0][3]
                tChannel = g.targetChannels[0][4]
            if template == 'Group LR' or template == 'Group LR AP':
                if (row[1] == 7): #Meters, these require a TargetChannel
                    tId = g.groupIdSt[metCh].targetChannels[0][3]
                    tChannel = g.groupIdSt[metCh].targetChannels[0][4]
                    metCh += 1
                if (row[1] == 4) and (row[24] == "Config_Mute"): #Mute
                    tId = g.groupIdSt[mutCh].groupId
                    mutCh += 1

            if row[1] == 12:
                dName = g.name

            if dName is None:
                dName = ""

            if row[1] == 3 and row[24] == 'ChStatus_MsDelay' and ('fill' in g.name.lower() or ('sub' in g.name.lower() and 'array' in g.name.lower())): # Remove CPL if not supported by channel / if channel doesn't have infra, cut button becomes infra
                flag = 14
                logging.info(f"{g.name} - Setting relative delay")

            if row[1] == 3 and row[24] == 'Config_Filter3': # Point CPL at top group only
                tId = g.topGroupId;

            s = f'INSERT INTO "main"."Controls" ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(row[1])}", "{str(row[2]+posX)}", "{str(row[3]+posY)}", "{str(row[4])}", "{str(row[5])}", "{str(masterViewId)}", "{dName}", "{str(jId)}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(flag)}", "{str(row[20])}", "{str(row[21])}", "{str(tId)}", {str(tChannel)}, "{str(row[24])}", {row[25]}, NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", "  ")'

            if row[1] == 3 and row[24] == 'Config_Filter3': # Remove CPL if not supported by channel / if channel doesn't have infra, cut button becomes infra
                if g.topGroupId is 0:
                    s = ""
                    logging.info(f"{g.name} - Skipping CPL")

            proj.cursor.execute(s)

        insertTemplate(proj, templates, 'Nav Button', posX, posY, masterViewId, g.name, g.viewId, -1, proj.cursor, None, None, None, None, None)

        posX += w+METER_SPACING_X
        proj.jId = proj.jId + 1

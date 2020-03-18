import sqlite3
import logging
import sys

PARENT_GROUP_TITLE = 'AUTO'
AP_GROUP_TITLE = 'AP'
METER_WINDOW_TITLE = "AUTO - Meters"
MASTER_WINDOW_TITLE = 'AUTO - Master'
SUBARRAY_GROUP_TEXT = 'Create SUBarray LR group? (y/n)\n(default: y): '
EXISTING_TEXT = 'Found existing AutoR1 group. Regenerate content? (y/n)\n(default: n): '
SUBARRAY_CTR_TEXT = 'Assign SUB Array C channel to L or R? (L/R)\n(default: L): '

ARRAYCALC_SNAPSHOT = 1 #Snapshot ID
INPUT_TYPES = ["A1", "A2", "A3", "A4", "D1", "D2", "D3", "D4"]
ipStr = ["Config_InputEnable1", "Config_InputEnable2", "Config_InputEnable3", "Config_InputEnable4", "Config_InputEnable5", "Config_InputEnable6", "Config_InputEnable7", "Config_InputEnable8"]
TARGET_ID = 3
SUBGROUP = 0
GROUPID = 0

FB_OVERVIEW_POSX = 842
FB_OVERVIEW_POSY = 16
DS_STATUS_STARTX = FB_OVERVIEW_POSX
DS_STATUS_STARTY = 400
NAV_BUTTON_X = 230
NAV_BUTTON_Y = 15

METER_VIEW_STARTX = 15
METER_VIEW_STARTY = 15
METER_SPACING_X = 15
METER_SPACING_Y = 15

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
    def __init__(self, targetId, targetChannel, name):
        self.targetId = targetId
        self.targetChannel = targetChannel
        self.inputEnable = []
        self.name = name

        logging.info(f'Created channel - {self.name}')

class Group:
    def __init__(self, groupId, name, ap, vId, type):
        self.groupId = groupId
        self.name = name
        self.viewId = None
        self.groupIdSt = []
        self.AP = ap
        self.viewId = vId
        self.type = type
        self.siblingId = -1;
        self.isSl = 0

        logging.info(f'Created group - {groupId} / {name}')

    def isSub(self):
        return "SUBs" in self.name;

    def isTop(self):
        return "TOPs" in self.name;

    @property
    def viewId(self):
        return self._viewId

    @viewId.setter
    def viewId(self, value):
        self._viewId = value


# Load template file + templates within
class TemplateFile:
    def __init__(self, f):
        self.__set_f(f)
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

    def __get_f(self):
        return self.__f

    def __set_f(self, f):
        self.__f = f

    f = property(__get_f, __set_f)

    def close(self):
        self.db.commit()
        self.db.close()

# Deletes a project group and its children
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

        self.cursor.execute(f"SELECT * FROM sqlite_master WHERE name ='Groups' and type='table'")
        if self.cursor.fetchone() is None:
            print("Run initial R1 group + view generation first before using AutoR1. Exiting.")
            sys.exit()
        self.cursor.execute(f"SELECT * FROM sqlite_master WHERE name ='Views' and type='table'")
        if self.cursor.fetchone() is None:
            print("Run initial R1 group + view generation first before using AutoR1. Exiting.")
            sys.exit()

        # Get id of Auto R1 groups
        rtn = getGroupIdFromName(self, PARENT_GROUP_TITLE)
        if rtn is not None:
            self.pId = rtn;
            userIp = " "
            while (userIp != "y") and (userIp != "n") and (userIp != ""):
                userIp = input(EXISTING_TEXT)
            if (userIp == "n") or (userIp == ""):
                print("Closing program.")
                sys.exit()

        self.pId = 1;
        self.mId = 0;
        self.meterViewId = -1;
        self.masterViewId = -1
        self.clean()
        self.close()
        self.db = sqlite3.connect(f);
        self.cursor = self.db.cursor();
        self.subArray = []
        self.pId = -1;
        self.ap = 0
        logging.info('Loaded project - ' + f)

        # Set joinedId start
        self.cursor.execute('SELECT JoinedId from "main"."Controls" ORDER BY JoinedId DESC LIMIT 1')
        rtn = self.cursor.fetchone()
        if rtn is not None:
            self.jId = rtn[0] + 1
        else:
            print("Views have not been generated. Please run initial setup in R1 first.")
            logging.critical("Views have not been generated. Please run initial setup in R1 first.")
            sys.exit()

        #Load all channels. Pass any 'TargetProperty' in the SQL request
        # to retrieve every channel once in the query
        self.channels = []
        self.cursor.execute(f'SELECT TargetId, TargetNode FROM "main"."SnapshotValues" WHERE SnapshotId = {ARRAYCALC_SNAPSHOT} AND TargetProperty = "Config_InputEnable1" ORDER BY TargetId ASC')
        rtn = self.cursor.fetchall()
        for row in rtn:
            tId = row[0]
            tCh = row[1]
            self.cursor.execute(f'SELECT Name FROM "main"."AmplifierChannels" WHERE DeviceId = {tId} AND AmplifierChannel = {tCh}')
            name = self.cursor.fetchone()[0]
            self.channels.append(Channel(tId, tCh, name))
        logging.info(f'{len(self.channels)} channels loaded. First: {self.channels[0].name}  /  Last: {self.channels[-1].name}')


        #Get ip routing for each channel from ArrayCalc snapshot
        for c in self.channels:
            for s in ipStr:
                self.cursor.execute(f'SELECT * FROM "main"."SnapshotValues" WHERE SnapshotId = {ARRAYCALC_SNAPSHOT} AND TargetId = {c.targetId} AND TargetNode = {c.targetChannel} AND TargetProperty = "{s}" AND Value = 1 ORDER BY TargetId')
                rtn = self.cursor.fetchall()
                c.inputEnable.append(len(rtn));

        logging.info(f'Loaded input routing config for all channels')

        createParentGroup(self)

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
            # Find source viewId
            self.cursor.execute(f'SELECT ViewId FROM "main"."Views" WHERE "Name" = "{row[1]}"')
            rtn2 = self.cursor.fetchone()
            if rtn2 is not None:
                vId = rtn2[0]
            else:
                logging.error(f'Cannot find view for "{row[1]}"')

            # Find if AP is enabled for SourceGroups
            self.cursor.execute(f'SELECT ArrayProcessingEnable, Type, Name FROM "main"."SourceGroups" WHERE "Name" = "{row[1]}"')
            rtn2 = self.cursor.fetchone()
            if rtn2 is not None:
                ap = rtn2[0]
                type = rtn2[1]
                if rtn2[0] > 0:
                    self.ap = 1;
            else:
                ap = 0;
                type = 0;
                logging.error(f'Cannot find SourceGroup info for {row[1]}')

            if type != 3: # Not Sub Array
                gCount = len(self.groups)
                srcType = 0 # 0 - point source, 1 - mono array, 2 - stereo array
                for g in [" TOPs L", " TOPs R", " TOPs", " SUBs L", " SUBs R", " SUBs", ""]:
                    if g == "" and srcType == 1:
                        break;
                    self.cursor.execute(f'SELECT * FROM "main"."Groups" WHERE "Name" = "{row[1] + g}"')
                    rtn = self.cursor.fetchone()
                    if rtn is not None:
                        self.groups.append(Group(rtn[0], rtn[1], ap, vId, type)) #First is GroupId, second is Name
                        self.groups[-1].targetChannels = findDevicesInGroups(self.cursor, self.groups[-1].groupId)

                        if len(self.groups[-1].targetChannels) > 0:
                            if "KSL" in self.groups[-1].targetChannels[-1][9] or "GSL" in self.groups[-1].targetChannels[-1][9]:
                                self.groups[-1].isSl = 1
                        if g == " TOPs R" or g == " SUBs  R":
                            self.groups[-1].siblingId = self.groups[-2].groupId;
                            self.groups[-2].siblingId = self.groups[-1].groupId;
                            srcType = 2
                        if g == " TOPs" or g == " SUBs":
                            if srcType < 1:
                                srcType = 1
                            elif srcType > 1: # Parent group of stereo pair
                                self.groups[-1].childId = []
                                self.groups[-1].childId.append(self.groups[-3].groupId); # L
                                self.groups[-1].childId.append(self.groups[-2].groupId); # R
                                self.groups[-2].parentId = self.groups[-1].groupId;
                                self.groups[-3].parentId = self.groups[-1].groupId;
                                logging.info(f'{self.groups[-1].name} is parent of {self.groups[-2].name} / {self.groups[-3].name}')
                        if g == "" and srcType == 2:
                            self.groups.pop(len(self.groups)-1)
            else:
                SUBARRAY_GROUP_TITLE = row[1] + " LR"
                self.cursor.execute(f'SELECT * FROM "main"."Groups" WHERE "Name" = "{row[1]}"')
                subCh = self.cursor.fetchone()

                if subCh is not None:
                    self.subArray = Group(subCh[0], subCh[1], ap, vId, type) #First is GroupId, second is Name
                    self.subArray.targetChannels = findDevicesInGroups(self.cursor, self.subArray.groupId)
                else:
                    logging.error(f'Could not find group for {row[1]}')


                groupL = []
                groupR = []

                for tc in self.subArray.targetChannels:
                    self.cursor.execute(f'SELECT Name FROM "main"."Groups" WHERE GroupId = {tc[7]}')
                    gName = self.cursor.fetchone()[0]

                    if "R" in gName:
                        groupR.append(tc)
                    elif "L" in gName:
                        groupL.append(tc)
                    elif "C" in gName:
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
                    self.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{SUBARRAY_GROUP_TITLE}",{self.pId},0,-1,0,0);')
                    pId = getGroupIdFromName(self, SUBARRAY_GROUP_TITLE)
                    logging.info(f'Created {SUBARRAY_GROUP_TITLE} group with id {pId}')

                    # Create sub L and R groups + assign channels
                    gStr = [row[1]+" L", row[1]+" R"]
                    g = groupL
                    for s in gStr:
                        self.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{s}",{pId},0,-1,0,0);')
                        logging.info(f'Created {s} group with id {pId}')
                        self.cursor.execute(f'SELECT * FROM "main"."Groups" WHERE "Name" = "{s}"')
                        rtn = self.cursor.fetchone()

                        for tc in g:
                            self.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{tc[1]}",{rtn[0]},{tc[3]},{tc[4]},1,0);')

                        self.groups.append(Group(rtn[0], rtn[1], ap, vId, type))
                        self.groups[-1].targetChannels = findDevicesInGroups(self.cursor, self.groups[-1].groupId)

                        g = groupR

        # Create AP group
        if self.ap > 0:
            self.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{AP_GROUP_TITLE}",{self.pId},0,-1,0,0);')
            self.apGroupId = getGroupIdFromName(self, AP_GROUP_TITLE)
            logging.info(f'Created {AP_GROUP_TITLE} group with id {self.apGroupId}')

            for g in self.groups:
                if g.AP > 0:
                    for c in g.targetChannels:
                        self.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{c[1]}",{self.apGroupId},{c[3]},{c[4]},1,0);')

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

def createNavButtons(proj, templates):
    proj.cursor.execute(f'SELECT * FROM "main"."Views" WHERE Type = "{1000}"')
    rtn = proj.cursor.fetchall()

    for row in rtn:
        vId = row[0]
        if vId != proj.masterViewId and vId != proj.meterViewId:
            proj.cursor.execute(f'UPDATE "main"."Controls" SET PosY = PosY + {NAV_BUTTON_Y+20} WHERE ViewId = {vId}')
            insertTemplate(proj, templates, 'Nav Button', 15, NAV_BUTTON_Y, vId, MASTER_WINDOW_TITLE, proj.meterViewId+1, -1, proj.cursor, None, None, None, None, None)



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
                cursor.execute(f'SELECT * FROM "main"."Cabinets" WHERE DeviceId = {row[3]} AND AmplifierChannel = {row[4]}')
                cabData = cursor.fetchone()
                if cabData is not None:
                    cursor.execute(f'SELECT * FROM "main"."CabinetsAdditionalData" WHERE CabinetId = {cabData[0]}')
                    cabAddData = cursor.fetchone()
                    if cabAddData is not None:
                        rtn[i] = rtn[i]+(parentId,cabData[3],cabAddData[1])
                    else:
                        logging.error(f'Cannot find additional cabinet data for {row[1]}')
                else:
                    logging.error(f'Cannot find cabinet data for {row[1]}')
            return rtn
    return ch

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

    proj.cursor.execute(f'INSERT INTO "main"."Views"("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (1000,"{METER_WINDOW_TITLE}",NULL,4,NULL,-1,{mWidth},{mHeight},100,NULL,NULL,NULL,NULL);')
    proj.meterViewId = getViewIdFromName(proj, METER_WINDOW_TITLE)

    posX = METER_VIEW_STARTX
    posY = METER_VIEW_STARTY
    insertTemplate(proj, templates, 'Nav Button', NAV_BUTTON_X, posY+NAV_BUTTON_Y, proj.meterViewId, MASTER_WINDOW_TITLE, proj.meterViewId+1, -1, proj.cursor, None, None, None, None, None)
    posY += insertTemplate(proj, templates, 'Meters Title', posX, posY, proj.meterViewId, None, None, None, proj.cursor, None, None, None, None, None)[1]+METER_SPACING_Y
    startY = posY

    proj.cursor.execute(f'UPDATE "main"."Views" SET VRes = {posY+mHeight} WHERE ViewId = {proj.meterViewId}')

    meterGroups = []
    for g in proj.groups:
        if not hasattr(g, "childId"):
            meterGroups.append(g)

    for g in meterGroups:

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

def getGroupFromId(groups, gId):
    for g in groups:
        if g.groupId == gId:
            return g
    return -1;

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
    proj.masterViewId = getViewIdFromName(proj, MASTER_WINDOW_TITLE)
    masterGroupId = getGroupIdFromName(proj, "Master")

    posX = 10
    posY = 10
    insertTemplate(proj, templates, 'Nav Button', NAV_BUTTON_X, posY+NAV_BUTTON_Y, proj.masterViewId, METER_WINDOW_TITLE, proj.meterViewId, -1, proj.cursor, None, None, None, None, None)
    posY += insertTemplate(proj, templates, 'Master Title', posX, posY, proj.masterViewId, None, None, None, proj.cursor, None, None, None, None, None)[1]+METER_SPACING_Y
    posX += insertTemplate(proj, templates, 'Master Main', posX, posY, proj.masterViewId, None, masterGroupId, None, proj.cursor, None, None, None, None, None)[0]+(METER_SPACING_X/2);
    asPos = insertTemplate(proj, templates, 'Master ArraySight', posX, posY, proj.masterViewId, None, AsId, None, proj.cursor, None, None, None, None, None)
    if proj.ap > 0:
        # def insertTemplate(proj, templates, tempName, posX, posY, viewId, displayName, targetId, targetChannel, cursor, width, height, joinedId, targetProp, targetRec):
        posX += insertTemplate(proj, templates, 'THC', posX, posY+asPos[1]+(METER_SPACING_Y/2), proj.masterViewId, None, proj.apGroupId, None, proj.cursor, None, None, None, None, None)[0]+(METER_SPACING_X*4);
    else:
        posX += asPos[0]+(METER_SPACING_X*4);
    for g in proj.groups:
        jId = proj.jId

        if " TOPs " in g.name or " SUBs " in g.name: # Skip L, R and master groups
            continue;
        template = 'Group'
        if hasattr(g, "childId"): # Stereo groups
            template += ' LR'
        if g.AP > 0:
            template += " AP"
        if g.isSl > 0:
            template += " CPL2"

        tempContents = getTempContents(templates, template)
        metCh = 0 # Current channel of stereo pair
        mutCh = 0
        w = 0
        for row in tempContents:
            dName = row[7]
            tChannel = row[23]
            tId = g.groupId
            flag = row[19]

            if g.type is 0 and dName == "CUT":
                dName = 'Infra'
                logging.info(f"{g.name} - Enabling Infra")

            if (row[1] == 12): #Get frame Width
                w = row[4]
            if (row[1] == 7): #Meters, these require a TargetChannel
                tId = g.targetChannels[0][3]
                tChannel = g.targetChannels[0][4]
            if 'Group LR' in template:
                if (row[1] == 7): #Meters, these require a TargetChannel
                    child = getGroupFromId(proj.groups, g.childId[metCh])
                    tId = child.targetChannels[0][3]
                    tChannel = child.targetChannels[0][4]
                    metCh += 1
                if (row[1] == 4) and (row[24] == "Config_Mute"): #Mute
                    child = getGroupFromId(proj.groups, g.childId[mutCh])
                    tId = child.groupId
                    mutCh += 1

            if row[1] == 12:
                dName = g.name

            if dName is None:
                dName = ""

            if row[1] == 3 and row[24] == 'ChStatus_MsDelay' and ('fill' in g.name.lower() or ('sub' in g.name.lower() and 'array' in g.name.lower())): # Remove CPL if not supported by channel / if channel doesn't have infra, cut button becomes infra
                flag = 14
                logging.info(f"{g.name} - Setting relative delay")

            s = f'INSERT INTO "main"."Controls" ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(row[1])}", "{str(row[2]+posX)}", "{str(row[3]+posY)}", "{str(row[4])}", "{str(row[5])}", "{str(proj.masterViewId)}", "{dName}", "{str(jId)}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(flag)}", "{str(row[20])}", "{str(row[21])}", "{str(tId)}", {str(tChannel)}, "{str(row[24])}", {row[25]}, NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", "  ")'

            if row[1] == 3 and row[24] == 'Config_Filter3': # Remove CPL if not supported by channel / if channel doesn't have infra, cut button becomes infra
                if not g.isTop():
                    s = ""
                    logging.info(f"{g.name} - Skipping CPL")

            proj.cursor.execute(s)

        insertTemplate(proj, templates, 'Nav Button', posX, posY, proj.masterViewId, g.name, g.viewId, -1, proj.cursor, None, None, None, None, None)

        posX += w+METER_SPACING_X
        proj.jId = proj.jId + 1

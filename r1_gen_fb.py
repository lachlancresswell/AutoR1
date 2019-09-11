import sqlite3
import tkinter
import tkinter as tk
import tkinter.ttk as ttk
from tkinter.filedialog import askopenfilename
import shutil
import sys

VIEWS_REMOVE_TEXT = 'Remove all views and groups? (y/n)'
INPUT_GROUP_TEXT = 'Create input groups? (y/n)'
FALLBACK_TEXT = 'Create fallback controls? (y/n)'
METERS_TEXT = 'Create meters view? (y/n)'
METERS_REMOVE_TEXT = 'Remove meters view? (y/n)'
INPUT_SNAPSHOT = "Inputs"
ARRAYCALC_SNAPSHOT = 1
TEMPLATE_NAMES = ['fallback', 'fallbacklr', 'fbmaster', 'mute', 'dsd1stat', 'dsd2stat', 'meters', 'metersgroup']
METER_WINDOW_TITLE = "Meters"
METER_VIEW_WIDTH = 2000
METER_VIEW_HEIGHT = 7000
METER_VIEW_STARTX = 15
METER_VIEW_STARTY = 15
METER_GROUP_TEMPLATE_INDEX = 7
METER_TEMPLATE_INDEX = 6
METER_GROUP_SPACING = 230
METER_SPACING_Y = 155

PROPERTY_TYPE_INDEX = -9

GROUPID = 0
SUBGROUP = 0
TARGET_CHANNEL = 4
TARGET_ID = 3


ctrlStr = 'INSERT INTO "main"."Controls" ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") '

#CLASS OVERVIEW
class Channel:
    def __init__(self, targetId, targetChannel):
        self.targetId = targetId
        self.targetChannel = targetChannel
        self.inputEnable = []
        self.name = "name"

    def print(self):
        print(f'CHANNEL: id - {self.targetId} / channel - {self.targetChannel} / name - {self.name}')
        print(self.inputEnable)

class Group:
    def __init__(self, groupId, name):
        self.groupId = groupId
        self.name = name
        self.viewId = None
        self.groupIdSt = []
        self.targetDevices = []

    def print(self):
        print(f'GROUP: {self.name} / {self.groupId} / Subgroups: {len(self.groupIdSt)}')
        for g in self.groupIdSt:
            print(g.name)
        for d in self.targetChannels:
            print(d)

    @property
    def viewId(self):
        return self._viewId

    @viewId.setter
    def viewId(self, value):
        self._viewId = value

class Template:
    def __init__(self, name):
        self.name = name
        self.joinedId = 0
        self.contents = []

    def print(self):
        print(f'{self.name} - JoinedId: {self.joinedId} - Contents Length: {len(self.contents)}')

def getTempContents(tempArray, tempName):
    for t in tempArray:
        if t.name == tempName:
            return t.contents
    return -1;

def findDevicesInGroups(parentId):
    proj_c.execute(f'SELECT * FROM "main"."Groups" WHERE ParentId = {parentId}')
    rtn = proj_c.fetchall()
    ch = []
    for row in rtn:
        if row[TARGET_ID] == SUBGROUP: # If entry is not a device but a subgroup
            ch += findDevicesInGroups(row[GROUPID])
        else:
            return rtn

    return ch

def insertTemplate(temps, tempName, posX, posY, viewId, displayName, targetId, targetChannel, proj_c):
    print(f'TEMPLATE: {tempName} / {posX} / {posY} / {viewId} / {displayName} / {targetId} / {targetChannel}')
    for row in getTempContents(temps, tempName):
        print({row[7]})
        if targetId is None:
            targetId = row[22]
        if targetChannel is None:
            targetChannel = row[23]
        proj_c.execute(f'INSERT INTO "main"."Controls" ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(row[1])}", "{str(row[2]+posX)}", "{str(row[3]+posY)}", "{str(row[4])}", "{str(row[5])}", "{str(viewId)}", "{row[7]}", "{str(row[9])}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(row[19])}", "{str(row[20])}", "{str(row[21])}", "{str(targetId)}", "{str(targetChannel)}", "{str(row[24])}", "{str(row[25])}", NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", " ")')


views = []
filename = "r1.dbpr"

# SQL Setup
dbTemplate = sqlite3.connect('templates.r2t')
dbProj = sqlite3.connect(filename)
template_c = dbTemplate.cursor()
proj_c = dbProj.cursor()

##### LOAD TEMPLATES
temps = []
template_c.execute('SELECT * FROM "main"."Sections" ORDER BY JoinedId ASC')
rtn  = template_c.fetchall()
for t in TEMPLATE_NAMES:
    temps.append(Template(t))
for row in rtn:
    for i in range(len(temps)):
        if row[1] == temps[i].name:
            temps[i].joinedId = row[3]
            template_c.execute(f'SELECT * FROM "main"."Controls" WHERE JoinedId = {temps[i].joinedId}')
            temps[i].contents = template_c.fetchall()


userIp = ""
while (userIp != "y") and (userIp != "n"):
    userIp = input(VIEWS_REMOVE_TEXT)

if userIp == "y":
    proj_c.execute(f'SELECT ViewId FROM "main"."Views" WHERE Type = 1000')
    rtn = proj_c.fetchall()
    for row in rtn:
        proj_c.execute(f'DELETE FROM "main"."Controls" WHERE ViewId = {row[0]};')
        proj_c.execute(f'DELETE FROM "main"."Views" WHERE ViewId = {row[0]};')
    proj_c.execute(f'DELETE FROM "main"."Groups" WHERE NOT GroupId = 1')

    dbTemplate.close()
    dbProj.commit()
    dbProj.close()
    sys.exit()


##################### Create input groups #####################
userIp = ""
while (userIp != "y") and (userIp != "n"):
    userIp = input(INPUT_GROUP_TEXT)

ipId = [0,0,0,0,0,0,0,0]
if userIp == "y":

    #Create channel list
    proj_c.execute(f'SELECT * FROM "main"."Snapshots" ORDER BY SnapshotId ASC')
    rtn = proj_c.fetchall()
    i = 1
    for row in rtn:
        print(f'[{i}] - {row[2]}')
    userIp = input('Select snapshot to retrieve input patch from (default 1):')
    if userIp == "":
        userIp = ARRAYCALC_SNAPSHOT
    snapId = rtn[int(userIp)-1][0]

    channels = []
    proj_c.execute(f'SELECT TargetId, TargetNode FROM "main"."SnapshotValues" WHERE SnapshotId = {snapId} AND TargetProperty = "Config_InputEnable1" ORDER BY TargetId ASC')
    rtn = proj_c.fetchall()
    for row in rtn:
        channels.append(Channel(row[0], row[1]))
    for i in range(len(channels)):
        proj_c.execute(f'SELECT Name FROM "main"."AmplifierChannels" WHERE DeviceId = {channels[i].targetId} AND AmplifierChannel = {channels[i].targetChannel}')
        channels[i].name = proj_c.fetchone()[0]


    #Find ip routing for each channel
    ipStr = ["Config_InputEnable1", "Config_InputEnable2", "Config_InputEnable3", "Config_InputEnable4", "Config_InputEnable5", "Config_InputEnable6", "Config_InputEnable7", "Config_InputEnable8"]
    proj_c.execute(f'SELECT SnapshotId FROM "main"."Snapshots" WHERE Name = "{INPUT_SNAPSHOT}"')
    #ipSnId = proj_c.fetchone()[0]
    for c in channels:
        for s in ipStr:
            proj_c.execute(f'SELECT * FROM "main"."SnapshotValues" WHERE SnapshotId = {1} AND TargetId = {c.targetId} AND TargetNode = {c.targetChannel} AND TargetProperty = "{s}" AND Value = 1 ORDER BY TargetId')
            rtn = proj_c.fetchall()
            c.inputEnable.append(len(rtn));

    ## Create groups
    ipStr = ["A1", "A2", "A3", "A4", "D1", "D2", "D3", "D4"]
    ipId = []
    for s in ipStr:
        proj_c.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{s}",1,0,-1,0,0);')
        proj_c.execute(f'SELECT GroupId FROM "main"."Groups" WHERE Name = "{s}"')
        ipId.append(proj_c.fetchone()[0])

    for c in channels:
        for i in range(len(c.inputEnable)):
            if c.inputEnable[i] > 0:
                proj_c.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{c.name}",{ipId[i]},{c.targetId},{c.targetChannel},1,0);')

###############################################################


## Populate groups
# Auto-Find Group ids and names
proj_c.execute('SELECT "GroupId" FROM "main"."Groups" ORDER BY "GroupId" ASC LIMIT 3')
priGrpId = proj_c.fetchall()[1][0]
groups = []
rtn = proj_c.execute(f'SELECT * FROM "main"."Groups" WHERE "ParentId" = {priGrpId}')
for row in rtn:
    groups.append(Group(row[0], row[1])) #First is GroupId, second is Name

for i in range(len(groups)): # Determine stereo (Main L/R) and mono groups + get view ids
    g = groups[i]

    groups[i].targetChannels = findDevicesInGroups(g.groupId)

    proj_c.execute(f'SELECT "ViewId" FROM "main"."Views" WHERE Name = "{groups[i].name}" ORDER BY ViewId ASC LIMIT 1;') # Get view IDs
    rtn = proj_c.fetchone()
    try:
        groups[i].viewId = rtn[0]
    except:
        print(f"Could not find view for {groups[i].name} group.")

    # Find any L/R or SUB L/R subgroups
    for g in [" TOPs L", " TOPs R", " SUBs L", " SUBs R"]:
        proj_c.execute(f'SELECT * FROM "main"."Groups" WHERE "Name" = "{groups[i].name + g}"')
        try:
            rtn = proj_c.fetchone()
            groups[i].groupIdSt.append(Group(rtn[0], rtn[1]))
            groups[i].groupIdSt[-1].targetChannels = findDevicesInGroups(groups[i].groupIdSt[-1].groupId)
        except:
            asdasd = 1;
            #print(f"No {g} group found for {groups[i].name} group.")





##################### FALLBACK CONTROLS #####################

userIp = ""
while (userIp != "y") and (userIp != "n"):
    userIp = input(FALLBACK_TEXT)

if userIp == "y":
    # Find Overview viewId + add master fallback frame
    proj_c.execute(f'SELECT "ViewId" FROM "main"."Views" WHERE Name = "Overview";') # Get view IDs
    overviewId = 0
    try:
        overviewId = proj_c.fetchone()[0]
    except:
        print("Views have not been generated. Please run initial setup in R1 first.")
        sys.exit();

    proj_c.execute(f'SELECT "GroupId" FROM "main"."Groups" WHERE ParentId = "1" AND Name = "Master";') # Get view IDs
    masterId = proj_c.fetchone()[0]

    proj_c.execute(f'UPDATE "main"."Views" SET VRes = {1500} WHERE ViewId = {overviewId}')

    insertTemplate(temps, "fbmaster", 429, 823, overviewId, "", masterId, None, proj_c);
    insertTemplate(temps, "dsd1stat", 429, 1042, overviewId, "", ipId[4], None, proj_c);
    insertTemplate(temps, "dsd2stat", 603, 1042, overviewId, "", ipId[4], None, proj_c);





    for i in range(len(groups)): # Determine stereo (Main L/R) and mono groups + get view ids


        # Delete input routing and clock selection views
        dsplyNames = ["Input Routing", "Digital Input Clock", "Digital Input Clock Left", "Digital Input Clock Right"]
        for d in dsplyNames:
            proj_c.execute(f'SELECT "JoinedId" FROM "main"."Controls" WHERE DisplayName = "{d}" AND ViewId = "{groups[i].viewId}"')
            try:
                for row in proj_c.fetchall():
                    proj_c.execute(f'DELETE FROM "main"."Controls" WHERE JoinedId = {row[0]};')
            except:
                print(f"Could not find {d} info for {groups[i].name}")


        posX = 0
        posY = 0
        if len(groups[i].groupIdSt) > 0: #Stero group
            template = getTempContents(temps, "fallbacklr")
            posX = 485
            posY = 227

            for side in range(2):
                sideText = "Left"
                sideX = 700
                if side == 1:
                    sideText = "Right"
                    sideX = 770

                for row in getTempContents(temps, 'mute'):
                    s = ctrlStr + f'VALUES ("{str(row[1])}", "{str(row[2]+sideX)}", "{str(row[3]+110)}", "{str(row[4])}", "{str(row[5])}", "{groups[i].viewId}", "{str(sideText)}", "{str(row[9])}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(row[19])}", "{str(row[20])}", "{str(row[21])}", "{groups[i].groupIdSt[side].groupId}", "{str(row[23])}", "{str(row[24])}", "{str(row[25])}", NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", " ")'
                    proj_c.execute(s)

        elif groups[i].name.find("SUB") > -1 and groups[i].name.find("array") > -1: #Subs
            template = getTempContents(temps, "fallback")
            posX = 365
            posY = 117
        else:
            template = getTempContents(temps, "fallback") #Point sources
            posX = 307
            posY = 228

            proj_c.execute(f'SELECT "ControlId" FROM "main"."Controls" WHERE DisplayName = "{groups[i].name} TOPs" ORDER BY ControlId ASC LIMIT 1;')
            cId = proj_c.fetchone()[0]
            proj_c.execute(f'UPDATE "main"."Controls" SET Height = {505} WHERE ControlId = {cId}')

        for row in template:
            s = f'INSERT INTO "main"."Controls" ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(row[1])}", "{str(row[2]+posX)}", "{str(row[3]+posY)}", "{str(row[4])}", "{str(row[5])}", "{groups[i].viewId}", "{str(row[7])}", "{str(row[9])}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(row[19])}", "{str(row[20])}", "{str(row[21])}", "{groups[i].groupId}", "{str(row[23])}", "{str(row[24])}", "{str(row[25])}", NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", " ")'
            proj_c.execute(s)
#####################  #####################

userIp = ""
while (userIp != "y") and (userIp != "n"):
    userIp = input(METERS_REMOVE_TEXT)

if userIp == "y":
    proj_c.execute(f'SELECT ViewId FROM "main"."Views" WHERE Name = "{METER_WINDOW_TITLE}"')
    meterViewId = proj_c.fetchone()[0]
    proj_c.execute(f'DELETE FROM "main"."Controls" WHERE ViewId = {meterViewId};')
    proj_c.execute(f'DELETE FROM "main"."Views" WHERE ViewId = {meterViewId};')





##################### METER VIEW #####################
userIp = ""
while (userIp != "y") and (userIp != "n"):
    userIp = input(METERS_TEXT)

if userIp == "y":
    proj_c.execute(f'INSERT INTO "main"."Views"("Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (1000,"{METER_WINDOW_TITLE}",NULL,4,NULL,-1,{METER_VIEW_WIDTH},{METER_VIEW_HEIGHT},100,NULL,NULL,NULL,NULL);')
    proj_c.execute(f'SELECT ViewId FROM "main"."Views" WHERE Name = "{METER_WINDOW_TITLE}"')
    meterViewId = proj_c.fetchone()[0]

    print(f'Meters ViewId: {meterViewId}')

    posX = METER_VIEW_STARTX
    posY = METER_VIEW_STARTY
    # Create unique joinedId for each group frame and meters
    proj_c.execute(f'SELECT JoinedId FROM "main"."Controls" ORDER BY JoinedId DESC LIMIT 1')
    jId = proj_c.fetchone()[0]+1


    groups2 = []
    for g in groups:
        if len(g.groupIdSt) < 1:
            groups2.append(g)
        else:
            for sg in g.groupIdSt:
                groups2.append(sg)

    print(len(groups2))

    for g in groups2:

        for row in temps[METER_GROUP_TEMPLATE_INDEX].contents: # Create overall group frame
            s = f'INSERT INTO "main"."Controls" ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(row[1])}", "{str(posX)}", "{str(posY)}", "{str(row[4])}", "{str(row[5])}", "{meterViewId}", "{str(g.name)}", "{str(jId)}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(row[19])}", "{str(row[20])}", "{str(row[21])}", "{str(row[22])}", "{str(row[23])}", "{str(row[24])}", "{str(row[25])}", NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", " ")'
            proj_c.execute(s)

        posY = 40

        for d in g.targetChannels:
            for row in temps[METER_TEMPLATE_INDEX].contents: # Create channel meters
                dname = row[7]
                if dname == "TITLE":
                    dname = d[1]

                # DS10 info is provided on a per device basis and will not work if a channel id is provided
                chId = d[4]
                propType = row[PROPERTY_TYPE_INDEX]
                if (propType == "Input_Digital_TxStream") or (propType == "Input_Digital_DsDataPri") or (propType == "Input_Digital_DsDataSec"):
                    chId = 0

                s = f'INSERT INTO "main"."Controls" ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(row[1])}", "{str(row[2]+posX)}", "{str(row[3]+posY)}", "{str(row[4])}", "{str(row[5])}", "{meterViewId}", "{str(dname)}", "{str(jId)}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(row[19])}", "{str(row[20])}", "{str(row[21])}", "{str(d[3])}", "{str(chId)}", "{str(row[24])}", "{str(row[25])}", NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", " ")'

                proj_c.execute(s)

            posY += METER_SPACING_Y
        posX += METER_GROUP_SPACING
        posY = METER_VIEW_STARTY
        jId += 1

#####################  #####################

dbTemplate.commit()
dbTemplate.close()
dbProj.commit()
dbProj.close()
sys.exit()

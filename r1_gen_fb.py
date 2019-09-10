import sqlite3
import tkinter
import tkinter as tk
import tkinter.ttk as ttk
from tkinter.filedialog import askopenfilename
import shutil
import sys


ctrlStr = 'INSERT INTO "main"."Controls" ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") '

#CLASS OVERVIEW
#class Channel:
 # def __init__(GroupId, name):
#    self.GroupId = GroupId
#    self.name = name

class Group:
    def __init__(self, groupId, name):
        self.groupId = groupId
        self.name = name
        self.viewId = None
        self.groupIdSt = []

    @property
    def viewId(self):
        return self._viewId

    @viewId.setter
    def viewId(self, value):
        self._viewId = value

# Get group names and file from user
views = []
#txt = input("Enter group names (seperate with a comma):")
#groups = txt.split(",")
#for g in groups:
#    views.append([g])
#filename = askopenfilename()
#filenameNew = filename.rsplit( ".", 1 )[ 0 ]+"_modified.dbpr"
#shutil.copyfile(filename, filenameNew)
#filename = filenameNew
filename = "r1.dbpr"

# SQL Setup
dbTemplate = sqlite3.connect('templates.r2t')
dbProj = sqlite3.connect(filename)
template_c = dbTemplate.cursor()
proj_c = dbProj.cursor()

# Load template
template_c.execute('SELECT DISTINCT JoinedId FROM "main"."Controls" ORDER BY JoinedId ASC')
rtn  = template_c.fetchall()
temps = []
for row in rtn:
    template_c.execute(f'SELECT * FROM "main"."Controls" WHERE JoinedId = {row[0]}')
    temps.append(template_c.fetchall())




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

for row in temps[0]:
    s = f'INSERT INTO "main"."Controls" ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(row[1])}", "{str(row[2]+429)}", "{str(row[3]+823)}", "{str(row[4])}", "{str(row[5])}", "{overviewId}", "{str(row[7])}", "{str(row[9])}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(row[19])}", "{str(row[20])}", "{str(row[21])}", "{str(masterId)}", "{str(row[23])}", "{str(row[24])}", "{str(row[25])}", NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", " ")'
    proj_c.execute(s)




# Auto-Find Group ids and names
proj_c.execute('SELECT "GroupId" FROM "main"."Groups" ORDER BY "GroupId" ASC LIMIT 3')
priGrpId = proj_c.fetchall()[1][0]
groups = []
rtn = proj_c.execute(f'SELECT * FROM "main"."Groups" WHERE "ParentId" = {priGrpId}')

for row in rtn:
    print(row[0])
    groups.append(Group(row[0], row[1])) #First is GroupId, second is Name


for i in range(len(groups)): # Determine stereo (Main L/R) and mono groups + get view ids
    proj_c.execute(f'SELECT "ViewId" FROM "main"."Views" WHERE Name = "{groups[i].name}" ORDER BY ViewId ASC LIMIT 1;') # Get view IDs
    print(f'SELECT "ViewId" FROM "main"."Views" WHERE Name = "{groups[i].name}" ORDER BY ViewId ASC LIMIT 1;')
    rtn = proj_c.fetchone()
    print(rtn)
    try:
        groups[i].viewId = rtn[0]
    except:
        print(f"Could not find view for {groups[i].name} group. Exiting.")
        sys.exit();

    # Find any L/R subgroups
    proj_c.execute(f'SELECT * FROM "main"."Groups" WHERE "Name" = "{groups[i].name + " TOPs L"}"')
    try:
        rtn = proj_c.fetchone()[0]
        groups[i].groupIdSt.append(rtn)
    except:
        print(f"No TOPs L goup found for {groups[i].name} group.")

    proj_c.execute(f'SELECT * FROM "main"."Groups" WHERE "Name" = "{groups[i].name + " TOPs R"}"')
    try:
        rtn = proj_c.fetchone()[0]
        groups[i].groupIdSt.append(rtn)
    except:
        print(f"No TOPs R goup found for {groups[i].name} group.")

    proj_c.execute(f'SELECT * FROM "main"."Groups" WHERE "Name" = "{groups[i].name + " SUBs L"}"')
    try:
        rtn = proj_c.fetchone()[0]
        groups[i].groupIdSt.append(rtn)
    except:
        print(f"No TOPs L goup found for {groups[i].name} group.")

    proj_c.execute(f'SELECT * FROM "main"."Groups" WHERE "Name" = "{groups[i].name + " SUBs R"}"')
    try:
        rtn = proj_c.fetchone()[0]
        groups[i].groupIdSt.append(rtn)
    except:
        print(f"No TOPs R goup found for {groups[i].name} group.")

    # Delete input routing views
    proj_c.execute(f'SELECT "JoinedId" FROM "main"."Controls" WHERE DisplayName = "Input Routing" AND ViewId = "{groups[i].viewId}"')
    try:
        for row in proj_c.fetchall():
            proj_c.execute(f'DELETE FROM "main"."Controls" WHERE JoinedId = {row[0]};')
    except:
        print("Could not find input routing info for Main L/R")

    posX = 0
    posY = 0
    if len(groups[i].groupIdSt) > 0: #Stero group
        template = temps[1]
        posX = 485
        posY = 227

        for side in range(2):
            sideText = "Left"
            sideX = 700
            if side == 1:
                sideText = "Right"
                sideX = 770
            for row in temps[2]:
                s = ctrlStr + f'VALUES ("{str(row[1])}", "{str(row[2]+sideX)}", "{str(row[3]+110)}", "{str(row[4])}", "{str(row[5])}", "{groups[i].viewId}", "{str(sideText)}", "{str(row[9])}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(row[19])}", "{str(row[20])}", "{str(row[21])}", "{groups[i].groupIdSt[side]}", "{str(row[23])}", "{str(row[24])}", "{str(row[25])}", NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", " ")'
                proj_c.execute(s)

    elif groups[i].name.find("SUB") > -1 and groups[i].name.find("array") > -1: #Subs
        template = temps[3]
        posX = 365
        posY = 117
    else:
        template = temps[3] #Point sources
        posX = 307
        posY = 228

        proj_c.execute(f'SELECT "ControlId" FROM "main"."Controls" WHERE DisplayName = "{groups[i].name} TOPs" ORDER BY ControlId ASC LIMIT 1;')
        cId = proj_c.fetchone()[0]
        proj_c.execute(f'UPDATE "main"."Controls" SET Height = {505} WHERE ControlId = {cId}')

    for row in template:
        s = f'INSERT INTO "main"."Controls" ("Type", "PosX", "PosY", "Width", "Height", "ViewId", "DisplayName", "JoinedId", "LimitMin", "LimitMax", "MainColor", "SubColor", "LabelColor", "LabelFont", "LabelAlignment", "LineThickness", "ThresholdValue", "Flags", "ActionType", "TargetType", "TargetId", "TargetChannel", "TargetProperty", "TargetRecord", "ConfirmOnMsg", "ConfirmOffMsg", "PictureIdDay", "PictureIdNight", "Font", "Alignment", "Dimension") VALUES ("{str(row[1])}", "{str(row[2]+posX)}", "{str(row[3]+posY)}", "{str(row[4])}", "{str(row[5])}", "{groups[i].viewId}", "{str(row[7])}", "{str(row[9])}", "{str(row[10])}", "{str(row[11])}", "{str(row[12])}", "{str(row[13])}", "{str(row[14])}", "{str(row[15])}", "{str(row[16])}", "{str(row[17])}", "{str(row[18])}", "{str(row[19])}", "{str(row[20])}", "{str(row[21])}", "{groups[i].groupId}", "{str(row[23])}", "{str(row[24])}", "{str(row[25])}", NULL, NULL, "{str(row[28])}", "{str(row[29])}", "{str(row[30])}", "{str(row[31])}", " ")'
        proj_c.execute(s)


print("Groups found:")
print(groups)


#Create new view
viewName = "Meters"
viewWidth = 2000
viewHeight = 4000
viewZoom = 100
viewType = 1000
proj_c.execute(f'INSERT INTO "main"."Views"("ViewId","Type","Name","Icon","Flags","HomeViewIndex","NaviBarIndex","HRes","VRes","ZoomLevel","ScalingFactor","ScalingPosX","ScalingPosY","ReferenceVenueObjectId") VALUES (NULL,'+str(viewType)+',"'+viewName+'",NULL,NULL,NULL,NULL,'+str(viewWidth)+','+str(viewHeight)+','+str(viewZoom)+',NULL,NULL,NULL,NULL);')

#proj_c.execute(f'SELECT TargetId FROM "main"."SnapshotValues" WHERE SnapshotId = 1 AND TargetProperty = "Config_InputEnable3" ORDER BY TargetId')
#proj_c.execute(f'SELECT TargetId FROM "main"."SnapshotValues" WHERE SnapshotId = 1 AND TargetProperty = "Config_InputEnable4" ORDER BY TargetId')
#proj_c.execute(f'SELECT TargetId FROM "main"."SnapshotValues" WHERE SnapshotId = 1 AND TargetProperty = "Config_InputEnable5" ORDER BY TargetId')
#proj_c.execute(f'SELECT TargetId FROM "main"."SnapshotValues" WHERE SnapshotId = 1 AND TargetProperty = "Config_InputEnable6" ORDER BY TargetId')



dbTemplate.commit()
dbTemplate.close()
dbProj.commit()
dbProj.close()
sys.exit()

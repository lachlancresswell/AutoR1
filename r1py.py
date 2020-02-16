import sqlite3
import logging

ARRAYCALC_SNAPSHOT = 1 #Snapshot ID
PARENT_GROUP_TITLE = 'AUTO'
INPUT_TYPES = ["A1", "A2", "A3", "A4", "D1", "D2", "D3", "D4"]
ipStr = ["Config_InputEnable1", "Config_InputEnable2", "Config_InputEnable3", "Config_InputEnable4", "Config_InputEnable5", "Config_InputEnable6", "Config_InputEnable7", "Config_InputEnable8"]
TARGET_ID = 3
SUBGROUP = 0
GROUPID = 0
SUBARRAY_GROUP_TEXT = 'Create SUBarray LR group? (y/n)\n(default: y): '
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
    def __init__(self, groupId, name, ap, vId):
        self.groupId = groupId
        self.name = name
        self.viewId = None
        self.groupIdSt = []
        self.AP = ap
        self.viewId = vId

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

# Load project file + get joined id for new entries
class ProjectFile:
    def __init__(self, f):
        self.f = f
        self.db = sqlite3.connect(f);
        self.cursor = self.db.cursor();
        self.pId = 1;
        logging.info('Loaded project - ' + f)

        # Set joinedId start
        self.cursor.execute('SELECT JoinedId from "main"."Controls" ORDER BY JoinedId DESC LIMIT 1')

        try:
            self.jId = self.cursor.fetchone()[0] + 1
            logging.info(f'glJoined - {self.jId}')
        except:
            logging.critical("Views have not been generated. Please run initial setup in R1 first.")


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

        logging.info(f'{len(self.channels)} channels loaded.')
        logging.info(f'{self.channels[0].name}  /  {self.channels[-1].name}')


        #Get ip routing for each channel from ArrayCalc snapshot
        for c in self.channels:
            for s in ipStr:
                self.cursor.execute(f'SELECT * FROM "main"."SnapshotValues" WHERE SnapshotId = {ARRAYCALC_SNAPSHOT} AND TargetId = {c.targetId} AND TargetNode = {c.targetChannel} AND TargetProperty = "{s}" AND Value = 1 ORDER BY TargetId')
                rtn = self.cursor.fetchall()
                c.inputEnable.append(len(rtn));

        logging.info(f'Loaded input routing config for all channels')
        logging.info(f'{self.channels[0].inputEnable[0]}  /  {self.channels[-1].inputEnable[0]}')

        createParentGroup(self);
        createIpGroups(self);
        idontknow(self)

    def close(self):
        self.db.commit()
        self.db.close()

## Create 'Auto' group
# Create group if it does not already exist
def createParentGroup(grp):

    grp.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE Name = "{PARENT_GROUP_TITLE}"')
    try:
        grp.pId = grp.cursor.fetchone()[0]
        logging.info('Found existing AUTO group.')
    except:
        grp.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{PARENT_GROUP_TITLE}",1,0,-1,0,0);')
        grp.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE Name = "{PARENT_GROUP_TITLE}"')
        grp.pId = grp.cursor.fetchone()[0]
        logging.info('Created AUTO group.')

# Creates input relative groups + assign channels
def createIpGroups(grp):
    ## Create groups input groups
    #Delete groups if already existing
    grp.ipGroupId = []
    for s in INPUT_TYPES:
        grp.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE Name = "{s}" AND ParentId = {grp.pId}')
        try:
            rtn = grp.cursor.fetchone()
            logging.info(f'Deleting existing input group: {s} - {rtn[0]}')
            grp.cursor.execute(f'DELETE FROM "main"."Groups" WHERE GroupId = {rtn[0]}')
            grp.cursor.execute(f'DELETE FROM "main"."Groups" WHERE ParentId = {rtn[0]}')
        except:
            logging.info(f'No existing input group found for {s} {grp.pId}')

        grp.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{s}",{grp.pId},0,-1,0,0);')
        grp.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE Name = "{s}"')
        grp.ipGroupId.append(grp.cursor.fetchone()[0])

    # Assign channels to their input group
    for c in grp.channels:
        for i in range(len(c.inputEnable)):
            if c.inputEnable[i] > 0:
                grp.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{c.name}",{grp.ipGroupId[i]},{c.targetId},{c.targetChannel},1,0);')


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
            logging.info(f'Found device - {rtn}')
            return rtn
    return ch


## Populate groups
# Auto-Find Group ids and names
def idontknow(grp):

    # Find Master groupId
    grp.cursor.execute('SELECT "GroupId" FROM "main"."Groups" ORDER BY "GroupId" ASC LIMIT 3')
    masterGroupId = grp.cursor.fetchall()[1][0]
    grp.groups = []
    grp.cursor.execute(f'SELECT * FROM "main"."Groups" WHERE "ParentId" = {masterGroupId}')
    rtn = grp.cursor.fetchall()

    #Cycle through every every source group (Main, Sides .etc which all exist under Master)
    for row in rtn:

        # Find if AP is enable for SourceGroups
        grp.cursor.execute(f'SELECT ArrayProcessingEnable FROM "main"."SourceGroups" WHERE "Name" = "{row[1]}"')
        ap = grp.cursor.fetchone()[0]

        # Find view id for source
        grp.cursor.execute(f'SELECT ViewId FROM "main"."Views" WHERE "Name" = "{row[1]}"')
        vId = grp.cursor.fetchone()[0]
        grp.groups.append(Group(row[0], row[1], ap, vId)) #First is GroupId, second is Name

    # Determine stereo (Main L/R) and mono groups + get view ids
    for i in range(len(grp.groups)):
        g = grp.groups[i]

        grp.groups[i].targetChannels = findDevicesInGroups(grp.cursor, g.groupId)

        grp.cursor.execute(f'SELECT "ViewId" FROM "main"."Views" WHERE Name = "{grp.groups[i].name}" ORDER BY ViewId ASC LIMIT 1;') # Get view IDs
        rtn = grp.cursor.fetchone()
        try:
            grp.groups[i].viewId = rtn[0]
        except:
            logging.info(f"Could not find view for {grp.groups[i].name} group.")

        # Find any L/R or SUB L/R subgroups
        for g in [" TOPs L", " TOPs R", " SUBs L", " SUBs R"]:
            grp.cursor.execute(f'SELECT * FROM "main"."Groups" WHERE "Name" = "{grp.groups[i].name + g}"')
            try:
                rtn = grp.cursor.fetchone()
                grp.groups[i].groupIdSt.append(Group(rtn[0], rtn[1], groups[i].AP, grp.groups[i].viewId))
                grp.groups[i].groupIdSt[-1].targetChannels = findDevicesInGroups(grp.cursor, grp.groups[i].groupIdSt[-1].groupId)
            except:
                logging.info(f"No {g} group found for {grp.groups[i].name} group.")

        if ("sub" in grp.groups[i].name.lower()) and ("array" in grp.groups[i].name.lower()): # Create LR groups for SUBarray
            userIp = " "
            while (userIp != "y") and (userIp != "n") and (userIp != ""):
                userIp = input(SUBARRAY_GROUP_TEXT)

            SUBARRAY_GROUP_TITLE = grp.groups[i].name + " LR"

            if (userIp == "y") or (userIp == ""):
                groupL = []
                groupR = []
                grp.cursor.execute(f'SELECT Name FROM "main"."PatchIOChannels"')
                patchIO = grp.cursor.fetchall()
                ctr = -1
                for tc in grp.groups[i].targetChannels:
                    grp.cursor.execute(f'SELECT Name FROM "main"."Groups" WHERE GroupId = {tc[7]}')
                    rtn = grp.cursor.fetchone()[0]

                    if "R" in rtn:
                        groupR.append(tc)
                    elif "L" in rtn:
                        groupL.append(tc)
                    elif "C" in rtn:
                        if ctr < 0:
                            userIp = " "
                            while (userIp != "l") and (userIp != "r") and (userIp != ""):
                                userIp = input(SUBARRAY_CTR_TEXT)
                            if (userIp == "l") or (userIp == ""):
                                ctr = 0
                            else:
                                ctr = 1
                        if ctr == 1:
                            groupR.append(tc)
                        else:
                            groupL.append(tc)

                if len(groupL) > 0 and len(groupR) > 0:
                    ## Create SUBarray LR group
                    # If group already exists, delete and then recreate with new device list
                    grp.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE Name = "{SUBARRAY_GROUP_TITLE}" AND ParentId = "{grp.pId}"')
                    try:
                        pId = grp.cursor.fetchone()[0]

                        grp.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE ParentId = "{pId}"') #Get L+R groups
                        rtn = grp.cursor.fetchall()
                        logging.info(f'Deleting existing SUBarray groups - {pId} - {rtn[0][0]} / {rtn[1][0]}')
                        grp.cursor.execute(f'DELETE FROM "main"."Groups" WHERE GroupId = {pId};')
                        for row in rtn:
                            grp.cursor.execute(f'DELETE FROM "main"."Groups" WHERE ParentId = {row[0]};')
                            grp.cursor.execute(f'DELETE FROM "main"."Groups" WHERE GroupId = {row[0]};')
                    except:
                        logging.info(f'No existing {grp.groups[i].name} LR groups found.')

                    grp.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{SUBARRAY_GROUP_TITLE}",{grp.pId},0,-1,0,0);')
                    grp.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE Name = "{SUBARRAY_GROUP_TITLE}"')
                    pId = grp.cursor.fetchone()[0]

                    gStr = [grp.groups[i].name+" L", grp.groups[i].name+" R"]
                    g = groupL
                    for s in gStr:
                        grp.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{s}",{pId},0,-1,0,0);')
                        grp.cursor.execute(f'SELECT * FROM "main"."Groups" WHERE "Name" = "{s}"')
                        rtn = grp.cursor.fetchone()

                        for tc in g:
                            grp.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{tc[1]}",{rtn[0]},{tc[3]},{tc[4]},1,0);')

                        grp.groups[i].groupIdSt.append(Group(rtn[0], rtn[1], grp.groups[i].AP, grp.groups[i].viewId))
                        grp.groups[i].groupIdSt[-1].targetChannels = findDevicesInGroups(grp.cursor, grp.groups[i].groupIdSt[-1].groupId)

                        g = groupR

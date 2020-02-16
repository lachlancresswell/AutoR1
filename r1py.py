import sqlite3
import logging

ARRAYCALC_SNAPSHOT = 1 #Snapshot ID
PARENT_GROUP_TITLE = 'AUTO'
INPUT_TYPES = ["A1", "A2", "A3", "A4", "D1", "D2", "D3", "D4"]
ipStr = ["Config_InputEnable1", "Config_InputEnable2", "Config_InputEnable3", "Config_InputEnable4", "Config_InputEnable5", "Config_InputEnable6", "Config_InputEnable7", "Config_InputEnable8"]

# Used for a template contained in a template file
class Template:
    def __init__(self, name):
        self.name = name
        self.joinedId = 0
        self.contents = []

    def print(self):
        logging.info(f'{self.name} - JoinedId: {self.joinedId} - Contents Length: {len(self.contents)}')

class Channel:
    def __init__(self, targetId, targetChannel):
        self.targetId = targetId
        self.targetChannel = targetChannel
        self.inputEnable = []
        self.name = "name"

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

        createProjGroups(self);

    def close(self):
        self.db.commit()
        self.db.close()


def createProjGroups(grp):
    ## Create 'Auto' group
    # Create group if it does not already exist
    grp.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE Name = "{PARENT_GROUP_TITLE}"')
    try:
        grp.pId = grp.cursor.fetchone()[0]
        logging.info('Found existing AUTO group.')
    except:
        grp.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{PARENT_GROUP_TITLE}",1,0,-1,0,0);')
        grp.cursor.execute(f'SELECT GroupId FROM "main"."Groups" WHERE Name = "{PARENT_GROUP_TITLE}"')
        grp.pId = grp.cursor.fetchone()[0]
        logging.info('Created AUTO group.')

    ## Create groups
    #Delete groups if already existing
    ipGroupId = [0,0,0,0,0,0,0,0]
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
                grp.cursor.execute(f'INSERT INTO "main"."Groups"("Name","ParentId","TargetId","TargetChannel","Type","Flags") VALUES ("{c.name}",{ipGroupId[i]},{c.targetId},{c.targetChannel},1,0);')

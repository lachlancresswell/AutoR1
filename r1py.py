import sqlite3
import logging
from abc import ABCMeta

SRC_TYPE_SUBARRAY = 3

CTRL_FRAME = 12
CTRL_METER = 7
CTRL_BUTTON = 4
CTRL_INPUT = 3

IPCONFIG_DEFAULT = [0, 0, 0, 0, 0, 0, 0, 0]

ARRAYCALC_SNAPSHOT = 1  # Snapshot ID
INPUT_TYPES = ["A1", "A2", "A3", "A4", "D1", "D2", "D3", "D4"]
ipStr = ["Config_InputEnable1", "Config_InputEnable2", "Config_InputEnable3", "Config_InputEnable4",
         "Config_InputEnable5", "Config_InputEnable6", "Config_InputEnable7", "Config_InputEnable8"]
TARGET_ID = 3


DEV_PROP_TYPES = [
    'Status_SmpsFrequency', 'Status_MainsPowerPeak', 'Status_SmpsVoltage', 'Status_SmpsTemperature', 'Status_LockMode', 'Status_StatusText', 'Status_PwrOk', 'Settings_Buzzer', 'Settings_DeviceName', 'Settings_InputGainEnable', 'Settings_LockCmd', 'Settings_MCLEnable', 'Settings_PwrOn', 'Input_Analog_Gain', 'Input_Digital_Gain', 'Input_Digital_Mode', 'Input_Digital_Sync', 'Input_Digital_SampleStatus', 'Input_Digital_DsDataPri', 'Input_Digital_DsDataSec', 'Input_Digital_TxStream', 'Error_GnrlErr', 'Error_SmpsTempOff', 'Error_SmpsTempWarn']


##### An R1 SQL File (.dbpr project file or .r1t template file) #####
class R1db(object):
    __metaclass__ = ABCMeta

    def __init__(self, f):
        self.f = f
        self.db = sqlite3.connect(f)
        self.cursor = self.db.cursor()
        logging.info('Loaded file - ' + f)

    def close(self):
        self.db.commit()
        self.db.close()


### Load template file + templates within from .r2t file ###
# Sections table contains template overview info
class TemplateFile(R1db):
    def __init__(self, f):
        super().__init__(f)  # Inherit from parent class
        self.templates = []

        try:
            self.cursor.execute(
                'SELECT * FROM "main"."Sections" ORDER BY JoinedId ASC')
        except:
            raise

        templates = self.cursor.fetchall()

        logging.info(f'Found {len(templates)} templates in file.')

        for idx, temp in enumerate(templates):
            joinedId = temp[3]
            self.cursor.execute(
                f'SELECT * FROM Controls WHERE JoinedId = {joinedId}')  # Load controls
            controls = self.cursor.fetchall()

            self.templates.append(Template(temp, controls))
            logging.info(
                f'Loaded template - {idx} / {self.templates[-1].name}')


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


# Load project file + get joined id for new entries
class ProjectFile(R1db):

    def getGroupCount(self):
        self.cursor.execute(
            f"SELECT * FROM Groups")
        return len(self.cursor.fetchall())

    # Find if inital R1 setup has been run
    def __initCheck(self):
        self.cursor.execute(
            f"SELECT * FROM sqlite_master WHERE name ='Groups' and type='table'")
        if self.cursor.fetchone() is None:
            print(
                f'Could not find Groups table. Run R1 initial setup before using AutoR1.')
            return -1
        self.cursor.execute(
            f"SELECT * FROM sqlite_master WHERE name ='Views' and type='table'")
        if self.cursor.fetchone() is None:
            print(
                f'Could not find Views table. Run R1 initial setup before using AutoR1.')
            return -1
        self.cursor.execute(
            f"SELECT * FROM Groups WHERE GroupId = 1 or ParentId = 1")
        rtn = self.cursor.fetchall()
        if rtn is None or len(rtn) < 3:
            print(
                f'Could not find default groups. Run R1 initial setup before using AutoR1.')
            return -1

        return 1

    def deleteGroup(self, groupID):
        """Delete an item and any children from the group table

        Args:
            gId (int): GroupID to delete
        """
        self.cursor.execute(
            f'SELECT GroupId FROM Groups WHERE ParentId = {groupID}')
        children = self.cursor.fetchall()
        for child in children:
            self.deleteGroup(child[0])

        # Logging
        self.cursor.execute(
            f'SELECT Name FROM Groups WHERE GroupId = {groupID}')
        name = self.cursor.fetchone()[0]
        self.cursor.execute(
            f'SELECT ParentId FROM Groups WHERE GroupId = {groupID}')
        pId = self.cursor.fetchone()[0]
        self.cursor.execute(
            f'SELECT Name FROM Groups WHERE GroupId = {pId}')
        pName = self.cursor.fetchone()[0]
        logging.info(f'Deleting from groups - {groupID}')
        print(f'Deleting {name} from {pName}')

        self.cursor.execute(
            f'DELETE FROM Groups WHERE GroupId = {groupID}')

    def __init__(self, f):
        super().__init__(f)  # Inherit from parent class
        self.mId = 0
        self.meterViewId = -1
        self.masterViewId = -1
        self.subArray = []
        self.pId = -1
        self.groups = []
        self.sourceGroups = []

        if self.__initCheck() < 0:
            raise ValueError('Initial R1 setup not')

        self.mId = self.getMasterID()
        self.getNextJoinedID()

    def getMasterID(self):
        """Find GroupID of the default Master group

        Raises:
            RuntimeError: Master group cannot be found

        Returns:
            int: GroupID of Master group
        """
        self.cursor.execute(
            'SELECT "GroupId" FROM Groups WHERE "ParentId" = 1 AND "Name" = "Master"')
        rtn = self.cursor.fetchone()
        if rtn is None:
            raise RuntimeError('Cannot find Master group')
        return rtn[0]

    def getNextJoinedID(self):
        """Set the next valid JoinedID

        Raises:
            RuntimeError: Initial R1 setup hasn't been ran as no controls are not present
        """

        self.cursor.execute(
            'SELECT JoinedId from Controls ORDER BY JoinedId DESC LIMIT 1')
        rtn = self.cursor.fetchone()
        if rtn is not None:
            self.jId = rtn[0] + 1
        else:
            raise RuntimeError(
                "Views have not been generated. Please run initial setup in R1 first.")

    def createGrp(self, title, parentId=1, targetId=0, targetChannel=-1, type=0, flags=0):
        """Enter a group or an amp channel into the group table

        Args:
            title (string): Title for item
            parentId (int, optional): Parent groupId to put new group under. Defaults to 1 .
            targetId (int, optional): Device ID if entering channel. Defaults to 0.
            targetChannel (int, optional): Amp channel if entering a channel, -1 if entering a group. Defaults to -1.
            type (int, optional): 0 if creating group, 1 if entering channel. Defaults to 0.
            flags (int, optional): Unsure. 'Groups' group is always 1, all others are 0. Likely determines a permanent item. Defaults to 0.

        Returns:
            int: GroupID of the new item
        """
        self.cursor.execute(
            f'  INSERT INTO Groups (Name, ParentId, TargetId, TargetChannel, Type, Flags)'
            f'  SELECT "{title}", {parentId}, {targetId}, {targetChannel}, {type}, {flags}')

        self.cursor.execute(
            f'SELECT * FROM Groups ORDER BY GroupId DESC LIMIT 1;')
        groupId = self.cursor.fetchone()

        # Get parent name for logging
        self.cursor.execute(
            f'SELECT Name FROM Groups WHERE GroupId = {parentId}')
        pName = self.cursor.fetchone()[0]
        print(f'Inserted {title} under {pName}')
        logging.info(f'Inserted {title} under {pName}')

        return groupId

    def getGroupIdFromName(self, name):
        """Get GroupIDs of groups matching provided name

        Args:
            name (string): name of group(s) to find

        Raises:
            RuntimeError: Group cannot be found

        Returns:
            [int]: array of GroupIDs of matching groups
        """
        self.cursor.execute(
            f'SELECT GroupId FROM Groups WHERE Name = "{name}"')

        rtn = self.cursor.fetchone()
        if rtn is None:
            raise RuntimeError('Could not find group')
        return rtn

    def getViewIdFromName(self, name):
        """Get a View's ViewID from it's name

        Args:
            name (string): Name of View to retrieve ID for

        Raises:
            RuntimeError: View cannot be found

        Returns:
            int: Retrieved ViewId
        """
        self.cursor.execute(f'SELECT ViewId FROM Views WHERE Name = "{name}"')

        try:
            rtn = self.cursor.fetchone()
            return rtn[0]
        except:
            raise RuntimeError('View not found')

import logging
import sqlite3
import sys
import os
import pytest
import r1py.r1py as r1
import autor1.autor1 as autor1
from shutil import copyfile

TEMP_FILE = "./dist/templates.r2t"


# 0 - File to test
# 1 - Number of columns expected in meter window
# 2 - Number of meters expected in master window
# 3 - If AP is enabled
# 4 - Number of SUB array groups (L/R/C)
PROJECTS = [
    ("test_init_AP.dbpr", 15, 23, 1, 3),
    ("test_init.dbpr", 15, 23, 0, 3),
    ("test_init_2.dbpr", 14, 25, 0, 1),
    ("AC10.16 default.dbpr", 4, 7, 0, 2),
]


# Before all tests
@pytest.fixture(scope="session", autouse=True)
def beforeAll(request):
    autor1.log.setLevel(logging.DEBUG)


@pytest.fixture(scope="module", params=PROJECTS)
def testConfig(request):
    path = "./Projects/" + request.param[0]
    dirtyPath = "./Projects/Output/" + request.param[0] + "-dirty.dbpr"
    cleanPath = "./Projects/Output/" + request.param[0] + "-clean.dbpr"
    try:
        os.mkdir("./Projects/Output/", 0o777)
    except:
        pass

    copyfile(path, dirtyPath)

    proj = r1.ProjectFile(dirtyPath)
    proj.dirtyPath = dirtyPath
    proj.cleanPath = cleanPath
    proj.expectedMasterItems = request.param[1]
    proj.expectedMeterItems = request.param[2]
    return request.param + (proj,)


@pytest.mark.order(1)
def test_loadTemplateFailure():
    with pytest.raises(Exception):
        autor1.TemplateFile("./tempilates.r2t")


@pytest.mark.order(2)
def test_loadTemplateSuccess():
    template = autor1.TemplateFile(TEMP_FILE)
    assert type(template) is autor1.TemplateFile


@pytest.mark.order(3)
def test_getHighestGroupID(testConfig):
    loadedProject = testConfig[-1]
    assert loadedProject.getHighestGroupID() > 10


@pytest.mark.order(4)
def test_getSrcGroupType(testConfig):
    loadedProject = testConfig[-1]
    # non-existing group
    with pytest.raises(Exception):
        loadedProject.getSourceGroupNameFromId(-1)

    # non-existing group
    with pytest.raises(Exception):
        autor1.getSrcGroupType(loadedProject, -1)

    # All existing groups
    for id in loadedProject.getSourceGroupIds():
        name = loadedProject.getSourceGroupNameFromId(id)
        assert autor1.getSrcGroupType(loadedProject, name) >= 1000


@pytest.mark.order(5)
def test_getApStatus(testConfig):
    loadedProject = testConfig[-1]

    with pytest.raises(Exception):
        autor1.getApStatus(loadedProject)

    loadedProject.pId = loadedProject.createGrp(autor1.PARENT_GROUP_TITLE, 1)[0]
    autor1.createSubLRCGroups(loadedProject)
    autor1.getSrcGrpInfo(loadedProject)
    assert autor1.getApStatus(loadedProject) is testConfig[3]


@pytest.mark.order(6)
def test_hasSubGroups(testConfig):
    loadedProject = testConfig[-1]

    loadedProject.pId = loadedProject.createGrp(autor1.PARENT_GROUP_TITLE, 1)[0]
    autor1.createSubLRCGroups(loadedProject)
    assert autor1.hasSubGroups(loadedProject) == testConfig[4]


@pytest.mark.order(7)
def test_masterViewMeters(testConfig):
    loadedProject = testConfig[-1]
    template = autor1.TemplateFile(TEMP_FILE)

    loadedProject.pId = loadedProject.createGrp(autor1.PARENT_GROUP_TITLE, 1)[0]
    autor1.createSubLRCGroups(loadedProject)
    autor1.getSrcGrpInfo(loadedProject)
    autor1.configureApChannels(loadedProject)

    autor1.createMeterView(loadedProject, template)
    autor1.createMasterView(loadedProject, template)
    autor1.createNavButtons(loadedProject, template)

    for id, srcGrpIndex in loadedProject.masterJoinedIDs:
        loadedProject.cursor.execute(
            f"SELECT TargetId, TargetType FROM Controls WHERE JoinedID = {id}"
        )
        controls = loadedProject.cursor.fetchall()
        if controls is not None:
            for TargetId, TargetType in controls:
                srcGrp = loadedProject.sourceGroups[srcGrpIndex]
                channelGroupIDs = []
                for channel in srcGrp.channelGroups:
                    channelGroupIDs.append(channel.groupId)
                if TargetType == r1.CONTROLS_TargetType_Group:
                    assert TargetId in channelGroupIDs


@pytest.mark.order(8)
def test_cleanProjectFile(testConfig):
    loadedProject = testConfig[-1]
    template = autor1.TemplateFile(TEMP_FILE)

    assert type(loadedProject) is r1.ProjectFile
    assert type(template) is autor1.TemplateFile

    initGrpCount = loadedProject.getGroupCount()

    loadedProject.pId = loadedProject.createGrp(autor1.PARENT_GROUP_TITLE, 1)[0]
    autor1.createSubLRCGroups(loadedProject)
    autor1.getSrcGrpInfo(loadedProject)
    autor1.configureApChannels(loadedProject)

    autor1.createMeterView(loadedProject, template)
    autor1.createMasterView(loadedProject, template)
    autor1.createNavButtons(loadedProject, template)

    queries = [
        # Master view
        f'SELECT * FROM Views WHERE "Name" = "{autor1.MASTER_WINDOW_TITLE}"',
        # Meter view
        f'SELECT * FROM Views WHERE "Name" = "{autor1.METER_WINDOW_TITLE}"',
        # AutoR1 group
        f'SELECT * FROM Groups WHERE Name = "{autor1.PARENT_GROUP_TITLE}"',
        # Nav controls
        f"SELECT * FROM Controls WHERE TargetId = {loadedProject.masterViewId}",
        # Master view controls
        f"SELECT * FROM Controls WHERE ViewId = {loadedProject.masterViewId}",
        # Meter view controls
        f"SELECT * FROM Controls WHERE ViewId = {loadedProject.meterViewId}",
    ]

    for q in queries:
        loadedProject.cursor.execute(q)
        assert loadedProject.cursor.fetchone() is not None

    masterGroups = 0
    meterGroups = 0
    for groupId in loadedProject.getSourceGroupIds(True):
        srcGrpType = autor1.getSrcGroupType(loadedProject, groupId)
        srcGrpType = str(srcGrpType)
        if int(srcGrpType[3]):  # SUBs
            masterGroups += 1
            meterGroups += 1 + int(srcGrpType[1])
        if int(srcGrpType[2]):  # TOPs
            masterGroups += 1
            meterGroups += 1 + int(srcGrpType[1])
        # Point source without SUBs or TOPs
        if (
            int(srcGrpType[3]) == 0
            and int(srcGrpType[2]) == 0
            and int(srcGrpType[0]) == 2
        ):
            masterGroups += 1
            meterGroups += 1
        if int(srcGrpType[0]) == 4:  # Device only
            masterGroups += 1
            meterGroups += 1

    assert len(loadedProject.masterJoinedIDs) == masterGroups
    assert len(loadedProject.masterJoinedIDs) == testConfig[1]
    assert len(loadedProject.meterJoinedIDs) == meterGroups
    assert len(loadedProject.meterJoinedIDs) == testConfig[2]

    loadedProject.close()
    copyfile(loadedProject.dirtyPath, loadedProject.cleanPath)

    cleanProj = r1.ProjectFile(loadedProject.cleanPath)
    cleanProj.pId = loadedProject.pId

    autor1.clean(cleanProj)

    postGrpCount = cleanProj.getGroupCount()
    assert postGrpCount == initGrpCount

    for q in queries:
        cleanProj.cursor.execute(q)
        assert cleanProj.cursor.fetchone() is None

    cleanProj.close()

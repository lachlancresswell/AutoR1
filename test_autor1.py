import logging
import sqlite3
import sys
import pytest
import r1py as r1
import autor1
from shutil import copyfile

TEMP_FILE = './templates.r2t'
DIRTY_FILE = './dirty.dbpr'
CLEAN_FILE = './clean.dbpr'
TEST_FILE = './TEST.dbpr'
UNSET_FILE = './test_unset.dbpr'
UNINITIALISED_FILE = './uninitialised.dbpr'


# Before all tests
@pytest.fixture(scope="session", autouse=True)
def do_something(request):
    autor1.log.setLevel(logging.DEBUG)


@pytest.fixture(scope="module")
def loadedProject():
    copyfile(TEST_FILE, DIRTY_FILE)
    return r1.ProjectFile(DIRTY_FILE)


def test_loadTemplateFailure():
    with pytest.raises(Exception):
        autor1.TemplateFile('./tempilates.r2t')


def test_loadTemplateSuccess():
    template = autor1.TemplateFile(TEMP_FILE)
    assert type(template) is autor1.TemplateFile


def test_cleanProjectFile(loadedProject):
    template = autor1.TemplateFile(TEMP_FILE)

    assert type(loadedProject) is r1.ProjectFile
    assert type(template) is autor1.TemplateFile

    initGrpCount = loadedProject.getGroupCount()

    loadedProject.pId = loadedProject.createGrp(
        autor1.PARENT_GROUP_TITLE, 1)[0]
    autor1.setSrcGrpInfo(loadedProject)
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
        f'SELECT * FROM Controls WHERE TargetId = {loadedProject.masterViewId}',
        # Master view controls
        f'SELECT * FROM Controls WHERE ViewId = {loadedProject.masterViewId}',
        # Meter view controls
        f'SELECT * FROM Controls WHERE ViewId = {loadedProject.meterViewId}',
    ]

    for q in queries:
        loadedProject.cursor.execute(q)
        assert loadedProject.cursor.fetchone() is not None

    loadedProject.close()
    copyfile(DIRTY_FILE, CLEAN_FILE)

    cleanProj = r1.ProjectFile(CLEAN_FILE)
    cleanProj.pId = loadedProject.pId
    cleanProj = autor1.clean(
        cleanProj, loadedProject.masterViewId, loadedProject.meterViewId)
    postGrpCount = cleanProj.getGroupCount()
    assert postGrpCount == initGrpCount

    for q in queries:
        cleanProj.cursor.execute(q)
        assert cleanProj.cursor.fetchone() is None

    cleanProj.close()

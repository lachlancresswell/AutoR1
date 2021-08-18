import logging
import sqlite3
import sys
import pytest
import r1py.r1py as r1
from shutil import copyfile

TEMP_FILE = './dist/templates.r2t'
TEST_FILE = './Projects/test_init.dbpr'
TEST_FILE_NO_INIT = './Projects/test_no_init.dbpr'

# Before all tests


@pytest.fixture(scope="session", autouse=True)
def beforeAll(request):
    r1.log.setLevel(logging.DEBUG)


@pytest.fixture(scope="module")
def loadedProject():
    return r1.ProjectFile(TEST_FILE)


@pytest.fixture(scope="module")
def uninitialisedProject():
    return r1.ProjectFile(TEST_FILE_NO_INIT)


def test_loadProjectFailure():
    with pytest.raises(Exception):
        r1.ProjectFile('./tempilates.r2t')


def test_loadProjectSuccess():
    assert type(r1.ProjectFile(TEST_FILE)) is r1.ProjectFile


def test_isInitialised(loadedProject, uninitialisedProject):
    assert uninitialisedProject.isInitialised() < 1
    assert loadedProject.isInitialised() == 1


def test_getViewIdFromName(loadedProject):
    with pytest.raises(RuntimeError):
        loadedProject.getViewIdFromName("abcd")
    assert loadedProject.getViewIdFromName("Overview") >= 1000


def test_getGroupIdFromName(loadedProject):
    with pytest.raises(RuntimeError):
        loadedProject.getGroupIdFromName("abcd")
    assert loadedProject.getGroupIdFromName("Left/Right")[0] >= 3


def test_getNextJoinedID(loadedProject):
    loadedProject.getNextJoinedID()
    assert loadedProject.jId >= 1


def test_getMasterID(loadedProject):
    id = loadedProject.getMasterID()
    assert id >= 1


def test_deleteGroup(loadedProject):
    groupId = loadedProject.getGroupIdFromName("Left/Right")[0]
    assert groupId > 1
    loadedProject.deleteGroup(groupId)
    with pytest.raises(RuntimeError):
        loadedProject.getGroupIdFromName("Left/Right")


def test_getGroupCount(loadedProject):
    assert loadedProject.getGroupCount() > 10

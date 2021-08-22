#!/usr/bin/env python
import sys
import os
from shutil import copyfile
from datetime import datetime
import platform
import r1py.r1py as r1
import autor1.autor1 as autor1
import logging
import traceback

############################## CONSTANTS ##############################
LOGDIR = "./LOGS/"
TEMP_FILE = "./templates.r2t"

############################## FUNCTIONS ##############################


def checkFile(path):
    try:
        f = open(path, "r")
        f.close()
    except IOError:
        return False
    return True


############################## LOGGING #############################
# Ensure exceptions are logged


def main():
    dateTimeObj = datetime.now()

    if not os.path.exists(LOGDIR):
        os.makedirs(LOGDIR)
    timestamp = dateTimeObj.strftime("%d-%b-%Y-%H-%M-%S")
    logfn = LOGDIR + timestamp + "-autor1log.txt"
    with open(logfn, "w"):
        pass

    if not checkFile(logfn):
        print(f"Could not access {logfn}")
    logging.basicConfig(filename=logfn, level=logging.INFO)
    autor1.log.removeHandler(logging.StreamHandler(sys.stdout))
    log = logging.getLogger(__name__)

    def exceptionHandler(type, value, tb):
        log.exception("Uncaught exception: {0}".format(str(value)))
        print("Uncaught exception: {0}".format(str(value)))
        sys.exit(1)

    # Install exception handler
    sys.excepthook = exceptionHandler

    ############################## START ##############################

    # Clear screen, ensure correct cmd for OS + set CWD if on Mac
    if platform.system() == "Windows":
        os.system("cls")
    else:
        os.system("clear")
        try:
            os.chdir(sys.argv[1] + "/")
        except:
            print("Could not get current working directory.")

    log.info("Sys Args:")
    for a in sys.argv:
        log.info(f"{a}")
    log.info(f"cwd - {os.getcwd()}")
    ##########################################################################################

    print("**AutoR1**")

    projects = []
    projects += [
        each
        for each in os.listdir("./")
        if each.endswith(".dbpr") and "_AUTO" not in each
    ]

    print(f"Found {len(projects)} projects in folder.")

    if not checkFile(TEMP_FILE):
        print(f"Could not access {TEMP_FILE}")
        sys.exit(1)
    else:
        tempFile = autor1.TemplateFile(TEMP_FILE)

    status = 0
    for projectPath in projects:
        autoPath = os.path.splitext(projectPath)[0] + "_AUTO.dbpr"

        copyfile(projectPath, autoPath)

        if not checkFile(autoPath):
            print(f"Could not access {autoPath}")
            status = 1

        projFile = r1.ProjectFile(autoPath)
        if projFile.isInitialised():
            autor1.clean(projFile)
            projFile.pId = projFile.createGrp(autor1.PARENT_GROUP_TITLE, 1)[0]
            autor1.createSubLRCGroups(projFile)
            autor1.getSrcGrpInfo(projFile)
            autor1.configureApChannels(projFile)
            autor1.createMeterView(projFile, tempFile)
            autor1.createMasterView(projFile, tempFile)
            autor1.createNavButtons(projFile, tempFile)
            autor1.addSubCtoSubL(projFile)
            print(f"Finished generating views, controls and groups for {autoPath}.")
        else:
            os.remove(autoPath)
            print(
                f"Initial setup has not been run for {projectPath}. Open the file in R1 and perform the initial group and view creation process first, save and then re-run AutoR1."
            )
            status = 1

        projFile.close()

    tempFile.close()
    sys.exit(status)


if __name__ == "__main__":
    main()

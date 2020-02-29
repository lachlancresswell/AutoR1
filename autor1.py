import sqlite3
import sys
import os
from shutil import copyfile
from datetime import datetime
import platform
import traceback
import r1py as r1
import logging

logging.getLogger().setLevel(logging.INFO)

############################## CONSTANTS ##############################
LOGDIR = 'LOGS/'
PROJ_FILE = 'r1.dbpr'
MOD_FILE = 'R1_AUTO.dbpr'
TEMP_FILE = 'templates.r2t'


####################### CLASSES  ##############################

class Transcript(object):

    def __init__(self, filename):
        self.terminal = sys.stdout
        self.logfile = open(filename, "a")

    def log(self, message):
        if isinstance(message, tuple):
            s = '('
            for m in message:
                s += f'{m}, '
            s += ')'
        else:
            s = message
        self.logfile.write(s)

    def write(self, message):
        self.terminal.write(message)
        self.log(message)

    def flush(self):
        # this flush method is needed for python 3 compatibility.
        # this handles the flush command by doing nothing.
        # you might want to specify some extra behavior here.
        pass


def start(filename, ts):
    """Start transcript, appending print output to given filename"""
    sys.stdout = ts#Transcript(filename)

def stop():
    """Stop transcript and return print functionality to normal"""
    sys.stdout.logfile.close()
    sys.stdout = sys.stdout.terminal



##########################################################################################





############################## METHODS ##############################

def checkFile(path):
    try:
        f = open(path, 'r')
        f.close()
    except IOError:
        return False
    return True

def log_except_hook(*exc_info):
    text = "".join(traceback.format_exception(*exc_info))
    print(f"Unhandled exception: {text}")

sys.excepthook = log_except_hook


##########################################################################################


############################## GLOBALS ##############################

dateTimeObj = datetime.now()

if platform.system() == 'Windows':
    os.system('cls')
else:
    os.system('clear')
    try:
        os.chdir(sys.argv[1]+'/')
    except:
        print('Could not get current working directory.')

LOGDIR = './'+LOGDIR
PROJ_FILE = './'+PROJ_FILE
MOD_FILE = './'+MOD_FILE
TEMP_FILE = './'+TEMP_FILE

#Start logging
if not os.path.exists(LOGDIR):
    os.makedirs(LOGDIR)
timestamp = dateTimeObj.strftime("%d-%b-%Y-%H-%M-%S")
logfn = LOGDIR+timestamp+'-autor1log.txt'
transcript = Transcript(logfn)
start(logfn, transcript)
if not checkFile(logfn):
    print(f'Could not access {logfn}')
logging.info('Sys Args:')
for a in sys.argv:
    logging.info(f'{a}')
logging.info(f'cwd - {os.getcwd()}')
##########################################################################################

print('**AutoR1**\n')

if not checkFile(PROJ_FILE):
    print(f'Could not access {PROJ_FILE}')
    sys.exit()

if not checkFile(TEMP_FILE):
    print(f'Could not access {TEMP_FILE}')
    sys.exit()

# Janky but simplifies deployment for the moment
copyfile(PROJ_FILE, MOD_FILE)

if not checkFile(MOD_FILE):
    print(f'Could not access {MOD_FILE}')
    sys.exit()

# SQL Setup
templates = r1.TemplateFile(TEMP_FILE)
project = r1.ProjectFile(MOD_FILE, templates)

r1.createParentGroup(project);
r1.createIpGroups(project);
r1.createSrcGroups(project)
#r1.createFbControls(project, templates);
r1.createMeterView(project, templates);
r1.createMasterView(project, templates);


###############################################################


print("Finished generating views, controls and groups.")
templates.close();
project.close();
sys.exit()

v1.7.0

# AutoR1 ![Travis CI build status](https://travis-ci.com/lachyc/AutoR1.svg?branch=master)

Automatically generate metering, fallback controls, DS data displays and more for your d&b R1 projects.

## Download
**[Link](https://github.com/lachyc/AutoR1/releases)**

## Screenshots
**Master View**
![Master View](https://i.imgur.com/owTAui2.png)

**Meter View**
![Meter View](https://i.imgur.com/lwmrZE1.png)

## Using AutoR1
1. Ensure you have run the R1 initial setup on your project to generate all standard views and groups and have saved.
2. Download and unzip AutoR1.
3. Copy one or more `.dbpr` files into downloaded folder.
4. Double click 'start-macos.command' or 'start-windows.bat' depending on your OS.
5. Modified project files will be created in this folder with `_AUTO` appended to the name.


## Notes
### MacOS ##
The OS may give a message about the application coming from an unknown developer and fail to run. In this case, right click the `start-macos.command` file, select `Open` from the dropdown menu and select `Open` from the following popup. 

More information - [https://support.apple.com/en-au/guide/mac-help/mh40616/mac](https://support.apple.com/en-au/guide/mac-help/mh40616/mac)

### Windows ###
Microsoft Defender SmartScreen may display a message saying the app is unrecognized when running `start-windows.bat`. Clicking `More Info` and then `Run Anyway` will run the program.

## Building
- Download + configure python environment
```
git clone https://github.com/lachyc/AutoR1.git
cd ./AutoR1
virtualenv env
pip install -r requirements.txt
```

- Build for release - `pyinstaller --onefile --name autor1 src/__main__.py`

- Testing - `pytest`
  - Processed files will be located in Projects/Output/

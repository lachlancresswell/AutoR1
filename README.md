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
- templates.r2t

Load this as a template file in R1 to modify generated controls


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

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Buffer } from 'buffer';
import * as AutoR1 from './autor1';
import './App.css';

const TEMPLATES = process.env.PUBLIC_URL + '/templates.r2t';
const GROUP_NAME = 'AutoR1'
const SUFFIX = '_AUTO';

let templates: AutoR1.AutoR1TemplateFile;
const terminal = document.getElementById('terminal')!;

/**
 * Creates a new path for the processed R1 project file
 * @param path
 * @returns New path
 */
const newAutoPath = (path: string) => path.substring(0, path.lastIndexOf('.')) + SUFFIX + '.dbpr';

/**
 * Downloads the processed file
 * @param projectFile
 * @param filename
 * @returns Download link
 */
const downloadFile = (projectFile: AutoR1.AutoR1ProjectFile, filename: string) => {
  const arraybuff = projectFile.db.export();

  var blob = new Blob([arraybuff]);
  const link = window.URL.createObjectURL(blob);

  var a = document.createElement("a");
  document.body.appendChild(a);
  a.href = link;
  a.download = filename;
  a.click();
  a.remove();

  return link
}

/**
 * Applies AutoR1 additions to a project file
 * @param fileBuffer
 * @param status
 * @returns Processed project file
 */
const processFile = async (fileBuffer: Buffer, status: SourceGroupStatus[], pagesStatus: PagesStatus, createArraySightControls: boolean) => {
  let projectFile: AutoR1.AutoR1ProjectFile;
  projectFile = await AutoR1.AutoR1ProjectFile.build(fileBuffer!);

  if (projectFile.additions) {
    const id = projectFile.getGroupIdFromName(GROUP_NAME);
    projectFile.clean(id);
  }

  const parentId = projectFile.createGroup({ Name: GROUP_NAME });
  projectFile.createSubLRCGroups(parentId);
  projectFile.getSrcGrpInfo();

  status.forEach((row, i) => {
    projectFile.sourceGroups[i].fallback = row.fallback;
    projectFile.sourceGroups[i].mute = row.mute;
    projectFile.sourceGroups[i].dsData = row.ds;
  });

  projectFile.createAll(templates, parentId!, pagesStatus, createArraySightControls);

  return projectFile;
}

interface SourceGroupStatus {
  fallback: boolean;
  mute: boolean;
  ds: boolean;
}

interface PagesStatus {
  main: boolean;
  meter: boolean;
  eq: boolean;
}

function App() {
  const [projectFile, setProjectFile] = useState<AutoR1.AutoR1ProjectFile | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [terminal, setTerminal] = useState<string[]>(['Starting...']);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [sourceGroupsStatus, setSourceGroupsStatus] = useState<SourceGroupStatus[] | undefined>(undefined);
  const [pagesStatus, setPagesStatus] = useState<PagesStatus>({
    main: true,
    meter: true,
    eq: true
  });
  const [fileBuffer, setFileBuffer] = useState<Buffer | undefined>(undefined);
  const [isVisible, setIsVisible] = useState(false);
  const [createArraySightControls, setCreateArraySightControls] = useState(true);

  useEffect(() => {
    fetch(TEMPLATES).then(response => {
      if (!response.ok) {
        setTerminal(terminal => [...terminal, 'Could not load templates.']);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      response.arrayBuffer().then(async (arrayBuffer) => {
        const buffer = new Uint8Array(arrayBuffer)

        templates = await AutoR1.AutoR1TemplateFile.build(Buffer.from(buffer))

        setTerminal(terminal => [...terminal, 'Templates loaded.']);
      });
    })
  }, []);

  useEffect(() => {
    if (projectFile) {
      const rows = projectFile.sourceGroups.map(sg => ({ fallback: sg.fallback, mute: sg.mute, ds: sg.dsData }));
      setSourceGroupsStatus(rows);
    }
  }, [projectFile]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }

  useEffect(() => {
    const script = document.createElement('script');
    const donateDiv = document.getElementById('donations')!;

    script.src = "https://liberapay.com/Lachlan/widgets/button.js";

    donateDiv.appendChild(script);

    return () => {
      donateDiv.removeChild(script);
    }
  }, []);

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFile = event.dataTransfer ? event.dataTransfer.files[0] : (event.target as any).files[0];

    (document.getElementById('fileInput')! as HTMLInputElement).files = event.dataTransfer ? event.dataTransfer.files : (event.target as any).files;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileContent = event.target!.result! as ArrayBuffer;
      const buffer = new Uint8Array(fileContent);

      setTerminal(terminal => [...terminal, `Loaded ${droppedFile.name}.`]);

      let projectFile: AutoR1.AutoR1ProjectFile;
      try {
        projectFile = await AutoR1.AutoR1ProjectFile.build(Buffer.from(buffer));
        if (projectFile.additions) {
          const id = projectFile.getGroupIdFromName(GROUP_NAME);
          projectFile.clean(id);
        }
        const parentId = projectFile.createGroup({ Name: GROUP_NAME });
        projectFile.createSubLRCGroups(parentId);
        projectFile.getSrcGrpInfo();

        setFileBuffer(Buffer.from(buffer));
        setFileName(droppedFile.name);
        setProjectFile(projectFile);
      } catch (e) {
        alert(`Cannot process ${droppedFile.name}. Project file has not been initialised. Open the project in R1, run the initial setup and save before using AutoR1.`)
        setTerminal(terminal => [...terminal, `Cannot process ${droppedFile.name}. Project file has not been initialised. Open the project in R1, run the initial setup and save before using AutoR1.`]);

        clearFile();
        return;
      }
    };

    reader.readAsArrayBuffer(droppedFile);
  }

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const resetStatus = () => {
    const rows = projectFile!.sourceGroups.map(sg => ({ fallback: sg.fallback, mute: sg.mute, ds: sg.dsData }));
    setSourceGroupsStatus(rows);
  }

  const cleanFile = () => {
    if (projectFile?.additions) {
      const id = projectFile.getGroupIdFromName(GROUP_NAME);
      projectFile.clean(id);

      return projectFile;
    } else if (!projectFile?.additions) {
      alert('Project file does not already have AutoR1 features.');
    }
  }

  const clearFile = () => {
    setProjectFile(null);
    setFileName(undefined);
    setSourceGroupsStatus(undefined);
    setFileBuffer(undefined);

    // Clear fileInput
    const fileInput = document.getElementById('fileInput')! as HTMLInputElement;
    fileInput.value = '';
  }

  const statusHasChanged = () => sourceGroupsStatus?.find((row, i) => !row.fallback || !row.mute || !row.ds);

  return (
    <div id="app">
      <div id="process-container">
        <h1>AutoR1 2.0 Beta</h1>
        <input type="file" id="fileInput" style={projectFile ? { display: 'none' } : { display: 'initial' }} onChange={handleDrop as any} />
      </div>

      <>
        {!projectFile && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: "80%",
              width: "80%",
              border: isDragOver ? '2px dashed blue' : '2px solid black'
            }}
          >
            Drop file here
          </div>)}

        {projectFile && sourceGroupsStatus && (
          <div id="projectInfo">
            <div>
              <p>File name: {fileName}</p>
              <p>Initial setup performed: true</p>
              <p>Contains AutoR1 additions: {projectFile.additions ? '✅' : '❌'}</p>
            </div>
            <div id="mainButtons">
              <button onClick={async () => {
                const projectFile = await processFile(fileBuffer!, sourceGroupsStatus, pagesStatus, createArraySightControls);

                const link = downloadFile(projectFile, newAutoPath(fileName!));

                alert('Processed project has been downloaded.');
              }}>Run</button>
              {projectFile.additions && (<button onClick={() => {
                cleanFile();
                downloadFile(projectFile!, fileName!);
              }}>Clean</button>)
              }
              <button onClick={() => {
                clearFile()
              }}>Clear</button>
            </div>
            <div id="statusButtons">
              <button onClick={toggleVisibility}>
                {isVisible ? 'Hide Options' : 'Show Options'}
              </button>
              {isVisible && statusHasChanged() && (<button onClick={resetStatus}>Reset Options</button>)}
            </div>
            <div>
              {isVisible && (
                <div>
                  <div>
                    <div>
                      <div className='option'>
                        <div>
                          Create Main page
                        </div>
                        <div>
                          <input type='checkbox' checked={pagesStatus.main} onChange={() => {
                            setPagesStatus((oldStatus) => ({
                              ...oldStatus,
                              ...{ main: !oldStatus.main }
                            }))
                          }} />
                        </div>
                      </div>
                      <div className='option'>
                        <div>
                          Create Meter page
                        </div>
                        <div>
                          <input type='checkbox' checked={pagesStatus.meter} onChange={() => {
                            setPagesStatus((oldStatus) => ({
                              ...oldStatus,
                              ...{ meter: !oldStatus.meter }
                            }))
                          }} />
                        </div>
                      </div>
                      <div className='option'>
                        <div>
                          Create EQ page
                        </div>
                        <div>
                          <input type='checkbox' checked={pagesStatus.eq} onChange={() => {
                            setPagesStatus((oldStatus) => ({
                              ...oldStatus,
                              ...{ eq: !oldStatus.eq }
                            }))
                          }} />
                        </div>
                      </div>
                      <div className='option'>
                        <div>
                          Create ArraySight controls
                        </div>
                        <div>
                          <input type='checkbox' checked={createArraySightControls} onChange={() => { setCreateArraySightControls(!createArraySightControls) }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <table id="sourceGroupTable">
                    <thead>
                      <tr>
                        <th>Source Group</th>
                        <th onClick={() => {
                          const newStatus = [...sourceGroupsStatus];
                          newStatus.forEach(row => row.fallback = !row.fallback);
                          setSourceGroupsStatus(newStatus);
                        }}>Fallback</th>
                        <th onClick={() => {
                          const newStatus = [...sourceGroupsStatus];
                          newStatus.forEach(row => row.mute = !row.mute);
                          setSourceGroupsStatus(newStatus);
                        }}>Mute</th>
                        <th onClick={() => {
                          const newStatus = [...sourceGroupsStatus];
                          newStatus.forEach(row => row.ds = !row.ds);
                          setSourceGroupsStatus(newStatus);
                        }}>DS Data</th>
                      </tr>
                    </thead>
                    <tbody>

                      {
                        sourceGroupsStatus.map((row, i) => {
                          return (
                            <>
                              <tr>
                                <td onClick={() => {
                                  const newStatus = [...sourceGroupsStatus];
                                  newStatus[i].fallback = !newStatus[i].fallback;
                                  newStatus[i].mute = !newStatus[i].mute;
                                  newStatus[i].ds = !newStatus[i].ds;
                                  setSourceGroupsStatus(newStatus);
                                }}>{projectFile.sourceGroups[i].Name}</td>
                                <td><input type='checkbox' checked={row.fallback} onChange={() => {
                                  const newStatus = [...sourceGroupsStatus];
                                  newStatus[i].fallback = !newStatus[i].fallback;
                                  setSourceGroupsStatus(newStatus);
                                }} /></td>
                                <td><input type='checkbox' checked={row.mute} onChange={() => {
                                  const newStatus = [...sourceGroupsStatus];
                                  newStatus[i].mute = !newStatus[i].mute;
                                  setSourceGroupsStatus(newStatus);
                                }} /></td>
                                <td><input type='checkbox' checked={row.ds} onChange={() => {
                                  const newStatus = [...sourceGroupsStatus];
                                  newStatus[i].ds = !newStatus[i].ds;
                                  setSourceGroupsStatus(newStatus);
                                }} /></td>
                              </tr>
                            </>
                          )
                        })
                      }
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </>

      {/* <div id="terminal-container">
        <div>
          Log
        </div>
        <div id="terminal">{terminal.map(t => <div>{t}</div>)}</div>
      </div> */}

      <div id="footer">
        All files are processed on your device. No files are uploaded.
      </div>
      <div id="donations">
        <a href="https://www.buymeacoffee.com/Lachlanc"><img alt="donation link" src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=Lachlanc&button_colour=FFDD00&font_colour=000000&font_family=Inter&outline_colour=000000&coffee_colour=ffffff" /></a>
      </div>
    </div >
  );
}

export default App;

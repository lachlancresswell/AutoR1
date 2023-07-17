import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useState } from 'react';
import { UISourceGroup } from '../main/main';


function MainPage({ templates }: { templates: any }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceGroups, setSourceGroups] = useState<UISourceGroup[] | null>(null);
  const [startSourceGroups, setStartSourceGroups] = useState<UISourceGroup[] | null>(null);

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFile = event.dataTransfer.files[0];
    setFile(droppedFile);
    window.electron.ipcRenderer.sendMessage('new-file', [droppedFile.path]);
  }

  window.electron.ipcRenderer.on("new-file", (arg: any) => {
    console.log('args');
    console.log(arg);
    setSourceGroups(arg);
    setStartSourceGroups(JSON.parse(JSON.stringify(arg)));
  });

  const clean = () => {
  }
  const clear = () => {
    setFile(null);
    setSourceGroups(null);
  }

  const reset = () => {
    setSourceGroups(JSON.parse(JSON.stringify(startSourceGroups)));
  };

  return (
    <>
      {!file && (
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

      {file && sourceGroups && (
        <div>
          <div>
            <p>File name: {file.name}</p>
            <p>Initial setup performed: true</p>
            <p>Contains AutoR1 additions: false</p>
          </div>
          <div>
            <table>
              <thead>
                <tr>
                  <th>Source Group</th>
                  <th>Fallback</th>
                  <th>Mute</th>
                </tr>
              </thead>
              <tbody>
                {
                  sourceGroups.map((sourceGroup) => {
                    return (
                      <>
                        <tr>
                          <td>{sourceGroup.Name}</td>
                          <td><input type='checkbox' checked={sourceGroup.fallback} onChange={() => {
                            sourceGroup.fallback = !sourceGroup.fallback
                            setSourceGroups([...sourceGroups]);
                          }} /></td>
                          <td><input type='checkbox' checked={sourceGroup.mute} onChange={() => {
                            sourceGroup.mute = !sourceGroup.mute
                            setSourceGroups([...sourceGroups]);
                          }} /></td>
                        </tr>
                      </>
                    )
                  })
                }
              </tbody>
            </table>
            <button>Run</button>
            <button onClick={reset}>Reset</button>
            {/* <button>Save as Default</button> */}
            <button onClick={clear}>Clear</button>
            <button onClick={clean}>Clean</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  // const templates = new AutoR1.AutoR1TemplateFile(TEMPLATES);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage templates={'templates'} />} />
      </Routes>
    </Router>
  );
}

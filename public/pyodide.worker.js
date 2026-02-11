/// <reference lib="webworker" />

// Import Pyodide from CDN
importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');

let pyodide = null;

async function loadPyodideAndPackages() {
  if (!pyodide) {
    try {
        pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
        });
    } catch (err) {
        console.error("Failed to load Pyodide in worker:", err);
        self.postMessage({ type: 'error', content: `Failed to load Pyodide: ${err}` });
    }
  }
  return pyodide;
}

self.onmessage = async (event) => {
  const { id, type, code, input, fileAssets } = event.data;

  if (type === 'load') {
      await loadPyodideAndPackages();
      self.postMessage({ type: 'loaded' });
      return;
  }

  if (type === 'runCode') {
    if (!pyodide) {
       await loadPyodideAndPackages();
    }
    
    const handleOutput = (msg) => {
        self.postMessage({ type: 'output', content: msg, id });
    };

    const handleError = (msg) => {
        self.postMessage({ type: 'error', content: msg, id }); 
    };

    try {
        pyodide.setStdout({ batched: handleOutput });
        pyodide.setStderr({ batched: handleError });

        // Handle stdin
        if (input) {
            const stdinIterator = (function* () {
                const lines = input.split('\n');
                for(let line of lines) yield line;
            })();
            pyodide.setStdin({ stdin: () => stdinIterator.next().value });
        }

        // Handle fs
        if (fileAssets) {
            for (const [filename, content] of Object.entries(fileAssets)) {
                pyodide.FS.writeFile(filename, content);
            }
        }

        // Run
        // Create fresh globals for isolation between runs if desired, though reuse is faster. 
        // For security/cleanliness, fresh globals is better.
        const globals = pyodide.toPy({}); // Define globals dict
        
        await pyodide.runPythonAsync(code, { globals });
        
        globals.destroy();
        
        self.postMessage({ type: 'done', id });

    } catch (err) {
        self.postMessage({ type: 'error', content: err.toString(), id });
        self.postMessage({ type: 'done', id });
    }
  }
};

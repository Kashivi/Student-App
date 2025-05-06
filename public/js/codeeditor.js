const editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    mode: "javascript",
    theme: "default"
  });

  function clearEditor() {
    editor.setValue("");
  }

  const languageMap = {
    javascript: "JavaScript",
    python: "Python",
    java: "Java",
    c: "C",
    cpp: "C++",
    sql: "SQL",
    typescript: "TypeScript"
  };

  document.getElementById("language").addEventListener("change", (e) => {
    const lang = e.target.value;
    const modeMap = {
      javascript: "javascript",
      python: "python",
      java: "text/x-java",
      c: "text/x-csrc",
      cpp: "text/x-c++src",
      sql: "text/x-sql",
      typescript: "text/typescript"
    };
    editor.setOption("mode", modeMap[lang]);
  });

  function detectLanguageFromCode(code) {
    if (/\bSystem\.out\.println|\bSystem\.out\.print|Scanner\b/.test(code)) return "java";
    if (/\b#include\s*<[^>]+>\s*\n.*\bmain\b.*\bscanf\b/.test(code)) return "c";
    if (/\b#include\s*<[^>]+>\s*\n.*\bmain\b.*\bcin\b/.test(code)) return "cpp";
    if (/\bconsole\.log|function\b/.test(code)) return "javascript";
    if (/\binput\(|print\(/.test(code)) return "python";
    if (/\bSELECT\b|\bFROM\b/.test(code.toUpperCase())) return "sql";
    if (/\bconsole\.log|let|const/.test(code) && /:\s*\w+/.test(code)) return "typescript";
    return null;
  }

  function saveToHistory(code, language) {
    const history = JSON.parse(localStorage.getItem("codeHistory") || "[]");
    history.unshift({ code, language, time: new Date().toLocaleString() });
    localStorage.setItem("codeHistory", JSON.stringify(history.slice(0, 20)));
    renderHistory();
  }

  function renderHistory() {
    const historyList = document.getElementById("history");
    historyList.innerHTML = "";
    const history = JSON.parse(localStorage.getItem("codeHistory") || "[]");
    history.forEach((item) => {
      const li = document.createElement("li");
      li.className = "list-group-item history-item";
      li.textContent = `${item.language} (${item.time})`;
      li.onclick = () => {
        editor.setValue(item.code);
        document.getElementById("language").value = item.language;
        editor.setOption("mode", item.language);
        closeHistoryPanel();
      };
      historyList.appendChild(li);
    });
  }

  async function runCode() {
    const runBtn = document.getElementById("runBtn");
    runBtn.innerText = "Running...";
    runBtn.disabled = true;

    const outputEl = document.getElementById("output");
    outputEl.innerText = "";

    const language = document.getElementById("language").value;
    const code = editor.getValue();

    const detectedLang = detectLanguageFromCode(code);
    if (detectedLang && detectedLang !== language) {
      outputEl.innerText = `Error: Selected language is ${languageMap[language]}, but detected ${languageMap[detectedLang]}.`;
      runBtn.innerText = "Run";
      runBtn.disabled = false;
      return;
    }

    let userInput = "";
    const inputKeywords = [
      /input\s*\(/i,
      /scanf\s*\(/i,
      /cin\s*>>/i,
      /System\.in|next\w*\(/i,
      /readLine\s*\(/i
    ];
    const needsInput = inputKeywords.some((pattern) => pattern.test(code));
    if (needsInput) {
      userInput = prompt("Enter input for your code:", "");
    }

    try {
        const response = await fetch('/api/groq', {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              prompt: userInput,
              code: code,
              language: language
            })
          });
    
          if (!response.ok) {
            const errorText = await response.text();
            outputEl.innerText = `Error: ${errorText}`;
            return;
          }
    
          const data = await response.json();
          outputEl.innerText = data.output || "No output returned.";
    
          saveToHistory(code, language);
        } catch (err) {
          outputEl.innerText = `Request failed: ${err.message}`;
        } finally {
          runBtn.innerText = "Run";
          runBtn.disabled = false;
        }
  }

  function toggleHistory() {
    const historyPanel = document.getElementById("historyPanel");
    historyPanel.classList.toggle("active");
  }

  function closeHistoryPanel() {
    const historyPanel = document.getElementById("historyPanel");
    historyPanel.classList.remove("active");
  }

  // Close history panel when clicking outside of it
  document.addEventListener("click", (event) => {
    const historyPanel = document.getElementById("historyPanel");
    const historyIcon = document.querySelector(".history-icon");
    if (!historyPanel.contains(event.target) && !historyIcon.contains(event.target)) {
      closeHistoryPanel();
    }
  });

  // Mobile panel toggle function
  function showPanel(panel) {
    const codePanel = document.getElementById("codePanel");
    const outputPanel = document.getElementById("outputPanel");
    const btnCode = document.getElementById("btnCode");
    const btnOutput = document.getElementById("btnOutput");
    
    if (panel === 'code') {
      codePanel.classList.add("active");
      outputPanel.classList.remove("active");
      btnCode.classList.add("active");
      btnOutput.classList.remove("active");
    } else  {
      codePanel.classList.remove("active");
      outputPanel.classList.add("active");
      btnCode.classList.remove("active");
      btnOutput.classList.add("active");
    }
  }

  window.onload = renderHistory;
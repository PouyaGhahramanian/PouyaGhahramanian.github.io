(function () {
  "use strict";

  var terminal = document.getElementById("terminal");
  if (!terminal) return;

  var data = JSON.parse(document.getElementById("terminal-data").textContent);
  var commands = data.commands.map(function (command) { return command.name; });
  var output = document.getElementById("terminal-output");
  var input = document.getElementById("terminal-input");
  var announcement = document.getElementById("terminal-announcement");
  var history = [];
  var historyIndex = 0;
  var draft = "";
  var generation = 0;
  var queue = Promise.resolve();
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function commandList() {
    return data.commands.map(function (command) {
      return "  " + command.name.padEnd(10) + command.description;
    }).join("\n");
  }

  function resolveCommand(question) {
    var text = question.toLowerCase().replace(/[?!.,]+$/, "");
    if (commands.indexOf(text) !== -1) return text;
    if (!/^(what|who|where|how|can|could|tell|show|i want|i would|i’d)\b/.test(text)) return null;
    if (/\b(contact|email|reach|touch|linkedin|github)\b/.test(text)) return "contact";
    if (/\b(paper|papers|publication|publications|scholar)\b/.test(text)) return "papers";
    if (/\b(research|work|working|drift|learning)\b/.test(text)) return "research";
    if (/\b(writing|read|blog|notes)\b/.test(text)) return "writing";
    if (/\b(cv|resume|résumé)\b/.test(text)) return "cv";
    if (/\b(who|about|bio)\b/.test(text)) return "whoami";
    if (/\b(help|commands)\b/.test(text)) return "help";
    return null;
  }

  function clearTerminal() {
    generation += 1;
    queue = Promise.resolve();
    output.replaceChildren();
    announcement.textContent = "Terminal cleared.";
    input.value = "";
    input.focus();
  }

  async function displayReply(question, command, currentGeneration) {
    if (currentGeneration !== generation) return;
    var reply;
    if (command === "help") {
      reply = { text: "Available commands:\n\n" + commandList() + "\n\nYou can also ask about my research or how to get in touch." };
    } else if (command) {
      reply = data.replies[command];
    } else {
      reply = { text: "pouya: command not found: " + question + "\n\nAvailable commands:\n\n" + commandList() };
    }

    var entry = document.createElement("div");
    entry.className = "terminal__entry";
    var prompt = document.createElement("p");
    prompt.className = "terminal__command";
    var prefix = document.createElement("span");
    prefix.textContent = "$ ";
    prompt.append(prefix, document.createTextNode(question));
    var response = document.createElement("p");
    response.className = "terminal__response";
    if (!command) response.classList.add("terminal__response--error");
    entry.append(prompt, response);
    output.append(entry);
    while (output.childElementCount > 12) output.firstElementChild.remove();

    if (reducedMotion.matches) {
      response.textContent = reply.text;
    } else {
      for (var i = 0; i < reply.text.length; i += 6) {
        if (currentGeneration !== generation) return;
        response.textContent = reply.text.slice(0, i + 6);
        output.scrollTop = output.scrollHeight;
        await new Promise(function (resolve) { setTimeout(resolve, 12); });
      }
    }
    if (currentGeneration !== generation) return;

    if (reply.links) {
      var links = document.createElement("div");
      links.className = "terminal__links";
      reply.links.forEach(function (link) {
        var anchor = document.createElement("a");
        anchor.textContent = link.label + " ↗";
        anchor.href = link.url;
        links.append(anchor);
      });
      entry.append(links);
    }
    announcement.textContent = reply.text;
    output.scrollTop = output.scrollHeight;
  }

  function run(raw) {
    var question = raw.trim();
    if (!question) return;
    history.push(question);
    if (history.length > 50) history.shift();
    historyIndex = history.length;
    draft = "";
    input.value = "";
    var command = resolveCommand(question);
    if (command === "clear") {
      clearTerminal();
      return;
    }
    var currentGeneration = generation;
    queue = queue.then(function () { return displayReply(question, command, currentGeneration); });
  }

  document.getElementById("terminal-form").addEventListener("submit", function (event) {
    event.preventDefault();
    run(input.value);
  });
  terminal.querySelectorAll("[data-command]").forEach(function (button) {
    button.addEventListener("click", function () {
      run(button.getAttribute("data-command"));
      input.focus();
    });
  });
  document.getElementById("terminal-clear").addEventListener("click", clearTerminal);
  input.addEventListener("keydown", function (event) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (historyIndex === history.length) draft = input.value;
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] || draft;
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = historyIndex === history.length ? draft : history[historyIndex];
    } else if (event.key === "Tab" && input.value.trim()) {
      var matches = commands.filter(function (command) {
        return command.indexOf(input.value.trim().toLowerCase()) === 0;
      });
      if (matches.length === 1) {
        event.preventDefault();
        input.value = matches[0];
      }
    }
  });
  ["terminal-form", "terminal-shortcuts", "terminal-hint"].forEach(function (id) {
    document.getElementById(id).hidden = false;
  });
})();

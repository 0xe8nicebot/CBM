document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('menu');
  const content = document.getElementById('content');

  menuToggle.addEventListener('click', function() {
    menu.classList.toggle('hidden');
  });

  // 定义 GitHub 仓库信息
  const owner = '0xe8nicebot';
  const repo = 'CBM';
  const singleMarkdownPath = 'content.md';

  // 从GitHub获取菜单结构和Markdown文件
  fetchMenuStructure().then(structure => {
    renderMenu(structure);
    openDefaultOrLastDocument(structure);
  });

  function fetchMenuStructure() {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${singleMarkdownPath}`;
    console.log('Fetching from URL:', url);
  
    return fetch(url)
      .then(response => {
        if (!response.ok) {
          console.error('Response status:', response.status);
          return response.text().then(text => {
            console.error('Response text:', text);
            throw new Error(`HTTP error! status: ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Received data:', data);
        const content = decodeURIComponent(escape(atob(data.content)));
        return processMarkdownContent(content);
      })
      .catch(error => {
        console.error('Error fetching menu structure:', error);
        // 在这里添加用户友好的错误提示
      });
  }

  // 处理 Markdown 内容并生成菜单结构
  function processMarkdownContent(content) {
    const lines = content.split('\n');
    const structure = {};
    let currentSection = null;

    lines.forEach(line => {
      if (line.startsWith('# ')) {
        currentSection = line.substring(2).trim();
        structure[currentSection] = [];
      } else if (line.startsWith('## ') && currentSection) {
        structure[currentSection].push({
          title: line.substring(3).trim(),
          content: ''
        });
      } else if (currentSection && structure[currentSection].length > 0) {
        structure[currentSection][structure[currentSection].length - 1].content += line + '\n';
      }
    });

    console.log('Processed structure:', structure);
    return structure;
  }
  
  function processGitHubData(data) {
    const structure = {};
    data.forEach(item => {
      if (item.type === 'file' && item.name.endsWith('.md')) {
        console.log('Found Markdown file:', item.name);
        structure[item.name.replace('.md', '')] = item.path;
      } else if (item.type === 'dir') {
        console.log('Found directory:', item.name);
        structure[item.name] = fetchDirectoryContents(item.path);
      }
    });
    console.log('Processed structure:', structure);
    return structure;
  }

  function fetchDirectoryContents(path) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    return fetch(url)
      .then(response => response.json())
      .then(data => processGitHubData(data))
      .catch(error => {
        console.error(`Error fetching directory contents for ${path}:`, error);
        return {};
      });
  }
  

  function renderMenu(structure, parentElement = menu) {
    for (let section in structure) {
      const sectionItem = document.createElement('div');
      sectionItem.className = 'menu-item';
      sectionItem.textContent = section;
      parentElement.appendChild(sectionItem);
  
      const submenu = document.createElement('div');
      submenu.className = 'submenu';
      sectionItem.appendChild(submenu);
  
      structure[section].forEach((item, index) => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.textContent = item.title;
        menuItem.dataset.section = section;
        menuItem.dataset.index = index;
        submenu.appendChild(menuItem);
  
        menuItem.addEventListener('click', () => {
          console.log('Clicked on:', item.title);
          loadContent(section, index);
          saveLastOpenedDocument(section, index);
          updateActiveMenuItem(menuItem);
        });
      });
    }
  }

  function loadContent(section, index) {
    const content = structure[section][index].content;
    const html = simpleMarkdownToHtml(content);
    document.getElementById('content').innerHTML = html;
    updateActiveMenuItem(document.querySelector(`.menu-item[data-section="${section}"][data-index="${index}"]`));
  }

  function openDefaultOrLastDocument(structure) {
    const lastOpenedSection = localStorage.getItem('lastOpenedSection');
    const lastOpenedIndex = localStorage.getItem('lastOpenedIndex');
    if (lastOpenedSection && lastOpenedIndex) {
      loadContent(lastOpenedSection, parseInt(lastOpenedIndex));
    } else {
      const firstSection = Object.keys(structure)[0];
      if (firstSection && structure[firstSection].length > 0) {
        loadContent(firstSection, 0);
        saveLastOpenedDocument(firstSection, 0);
      }
    }
  }

  function saveLastOpenedDocument(section, index) {
    localStorage.setItem('lastOpenedSection', section);
    localStorage.setItem('lastOpenedIndex', index);
  }
  
  function updateActiveMenuItem(activeItem) {
    const allMenuItems = document.querySelectorAll('.menu-item');
    allMenuItems.forEach(item => item.classList.remove('active'));
    if (activeItem) {
      activeItem.classList.add('active');
    }
  } 

  function simpleMarkdownToHtml(markdown) {
    // 处理标题
    markdown = markdown.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    markdown = markdown.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    markdown = markdown.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // 处理粗体
    markdown = markdown.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    
    // 处理斜体
    markdown = markdown.replace(/\*(.*)\*/gim, '<em>$1</em>');
    
    // 处理链接
    markdown = markdown.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');
    
    // 处理列表
    markdown = markdown.replace(/^\s*\*\s(.*)/gim, '<li>$1</li>');
    markdown = markdown.replace(/<\/li>\n<li>/g, '</li><li>');
    markdown = markdown.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    
    // 处理段落
    markdown = markdown.replace(/^\s*(\n?[^\n]+)\n*/gim, '<p>$1</p>');
    
    return markdown;
  }

});
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
  const path = 'contents';

  // 从GitHub获取菜单结构和Markdown文件
  fetchMenuStructure().then(structure => {
    renderMenu(structure);
  });

  function fetchMenuStructure() {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
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
        return processGitHubData(data);
      })
      .catch(error => {
        console.error('Error fetching menu structure:', error);
        // 在这里添加用户友好的错误提示
      });
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
    for (let key in structure) {
      const item = document.createElement('div');
      item.className = 'menu-item';
      item.textContent = key;
      parentElement.appendChild(item);
  
      if (structure[key] instanceof Promise) {
        structure[key].then(subStructure => {
          const submenu = document.createElement('div');
          submenu.className = 'submenu';
          item.appendChild(submenu);
          renderMenu(subStructure, submenu);
        });
      } else if (typeof structure[key] === 'string') {
        console.log('Adding click event for:', key, 'with path:', structure[key]);
        item.addEventListener('click', () => {
          console.log('Clicked on:', key);
          loadMarkdown(structure[key]);
        });
      }
    }
  }

  function loadMarkdown(filename) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`;
    console.log('Loading markdown from URL:', url);
  
    fetch(url)
      .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Received markdown data:', data);
        if (!data.content) {
          throw new Error('No content found in the response');
        }
        const content = decodeURIComponent(escape(atob(data.content)));
        console.log('Decoded content:', content);
        const html = simpleMarkdownToHtml(content);
        console.log('Converted HTML:', html);
        document.getElementById('content').innerHTML = html;
      })
      .catch(error => {
        console.error('Error loading markdown:', error);
        document.getElementById('content').innerHTML = `<p>Error loading content: ${error.message}</p>`;
      });
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
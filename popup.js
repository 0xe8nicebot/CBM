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
        // 使用完整路径作为值
        structure[item.name.replace('.md', '')] = item.path;
      } else if (item.type === 'dir') {
        structure[item.name] = item.path;
      }
    });
    return structure;
  }

  function renderMenu(structure, parentElement = menu) {
    for (let key in structure) {
      const item = document.createElement('div');
      item.className = 'menu-item';
      item.textContent = key;
      parentElement.appendChild(item);

      if (typeof structure[key] === 'object') {
        const submenu = document.createElement('div');
        submenu.className = 'submenu';
        item.appendChild(submenu);
        renderMenu(structure[key], submenu);
      } else {
        item.addEventListener('click', () => loadMarkdown(structure[key]));
      }
    }
  };

  function loadMarkdown(filename) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`;
    console.log('Loading markdown from URL:', url);
  
    fetch(url)
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
        // 使用 TextDecoder 来正确解码 base64 内容
        const content = new TextDecoder('utf-8').decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)));
        document.getElementById('content').innerHTML = `<pre>${content}</pre>`;
      })
      .catch(error => {
        console.error('Error loading markdown:', error);
        document.getElementById('content').innerHTML = `<p>Error loading content: ${error.message}</p>`;
      });
  }

});
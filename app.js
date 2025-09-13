//Hides and Unhides elemnts when in view 
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        console.log(entry)
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else {
            entry.target.classList.remove('show')
        }

    });
});
const hiddenItems = document.querySelectorAll('.hidden');
hiddenItems.forEach((el) => observer.observe(el));
const scrollDownClick = document.querySelector('#scroll1');
const scrollDownClick2 = document.querySelector('#scroll2');

// Makes the scrolling effect from the scroll buttons wayyy smoother
// Scroll buttons go to specific major sections
const section1 = document.querySelector('.section1');
const section2 = document.querySelector('.section2');
const section3 = document.querySelector('.section3');

function scrollAndShow(section) {
    if (section) {
        section.classList.remove('hidden');
        section.classList.add('show');
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

scrollDownClick.onclick = () => scrollAndShow(section2);
scrollDownClick2.onclick = () => scrollAndShow(section3);
// Visual effect for Profile card
const profileCard = document.querySelector(".profile-card")
document.addEventListener("mousemove", (e) => {
    rotateElement(e, profileCard)
})
function rotateElement(event, element) {
    const x = event.clientX
    const y = event.clientY

    const middleX = window.innerWidth / 2;
    const middleY = window.innerHeight / 2;

    const offsetX = ((x - middleX) / middleX) * 20;
    const offsetY = ((y - middleY) / middleY) * 20;

    element.style.setProperty("--rotateX", -1 * offsetY + "deg")
    element.style.setProperty("--rotateY", offsetX + "deg")
}

// Enable debug mode to see detailed logs (queries, errors, state changes)
const DEBUG = true;
function debugLog(...args) {
    if (DEBUG) console.debug('[Portfolio]', ...args);
}

// --- Resume detail overlay logic ---
const resumeButtons = document.querySelectorAll('.resumeSec');
const overlay = document.getElementById('detailOverlay');
const detailTitle = document.getElementById('detailTitle');
const detailGrid = document.getElementById('detailGrid');
const detailClose = document.getElementById('detailClose');
const detailPanel = document.getElementById('detailPanel');
const detailToggle = document.getElementById('detailToggle');

// Add a small control to fetch pinned repos using GitHub GraphQL API.
// This requires a personal access token with public_repo scope (only stored in localStorage locally).
// promptPopulatePinned removed — projects auto-populate from owner '8omz' without prompts.

async function populatePinned(username, token) {
    if (!token) {
        debugLog('No token provided to populatePinned');
        return false;
    }
    debugLog('Fetching pinned repos for', username);
    // GraphQL query for pinnedItems on a user
    const query = `query($login:String!){ user(login:$login){ pinnedItems(first:6, types: REPOSITORY){ edges{ node{ ... on Repository{ name owner{login} description url homepageUrl stargazerCount forkCount } } } } } }`;
    try {
        const res = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({ query, variables: { login: username } })
        });
    const text = await res.text();
    debugLog('GraphQL response:', { status: res.status, text });
    if (!res.ok) {
        throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}\n${text}`);
    }
    const json = JSON.parse(text);
    if (json.errors) {
        throw new Error('GraphQL errors: ' + json.errors.map(e => e.message).join('; '));
    }
    debugLog('GraphQL data:', json.data);
        const edges = json.data.user.pinnedItems.edges || [];
        // Build projectsConfig from pinned items
        const newConfig = await Promise.all(edges.map(async e => {
            const node = e.node;
            const [owner, name] = [node.owner.login, node.name];
            const thumb = await fetchRepoThumbnail(owner, name);
            return {
                repo: `${owner}/${name}`,
                title: name,
                desc: node.description || 'No description available.',
                thumb,
                stats: { stars: node.stargazerCount || 0, forks: node.forkCount || 0 }
            };
        }));
        if (newConfig.length === 0) {
            console.warn('No pinned repositories found for this user.');
            return false;
        }
        // Replace projectsConfig contents
        projectsConfig.length = 0;
        newConfig.forEach(c => projectsConfig.push(c));
        return true;
    } catch (err) {
        console.error(err);
        // propagate error so caller can fallback
        throw err;
    }
}


// Configure which projects should appear in the Projects grid.
// Edit this array to choose repos (format: "owner/repo") and optional thumbnails.
const projectsConfig = []; // will be populated by pinned repos or owner's top repos

// Fetch and cache avatar/thumbnail for a repo
async function fetchRepoThumbnail(owner, repo) {
    const cacheKey = `thumb_${owner}/${repo}`;
    try {
        // Try repo social preview first
        const socialUrl = `https://opengraph.githubassets.com/1/${owner}/${repo}`;
        const socialRes = await fetch(socialUrl);
        if (socialRes.ok) {
            debugLog('Using social preview for', owner, repo);
            return socialUrl;
        }
        // Fallback to owner avatar
        const apiUrl = `https://api.github.com/users/${owner}`;
        const headers = {};
        if (window && window.GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${window.GITHUB_TOKEN}`;
        }
        headers['Accept'] = 'application/vnd.github.v3+json';
        const userRes = await fetch(apiUrl, { headers });
        if (!userRes.ok) throw new Error('Failed to fetch user');
        const userData = await userRes.json();
        debugLog('Using owner avatar for', owner, repo);
        return userData.avatar_url;
    } catch (err) {
        debugLog('Thumbnail fetch failed for', owner, repo, err);
        return null;
    }
}

function clearDetailGrid() {
    detailGrid.innerHTML = '';
}

function createTile(title, desc, options = {}) {
    const t = document.createElement('div');
    t.className = 'detail-tile';
    // Support an optional thumbnail; fallback to placeholder gradient
    const thumb = options.thumbnail || options.thumb || null;
    if (thumb) {
        t.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.48)), url('${thumb}')`;
    } else {
        t.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.45)), url('src/placeholder.png')`;
    }
    const h = document.createElement('h4'); h.textContent = title;
    const p = document.createElement('p'); p.textContent = desc;
    if (options.repo) {
        t.dataset.repo = options.repo; // e.g. "owner/repo"
        t.classList.add('project-tile');
    }
    t.appendChild(h); t.appendChild(p);
    return t;
}

function openOverlay(type) {
    debugLog('Opening overlay:', type);
    // show overlay and disable background scrolling while open
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    detailTitle.textContent = type[0].toUpperCase() + type.slice(1);
    clearDetailGrid();
    
    if (type === 'projects') {
        if (projectsConfig.length === 0) {
            debugLog('Projects overlay opened but projectsConfig empty, initializing...');
            initializeProjects();
        } else {
            renderProjectsPreview();
        }

        // Use event delegation for project tiles
        if (!detailGrid._hasProjectHandler) {
            detailGrid.addEventListener('click', (ev) => {
                const tile = ev.target.closest && ev.target.closest('.project-tile');
                if (!tile) return;
                const repo = tile.dataset.repo;
                if (repo) showProjectDetails(repo, { title: tile.querySelector('h4')?.textContent, desc: tile.querySelector('p')?.textContent });
            });
            detailGrid._hasProjectHandler = true;
        }
    } else if (type === 'experience') {
        // simple fillers for experience
        for (let i = 1; i <= 6; i++) {
            detailGrid.appendChild(createTile(`${type} item ${i}`, `Brief description for ${type} item ${i}`));
        }
    } else if (type === 'skills') {
        detailGrid.appendChild(createTile('Languages', 'JavaScript, Python, C++'));
        detailGrid.appendChild(createTile('Frameworks', 'Node.js, Express'));
    } else if (type === 'education') {
        detailGrid.appendChild(createTile('BSc Computer Science', 'Wilfrid Laurier University — 20XX - Present'));
    }
}

function closeOverlay() {
    overlay.setAttribute('aria-hidden', 'true');
    clearDetailGrid();
    // re-enable background scrolling
    document.body.style.overflow = '';
    // hide load pinned button
    const loadBtn = document.getElementById('detailLoadPinned');
    if (loadBtn) loadBtn.style.display = 'none';
}

function showProjectDetails(repoFullName, fallback = {}) {
    // fetch GitHub repo info and show expanded view
    const apiUrl = `https://api.github.com/repos/${repoFullName}`;
    // show loading state
    clearDetailGrid();
    const loading = createTile('Loading…', 'Fetching repository information...');
    detailGrid.appendChild(loading);

    const headers = {
        'Accept': 'application/vnd.github.v3+json'
    };
    if (window && window.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${window.GITHUB_TOKEN}`;
    }
    debugLog('Fetching repo details:', { url: apiUrl, hasToken: !!window.GITHUB_TOKEN });

    fetch(apiUrl, { headers })
        .then((res) => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then((data) => {
            clearDetailGrid();
            const container = document.createElement('div');
            container.className = 'project-expanded';

            const title = document.createElement('h3');
            title.textContent = data.full_name || repoFullName;
            const desc = document.createElement('p');
            desc.textContent = data.description || 'No description available.';

            const stats = document.createElement('div');
            stats.className = 'project-stats';
            stats.innerHTML = `⭐ ${data.stargazers_count || 0} &nbsp;&nbsp; 🍴 ${data.forks_count || 0}`;

            const links = document.createElement('div');
            links.className = 'project-links';
            const repoA = document.createElement('a');
            repoA.href = data.html_url || `https://github.com/${repoFullName}`;
            repoA.target = '_blank';
            repoA.rel = 'noopener noreferrer';
            repoA.textContent = 'View on GitHub';
            links.appendChild(repoA);
            if (data.homepage) {
                const homeA = document.createElement('a');
                homeA.href = data.homepage;
                homeA.target = '_blank';
                homeA.rel = 'noopener noreferrer';
                homeA.textContent = 'Live site';
                homeA.style.marginLeft = '12px';
                links.appendChild(homeA);
            }

            // Readme area (rendered HTML will be inserted here)
            const readmeContainer = document.createElement('div');
            readmeContainer.className = 'project-readme';
            readmeContainer.textContent = 'Loading README...';

            const backBtn = document.createElement('button');
            backBtn.textContent = 'Back';
            backBtn.className = 'project-back';
            backBtn.addEventListener('click', () => {
                // reopen projects grid
                openOverlay('projects');
            });

            container.appendChild(title);
            container.appendChild(desc);
            container.appendChild(stats);
            container.appendChild(links);
            container.appendChild(readmeContainer);
            container.appendChild(backBtn);

            detailGrid.appendChild(container);

            // Try fetching README (rendered HTML)
            const readmeUrl = `https://api.github.com/repos/${repoFullName}/readme`;
            const readmeHeaders = { Accept: 'application/vnd.github.v3.html+json' };
            if (window && window.GITHUB_TOKEN) readmeHeaders['Authorization'] = `token ${window.GITHUB_TOKEN}`;
            fetch(readmeUrl, { headers: readmeHeaders })
                .then((r2) => {
                    if (!r2.ok) throw new Error('No readme');
                    return r2.text();
                })
                .then((readmeHtml) => {
                    // Convert GitHub's article format to a simpler div structure
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = readmeHtml;
                    
                    // Create our own simpler structure
                    const cleanContent = document.createElement('div');
                    cleanContent.className = 'readme-content';
                    
                    // Process main content
                    const articleContent = tempDiv.querySelector('.markdown-body');
                    if (articleContent) {
                        // Process headings
                        articleContent.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
                            const h = document.createElement(heading.tagName);
                            h.textContent = heading.textContent.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, '');
                            cleanContent.appendChild(h);
                        });
                        
                        // Process paragraphs and lists
                        articleContent.querySelectorAll('p, ul, ol').forEach(elem => {
                            if (elem.tagName === 'P') {
                                const p = document.createElement('p');
                                p.innerHTML = elem.innerHTML;
                                cleanContent.appendChild(p);
                            } else if (elem.tagName === 'UL' || elem.tagName === 'OL') {
                                const list = document.createElement(elem.tagName);
                                elem.querySelectorAll('li').forEach(li => {
                                    const newLi = document.createElement('li');
                                    newLi.innerHTML = li.innerHTML;
                                    list.appendChild(newLi);
                                });
                                cleanContent.appendChild(list);
                            }
                        });
                    }
                    
                    readmeContainer.innerHTML = '';
                    readmeContainer.appendChild(cleanContent);
                })
                .catch(() => {
                    readmeContainer.textContent = 'README not available.';
                });
        })
        .catch((err) => {
            console.warn('Repo fetch failed, showing fallback if available', err);
            clearDetailGrid();
            const container = document.createElement('div');
            container.className = 'project-expanded';
            const title = document.createElement('h3');
            title.textContent = fallback.title || repoFullName;
            const desc = document.createElement('p');
            desc.textContent = fallback.desc || 'Repository details are unavailable.';
            const links = document.createElement('div');
            links.className = 'project-links';
            const repoA = document.createElement('a');
            repoA.href = `https://github.com/${repoFullName}`;
            repoA.target = '_blank';
            repoA.rel = 'noopener noreferrer';
            repoA.textContent = 'View on GitHub';
            links.appendChild(repoA);
            const backBtn = document.createElement('button');
            backBtn.textContent = 'Back';
            backBtn.className = 'project-back';
            backBtn.addEventListener('click', () => openOverlay('projects'));
            container.appendChild(title);
            container.appendChild(desc);
            container.appendChild(links);
            container.appendChild(backBtn);
            detailGrid.appendChild(container);
        });
}

resumeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const type = btn.dataset.type;
        openOverlay(type);
    });
});

detailClose.addEventListener('click', closeOverlay);
overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
});

// Removed in-page token UI. If you want to load exact pinned repos automatically,
// set `window.GITHUB_TOKEN` in `config.js` (or provide it via server-side env injection)
// and the code below will attempt to load pinned repos on page load.

detailToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    detailPanel.classList.toggle('expanded');
});

// Best-effort automatic population for owner '8omz' without requiring a token.
// GitHub does not expose pinned items via REST without GraphQL auth, so we pick the user's top public repos instead.
async function autoPopulateOwnerRepos() {
    const owner = '8omz';
    debugLog('Auto-populating repos for owner:', owner);
    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        if (window && window.GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${window.GITHUB_TOKEN}`;
        }
        const res = await fetch(`https://api.github.com/users/${owner}/repos?per_page=100`, { headers });
        debugLog('REST repos response:', { status: res.status, ok: res.ok });
        if (!res.ok) throw new Error('Failed to fetch repos');
        const repos = await res.json();
        // sort by stargazers_count desc, then updated_at
        repos.sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.updated_at) - new Date(a.updated_at)));
        const chosen = repos.slice(0, 6);
        projectsConfig.length = 0;
        await Promise.all(chosen.map(async r => {
            const thumb = await fetchRepoThumbnail(r.owner.login, r.name);
            projectsConfig.push({
                repo: `${r.owner.login}/${r.name}`,
                title: r.name,
                desc: r.description || 'No description available.',
                thumb,
                stats: { stars: r.stargazers_count || 0, forks: r.forks_count || 0 }
            });
        }));
        console.info('Auto-populated projectsConfig with repos for', owner);
        // render preview tiles
        renderProjectsPreview();
    } catch (err) {
        console.error('Auto-populate failed', err);
    }
}

function renderProjectsPreview() {
    const detailGrid = document.getElementById('detailGrid');
    if (!detailGrid) {
        debugLog('detailGrid element not found');
        return;
    }
    
    // Clear container
    detailGrid.innerHTML = '';
    debugLog('Rendering projects preview, config:', projectsConfig);
    
    // Render projects in the detail grid
    projectsConfig.forEach((p) => {
        const detailTile = createTile(p.title || p.repo, p.desc || '', { 
            repo: p.repo, 
            thumb: p.thumb,
            thumbnail: p.thumb // Support both thumb and thumbnail properties
        });
        
        // Ensure proper sizing and visibility
        detailTile.style.minHeight = '200px';
        detailGrid.appendChild(detailTile);
    });
}

// Ensure reload always starts at top and overlay is closed
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

// Initialize projects - run this immediately and also on window load
async function initializeProjects() {
    debugLog('Initializing projects...');
    const cfgToken = (window && window.GITHUB_TOKEN) ? window.GITHUB_TOKEN : null;
    debugLog('Token status:', cfgToken ? 'present' : 'missing');
    
    try {
        if (cfgToken) {
            debugLog('Attempting to load pinned repos first...');
            const ok = await populatePinned('8omz', cfgToken);
            if (ok) {
                debugLog('Pinned repos loaded successfully');
                renderProjectsPreview();
                return;
            }
        }
        debugLog('Falling back to autoPopulateOwnerRepos');
        await autoPopulateOwnerRepos();
    } catch (err) {
        console.error('Project initialization failed:', err);
        debugLog('Error details:', err);
    }
}

// Run initialization immediately when DOM content is loaded
document.addEventListener('DOMContentLoaded', async () => {
    debugLog('DOM loaded, initializing projects...');
    try {
        await initializeProjects();
        // After projects are loaded, make sure they're visible
        const projectsPreview = document.getElementById('projectsPreview');
        if (projectsPreview) {
            projectsPreview.style.opacity = '1';
            projectsPreview.style.transform = 'none';
        }
    } catch (e) {
        debugLog('Error during initial load:', e);
    }
});

// Set up window load handler for any cleanup
window.addEventListener('load', () => {
    debugLog('Window loaded');
    window.scrollTo(0, 0);
    try { 
        closeOverlay();
    } catch (e) { 
        debugLog('Error during window.load:', e);
    }
});


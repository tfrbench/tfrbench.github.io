

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {

    // Load data from JSON file
    loadData();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add scroll-reveal animation
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(section);
    });

    // Add copy functionality to code blocks
    document.querySelectorAll('.code-block pre').forEach(block => {
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = 'Copy to clipboard';

        // Add button to code block
        const codeBlock = block.parentElement;
        codeBlock.style.position = 'relative';
        codeBlock.appendChild(copyButton);

        // Copy functionality
        copyButton.addEventListener('click', function() {
            const code = block.querySelector('code').textContent;
            navigator.clipboard.writeText(code).then(() => {
                copyButton.innerHTML = '<i class="fas fa-check"></i>';
                copyButton.style.backgroundColor = '#27ae60';

                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                    copyButton.style.backgroundColor = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        });
    });

    // Add citation copy button
    const citationBox = document.querySelector('.citation-box pre');
    if (citationBox) {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = 'Copy citation';

        const citationContainer = citationBox.parentElement;
        citationContainer.style.position = 'relative';
        citationContainer.appendChild(copyButton);

        copyButton.addEventListener('click', function() {
            const citation = citationBox.querySelector('code').textContent;
            navigator.clipboard.writeText(citation).then(() => {
                copyButton.innerHTML = '<i class="fas fa-check"></i>';
                copyButton.style.backgroundColor = '#27ae60';

                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                    copyButton.style.backgroundColor = '';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy citation:', err);
            });
        });
    }

    // Highlight external links
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.setAttribute('rel', 'noopener noreferrer');
    });

    // Add hover effect to dataset tags
    document.querySelectorAll('.dataset-tag').forEach(tag => {
        tag.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });

        tag.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Track active section in table of contents
    const sections = document.querySelectorAll('section[id]');
    const tocLinks = document.querySelectorAll('.toc-link');

    function updateActiveLink() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollTop >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }

    // Track scroll progress
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Update active TOC link
        updateActiveLink();

        // Add/remove shadow to header on scroll
        const header = document.querySelector('header');
        if (scrollTop > 100) {
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        } else {
            header.style.boxShadow = 'none';
        }
    }, false);

    // Initial active link update
    updateActiveLink();

});

// Load and populate data from JSON
async function loadData() {
    try {
        const response = await fetch('static/data.json');
        const data = await response.json();

        // Populate header
        populateHeader(data);

        // Populate abstract
        populateAbstract(data);

        // Populate features
        populateFeatures(data);

        // Populate tasks
        populateTasks(data);

        // Populate code examples
        populateCodeExamples(data);

        // Populate models
        populateModels(data);

        // Populate citation
        populateCitation(data);

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function populateHeader(data) {
    document.querySelector('.title').textContent = data.title;
    document.querySelector('.subtitle').textContent = data.subtitle;

    // Authors
    const authorsDiv = document.querySelector('.authors');
    authorsDiv.innerHTML = data.authors.map(author => {
        const affil = author.affiliations.join(',');
        const asterisk = author.equalContrib ? '*' : '';
        return `<span class="author">${author.name}<sup>${affil}${asterisk}</sup></span>`;
    }).join('');

    // Add equal contribution note if needed
    const hasEqualContrib = data.authors.some(a => a.equalContrib);
    if (hasEqualContrib) {
        const equalContribDiv = document.createElement('div');
        equalContribDiv.className = 'equal-contrib';
        equalContribDiv.innerHTML = '<sup>*</sup>Equal Contribution';
        authorsDiv.after(equalContribDiv);
    }

    // Affiliations
    const affiliationsDiv = document.querySelector('.affiliations');
    affiliationsDiv.innerHTML = data.affiliations.map(affil =>
        `<div class="affiliation"><sup>${affil.id}</sup>${affil.name}</div>`
    ).join('');

    // Links
    const linksDiv = document.querySelector('.links');
    linksDiv.innerHTML = data.links.map(link => {
        const comingSoon = link.comingSoon ? ' (Coming Soon)' : '';
        return `<a href="${link.url}" class="btn" target="_blank">
            <i class="${link.icon}"></i> ${link.text}${comingSoon}
        </a>`;
    }).join('');
}

function populateAbstract(data) {
    document.querySelector('.abstract').textContent = data.abstract;
}

function populateFeatures(data) {
    const featuresGrid = document.querySelector('.features-grid');
    featuresGrid.innerHTML = data.features.map(feature => `
        <div class="feature-card">
            <div class="feature-icon"><i class="${feature.icon}"></i></div>
            <h4>${feature.title}</h4>
            <p>${feature.description}</p>
        </div>
    `).join('');
}

function populateTasks(data) {
    const tasksSection = document.querySelector('#tasks');
    const tasksContainer = tasksSection.querySelectorAll('.task-section');

    // Clear existing tasks and rebuild
    tasksContainer.forEach(el => el.remove());

    const tasksHTML = data.tasks.map(task => `
        <div class="task-section">
            <h4><i class="${task.icon}"></i> ${task.name} (${task.count} datasets)</h4>
            <div class="dataset-list">
                ${task.datasets.map(ds => `<span class="dataset-tag">${ds}</span>`).join('')}
            </div>
        </div>
    `).join('');

    tasksSection.querySelector('h3').insertAdjacentHTML('afterend', tasksHTML);
}

function populateCodeExamples(data) {
    const quickStartSection = document.querySelector('#quickstart');
    const codeBlocks = quickStartSection.querySelectorAll('.code-block');

    // Clear existing
    codeBlocks.forEach(el => el.remove());

    const codeHTML = data.codeExamples.map(example => `
        <div class="code-block">
            <div class="code-header">${example.title}</div>
            <pre><code>${example.code}</code></pre>
        </div>
    `).join('');

    quickStartSection.querySelector('h3').insertAdjacentHTML('afterend', codeHTML);
}

function populateModels(data) {
    const modelsGrid = document.querySelector('.models-grid');
    modelsGrid.innerHTML = data.models.map(model => `
        <div class="model-category">
            <h4>${model.category}</h4>
            <ul>
                ${model.architectures.map(arch => `<li>${arch}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

function populateCitation(data) {
    const citationBox = document.querySelector('.citation-box pre code');
    citationBox.textContent = data.citation.bibtex;
}

// Add styles for copy button dynamically
const style = document.createElement('style');
style.textContent = `
    .copy-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
        z-index: 10;
    }

    .copy-btn:hover {
        background-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
    }

    .copy-btn:active {
        transform: scale(0.95);
    }

    .code-block {
        position: relative;
    }

    .citation-box {
        position: relative;
    }
`;
document.head.appendChild(style);

/**
 * Grep Generator for InDesign
 * Generates grep patterns for InDesign's Find/Change functionality
 */

interface GrepOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
}

/**
 * Escapes special regex characters for InDesign grep
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates grep pattern for specific words
 */
function generateWordsPattern(words: string[], options: GrepOptions): string {
  if (words.length === 0) return '';
  
  const escapedWords = words.map(word => escapeRegex(word.trim())).filter(w => w.length > 0);
  if (escapedWords.length === 0) return '';
  
  let pattern = escapedWords.join('|');
  
  if (options.wholeWord) {
    pattern = `\\b(${pattern})\\b`;
  } else {
    pattern = `(${pattern})`;
  }
  
  return pattern;
}

/**
 * Generates grep pattern for digits
 */
function generateDigitsPattern(min: number, max: number): string {
  if (min === max) {
    return `\\d{${min}}`;
  }
  return `\\d{${min},${max}}`;
}

/**
 * Generates grep pattern for punctuation
 */
function generatePunctuationPattern(type: string): string {
  const punctuationMap: Record<string, string> = {
    'all': '[\\.,;:?!\\-"\'()\\[\\]{}]',
    'period': '\\.',
    'comma': ',',
    'semicolon': ';',
    'colon': ':',
    'question': '\\?',
    'exclamation': '!',
    'quotes': '[""]',
    'apostrophe': "'",
    'hyphen': '-',
    'dash': '—',
    'parentheses': '[()]',
    'brackets': '[\\[\\]]',
    'braces': '[{}]'
  };
  
  return punctuationMap[type] || punctuationMap['all'];
}

/**
 * Generates grep pattern for content enclosed by markers
 */
function generateEnclosedPattern(startMarker: string, endMarker: string): string {
  const escapedStart = escapeRegex(startMarker);
  const escapedEnd = escapeRegex(endMarker);
  
  // Match any content between markers (non-greedy)
  return `${escapedStart}[^${escapedEnd}]*?${escapedEnd}`;
}

/**
 * Updates the grep pattern output
 */
function updateGrepPattern(): void {
  const searchType = (document.querySelector('input[name="searchType"]:checked') as HTMLInputElement)?.value || 'words';
  const caseSensitive = (document.getElementById('caseSensitive') as HTMLInputElement)?.checked || false;
  const wholeWord = (document.getElementById('wholeWord') as HTMLInputElement)?.checked || false;
  
  const options: GrepOptions = { caseSensitive, wholeWord };
  let pattern = '';
  let description = '';
  
  switch (searchType) {
    case 'words': {
      const wordsInput = (document.getElementById('wordsInput') as HTMLTextAreaElement)?.value || '';
      const words = wordsInput.split('\n').filter(w => w.trim().length > 0);
      pattern = generateWordsPattern(words, options);
      description = words.length > 0 
        ? `Matches ${words.length} word${words.length > 1 ? 's' : ''}`
        : 'Enter words to match';
      break;
    }
    
    case 'digits': {
      const min = parseInt((document.getElementById('digitsMin') as HTMLInputElement)?.value || '1', 10);
      const max = parseInt((document.getElementById('digitsMax') as HTMLInputElement)?.value || '10', 10);
      pattern = generateDigitsPattern(min, max);
      description = `Matches ${min === max ? min : `${min} to ${max}`} digit${max > 1 ? 's' : ''}`;
      break;
    }
    
    case 'punctuation': {
      const punctuationType = (document.getElementById('punctuationSelect') as HTMLSelectElement)?.value || 'all';
      pattern = generatePunctuationPattern(punctuationType);
      const typeNames: Record<string, string> = {
        'all': 'all punctuation',
        'period': 'periods',
        'comma': 'commas',
        'semicolon': 'semicolons',
        'colon': 'colons',
        'question': 'question marks',
        'exclamation': 'exclamation marks',
        'quotes': 'quotes',
        'apostrophe': 'apostrophes',
        'hyphen': 'hyphens',
        'dash': 'dashes',
        'parentheses': 'parentheses',
        'brackets': 'brackets',
        'braces': 'braces'
      };
      description = `Matches ${typeNames[punctuationType] || 'punctuation'}`;
      break;
    }
    
    case 'enclosed': {
      const startMarker = (document.getElementById('startMarker') as HTMLInputElement)?.value || '';
      const endMarker = (document.getElementById('endMarker') as HTMLInputElement)?.value || '';
      if (startMarker && endMarker) {
        pattern = generateEnclosedPattern(startMarker, endMarker);
        description = `Matches content between "${startMarker}" and "${endMarker}"`;
      } else {
        description = 'Enter start and end markers';
      }
      break;
    }
  }
  
  // Add case-insensitive flag if case sensitive is NOT selected
  // InDesign GREP: (?i) = case-insensitive, default is case-sensitive
  if (!caseSensitive && pattern) {
    pattern = `(?i)${pattern}`;
  }
  
  const output = document.getElementById('grepOutput');
  const syntaxExplanation = document.getElementById('syntaxExplanation');
  if (!output) return;
  
  if (pattern) {
    const caseNote = options.caseSensitive 
      ? '<p class="helper-text"><strong>Note:</strong> Enable "Case Sensitive" checkbox in InDesign paragraph style GREP Style settings</p>'
      : '<p class="helper-text"><strong>Note:</strong> Case insensitive (uncheck "Case Sensitive" in InDesign paragraph style GREP Style settings)</p>';
    
    // Create copy button with proper escaping
    const copyButton = document.createElement('button');
    copyButton.className = 'btn-copy';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(pattern).then(() => {
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy';
        }, 2000);
      });
    });
    
    const patternDiv = document.createElement('div');
    patternDiv.className = 'grep-pattern';
    patternDiv.innerHTML = `
      <label class="grep-label">Pattern:</label>
      <code class="grep-code">${escapeHtml(pattern)}</code>
    `;
    patternDiv.appendChild(copyButton);
    
    output.innerHTML = '';
    output.appendChild(patternDiv);
    
    // Add description and notes
    const descriptionP = document.createElement('p');
    descriptionP.className = 'helper-text';
    descriptionP.textContent = description;
    output.appendChild(descriptionP);
    
    const caseNoteP = document.createElement('p');
    caseNoteP.className = 'helper-text';
    caseNoteP.innerHTML = options.caseSensitive 
      ? '<strong>Note:</strong> Pattern is case-sensitive (default InDesign behavior)'
      : '<strong>Note:</strong> Pattern includes (?i) flag for case-insensitive matching';
    output.appendChild(caseNoteP);
    
    if (options.wholeWord) {
      const wholeWordP = document.createElement('p');
      wholeWordP.className = 'helper-text';
      wholeWordP.innerHTML = '<strong>Note:</strong> Pattern includes word boundaries (\\b) for whole word matching';
      output.appendChild(wholeWordP);
    }
    
    // Show syntax explanation when pattern is generated
    if (syntaxExplanation) {
      syntaxExplanation.style.display = 'block';
    }
  } else {
    output.innerHTML = `<p class="helper-text">${description}</p>`;
    // Hide syntax explanation when no pattern
    if (syntaxExplanation) {
      syntaxExplanation.style.display = 'none';
    }
  }
}

/**
 * Escapes HTML for safe display
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Shows/hides sections based on selected search type
 */
function updateSectionVisibility(): void {
  const searchType = (document.querySelector('input[name="searchType"]:checked') as HTMLInputElement)?.value || 'words';
  
  const sections = {
    words: document.getElementById('wordsSection'),
    digits: document.getElementById('digitsSection'),
    punctuation: document.getElementById('punctuationSection'),
    enclosed: document.getElementById('enclosedSection')
  };
  
  Object.keys(sections).forEach(key => {
    const section = sections[key as keyof typeof sections];
    if (section) {
      section.style.display = key === searchType ? 'block' : 'none';
    }
  });
}

/**
 * Shows the grep info modal
 */
function showGrepModal(): void {
  const modal = document.getElementById('grepModal');
  if (modal) {
    modal.classList.add('show');
  }
}

/**
 * Hides the grep info modal
 */
function hideGrepModal(): void {
  const modal = document.getElementById('grepModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

/**
 * Initializes the grep generator
 */
export function initializeGrep(): void {
  // Check if modal has been shown before
  const hasSeenModal = localStorage.getItem('grepModalShown');
  
  // Show modal on first visit
  if (!hasSeenModal) {
    setTimeout(() => {
      showGrepModal();
      localStorage.setItem('grepModalShown', 'true');
    }, 100);
  }
  
  // Modal close button
  const modalClose = document.getElementById('grepModalClose');
  if (modalClose) {
    modalClose.addEventListener('click', hideGrepModal);
  }
  
  // Close modal when clicking outside
  const modal = document.getElementById('grepModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideGrepModal();
      }
    });
  }
  
  // Show/hide sections based on search type
  const searchTypeInputs = document.querySelectorAll('input[name="searchType"]');
  searchTypeInputs.forEach(input => {
    input.addEventListener('change', () => {
      updateSectionVisibility();
      updateGrepPattern();
    });
  });
  
  // Update pattern on any input change
  const form = document.getElementById('grepForm');
  if (form) {
    form.addEventListener('input', updateGrepPattern);
    form.addEventListener('change', updateGrepPattern);
  }
  
  // Initial update
  updateSectionVisibility();
  updateGrepPattern();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGrep);
} else {
  initializeGrep();
}


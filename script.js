// --- Letter Definitions ---
const letters = {
    'A': [[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2],[3,0],[3,2]],
    'B': [[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2],[3,0],[3,2],[4,0],[4,1],[4,2]],
    'C': [[0,0],[1,0],[2,0],[3,0],[0,1],[0,2],[3,1],[3,2]],
    'D': [[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[1,1],[1,2],[2,2],[3,2],[3,1],[4,1]],
    'E': [[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[2,1],[4,1]],
    'F': [[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[0,2],[2,1]],
    'G': [[0,0],[0,1],[0,2],[0,3],[1,0],[2,0],[3,0],[4,0],[4,1],[4,2],[4,3],[3,3],[2,2],[2,3]],
    'H': [[0,0],[1,0],[2,0],[3,0],[4,0],[0,2],[1,2],[2,2],[3,2],[4,2],[2,1]],
    'I': [[0,0],[0,1],[0,2],[1,1],[2,1],[3,1],[4,0],[4,1],[4,2]],
    'J': [[0,2],[1,2],[2,2],[3,2],[4,0],[4,1],[4,2],[3,0]],
    'K': [[0,0],[1,0],[2,0],[3,0],[4,0],[0,2],[1,2],[3,2],[4,2],[1,1],[2,1],[3,1]],
    'L': [[0,0],[1,0],[2,0],[3,0],[4,0],[4,1],[4,2]],
    'M': [[0,0],[1,0],[2,0],[3,0],[0,4],[1,4],[2,4],[3,4],[0,1],[0,2],[0,3],[1,2],[2,2]],
    'N': [[0,0],[1,0],[2,0],[3,0],[4,0],[0,2],[1,2],[2,2],[3,2],[4,2],[0,1]],
    'O': [[0,0],[1,0],[2,0],[3,0],[4,0],[0,2],[1,2],[2,2],[3,2],[4,2],[0,1],[4,1]],
    'P': [[0,0],[1,0],[2,0],[3,0],[4,0],[0,1],[0,2],[0,3],[2,1],[2,2],[2,3],[1,3]],
    'Q': [[0,0],[1,0],[2,0],[0,1],[0,2],[1,2],[2,2],[2,1],[3,2]],
    'R': [[0,0],[1,0],[2,0],[3,0],[0,1],[0,2]],
    'S': [[0,0],[0,1],[0,2],[1,0],[2,0],[2,1],[2,2],[3,2],[4,0],[4,1],[4,2]],
    'T': [[0,0],[0,1],[0,2],[1,1],[2,1],[3,1],[4,1]],
    'U': [[0,0],[1,0],[2,0],[3,0],[0,2],[1,2],[2,2],[3,2],[4,0],[4,1],[4,2]],
    'V': [[0,0],[1,0],[2,0],[3,0],[0,1],[0,2],[0,3]],
    'X': [[0,2],[1,2],[2,0],[2,1],[2,2],[2,3],[2,4],[3,2],[4,2]],
    'W': [[0,0],[1,0],[2,0],[2,1],[2,2],[3,2],[4,2],[4,3],[4,4]],
    'Y': [[1,1],[2,1],[3,1],[4,1],[5,1],[1,0],[1,2],[0,0],[0,2]],
    'Z': [[0,0],[0,1],[0,2],[1,2],[2,2],[3,2],[3,3],[3,4]]
};

// Cache for consistent results
const solutionCache = new Map();
const colorMap = new Map();

// --- Fast Packing Algorithm ---
function fastPack(word, maxGrid = 20) {
    const cacheKey = word.toUpperCase();
    if (solutionCache.has(cacheKey)) {
        return JSON.parse(solutionCache.get(cacheKey));
    }

    const lettersToPlace = word.toUpperCase().split('').filter(c => letters[c]);
    if (lettersToPlace.length === 0) return null;

    // Calculate total cells and minimum requirements
    const totalCells = lettersToPlace.reduce((sum, c) => sum + letters[c].length, 0);
    const minSide = Math.ceil(Math.sqrt(totalCells));
    
    // Sort letters by size (largest first) for better packing
    const sortedLetters = [...lettersToPlace].sort((a, b) => 
        letters[b].length - letters[a].length
    );

    // Precompute all rotations for each letter
    const letterRotations = {};
    for (const char of sortedLetters) {
        letterRotations[char] = getAllRotations(letters[char]);
    }

    // Generate optimized grid sizes to try
    const gridSizes = generateOptimizedGridSizes(totalCells, maxGrid);
    
    let bestGrid = null;
    let bestArea = Infinity;

    for (const [width, height] of gridSizes) {
        if (width * height >= bestArea) continue;

        const grid = Array(height).fill(0).map(() => Array(width).fill(0));
        
        // Try deterministic placement first (fast)
        if (tryPlaceLettersDeterministic(grid, sortedLetters, letterRotations)) {
            const trimmed = trimGrid(grid);
            const area = trimmed.length * trimmed[0].length;
            
            if (area < bestArea) {
                bestGrid = trimmed;
                bestArea = area;
                
                // If we found a perfect packing, we're done
                if (bestArea === totalCells) break;
            }
            continue;
        }

        // Fall back to recursive search if deterministic fails (slower but more thorough)
        const recursiveGrid = Array(height).fill(0).map(() => Array(width).fill(0));
        if (tryPlaceLettersRecursive(recursiveGrid, sortedLetters, letterRotations)) {
            const trimmed = trimGrid(recursiveGrid);
            const area = trimmed.length * trimmed[0].length;
            
            if (area < bestArea) {
                bestGrid = trimmed;
                bestArea = area;
                
                if (bestArea === totalCells) break;
            }
        }
    }

    // Store in cache
    if (bestGrid) {
        solutionCache.set(cacheKey, JSON.stringify(bestGrid));
    }

    return bestGrid;
}

function generateOptimizedGridSizes(totalCells, maxGrid) {
    const sizes = new Set();
    const minSide = Math.ceil(Math.sqrt(totalCells));
    
    // 1. First try near-square sizes (±1 from square)
    for (let base = minSide; base <= minSide + 1; base++) {
        for (let offset = -1; offset <= 1; offset++) {
            const w = base + offset;
            const h = Math.max(minSide, Math.ceil(totalCells / w));
            if (w * h >= totalCells && w <= maxGrid && h <= maxGrid) {
                sizes.add(`${w}x${h}`);
                sizes.add(`${h}x${w}`);
            }
        }
    }

    // 2. Then try all reasonable aspect ratios (up to 2:1)
    for (let area = minSide * minSide; area <= (minSide + 2) * (minSide + 2); area++) {
        if (area < totalCells) continue;
        
        for (let w = minSide; w <= Math.min(maxGrid, Math.ceil(Math.sqrt(area * 2))); w++) {
            const h = Math.ceil(area / w);
            if (h > maxGrid) continue;
            
            if (Math.max(w/h, h/w) <= 2) {
                sizes.add(`${w}x${h}`);
            }
        }
    }

    // Sort with priority to: (1) smaller area, (2) more square-like
    return Array.from(sizes)
        .map(size => size.split('x').map(Number))
        .sort((a, b) => {
            const areaA = a[0] * a[1];
            const areaB = b[0] * b[1];
            return areaA - areaB || Math.abs(a[0]-a[1]) - Math.abs(b[0]-b[1]);
        });
}

function tryPlaceLettersDeterministic(grid, letters, rotationsCache) {
    const gridHeight = grid.length;
    const gridWidth = grid[0].length;
    
    for (const char of letters) {
        let placed = false;
        
        for (const shape of rotationsCache[char]) {
            const shapeHeight = Math.max(...shape.map(([y]) => y)) + 1;
            const shapeWidth = Math.max(...shape.map(([,x]) => x)) + 1;
            
            // Try all valid positions in order
            for (let y = 0; y <= gridHeight - shapeHeight; y++) {
                for (let x = 0; x <= gridWidth - shapeWidth; x++) {
                    if (canPlace(shape, grid, y, x)) {
                        placeLetter(shape, grid, y, x, char);
                        placed = true;
                        y = gridHeight; // Break outer loop
                        break;
                    }
                }
            }
            if (placed) break;
        }
        if (!placed) return false;
    }
    return true;
}

function tryPlaceLettersRecursive(grid, letters, rotationsCache, index = 0) {
    if (index >= letters.length) return true;
    
    const char = letters[index];
    const gridHeight = grid.length;
    const gridWidth = grid[0].length;
    
    for (const shape of rotationsCache[char]) {
        const shapeHeight = Math.max(...shape.map(([y]) => y)) + 1;
        const shapeWidth = Math.max(...shape.map(([,x]) => x)) + 1;
        
        // Try all valid positions in order
        for (let y = 0; y <= gridHeight - shapeHeight; y++) {
            for (let x = 0; x <= gridWidth - shapeWidth; x++) {
                if (canPlace(shape, grid, y, x)) {
                    placeLetter(shape, grid, y, x, char);
                    
                    if (tryPlaceLettersRecursive(grid, letters, rotationsCache, index + 1)) {
                        return true;
                    }
                    
                    removeLetter(shape, grid, y, x);
                }
            }
        }
    }
    
    return false;
}

// Helper functions
function getAllRotations(shape) {
    const rotations = [];
    let current = shape;
    
    for (let i = 0; i < 4; i++) {
        let minY = Math.min(...current.map(([y]) => y));
        let minX = Math.min(...current.map(([,x]) => x));
        let normalized = current.map(([y, x]) => [y - minY, x - minX]);
        
        // Check if this rotation is unique
        const isUnique = !rotations.some(r => 
            r.length === normalized.length &&
            r.every(([ry, rx], idx) => ry === normalized[idx][0] && rx === normalized[idx][1])
        );
        
        if (isUnique) {
            rotations.push(normalized);
        }
        
        // Rotate 90 degrees
        current = current.map(([y, x]) => [x, -y]);
    }
    
    return rotations;
}

function canPlace(shape, grid, y, x) {
    for (const [dy, dx] of shape) {
        const ny = y + dy, nx = x + dx;
        if (ny < 0 || nx < 0 || ny >= grid.length || nx >= grid[0].length) return false;
        if (grid[ny][nx] !== 0) return false;
    }
    return true;
}

function placeLetter(shape, grid, y, x, char) {
    for (const [dy, dx] of shape) {
        grid[y + dy][x + dx] = char;
    }
}

function removeLetter(shape, grid, y, x) {
    for (const [dy, dx] of shape) {
        grid[y + dy][x + dx] = 0;
    }
}

function trimGrid(grid) {
    let top = 0, bottom = grid.length - 1;
    while (top <= bottom && grid[top].every(cell => !cell)) top++;
    while (bottom >= top && grid[bottom].every(cell => !cell)) bottom--;
    let left = 0, right = grid[0].length - 1;
    while (left <= right && grid.every(row => !row[left])) left++;
    while (right >= left && grid.every(row => !row[right])) right--;
    return grid.slice(top, bottom + 1).map(row => row.slice(left, right + 1));
}

function getColor(char) {
    if (!colorMap.has(char)) {
        const hue = (360 * Math.random()) | 0;
        colorMap.set(char, `hsl(${hue}, 70%, 50%)`);
    }
    return colorMap.get(char);
}

// Rendering function
function renderGrid(grid) {
    const container = document.getElementById('gridContainer');
    container.innerHTML = '';
    let info = document.getElementById('gridInfo');
    if (info) info.remove();

    if (!grid) {
        container.textContent = 'No solution found.';
        return;
    }

    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    info = document.createElement('div');
    info.id = 'gridInfo';
    info.style.fontWeight = 'bold';
    info.style.marginBottom = '10px';
    info.textContent = `${cols} × ${rows} (area: ${cols * rows})`;
    container.parentNode.insertBefore(info, container);

    const cellSize = Math.min(500 / Math.max(cols, rows), 50);
    container.style.setProperty('--cell-size', `${cellSize}px`);
    container.style.setProperty('--grid-cols', cols);

    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid';
    gridDiv.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const char = grid[y][x];
            const cell = document.createElement('div');
            cell.className = 'grid-cell' + (char ? ' filled' : '');
            if (char) {
                cell.textContent = char;
                cell.style.backgroundColor = getColor(char);
            }
            gridDiv.appendChild(cell);
        }
    }
    container.appendChild(gridDiv);
}

function renderLetters(word) {
    const letterContainer = document.getElementById('letterContainer');
    letterContainer.innerHTML = '<h3>Letters to Place:</h3>';
    const lettersDiv = document.createElement('div');
    lettersDiv.className = 'letters-display';

    word.toUpperCase().split('').forEach(char => {
        if (letters[char]) {
            const letterBox = document.createElement('div');
            letterBox.className = 'letter-box';
            letterBox.style.backgroundColor = getColor(char);
            letterBox.textContent = char;
            lettersDiv.appendChild(letterBox);
        }
    });
    letterContainer.appendChild(lettersDiv);
}

function renderIndividualLetters(word) {
    const letterContainer = document.getElementById('letterContainer');
    letterContainer.innerHTML = '<h3>Letters to Place:</h3>';
    const lettersDiv = document.createElement('div');
    lettersDiv.className = 'letters-display';

    word.toUpperCase().split('').forEach(char => {
        if (letters[char]) {
            const letterBox = document.createElement('div');
            letterBox.className = 'letter-shape-container';
            
            // Add letter label
            const label = document.createElement('div');
            label.className = 'letter-label';
            label.textContent = char;
            letterBox.appendChild(label);
            
            // Get letter shape and calculate dimensions
            const letterPoints = letters[char];
            const maxY = Math.max(...letterPoints.map(([y]) => y)) + 1;
            const maxX = Math.max(...letterPoints.map(([,x]) => x)) + 1;
            
            // Create grid for single letter
            const gridDiv = document.createElement('div');
            gridDiv.className = 'letter-grid';
            gridDiv.style.gridTemplateColumns = `repeat(${maxX}, var(--cell-size))`;
            
            const letterColor = getColor(char);
            
            // Create all cells
            for (let y = 0; y < maxY; y++) {
                for (let x = 0; x < maxX; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'letter-cell';
                    if (letterPoints.some(([py, px]) => py === y && px === x)) {
                        cell.classList.add('filled');
                        cell.style.backgroundColor = letterColor;
                    }
                    gridDiv.appendChild(cell);
                }
            }
            
            letterBox.appendChild(gridDiv);
            lettersDiv.appendChild(letterBox);
        }
    });
    letterContainer.appendChild(lettersDiv);
}

function renderEmptyGrid(grid) {
    const container = document.getElementById('emptyGridContainer');
    container.innerHTML = '<h3>Empty Grid:</h3>';
    
    const rows = grid.length;
    const cols = grid[0].length;
    
    const gridDiv = document.createElement('div');
    gridDiv.className = 'empty-grid';
    gridDiv.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    
    // Set CSS variables for grid styling
    gridDiv.style.setProperty('--cols', cols);
    gridDiv.style.setProperty('--last-row', (rows * cols) - cols + 1);
    
    // Create cells
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell empty';
            gridDiv.appendChild(cell);
        }
    }
    
    container.appendChild(gridDiv);
}

function downloadPuzzle(word, grid) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const cellSize = 40;
    const gridGap = 1;
    const padding = 50;
    const letterSpacing = 30;
    
    // Calculate dimensions for letters
    const letterShapes = word.toUpperCase().split('')
        .map(char => letters[char])
        .filter(Boolean);
    
    const letterDimensions = letterShapes.map(shape => ({
        width: Math.max(...shape.map(([,x]) => x)) + 1,
        height: Math.max(...shape.map(([y]) => y)) + 1
    }));
    
    // Calculate canvas dimensions
    const totalLettersWidth = letterDimensions.reduce((sum, dim, i) => {
        const width = dim.width * cellSize;
        return sum + width + (i < letterDimensions.length - 1 ? letterSpacing : 0);
    }, 0);
    
    const maxLetterHeight = Math.max(...letterDimensions.map(dim => dim.height)) * cellSize;
    const gridWidth = grid[0].length * cellSize;
    const gridHeight = grid.length * cellSize;
    
    // Set canvas size
    canvas.width = Math.max(totalLettersWidth + (padding * 2), gridWidth + (padding * 2));
    canvas.height = maxLetterHeight + gridHeight + (padding * 4) + 60; // Extra space for titles
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw "Letters to Place:" title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Letters to Place:', canvas.width / 2, padding);
    
    // Draw individual letters with labels
    let xOffset = (canvas.width - totalLettersWidth) / 2;
    word.toUpperCase().split('').forEach((char, index) => {
        if (letters[char]) {
            // Draw letter label
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'black';
            ctx.fillText(char, xOffset + (letterDimensions[index].width * cellSize) / 2, padding + 40);
            
            const shape = letters[char];
            const letterColor = getColor(char);
            
            // Draw letter grid
            shape.forEach(([y, x]) => {
                ctx.fillStyle = letterColor;
                ctx.fillRect(
                    xOffset + (x * cellSize),
                    padding + 50 + (y * cellSize),
                    cellSize - 1,
                    cellSize - 1
                );
            });
            
            // Draw grid lines
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            for (let y = 0; y <= letterDimensions[index].height; y++) {
                for (let x = 0; x <= letterDimensions[index].width; x++) {
                    ctx.strokeRect(
                        xOffset + (x * cellSize),
                        padding + 50 + (y * cellSize),
                        cellSize,
                        cellSize
                    );
                }
            }
            
            xOffset += (letterDimensions[index].width * cellSize) + letterSpacing;
        }
    });
    
    // Draw "Empty Grid:" title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Empty Grid:', canvas.width / 2, padding * 3 + maxLetterHeight + 30);
    
    // Draw empty grid
    const gridY = padding * 3 + maxLetterHeight + 60;
    const gridXOffset = (canvas.width - (gridWidth + gridGap * (grid[0].length + 1))) / 2;
    
    // Draw grid background (creates gaps)
    ctx.fillStyle = 'black';
    ctx.fillRect(
        gridXOffset,
        gridY,
        gridWidth + gridGap * (grid[0].length + 1),
        gridHeight + gridGap * (grid.length + 1)
    );
    
    // Draw white cells
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            ctx.fillStyle = 'white';
            ctx.fillRect(
                gridXOffset + gridGap + (x * (cellSize + gridGap)),
                gridY + gridGap + (y * (cellSize + gridGap)),
                cellSize,
                cellSize
            );
        }
    }
    
    // Draw grid lines
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            ctx.strokeRect(
                gridXOffset + gridGap + (x * (cellSize + gridGap)),
                gridY + gridGap + (y * (cellSize + gridGap)),
                cellSize,
                cellSize
            );
        }
    }
    
    // Create download link
    const link = document.createElement('a');
    link.download = 'puzzle.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Event listener
document.getElementById('generateBtn').addEventListener('click', () => {
    colorMap.clear();
    const btn = document.getElementById('generateBtn');
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
        const word = document.getElementById('wordInput').value.trim();
        const grid = fastPack(word);
        
        if (grid) {
            renderIndividualLetters(word);  // Changed from renderLetters to renderIndividualLetters
            renderEmptyGrid(grid);
            renderGrid(grid);
            document.getElementById('gridContainer').classList.add('hidden');
            document.getElementById('downloadBtn').style.display = 'inline-block';
            document.getElementById('toggleSolutionBtn').style.display = 'inline-block';
        } else {
            document.getElementById('letterContainer').innerHTML = 'No solution found.';
            document.getElementById('emptyGridContainer').innerHTML = '';
            document.getElementById('gridContainer').innerHTML = '';
        }
        
        btn.classList.remove('loading');
        btn.disabled = false;
    }, 10);
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    const word = document.getElementById('wordInput').value.trim();
    const grid = fastPack(word);
    if (grid) {
        downloadPuzzle(word, grid);
    }
});

document.getElementById('toggleSolutionBtn').addEventListener('click', () => {
    const gridContainer = document.getElementById('gridContainer');
    const btn = document.getElementById('toggleSolutionBtn');
    
    if (gridContainer.classList.contains('hidden')) {
        gridContainer.classList.remove('hidden');
        btn.textContent = 'Hide Solution';
    } else {
        gridContainer.classList.add('hidden');
        btn.textContent = 'View Solution';
    }
});

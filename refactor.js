const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'games');

const getGameNameFromFileName = (fileName) => {
    return fileName.split('.')[0];
};

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    files.forEach((file) => {
        if (!file.endsWith('.jsx')) return;
        if (file === 'NBackGame.jsx' || file === 'StroopGame.jsx') return; // Handled

        const filePath = path.join(directoryPath, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        const gameName = getGameNameFromFileName(file);
        
        // 1. Rename App to GameName and add onComplete prop
        content = content.replace(/export default function App\(\)\s*\{/g, `export default function ${gameName}({ onComplete }) {`);
        
        // 2. Change min-h-screen to h-full w-full and add no-scrollbar
        content = content.replace(/min-h-screen /g, 'h-full w-full overflow-y-auto no-scrollbar pb-16 ');

        // 3. Optional: we can't reliably inject `onComplete(score, stats)` into `stopGame` or `endGame` 
        // without parsing AST. But we can just replace `setGameOver(true);` with 
        // `setGameOver(true); if (onComplete) { onComplete(score !== undefined ? score : 0, typeof stats !== 'undefined' ? stats : {}); }`
        // Or we can just let it show the Game Over screen, and add a "Submit Score" button to the game over screens?
        // Let's inject a generic call to onComplete if setGameOver(true) is called.
        // Wait, score might not be in scope if setGameOver is inside a useCallback without score as dep.
        // To be safe, let's just add an effect that watches gameOver.
        
        // Let's inject an effect at the top of the component:
        const effectCode = `
  useEffect(() => {
    if (gameOver && onComplete) {
      // Small delay to allow state to settle
      const t = setTimeout(() => {
        onComplete(typeof score !== 'undefined' ? score : 0, typeof stats !== 'undefined' ? stats : {});
      }, 500);
      return () => clearTimeout(t);
    }
  }, [gameOver, onComplete]);
`;      
        // Find where the first state is declared and insert
        if (!content.includes('useEffect(() => { if (gameOver && onComplete)')) {
            content = content.replace(/(const \[gameOver, setGameOver\] = useState\(false\);)/g, `$1\n${effectCode}`);
            // If it doesn't have gameOver state directly string matched:
        }

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Refactored ${file}`);
    });
});

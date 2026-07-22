const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  '  const [isAssistantMode, setIsAssistantMode] = useState<boolean | null>(null);',
  `  const [isAssistantMode, setIsAssistantMode] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAssistantMode) {
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
    } else {
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    }
  }, [isAssistantMode]);`
);
fs.writeFileSync('src/App.tsx', content);

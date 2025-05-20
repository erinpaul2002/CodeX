'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Editor as MonacoEditor, useMonaco } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
import styles from '../styles/Editor.module.css';

interface EditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: string;
}

export function Editor({ value, onChange, language }: EditorProps) {
  const monaco = useMonaco();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  // Sample code templates for different languages
  const getTemplateForLanguage = (lang: string): string => {
    switch (lang) {
      case 'javascript':
        return '// JavaScript code\nconsole.log("Hello, World!");\n';
      case 'python':
        return '# Python code\nprint("Hello, World!")\n';
      case 'java':
        return '// Java code\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n';
      case 'cpp':
        return '// C++ code\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n';
      case 'typescript':
        return '// TypeScript code\nfunction greet(name: string): void {\n    console.log(`Hello, ${name}!`);\n}\n\ngreet("World");\n';
      case 'csharp':
        return '// C# code\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}\n';
      case 'go':
        return '// Go code\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n';
      case 'rust':
        return '// Rust code\nfn main() {\n    println!("Hello, World!");\n}\n';
      case 'ruby':
        return '# Ruby code\nputs "Hello, World!"\n';
      case 'php':
        return '<?php\n// PHP code\necho "Hello, World!";\n?>\n';
      default:
        return '// Write your code here\n';
    }
  };
  // Track previous language to detect changes
  const [prevLanguage, setPrevLanguage] = useState(language);
    // Configure Monaco for different languages
  useEffect(() => {
    if (monaco) {
      // Configure TypeScript/JavaScript IntelliSense
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        typeRoots: ["node_modules/@types"],
        jsx: monaco.languages.typescript.JsxEmit.React,
        allowJs: true,
        esModuleInterop: true,
      });
      
      // Configure TypeScript
      monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        typeRoots: ["node_modules/@types"],
        jsx: monaco.languages.typescript.JsxEmit.React,
        esModuleInterop: true,
      });
      
      // Helper function to create CompletionItem with proper range
      const createCompletionProvider = (languageId: string, suggestions: Partial<Monaco.languages.CompletionItem>[]) => {
        monaco.languages.registerCompletionItemProvider(languageId, {
          provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn
            };
            
            return {
              suggestions: suggestions.map(item => ({
                ...item,
                range
              })) as Monaco.languages.CompletionItem[]
            };
          }
        });
      };
      
      // Python completions
      createCompletionProvider('python', [
        {
          label: 'print',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'print(${1:value})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print a value to the console',
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'if ${1:condition}:\n\t${2:pass}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If statement',
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For loop',
        },
        {
          label: 'def',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'def ${1:function_name}(${2:parameters}):\n\t${3:pass}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define a function',
        },
        {
          label: 'class',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'class ${1:ClassName}:\n\tdef __init__(self, ${2:parameters}):\n\t\t${3:pass}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Define a class',
        }
      ]);
      
      // Java completions
      createCompletionProvider('java', [
        {
          label: 'sout',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'System.out.println(${1:message});',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print to standard output',
        },
        {
          label: 'main',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'public static void main(String[] args) {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Main method',
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'if (${1:condition}) {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If statement',
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:max}; ${1:i}++) {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For loop',
        },
        {
          label: 'class',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'public class ${1:ClassName} {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Class definition',
        }
      ]);
      
      // C++ completions
      createCompletionProvider('cpp', [
        {
          label: 'cout',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'std::cout << ${1:message} << std::endl;',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print to standard output',
        },
        {
          label: 'main',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'int main() {\n\t${0}\n\treturn 0;\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Main function',
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'if (${1:condition}) {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If statement',
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:max}; ${1:i}++) {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For loop',
        },
        {
          label: 'class',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'class ${1:ClassName} {\npublic:\n\t${0}\n};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Class definition',
        }
      ]);
      
      // C# completions
      createCompletionProvider('csharp', [
        {
          label: 'cw',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'Console.WriteLine(${1:message});',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print to standard output',
        },
        {
          label: 'main',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'static void Main(string[] args) {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Main method',
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'if (${1:condition}) {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If statement',
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:max}; ${1:i}++) {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For loop',
        },
        {
          label: 'class',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'public class ${1:ClassName} {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Class definition',
        }
      ]);
      
      // Go completions
      createCompletionProvider('go', [
        {
          label: 'fmt.Println',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'fmt.Println(${1:message})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print to standard output',
        },
        {
          label: 'main',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'func main() {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Main function',
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'if ${1:condition} {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If statement',
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'for ${1:i} := 0; ${1:i} < ${2:max}; ${1:i}++ {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For loop',
        },
        {
          label: 'struct',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'type ${1:Name} struct {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Struct definition',
        }
      ]);
      
      // Rust completions
      createCompletionProvider('rust', [
        {
          label: 'println',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'println!(${1:"${2:message}"});',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print to standard output',
        },
        {
          label: 'main',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'fn main() {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Main function',
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'if ${1:condition} {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If statement',
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'for ${1:item} in ${2:iterable} {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For loop',
        },
        {
          label: 'struct',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'struct ${1:Name} {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Struct definition',
        }
      ]);
      
      // Ruby completions
      createCompletionProvider('ruby', [
        {
          label: 'puts',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'puts ${1:message}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print to standard output',
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'if ${1:condition}\n\t${0}\nend',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If statement',
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'for ${1:item} in ${2:iterable}\n\t${0}\nend',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For loop',
        },
        {
          label: 'class',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'class ${1:Name}\n\t${0}\nend',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Class definition',
        },
        {
          label: 'def',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'def ${1:method_name}\n\t${0}\nend',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Method definition',
        }
      ]);
      
      // PHP completions
      createCompletionProvider('php', [
        {
          label: 'echo',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'echo ${1:message};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Print to output',
        },
        {
          label: 'if',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'if (${1:condition}) {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If statement',
        },
        {
          label: 'for',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'for (\\$${1:i} = 0; \\$${1:i} < ${2:max}; \\$${1:i}++) {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'For loop',
        },
        {
          label: 'class',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'class ${1:Name} {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Class definition',
        },
        {
          label: 'function',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'function ${1:name}(${2:parameters}) {\n\t${0}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Function definition',
        }
      ]);
    }
  }, [monaco]);
  
  // Handle editor ref
  const handleEditorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };
  
  // Update code when language changes
  useEffect(() => {
    // Only suggest a template change when language has changed
    if (prevLanguage !== language) {
      // Check if code seems to be a default template or empty
      const isDefaultLookingCode = 
        !value || 
        value.trim() === '' || 
        value.includes('// Write your code here') ||
        value.includes('// JavaScript code') ||
        value.includes('# Python code') ||
        value.includes('// Java code') ||
        value.includes('// C++ code') ||
        value.includes('// TypeScript code') ||
        value.includes('// C# code') ||
        value.includes('// Go code') ||
        value.includes('// Rust code') ||
        value.includes('# Ruby code') ||
        value.includes('// PHP code');
      
      if (isDefaultLookingCode) {
        onChange(getTemplateForLanguage(language));
      }
      
      setPrevLanguage(language);
    }
  }, [language, value, onChange, prevLanguage]);
  return (
    <div className={`${styles.editorContainer} ${styles.editorWrapper}`}>
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { 
            enabled: true, 
            scale: 0.75,
            renderCharacters: false,
            showSlider: 'mouseover',
            maxColumn: 80
          },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', 'Source Code Pro', Menlo, monospace",
          fontLigatures: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          showUnused: false,
          tabSize: 2,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 16 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: true,
            verticalHasArrows: false,
            horizontalHasArrows: false
          },
          glyphMargin: false,
          bracketPairColorization: {
            enabled: true
          },
          guides: {
            bracketPairs: 'active',
            indentation: true
          },
          renderLineHighlight: 'all',
          roundedSelection: true,
          wordWrap: 'off',
          suggestOnTriggerCharacters: true,
          quickSuggestions: true
        }}
        theme="vs-dark"
      />
    </div>
  );
}

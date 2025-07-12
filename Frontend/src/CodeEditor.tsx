import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onRun?: () => void;
}

export default function CodeEditor({ code, onChange, onRun }: CodeEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className="container my-4">
      <h3>Terraform Code</h3>

      <Editor
        height="400px"
        language="hcl"
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: 'on',
        }}
      />

    </div>
  );
}

interface TerraformPreviewProps {
  output: string;
  stage: string;
}

export default function TerraformPreview({ output, stage }: TerraformPreviewProps) {
  if (!output) return null;

  const text = () => {
    let result = 'Terraform '
    if (stage == 'NONE') {
      result += 'Preview'
    } else if (stage == 'PREVIEW') {
      result += 'Apply'
    } else if (stage == 'APPLY') {
      result += 'Destroy'
    }
    return result
  }

  return (
    <div className="container my-4">
      <h4>{text()}</h4>
      <div
        style={{
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          fontFamily: 'monospace',
          padding: '1rem',
          borderRadius: '8px',
          whiteSpace: 'pre-wrap',
          overflowX: 'auto',
          maxHeight: '600px',
        }}
      >
        {output}
      </div>
    </div>
  );
}